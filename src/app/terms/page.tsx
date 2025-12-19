const sections = [
  {
    title: "제1조 (목적)",
    content:
      "이 약관은 QuantumFlow 슈퍼컴퓨팅 포털(이하 ‘포털’)이 제공하는 고성능 컴퓨팅 자원 및 관련 서비스를 이용함에 있어 필요한 조건 및 절차를 규정합니다.",
  },
  {
    title: "제2조 (용어의 정의)",
    content:
      "‘사용자’란 포털을 통해 자원 신청 및 사용을 진행하는 개인 또는 단체를 의미하며, ‘관리자’는 자원 승인 및 운영을 담당하는 인력을 말합니다.",
  },
  {
    title: "제3조 (서비스 이용)",
    content:
      "사용자는 포털에 명시된 절차에 따라 자원을 신청해야 하며, 허가되지 않은 용도로 자원을 사용할 수 없습니다. 허위 정보 제공 시 이용이 제한될 수 있습니다.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950/85 px-6 py-20 text-slate-100">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-sky-300">QuantumFlow</p>
          <h1 className="text-3xl font-semibold text-white">이용약관</h1>
          <p className="text-sm text-slate-300/80">2025년 3월 1일 시행</p>
        </header>
        <section className="space-y-6 rounded-3xl border border-white/10 bg-slate-950/60 p-6 text-sm leading-relaxed text-slate-200">
          {sections.map((section) => (
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

