import Link from "next/link";
import { ArrowUpRight, Check, ClipboardList, Sparkles } from "lucide-react";

import { PortalHeader } from "@/components/portal/portal-header";

const resourceOptions = [
  { label: "GPU", description: "Tensor Core · H100/H200", defaultValue: "16" },
  { label: "CPU", description: "AMD EPYC vCore", defaultValue: "512" },
  { label: "메모리", description: "총 RAM (GB)", defaultValue: "2048" },
  { label: "스토리지", description: "고성능 병렬 스토리지 (TB)", defaultValue: "80" },
];

export default function NewApplicationPage() {
  return (
    <div className="flex min-h-full flex-col">
      <PortalHeader
        title="새로운 자원 신청"
        description="프로젝트 목적과 필요한 자원을 입력하면 자동 검증 규칙이 실행됩니다."
      />

      <div className="flex-1 space-y-8 px-6 py-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">프로젝트 정보</p>
              <h2 className="text-2xl font-semibold text-white">기본 정보 입력</h2>
            </div>
            <Link
              href="/user/applications/templates"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100"
            >
              템플릿 불러오기
              <Sparkles className="h-3.5 w-3.5" />
            </Link>
          </div>
          <form className="mt-6 grid gap-6 text-sm text-slate-200">
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.35em] text-slate-400">프로젝트 명</span>
              <input
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-300 focus:outline-none"
                placeholder="예) 양자 시뮬레이션 플랫폼 고도화"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.35em] text-slate-400">연구 목적</span>
              <textarea
                className="min-h-[120px] rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-300 focus:outline-none"
                placeholder="프로젝트 배경, 기대 성과, 협력 기관 등을 입력하세요."
              />
            </label>
            <div className="grid gap-6 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.35em] text-slate-400">프로젝트 기간</span>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    type="date"
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-sky-300 focus:outline-none"
                  />
                  <input
                    type="date"
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-sky-300 focus:outline-none"
                  />
                </div>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.35em] text-slate-400">소속 / 협력 기관</span>
                <input
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-300 focus:outline-none"
                  placeholder="예) 국가재난대응본부 · 산학협력" />
              </label>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">자원 요구사항</p>
              <h2 className="text-2xl font-semibold text-white">필요 자원 설정</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200">
              <ClipboardList className="h-3.5 w-3.5 text-sky-200" /> 자동 검증 규칙 적용
            </div>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {resourceOptions.map((option) => (
              <label key={option.label} className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-slate-950/50 p-4 text-sm">
                <span className="text-xs uppercase tracking-[0.35em] text-slate-400">{option.label}</span>
                <span className="text-slate-200">{option.description}</span>
                <input
                  defaultValue={option.defaultValue}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-sky-300 focus:outline-none"
                />
              </label>
            ))}
          </div>
          <div className="mt-6 grid gap-4 text-xs text-slate-300">
            <p>• GPU 요청 16기 이상 시 SRE 자동 검토가 추가됩니다.</p>
            <p>• 스토리지 100TB 초과 시 전용 계층을 별도 협의합니다.</p>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-slate-900/70 to-slate-950/80 p-6 lg:grid-cols-[minmax(0,_1.1fr)_minmax(0,_0.9fr)]">
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-200">전문가 검토</p>
            <h3 className="mt-2 text-lg font-semibold text-white">추가 상담 요청</h3>
            <p className="mt-3 text-sm text-slate-300/80">
              워크로드 특성이나 보안 정책상 추가 검토가 필요한 경우 메시지를 남겨주세요. 운영팀이 24시간 이내 회신합니다.
            </p>
            <textarea className="mt-4 min-h-[120px] rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-300 focus:outline-none" placeholder="예) GPU 메모리 확장 옵션 문의, 파트너 기관 공동 사용 예정" />
          </div>
          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/50 p-6 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-200">검증 요약</p>
            <div className="space-y-4">
              {[
                "자동 정책 검증 통과 (보안 레벨 L2)",
                "최근 사용량 초과 없음",
                "예상 비용 월 2,840,000원",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-200">{item}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-4 text-xs text-slate-200">
              제출 후 48시간 이내 운영팀이 검토하며, 승인 시 자동으로 네임스페이스와 자원 쿼터가 생성됩니다.
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5">
              <Check className="h-4 w-4 text-sky-200" />
            </div>
            <div>
              <p className="font-semibold text-white">제출 전 확인을 완료했습니다.</p>
              <p className="text-xs text-slate-400">정책 예외가 필요한 경우 신청서 내 메모를 남겨주세요.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100">
              임시 저장
            </button>
            <button className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-400">
              신청 제출
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

