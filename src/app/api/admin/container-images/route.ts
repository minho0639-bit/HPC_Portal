import { NextResponse } from "next/server";

import {
  listRegistries,
  listTemplates,
  createRegistry,
  createTemplate,
  deleteRegistry,
  deleteTemplate,
  updateTemplate,
  recordTemplateUsage,
  searchImages,
  type ContainerImageRegistry,
  type ContainerImageTemplate,
} from "@/lib/container-image-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  try {
    if (action === "search") {
      const query = searchParams.get("q") ?? "";
      const limit = Number.parseInt(searchParams.get("limit") ?? "10", 10);
      const results = await searchImages(query, limit);
      return NextResponse.json({ images: results });
    }

    if (action === "registries") {
      const registries = await listRegistries();
      return NextResponse.json({ registries });
    }

    if (action === "templates") {
      const templates = await listTemplates();
      return NextResponse.json({ templates });
    }

    // 기본: 모든 데이터 반환
    const [registries, templates] = await Promise.all([
      listRegistries(),
      listTemplates(),
    ]);

    return NextResponse.json({
      registries,
      templates,
    });
  } catch (error) {
    console.error("[container-images] GET 오류:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "이미지 데이터를 불러오지 못했습니다.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      type: "registry" | "template";
      data: Partial<ContainerImageRegistry | ContainerImageTemplate>;
    };

    if (body.type === "registry") {
      const registry = await createRegistry(
        body.data as Omit<ContainerImageRegistry, "id" | "createdAt">,
      );
      return NextResponse.json({ registry });
    }

    if (body.type === "template") {
      const template = await createTemplate(
        body.data as Omit<
          ContainerImageTemplate,
          "id" | "usageCount" | "createdAt"
        >,
      );
      return NextResponse.json({ template });
    }

    return NextResponse.json(
      { error: "잘못된 타입입니다. 'registry' 또는 'template'를 지정하세요." },
      { status: 400 },
    );
  } catch (error) {
    console.error("[container-images] POST 오류:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "이미지를 생성하지 못했습니다.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      templateId: string;
      updates?: Partial<
        Omit<ContainerImageTemplate, "id" | "createdAt" | "usageCount">
      >;
      recordUsage?: boolean;
    };

    // 사용 기록만 하는 경우
    if (body.recordUsage) {
      const template = await recordTemplateUsage(body.templateId);
      return NextResponse.json({ template });
    }

    // 일반 업데이트
    if (body.updates) {
      const template = await updateTemplate(body.templateId, body.updates);
      return NextResponse.json({ template });
    }

    return NextResponse.json(
      { error: "updates 또는 recordUsage가 필요합니다." },
      { status: 400 },
    );
  } catch (error) {
    console.error("[container-images] PATCH 오류:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "템플릿을 업데이트하지 못했습니다.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json(
        { error: "type과 id 파라미터가 필요합니다." },
        { status: 400 },
      );
    }

    if (type === "registry") {
      await deleteRegistry(id);
      return NextResponse.json({ success: true });
    }

    if (type === "template") {
      await deleteTemplate(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "잘못된 타입입니다." },
      { status: 400 },
    );
  } catch (error) {
    console.error("[container-images] DELETE 오류:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "삭제하지 못했습니다.",
      },
      { status: 500 },
    );
  }
}

