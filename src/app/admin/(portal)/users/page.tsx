"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Edit,
  Key,
  Mail,
  Plus,
  Shield,
  Sparkles,
  Trash2,
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

interface AdminData {
  id: string;
  username: string;
  name: string;
  email?: string;
  status: "active" | "inactive";
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminData | null>(null);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
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
    status: "active" as "active" | "inactive" | "suspended",
  });

  const [adminFormData, setAdminFormData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
  });

  useEffect(() => {
    loadUsers();
    loadAdmins();
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

  async function loadAdmins() {
    try {
      setIsLoadingAdmins(true);
      const response = await fetch("/api/admin/admins");
      if (!response.ok) {
        throw new Error("관리자 목록을 불러오지 못했습니다.");
      }
      const data = await response.json();
      setAdmins(data.admins || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsLoadingAdmins(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const url = editingUser
        ? `/api/admin/users/${editingUser.id}`
        : "/api/admin/users";
      const method = editingUser ? "PATCH" : "POST";

      const body = editingUser
        ? {
            name: formData.name,
            email: formData.email,
            organization: formData.organization,
            role: formData.role,
            status: formData.status as "active" | "inactive" | "suspended",
          }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || (editingUser ? "사용자 수정에 실패했습니다." : "사용자 등록에 실패했습니다."));
      }

      setSuccess(editingUser ? "사용자 정보가 수정되었습니다." : "사용자가 성공적으로 등록되었습니다.");
      setFormData({
        username: "",
        email: "",
        password: "",
        name: "",
        organization: "",
        role: "",
        status: "active",
      });
      setEditingUser(null);
      setShowForm(false);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteUser(id: string) {
    if (!confirm("정말 이 사용자 계정을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "사용자 삭제에 실패했습니다.");
      }

      setSuccess("사용자가 성공적으로 삭제되었습니다.");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    }
  }

  function handleEditUser(user: UserData) {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: "",
      name: user.name,
      organization: user.organization || "",
      role: user.role || "",
      status: user.status,
    });
    setShowForm(true);
  }

  function getStatusBadge(status: string) {
    const styles = {
      active: "bg-emerald-400/20 text-emerald-200",
      inactive: "bg-slate-400/20 text-slate-300",
      suspended: "bg-rose-400/20 text-rose-200",
    };
    return styles[status as keyof typeof styles] || styles.inactive;
  }

  async function handleAdminSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const url = editingAdmin
        ? `/api/admin/admins/${editingAdmin.id}`
        : "/api/admin/admins";
      const method = editingAdmin ? "PATCH" : "POST";

      const body = editingAdmin
        ? {
            name: adminFormData.name,
            email: adminFormData.email,
            ...(adminFormData.password && { password: adminFormData.password }),
          }
        : adminFormData;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "관리자 등록에 실패했습니다.");
      }

      setSuccess(editingAdmin ? "관리자 정보가 수정되었습니다." : "관리자가 성공적으로 등록되었습니다.");
      setAdminFormData({
        username: "",
        password: "",
        name: "",
        email: "",
      });
      setEditingAdmin(null);
      setShowAdminForm(false);
      await loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteAdmin(id: string) {
    if (!confirm("정말 이 관리자 계정을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/admins/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "관리자 삭제에 실패했습니다.");
      }

      setSuccess("관리자가 성공적으로 삭제되었습니다.");
      await loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    }
  }

  function handleEditAdmin(admin: AdminData) {
    setEditingAdmin(admin);
    setAdminFormData({
      username: admin.username,
      password: "",
      name: admin.name,
      email: admin.email || "",
    });
    setShowAdminForm(true);
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
            onClick={() => {
              setShowForm(!showForm);
              if (!showForm) {
                setEditingUser(null);
                setFormData({
                  username: "",
                  email: "",
                  password: "",
                  name: "",
                  organization: "",
                  role: "",
                  status: "active",
                });
              }
            }}
            className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_10px_25px_rgba(56,189,248,0.35)] transition hover:bg-sky-400"
          >
            {showForm ? "취소" : "새 사용자 등록"}
            {showForm ? null : <UserPlus className="h-3.5 w-3.5" />}
          </button>
        }
      />

      <div className="flex-1 space-y-6 px-6 py-8">
        {/* 관리자 계정 관리 섹션 */}
        <section className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-400" />
                <p className="text-xs uppercase tracking-[0.35em] text-amber-300/80">
                  관리자 계정 관리
                </p>
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                관리자 계정 ({admins.length}명)
              </h2>
            </div>
            <button
              onClick={() => {
                setShowAdminForm(!showAdminForm);
                setEditingAdmin(null);
                setAdminFormData({
                  username: "",
                  password: "",
                  name: "",
                  email: "",
                });
              }}
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_10px_25px_rgba(245,158,11,0.35)] transition hover:bg-amber-400"
            >
              {showAdminForm ? "취소" : "새 관리자 등록"}
              {showAdminForm ? null : <Shield className="h-3.5 w-3.5" />}
            </button>
          </div>

          {showAdminForm && (
            <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
              <div className="mb-4">
                <p className="text-xs uppercase tracking-[0.35em] text-amber-300/80">
                  {editingAdmin ? "관리자 정보 수정" : "관리자 등록"}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {editingAdmin ? "관리자 정보 수정" : "새 관리자 정보 입력"}
                </h3>
              </div>

              <form onSubmit={handleAdminSubmit} className="grid gap-6 text-sm">
                <div className="grid gap-6 md:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.35em] text-amber-300/80">
                      관리자 아이디 {!editingAdmin && "*"}
                    </span>
                    <input
                      type="text"
                      required={!editingAdmin}
                      disabled={!!editingAdmin}
                      value={adminFormData.username}
                      onChange={(e) => setAdminFormData({ ...adminFormData, username: e.target.value })}
                      className="rounded-2xl border border-amber-500/20 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-300 focus:outline-none disabled:opacity-50"
                      placeholder="예) admin"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.35em] text-amber-300/80">
                      이름 *
                    </span>
                    <input
                      type="text"
                      required
                      value={adminFormData.name}
                      onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })}
                      className="rounded-2xl border border-amber-500/20 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-300 focus:outline-none"
                      placeholder="예) 관리자"
                    />
                  </label>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.35em] text-amber-300/80">
                      비밀번호 {editingAdmin ? "(변경 시에만 입력)" : "*"}
                    </span>
                    <input
                      type="password"
                      required={!editingAdmin}
                      minLength={6}
                      value={adminFormData.password}
                      onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                      className="rounded-2xl border border-amber-500/20 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-300 focus:outline-none"
                      placeholder={editingAdmin ? "변경하지 않으려면 비워두세요" : "최소 6자 이상"}
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.35em] text-amber-300/80">
                      이메일
                    </span>
                    <input
                      type="email"
                      value={adminFormData.email}
                      onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                      className="rounded-2xl border border-amber-500/20 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-300 focus:outline-none"
                      placeholder="예) admin@example.com"
                    />
                  </label>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminForm(false);
                      setEditingAdmin(null);
                      setAdminFormData({
                        username: "",
                        password: "",
                        name: "",
                        email: "",
                      });
                      setError("");
                      setSuccess("");
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 text-xs font-semibold text-slate-100 transition hover:border-amber-200 hover:text-amber-100"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-75"
                  >
                    {isSubmitting ? (editingAdmin ? "수정 중..." : "등록 중...") : (editingAdmin ? "수정" : "관리자 등록")}
                    {editingAdmin ? <Edit className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </form>
            </div>
          )}

          {isLoadingAdmins ? (
            <div className="text-center text-sm text-slate-400">로딩 중...</div>
          ) : admins.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-amber-500/20 bg-amber-500/5 p-8 text-center">
              <Shield className="mx-auto h-12 w-12 text-amber-400/50" />
              <p className="mt-4 text-sm text-amber-200/80">등록된 관리자가 없습니다.</p>
              <button
                onClick={() => setShowAdminForm(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-amber-400"
              >
                첫 관리자 등록하기
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-amber-500/10">
              <table className="min-w-full divide-y divide-amber-500/10 text-sm text-slate-200">
                <thead className="bg-amber-500/10 text-xs uppercase tracking-wider text-amber-200">
                  <tr>
                    <th className="px-4 py-3 text-left">관리자 아이디</th>
                    <th className="px-4 py-3 text-left">이름</th>
                    <th className="px-4 py-3 text-left">이메일</th>
                    <th className="px-4 py-3 text-left">상태</th>
                    <th className="px-4 py-3 text-left">등록일</th>
                    <th className="px-4 py-3 text-left">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-500/10">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-amber-500/5">
                      <td className="px-4 py-4 font-semibold text-white">{admin.username}</td>
                      <td className="px-4 py-4">{admin.name}</td>
                      <td className="px-4 py-4">
                        {admin.email ? (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            {admin.email}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                            admin.status === "active"
                              ? "bg-emerald-400/20 text-emerald-200"
                              : "bg-slate-400/20 text-slate-300"
                          }`}
                        >
                          {admin.status === "active" && <CheckCircle2 className="h-3.5 w-3.5" />}
                          {admin.status === "active" ? "활성" : "비활성"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-400">
                        {formatDate(admin.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditAdmin(admin)}
                            className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-amber-200 transition hover:bg-amber-500/20"
                            title="수정"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAdmin(admin.id)}
                            className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-rose-200 transition hover:bg-rose-500/20"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 사용자 관리 섹션 */}
        {showForm && (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                {editingUser ? "사용자 정보 수정" : "사용자 등록"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {editingUser ? "사용자 정보 수정" : "새 사용자 정보 입력"}
              </h2>
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
                    사용자 이름 {!editingUser && "*"}
                  </span>
                  <input
                    type="text"
                    required={!editingUser}
                    disabled={!!editingUser}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-300 focus:outline-none disabled:opacity-50"
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

              {!editingUser && (
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
              )}

              {editingUser && (
                <div className="grid gap-6 md:grid-cols-2">
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
              )}

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

              {editingUser && (
                <div className="grid gap-6 md:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.35em] text-slate-400">상태</span>
                    <select
                      value={formData.status || editingUser.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" | "suspended" })}
                      className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-sky-300 focus:outline-none"
                    >
                      <option value="active">활성</option>
                      <option value="inactive">비활성</option>
                      <option value="suspended">정지</option>
                    </select>
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingUser(null);
                    setFormData({
                      username: "",
                      email: "",
                      password: "",
                      name: "",
                      organization: "",
                      role: "",
                      status: "active",
                    });
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
                  {isSubmitting ? (editingUser ? "수정 중..." : "등록 중...") : (editingUser ? "수정" : "사용자 등록")}
                  {editingUser ? <Edit className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">일반 사용자 목록</p>
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
                    <th className="px-4 py-3 text-left">작업</th>
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
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-2 text-sky-200 transition hover:bg-sky-500/20"
                            title="수정"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-rose-200 transition hover:bg-rose-500/20"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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

