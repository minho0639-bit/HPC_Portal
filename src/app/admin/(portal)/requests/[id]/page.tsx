import Link from "next/link";
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

type RequestDetailPageProps = {
  params: { id: string };
};

const requestMock = {
  project: "국가재난 AI 분석",
  organization: "국가재난대응본부",
  requester: "박민수 연구원",
  submittedAt: "2025-03-13 13:25",
  priority: "HIGH",
  resources: {
    gpu: 12,
    cpu: 240,
    memory: "1.2TB",
    storage: "40TB",
  },
  notes:
    "재난 상황 예측 모델을 실시간으로 학습하기 위한 GPU 리소스 요청입니다. 4월 말까지 파일럿 운영 예정이며, 공공 안전을 위해 긴급 승인 필요합니다.",
};

export default function RequestDetailPage({ params }: RequestDetailPageProps) {
  return (
    <div className="flex min-h-full flex-col">
      <PortalHeader
        title={`요청 상세 · ${params.id}`}
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
            <button className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-400">
              승인 및 할당
              <ServerCog className="h-3.5 w-3.5" />
            </button>
          </>
        }
      />

      <div className="flex-1 space-y-8 px-6 py-8">
        <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 md:grid-cols-2">
          <div className="space-y-4 text-sm text-slate-200">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">프로젝트</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{requestMock.project}</h2>
              <p className="mt-1 text-xs text-slate-400">{requestMock.organization}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200">
              <p>요청자: {requestMock.requester}</p>
              <p className="mt-2">제출 시간: {requestMock.submittedAt}</p>
              <p className="mt-2">우선순위: <span className="font-semibold text-rose-200">{requestMock.priority}</span></p>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-200">요청 리소스</p>
            <div className="mt-4 grid gap-3 text-xs">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <Flame className="h-4 w-4 text-sky-200" /> GPU {requestMock.resources.gpu}기
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <Cpu className="h-4 w-4 text-sky-200" /> CPU {requestMock.resources.cpu} vCore
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <ClipboardList className="h-4 w-4 text-sky-200" /> 메모리 {requestMock.resources.memory}
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <ClipboardList className="h-4 w-4 text-sky-200" /> 스토리지 {requestMock.resources.storage}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">신청 메모</p>
          <p className="mt-3 leading-relaxed text-slate-200/90">{requestMock.notes}</p>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-slate-900/70 to-slate-950/80 p-6 lg:grid-cols-[minmax(0,_1.1fr)_minmax(0,_0.9fr)]">
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-200">검토 의견</p>
            <textarea className="mt-4 min-h-[140px] rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-300 focus:outline-none" placeholder="승인 혹은 반려 사유를 입력하세요." />
            <div className="mt-4 flex gap-3">
              <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100">
                보완 요청
              </button>
              <button className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-400">
                승인
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
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

