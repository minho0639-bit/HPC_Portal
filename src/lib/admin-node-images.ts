import { Client, ConnectConfig } from "ssh2";
import { promises as fs } from "fs";

import type { StoredNode } from "./admin-node-types";
import { getStoredNode } from "./admin-node-store";

export interface ContainerImage {
  name: string;
  tag: string;
  digest: string;
  size: string;
  createdAt?: string;
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
    console.error("[node-images] SSH private key 읽기 실패:", error);
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
      .on("error", (error: Error) => {
        if (!settled) {
          settled = true;
          reject(error);
        }
      })
      .on("end", () => {
        if (!settled) {
          settled = true;
          reject(new Error("SSH 연결이 예기치 않게 종료되었습니다."));
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
          // stderr가 있어도 stdout이 있으면 성공으로 처리
          if (stdout.trim()) {
            resolve(stdout.trim());
          } else if (code !== 0 && stderr) {
            reject(new Error(stderr.trim() || `명령 실행 실패: ${command}`));
          } else {
            resolve("");
          }
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

function parseCtrImagesList(output: string): ContainerImage[] {
  const lines = output.split("\n").filter((line) => line.trim());
  const images: ContainerImage[] = [];
  const seen = new Set<string>();

  // ctr images list 출력 형식 파싱
  // 예시:
  // REF                                                              TYPE    DIGEST                                                                  SIZE      PLATFORMS   LABELS
  // docker.io/library/nginx:latest                                   application/vnd.docker.distribution.manifest.v2+json sha256:abc123...    100MB     linux/amd64
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("REF") || trimmed.startsWith("---")) {
      continue; // 헤더 스킵
    }

    // 탭 또는 여러 공백으로 구분된 필드 파싱
    const parts = trimmed.split(/\s{2,}|\t/).filter((p) => p.trim());
    if (parts.length < 2) continue;

    const ref = parts[0]?.trim();
    if (!ref) continue;

    // 중복 제거 (같은 이미지:태그 조합)
    if (seen.has(ref)) continue;
    seen.add(ref);

    const digest = parts[1]?.trim() || "";
    const size = parts[2]?.trim() || "0B";

    // REF 형식: registry/namespace/image:tag 또는 image:tag
    let name = ref;
    let tag = "latest";
    
    if (ref.includes(":")) {
      const lastColon = ref.lastIndexOf(":");
      name = ref.substring(0, lastColon);
      tag = ref.substring(lastColon + 1);
    }

    images.push({
      name,
      tag,
      digest,
      size,
    });
  }

  return images;
}

export async function listNodeImages(nodeId: string): Promise<ContainerImage[]> {
  const node = await getStoredNode(nodeId);
  if (!node) {
    throw new Error("노드를 찾을 수 없습니다.");
  }

  const privateKey = await resolvePrivateKey();
  const config = buildSshConfig(node, privateKey);

  return withSshConnection(config, async (conn) => {
    // nerdctl images만 사용
    try {
      console.log(`[node-images] ${node.id} (${node.name}): nerdctl images 명령 실행 시작`);
      const output = await execCommand(conn, "nerdctl images 2>&1");
      
      console.log(`[node-images] ${node.id}: 명령 출력 길이: ${output.length} bytes`);
      console.log(`[node-images] ${node.id}: 출력 첫 500자:`, output.substring(0, 500));
      
      if (!output.trim()) {
        console.warn(`[node-images] ${node.id}: 출력이 비어있음`);
        return [];
      }
      
      if (output.includes("command not found")) {
        console.warn(`[node-images] ${node.id}: nerdctl 명령을 찾을 수 없음`);
        return [];
      }
      
      if (output.includes("bash:")) {
        console.warn(`[node-images] ${node.id}: bash 오류 발생 - 출력:`, output);
        return [];
      }
      
      const parsed = parseNerdctlImagesList(output);
      console.log(`[node-images] ${node.id}: 파싱 결과 ${parsed.length}개 이미지`);
      
      if (parsed.length > 0) {
        console.log(`[node-images] ${node.id}: 성공적으로 ${parsed.length}개 이미지 발견`);
        parsed.forEach((img, idx) => {
          console.log(`[node-images] ${node.id}: 이미지 ${idx + 1}: ${img.name}:${img.tag}`);
        });
        return parsed;
      } else {
        console.warn(`[node-images] ${node.id}: 파싱 결과가 비어있음. 원본 출력:`, output.substring(0, 1000));
      }
    } catch (error) {
      console.error(`[node-images] ${node.id}: nerdctl images 실행 중 예외 발생:`, error);
      if (error instanceof Error) {
        console.error(`[node-images] ${node.id}: 에러 메시지:`, error.message);
        console.error(`[node-images] ${node.id}: 에러 스택:`, error.stack);
      }
    }

    // 실패 시 빈 배열 반환
    console.warn(`[node-images] ${node.id}: 최종적으로 빈 배열 반환`);
    return [];
  });
}

function parseDockerImagesList(output: string): ContainerImage[] {
  const lines = output.split("\n").filter((line) => line.trim());
  const images: ContainerImage[] = [];

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) continue;

    const ref = parts[0];
    const digest = parts[1] || "<none>";
    const size = parts[2] || "0B";

    const [name, tag] = ref.includes(":")
      ? ref.split(":")
      : [ref, "latest"];

    images.push({
      name,
      tag,
      digest,
      size,
    });
  }

