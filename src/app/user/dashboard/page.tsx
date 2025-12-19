import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  CalendarCheck,
  Clock3,
  Cpu,
  Database,
  Flame,
  Gauge,
  LifeBuoy,
  MonitorSmartphone,
  Route,
} from "lucide-react";

import { PortalHeader } from "@/components/portal/portal-header";

const quotaSummary = [
  {
    title: "GPU 쿼터",
    value: "36 / 48",
    subtitle: "NVIDIA H100 · 프로젝트 4개",
    trend: "+12% 이번주 사용",
    icon: Flame,
    accent: "from-orange-400/40 via-rose-400/30 to-transparent",
  },
  {
    title: "CPU 코어",
    value: "3.2k / 5k",
    subtitle: "AMD EPYC · 배치 큐 2개",
    trend: "안정",
    icon: Cpu,
    accent: "from-sky-400/40 via-cyan-300/30 to-transparent",
  },
  {
    title: "스토리지",
    value: "412TB / 512TB",
    subtitle: "고성능 병렬 스토리지",
    trend: "+4% 전일 대비",
    icon: Database,
    accent: "from-emerald-400/40 via-teal-300/30 to-transparent",
  },
];

const activeProjects = [
  {
    name: "양자 시뮬레이션 플랫폼",
    code: "QSIM-23A",
    status: "Running",
    timeline: "D-24",
    nodes: "GPU x24",
    owner: "양자컴퓨팅연구실",
  },
  {
    name: "차세대 기후 모델",
    code: "CLIMATE-X",
    status: "Scheduled",
    timeline: "D-3",
    nodes: "CPU x320",
    owner: "국가기상센터",
  },
  {
    name: "AI 단백질 접힘",
    code: "BIO-FOLD",
    status: "Running",
    timeline: "D-12",
    nodes: "GPU x12",
    owner: "생명정보융합연구단",
  },
];

const activityStream = [
  {
    title: "GPU 네임스페이스 auto-scaling 성공",
    time: "15분 전",
    detail: "QSIM-23A / replica 12 → 16",
  },
  {
    title: "신규 자원 신청 승인",
    time: "3시간 전",
    detail: "CLIMATE-X / GPU 8기",
  },
  {
    title: "스토리지 스냅샷 생성",
    time: "어제 23:40",
    detail: "BIO-FOLD / 2.3TB",
  },
];

const milestones = [
  {
    title: "Research Workshop: 컨테이너 최적화",
    date: "3월 7일(금)",
    type: "교육",
    icon: MonitorSmartphone,
  },
  {
    title: "정기 점검 예정",
    date: "3월 12일(수) 02:00-04:00",
    type: "점검",
    icon: Clock3,
  },
  {
    title: "성과보고서 제출 마감",
    date: "3월 28일(금)",
    type: "리포트",
    icon: Route,
  },
];

