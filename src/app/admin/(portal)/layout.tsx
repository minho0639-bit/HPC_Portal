"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  CircuitBoard,
  LayoutDashboard,
  Sparkles,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { PortalSidebar } from "@/components/portal/portal-sidebar";

const navigation = [
  {
    label: "운영 대시보드",
    description: "클러스터 상태 및 경보",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "신청 관리",
    description: "승인·반려·히스토리",
    href: "/admin/requests",
    icon: Activity,
  },
  {
    label: "자원 & 노드",
    description: "노드 상태, 컨테이너, 스케일링",
    href: "/admin/resources",
    icon: CircuitBoard,
  },
  {
    label: "리포트 & 정책",
    description: "사용량 분석과 운영 정책",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    label: "사용자 관리",
    description: "사용자 등록 및 관리",
    href: "/admin/users",
    icon: Users,
  },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const authed = sessionStorage.getItem("admin-authenticated") === "true";

    if (!authed) {
      setIsAuthorized(false);
      router.replace("/admin/login");
      return;
    }

    setIsAuthorized(true);
  }, [router]);

  if (isAuthorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Admin Portal</p>
          <p className="text-sm text-slate-400">관리자 인증을 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-950/95 text-slate-100">
      <PortalSidebar
        title="관리자 포털"
        caption="Admin Portal"
        links={navigation}
        footer={
          <div className="space-y-2">
            <p className="font-semibold text-slate-300">운영 정책 단축키</p>
            <ul className="space-y-1 text-xs">
              <li>• S: 시스템 상태 대시보드</li>
              <li>• R: 승인 요청 목록 열기</li>
              <li>• L: 실시간 로그 스트림 보기</li>
            </ul>
          </div>
        }
      />
      <div className="flex w-full flex-col">
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-4 py-4 lg:hidden">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-sky-300">QuantumFlow</p>
            <p className="text-lg font-semibold">관리자 포털</p>
          </div>
          <Link
            href="/admin/requests"
            className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950"
          >
            대기중 5건
            <Sparkles className="h-3.5 w-3.5" />
          </Link>
        </div>
        <main className="flex-1 overflow-y-auto bg-slate-950/40">{children}</main>
        <footer className="border-t border-white/10 bg-slate-950/70 px-6 py-4 text-xs text-slate-500">
          시스템 설정은 Settings &gt; Policy에서 변경 가능합니다. 문의: ops@quantumflow.kr
        </footer>
      </div>
    </div>
  );
}

