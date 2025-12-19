import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  LifeBuoy,
  LayoutDashboard,
  ScrollText,
  Sparkles,
} from "lucide-react";

import { PortalSidebar } from "@/components/portal/portal-sidebar";

const navigation = [
  {
    label: "대시보드",
    description: "현재 할당 자원과 알림",
    href: "/user/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "자원 신청",
    description: "신규 요청 및 이력 관리",
    href: "/user/applications",
    icon: ScrollText,
  },
  {
    label: "사용 현황",
    description: "프로젝트별 자원 분석",
    href: "/user/usage",
    icon: Activity,
  },
  {
    label: "지원 센터",
    description: "가이드와 문의",
    href: "/user/support",
    icon: LifeBuoy,
    badge: "NEW",
  },
];

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-950/90 text-slate-100">
      <PortalSidebar
        title="사용자 포털"
        caption="User Portal"
        links={navigation}
        footer={
          <p>
            자원 소진 임박 시 자동으로 알림 메일과 슬랙 메시지가 발송됩니다. 문의:
            hpc-support@quantumflow.kr
          </p>
        }
      />
      <div className="flex w-full flex-col">
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-4 py-4 lg:hidden">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-sky-300">QuantumFlow</p>
            <p className="text-lg font-semibold">사용자 포털</p>
          </div>
          <Link
            href="/user/applications"
            className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950"
          >
            빠른 신청
            <Sparkles className="h-3.5 w-3.5" />
          </Link>
        </div>
        <main className="flex-1 overflow-y-auto bg-slate-950/40">{children}</main>
        <footer className="border-t border-white/10 bg-slate-950/70 px-6 py-4 text-xs text-slate-500">
          © {new Date().getFullYear()} QuantumFlow Supercomputing Portal. 모든 권리 보유.
        </footer>
      </div>
    </div>
  );
}

