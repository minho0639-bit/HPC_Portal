import { NextResponse } from "next/server";

import {
  ContainerAllocationStatus,
  createContainerAllocation,
  getAllocationOverview,
  updateContainerAllocationStatus,
} from "@/lib/admin-resource-allocations";
import { listStoredNodes } from "@/lib/admin-node-store";

export async function GET() {
  const [overview, nodes] = await Promise.all([
    getAllocationOverview(),
    listStoredNodes(),
  ]);

  return NextResponse.json({
    requests: overview.requests,
    allocations: overview.allocations,
    nodes: nodes.map((node) => ({
      id: node.id,
      name: node.name,
      role: node.role,
      ipAddress: node.ipAddress,
      labels: node.labels,
      createdAt: node.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "JSON 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { error: "요청 본문이 비어 있거나 형식이 잘못되었습니다." },
      { status: 400 },
    );
  }

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
  } = payload as Record<string, unknown>;

  const parseNumeric = (field: string, value: unknown): number => {
    if (typeof value === "number") {
      if (Number.isFinite(value)) {
        return value;
      }
      throw new Error(`${field} 값이 올바르지 않습니다.`);
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        throw new Error(`${field} 값을 입력하세요.`);
      }
      const parsed = Number.parseFloat(trimmed);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    throw new Error(`${field} 값이 올바르지 않습니다.`);
  };

  let numericValues: {
    cpuCores: number;
    gpuCount: number;
    memoryGb: number;
    storageGb: number;
  };

  try {
    numericValues = {
      cpuCores: parseNumeric("cpuCores", cpuCores),
      gpuCount: parseNumeric("gpuCount", gpuCount),
      memoryGb: parseNumeric("memoryGb", memoryGb),
      storageGb: parseNumeric("storageGb", storageGb),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "숫자 필드를 확인하세요.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const result = await createContainerAllocation({
      requestId: (requestId as string) ?? "",
      nodeId: (nodeId as string) ?? "",
      namespace: (namespace as string) ?? "",
      containerImage: (containerImage as string) ?? "",
      runtime: (runtime as string) ?? "",
      version: (version as string) ?? "",
    cpuCores: numericValues.cpuCores,
    gpuCount: numericValues.gpuCount,
    memoryGb: numericValues.memoryGb,
    storageGb: numericValues.storageGb,
      assignedBy: (assignedBy as string) ?? "",
      notes: typeof notes === "string" ? notes : undefined,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "컨테이너 할당을 생성하지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "JSON 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { error: "요청 본문이 비어 있거나 형식이 잘못되었습니다." },
      { status: 400 },
    );
  }

  const { allocationId, status } = payload as {
    allocationId?: string;
    status?: ContainerAllocationStatus;
  };

  if (!allocationId) {
    return NextResponse.json(
      { error: "할당 ID를 제공하세요." },
      { status: 400 },
    );
  }

  if (!status) {
    return NextResponse.json(
      { error: "변경할 상태를 제공하세요." },
      { status: 400 },
    );
  }

  try {
    const allocation = await updateContainerAllocationStatus({
      allocationId,
      status,
    });
    return NextResponse.json({ allocation });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "할당 상태를 갱신하지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

