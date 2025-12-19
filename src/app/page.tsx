import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  FileBox,
  Gauge,
  Layers,
  ShieldCheck,
  Users,
} from "lucide-react";

const stats = [
  {
    label: "연간 처리된 프로젝트",
    value: "1,280+",
    subLabel: "산·학·연 고성능 컴퓨팅 워크로드",
  },
  {
    label: "동시 제공 코어",
    value: "92,000",
    subLabel: "GPU/CPU 하이브리드 클러스터",
  },
  {
    label: "평균 승인 소요",
    value: "48h",
    subLabel: "자동화된 검증 & 워크플로",
  },
  {
    label: "서비스 가용성",
    value: "99.95%",
    subLabel: "24/7 이중화 인프라",
  },
];

const featureSections = [
  {
    title: "Kubernetes 기반 자원 할당",
    description:
      "전용 네임스페이스, GPU/CPU 쿼터, 스토리지 정책을 자동 생성하고, 요청별로 최적화된 컨테이너 템플릿을 적용합니다.",
    icon: <Layers className="h-6 w-6 text-sky-300" />,
  },
  {
    title: "실시간 사용 모니터링",
    description:
      "프로젝트별 사용량, 큐 대기 시간, 노드 상태를 대시보드에서 즉시 확인하고, 이상 패턴을 탐지합니다.",
    icon: <Gauge className="h-6 w-6 text-sky-300" />,
  },
  {
    title: "정책 기반 워크플로",
    description:
      "승인, 연장, 반납까지 워크플로를 코드로 관리하고, 감사 로그와 히스토리를 투명하게 제공합니다.",
    icon: <ShieldCheck className="h-6 w-6 text-sky-300" />,
  },
];

const portalHighlights = [
  {
    title: "사용자 포털",
    headline: "신청부터 사용량 분석까지 하나의 화면에서",
    points: [
      "맞춤형 신청 양식과 제출 상태 실시간 추적",
      "컨테이너 엔드포인트, 네임스페이스, 접근 키 확인",
      "사용량·비용 리포트 및 로그 다운로드",
    ],
    action: { label: "사용자 대시보드 미리보기", href: "/user/dashboard" },
  },
  {
    title: "관리자 포털",
    headline: "클러스터 운영과 승인 워크플로를 자동화",
    points: [
      "대기 요청 검토 후 GPU/스토리지 즉시 할당",
      "노드 상태, 컨테이너 스케일링, 경보 대응",
      "프로젝트·조직별 정책, 사용량 리포트 관리",
    ],
    action: { label: "관리자 대시보드 보기", href: "/admin/dashboard" },
  },
];

