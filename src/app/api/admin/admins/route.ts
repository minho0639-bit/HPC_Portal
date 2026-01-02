import { NextResponse } from "next/server";

import {
  listAdmins,
  createAdmin,
  getAdminById,
  updateAdmin,
  deleteAdmin,
} from "@/lib/admin-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admins = await listAdmins();
    return NextResponse.json({ admins: admins.map(a => ({ ...a, password: undefined })) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "관리자 목록을 불러오지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
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

  if (typeof payload !== "object" || payload === null) {
    return NextResponse.json(
      { error: "요청 본문이 비어 있거나 형식이 잘못되었습니다." },
      { status: 400 },
    );
  }

  const {
    username,
    password,
    name,
    email,
  } = payload as {
    username?: string;
    password?: string;
    name?: string;
    email?: string;
  };

  try {
    const admin = await createAdmin({
      username: username ?? "",
      password: password ?? "",
      name: name ?? "",
      email,
    });

    return NextResponse.json(
      {
        admin: {
          ...admin,
          password: undefined, // 비밀번호는 응답에서 제외
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "관리자를 등록하지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

