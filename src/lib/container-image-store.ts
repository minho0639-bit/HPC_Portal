import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "container-images.json");

export interface ContainerImageRegistry {
  id: string;
  name: string;
  type: "docker-hub" | "private" | "quay" | "ghcr" | "other";
  baseUrl: string;
  requiresAuth: boolean;
  createdAt: string;
  description?: string;
}

export interface ContainerImageTemplate {
  id: string;
  name: string;
  image: string;
  description?: string;
  tags: string[];
  runtime?: string;
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
  createdBy: string;
}

type ImageStore = {
  registries: ContainerImageRegistry[];
  templates: ContainerImageTemplate[];
};

const defaultStore: ImageStore = {
  registries: [
    {
      id: "default-docker-hub",
      name: "Docker Hub",
      type: "docker-hub",
      baseUrl: "https://hub.docker.com",
      requiresAuth: false,
      createdAt: new Date().toISOString(),
      description: "공개 Docker Hub 레지스트리",
    },
  ],
  templates: [],
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

async function readStore(): Promise<ImageStore> {
  await ensureStore();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as ImageStore;
    if (
      parsed &&
      Array.isArray(parsed.registries) &&
      Array.isArray(parsed.templates)
    ) {
      return parsed;
    }
  } catch (error) {
    console.error("[container-images] 데이터를 읽는 중 문제가 발생했습니다:", error);
  }
  return { ...defaultStore };
}

async function writeStore(store: ImageStore) {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

// 레지스트리 관리
export async function listRegistries(): Promise<ContainerImageRegistry[]> {
  const store = await readStore();
  return store.registries;
}

export async function createRegistry(
  input: Omit<ContainerImageRegistry, "id" | "createdAt">,
): Promise<ContainerImageRegistry> {
  const registry: ContainerImageRegistry = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };

  const store = await readStore();
  store.registries.push(registry);
  await writeStore(store);

  return registry;
}

export async function deleteRegistry(registryId: string): Promise<void> {
  const store = await readStore();
  store.registries = store.registries.filter((r) => r.id !== registryId);
  await writeStore(store);
}

// 이미지 템플릿 관리
export async function listTemplates(): Promise<ContainerImageTemplate[]> {
  const store = await readStore();
  return store.templates.sort((a, b) => {
    // 사용 빈도순, 최근 사용순으로 정렬
    if (b.usageCount !== a.usageCount) {
      return b.usageCount - a.usageCount;
    }
    if (a.lastUsedAt && b.lastUsedAt) {
      return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
    }
    return a.lastUsedAt ? -1 : 1;
  });
}

export async function getTemplate(
  templateId: string,
): Promise<ContainerImageTemplate | null> {
  const store = await readStore();
  return store.templates.find((t) => t.id === templateId) ?? null;
}

export async function createTemplate(
  input: Omit<
    ContainerImageTemplate,
    "id" | "usageCount" | "createdAt"
  >,
): Promise<ContainerImageTemplate> {
  const template: ContainerImageTemplate = {
    id: randomUUID(),
    usageCount: 0,
    createdAt: new Date().toISOString(),
    ...input,
  };

  const store = await readStore();
  store.templates.push(template);
  await writeStore(store);

  return template;
}

export async function updateTemplate(
  templateId: string,
  updates: Partial<
    Omit<ContainerImageTemplate, "id" | "createdAt" | "usageCount">
  >,
): Promise<ContainerImageTemplate> {
  const store = await readStore();
  const index = store.templates.findIndex((t) => t.id === templateId);
  if (index === -1) {
    throw new Error("템플릿을 찾을 수 없습니다.");
  }

  store.templates[index] = {
    ...store.templates[index],
    ...updates,
  };

  await writeStore(store);
  return store.templates[index];
}

export async function deleteTemplate(templateId: string): Promise<void> {
  const store = await readStore();
  store.templates = store.templates.filter((t) => t.id !== templateId);
  await writeStore(store);
}

export async function recordTemplateUsage(
  templateId: string,
): Promise<ContainerImageTemplate> {
  const store = await readStore();
  const index = store.templates.findIndex((t) => t.id === templateId);
  if (index === -1) {
    throw new Error("템플릿을 찾을 수 없습니다.");
  }

  store.templates[index] = {
    ...store.templates[index],
    usageCount: store.templates[index].usageCount + 1,
    lastUsedAt: new Date().toISOString(),
  };

  await writeStore(store);
  return store.templates[index];
}

// 이미지 검색 (할당에서 사용된 이미지 기반)
export async function searchImages(
  query: string,
  limit = 10,
): Promise<Array<{ image: string; usageCount: number }>> {
  const store = await readStore();
  const queryLower = query.toLowerCase();

  // 템플릿에서 검색
  const templateMatches = store.templates
    .filter(
      (t) =>
        t.image.toLowerCase().includes(queryLower) ||
        t.name.toLowerCase().includes(queryLower) ||
        t.tags.some((tag) => tag.toLowerCase().includes(queryLower)),
    )
    .map((t) => ({
      image: t.image,
      usageCount: t.usageCount,
      source: "template" as const,
    }));

  // 중복 제거 및 정렬
  const imageMap = new Map<string, { image: string; usageCount: number }>();
  templateMatches.forEach((item) => {
    const existing = imageMap.get(item.image);
    if (!existing || existing.usageCount < item.usageCount) {
      imageMap.set(item.image, {
        image: item.image,
        usageCount: item.usageCount,
      });
    }
  });

  return Array.from(imageMap.values())
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit);
}

