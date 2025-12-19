"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

type SidebarLink = {
  label: string;
  description?: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  external?: boolean;
};

type PortalSidebarProps = {
  title: string;
  caption?: string;
  links: SidebarLink[];
  footer?: React.ReactNode;
};

export function PortalSidebar({ title, caption, links, footer }: PortalSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-72 shrink-0 flex-col border-r border-white/10 bg-slate-950/80 px-5 py-8 text-slate-200 lg:flex">
      <div className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-[0.45em] text-sky-300">{caption ?? "Portal"}</p>
        <p className="text-xl font-semibold text-white">{title}</p>
      </div>
      <nav className="mt-10 flex flex-1 flex-col gap-1 text-sm">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`group relative flex items-start gap-3 rounded-2xl border border-transparent px-4 py-3 transition ${
                isActive
                  ? "border-sky-400/60 bg-sky-500/10 text-white shadow-[0_10px_30px_rgba(125,211,252,0.2)]"
                  : "hover:border-white/15 hover:bg-white/5"
              }`}
            >
              <link.icon
                className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                  isActive ? "text-sky-300" : "text-slate-400 group-hover:text-slate-200"
                }`}
              />
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{link.label}</p>
                  {link.badge ? (
                    <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-200">
                      {link.badge}
                    </span>
                  ) : null}
                  {link.external ? <ArrowUpRight className="h-3 w-3" /> : null}
                </div>
                {link.description ? (
                  <p className="text-xs text-slate-400 group-hover:text-slate-300">
                    {link.description}
                  </p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </nav>
      {footer ? <div className="mt-6 text-xs text-slate-500">{footer}</div> : null}
    </aside>
  );
}

