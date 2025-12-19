import Link from "next/link";
import {
  ArrowUpRight,
  BookOpenCheck,
  HeadphonesIcon,
  LifeBuoy,
  MessageSquare,
  NotebookPen,
  ShieldPlus,
  UsersRound,
} from "lucide-react";

import { PortalHeader } from "@/components/portal/portal-header";

const guideCategories = [
  {
    title: "시작 가이드",
    description: "처음 사용하는 연구자가 따라야 할 단계별 안내",
    articles: 12,
  },
  {
    title: "컨테이너 운영",
    description: "Kubernetes 네임스페이스와 이미지 관리",
    articles: 18,
  },
  {
    title: "보안 & 인증",
    description: "접근 제어, API 토큰, 감사 로그",
    articles: 9,
  },
  {
    title: "리포트 & 청구",
    description: "사용량 보고서와 비용 내역 이해하기",
    articles: 7,
  },
];

const contactChannels = [
  {
    title: "전담 고객 성공 매니저",
    description: "주요 프로젝트는 전담 매니저와 주 1회 상태 점검을 진행합니다.",
    action: "예약하기",
    href: "mailto:customer-success@quantumflow.kr",
    icon: UsersRound,
  },
  {
    title: "실시간 채팅",
    description: "평일 09:00~21:00, 평균 응답 3분 내 지원",
    action: "채팅 시작",
    href: "#",
    icon: MessageSquare,
  },
  {
    title: "24/7 장애 대응",
    description: "심각도 P1/P2 인시던트는 30분 내 대응을 시작합니다.",
    action: "핫라인 연결",
    href: "tel:+8215774205",
    icon: HeadphonesIcon,
  },
];

export default function UserSupportPage() {
  return (
    <div className="flex min-h-full flex-col">
      <PortalHeader
        title="지원 센터"
        description="매뉴얼, 교육 자료, 운영팀 연결 채널을 통해 안정적인 슈퍼컴퓨팅 환경을 지원합니다."
        actions={
          <>
            <Link
              href="/docs/api"
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_10px_25px_rgba(56,189,248,0.35)] transition hover:bg-sky-400"
            >
              API 문서 열기
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="mailto:support@quantumflow.kr"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100"
            >
              이메일 문의
              <LifeBuoy className="h-3.5 w-3.5" />
            </Link>
          </>
        }
      />

      <div className="flex-1 space-y-10 px-6 py-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                지식 베이스
              </p>
              <h2 className="text-2xl font-semibold text-white">문서 카테고리</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200">
              <BookOpenCheck className="h-3.5 w-3.5 text-sky-200" />
              총 46개 문서 업데이트 (이번달)
            </div>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {guideCategories.map((category) => (
              <Link
                key={category.title}
                href="/docs"
                className="group flex flex-col gap-3 rounded-3xl border border-white/10 bg-slate-950/50 p-5 text-sm text-slate-200 transition hover:border-sky-200 hover:text-sky-100"
              >
                <span className="text-xs uppercase tracking-[0.35em] text-slate-400">카테고리</span>
                <span className="text-lg font-semibold text-white">{category.title}</span>
                <span>{category.description}</span>
                <span className="flex items-center gap-2 text-xs text-slate-400 group-hover:text-sky-100">
                  {category.articles}개 문서 보기
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-slate-900/70 to-slate-950/80 p-6 lg:grid-cols-[minmax(0,_1.1fr)_minmax(0,_0.9fr)]">
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-200">교육 프로그램</p>
            <h3 className="mt-2 text-xl font-semibold text-white">워크숍 & 온보딩</h3>
            <div className="mt-6 grid gap-4 text-sm text-slate-200">
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <NotebookPen className="h-5 w-5 text-sky-200" />
                <div>
                  <p className="font-semibold text-white">핸즈온 워크숍</p>
                  <p className="text-xs text-slate-400">
                    매월 2회, Kubernetes 기반 컨테이너 자원 사용 및 모니터링 실습.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <ShieldPlus className="h-5 w-5 text-sky-200" />
                <div>
                  <p className="font-semibold text-white">보안 온보딩</p>
                  <p className="text-xs text-slate-400">
                    개인정보, 연구 데이터 보호를 위한 IAM 정책과 감사 로깅 활용.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <UsersRound className="h-5 w-5 text-sky-200" />
                <div>
                  <p className="font-semibold text-white">커뮤니티 밋업</p>
                  <p className="text-xs text-slate-400">
                    산·학·연 사용자 사례 공유와 협업 파트너 매칭을 지원합니다.
                  </p>
                </div>
              </div>
            </div>
            <Link
              href="/events"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-sky-100 transition hover:bg-white/20"
            >
              교육 일정 확인
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">연락 채널</p>
            <h3 className="text-xl font-semibold text-white">운영팀 연결</h3>
            {contactChannels.map((channel) => (
              <Link
                key={channel.title}
                href={channel.href}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-sky-200 hover:text-sky-100"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-200">
                  <channel.icon className="h-4 w-4" />
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="font-semibold text-white">{channel.title}</span>
                  <span className="text-xs text-slate-400">{channel.description}</span>
                </div>
                <span className="text-xs font-semibold text-sky-200">{channel.action}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

