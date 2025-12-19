import { promises as fs } from "fs";
import path from "path";

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

export async function getResourceCapacity(): Promise<ResourceCapacityDefinition> {
  const capacity = await readRawCapacity();
  return capacity ?? DEFAULT_CAPACITY;
}
