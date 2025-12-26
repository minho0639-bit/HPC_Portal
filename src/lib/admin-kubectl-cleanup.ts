"use server";

import { Client, ConnectConfig } from "ssh2";
import { promises as fs } from "fs";

import type { StoredNode } from "./admin-node-types";
import { getStoredNode } from "./admin-node-store";

let cachedPrivateKey: Buffer | null | undefined;

async function resolvePrivateKey(): Promise<Buffer | undefined> {
  if (cachedPrivateKey !== undefined) {
    return cachedPrivateKey === null ? undefined : cachedPrivateKey;
  }

  const inlineKey = process.env.NODE_MONITOR_SSH_KEY;
  if (inlineKey) {
    cachedPrivateKey = Buffer.from(inlineKey.replace(/\\n/g, "\n"), "utf-8");
    return cachedPrivateKey;
  }

  const keyPath = process.env.NODE_MONITOR_SSH_KEY_PATH;
  if (!keyPath) {
    cachedPrivateKey = null;
    return undefined;
  }

  try {
    const key = await fs.readFile(keyPath);
    cachedPrivateKey = key;
    return key;
  } catch (error) {
    console.error("[kubectl-cleanup] SSH private key 읽기 실패:", error);
    cachedPrivateKey = null;
    return undefined;
  }
}

function buildSshConfig(node: StoredNode, privateKey?: Buffer): ConnectConfig {
  const username =
    node.sshUser ??
    process.env.NODE_MONITOR_DEFAULT_SSH_USER ??
    process.env.USER;

  if (!username) {
    throw new Error("SSH 사용자 정보가 필요합니다.");
  }

  const port =
    node.sshPort ??
    Number.parseInt(process.env.NODE_MONITOR_DEFAULT_SSH_PORT ?? "22", 10);

  const password = process.env.NODE_MONITOR_SSH_PASSWORD;
  const passphrase = process.env.NODE_MONITOR_SSH_KEY_PASSPHRASE;

  if (!privateKey && !password) {
    throw new Error("SSH 접속을 위한 비밀키 또는 비밀번호가 필요합니다.");
  }

  const config: ConnectConfig = {
    host: node.ipAddress,
    port: Number.isFinite(port) ? port : 22,
    username,
    readyTimeout: 12_000,
  };

  if (privateKey) {
    config.privateKey = privateKey;
    if (passphrase) {
      config.passphrase = passphrase;
    }
  }

  if (password) {
    config.password = password;
  }

  return config;
}

function withSshConnection<T>(
  config: ConnectConfig,
  handler: (conn: Client) => Promise<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let settled = false;

    conn
      .on("ready", async () => {
        try {
          const result = await handler(conn);
          if (!settled) {
            settled = true;
            resolve(result);
          }
        } catch (error) {
          if (!settled) {
            settled = true;
            reject(error);
          }
        } finally {
          conn.end();
        }
      })
      .on("error", (error) => {
        if (!settled) {
          settled = true;
          reject(error);
        }
      })
      .on("timeout", () => {
        if (!settled) {
          settled = true;
          reject(new Error("SSH 연결 시간 초과"));
        }
      })
      .connect(config);
  });
}

function execCommand(conn: Client, command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err: Error | undefined, stream: any) => {
      if (err) {
        reject(err);
        return;
      }

      let stdout = "";
      let stderr = "";

      stream
        .on("close", (code: number) => {
          if (code !== 0 && stderr) {
            reject(new Error(stderr.trim() || `명령 실행 실패: ${command}`));
            return;
          }
          resolve(stdout.trim());
        })
        .on("data", (data: Buffer) => {
          stdout += data.toString();
        })
        .stderr.on("data", (data: Buffer) => {
          stderr += data.toString();
        });
    });
  });
}

/**
 * Pod를 삭제합니다
 */
