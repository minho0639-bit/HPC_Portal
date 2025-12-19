"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Gauge,
  LifeBuoy,
} from "lucide-react";

import { PortalHeader } from "@/components/portal/portal-header";
import { getUserFromSession, type UserData } from "@/lib/user-client";

const activeProjects: Array<{
  name: string;
  code: string;
  status: string;
  timeline: string;
  nodes: string;
  owner: string;
}> = [];

const activityStream: Array<{
  title: string;
  time: string;
  detail: string;
}> = [];

export default function UserDashboardPage() {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const userData = getUserFromSession();
    setUser(userData);
  }, []);

  function getAvatarLabel(name: string): string {
    if (name.length >= 2) {
      return name.substring(name.length - 2).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase().padEnd(2, name[0] || "U");
  }

  return (
    <div className="flex min-h-full flex-col">
      <PortalHeader
        title="대시보드"
        description="현재 할당된 자원과 프로젝트 진행 상황을 한눈에 확인하세요."
        userName={user?.name || "사용자"}
        userRole={user?.organization || user?.role || "사용자 조직"}
        avatarLabel={user ? getAvatarLabel(user.name) : "U"}
        actions={
          <>
            <Link
              href="/user/applications/new"
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_12px_30px_rgba(56,189,248,0.35)] transition hover:bg-sky-400"
            >
              신규 자원 신청
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/user/support"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100"
            >
              운영 지원 연결
              <LifeBuoy className="h-3.5 w-3.5" />
            </Link>
          </>
        }
      />

      <div className="flex-1 space-y-10 px-6 py-8">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,_1fr)_360px]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-300/80">
                  프로젝트 현황
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">활성 프로젝트</h2>
              </div>
              <Link
                href="/user/usage"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100"
              >
                전체 보기
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/5">
              {activeProjects.length > 0 ? (
                <table className="min-w-full divide-y divide-white/5 text-sm">
                  <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-300">
                    <tr>
                      <th className="px-4 py-3 text-left">프로젝트</th>
                      <th className="px-4 py-3 text-left">상태</th>
                      <th className="px-4 py-3 text-left">노드/큐</th>
                      <th className="px-4 py-3 text-left">담당</th>
                      <th className="px-4 py-3 text-left">남은 기간</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-200">
                    {activeProjects.map((project) => (
                      <tr key={project.code} className="hover:bg-white/5">
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">{project.name}</span>
                            <span className="text-xs text-slate-400">{project.code}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                              project.status === "Running"
                                ? "bg-emerald-400/20 text-emerald-200"
                                : "bg-amber-400/20 text-amber-200"
                            }`}
                          >
                            {project.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">{project.nodes}</td>
                        <td className="px-4 py-4 text-sm">{project.owner}</td>
                        <td className="px-4 py-4 text-sm">{project.timeline}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="px-4 py-12 text-center text-sm text-slate-400">
                  활성 프로젝트가 없습니다.
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300/80">
                    활동 로그
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">최근 알림</h3>
                </div>
                <Gauge className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-4 space-y-4">
                {activityStream.length > 0 ? (
                  activityStream.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{item.detail}</p>
                      <p className="mt-2 text-[11px] uppercase tracking-widest text-sky-200">
                        {item.time}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-center text-sm text-slate-400">
                    활동 로그가 없습니다.
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}

