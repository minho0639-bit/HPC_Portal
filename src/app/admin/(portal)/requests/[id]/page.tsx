import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Cpu,
  Flame,
  ServerCog,
} from "lucide-react";

import { PortalHeader } from "@/components/portal/portal-header";
import { getResourceRequest } from "@/lib/admin-resource-allocations";

type RequestDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const dynamic = "force-dynamic";

export default async function RequestDetailPage({ params }: RequestDetailPageProps) {
  const { id } = await params;
  const request = await getResourceRequest(id);

  if (!request) {
    notFound();
  }

  return (
    <div className="flex min-h-full flex-col">
      <PortalHeader
        title={`요청 상세 · ${request.id}`}
        description="신청서 정보를 검토하고 승인 혹은 반려 사유를 입력하세요."
        userName="관리자"
        userRole="운영 총괄"
        avatarLabel="AD"
        actions={
          <>
            <Link
              href="/admin/requests"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> 목록으로
            </Link>
            <Link
              href={`/admin/resources/allocations?requestId=${request.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              승인 및 할당
              <ServerCog className="h-3.5 w-3.5" />
            </Link>
          </>
        }
      />

      <div className="flex-1 space-y-8 px-6 py-8">
        <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 md:grid-cols-2">
          <div className="space-y-4 text-sm text-slate-200">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">프로젝트</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{request.project}</h2>
              <p className="mt-1 text-xs text-slate-400">{request.organisation}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200">
              <p>요청자: {request.owner}</p>
              <p className="mt-2">제출 시간: {formatDateTime(request.requestedAt)}</p>
              {request.deadline && (
                <p className="mt-2">기한: {formatDateTime(request.deadline)}</p>
              )}
              <p className="mt-2">
                상태: <span className="font-semibold text-sky-200">{request.status === "pending" ? "승인 대기" : request.status === "allocating" ? "할당 중" : request.status === "fulfilled" ? "완료" : "종료"}</span>
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-200">요청 리소스</p>
            <div className="mt-4 grid gap-3 text-xs">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <Flame className="h-4 w-4 text-sky-200" /> GPU {request.requirements.gpuCount}기
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <Cpu className="h-4 w-4 text-sky-200" /> CPU {request.requirements.cpuCores} vCore
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <ClipboardList className="h-4 w-4 text-sky-200" /> 메모리 {request.requirements.memoryGb}GB
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <ClipboardList className="h-4 w-4 text-sky-200" /> 스토리지 {request.requirements.storageTb}TB
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">신청 메모</p>
          <p className="mt-3 leading-relaxed text-slate-200/90">{request.summary}</p>
          {(request.preferredRuntime || request.preferredImage) && (
            <div className="mt-4 space-y-2">
              {request.preferredRuntime && (
                <p className="text-xs text-slate-400">
                  선호 런타임: <span className="text-slate-200">{request.preferredRuntime}</span>
                </p>
              )}
              {request.preferredImage && (
                <p className="text-xs text-slate-400">
                  선호 이미지: <span className="text-slate-200">{request.preferredImage}</span>
                </p>
              )}
            </div>
          )}
          {request.tags && request.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {request.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-slate-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-slate-900/70 to-slate-950/80 p-6 lg:grid-cols-[minmax(0,_1.1fr)_minmax(0,_0.9fr)]">
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-200">검토 의견</p>
            {request.reviewerNotes && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                <p className="font-semibold text-white">기존 검토 의견</p>
                <p className="mt-2 leading-relaxed">{request.reviewerNotes}</p>
              </div>
            )}
            <textarea
              className="mt-4 min-h-[140px] w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-300 focus:outline-none"
              placeholder="승인 혹은 반려 사유를 입력하세요."
              readOnly
            />
            <div className="mt-4 flex gap-3">
              <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100">
                보완 요청
              </button>
              <Link
                href={`/admin/resources/allocations?requestId=${request.id}`}
                className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-400"
              >
                승인 및 할당
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-200">검증 체크</p>
            <ul className="mt-4 space-y-3">
              {[
                "정책 자동 검증 통과",
                "최근 사용량 초과 없음",
                "보안 레벨 L2 / IAM 정책 동기화",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-sky-200" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

