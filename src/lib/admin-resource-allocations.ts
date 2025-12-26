import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

import { listStoredNodes } from "./admin-node-store";
import { deployContainerWithKubectl } from "./admin-kubectl-deploy";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "admin-resource-allocations.json");

export type ResourceRequestStatus =
  | "pending"
  | "allocating"
  | "fulfilled"
  | "archived";

export type ContainerAllocationStatus =
  | "deploying"
  | "running"
  | "failed"
  | "terminated";

export interface ResourceRequirements {
  gpuCount: number;
  cpuCores: number;
  memoryGb: number;
  storageTb: number;
}

export interface ResourceRequest {
  id: string;
  project: string;
  owner: string;
  organisation: string;
  requestedAt: string;
  deadline?: string;
  status: ResourceRequestStatus;
  summary: string;
  preferredRuntime: string;
  preferredImage: string;
  tags: string[];
  requirements: ResourceRequirements;
  reviewerNotes?: string;
}

export interface ContainerAllocation {
  id: string;
  requestId: string;
  nodeId: string;
  namespace: string;
  containerImage: string;
  runtime: string;
  version: string;
  cpuCores: number;
  gpuCount: number;
  memoryGb: number;
  storageGb: number;
  status: ContainerAllocationStatus;
  createdAt: string;
  assignedBy: string;
  notes?: string;
  // 배포 및 접속 정보
  podName?: string;
  serviceName?: string;
  servicePort?: number;
  accessUrl?: string;
  accessHost?: string;
  accessPort?: number;
  deploymentName?: string;
  rootPassword?: string;
}

type AllocationStore = {
  requests: ResourceRequest[];
  allocations: ContainerAllocation[];
};

const defaultStore: AllocationStore = {
  requests: [],
  allocations: [],
};

async function ensureStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(
      DATA_FILE,
      JSON.stringify(defaultStore, null, 2),
      "utf-8",
    );
  }
}

async function readStore(): Promise<AllocationStore> {
  await ensureStore();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as AllocationStore;
    if (
      parsed &&
      Array.isArray(parsed.requests) &&
      Array.isArray(parsed.allocations)
    ) {
      return parsed;
    }
  } catch (error) {
    console.error("[allocations] 데이터를 읽는 중 문제가 발생했습니다:", error);
  }
  return { ...defaultStore };
}

