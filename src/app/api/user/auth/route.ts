import { NextResponse } from "next/server";

import { authenticateUser } from "@/lib/user-store";

export const dynamic = "force-dynamic";

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

  const { username, password } = payload as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    return NextResponse.json(
      { error: "사용자 이름과 비밀번호를 입력하세요." },
      { status: 400 },
    );
  }

  try {
    const user = await authenticateUser(username, password);
    if (!user) {
      return NextResponse.json(
        { error: "사용자 이름 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }

    return NextResponse.json({
      user: {
        ...user,
        password: undefined, // 비밀번호는 응답에서 제외
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "로그인에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

