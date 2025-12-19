import { NextResponse } from "next/server";

import { createResourceRequest, listResourceRequests } from "@/lib/admin-resource-allocations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const requests = await listResourceRequests();
    return NextResponse.json({ requests });
  } catch (error) {
    const message = error instanceof Error ? error.message : "요청 목록을 불러오지 못했습니다.";
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
    project,
    owner,
    organisation,
    summary,
    preferredRuntime,
    preferredImage,
    tags,
    deadline,
    requirements,
  } = payload as {
    project?: string;
    owner?: string;
    organisation?: string;
    summary?: string;
    preferredRuntime?: string;
    preferredImage?: string;
    tags?: string[];
    deadline?: string;
    requirements?: {
      gpuCount?: number | string;
      cpuCores?: number | string;
      memoryGb?: number | string;
      storageTb?: number | string;
    };
  };

  try {
    const parseNumeric = (value: unknown, field: string): number => {
      if (typeof value === "number") {
        if (Number.isFinite(value) && value >= 0) {
          return value;
        }
        throw new Error(`${field} 값이 올바르지 않습니다.`);
      }
      if (typeof value === "string") {
        const parsed = Number.parseFloat(value.trim());
        if (Number.isFinite(parsed) && parsed >= 0) {
          return parsed;
        }
      }
      throw new Error(`${field} 값을 입력하세요.`);
    };

    if (!requirements) {
      throw new Error("자원 요구사항을 입력하세요.");
    }

    const resourceRequest = await createResourceRequest({
      project: project ?? "",
      owner: owner ?? "",
      organisation: organisation ?? "",
      summary: summary ?? "",
      preferredRuntime: preferredRuntime ?? "kubernetes",
      preferredImage: preferredImage ?? "",
      tags: tags || [],
      deadline: deadline || undefined,
      requirements: {
        gpuCount: parseNumeric(requirements.gpuCount, "GPU 개수"),
        cpuCores: parseNumeric(requirements.cpuCores, "CPU 코어"),
        memoryGb: parseNumeric(requirements.memoryGb, "메모리"),
        storageTb: parseNumeric(requirements.storageTb, "스토리지"),
      },
    });

    return NextResponse.json(
      {
        request: resourceRequest,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "자원 신청을 생성하지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