async function writeStore(store: AllocationStore) {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

function computeRequestStatus(
  request: ResourceRequest,
  allocations: ContainerAllocation[],
): ResourceRequestStatus {
  const related = allocations.filter(
    (allocation) => allocation.requestId === request.id,
  );

  if (related.length === 0) {
    return "pending";
  }

  if (related.every((entry) => entry.status === "terminated")) {
    return "archived";
  }

  if (related.some((entry) => entry.status === "running")) {
    return "fulfilled";
  }

  if (related.some((entry) => entry.status === "failed")) {
    return "allocating";
  }

  return "allocating";
}

export async function createResourceRequest(input: {
  project: string;
  owner: string;
  organisation: string;
  summary: string;
  preferredRuntime: string;
  preferredImage: string;
  tags?: string[];
  deadline?: string;
  requirements: ResourceRequirements;
}): Promise<ResourceRequest> {
  const project = input.project?.trim();
  const owner = input.owner?.trim();
  const organisation = input.organisation?.trim();
  const summary = input.summary?.trim();
  const preferredRuntime = input.preferredRuntime?.trim();
  const preferredImage = input.preferredImage?.trim();

  if (!project) {
    throw new Error("프로젝트 이름을 입력하세요.");
  }
  if (!owner) {
    throw new Error("담당자 이름을 입력하세요.");
  }
  if (!organisation) {
    throw new Error("소속 기관을 입력하세요.");
  }
  if (!summary) {
    throw new Error("프로젝트 설명을 입력하세요.");
  }
  if (!preferredRuntime) {
    throw new Error("런타임을 입력하세요.");
  }
  if (!preferredImage) {
    throw new Error("컨테이너 이미지를 입력하세요.");
  }

  const requirements = input.requirements;
  if (!Number.isFinite(requirements.gpuCount) || requirements.gpuCount < 0) {
    throw new Error("GPU 개수가 올바르지 않습니다.");
  }
  if (!Number.isFinite(requirements.cpuCores) || requirements.cpuCores < 0) {
    throw new Error("CPU 코어 수가 올바르지 않습니다.");
  }
  if (!Number.isFinite(requirements.memoryGb) || requirements.memoryGb < 0) {
    throw new Error("메모리 용량이 올바르지 않습니다.");
  }
  if (!Number.isFinite(requirements.storageTb) || requirements.storageTb < 0) {
    throw new Error("스토리지 용량이 올바르지 않습니다.");
  }

  const store = await readStore();

  const newRequest: ResourceRequest = {
    id: randomUUID(),
    project,
    owner,
    organisation,
    summary,
    preferredRuntime,
    preferredImage,
    tags: input.tags || [],
    deadline: input.deadline?.trim() || undefined,
    requirements,
    status: "pending",
    requestedAt: new Date().toISOString(),
  };

  store.requests.push(newRequest);
  await writeStore(store);

  return {
    ...newRequest,
    status: computeRequestStatus(newRequest, store.allocations),
  };
}

export async function listResourceRequests(): Promise<ResourceRequest[]> {
  const store = await readStore();
  return store.requests.map((request) => ({
    ...request,
    status: computeRequestStatus(request, store.allocations),
  }));
}

export async function listContainerAllocations(): Promise<ContainerAllocation[]> {
  const store = await readStore();
  return store.allocations;
}

export async function getResourceRequest(
  requestId: string,
): Promise<ResourceRequest | null> {
  const store = await readStore();
  const request = store.requests.find((entry) => entry.id === requestId);
  if (!request) {
    return null;
  }
  return {
    ...request,
    status: computeRequestStatus(request, store.allocations),
  };
}

export async function createContainerAllocation(input: {
  requestId: string;
  nodeId: string;
  namespace: string;
  containerImage: string;
  runtime: string;
  version: string;
  cpuCores: number;
  gpuCount: number;
  memoryGb: number;
  storageGb: number;
  assignedBy: string;
  notes?: string;
}): Promise<{ allocation: ContainerAllocation; request: ResourceRequest }> {
  const {
    requestId,
    nodeId,
    namespace,
    containerImage,
    runtime,
    version,
    cpuCores,
    gpuCount,
    memoryGb,
    storageGb,
    assignedBy,
    notes,
  } = input;

  if (!requestId) {
    throw new Error("요청 ID가 필요합니다.");
  }
  if (!nodeId) {
    throw new Error("할당할 노드를 선택하세요.");
  }
  if (!namespace) {
    throw new Error("네임스페이스를 입력하세요.");
  }
  if (!containerImage) {
    throw new Error("컨테이너 이미지를 입력하세요.");
  }
  if (!runtime) {
    throw new Error("런타임을 입력하세요.");
  }
  if (!version) {
    throw new Error("배포 버전을 입력하세요.");
  }
  if (!assignedBy) {
    throw new Error("배포 담당자를 입력하세요.");
  }

  const numericFields = [
    ["cpuCores", cpuCores],
    ["gpuCount", gpuCount],
    ["memoryGb", memoryGb],
    ["storageGb", storageGb],
  ] as const;

  for (const [label, value] of numericFields) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${label} 값이 올바르지 않습니다.`);
    }
  }

  const store = await readStore();
  const requestIndex = store.requests.findIndex(
    (entry) => entry.id === requestId,
  );
  if (requestIndex === -1) {
    throw new Error("해당 신청을 찾을 수 없습니다.");
  }

  const nodes = await listStoredNodes();
  if (!nodes.some((node) => node.id === nodeId)) {
    throw new Error("선택한 노드를 찾을 수 없습니다. 먼저 노드를 등록하세요.");
  }

  // Deployment 이름 생성 (namespace와 버전 기반)
  // Kubernetes 리소스 이름은 알파벳으로 시작해야 하므로 "deploy-" 접두사 추가
  const sanitizedNamespace = namespace.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
  const sanitizedVersion = version.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
  const deploymentName = `deploy-${sanitizedNamespace}-${sanitizedVersion}`;

  const allocation: ContainerAllocation = {
    id: randomUUID(),
    requestId,
    nodeId,
    namespace: namespace.trim(),
    containerImage: containerImage.trim(),
    runtime: runtime.trim(),
    version: version.trim(),
    cpuCores,
    gpuCount,
    memoryGb,
    storageGb,
    status: "deploying",
    createdAt: new Date().toISOString(),
    assignedBy: assignedBy.trim(),
    notes: notes?.trim() || undefined,
    deploymentName,
  };

  store.allocations.push(allocation);
  store.requests[requestIndex] = {
    ...store.requests[requestIndex],
    status: computeRequestStatus(store.requests[requestIndex], store.allocations),
  };

  await writeStore(store);

  // kubectl을 통한 실제 배포 실행 (비동기)
  console.log(`[createContainerAllocation] 배포 시작 - 할당 ID: ${allocation.id}`);
  deployContainerWithKubectl({
    nodeId,
    namespace: namespace.trim(),
    containerImage: containerImage.trim(),
    deploymentName,
    cpuCores,
    gpuCount,
    memoryGb,
    storageGb,
  })
    .then((deploymentResult) => {
      console.log(`[createContainerAllocation] 배포 성공 - 할당 ID: ${allocation.id}`);
      console.log(`[createContainerAllocation] 배포 결과:`, deploymentResult);
      // 배포 성공 시 할당 정보 업데이트
      return updateAllocationWithDeploymentResult(allocation.id, deploymentResult);
    })
    .then(() => {
      console.log(`[createContainerAllocation] 상태 업데이트 완료 - 할당 ID: ${allocation.id}, 상태: running`);
    })
    .catch((error) => {
      console.error(`[createContainerAllocation] 배포 실패 - 할당 ID: ${allocation.id}`, error);
      // 배포 실패 시 상태를 failed로 업데이트
      updateContainerAllocationStatus({
        allocationId: allocation.id,
        status: "failed",
      })
        .then(() => {
          console.log(`[createContainerAllocation] 상태를 failed로 업데이트 완료 - 할당 ID: ${allocation.id}`);
        })
        .catch((updateError) => {
          console.error(`[createContainerAllocation] 상태 업데이트 실패 - 할당 ID: ${allocation.id}`, updateError);
        });
    });

  return {
    allocation,
    request: {
      ...store.requests[requestIndex],
      status: computeRequestStatus(
        store.requests[requestIndex],
        store.allocations,
      ),
    },
  };
}

async function updateAllocationWithDeploymentResult(
  allocationId: string,
  deploymentResult: {
    podName: string;
    deploymentName: string;
    serviceName: string;
    servicePort: number;
    accessHost: string;
    accessPort: number;
    accessUrl: string;
    rootPassword: string;
  },
): Promise<void> {
  console.log(`[updateAllocationWithDeploymentResult] 시작 - 할당 ID: ${allocationId}`);
  console.log(`[updateAllocationWithDeploymentResult] 배포 결과:`, deploymentResult);
  
  const store = await readStore();
  const index = store.allocations.findIndex((entry) => entry.id === allocationId);
  
  if (index === -1) {
    console.error(`[updateAllocationWithDeploymentResult] 할당을 찾을 수 없습니다: ${allocationId}`);
    return;
  }

  console.log(`[updateAllocationWithDeploymentResult] 할당 찾음, 상태를 running으로 업데이트`);

  store.allocations[index] = {
    ...store.allocations[index],
    status: "running",
    podName: deploymentResult.podName,
    deploymentName: deploymentResult.deploymentName,
    serviceName: deploymentResult.serviceName,
    servicePort: deploymentResult.servicePort,
    accessHost: deploymentResult.accessHost,
    accessPort: deploymentResult.accessPort,
    accessUrl: deploymentResult.accessUrl,
    rootPassword: deploymentResult.rootPassword,
  };

  // 관련 요청 상태도 업데이트
  const requestIndex = store.requests.findIndex(
    (entry) => entry.id === store.allocations[index].requestId,
  );

  if (requestIndex !== -1) {
    const oldStatus = store.requests[requestIndex].status;
    store.requests[requestIndex] = {
      ...store.requests[requestIndex],
      status: computeRequestStatus(store.requests[requestIndex], store.allocations),
    };
    console.log(`[updateAllocationWithDeploymentResult] 요청 상태 업데이트: ${oldStatus} -> ${store.requests[requestIndex].status}`);
  }

  await writeStore(store);
  console.log(`[updateAllocationWithDeploymentResult] 완료 - 할당 ID: ${allocationId}, 상태: running`);
}

export async function updateContainerAllocationStatus(input: {
  allocationId: string;
  status: ContainerAllocationStatus;
}): Promise<ContainerAllocation> {
  const { allocationId, status } = input;
  if (!allocationId) {
    throw new Error("할당 ID가 필요합니다.");
  }
  if (!status) {
    throw new Error("상태 값을 입력하세요.");
  }

  const store = await readStore();
  const index = store.allocations.findIndex(
    (entry) => entry.id === allocationId,
  );
  if (index === -1) {
    throw new Error("해당 할당 레코드를 찾을 수 없습니다.");
  }

  store.allocations[index] = {
    ...store.allocations[index],
    status,
  };

  const requestIndex = store.requests.findIndex(
    (entry) => entry.id === store.allocations[index].requestId,
  );

  if (requestIndex !== -1) {
    store.requests[requestIndex] = {
      ...store.requests[requestIndex],
      status: computeRequestStatus(
        store.requests[requestIndex],
        store.allocations,
      ),
    };
  }

  await writeStore(store);

  return store.allocations[index];
}

export async function getAllocationOverview(): Promise<{
  requests: ResourceRequest[];
  allocations: ContainerAllocation[];
}> {
  const store = await readStore();
  const requests = store.requests.map((request) => ({
    ...request,
    status: computeRequestStatus(request, store.allocations),
  }));

  return {
    requests,
    allocations: store.allocations,
  };
}

export async function cancelResourceRequest(requestId: string): Promise<ResourceRequest> {
  const store = await readStore();
  const index = store.requests.findIndex((entry) => entry.id === requestId);
  
  if (index === -1) {
    throw new Error("신청을 찾을 수 없습니다.");
  }

  const request = store.requests[index];
  
  // 이미 할당된 자원이 있는지 확인
  const hasAllocations = store.allocations.some(
    (allocation) => allocation.requestId === requestId
  );

  if (hasAllocations) {
    throw new Error("이미 할당된 자원이 있어 취소할 수 없습니다. 관리자에게 문의하세요.");
  }

  // 상태를 archived로 변경
  store.requests[index] = {
    ...request,
    status: "archived" as ResourceRequestStatus,
  };

  await writeStore(store);

  return {
    ...store.requests[index],
    status: computeRequestStatus(store.requests[index], store.allocations),
  };
}

export async function deleteResourceRequest(requestId: string): Promise<void> {
  const store = await readStore();
  const index = store.requests.findIndex((entry) => entry.id === requestId);
  
  if (index === -1) {
    throw new Error("신청을 찾을 수 없습니다.");
  }

  const request = store.requests[index];

  // 이미 할당된 자원이 있는지 확인
  const hasAllocations = store.allocations.some(
    (allocation) => allocation.requestId === requestId
  );

  if (hasAllocations) {
    throw new Error("이미 할당된 자원이 있어 삭제할 수 없습니다. 관리자에게 문의하세요.");
  }

  // pending 상태가 아니면 삭제 불가
  if (request.status !== "pending") {
    throw new Error("승인 대기 중인 신청만 삭제할 수 있습니다.");
  }

  store.requests.splice(index, 1);
  await writeStore(store);
}

