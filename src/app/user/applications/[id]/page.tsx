"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  FileText,
  Flame,
  Mail,
  Package,
  Server,
  Trash2,
  XCircle,
} from "lucide-react";

import { PortalHeader } from "@/components/portal/portal-header";
import { getUserFromSession, type UserData } from "@/lib/user-client";

interface ResourceRequest {
  id: string;
  project: string;
  owner: string;
  organisation: string;
  requestedAt: string;
  deadline?: string;
  status: "pending" | "allocating" | "fulfilled" | "archived";
  summary: string;
  preferredRuntime: string;
  preferredImage: string;
  tags: string[];
  requirements: {
    gpuCount: number;
    cpuCores: number;
    memoryGb: number;
    storageTb: number;
  };
  reviewerNotes?: string;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "승인 대기",
    allocating: "할당 중",
    fulfilled: "승인 완료",
    archived: "종료",
  };
  return labels[status] || status;
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    fulfilled: "bg-emerald-400/20 text-emerald-200 border-emerald-400/30",
    pending: "bg-amber-400/20 text-amber-200 border-amber-400/30",
    allocating: "bg-sky-400/20 text-sky-200 border-sky-400/30",
    archived: "bg-slate-400/20 text-slate-300 border-slate-400/30",
  };
  return styles[status] || styles.pending;
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [application, setApplication] = useState<ResourceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  useEffect(() => {
    const userData = getUserFromSession();
    setUser(userData);
  }, []);

  useEffect(() => {
    async function loadApplication() {
      try {
        const { id } = await params;
        const response = await fetch(`/api/user/requests/${id}`);
        if (!response.ok) {
          throw new Error("신청을 불러오지 못했습니다.");
        }
        const data = await response.json();
        setApplication(data.request);
      } catch (err) {
        setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    }
    loadApplication();
  }, [params]);

  async function handleCancel() {
    if (!application) return;
    if (!confirm("이 신청을 취소하시겠습니까? 취소된 신청은 종료 상태로 변경됩니다.")) {
      return;
    }

    setIsCanceling(true);
    try {
      const response = await fetch(`/api/user/requests/${application.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "cancel" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "신청 취소에 실패했습니다.");
      }

      alert("신청이 취소되었습니다.");
      router.push("/user/applications");
    } catch (err) {
      alert(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsCanceling(false);
    }
  }

  async function handleDelete() {
    if (!application) return;
    if (!confirm("이 신청을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/user/requests/${application.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "신청 삭제에 실패했습니다.");
      }

      alert("신청이 삭제되었습니다.");
      router.push("/user/applications");
    } catch (err) {
      alert(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }

  function getAvatarLabel(name: string): string {
    if (name.length >= 2) {
      return name.substring(name.length - 2).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase().padEnd(2, name[0] || "U");
  }

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="text-sm text-slate-400">로딩 중...</div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="flex min-h-full flex-col">
        <PortalHeader
          title="신청 상세"
          description="신청 정보를 찾을 수 없습니다."
          userName={user?.name || "사용자"}
          userRole={user?.organization || user?.role || "사용자 조직"}
          avatarLabel={user ? getAvatarLabel(user.name) : "U"}
        />
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="text-center">
            <p className="text-sm text-slate-400">
              {error || "신청을 찾을 수 없습니다."}
            </p>
            <Link
              href="/user/applications"
              className="mt-4 inline-flex items-center gap-2 text-sm text-sky-300 hover:text-sky-200"
            >
              <ArrowLeft className="h-4 w-4" />
              신청 목록으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canCancel = application.status === "pending" || application.status === "allocating";
  const canDelete = application.status === "pending";

  return (
    <div className="flex min-h-full flex-col">
      <PortalHeader
        title="신청 상세"
        description={`${application.project} 프로젝트의 자원 신청 정보`}
        userName={user?.name || "사용자"}
        userRole={user?.organization || user?.role || "사용자 조직"}
        avatarLabel={user ? getAvatarLabel(user.name) : "U"}
        actions={
          <>
            <Link
              href="/user/applications"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              목록으로
            </Link>
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={isCanceling}
                className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="h-3.5 w-3.5" />
                {isCanceling ? "취소 중..." : "신청 취소"}
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isDeleting ? "삭제 중..." : "신청 삭제"}
              </button>
            )}
          </>
        }
      />

      <div className="flex-1 space-y-6 px-6 py-8">
        {/* 상태 헤더 */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                신청 상태
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{application.project}</h2>
              <p className="mt-2 text-sm text-slate-300">{application.preferredRuntime}</p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${getStatusBadge(
                  application.status,
                )}`}
              >
                <CheckCircle2 className="h-4 w-4" />
                {getStatusLabel(application.status)}
              </span>
              <p className="text-xs text-slate-400">요청 ID: {application.id}</p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 기본 정보 */}
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">기본 정보</p>
              <h3 className="mt-2 text-xl font-semibold text-white">프로젝트 정보</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-sky-300 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider text-slate-400">프로젝트 설명</p>
                  <p className="mt-1 text-sm text-slate-200">
                    {application.summary || "설명이 없습니다."}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-sky-300 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider text-slate-400">소속 기관</p>
                  <p className="mt-1 text-sm text-slate-200">{application.organisation}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-sky-300 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider text-slate-400">컨테이너 이미지</p>
                  <p className="mt-1 text-sm text-slate-200">{application.preferredImage}</p>
                </div>
              </div>
              {application.tags && application.tags.length > 0 && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-sky-300 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wider text-slate-400">태그</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {application.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-slate-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 일정 정보 */}
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">일정 정보</p>
              <h3 className="mt-2 text-xl font-semibold text-white">타임라인</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-sky-300 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider text-slate-400">신청 일시</p>
                  <p className="mt-1 text-sm text-slate-200">{formatDateTime(application.requestedAt)}</p>
                </div>
              </div>
              {application.deadline && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-sky-300 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wider text-slate-400">프로젝트 종료 예정일</p>
                    <p className="mt-1 text-sm text-slate-200">{formatDateTime(application.deadline)}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* 요청 자원 */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">요청 자원</p>
            <h3 className="mt-2 text-xl font-semibold text-white">할당 요청 사양</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <Flame className="h-5 w-5 text-sky-300 mb-2" />
              <p className="text-sm font-semibold text-white">GPU {application.requirements.gpuCount}기</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <Cpu className="h-5 w-5 text-sky-300 mb-2" />
              <p className="text-sm font-semibold text-white">CPU {application.requirements.cpuCores} vCore</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <Database className="h-5 w-5 text-sky-300 mb-2" />
              <p className="text-sm font-semibold text-white">메모리 {application.requirements.memoryGb}GB</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <Server className="h-5 w-5 text-sky-300 mb-2" />
              <p className="text-sm font-semibold text-white">스토리지 {application.requirements.storageTb}TB</p>
            </div>
          </div>
        </section>

        {/* 관리자 메모 */}
        {application.reviewerNotes && (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">관리자 메모</p>
              <h3 className="mt-2 text-xl font-semibold text-white">검토 의견</h3>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-sm text-slate-200">{application.reviewerNotes}</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