  return images;
}

function parseNerdctlImagesList(output: string): ContainerImage[] {
  const lines = output.split("\n").filter((line) => line.trim());
  console.log(`[parseNerdctlImagesList] 총 ${lines.length}줄 입력`);
  if (lines.length > 0) {
    console.log(`[parseNerdctlImagesList] 첫 줄: "${lines[0]}"`);
  }
  const images: ContainerImage[] = [];
  const seen = new Set<string>();

  // 헤더 라인 찾기
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("REPOSITORY") && lines[i].includes("TAG")) {
      headerIndex = i;
      console.log(`[parseNerdctlImagesList] 헤더 발견: 라인 ${i + 1} - "${lines[i]}"`);
      break;
    }
  }

  if (headerIndex === -1) {
    console.warn("[parseNerdctlImagesList] 헤더를 찾을 수 없습니다.");
    console.warn("[parseNerdctlImagesList] 전체 출력:", output);
    console.warn("[parseNerdctlImagesList] 첫 5줄:", lines.slice(0, 5));
    return [];
  }

  // 헤더 다음 줄부터 파싱
  let parsedCount = 0;
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // nerdctl images 출력 형식:
    // REPOSITORY                       TAG                               IMAGE ID        CREATED        PLATFORM       SIZE       BLOB SIZE
    // ghcr.io/open-webui/open-webui    main                              c0297cf2f76e    2 weeks ago    linux/amd64    4.537GB    1.539GB
    
    // 여러 공백(2개 이상)으로 구분된 필드 파싱
    const parts = line.split(/\s{2,}/).filter((p) => p.trim());
    console.log(`[parseNerdctlImagesList] 라인 ${i + 1}: ${parts.length}개 필드 - "${line.substring(0, 100)}"`);
    
    if (parts.length < 3) {
      console.warn(`[parseNerdctlImagesList] 파싱 실패 (필드 부족, ${parts.length}개): ${line}`);
      continue;
    }

    const repository = parts[0]?.trim();
    const tag = parts[1]?.trim();
    
    if (!repository || !tag) {
      console.warn(`[parseNerdctlImagesList] 파싱 실패 (repository/tag 없음): repository="${repository}", tag="${tag}"`);
      continue;
    }

    // 중복 제거
    const key = `${repository}:${tag}`;
    if (seen.has(key)) {
      console.log(`[parseNerdctlImagesList] 중복 이미지 스킵: ${key}`);
      continue;
    }
    seen.add(key);

    // SIZE는 보통 마지막에서 두 번째 필드 (BLOB SIZE 앞)
    // 컬럼 순서: REPOSITORY, TAG, IMAGE ID, CREATED, PLATFORM, SIZE, BLOB SIZE
    let size = "0B";
    if (parts.length >= 7) {
      // SIZE 필드 (BLOB SIZE 바로 앞)
      size = parts[parts.length - 2]?.trim() || "0B";
    } else if (parts.length >= 6) {
      // SIZE가 마지막 필드인 경우
      size = parts[parts.length - 1]?.trim() || "0B";
    }

    // IMAGE ID를 digest로 사용 (실제 digest가 아니지만 식별자로 사용)
    const imageId = parts[2]?.trim() || "";

    images.push({
      name: repository,
      tag: tag,
      digest: imageId,
      size: size,
    });
    parsedCount++;
    console.log(`[parseNerdctlImagesList] 이미지 추가: ${repository}:${tag} (${size})`);
  }

  console.log(`[parseNerdctlImagesList] 총 ${parsedCount}개 이미지 파싱 완료 (중복 제거 전: ${images.length}개)`);
  return images;
}

// 모든 노드의 이미지를 통합하여 중복 제거 후 반환
export async function listAllNodesImages(): Promise<ContainerImage[]> {
  const { listStoredNodes } = await import("./admin-node-store");
  const nodes = await listStoredNodes();
  
  if (nodes.length === 0) {
    console.warn("[node-images] 등록된 노드가 없습니다.");
    return [];
  }

  console.log(`[node-images] ${nodes.length}개 노드에서 이미지 수집 시작`);
  const allImages: ContainerImage[] = [];
  const imageMap = new Map<string, ContainerImage>();

  await Promise.all(
    nodes.map(async (node) => {
      try {
        console.log(`[node-images] ${node.name} (${node.id}) 이미지 조회 중...`);
        const images = await listNodeImages(node.id);
        console.log(`[node-images] ${node.name}: ${images.length}개 이미지 발견`);
        
        // 중복 제거: name:tag 조합으로 유니크하게 관리
        images.forEach((image) => {
          const key = `${image.name}:${image.tag}`;
          if (!imageMap.has(key)) {
            imageMap.set(key, image);
            allImages.push(image);
          }
        });
      } catch (error) {
        console.error(`[node-images] ${node.id} (${node.name}) 이미지 목록 가져오기 실패:`, error);
      }
    }),
  );

  console.log(`[node-images] 총 ${allImages.length}개 이미지 수집 완료 (중복 제거 후)`);

  // 이름과 태그로 정렬
  return allImages.sort((a, b) => {
    const aKey = `${a.name}:${a.tag}`;
    const bKey = `${b.name}:${b.tag}`;
    return aKey.localeCompare(bKey);
  });
}

