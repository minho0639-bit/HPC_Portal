const privacySections = [
  {
    title: "수집하는 개인정보 항목",
    content: "이름, 소속 기관, 연락처, 시스템 접근 로그 등 자원 사용과 관련된 최소한의 정보를 수집합니다.",
  },
  {
    title: "개인정보의 이용 목적",
    content: "자원 신청 승인, 보안 감사, 서비스 개선 및 통계 분석을 위해서만 사용됩니다.",
  },
  {
    title: "보관 및 파기",
    content: "관련 법령에 따라 3년간 보관하며, 보관 기간 종료 후에는 즉시 파기합니다.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950/85 px-6 py-20 text-slate-100">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-sky-300">QuantumFlow</p>
          <h1 className="text-3xl font-semibold text-white">개인정보 처리방침</h1>
          <p className="text-sm text-slate-300/80">2025년 3월 1일 개정</p>
        </header>
        <section className="space-y-6 rounded-3xl border border-white/10 bg-slate-950/60 p-6 text-sm leading-relaxed text-slate-200">
          {privacySections.map((section) => (
            <div key={section.title} className="space-y-2">
              <h2 className="text-base font-semibold text-white">{section.title}</h2>
              <p>{section.content}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

