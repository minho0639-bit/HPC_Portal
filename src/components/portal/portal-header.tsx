import { Bell, HelpCircle, Search } from "lucide-react";

type PortalHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  userName?: string;
  userRole?: string;
  avatarLabel?: string;
};

export function PortalHeader({
  title,
  description,
  actions,
  userName = "김지원 연구원",
  userRole = "사용자 조직",
  avatarLabel = "QF",
}: PortalHeaderProps) {
  return (
    <div className="flex flex-col gap-6 border-b border-white/5 bg-slate-950/40 px-6 py-6 text-white backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.38em] text-sky-300">QuantumFlow</p>
          <h1 className="mt-3 text-2xl font-semibold md:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-2 text-sm text-slate-300/80 md:w-2/3">{description}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-200">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 lg:flex">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span className="whitespace-nowrap">검색 ( / )</span>
          </div>
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-sky-200 hover:text-white">
            <Bell className="h-4 w-4" />
          </button>
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-sky-200 hover:text-white">
            <HelpCircle className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-400/70 to-cyan-300/70 text-slate-950">
              {avatarLabel}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold">{userName}</span>
              <span className="text-[10px] uppercase tracking-widest text-slate-400">
                {userRole}
              </span>
            </div>
          </div>
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

