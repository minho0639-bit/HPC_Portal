import Link from "next/link";
import { ArrowUpRight, CopyPlus, ListChecks, PencilLine } from "lucide-react";

import { PortalHeader } from "@/components/portal/portal-header";

const templates = [
  {
    name: "GPU 집중형",
    description: "딥러닝, 고해상도 렌더링 워크로드",
    resources: "GPU 16 · CPU 512 · RAM 2TB · 스토리지 80TB",
    policies: ["보안 레벨 L2", "컨테이너 이미지 서명 필수", "자동 스케일 허용"],
  },
  {
    name: "대규모 HPC",
    description: "MPI 기반 시뮬레이션 및 배치 작업",
    resources: "CPU 1,200 · RAM 4TB · 스토리지 120TB",
    policies: ["Slurm 큐 연결", "노드 고정 배정", "파일시스템 캐시 사용"],
  },
  {
    name: "데이터 파이프라인",
    description: "ETL/ELT 및 시각화 파이프라인",
    resources: "GPU 4 · CPU 256 · RAM 1TB · 오브젝트 스토리지",
    policies: ["Airflow 런타임", "자동 백업", "S3 호환 연동"],
  },
];

export default function TemplatesPage() {
  return (
    <div className="flex min-h-full flex-col">
      <PortalHeader
        title="신청 템플릿 관리"
        description="자주 사용하는 자원 구성을 템플릿으로 저장하고 팀과 공유하세요."
      />

      <div className="flex-1 space-y-8 px-6 py-8">
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-slate-200">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">템플릿 라이브러리</p>
            <p className="text-sm text-slate-300/80">자동 검증 규칙과 승인 워크플로를 함께 저장할 수 있습니다.</p>
          </div>
          <div className="flex gap-3">
            <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100">
              <PencilLine className="h-3.5 w-3.5" /> 템플릿 생성
            </button>
            <button className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-400">
              <CopyPlus className="h-3.5 w-3.5" /> 기존 템플릿 복제
            </button>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          {templates.map((template) => (
            <div key={template.name} className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/50 p-6 text-sm text-slate-200">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">템플릿</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{template.name}</h3>
                <p className="mt-2 text-xs text-slate-400">{template.description}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">자원 구성</p>
                <p className="mt-2 text-sm text-slate-200">{template.resources}</p>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {template.policies.map((policy) => (
                  <li key={policy} className="inline-flex items-center gap-2 text-left">
                    <span className="h-2 w-2 rounded-full bg-sky-300" />
                    {policy}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100">
                  상세 편집
                </button>
                <Link
                  href="/user/applications/new"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-sky-100 transition hover:bg-white/20"
                >
                  사용하기
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-white/10 via-slate-900/60 to-slate-950/80 p-6 text-sm text-slate-200">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-sky-200">
            <ListChecks className="h-4 w-4" /> 검증 규칙 버전 관리
          </div>
          <p className="mt-3 text-sm text-slate-300/80">
            템플릿마다 상이한 정책을 버전으로 저장할 수 있습니다. 승인 워크플로와 연결된 자동화 스크립트도 함께 관리됩니다.
          </p>
        </section>
      </div>
    </div>
  );
}

