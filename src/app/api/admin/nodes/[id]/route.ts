import { NextResponse } from "next/server";

import {
  deleteStoredNode,
  getStoredNode,
  updateStoredNode,
} from "@/lib/admin-node-store";

type RouteParams = { id: string };
type RouteContext = { params: RouteParams | Promise<RouteParams> };

async function resolveParams(
  params: RouteContext["params"],
): Promise<RouteParams> {
  return params instanceof Promise ? await params : params;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await resolveParams(context.params);
  const node = await getStoredNode(id);
  if (!node) {
    return NextResponse.json(
      { error: "해당 노드를 찾을 수 없습니다." },
      { status: 404 },
    );
  }
  return NextResponse.json({ node });
}

export async function PATCH(request: Request, context: RouteContext) {
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
    name,
    ipAddress,
    role,
    labels,
    sshUser,
    sshPort,
  } = payload as {
    name?: string;
    ipAddress?: string;
    role?: string;
    labels?: string[] | string;
    sshUser?: string;
    sshPort?: number | string | null;
  };

  try {
    const portValue =
      typeof sshPort === "string"
        ? Number.parseInt(sshPort, 10)
        : typeof sshPort === "number"
          ? sshPort
          : sshPort === null
            ? null
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

    const { id } = await resolveParams(context.params);

    const updated = await updateStoredNode(id, {
      name,
      ipAddress,
      role,
      labels,
      sshUser,
      sshPort: portValue === undefined ? undefined : portValue,
    });

    return NextResponse.json({ node: updated });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "노드 정보를 수정하지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await resolveParams(context.params);
    await deleteStoredNode(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "노드를 삭제하지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
