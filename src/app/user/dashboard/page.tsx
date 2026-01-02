"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Gauge,
} from "lucide-react";

import { PortalHeader } from "@/components/portal/portal-header";
import { getUserFromSession, type UserData } from "@/lib/user-client";

interface ActiveProject {
  name: string;
  code: string;
  status: string;
  timeline: string;
  nodes: string;
  owner: string;
  requestId: string;
}

const activityStream: Array<{
  title: string;
  time: string;
  detail: string;
}> = [];

export default function UserDashboardPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [activeProjects, setActiveProjects] = useState<ActiveProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = getUserFromSession();
    setUser(userData);
  }, []);

  const loadActiveProjects = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/user/allocations?owner=${encodeURIComponent(user.name || user.username)}`);
      if (!response.ok) {
        throw new Error("할당 정보를 불러오지 못했습니다.");
      }
      const data = await response.json();
      const allocations = data.allocations || [];

      // 실행 중인 할당만 필터링
      const runningAllocations = allocations.filter(
        (allocation: any) => allocation.status === "running" && allocation.request?.project
      );

      // 프로젝트별로 그룹화
      const projectMap = new Map<string, {
        allocations: any[];
        request: any;
      }>();

      runningAllocations.forEach((allocation: any) => {
        const projectName = allocation.request?.project || "기타";
        const existing = projectMap.get(projectName);
        
        if (existing) {
          existing.allocations.push(allocation);
        } else {
          projectMap.set(projectName, {
            allocations: [allocation],
            request: allocation.request,
          });
        }
      });

      // 프로젝트 데이터 변환
      const projects: ActiveProject[] = Array.from(projectMap.entries())
        .map(([projectName, data]) => {
          // 프로젝트 코드 생성 (프로젝트 이름에서 또는 request.id 사용)
          const projectCode = data.request?.id 
            ? data.request.id.substring(0, 8).toUpperCase()
            : projectName.substring(0, 8).toUpperCase().replace(/\s+/g, '-');

          // 노드 정보 수집 (중복 제거)
          const nodeIds = [...new Set(data.allocations.map((a: any) => a.nodeId))];
          const nodesDisplay = nodeIds.length > 0
            ? `${nodeIds.length}개 노드`
            : "정보 없음";

          // 남은 기간 계산
          let timeline = "진행 중";
          if (data.request?.deadline) {
            const deadline = new Date(data.request.deadline);
            const now = new Date();
            const diffMs = deadline.getTime() - now.getTime();
            
            if (diffMs < 0) {
              timeline = "기간 만료";
            } else {
              const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
              if (diffDays === 0) {
                timeline = "오늘까지";
              } else if (diffDays === 1) {
                timeline = "내일까지";
              } else if (diffDays <= 7) {
                timeline = `${diffDays}일 남음`;
              } else if (diffDays <= 30) {
                timeline = `${Math.ceil(diffDays / 7)}주 남음`;
              } else {
                timeline = `${Math.ceil(diffDays / 30)}개월 남음`;
              }
            }
          }

          return {
            name: projectName,
            code: projectCode,
            status: "Running",
            timeline,
            nodes: nodesDisplay,
            owner: data.request?.owner || "알 수 없음",
            requestId: data.request?.id || "",
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      setActiveProjects(projects);
    } catch (error) {
      console.error("활성 프로젝트 로드 실패:", error);
      setActiveProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadActiveProjects();
    }
  }, [user, loadActiveProjects]);

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
          <Link
            href="/user/applications/new"
            className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_12px_30px_rgba(56,189,248,0.35)] transition hover:bg-sky-400"
          >
            신규 자원 신청
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
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
              {isLoading ? (
                <div className="px-4 py-12 text-center text-sm text-slate-400">
                  데이터를 불러오는 중...
                </div>
              ) : activeProjects.length > 0 ? (
                <table className="min-w-full divide-y divide-white/5 text-sm">
                  <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-300">
                    <tr>
                      <th className="px-4 py-3 text-left">프로젝트</th>
                      <th className="px-4 py-3 text-left">상태</th>
                      <th className="px-4 py-3 text-left">노드/큐</th>
                      <th className="px-4 py-3 text-left">담당</th>
                      <th className="px-4 py-3 text-left">남은 기간</th>
                      <th className="px-4 py-3 text-right">관리</th>
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
                        <td className="px-4 py-4 text-right">
                          {project.requestId ? (
                            <Link
                              href={`/user/applications/${project.requestId}`}
                              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-sky-100 transition hover:border-sky-300 hover:bg-sky-500/10 hover:text-sky-200"
                            >
                              상세보기
                              <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-500">-</span>
                          )}
                        </td>
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

