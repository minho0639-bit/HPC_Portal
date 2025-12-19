"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  CloudLightning,
  Plus,
  ServerCog,
  ShieldCheck,
} from "lucide-react";

import { PortalHeader } from "@/components/portal/portal-header";
import { getUserFromSession, type UserData } from "@/lib/user-client";

interface Submission {
  id: string;
  project: string;
  type: string;
  status: string;
  updatedAt: string;
  quota: string;
}

const workflow = [
  {
    title: "사전 검증",
    detail: "신청서 제출 즉시 자동 검증 규칙이 실행됩니다.",
    owner: "시스템",
  },
  {
    title: "관리자 승인",
    detail: "운영팀이 정책·사용 이력을 기반으로 검토합니다.",
    owner: "운영팀",
  },
  {
    title: "Kubernetes 할당",
    detail: "네임스페이스, 리소스 쿼터, 네트워크가 자동 구성됩니다.",
    owner: "시스템",
  },
  {
    title: "사용자 알림",
    detail: "메일, 슬랙, 웹 알림으로 즉시 안내합니다.",
    owner: "QuantumFlow Bot",
  },
];

export default function UserApplicationsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = getUserFromSession();
    setUser(userData);
  }, []);

  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user]);

  async function loadApplications() {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await fetch("/api/user/requests");
      if (!response.ok) {
        throw new Error("신청 목록을 불러오지 못했습니다.");
      }
      const data = await response.json();
      const requests = data.requests || [];
      
      // 로그인한 사용자의 신청만 필터링
      const userRequests = requests
        .filter((req: any) => req.owner === user.name || req.owner === user.username)
        .map((req: any) => ({
          id: req.id,
          project: req.project,
          type: req.preferredRuntime || "kubernetes",
          status: req.status === "pending" ? "승인 대기" : req.status === "fulfilled" ? "승인 완료" : req.status === "allocating" ? "할당 중" : "보관됨",
          updatedAt: new Date(req.requestedAt).toLocaleString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
          quota: `GPU ${req.requirements?.gpuCount || 0} · CPU ${req.requirements?.cpuCores || 0} vCore · 메모리 ${req.requirements?.memoryGb || 0}GB · 스토리지 ${req.requirements?.storageTb || 0}TB`,
        }));
      setSubmissions(userRequests);
    } catch (err) {
      console.error("Failed to load applications:", err);
    } finally {
      setIsLoading(false);
    }
  }

  function getAvatarLabel(name: string): string {
    if (name.length >= 2) {
      return name.substring(name.length - 2).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase().padEnd(2, name[0] || "U");
  }

  return (
    <div className="flex min-h-full flex-col">
      <PortalHeader
        title="자원 신청"
        description="새로운 프로젝트를 위한 컴퓨팅 자원을 신청하고 진행 상태를 추적하세요."
        userName={user?.name || "사용자"}
        userRole={user?.organization || user?.role || "사용자 조직"}
        avatarLabel={user ? getAvatarLabel(user.name) : "U"}
        actions={
          <>
            <Link
              href="/user/applications/new"
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_10px_25px_rgba(56,189,248,0.35)] transition hover:bg-sky-400"
            >
              신규 신청 작성
              <Plus className="h-3.5 w-3.5" />
            </Link>
          </>
        }
      />

      <div className="flex-1 space-y-10 px-6 py-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                신청 현황
              </p>
              <h2 className="text-2xl font-semibold text-white">진행 중인 신청</h2>
            </div>
            {submissions.length > 0 && (
              <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-100">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-sky-200" /> 정책 검증 완료 {submissions.filter(s => s.status === "승인 완료").length}건
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  <ServerCog className="h-3.5 w-3.5 text-sky-200" /> 자동 할당 준비 {submissions.filter(s => s.status === "승인 대기").length}건
                </span>
              </div>
            )}
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/5">
            {isLoading ? (
              <div className="px-4 py-12 text-center text-sm text-slate-400">로딩 중...</div>
            ) : submissions.length > 0 ? (
              <table className="min-w-full divide-y divide-white/5 text-sm text-slate-200">
                <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left">요청 ID</th>
                    <th className="px-4 py-3 text-left">프로젝트</th>
                    <th className="px-4 py-3 text-left">템플릿</th>
                    <th className="px-4 py-3 text-left">상태</th>
                    <th className="px-4 py-3 text-left">요청 자원</th>
                    <th className="px-4 py-3 text-left">업데이트</th>
                    <th className="px-4 py-3 text-left">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {submissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-white/5">
                    <td className="px-4 py-4 font-semibold text-white">
                      <Link
                        href={`/user/applications/${submission.id}`}
                        className="font-semibold text-sky-300 hover:text-sky-200 transition"
                      >
                        {submission.id}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span>{submission.project}</span>
                        <span className="text-xs text-slate-400">{submission.quota}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300">
                      {submission.type}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                          submission.status === "승인 완료"
                            ? "bg-emerald-400/20 text-emerald-200"
                            : submission.status === "승인 대기"
                              ? "bg-amber-400/20 text-amber-200"
                              : "bg-rose-400/20 text-rose-200"
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {submission.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300">{submission.quota}</td>
                    <td className="px-4 py-4 text-xs text-slate-400">{submission.updatedAt}</td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/user/applications/${submission.id}`}
                        className="inline-flex items-center gap-1 text-xs text-sky-300 hover:text-sky-200 transition"
                      >
                        상세보기
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-4 py-12 text-center text-sm text-slate-400">
                진행 중인 신청이 없습니다.
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-slate-900/70 to-slate-950/80 p-6 lg:grid-cols-[minmax(0,_1fr)_340px]">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-sky-200">워크플로</p>
            <h3 className="mt-2 text-xl font-semibold text-white">신청 처리 흐름</h3>
            <div className="mt-6 space-y-5">
              {workflow.map((step, index) => (
                <div key={step.title} className="relative flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-300/60 bg-sky-500/15 text-xs font-semibold text-sky-200">
                      {index + 1}
                    </div>
                    {index !== workflow.length - 1 ? (
                      <div className="mt-2 h-12 w-px bg-gradient-to-b from-sky-500/60 to-transparent" />
                    ) : null}
                  </div>
                  <div className="flex-1 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">{step.title}</p>
                      <span className="text-[10px] uppercase tracking-widest text-slate-400">
                        {step.owner}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-200/80">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/70 p-5 text-sm text-slate-200">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <CloudLightning className="h-5 w-5 text-sky-200" />
              <div>
                <p className="font-semibold text-white">자동 할당 리소스 구성</p>
                <p className="text-xs text-slate-400">
                  승인 즉시 네임스페이스와 보안 정책이 생성되고, GPU/CPU 쿼터가 설정됩니다.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

