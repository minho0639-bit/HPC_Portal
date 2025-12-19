import { NextResponse } from "next/server";

import { listNodeImages } from "@/lib/admin-node-images";

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

  try {
    const images = await listNodeImages(nodeId);

    return NextResponse.json({
      nodeId,
      images,
    });
  } catch (error) {
    console.error("[nodes.images] 이미지 목록 가져오기 실패:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "노드의 이미지 목록을 가져오지 못했습니다.",
      },
      { status: 502 },
    );
  }
}

