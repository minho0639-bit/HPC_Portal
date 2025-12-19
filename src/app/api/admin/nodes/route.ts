import { NextResponse } from "next/server";

import { listStoredNodes, registerNode } from "@/lib/admin-node-store";

export async function GET() {
  const nodes = await listStoredNodes();
  return NextResponse.json({ nodes });
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

  const { name, ipAddress, role, labels, sshUser, sshPort } = payload as {
    name?: string;
    ipAddress?: string;
    role?: string;
    labels?: string[] | string;
    sshUser?: string;
    sshPort?: number | string;
  };

  try {
    const portValue =
      typeof sshPort === "string"
        ? Number.parseInt(sshPort, 10)
        : typeof sshPort === "number"
          ? sshPort
          : undefined;

    if (
      sshPort !== undefined &&
      sshPort !== null &&
      (portValue === undefined || !Number.isFinite(portValue))
    ) {
      return NextResponse.json(
        { error: "SSH 포트는 숫자만 입력할 수 있습니다." },
        { status: 400 },
      );
    }

    const node = await registerNode({
      name: name ?? "",
      ipAddress: ipAddress ?? "",
      role: role ?? "",
      labels,
      sshUser,
      sshPort:
        portValue !== undefined && Number.isFinite(portValue)
          ? (portValue as number)
          : undefined,
    });

    return NextResponse.json(
      {
        node,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "노드를 등록하지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