export default function UserDashboardPage() {
  return (
    <div className="flex min-h-full flex-col">
      <PortalHeader
        title="대시보드"
        description="현재 할당된 자원과 프로젝트 진행 상황을 한눈에 확인하세요."
        actions={
          <>
            <Link
              href="/user/applications/new"
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_12px_30px_rgba(56,189,248,0.35)] transition hover:bg-sky-400"
            >
              신규 자원 신청
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/user/support"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100"
            >
              운영 지원 연결
              <LifeBuoy className="h-3.5 w-3.5" />
            </Link>
          </>
        }
      />

      <div className="flex-1 space-y-10 px-6 py-8">
        <section className="grid gap-6 xl:grid-cols-3">
          {quotaSummary.map((item) => (
            <div
              key={item.title}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <div
                className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${item.accent}`}
              />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300/80">
                    {item.title}
                  </p>
                  <p className="mt-4 text-3xl font-semibold text-white">{item.value}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-slate-100">
                  <item.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-300/75">{item.subtitle}</p>
              <p className="mt-2 text-xs font-semibold text-sky-200">{item.trend}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,_1fr)_360px]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-300/80">
                  프로젝트 현황
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">활성 프로젝트</h2>
              </div>
              <Link
                href="/user/usage"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100"
              >
                전체 보기
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/5">
              <table className="min-w-full divide-y divide-white/5 text-sm">
                <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left">프로젝트</th>
                    <th className="px-4 py-3 text-left">상태</th>
                    <th className="px-4 py-3 text-left">노드/큐</th>
                    <th className="px-4 py-3 text-left">담당</th>
                    <th className="px-4 py-3 text-left">남은 기간</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {activeProjects.map((project) => (
                    <tr key={project.code} className="hover:bg-white/5">
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{project.name}</span>
                          <span className="text-xs text-slate-400">{project.code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                            project.status === "Running"
                              ? "bg-emerald-400/20 text-emerald-200"
                              : "bg-amber-400/20 text-amber-200"
                          }`}
                        >
                          {project.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">{project.nodes}</td>
                      <td className="px-4 py-4 text-sm">{project.owner}</td>
                      <td className="px-4 py-4 text-sm">{project.timeline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300/80">
                    활동 로그
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">최근 알림</h3>
                </div>
                <Gauge className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-4 space-y-4">
                {activityStream.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{item.detail}</p>
                    <p className="mt-2 text-[11px] uppercase tracking-widest text-sky-200">
                      {item.time}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300/80">
                    일정 & 마일스톤
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">다가오는 일정</h3>
                </div>
                <CalendarCheck className="h-4 w-4 text-slate-400" />
              </div>
              <ul className="mt-4 space-y-4 text-sm text-slate-200">
                {milestones.map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-200">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{item.title}</span>
                      <span className="text-xs text-slate-400">{item.date}</span>
                      <span className="mt-1 text-[10px] uppercase tracking-widest text-sky-200">
                        {item.type}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-slate-900/70 to-slate-950/80 p-6 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-200">Kubernetes</p>
            <h3 className="text-xl font-semibold text-white">컨테이너 상태 요약</h3>
            <p className="text-sm text-slate-300/80">
              GPU 최적화 큐는 평균 4분 이내로 작업이 시작되고 있습니다. 자동 스케일 정책이 적용되어 큐 길이가 일정 수준을 넘으면 즉시 노드를 확장합니다.
            </p>
            <div className="grid gap-2 text-xs text-slate-200">
              {["네임스페이스", "컨테이너", "잡 완료율", "이벤트"].map((label, index) => (
                <div key={label} className="flex items-center gap-4">
                  <span className="w-24 text-slate-400">{label}</span>
                  <div className="flex-1 rounded-full bg-white/5">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-200"
                      style={{ width: `${[82, 74, 91, 66][index]}%` }}
                    />
                  </div>
                  <span>{[82, 74, 91, 66][index]}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/60 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                  실시간 모니터링
                </p>
                <h4 className="mt-2 text-base font-semibold text-white">큐 대기 시간</h4>
              </div>
              <Activity className="h-4 w-4 text-slate-400" />
            </div>
            <div className="relative h-36 overflow-hidden">
              <div className="absolute inset-0 grid grid-cols-12 gap-2">
                {Array.from({ length: 24 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-end justify-center"
                  >
                    <div
                      className="w-3 rounded-t-full bg-gradient-to-t from-sky-500 via-cyan-300 to-white/80"
                      style={{ height: `${40 + Math.sin(idx) * 20 + (idx % 5 === 0 ? 30 : 10)}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="absolute bottom-0 left-0 right-0 grid grid-cols-4 text-[10px] uppercase tracking-widest text-slate-400">
                <span>00시</span>
                <span className="text-center">06시</span>
                <span className="text-center">12시</span>
                <span className="text-right">18시</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200">
              최근 24시간 동안 평균 대기 시간은 3.8분이며, SLA 10분 기준 대비 여유가 있습니다.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

