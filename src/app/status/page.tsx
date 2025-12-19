const systems = [
  { name: "API Gateway", status: "Operational", detail: "Latency 112ms" },
  { name: "Kubernetes Control Plane", status: "Operational", detail: "All regions" },
  { name: "GPU Cluster", status: "Degraded", detail: "Zone A maintenance" },
  { name: "Monitoring & Alerts", status: "Operational", detail: "No incidents" },
];

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-slate-950/85 px-6 py-20 text-slate-100">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-sky-300">QuantumFlow</p>
          <h1 className="text-3xl font-semibold text-white">서비스 상태</h1>
          <p className="text-sm text-slate-300/80">마지막 업데이트: 2025-03-13 14:00 KST</p>
        </header>
        <section className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/60 p-6 text-sm text-slate-200">
          {systems.map((system) => (
            <div key={system.name} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="font-semibold text-white">{system.name}</span>
              <div className="flex items-center gap-3 text-xs">
                <span
                  className={`rounded-full px-3 py-1 font-semibold uppercase tracking-widest ${
                    system.status === "Operational"
                      ? "bg-emerald-400/20 text-emerald-200"
                      : "bg-amber-400/20 text-amber-200"
                  }`}
                >
                  {system.status}
                </span>
                <span className="text-slate-400">{system.detail}</span>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

