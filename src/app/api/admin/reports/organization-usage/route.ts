import { NextResponse } from "next/server";

import { getAllocationOverview } from "@/lib/admin-resource-allocations";
import { calculateOrganizationUsage } from "@/lib/report-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { requests, allocations } = await getAllocationOverview();
    const data = calculateOrganizationUsage(requests, allocations);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "조직별 사용량 데이터를 불러오지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

