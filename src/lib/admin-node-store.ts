"use server";

import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

import type { NodeRecord, StoredNode } from "./admin-node-types";
import { createNodeTelemetry } from "./admin-node-telemetry";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "admin-nodes.json");

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf-8");
  }
}

async function readRawNodes(): Promise<StoredNode[]> {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as StoredNode[];
    }
  } catch (error) {
    console.error("[admin-node-store] Failed to parse node data:", error);
  }
  return [];
}

async function writeRawNodes(nodes: StoredNode[]) {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(nodes, null, 2), "utf-8");
}

function normaliseLabels(labels?: unknown): string[] {
  if (!labels) return [];
  if (Array.isArray(labels)) {
    return labels
      .map((label) => (typeof label === "string" ? label.trim() : ""))
      .filter(Boolean);
  }
  if (typeof labels === "string") {
    return labels
      .split(",")
      .map((label) => label.trim())
      .filter(Boolean);
  }
  return [];
}

function isValidIp(ip: string) {
  const ipv4Regex =
    /^(25[0-5]|2[0-4]\d|1?\d{1,2})(\.(25[0-5]|2[0-4]\d|1?\d{1,2})){3}$/;
  const ipv6Regex =
    /^(([0-9a-fA-F]{1,4}):){7}([0-9a-fA-F]{1,4})$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

export async function listStoredNodes(): Promise<StoredNode[]> {
  return readRawNodes();
}

export async function registerNode(input: {
  name: string;
  ipAddress: string;
  role: string;
  labels?: string[] | string;
  sshUser?: string;
  sshPort?: number;
}): Promise<StoredNode> {
  const name = input.name?.trim();
  const ipAddress = input.ipAddress?.trim();
  const role = input.role?.trim();
  const sshUser =
    typeof input.sshUser === "string" && input.sshUser.trim().length > 0
      ? input.sshUser.trim()
      : undefined;
  const sshPort =
    typeof input.sshPort === "number" && Number.isFinite(input.sshPort)
      ? input.sshPort
      : undefined;

  if (!name) {
    throw new Error("노드 이름을 입력하세요.");
  }
  if (!ipAddress) {
    throw new Error("IP 주소를 입력하세요.");
  }
  if (!isValidIp(ipAddress)) {
    throw new Error("올바른 IPv4 또는 IPv6 주소를 입력하세요.");
  }
  if (!role) {
    throw new Error("노드 역할을 입력하세요.");
  }

  const labels = normaliseLabels(input.labels);
  const nodes = await readRawNodes();

  if (nodes.some((node) => node.ipAddress === ipAddress)) {
    throw new Error("이미 등록된 IP 주소입니다.");
  }

  if (nodes.some((node) => node.name.toLowerCase() === name.toLowerCase())) {
    throw new Error("이미 등록된 노드 이름입니다.");
  }

  const newNode: StoredNode = {
    id: randomUUID(),
    name,
    ipAddress,
    role,
    labels,
    createdAt: new Date().toISOString(),
    sshUser,
    sshPort,
  };

  nodes.push(newNode);
  await writeRawNodes(nodes);

  return newNode;
}

export async function getStoredNode(id: string): Promise<StoredNode | null> {
  const nodes = await readRawNodes();
  const node = nodes.find((entry) => entry.id === id);
  return node ?? null;
}

export async function updateStoredNode(
  id: string,
  input: {
    name?: string;
    ipAddress?: string;
    role?: string;
    labels?: string[] | string;
    sshUser?: string;
    sshPort?: number | null;
  },
): Promise<StoredNode> {
  const nodes = await readRawNodes();
  const targetIndex = nodes.findIndex((node) => node.id === id);

  if (targetIndex === -1) {
    throw new Error("해당 노드를 찾을 수 없습니다.");
  }

  const target = nodes[targetIndex];

  const nextName = input.name?.trim() ?? target.name;
  const nextIp = input.ipAddress?.trim() ?? target.ipAddress;
  const nextRole = input.role?.trim() ?? target.role;
  const nextLabels = input.labels !== undefined ? normaliseLabels(input.labels) : target.labels;
  const nextSshUser =
    input.sshUser !== undefined
      ? input.sshUser.trim() || undefined
      : target.sshUser;
  const nextSshPort =
    typeof input.sshPort === "number" && Number.isFinite(input.sshPort)
      ? input.sshPort
      : input.sshPort === null
        ? undefined
        : target.sshPort;

  if (!nextName) {
    throw new Error("노드 이름을 입력하세요.");
  }
  if (!nextIp) {
    throw new Error("IP 주소를 입력하세요.");
  }
  if (!isValidIp(nextIp)) {
    throw new Error("올바른 IPv4 또는 IPv6 주소를 입력하세요.");
  }
  if (!nextRole) {
    throw new Error("노드 역할을 입력하세요.");
  }

  if (nodes.some((node, idx) => idx !== targetIndex && node.ipAddress === nextIp)) {
    throw new Error("이미 등록된 IP 주소입니다.");
  }

  if (
    nodes.some(
      (node, idx) =>
        idx !== targetIndex && node.name.toLowerCase() === nextName.toLowerCase(),
    )
  ) {
    throw new Error("이미 등록된 노드 이름입니다.");
  }

  const updated: StoredNode = {
    ...target,
    name: nextName,
    ipAddress: nextIp,
    role: nextRole,
    labels: nextLabels,
    sshUser: nextSshUser,
    sshPort: nextSshPort,
  };

  nodes[targetIndex] = updated;
  await writeRawNodes(nodes);

  return updated;
}

export async function deleteStoredNode(id: string): Promise<void> {
  const nodes = await readRawNodes();
  const nextNodes = nodes.filter((node) => node.id !== id);
  if (nextNodes.length === nodes.length) {
    throw new Error("해당 노드를 찾을 수 없습니다.");
  }
  await writeRawNodes(nextNodes);
}

export async function listNodesWithTelemetry(): Promise<NodeRecord[]> {
  const nodes = await readRawNodes();
  return nodes.map((node) => ({
    ...node,
    telemetry: createNodeTelemetry(node),
  }));
}
