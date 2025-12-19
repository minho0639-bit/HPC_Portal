const events = [
  {
    title: "컨테이너 최적화 핸즈온",
    date: "3월 7일(금) 14:00",
    location: "국가슈퍼컴퓨팅센터 2층 랩",
    description: "Kubernetes 기반 GPU 워크로드 성능 튜닝 실습",
  },
  {
    title: "운영 정책 웨비나",
    date: "3월 19일(수) 16:00",
    location: "Online Webinar",
    description: "자원 신청 정책과 보안 가이드 업데이트",
  },
  {
    title: "커뮤니티 밋업",
    date: "4월 2일(수) 19:00",
    location: "서울 테크허브",
    description: "산·학·연 HPC 사용자 사례 공유와 Q&A",
  },
];

export default function EventsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950/85 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_55%)]" />
      <main className="relative mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-24">
        <header className="space-y-4 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-sky-300">QuantumFlow Events</p>
          <h1 className="text-3xl font-semibold text-white">교육 & 커뮤니티 일정</h1>
          <p className="text-base text-slate-300/80">
            최신 워크숍, 웨비나, 밋업 일정을 확인하고 사전 등록하세요.
          </p>
        </header>
        <section className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/60 p-6">
          {events.map((event) => (
            <div key={event.title} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-white">{event.title}</h2>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  {event.date}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400">{event.location}</p>
              <p className="mt-3 text-sm text-slate-200/85">{event.description}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

