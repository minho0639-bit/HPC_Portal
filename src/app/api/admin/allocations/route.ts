import { NextResponse } from "next/server";

import {
  ContainerAllocationStatus,
  createContainerAllocation,
  getAllocationOverview,
  updateContainerAllocationStatus,
  listContainerAllocations,
} from "@/lib/admin-resource-allocations";
import { listStoredNodes } from "@/lib/admin-node-store";
import {
  deletePod,
  deleteDeployment,
  deleteNamespace,
  diagnosePendingPod,
} from "@/lib/admin-kubectl-cleanup";

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
    // 상태 변경 전 할당 정보 조회
    const allocations = await listContainerAllocations();
    const allocation = allocations.find((a) => a.id === allocationId);

    if (!allocation) {
      return NextResponse.json(
        { error: "할당을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 상태를 "terminated"로 변경하는 경우 Pod와 Deployment 삭제
    if (status === "terminated" && allocation.nodeId && allocation.namespace) {
      try {
        console.log(`[allocations-api] 상태를 terminated로 변경 - 리소스 삭제 시작: ${allocationId}`);
        
        // Deployment 삭제 (Pod도 함께 삭제됨)
        if (allocation.deploymentName) {
          try {
            await deleteDeployment({
              nodeId: allocation.nodeId,
              namespace: allocation.namespace,
              deploymentName: allocation.deploymentName,
            });
            console.log(`[allocations-api] Deployment 삭제 완료: ${allocation.deploymentName}`);
          } catch (deleteError) {
            console.error(`[allocations-api] Deployment 삭제 실패:`, deleteError);
            // 삭제 실패해도 상태는 변경하도록 계속 진행
          }
        }
      } catch (cleanupError) {
        console.error(`[allocations-api] 리소스 삭제 중 오류 (상태는 변경됨):`, cleanupError);
        // 삭제 실패해도 상태는 변경하도록 계속 진행
      }
    }

    // 상태 업데이트
    const updatedAllocation = await updateContainerAllocationStatus({
      allocationId,
      status,
    });
    
    return NextResponse.json({ allocation: updatedAllocation });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "할당 상태를 갱신하지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
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

  const { allocationId, action } = payload as {
    allocationId?: string;
    action?: "pod" | "deployment" | "namespace" | "diagnose";
  };

  if (!allocationId) {
    return NextResponse.json(
      { error: "할당 ID를 제공하세요." },
      { status: 400 },
    );
  }

  try {
    const allocations = await listContainerAllocations();
    const allocation = allocations.find((a) => a.id === allocationId);

    if (!allocation) {
      return NextResponse.json(
        { error: "할당을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    if (!allocation.nodeId || !allocation.namespace) {
      return NextResponse.json(
        { error: "할당 정보가 불완전합니다." },
        { status: 400 },
      );
    }

    // 진단 요청
    if (action === "diagnose" && allocation.podName) {
      const diagnosis = await diagnosePendingPod({
        nodeId: allocation.nodeId,
        namespace: allocation.namespace,
        podName: allocation.podName,
      });
      return NextResponse.json({ diagnosis });
    }

    // Pod 삭제
    if (action === "pod" && allocation.podName) {
      await deletePod({
        nodeId: allocation.nodeId,
        namespace: allocation.namespace,
        podName: allocation.podName,
      });
      return NextResponse.json({ message: "Pod가 삭제되었습니다." });
    }

    // Deployment 삭제
    if (action === "deployment" && allocation.deploymentName) {
      await deleteDeployment({
        nodeId: allocation.nodeId,
        namespace: allocation.namespace,
        deploymentName: allocation.deploymentName,
      });
      
      // 할당 상태를 terminated로 업데이트
      await updateContainerAllocationStatus({
        allocationId,
        status: "terminated",
      });
      
      return NextResponse.json({ message: "Deployment가 삭제되었습니다." });
    }

    // 네임스페이스 삭제 (모든 리소스 포함)
    if (action === "namespace") {
      await deleteNamespace({
        nodeId: allocation.nodeId,
        namespace: allocation.namespace,
      });
      
      // 할당 상태를 terminated로 업데이트
      await updateContainerAllocationStatus({
        allocationId,
        status: "terminated",
      });
      
      return NextResponse.json({ message: "네임스페이스가 삭제되었습니다." });
    }

    return NextResponse.json(
      { error: "지원하지 않는 작업입니다." },
      { status: 400 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "리소스 삭제에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

