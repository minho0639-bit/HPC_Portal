import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  CloudLightning,
  FileText,
  Plus,
  ServerCog,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { PortalHeader } from "@/components/portal/portal-header";

const templates = [
  {
    name: "GPU 집중형 분석",
    description: "대규모 딥러닝 학습, 분산 추론에 최적화된 설정",
    specs: "GPU 16기 · CPU 128 vCore · 스토리지 40TB",
  },
  {
    name: "대규모 배치 HPC",
    description: "MPI 기반 시뮬레이션, 고집적 CPU 워크로드",
    specs: "CPU 1,200 vCore · 인피니밴드 · 스토리지 80TB",
  },
  {
    name: "데이터 파이프라인",
    description: "ETL/ELT, 데이터 전처리 및 시각화 파이프라인",
    specs: "GPU 4기 · CPU 256 vCore · 오브젝트 스토리지",
  },
];

const submissions = [
  {
    id: "REQ-240312-01",
    project: "AI 단백질 접힘",
    type: "GPU 집중형 분석",
    status: "승인 완료",
    updatedAt: "2025-03-11 14:30",
    quota: "GPU 12 · CPU 480 vCore",
  },
  {
    id: "REQ-240311-02",
    project: "차세대 기후 모델",
    type: "대규모 배치 HPC",
    status: "승인 대기",
    updatedAt: "2025-03-11 09:12",
    quota: "CPU 1,000 vCore",
  },
  {
    id: "REQ-240310-06",
    project: "고속 이미지 생성",
    type: "GPU 집중형 분석",
    status: "추가 정보 요청",
    updatedAt: "2025-03-10 18:53",
    quota: "GPU 4 · CPU 120 vCore",
  },
];

const workflow = [
  {
    title: "사전 검증",
    detail: "신청서 제출 즉시 자동 검증 규칙이 실행됩니다.",
    owner: "시스템",
  },
  {
    title: "관리자 승인",
    detail: "운영팀이 정책·사용 이력을 기반으로 검토합니다.",
    owner: "운영팀",
  },
  {
    title: "Kubernetes 할당",
    detail: "네임스페이스, 리소스 쿼터, 네트워크가 자동 구성됩니다.",
    owner: "시스템",
  },
  {
    title: "사용자 알림",
    detail: "메일, 슬랙, 웹 알림으로 즉시 안내합니다.",
    owner: "QuantumFlow Bot",
  },
];

export default function UserApplicationsPage() {
  return (
    <div className="flex min-h-full flex-col">
      <PortalHeader
        title="자원 신청"
        description="새로운 프로젝트를 위한 컴퓨팅 자원을 신청하고 진행 상태를 추적하세요."
        actions={
          <>
            <Link
              href="/user/applications/new"
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_10px_25px_rgba(56,189,248,0.35)] transition hover:bg-sky-400"
            >
              신규 신청 작성
              <Plus className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/user/applications/templates"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100"
            >
              템플릿 관리
              <Sparkles className="h-3.5 w-3.5" />
            </Link>
          </>
        }
      />

      <div className="flex-1 space-y-10 px-6 py-8">
        <section className="grid gap-6 lg:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template.name}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-sky-300/60 hover:bg-slate-950/50"
            >
              <div className="absolute inset-0 translate-y-10 rounded-3xl bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_60%)] opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-200">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="relative mt-5 text-xl font-semibold text-white">
                {template.name}
              </h3>
              <p className="relative mt-3 text-sm text-slate-200/80">
                {template.description}
              </p>
              <p className="relative mt-4 text-xs text-slate-400">{template.specs}</p>
              <div className="relative mt-6">
                <Link
                  href="/user/applications/new"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100"
                >
                  템플릿 사용하기
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                신청 현황
              </p>
              <h2 className="text-2xl font-semibold text-white">진행 중인 신청</h2>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-100">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <ShieldCheck className="h-3.5 w-3.5 text-sky-200" /> 정책 검증 완료 8건
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <ServerCog className="h-3.5 w-3.5 text-sky-200" /> 자동 할당 준비 3건
              </span>
            </div>
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/5">
            <table className="min-w-full divide-y divide-white/5 text-sm text-slate-200">
              <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left">요청 ID</th>
                  <th className="px-4 py-3 text-left">프로젝트</th>
                  <th className="px-4 py-3 text-left">템플릿</th>
                  <th className="px-4 py-3 text-left">상태</th>
                  <th className="px-4 py-3 text-left">요청 자원</th>
                  <th className="px-4 py-3 text-left">업데이트</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {submissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-white/5">
                    <td className="px-4 py-4 font-semibold text-white">
                      {submission.id}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span>{submission.project}</span>
                        <span className="text-xs text-slate-400">{submission.quota}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300">
                      {submission.type}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                          submission.status === "승인 완료"
                            ? "bg-emerald-400/20 text-emerald-200"
                            : submission.status === "승인 대기"
                              ? "bg-amber-400/20 text-amber-200"
                              : "bg-rose-400/20 text-rose-200"
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {submission.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300">{submission.quota}</td>
                    <td className="px-4 py-4 text-xs text-slate-400">{submission.updatedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-slate-900/70 to-slate-950/80 p-6 lg:grid-cols-[minmax(0,_1fr)_340px]">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-sky-200">워크플로</p>
            <h3 className="mt-2 text-xl font-semibold text-white">신청 처리 흐름</h3>
            <div className="mt-6 space-y-5">
              {workflow.map((step, index) => (
                <div key={step.title} className="relative flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-300/60 bg-sky-500/15 text-xs font-semibold text-sky-200">
                      {index + 1}
                    </div>
                    {index !== workflow.length - 1 ? (
                      <div className="mt-2 h-12 w-px bg-gradient-to-b from-sky-500/60 to-transparent" />
                    ) : null}
                  </div>
                  <div className="flex-1 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">{step.title}</p>
                      <span className="text-[10px] uppercase tracking-widest text-slate-400">
                        {step.owner}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-200/80">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/70 p-5 text-sm text-slate-200">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <CloudLightning className="h-5 w-5 text-sky-200" />
              <div>
                <p className="font-semibold text-white">자동 할당 리소스 구성</p>
                <p className="text-xs text-slate-400">
                  승인 즉시 네임스페이스와 보안 정책이 생성되고, GPU/CPU 쿼터가 설정됩니다.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.45em] text-sky-200">협업</p>
              <h4 className="mt-2 text-base font-semibold text-white">공동 연구 파트너 공유</h4>
              <p className="mt-2 text-sm text-slate-200/80">
                승인된 자원은 파트너 기관과 안전하게 공유할 수 있습니다. 액세스 토큰과 SSO 연동이 포함된 초대장을 발송하세요.
              </p>
              <Link
                href="/user/applications/share"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-sky-100 transition hover:bg-white/20"
              >
                파트너 초대 관리
                <Share2 className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

