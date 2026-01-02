import { promises as fs } from "fs";
import path from "path";
import { listStoredNodes } from "./admin-node-store";
import { createNodeResourceSnapshot } from "./admin-node-resources";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "resource-capacity.json");

export interface ResourceCapacityDefinition {
  cpu: {
    totalCores: number;
    description: string;
  };
  gpu: {
    totalUnits: number;
    description: string;
  };
  memory: {
    totalGb: number;
    description: string;
  };
  storage: {
    totalGb: number;
    description: string;
  };
}

const DEFAULT_CAPACITY: ResourceCapacityDefinition = {
  cpu: {
    totalCores: 0,
    description: "전체 클러스터에서 컨테이너 워크로드에 할당 가능한 vCPU 총량입니다.",
  },
  gpu: {
    totalUnits: 0,
    description: "운영 중인 GPU 장비의 총 개수입니다.",
  },
  memory: {
    totalGb: 0,
    description: "컨테이너 워크로드에 배정 가능한 메모리 총량(GB)입니다.",
  },
  storage: {
    totalGb: 0,
    description: "컨테이너 워크로드에 할당 가능한 고속 스토리지 총량(GB)입니다.",
  },
};

async function readRawCapacity(): Promise<ResourceCapacityDefinition | null> {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(data) as Partial<ResourceCapacityDefinition>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return {
      cpu: {
        totalCores: Number(parsed.cpu?.totalCores ?? 0),
        description:
          parsed.cpu?.description ?? DEFAULT_CAPACITY.cpu.description,
      },
      gpu: {
        totalUnits: Number(parsed.gpu?.totalUnits ?? 0),
        description:
          parsed.gpu?.description ?? DEFAULT_CAPACITY.gpu.description,
      },
      memory: {
        totalGb: Number(parsed.memory?.totalGb ?? 0),
        description:
          parsed.memory?.description ?? DEFAULT_CAPACITY.memory.description,
      },
      storage: {
        totalGb: Number(parsed.storage?.totalGb ?? 0),
        description:
          parsed.storage?.description ?? DEFAULT_CAPACITY.storage.description,
      },
    };
  } catch (error) {
    console.error("[resource-capacity] 파일 읽기 실패:", error);
    return null;
  }
}

/**
 * 등록된 노드들의 실제 리소스를 합산하여 capacity를 계산합니다.
 * 노드 스냅샷을 가져올 수 없는 경우 해당 노드는 제외됩니다.
 */
async function calculateCapacityFromNodes(): Promise<ResourceCapacityDefinition> {
  const nodes = await listStoredNodes();
  
  if (nodes.length === 0) {
    return DEFAULT_CAPACITY;
  }

  let totalCpuCores = 0;
  let totalGpuUnits = 0;
  let totalMemoryGb = 0;
  let totalStorageGb = 0;
  let successfulNodes = 0;

  // 모든 노드에 대해 병렬로 스냅샷을 가져옵니다
  const snapshots = await Promise.allSettled(
    nodes.map(async (node) => {
      try {
        return await createNodeResourceSnapshot(node);
      } catch (error) {
        console.warn(
          `[resource-capacity] 노드 ${node.name}의 리소스 정보를 가져오지 못했습니다:`,
          error instanceof Error ? error.message : String(error),
        );
        return null;
      }
    }),
  );

  for (const result of snapshots) {
    if (result.status === "fulfilled" && result.value !== null) {
      const snapshot = result.value;
      totalCpuCores += snapshot.cpu.cores;
      totalGpuUnits += snapshot.gpus.length;
      totalMemoryGb += snapshot.memory.totalMb / 1024; // MB to GB
      totalStorageGb += snapshot.storage.totalGb;
      successfulNodes++;
    }
  }

  // 성공적으로 리소스를 가져온 노드가 없는 경우 기본값 반환
  if (successfulNodes === 0) {
    console.warn(
      "[resource-capacity] 모든 노드에서 리소스 정보를 가져오지 못했습니다. 기본값을 사용합니다.",
    );
    return DEFAULT_CAPACITY;
  }

  return {
    cpu: {
      totalCores: Math.round(totalCpuCores),
      description: DEFAULT_CAPACITY.cpu.description,
    },
    gpu: {
      totalUnits: totalGpuUnits,
      description: DEFAULT_CAPACITY.gpu.description,
    },
    memory: {
      totalGb: Math.round(totalMemoryGb),
      description: DEFAULT_CAPACITY.memory.description,
    },
    storage: {
      totalGb: Math.round(totalStorageGb),
      description: DEFAULT_CAPACITY.storage.description,
    },
  };
}

export async function getResourceCapacity(): Promise<ResourceCapacityDefinition> {
  // 등록된 노드들의 실제 리소스를 합산하여 반환
  try {
    return await calculateCapacityFromNodes();
  } catch (error) {
    console.error(
      "[resource-capacity] 노드 리소스 계산 실패, 기본값 사용:",
      error,
    );
    // 에러 발생 시 파일에서 읽거나 기본값 반환
    const capacity = await readRawCapacity();
    return capacity ?? DEFAULT_CAPACITY;
  }
}
