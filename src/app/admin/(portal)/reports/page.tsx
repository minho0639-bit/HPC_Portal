"use client";

import { useState, useEffect } from "react";
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
import {
  efficiencyMetrics,
  policyCompliance,
  optimizationTips,
  weeklyTrendNotes,
  monthlyReports,
  hourlyTrendData,
  type OrganizationUsage,
} from "@/lib/report-data";
import { generateMonthlyReportPDF } from "@/lib/report-pdf-generator";
import { HourlyTrendChart } from "@/components/reports/hourly-trend-chart";

export default function AdminReportsPage() {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [organizationBreakdown, setOrganizationBreakdown] = useState<OrganizationUsage[]>([]);
  const [isLoadingOrgData, setIsLoadingOrgData] = useState(true);

  // 실제 조직별 사용량 데이터 가져오기
  useEffect(() => {
    async function loadOrganizationData() {
      setIsLoadingOrgData(true);
      try {
        const response = await fetch("/api/admin/reports/organization-usage");
        if (!response.ok) {
          throw new Error("데이터 로드 실패");
        }
        const result = await response.json();
        setOrganizationBreakdown(result.data || []);
      } catch (error) {
        console.error("조직별 사용량 데이터 로드 실패:", error);
        setOrganizationBreakdown([]);
      } finally {
        setIsLoadingOrgData(false);
      }
    }
    loadOrganizationData();
  }, []);

  const handleDownloadPDF = async (month: string) => {
    setIsGenerating(month);
    try {
      await generateMonthlyReportPDF({
        month,
        efficiencyMetrics,
        organizationBreakdown,
        policyCompliance,
        optimizationTips,
        weeklyTrendNotes,
      });
    } catch (error) {
      console.error("PDF 생성 중 오류 발생:", error);
      alert("PDF 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(null);
    }
  };

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
            <div className="mt-6 h-48 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <HourlyTrendChart data={hourlyTrendData} className="h-full w-full" />
            </div>
            <div className="mt-4 grid gap-3 text-xs text-slate-300">
              {weeklyTrendNotes.map((note, index) => (
                <p key={index}>• {note}</p>
              ))}
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
              {isLoadingOrgData ? (
                <div className="text-center py-8 text-slate-400">데이터를 불러오는 중...</div>
              ) : organizationBreakdown.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  현재 사용 중인 조직이 없습니다.
                  <br />
                  <span className="text-xs">실행 중인 할당이 없거나 조직 정보가 없습니다.</span>
                </div>
              ) : (
                organizationBreakdown.map((org) => (
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
                ))
              )}
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
              {policyCompliance.map((policy) => (
                <div key={policy.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold text-white">{policy.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{policy.description}</p>
                </div>
              ))}
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
              {optimizationTips.map((tip, index) => (
                <div key={index} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-200">{tip.text}</p>
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
            {monthlyReports.map((report) => (
              <div key={report.month} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-200">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">월간 리포트</p>
                <p className="mt-2 text-lg font-semibold text-white">{report.month}</p>
                <p className="mt-1 text-xs text-slate-400">PDF · CSV · API</p>
                <button
                  onClick={() => handleDownloadPDF(report.month)}
                  disabled={isGenerating === report.month}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-sky-100 transition hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating === report.month ? "생성 중..." : "PDF 다운로드"}
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
