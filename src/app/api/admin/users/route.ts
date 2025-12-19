import { NextResponse } from "next/server";

import {
  listUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
} from "@/lib/user-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await listUsers();
    return NextResponse.json({ users });
  } catch (error) {
    const message = error instanceof Error ? error.message : "사용자 목록을 불러오지 못했습니다.";
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
    email,
    password,
    name,
    organization,
    role,
    createdBy,
  } = payload as {
    username?: string;
    email?: string;
    password?: string;
    name?: string;
    organization?: string;
    role?: string;
    createdBy?: string;
  };

  try {
    const user = await createUser({
      username: username ?? "",
      email: email ?? "",
      password: password ?? "",
      name: name ?? "",
      organization,
      role,
      createdBy,
    });

    return NextResponse.json(
      {
        user: {
          ...user,
          password: undefined, // 비밀번호는 응답에서 제외
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "사용자를 등록하지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

