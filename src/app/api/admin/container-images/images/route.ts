import { NextResponse } from "next/server";

import { listAllNodesImages } from "@/lib/admin-node-images";

export async function GET() {
  try {
    console.log("[container-images] 이미지 목록 조회 시작");
    const images = await listAllNodesImages();
    console.log(`[container-images] ${images.length}개 이미지 반환`);

    return NextResponse.json({
      images,
    });
  } catch (error) {
    console.error("[container-images] 이미지 목록 가져오기 실패:", error);
    const errorMessage = error instanceof Error ? error.message : "이미지 목록을 가져오지 못했습니다.";
    return NextResponse.json(
      {
        error: errorMessage,
        images: [], // 에러가 발생해도 빈 배열 반환하여 프론트엔드 오류 방지
      },
      { status: 200 }, // 200으로 반환하여 프론트엔드에서 에러로 처리하지 않도록
    );
  }
}