const processSteps = [
  {
    title: "01. 자원 신청",
    description:
      "목적과 요구 자원을 선택하고 제출하면 자동으로 검증 규칙이 실행됩니다.",
  },
  {
    title: "02. 스마트 승인",
    description:
      "관리자는 사용 이력, 우선순위, 정책 적합성을 기반으로 빠르게 판단합니다.",
  },
  {
    title: "03. 네임스페이스 프로비저닝",
    description:
      "Kubernetes API 연동으로 컨테이너, 스토리지, 네트워크 구성이 완료됩니다.",
  },
  {
    title: "04. 모니터링 & 리포트",
    description:
      "실시간 지표와 월간 리포트로 운영 효율과 결과물을 추적합니다.",
  },
];

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_60%)]" />
      <div className="absolute inset-y-0 right-0 -z-10 hidden w-1/2 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),_transparent_55%)] sm:block" />

      <header className="border-b border-white/10 bg-slate-950/40 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-500/20 text-sky-300">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  aria-hidden
                >
                  <path
                    d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
                    fill="currentColor"
                    opacity="0.2"
                  />
                  <path
                    d="M12 3 4 7.5m8-4.5 8 4.5m-8-4.5v9m-8-4.5v9L12 21l8-4.5v-9"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-sky-300">
                  QuantumFlow
                </p>
                <p className="text-lg font-semibold text-slate-100">
                  AI 기반 슈퍼컴퓨팅 포털
                </p>
              </div>
            </div>
            <nav className="hidden items-center gap-10 text-sm font-medium text-slate-200 md:flex">
              <Link href="#services" className="transition hover:text-sky-200">
                서비스
              </Link>
              <Link href="#portals" className="transition hover:text-sky-200">
                포털 기능
              </Link>
              <Link href="#process" className="transition hover:text-sky-200">
                운영 프로세스
              </Link>
              <Link href="#support" className="transition hover:text-sky-200">
                지원채널
              </Link>
            </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/user/dashboard"
              className="hidden rounded-full border border-sky-400/60 px-4 py-2 text-sm font-semibold text-sky-200 transition hover:border-sky-300 hover:text-white md:inline-flex"
            >
              사용자 포털
            </Link>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              관리자 포털
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-24 px-6 pb-24 pt-16 md:pt-24">
        <section className="grid gap-12 md:grid-cols-[minmax(0,_1fr)_420px]">
          <div className="flex flex-col gap-8">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-sky-200">
              차세대 HPC 운영 플랫폼
            </span>
            <h1 className="text-4xl font-semibold leading-tight text-slate-50 md:text-5xl">
              연구와 산업을 연결하는
              <span className="block bg-gradient-to-r from-sky-300 via-cyan-200 to-white bg-clip-text text-transparent">
                통합 슈퍼컴퓨팅 자원 허브
              </span>
            </h1>
            <p className="text-lg leading-relaxed text-slate-200/80 md:text-xl">
              신청·승인·모니터링·보고까지 하나의 워크플로로 연결했습니다. 고성능
              컴퓨팅 자원을 빠르게 도입하고, 관리자는 운영 효율을 극대화하세요.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/user/dashboard"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-sky-500 px-6 py-3 text-base font-semibold text-slate-950 shadow-[0_12px_40px_rgba(56,189,248,0.35)] transition hover:bg-sky-400"
              >
                사용자 체험 시작
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/20 px-6 py-3 text-base font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100"
              >
                운영자 기능 살펴보기
                <FileBox className="h-5 w-5" />
              </Link>
            </div>
            <div className="grid gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-sky-200">
                주요 지표
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-white/10 bg-slate-900/40 p-4 shadow-inner shadow-sky-900/40"
                  >
                    <p className="text-xs uppercase tracking-wide text-slate-300/70">
                      {item.label}
                    </p>
                    <p className="mt-3 text-2xl font-semibold text-white">
                      {item.value}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">{item.subLabel}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 scale-[1.03] rounded-[32px] bg-gradient-to-br from-sky-400/40 via-cyan-300/30 to-transparent blur-3xl" />
            <div className="relative h-full rounded-[28px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_20px_60px_rgba(8,47,73,0.45)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-200">실시간 클러스터 상태</p>
                <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-medium text-emerald-300">
                  Stable
                </span>
              </div>
              <div className="mt-6 space-y-5">
                {["GPU", "CPU", "스토리지", "네트워크"].map((metric, index) => (
                  <div key={metric} className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-300">
                      <span>{metric} 사용률</span>
                      <span>{[78, 62, 55, 48][index]}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-200"
                        style={{ width: `${[78, 62, 55, 48][index]}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                <p className="text-sm font-semibold text-slate-100">
                  워크로드 예측
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  AI 기반 예측 모델이 72시간 내 GPU 사용량 15% 증가를 예상합니다.
                  사전 스케일 계획을 확인하세요.
                </p>
                <div className="mt-4 grid gap-3 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-sky-300" /> 학술 연구
                    </span>
                    <span>+9%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-teal-300" /> 산업 협력
                    </span>
                    <span>+6%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-indigo-300" /> 공공 프로젝트
                    </span>
                    <span>+4%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="space-y-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.4em] text-sky-200">
                서비스 핵심 가치
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
                HPC 운영팀과 사용자를 모두 위한 경험
              </h2>
            </div>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100"
            >
              아키텍처 개요 보기
              <BarChart3 className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {featureSections.map((feature) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 transition hover:border-sky-200/60 hover:bg-slate-900/70"
              >
                <div className="absolute inset-0 translate-y-12 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_60%)] opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10">
                  {feature.icon}
                </div>
                <h3 className="relative mt-6 text-xl font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="relative mt-4 text-sm leading-relaxed text-slate-200/80">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="portals" className="space-y-12">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium uppercase tracking-[0.35em] text-sky-200">
              통합 포털
            </p>
            <h2 className="text-3xl font-semibold text-white md:text-4xl">
              사용자와 관리자가 각자 필요한 정보에 즉시 접근합니다.
            </h2>
            <p className="text-base text-slate-300/80 md:w-2/3">
              대시보드, 신청, 모니터링, 보고 기능을 역할 기반 UI로 구성했습니다.
              동일한 데이터 모델 위에 경험을 분리해 혼선을 줄이고 협업 속도를 높입니다.
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            {portalHighlights.map((portal) => (
              <div
                key={portal.title}
                className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-slate-900/70 to-slate-950/80 p-10 shadow-[0_34px_60px_rgba(6,24,46,0.45)]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.45em] text-sky-200">
                      {portal.title}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-white">
                      {portal.headline}
                    </h3>
                  </div>
                  <div className="h-12 w-12 rounded-full border border-sky-300/50 bg-sky-400/10" />
                </div>
                <ul className="space-y-3 text-sm text-slate-200/85">
                  {portal.points.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-300" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={portal.action.href}
                  className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-sky-100 transition hover:bg-white/20"
                >
                  {portal.action.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section id="process" className="space-y-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.4em] text-sky-200">
                운영 프로세스
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
                신청부터 운영까지 네 단계의 자동화 흐름
              </h2>
            </div>
            <Link
              href="/docs/process"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100"
            >
              기술 가이드 다운로드
              <FileBox className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 lg:grid-cols-4">
            {processSteps.map((step) => (
              <div
                key={step.title}
                className="relative flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-200">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="text-sm text-slate-200/80">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="support" className="grid gap-8 rounded-3xl border border-white/10 bg-white/10 p-10 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.35em] text-sky-200">
                지원 이코시스템
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
                엔지니어링 팀과 함께 안정적인 운영을 약속합니다.
              </h2>
              <p className="mt-3 text-base text-slate-200/80 md:w-4/5">
                24/7 운영 센터, 기술 워크숍, 전담 고객 성공 매니저가 배정됩니다.
                SLA 기반의 지원 정책과 교육 프로그램으로 사용자 온보딩을 돕습니다.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6">
                <p className="text-sm font-semibold text-white">운영 지원</p>
                <div className="mt-4 space-y-3 text-sm text-slate-300/85">
                  <p className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-sky-300" />
                    보안 취약점 모니터링
                  </p>
                  <p className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-sky-300" />
                    고객 성공 매니저 배정
                  </p>
                  <p className="flex items-center gap-3">
                    <Gauge className="h-5 w-5 text-sky-300" />
                    성능 튜닝 컨설팅
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6">
                <p className="text-sm font-semibold text-white">교육 & 커뮤니티</p>
                <div className="mt-4 space-y-3 text-sm text-slate-300/85">
                  <p className="flex items-center gap-3">
                    <Layers className="h-5 w-5 text-sky-300" />
                    컨테이너 워크샵 & 핸즈온
                  </p>
                  <p className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-sky-300" />
                    리소스 최적화 베스트 프랙티스
                  </p>
                  <p className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-sky-300" />
                    사용자 그룹 & 포럼 운영
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-white/20 bg-slate-950/60 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-lg font-semibold text-white">
                컨설팅 미팅을 예약하고 상세 기능을 체험해 보세요.
              </p>
              <p className="text-sm text-slate-300/80">
                PoC 환경 제공, 맞춤형 아키텍처 설계, 비용 산정 서비스를 지원합니다.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="mailto:hpc@quantumflow.kr"
                className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
              >
                상담 신청
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/support"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100"
              >
                자료실 바로가기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-white">QuantumFlow HPC Center</p>
            <p className="mt-1 text-xs text-slate-500">
              ⓒ {new Date().getFullYear()} QuantumFlow Supercomputing Division. All rights reserved.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/terms" className="transition hover:text-sky-200">
              이용약관
            </Link>
            <Link href="/privacy" className="transition hover:text-sky-200">
              개인정보 처리방침
            </Link>
            <Link href="/status" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 transition hover:border-sky-200 hover:text-sky-100">
              시스템 상태 대시보드
              <Gauge className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
