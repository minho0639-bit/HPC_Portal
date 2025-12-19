import Link from "next/link";

export default function ProcessDocsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950/80 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_60%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-24">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-sky-300">QuantumFlow Docs</p>
          <h1 className="text-3xl font-semibold text-white md:text-4xl">자원 신청 · 승인 프로세스 가이드</h1>
          <p className="text-base text-slate-300/80">
            연구자가 자원을 신청하고, 운영팀이 승인하여 Kubernetes 자원이 자동 할당되기까지의 전체 흐름을 단계별로 정리했습니다.
          </p>
        </header>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-slate-950/70 p-6">
          {["요청 제출", "자동 검증", "운영 승인", "네임스페이스 생성", "사용 모니터링"].map((step, index) => (
            <div key={step} className="flex gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-sky-300/60 bg-sky-500/10 text-sm font-semibold text-sky-200">
                {index + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{step}</p>
                <p className="mt-2 text-sm text-slate-300/80">
                  {index === 0
                    ? "템플릿을 통해 연구 목적과 자원 요구사항을 제출합니다."
                    : index === 1
                      ? "정책 규칙과 보안 기준에 따라 자동 검증이 실행됩니다."
                      : index === 2
                        ? "운영팀이 우선순위와 사용 이력을 검토 후 승인합니다."
                        : index === 3
                          ? "승인 즉시 Kubernetes 네임스페이스와 쿼터가 생성됩니다."
                          : "실시간 모니터링과 리포트가 자동 제공됩니다."}
                </p>
              </div>
            </div>
          ))}
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-slate-200">
          <div>
            <p className="font-semibold text-white">추가 문서가 필요하신가요?</p>
            <p className="text-xs text-slate-400">운영 정책, 보안 가이드, API 문서는 지원 센터에서 확인하실 수 있습니다.</p>
          </div>
          <Link
            href="/support"
            className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-400"
          >
            지원 센터로 이동
          </Link>
        </footer>
      </div>
    </div>
  );
}

