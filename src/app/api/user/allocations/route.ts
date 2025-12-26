import { NextResponse } from "next/server";

import {
  listContainerAllocations,
  listResourceRequests,
} from "@/lib/admin-resource-allocations";

export const dynamic = "force-dynamic";

/**
 * 사용자의 할당된 컨테이너 정보를 조회합니다
 * 쿼리 파라미터로 owner 또는 requestId를 받을 수 있습니다
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const requestId = searchParams.get("requestId");

    const [allocations, requests] = await Promise.all([
      listContainerAllocations(),
      listResourceRequests(),
    ]);

    // 요청 ID로 필터링
    let filteredAllocations = allocations;
    if (requestId) {
      filteredAllocations = allocations.filter(
        (allocation) => allocation.requestId === requestId,
      );
    }

    // 사용자 이름으로 필터링
    if (owner) {
      const userRequestIds = requests
        .filter((req) => req.owner === owner)
        .map((req) => req.id);
      filteredAllocations = filteredAllocations.filter((allocation) =>
        userRequestIds.includes(allocation.requestId),
      );
    }

    // 요청 정보와 함께 반환
    const allocationsWithRequest = filteredAllocations.map((allocation) => {
      const relatedRequest = requests.find(
        (req) => req.id === allocation.requestId,
      );
      return {
        ...allocation,
        request: relatedRequest
          ? {
              id: relatedRequest.id,
              project: relatedRequest.project,
              owner: relatedRequest.owner,
              organisation: relatedRequest.organisation,
            }
          : null,
      };
    });

    return NextResponse.json({
      allocations: allocationsWithRequest,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "할당 정보를 불러오지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

