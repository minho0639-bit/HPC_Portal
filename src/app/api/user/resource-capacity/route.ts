import { NextResponse } from "next/server";

import { getResourceCapacity } from "@/lib/resource-capacity-store";

export const dynamic = "force-dynamic";

/**
 * 사용자 포털에서 리소스 용량 정보를 조회합니다
 */
export async function GET() {
  try {
    const capacity = await getResourceCapacity();
    return NextResponse.json({
      capacity,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "리소스 용량 정보를 불러오지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

