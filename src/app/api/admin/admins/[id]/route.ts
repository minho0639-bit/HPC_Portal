import { NextResponse } from "next/server";

import {
  getAdminById,
  updateAdmin,
  deleteAdmin,
} from "@/lib/admin-store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const admin = await getAdminById(id);
    if (!admin) {
      return NextResponse.json(
        { error: "관리자를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      admin: {
        ...admin,
        password: undefined, // 비밀번호는 응답에서 제외
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "관리자를 불러오지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "JSON 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  if (typeof payload !== "object" || payload === null) {
    return NextResponse.json(
      { error: "요청 본문이 비어 있거나 형식이 잘못되었습니다." },
      { status: 400 },
    );
  }

  const updates = payload as Partial<{
    name: string;
    email: string;
    password: string;
    status: "active" | "inactive";
  }>;

  try {
    const admin = await updateAdmin(id, updates);

    return NextResponse.json({
      admin: {
        ...admin,
        password: undefined, // 비밀번호는 응답에서 제외
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "관리자를 업데이트하지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await deleteAdmin(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "관리자를 삭제하지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

