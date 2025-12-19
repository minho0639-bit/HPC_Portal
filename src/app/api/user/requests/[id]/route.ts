import { NextResponse } from "next/server";

import {
  getResourceRequest,
  cancelResourceRequest,
  deleteResourceRequest,
} from "@/lib/admin-resource-allocations";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resourceRequest = await getResourceRequest(id);

    if (!resourceRequest) {
      return NextResponse.json(
        { error: "신청을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ request: resourceRequest });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "신청을 불러오지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 먼저 신청이 존재하는지 확인
    const resourceRequest = await getResourceRequest(id);
    if (!resourceRequest) {
      return NextResponse.json(
        { error: "신청을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    await deleteResourceRequest(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "신청을 삭제하지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.action === "cancel") {
      const canceledRequest = await cancelResourceRequest(id);
      return NextResponse.json({ request: canceledRequest });
    }

    return NextResponse.json(
      { error: "지원하지 않는 액션입니다." },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "신청 상태를 변경하지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