export async function deletePod(input: {
  nodeId: string;
  namespace: string;
  podName: string;
}): Promise<void> {
  const { nodeId, namespace, podName } = input;

  const node = await getStoredNode(nodeId);
  if (!node) {
    throw new Error("노드를 찾을 수 없습니다.");
  }

  const privateKey = await resolvePrivateKey();
  const config = buildSshConfig(node, privateKey);

  return withSshConnection(config, async (conn) => {
    try {
      console.log(`[kubectl-cleanup] Pod 삭제 시작: ${podName} (네임스페이스: ${namespace})`);
      
      // Pod 삭제 (리소스 타입 명시)
      const deleteOutput = await execCommand(
        conn,
        `kubectl delete pod ${podName} -n ${namespace} 2>&1 || echo ''`
      );
      console.log(`[kubectl-cleanup] Pod 삭제 결과: ${deleteOutput}`);
      
      console.log(`[kubectl-cleanup] Pod 삭제 완료: ${podName}`);
    } catch (error) {
      console.error("[kubectl-cleanup] Pod 삭제 실패:", error);
      throw new Error(
        `Pod 삭제 실패: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
}

/**
 * Deployment와 관련 리소스를 모두 삭제합니다
 */
export async function deleteDeployment(input: {
  nodeId: string;
  namespace: string;
  deploymentName: string;
}): Promise<void> {
  const { nodeId, namespace, deploymentName } = input;

  const node = await getStoredNode(nodeId);
  if (!node) {
    throw new Error("노드를 찾을 수 없습니다.");
  }

  const privateKey = await resolvePrivateKey();
  const config = buildSshConfig(node, privateKey);

  return withSshConnection(config, async (conn) => {
    try {
      console.log(`[kubectl-cleanup] Deployment 삭제 시작: ${deploymentName} (네임스페이스: ${namespace})`);
      
      // Service 삭제 (Service 이름 형식: svc-{deploymentName without deploy- prefix})
      const serviceName = `svc-${deploymentName.replace(/^deploy-/, "")}`;
      try {
        const deleteServiceOutput = await execCommand(
          conn,
          `kubectl delete service ${serviceName} -n ${namespace} 2>&1 || echo ''`
        );
        console.log(`[kubectl-cleanup] Service 삭제 결과: ${deleteServiceOutput}`);
      } catch (e) {
        console.warn(`[kubectl-cleanup] Service 삭제 실패 (무시):`, e);
      }
      
      // Deployment 삭제
      const deleteDeploymentOutput = await execCommand(
        conn,
        `kubectl delete deployment ${deploymentName} -n ${namespace} 2>&1 || echo ''`
      );
      console.log(`[kubectl-cleanup] Deployment 삭제 결과: ${deleteDeploymentOutput}`);
      
      console.log(`[kubectl-cleanup] Deployment 삭제 완료: ${deploymentName}`);
    } catch (error) {
      console.error("[kubectl-cleanup] Deployment 삭제 실패:", error);
      throw new Error(
        `Deployment 삭제 실패: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
}

/**
 * 네임스페이스를 삭제합니다 (모든 리소스 포함)
 */
export async function deleteNamespace(input: {
  nodeId: string;
  namespace: string;
}): Promise<void> {
  const { nodeId, namespace } = input;

  const node = await getStoredNode(nodeId);
  if (!node) {
    throw new Error("노드를 찾을 수 없습니다.");
  }

  const privateKey = await resolvePrivateKey();
  const config = buildSshConfig(node, privateKey);

  return withSshConnection(config, async (conn) => {
    try {
      console.log(`[kubectl-cleanup] 네임스페이스 삭제 시작: ${namespace}`);
      
      // 네임스페이스 삭제 (모든 리소스 포함)
      const deleteOutput = await execCommand(
        conn,
        `kubectl delete namespace ${namespace} 2>&1 || echo ''`
      );
      console.log(`[kubectl-cleanup] 네임스페이스 삭제 결과: ${deleteOutput}`);
      
      console.log(`[kubectl-cleanup] 네임스페이스 삭제 완료: ${namespace}`);
    } catch (error) {
      console.error("[kubectl-cleanup] 네임스페이스 삭제 실패:", error);
      throw new Error(
        `네임스페이스 삭제 실패: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
}

/**
 * Pod의 Pending 원인을 분석합니다
 */
export async function diagnosePendingPod(input: {
  nodeId: string;
  namespace: string;
  podName: string;
}): Promise<{
  reason: string;
  message: string;
  events: string;
  podDetails: string;
}> {
  const { nodeId, namespace, podName } = input;

  const node = await getStoredNode(nodeId);
  if (!node) {
    throw new Error("노드를 찾을 수 없습니다.");
  }

  const privateKey = await resolvePrivateKey();
  const config = buildSshConfig(node, privateKey);

  return withSshConnection(config, async (conn) => {
    try {
      console.log(`[kubectl-cleanup] Pending Pod 진단 시작: ${podName}`);
      
      // Pod 상세 정보 조회
      const podJson = await execCommand(
        conn,
        `kubectl get pod ${podName} -n ${namespace} -o json 2>&1 || echo '{}'`
      );
      
      // Pod 이벤트 조회
      const events = await execCommand(
        conn,
        `kubectl get events -n ${namespace} --field-selector involvedObject.name=${podName} --sort-by='.lastTimestamp' 2>&1 || echo ''`
      );
      
      // Pod describe 조회
      const podDescribe = await execCommand(
        conn,
        `kubectl describe pod ${podName} -n ${namespace} 2>&1 || echo ''`
      );
      
      // Pending 원인 추출
      let reason = "Unknown";
      let message = "원인을 파악할 수 없습니다.";
      
      if (podJson.includes("Unschedulable") || podDescribe.includes("Unschedulable")) {
        reason = "Unschedulable";
        message = "Pod를 스케줄할 수 없습니다. 노드 리소스 부족 또는 노드 선택기 문제일 수 있습니다.";
      } else if (podDescribe.includes("ImagePullBackOff") || podDescribe.includes("ErrImagePull")) {
        reason = "ImagePullError";
        message = "컨테이너 이미지를 가져올 수 없습니다. 이미지 이름이나 레지스트리 접근 권한을 확인하세요.";
      } else if (podDescribe.includes("CreateContainerConfigError")) {
        reason = "ContainerConfigError";
        message = "컨테이너 설정 오류가 있습니다. ConfigMap 또는 Secret을 확인하세요.";
      } else if (podDescribe.includes("Insufficient")) {
        reason = "InsufficientResources";
        message = "노드에 충분한 리소스가 없습니다. CPU, 메모리, 또는 GPU 리소스를 확인하세요.";
      }
      
      return {
        reason,
        message,
        events,
        podDetails: podDescribe,
      };
    } catch (error) {
      console.error("[kubectl-cleanup] Pod 진단 실패:", error);
      throw new Error(
        `Pod 진단 실패: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
}

