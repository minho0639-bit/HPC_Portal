"use server";

import { Client, ConnectConfig } from "ssh2";
import { promises as fs } from "fs";
import { randomBytes } from "crypto";

import type { StoredNode } from "./admin-node-types";
import { getStoredNode } from "./admin-node-store";

export interface DeploymentResult {
  podName: string;
  deploymentName: string;
  serviceName: string;
  servicePort: number;
  accessHost: string;
  accessPort: number;
  accessUrl: string;
  rootPassword: string;
}

/**
 * 안전한 랜덤 비밀번호 생성 (12자리)
 */
function generateRandomPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(12);
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

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
    console.error("[kubectl-deploy] SSH private key 읽기 실패:", error);
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
 * 사용 가능한 NodePort를 찾습니다 (30000-32767 범위)
 */
async function findAvailableNodePort(conn: Client, startPort: number = 30000): Promise<number> {
  try {
    const usedPorts = new Set<number>();
    
    // Service의 NodePort 확인
    try {
      const servicePorts = await execCommand(
        conn,
        "kubectl get services -A -o jsonpath='{.items[*].spec.ports[*].nodePort}' 2>/dev/null || echo ''"
      );
      if (servicePorts.trim()) {
        servicePorts.trim().split(/\s+/).forEach((portStr) => {
          const port = Number.parseInt(portStr, 10);
          if (Number.isFinite(port) && port >= 30000 && port <= 32767) {
            usedPorts.add(port);
          }
        });
      }
    } catch (e) {
      console.warn("[kubectl-deploy] Service NodePort 확인 실패:", e);
    }
    
    console.log(`[kubectl-deploy] 사용 중인 NodePort: ${Array.from(usedPorts).sort((a, b) => a - b).join(", ") || "없음"}`);

    // 사용 가능한 포트 찾기
    for (let port = startPort; port <= 32767; port++) {
      if (!usedPorts.has(port)) {
        console.log(`[kubectl-deploy] 사용 가능한 NodePort 발견: ${port}`);
        return port;
      }
    }

    // 모든 포트가 사용 중이면 랜덤 포트 반환
    const randomPort = Math.floor(Math.random() * 2768) + 30000;
    console.warn(`[kubectl-deploy] 모든 포트가 사용 중이어서 랜덤 포트 사용: ${randomPort}`);
    return randomPort;
  } catch (error) {
    console.warn("[kubectl-deploy] 포트 확인 실패, 기본 포트 사용:", error);
    return startPort;
  }
}

/**
 * 사용 가능한 포트를 찾습니다 (30000-32767 범위의 NodePort) - 하위 호환성
 */
async function findAvailablePort(conn: Client, startPort: number = 30000): Promise<number> {
  return findAvailableNodePort(conn, startPort);
}

/**
 * kubectl을 통해 컨테이너를 배포합니다
 */
