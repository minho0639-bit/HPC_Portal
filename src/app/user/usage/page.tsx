"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  CalendarRange,
  Clock9,
  Library,
  PieChart,
  RefreshCcw,
  Sparkles,
  SquareStack,
  TrendingUp,
} from "lucide-react";

import { PortalHeader } from "@/components/portal/portal-header";
import { getUserFromSession, type UserData } from "@/lib/user-client";

const usageOverview: Array<{
  title: string;
  value: string;
  change: string;
  subtext: string;
}> = [];

const projectUsage: Array<{
  name: string;
  gpu: string;
  cpu: string;
  storage: string;
}> = [];

const optimizationTips: Array<{
  title: string;
  description: string;
}> = [];

export default function UserUsagePage() {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const userData = getUserFromSession();
    setUser(userData);
  }, []);

  function getAvatarLabel(name: string): string {
    if (name.length >= 2) {
      return name.substring(name.length - 2).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase().padEnd(2, name[0] || "U");
  }

  return (
    <div className="flex min-h-full flex-col">
      <PortalHeader
        title="사용 현황"
        description="프로젝트별 자원 사용량과 효율을 분석하고 최적화 권장 사항을 확인하세요."
        userName={user?.name || "사용자"}
        userRole={user?.organization || user?.role || "사용자 조직"}
        avatarLabel={user ? getAvatarLabel(user.name) : "U"}
        actions={
          <>
            <button className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_10px_25px_rgba(56,189,248,0.35)] transition hover:bg-sky-400">
              보고서 내보내기
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100">
              기간 설정
              <CalendarRange className="h-3.5 w-3.5" />
            </button>
          </>
        }
      />

      <div className="flex-1 space-y-10 px-6 py-8">
        {usageOverview.length > 0 && (
          <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 md:grid-cols-4">
            {usageOverview.map((metric) => (
            <div key={metric.title} className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                {metric.title}
              </p>
              <p className="mt-4 text-2xl font-semibold text-white">{metric.value}</p>
              <p className="mt-2 text-xs font-semibold text-sky-200">{metric.change}</p>
              <p className="mt-1 text-xs text-slate-400">{metric.subtext}</p>
            </div>
            ))}
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,_1.2fr)_minmax(0,_0.8fr)]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                  프로젝트 별 사용량
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">상세 지표</h2>
              </div>
              <div className="flex gap-2">
                <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100">
                  실시간 갱신
                  <RefreshCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/5">
              <table className="min-w-full divide-y divide-white/5 text-sm text-slate-200">
                <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left">프로젝트</th>
                    <th className="px-4 py-3 text-left">GPU 사용률</th>
                    <th className="px-4 py-3 text-left">CPU 사용량</th>
                    <th className="px-4 py-3 text-left">스토리지</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {projectUsage.length > 0 ? (
                    projectUsage.map((project) => (
                      <tr key={project.name} className="hover:bg-white/5">
                        <td className="px-4 py-4 font-semibold text-white">
                          {project.name}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2.5 w-24 rounded-full bg-white/5">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-200"
                                style={{ width: project.gpu }}
                              />
                            </div>
                            <span className="text-sm text-slate-200">{project.gpu}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-300">{project.cpu}</td>
                        <td className="px-4 py-4 text-sm text-slate-300">{project.storage}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-400">
                        사용 현황 데이터가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                    워크로드 분포
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">리소스 조합</h3>
                </div>
                <PieChart className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-6 grid gap-4 text-sm text-slate-200">
                {projectUsage.length > 0 ? (() => {
                  // 실제 데이터 기반으로 리소스 사용률 계산
                  const totalGpu = projectUsage.reduce((sum, p) => {
                    const gpuValue = parseFloat(p.gpu.replace('%', ''));
                    return sum + (isNaN(gpuValue) ? 0 : gpuValue);
                  }, 0);
                  const totalCpu = projectUsage.reduce((sum, p) => {
                    const cpuValue = parseFloat(p.cpu.replace(' core', '').replace(',', ''));
                    return sum + (isNaN(cpuValue) ? 0 : cpuValue);
                  }, 0);
                  const totalMemory = projectUsage.reduce((sum, p) => {
                    const memValue = parseFloat(p.storage.replace('TB', '').replace(',', ''));
                    return sum + (isNaN(memValue) ? 0 : memValue);
                  }, 0);

                  const maxTotal = Math.max(totalGpu, totalCpu, totalMemory);
                  const gpuPercent = maxTotal > 0 ? (totalGpu / maxTotal) * 100 : 0;
                  const cpuPercent = maxTotal > 0 ? (totalCpu / maxTotal) * 100 : 0;
                  const memoryPercent = maxTotal > 0 ? (totalMemory / maxTotal) * 100 : 0;
                  const ioPercent = 100 - gpuPercent - cpuPercent - memoryPercent;

                  const resources = [
                    { label: "GPU", percent: Math.min(gpuPercent, 100), color: "#38bdf8" },
                    { label: "CPU", percent: Math.min(cpuPercent, 100), color: "#22d3ee" },
                    { label: "스토리지", percent: Math.min(memoryPercent, 100), color: "#f97316" },
                    { label: "기타", percent: Math.max(0, Math.min(ioPercent, 100)), color: "#a855f7" },
                  ].filter(r => r.percent > 0);

                  return resources.map((resource, index) => (
                    <div key={resource.label} className="flex items-center gap-4">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: resource.color }} />
                      <div className="flex-1 rounded-full bg-white/5">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${resource.percent}%`,
                            background: `linear-gradient(90deg, ${resource.color} 0%, rgba(255,255,255,0.7) 100%)`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-400">{resource.percent.toFixed(1)}%</span>
                    </div>
                  ));
                })() : (
                  <div className="text-center text-sm text-slate-400 py-4">
                    데이터가 없어 워크로드 분포를 계산할 수 없습니다.
                  </div>
                )}
              </div>
              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-slate-200">
                GPU 사용률이 70%를 초과할 경우 자동으로 우선순위 조절이 실행됩니다.
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                    최적화 제안
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">추천 액션</h3>
                </div>
                <Sparkles className="h-4 w-4 text-slate-400" />
              </div>
              <ul className="mt-4 space-y-4 text-sm text-slate-200">
                {optimizationTips.length > 0 ? (
                  optimizationTips.map((tip) => (
                    <li key={tip.title} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <p className="font-semibold text-white">{tip.title}</p>
                      <p className="mt-2 text-sm text-slate-300/80">{tip.description}</p>
                    </li>
                  ))
                ) : (
                  <li className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-center text-sm text-slate-400">
                    최적화 제안이 없습니다.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </section>

        {usageOverview.length > 0 && (
          <section className="grid gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-slate-900/70 to-slate-950/80 p-6 md:grid-cols-[minmax(0,_0.7fr)_minmax(0,_1.3fr)]">
          <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/60 p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-200">시간대 분석</p>
            <h3 className="text-lg font-semibold text-white">시간대별 사용 패턴</h3>
            <div className="relative h-40 overflow-hidden">
              <div className="absolute inset-0 grid grid-cols-6 gap-2">
                {Array.from({ length: 18 }).map((_, idx) => (
                  <div key={idx} className="flex items-end justify-center">
                    <div
                      className="w-4 rounded-t-full bg-gradient-to-t from-sky-500 via-cyan-300 to-white/70"
                      style={{ height: `${30 + Math.cos(idx) * 20 + (idx % 3 === 0 ? 25 : 8)}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="absolute bottom-0 left-0 right-0 grid grid-cols-3 text-[10px] uppercase tracking-widest text-slate-400">
                <span>심야</span>
                <span className="text-center">주간</span>
                <span className="text-right">야간</span>
              </div>
            </div>
            <p className="text-xs text-slate-300/80">
              새벽 시간대에 GPU 사용률이 65% 이상으로 상승합니다. 배치 작업 스케줄 조정으로 균형을 맞추세요.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                  큐 지표
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">큐 대기 & 처리량</h3>
              </div>
              <SquareStack className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-6 grid gap-3 text-sm text-slate-200">
              {["고우선순위 큐", "일반 큐", "배치 큐"].map((queue, index) => (
                <div key={queue} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">{queue}</p>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase tracking-widest text-slate-300">
                      <Clock9 className="h-3.5 w-3.5" />
                      {index === 0 ? "2.4분" : index === 1 ? "4.2분" : "6.7분"}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-20 text-slate-400">처리량</span>
                      <div className="flex-1 rounded-full bg-white/5">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-300"
                          style={{ width: `${[92, 78, 65][index]}%` }}
                        />
                      </div>
                      <span>{[92, 78, 65][index]}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-20 text-slate-400">성공률</span>
                      <div className="flex-1 rounded-full bg-white/5">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-sky-500 via-cyan-300 to-white/80"
                          style={{ width: `${[99, 95, 91][index]}%` }}
                        />
                      </div>
                      <span>{[99, 95, 91][index]}%</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-slate-300/80">
                    {index === 0
                      ? "긴급 업무가 평균 2.4분 내 시작됩니다."
                      : index === 1
                        ? "가장 많은 작업이 진행되는 기본 큐입니다."
                        : "대규모 배치 작업은 새벽 시간대에 집중되어 있습니다."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        )}

        {usageOverview.length > 0 && (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                리포트 아카이브
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">월간 보고서 다운로드</h3>
            </div>
            <Library className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {["2025-02", "2025-01", "2024-12", "2024-11"].map((month) => (
              <button
                key={month}
                className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-left text-sm text-slate-200 transition hover:border-sky-200 hover:text-sky-100"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.35em] text-slate-400">
                    월간 보고서
                  </span>
                  <TrendingUp className="h-4 w-4 text-sky-200 group-hover:text-white" />
                </div>
                <span className="text-lg font-semibold text-white">{month}</span>
                <span className="text-xs text-slate-400">PDF · 24페이지</span>
              </button>
            ))}
          </div>
        </section>
        )}
      </div>
    </div>
  );
}

