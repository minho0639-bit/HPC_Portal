import { NextResponse } from "next/server";

import { getStoredNode } from "@/lib/admin-node-store";
import { createNodeResourceSnapshot } from "@/lib/admin-node-resources";

type RouteParams = { id: string };
type RouteContext = { params: RouteParams | Promise<RouteParams> };

async function resolveParams(
  params: RouteContext["params"],
): Promise<RouteParams> {
  return params instanceof Promise ? await params : params;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id: nodeId } = await resolveParams(context.params);

  if (!nodeId) {
    return NextResponse.json(
      { error: "노드 ID가 필요합니다." },
      { status: 400 },
    );
  }

  const node = await getStoredNode(nodeId);

  if (!node) {
    return NextResponse.json(
      { error: "요청한 노드를 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  try {
    const resources = await createNodeResourceSnapshot(node);

    return NextResponse.json({
      node: {
        id: node.id,
        name: node.name,
        ipAddress: node.ipAddress,
        role: node.role,
        labels: node.labels,
        createdAt: node.createdAt,
        sshUser: node.sshUser,
        sshPort: node.sshPort,
      },
      resources,
    });
  } catch (error) {
    console.error("[nodes.resources] 리소스 수집 실패:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "노드 리소스를 수집하지 못했습니다.",
      },
      { status: 502 },
    );
  }
}