export async function deployContainerWithKubectl(input: {
  nodeId: string;
  namespace: string;
  containerImage: string;
  deploymentName: string;
  cpuCores: number;
  gpuCount: number;
  memoryGb: number;
  storageGb: number;
}): Promise<DeploymentResult> {
  const { nodeId, namespace, containerImage, deploymentName, cpuCores, gpuCount, memoryGb } = input;

  const node = await getStoredNode(nodeId);
  if (!node) {
    throw new Error("노드를 찾을 수 없습니다.");
  }

  const privateKey = await resolvePrivateKey();
  const config = buildSshConfig(node, privateKey);

  return withSshConnection(config, async (conn) => {
    try {
      console.log(`[kubectl-deploy] ===== 배포 시작 =====`);
      console.log(`[kubectl-deploy] 노드: ${node.name} (${node.ipAddress})`);
      console.log(`[kubectl-deploy] 네임스페이스: ${namespace}`);
      console.log(`[kubectl-deploy] 이미지: ${containerImage}`);
      console.log(`[kubectl-deploy] Deployment 이름: ${deploymentName}`);
      
      // 1. 네임스페이스 생성
      console.log(`[kubectl-deploy] [1/6] 네임스페이스 생성 시작: ${namespace}`);
      try {
        const nsOutput = await execCommand(
          conn,
          `kubectl create namespace ${namespace} --dry-run=client -o yaml | kubectl apply -f - 2>&1`
        );
        console.log(`[kubectl-deploy] 네임스페이스 생성 결과: ${nsOutput}`);
      } catch (error) {
        // 네임스페이스가 이미 존재할 수 있음
        console.log(`[kubectl-deploy] 네임스페이스가 이미 존재하거나 생성 확인 중: ${namespace}`);
        try {
          const checkNs = await execCommand(conn, `kubectl get namespace ${namespace} 2>&1`);
          console.log(`[kubectl-deploy] 네임스페이스 확인: ${checkNs}`);
        } catch (e) {
          console.warn(`[kubectl-deploy] 네임스페이스 확인 실패:`, e);
        }
      }

      // 2. 리소스 제한 계산 (메모리는 Mi 단위, CPU는 millicores)
      const memoryMi = Math.ceil(memoryGb * 1024);
      const cpuMilli = Math.ceil(cpuCores * 1000);
      console.log(`[kubectl-deploy] [2/6] 리소스 계산 완료: CPU=${cpuMilli}m, Memory=${memoryMi}Mi, GPU=${gpuCount}`);

      // 2.5. root 비밀번호 생성
      const rootPassword = generateRandomPassword();
      console.log(`[kubectl-deploy] [2.5/6] root 비밀번호 생성 완료`);

      // 3. Deployment 생성
      console.log(`[kubectl-deploy] [3/6] Deployment YAML 생성 시작`);
      // YAML에서 namespace와 name이 숫자로 시작할 수 있으므로 따옴표로 감싸기
      const safeNamespace = JSON.stringify(namespace);
      const safeDeploymentName = JSON.stringify(deploymentName);
      const safeAppLabel = JSON.stringify(deploymentName);
      
      let deploymentYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${safeDeploymentName}
  namespace: ${safeNamespace}
  labels:
    app: ${safeAppLabel}
    managed-by: supercomputing-portal
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${safeAppLabel}
  template:
    metadata:
      labels:
        app: ${safeAppLabel}
    spec:
      containers:
      - name: ${safeDeploymentName}
        image: ${JSON.stringify(containerImage)}
        imagePullPolicy: IfNotPresent
        resources:
          requests:
            memory: "${memoryMi}Mi"
            cpu: "${cpuMilli}m"`;

      // GPU가 필요한 경우 GPU 리소스 추가
      if (gpuCount > 0) {
        deploymentYaml += `
            nvidia.com/gpu: "${gpuCount}"`;
      }

      deploymentYaml += `
          limits:
            memory: "${memoryMi}Mi"
            cpu: "${cpuMilli}m"`;

      if (gpuCount > 0) {
        deploymentYaml += `
            nvidia.com/gpu: "${gpuCount}"`;
      }

      deploymentYaml += `
        ports:
        - containerPort: 22
          name: ssh
          protocol: TCP
        env:
        - name: ROOT_PASSWORD
          value: ${JSON.stringify(rootPassword)}
        command: ["/bin/bash", "-c"]
        args:
          - |
            mkdir -p /run/sshd && \
            chmod 700 /run/sshd && \
            echo "root:${rootPassword}" | chpasswd && \
            /usr/sbin/sshd -D -e
      restartPolicy: Always
`;

      // 임시 파일로 저장 후 적용
      const tempFile = `/tmp/deployment-${deploymentName}-${Date.now()}.yaml`;
      console.log(`[kubectl-deploy] Deployment YAML 저장: ${tempFile}`);
      console.log(`[kubectl-deploy] Deployment YAML 내용:\n${deploymentYaml}`);
      
      await execCommand(conn, `cat > ${tempFile} << 'EOF'\n${deploymentYaml}\nEOF`);
      
      console.log(`[kubectl-deploy] kubectl apply 실행 시작`);
      const applyOutput = await execCommand(conn, `kubectl apply -f ${tempFile} 2>&1`);
      console.log(`[kubectl-deploy] kubectl apply 결과: ${applyOutput}`);
      
      await execCommand(conn, `rm -f ${tempFile}`);

      console.log(`[kubectl-deploy] [3/6] Deployment 생성 완료: ${deploymentName}`);

      // 4. Pod가 준비될 때까지 대기 (최대 60초)
      console.log(`[kubectl-deploy] [4/6] Pod 준비 상태 확인 시작`);
      let podReady = false;
      let podName = "";
      
      // 먼저 Deployment 상태 확인
      try {
        const deploymentStatus = await execCommand(
          conn,
          `kubectl get deployment ${deploymentName} -n ${namespace} -o jsonpath='{.status.conditions[*].type}' 2>&1 || echo ''`
        );
        console.log(`[kubectl-deploy] Deployment 상태: ${deploymentStatus}`);
      } catch (e) {
        console.warn(`[kubectl-deploy] Deployment 상태 확인 실패:`, e);
      }
      
      for (let i = 0; i < 12; i++) {
        console.log(`[kubectl-deploy] Pod 확인 시도 ${i + 1}/12`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        
        try {
          // Pod 목록 조회 (간단한 형식으로 먼저 확인)
          const podsListSimple = await execCommand(
            conn,
            `kubectl get pods -n ${namespace} -l app=${deploymentName} --no-headers 2>/dev/null || echo ''`
          );
          
          if (!podsListSimple.trim()) {
            console.log(`[kubectl-deploy] Pod가 아직 생성되지 않았습니다. 대기 중...`);
            continue;
          }
          
          // Pod 목록 JSON 조회
          let podsList = "";
          try {
            podsList = await execCommand(
              conn,
              `kubectl get pods -n ${namespace} -l app=${deploymentName} -o json 2>/dev/null || echo '{"items":[]}'`
            );
            if (podsList.length > 0 && podsList.length < 1000) {
              console.log(`[kubectl-deploy] Pod 목록: ${podsList}`);
            }
          } catch (e) {
            console.warn(`[kubectl-deploy] Pod 목록 JSON 조회 실패 (계속 진행):`, e);
          }
          
          // Pod 이름 조회 (더 안전한 방법)
          let podOutput = "";
          try {
            podOutput = await execCommand(
              conn,
              `kubectl get pods -n ${namespace} -l app=${deploymentName} -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo ''`
            );
          } catch (e) {
            // jsonpath 에러는 무시하고 빈 문자열로 처리
            console.warn(`[kubectl-deploy] Pod 이름 조회 중 경고 (계속 진행):`, e);
            podOutput = "";
          }
          
          // 대안: 간단한 명령어로 Pod 이름 가져오기
          if (!podOutput.trim()) {
            try {
              const podNameLine = podsListSimple.trim().split('\n')[0];
              if (podNameLine) {
                podOutput = podNameLine.split(/\s+/)[0];
              }
            } catch (e) {
              console.warn(`[kubectl-deploy] Pod 이름 추출 실패:`, e);
            }
          }
          
          if (podOutput.trim()) {
            podName = podOutput.trim();
            console.log(`[kubectl-deploy] Pod 이름 발견: ${podName}`);
            
            // Pod 상세 정보 조회
            let podInfo = "";
            try {
              podInfo = await execCommand(
                conn,
                `kubectl get pod ${podName} -n ${namespace} -o jsonpath='{.status.phase}' 2>/dev/null || echo 'Unknown'`
              );
            } catch (e) {
              console.warn(`[kubectl-deploy] Pod 상태 조회 실패:`, e);
              podInfo = "Unknown";
            }
            console.log(`[kubectl-deploy] Pod 상태: ${podInfo.trim()}`);
            
            // Pod 이벤트 조회 (에러 확인용)
            if (podInfo.trim() !== "Running") {
              try {
                // Pod 상세 정보 조회
                let podDescribe = "";
                try {
                  podDescribe = await execCommand(
                    conn,
                    `kubectl describe pod ${podName} -n ${namespace} 2>/dev/null || echo ''`
                  );
                  if (podDescribe.trim()) {
                    console.log(`[kubectl-deploy] Pod 상세 정보:\n${podDescribe}`);
                  }
                } catch (e) {
                  console.warn(`[kubectl-deploy] Pod 상세 정보 조회 실패:`, e);
                }
                
                // Pod 이벤트만 추출
                let podEvents = "";
                try {
                  podEvents = await execCommand(
                    conn,
                    `kubectl get events -n ${namespace} --field-selector involvedObject.name=${podName} --sort-by='.lastTimestamp' 2>/dev/null || echo ''`
                  );
                  if (podEvents.trim()) {
                    console.log(`[kubectl-deploy] Pod 이벤트:\n${podEvents}`);
                  }
                } catch (e) {
                  console.warn(`[kubectl-deploy] Pod 이벤트 조회 실패:`, e);
                }
                
                // Pod 로그 확인 (CrashLoopBackOff 등 문제 파악용)
                if (podInfo.trim() === "CrashLoopBackOff" || podInfo.trim() === "Error" || podInfo.trim() === "ImagePullBackOff" || podInfo.trim() === "CreateContainerError") {
                  try {
                    const podLogs = await execCommand(
                      conn,
                      `kubectl logs ${podName} -n ${namespace} --tail=50 2>/dev/null || echo ''`
                    );
                    if (podLogs.trim()) {
                      console.log(`[kubectl-deploy] Pod 로그:\n${podLogs}`);
                    }
                  } catch (e) {
                    console.warn(`[kubectl-deploy] Pod 로그 조회 실패:`, e);
                  }
                  
                  // CreateContainerError의 경우 컨테이너 상태 확인
                  if (podInfo.trim() === "CreateContainerError") {
                    try {
                      const containerStatus = await execCommand(
                        conn,
                        `kubectl get pod ${podName} -n ${namespace} -o jsonpath='{.status.containerStatuses[0].state.waiting.reason}' 2>/dev/null || echo ''`
                      );
                      const containerMessage = await execCommand(
                        conn,
                        `kubectl get pod ${podName} -n ${namespace} -o jsonpath='{.status.containerStatuses[0].state.waiting.message}' 2>/dev/null || echo ''`
                      );
                      console.log(`[kubectl-deploy] 컨테이너 에러 원인: ${containerStatus}`);
                      console.log(`[kubectl-deploy] 컨테이너 에러 메시지: ${containerMessage}`);
                    } catch (e) {
                      console.warn(`[kubectl-deploy] 컨테이너 상태 조회 실패:`, e);
                    }
                  }
                }
                
                // Pending 상태일 때 원인 파악
                if (podInfo.trim() === "Pending") {
                  // 노드 스케줄링 문제 확인
                  try {
                    const podJson = await execCommand(
                      conn,
                      `kubectl get pod ${podName} -n ${namespace} -o json 2>/dev/null || echo '{}'`
                    );
                    if (podJson.trim() && podJson.length > 0) {
                      console.log(`[kubectl-deploy] Pod JSON (Pending 원인 확인):\n${podJson.substring(0, 1000)}`);
                    }
                  } catch (e) {
                    console.warn(`[kubectl-deploy] Pod JSON 조회 실패:`, e);
                  }
                }
              } catch (e) {
                console.warn(`[kubectl-deploy] Pod 정보 조회 실패:`, e);
              }
            }
            
            if (podInfo.trim() === "Running") {
              podReady = true;
              console.log(`[kubectl-deploy] Pod가 Running 상태입니다!`);
              break;
            }
          } else {
            // Pod 이름을 찾지 못한 경우, Deployment 상태 확인
            try {
              const deploymentStatus = await execCommand(
                conn,
                `kubectl get deployment ${deploymentName} -n ${namespace} -o jsonpath='{.status.conditions[?(@.type=="Available")].status}' 2>/dev/null || echo ''`
              );
              if (deploymentStatus.trim() === "True") {
                console.log(`[kubectl-deploy] Deployment가 사용 가능 상태입니다. Pod를 다시 확인합니다.`);
              }
            } catch (e) {
              // 무시
            }
          }
        } catch (error) {
          console.warn(`[kubectl-deploy] Pod 상태 확인 중 오류 (시도 ${i + 1}/12):`, error);
        }
      }

      if (!podReady || !podName) {
        // 실패 시 더 자세한 정보 수집
        let pendingReason = "";
        let pendingMessage = "";
        
        try {
          const allPods = await execCommand(
            conn,
            `kubectl get pods -n ${namespace} 2>&1 || echo ''`
          );
          console.error(`[kubectl-deploy] 네임스페이스의 모든 Pod:\n${allPods}`);
          
          const deploymentInfo = await execCommand(
            conn,
            `kubectl describe deployment ${deploymentName} -n ${namespace} 2>&1 || echo ''`
          );
          console.error(`[kubectl-deploy] Deployment 상세 정보:\n${deploymentInfo}`);
          
          // Pod가 Pending 상태인 경우 원인 파악
          if (podName) {
            const podDescribe = await execCommand(
              conn,
              `kubectl describe pod ${podName} -n ${namespace} 2>&1 || echo ''`
            );
            console.error(`[kubectl-deploy] Pod 상세 정보:\n${podDescribe}`);
            
            // Pending 원인 추출
            if (podDescribe.includes("Unschedulable")) {
              pendingReason = "Unschedulable";
              pendingMessage = "Pod를 스케줄할 수 없습니다. 노드 리소스 부족 또는 노드 선택기 문제일 수 있습니다.";
            } else if (podDescribe.includes("ImagePullBackOff") || podDescribe.includes("ErrImagePull")) {
              pendingReason = "ImagePullError";
              pendingMessage = "컨테이너 이미지를 가져올 수 없습니다. 이미지 이름이나 레지스트리 접근 권한을 확인하세요.";
            } else if (podDescribe.includes("Insufficient")) {
              pendingReason = "InsufficientResources";
              pendingMessage = "노드에 충분한 리소스가 없습니다. CPU, 메모리, 또는 GPU 리소스를 확인하세요.";
            }
          }
        } catch (e) {
          console.error(`[kubectl-deploy] 디버그 정보 수집 실패:`, e);
        }
        
        // Pod 상태에 따른 에러 메시지 생성
        let errorMessage = "";
        if (podName) {
          try {
            // 컨테이너 상태 확인
            const containerReason = await execCommand(
              conn,
              `kubectl get pod ${podName} -n ${namespace} -o jsonpath='{.status.containerStatuses[0].state.waiting.reason}' 2>/dev/null || echo ''`
            );
            const containerMessage = await execCommand(
              conn,
              `kubectl get pod ${podName} -n ${namespace} -o jsonpath='{.status.containerStatuses[0].state.waiting.message}' 2>/dev/null || echo ''`
            );
            const podPhase = await execCommand(
              conn,
              `kubectl get pod ${podName} -n ${namespace} -o jsonpath='{.status.phase}' 2>/dev/null || echo 'Unknown'`
            );
            
            if (containerReason.trim() === "CreateContainerError" || podPhase.trim() === "CreateContainerError") {
              errorMessage = `컨테이너 생성 실패: ${containerMessage.trim() || "이미지를 찾을 수 없습니다"}. 이미지 이름(${containerImage})이 정확한지 확인하세요. 로컬 이미지를 사용하는 경우 이미지 이름이 containerd에 등록된 이름과 정확히 일치해야 합니다. 'crictl images' 명령어로 등록된 이미지 이름을 확인하세요.`;
            } else if (containerReason.trim() === "CrashLoopBackOff" || podPhase.trim() === "CrashLoopBackOff") {
              errorMessage = `Pod가 CrashLoopBackOff 상태입니다. 컨테이너가 계속 재시작되고 있습니다. 이미지(${containerImage})가 올바른지, 또는 컨테이너가 실행될 명령어가 있는지 확인하세요.`;
            } else if (containerReason.trim() === "ImagePullBackOff" || containerReason.trim() === "ErrImagePull" || podPhase.trim() === "ImagePullBackOff") {
              errorMessage = `이미지를 가져올 수 없습니다. 이미지 이름(${containerImage})과 레지스트리 접근 권한을 확인하세요.`;
            } else if (pendingReason) {
              errorMessage = `Pod가 준비되지 않았습니다. 원인: ${pendingReason} - ${pendingMessage}`;
            } else {
              errorMessage = `Pod가 준비되지 않았습니다. 상태: ${podPhase.trim()}, 원인: ${containerReason.trim() || "알 수 없음"}, Pod 이름: ${podName}, 네임스페이스: ${namespace}`;
            }
          } catch (e) {
            errorMessage = pendingReason 
              ? `Pod가 준비되지 않았습니다. 원인: ${pendingReason} - ${pendingMessage}`
              : `Pod가 준비되지 않았습니다. Pod 이름: ${podName || "없음"}, 네임스페이스: ${namespace}, Deployment: ${deploymentName}, 이미지: ${containerImage}`;
          }
        } else {
          errorMessage = pendingReason 
            ? `Pod가 준비되지 않았습니다. 원인: ${pendingReason} - ${pendingMessage}`
            : `Pod가 준비되지 않았습니다. Pod 이름: ${podName || "없음"}, 네임스페이스: ${namespace}, Deployment: ${deploymentName}, 이미지: ${containerImage}`;
        }
        
        throw new Error(errorMessage);
      }

      console.log(`[kubectl-deploy] [4/6] Pod 준비 완료: ${podName}`);

      // 5. Service 생성 (NodePort 타입)
      console.log(`[kubectl-deploy] [5/6] Service 생성 시작`);
      // Service 이름은 알파벳으로 시작해야 하므로 "svc-" 접두사 추가
      const serviceName = `svc-${deploymentName.replace(/^deploy-/, "")}`;
      const nodePort = await findAvailableNodePort(conn, 30000);
      console.log(`[kubectl-deploy] 할당된 NodePort: ${nodePort}`);

      // Service YAML에서도 문자열로 명시적으로 지정
      const safeServiceName = JSON.stringify(serviceName);
      
      const serviceYaml = `apiVersion: v1
kind: Service
metadata:
  name: ${safeServiceName}
  namespace: ${safeNamespace}
  labels:
    app: ${safeAppLabel}
    managed-by: supercomputing-portal
spec:
  type: NodePort
  selector:
    app: ${safeAppLabel}
  ports:
  - port: 22
    targetPort: 22
    protocol: TCP
    name: ssh
    nodePort: ${nodePort}
`;

      const tempServiceFile = `/tmp/service-${serviceName}-${Date.now()}.yaml`;
      console.log(`[kubectl-deploy] Service YAML 저장: ${tempServiceFile}`);
      await execCommand(conn, `cat > ${tempServiceFile} << 'EOF'\n${serviceYaml}\nEOF`);
      
      const serviceApplyOutput = await execCommand(conn, `kubectl apply -f ${tempServiceFile} 2>&1`);
      console.log(`[kubectl-deploy] Service apply 결과: ${serviceApplyOutput}`);
      
      await execCommand(conn, `rm -f ${tempServiceFile}`);

      console.log(`[kubectl-deploy] [5/6] Service 생성 완료: ${serviceName}, NodePort: ${nodePort}`);

      // 6. 접속 정보 생성
      console.log(`[kubectl-deploy] [6/6] 접속 정보 생성`);
      const accessHost = node.ipAddress;
      const accessPort = nodePort; // NodePort
      const accessUrl = `ssh://${accessHost}:${accessPort}`;

      const result = {
        podName,
        deploymentName,
        serviceName,
        servicePort: 22, // SSH 포트
        accessHost,
        accessPort,
        accessUrl,
        rootPassword,
      };
      
      console.log(`[kubectl-deploy] ===== 배포 완료 =====`);
      console.log(`[kubectl-deploy] Pod: ${podName}`);
      console.log(`[kubectl-deploy] 접속 URL: ${accessUrl}`);
      console.log(`[kubectl-deploy] 호스트: ${accessHost}:${accessPort}`);
      console.log(`[kubectl-deploy] root 비밀번호: ${rootPassword}`);

      return result;
    } catch (error) {
      console.error("[kubectl-deploy] 배포 실패:", error);
      throw new Error(
        `컨테이너 배포 실패: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
}

