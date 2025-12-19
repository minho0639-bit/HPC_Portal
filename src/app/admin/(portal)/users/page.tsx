"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Mail,
  Plus,
  Sparkles,
  User,
  UserPlus,
  Users,
} from "lucide-react";

import { PortalHeader } from "@/components/portal/portal-header";

interface UserData {
  id: string;
  username: string;
  email: string;
  name: string;
  organization?: string;
  role?: string;
  status: "active" | "inactive" | "suspended";
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    name: "",
    organization: "",
    role: "",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("사용자 목록을 불러오지 못했습니다.");
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "사용자 등록에 실패했습니다.");
      }

      setSuccess("사용자가 성공적으로 등록되었습니다.");
      setFormData({
        username: "",
        email: "",
        password: "",
        name: "",
        organization: "",
        role: "",
      });
      setShowForm(false);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function getStatusBadge(status: string) {
    const styles = {
      active: "bg-emerald-400/20 text-emerald-200",
      inactive: "bg-slate-400/20 text-slate-300",
      suspended: "bg-rose-400/20 text-rose-200",
    };
    return styles[status as keyof typeof styles] || styles.inactive;
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  return (
    <div className="flex min-h-full flex-col">
      <PortalHeader
        title="사용자 관리"
        description="시스템 사용자를 등록하고 관리합니다."
        userName="관리자"
        userRole="운영 총괄"
        avatarLabel="AD"
        actions={
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_10px_25px_rgba(56,189,248,0.35)] transition hover:bg-sky-400"
          >
            {showForm ? "취소" : "새 사용자 등록"}
            {showForm ? null : <UserPlus className="h-3.5 w-3.5" />}
          </button>
        }
      />

      <div className="flex-1 space-y-6 px-6 py-8">
        {showForm && (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                사용자 등록
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">새 사용자 정보 입력</h2>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-6 text-sm">
              <div className="grid gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.35em] text-slate-400">
                    사용자 이름 *
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-300 focus:outline-none"
                    placeholder="예) johndoe"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.35em] text-slate-400">
                    이메일 *
                  </span>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-300 focus:outline-none"
                    placeholder="예) user@example.com"
                  />
                </label>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.35em] text-slate-400">
                    비밀번호 *
                  </span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-300 focus:outline-none"
                    placeholder="최소 6자 이상"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.35em] text-slate-400">이름 *</span>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-300 focus:outline-none"
                    placeholder="예) 홍길동"
                  />
                </label>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.35em] text-slate-400">
                    소속 기관
                  </span>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-300 focus:outline-none"
                    placeholder="예) 서울대학교"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.35em] text-slate-400">역할</span>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-300 focus:outline-none"
                    placeholder="예) 연구원"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                    setSuccess("");
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-75"
                >
                  {isSubmitting ? "등록 중..." : "사용자 등록"}
                  <UserPlus className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">사용자 목록</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                등록된 사용자 ({users.length}명)
              </h2>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-6 text-center text-sm text-slate-400">로딩 중...</div>
          ) : users.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-4 text-sm text-slate-300">등록된 사용자가 없습니다.</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-400"
              >
                첫 사용자 등록하기
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/5">
              <table className="min-w-full divide-y divide-white/5 text-sm text-slate-200">
                <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left">사용자 이름</th>
                    <th className="px-4 py-3 text-left">이름</th>
                    <th className="px-4 py-3 text-left">이메일</th>
                    <th className="px-4 py-3 text-left">소속</th>
                    <th className="px-4 py-3 text-left">역할</th>
                    <th className="px-4 py-3 text-left">상태</th>
                    <th className="px-4 py-3 text-left">등록일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5">
                      <td className="px-4 py-4 font-semibold text-white">{user.username}</td>
                      <td className="px-4 py-4">{user.name}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {user.organization || "-"}
                      </td>
                      <td className="px-4 py-4 text-slate-300">{user.role || "-"}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(
                            user.status,
                          )}`}
                        >
                          {user.status === "active" && <CheckCircle2 className="h-3.5 w-3.5" />}
                          {user.status === "active"
                            ? "활성"
                            : user.status === "inactive"
                              ? "비활성"
                              : "정지"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-400">
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

