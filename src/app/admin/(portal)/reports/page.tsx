import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  CalendarRange,
  ClipboardSignature,
  FileText,
  LineChart,
  PieChart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { PortalHeader } from "@/components/portal/portal-header";

const efficiencyMetrics = [
  {
    label: "GPU 효율",
    value: "86%",
    change: "+4.2%",
    detail: "우선순위 정책 적용 후",
  },
  {
    label: "CPU 효율",
    value: "79%",
    change: "+2.7%",
    detail: "큐 정렬 최적화",
  },
  {
    label: "큐 대기 시간",
    value: "3.8분",
    change: "-1.2분",
    detail: "SLA 10분 이하 유지",
  },
  {
    label: "자원 활용률",
    value: "82%",
    change: "+3.5%",
    detail: "전체 클러스터 기준",
  },
];

const organizationBreakdown = [
  { name: "국가기상센터", share: 28, hours: 12_480 },
  { name: "국가재난대응본부", share: 24, hours: 10_920 },
  { name: "생명정보융합연구단", share: 19, hours: 9_210 },
  { name: "산업협력 R&D", share: 17, hours: 7_640 },
  { name: "기타", share: 12, hours: 4_320 },
];

export default function AdminReportsPage() {
  return (
    <div className="flex min-h-full flex-col">
      <PortalHeader
        title="리포트 & 정책"
        description="자원 사용 데이터를 분석하고 정책 준수 현황을 검토하여 운영 전략을 최적화하세요."
        userName="관리자"
        userRole="운영 총괄"
        avatarLabel="AD"
        actions={
          <>
            <button className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_10px_25px_rgba(56,189,248,0.35)] transition hover:bg-sky-400">
              월간 리포트 생성
              <BarChart3 className="h-3.5 w-3.5" />
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100">
              기간 선택
              <CalendarRange className="h-3.5 w-3.5" />
            </button>
          </>
        }
      />

      <div className="flex-1 space-y-10 px-6 py-8">
        <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 md:grid-cols-4">
          {efficiencyMetrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">{metric.label}</p>
              <p className="mt-4 text-2xl font-semibold text-white">{metric.value}</p>
              <p className="mt-2 text-xs font-semibold text-sky-200">{metric.change}</p>
              <p className="mt-1 text-xs text-slate-400">{metric.detail}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,_1.2fr)_minmax(0,_0.8fr)]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">주간 사용량</p>
                <h3 className="mt-2 text-xl font-semibold text-white">시간대별 트렌드</h3>
              </div>
              <LineChart className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-6 h-48 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50">
              <div className="h-full bg-[radial-gradient(circle_at_bottom,_rgba(56,189,248,0.28),_transparent_65%)]" />
              <div className="absolute" />
            </div>
            <div className="mt-4 grid gap-3 text-xs text-slate-300">
              <p>• 새벽 02~05시 GPU 사용률 92% → 야간 큐 재배치 필요</p>
              <p>• 산업 협력 프로젝트 CPU 사용량 주간 평균 +7% 증가</p>
              <p>• 네임스페이스 자동 스케일 이벤트 18건, 실패 0건</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-slate-900/70 to-slate-950/80 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-sky-200">조직별 분포</p>
                <h3 className="mt-2 text-lg font-semibold text-white">사용 비중</h3>
              </div>
              <PieChart className="h-4 w-4 text-slate-300" />
            </div>
            <div className="mt-6 space-y-4 text-sm text-slate-200">
              {organizationBreakdown.map((org) => (
                <div key={org.name} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">{org.name}</p>
                    <span className="text-xs font-semibold text-sky-200">{org.share}%</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">누적 사용 {org.hours.toLocaleString()} core-hr</p>
                  <div className="mt-3 h-2 rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-200"
                      style={{ width: `${org.share}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 lg:grid-cols-[minmax(0,_1.05fr)_minmax(0,_0.95fr)]">
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">정책 준수</p>
                <h3 className="mt-2 text-xl font-semibold text-white">보안 & 감사</h3>
              </div>
              <ShieldCheck className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-6 grid gap-4 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">접근 제어</p>
                <p className="mt-1 text-xs text-slate-400">MFA 미등록 계정 2건 → 메일 발송 완료</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">데이터 보관 정책</p>
                <p className="mt-1 text-xs text-slate-400">14건 만료 예정 → 자동 아카이브 준비</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">정책 위반</p>
                <p className="mt-1 text-xs text-slate-400">이번 달 0건 (전달 3건 대비 개선)</p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200">
              정책 리포트는 월 1회 감사위원회에 공유됩니다. 예외 승인 내역은 별도 PDF 첨부.
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 text-sm text-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-sky-200">자동 제안</p>
                <h3 className="mt-2 text-lg font-semibold text-white">최적화 추천</h3>
              </div>
              <Sparkles className="h-4 w-4 text-slate-300" />
            </div>
            <div className="mt-6 space-y-4">
              {[
                "GPU 풀에 야간 자동 스케일 전략 적용 시 효율 +6%",
                "스토리지 tier-2 데이터 18TB 아카이빙 권장",
                "큐 정책에서 산업 협력 프로젝트 가중치 +0.3 필요",
              ].map((tip) => (
                <div key={tip} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-200">{tip}</p>
                </div>
              ))}
            </div>
            <Link
              href="/admin/resources"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-sky-100 transition hover:bg-white/20"
            >
              자원 정책 업데이트
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">보고서 아카이브</p>
              <h3 className="text-xl font-semibold text-white">PDF / CSV 다운로드</h3>
            </div>
            <div className="flex gap-3 text-xs font-semibold text-slate-200">
              <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 transition hover:border-sky-200 hover:text-sky-100">
                <FileText className="h-3.5 w-3.5" /> PDF 저장
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 transition hover:border-sky-200 hover:text-sky-100">
                <ClipboardSignature className="h-3.5 w-3.5" /> 전자 서명 요청
              </button>
            </div>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {["2025-02", "2025-01", "2024-12", "2024-11"].map((month) => (
              <div key={month} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-200">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">월간 리포트</p>
                <p className="mt-2 text-lg font-semibold text-white">{month}</p>
                <p className="mt-1 text-xs text-slate-400">PDF · CSV · API</p>
                <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-sky-100 transition hover:bg-white/20">
                  다운로드
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

