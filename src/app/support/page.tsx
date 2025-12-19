import Link from "next/link";
import { ArrowUpRight, BookOpenCheck, HeadphonesIcon, MessageSquare } from "lucide-react";

const faqs = [
  {
    question: "승인까지 얼마나 걸리나요?",
    answer: "자동 검증을 통과하면 평균 48시간 이내에 운영팀이 승인합니다. 긴급 프로젝트는 12시간 이내 처리됩니다.",
  },
  {
    question: "Kubernetes 네임스페이스 접근은 어떻게 하나요?",
    answer: "승인 이메일에 포함된 kubeconfig를 사용하거나 포털에서 직접 토큰을 발급받을 수 있습니다.",
  },
];

export default function SupportPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950/90 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_60%)]" />
      <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-24">
        <header className="space-y-4 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-sky-300">QuantumFlow Support</p>
          <h1 className="text-3xl font-semibold text-white md:text-4xl">지원 센터</h1>
          <p className="text-base text-slate-300/80">
            기술 문의, 자원 신청 가이드, 운영 정책 등 필요한 정보를 빠르게 찾아보세요.
          </p>
        </header>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 md:grid-cols-3">
          <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/50 p-5 text-sm text-slate-200">
            <HeadphonesIcon className="h-5 w-5 text-sky-200" />
            <p className="font-semibold text-white">실시간 채팅</p>
            <p className="text-sm text-slate-300/80">평일 09:00~21:00 · 평균 응답 3분</p>
            <Link
              href="mailto:support@quantumflow.kr"
              className="inline-flex items-center gap-2 text-xs font-semibold text-sky-200"
            >
              채팅/이메일 연결
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/50 p-5 text-sm text-slate-200">
            <BookOpenCheck className="h-5 w-5 text-sky-200" />
            <p className="font-semibold text-white">문서 & 가이드</p>
            <p className="text-sm text-slate-300/80">프로세스, API, 보안 정책 문서를 살펴보세요.</p>
            <Link href="/docs/process" className="inline-flex items-center gap-2 text-xs font-semibold text-sky-200">
              문서 보기
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/50 p-5 text-sm text-slate-200">
            <MessageSquare className="h-5 w-5 text-sky-200" />
            <p className="font-semibold text-white">교육 & 커뮤니티</p>
            <p className="text-sm text-slate-300/80">정기 워크숍과 커뮤니티 모임에 참여하세요.</p>
            <Link href="/events" className="inline-flex items-center gap-2 text-xs font-semibold text-sky-200">
              일정 확인
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-slate-950/60 p-6 md:grid-cols-2">
          {faqs.map((faq) => (
            <div key={faq.question} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">{faq.question}</p>
              <p className="mt-3 text-sm text-slate-300/80">{faq.answer}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

