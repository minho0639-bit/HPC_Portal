"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  LayoutDashboard,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
];

export default function UserLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // 로그인 페이지는 인증 체크 제외
    if (pathname === "/user/login") {
      setIsAuthorized(true);
      return;
    }

    const authed = sessionStorage.getItem("user-authenticated") === "true";
    const userData = sessionStorage.getItem("user-data");

    if (!authed || !userData) {
      setIsAuthorized(false);
      router.replace("/user/login");
      return;
    }

    setIsAuthorized(true);
  }, [router, pathname]);

  if (isAuthorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-300">User Portal</p>
          <p className="text-sm text-slate-400">사용자 인증을 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  // 로그인 페이지는 레이아웃 없이 렌더링
  if (pathname === "/user/login") {
    return <>{children}</>;
  }

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

