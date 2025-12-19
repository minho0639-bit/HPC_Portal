"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, LockKeyhole, ShieldCheck, Sparkles, Terminal } from "lucide-react";

const DEFAULT_ID = "bitcorp148";
const DEFAULT_PASSWORD = "7890uiop";

export default function AdminLoginPage() {
  const router = useRouter();
  const [adminId, setAdminId] = useState(DEFAULT_ID);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const isAuthenticated = sessionStorage.getItem("admin-authenticated");
    if (isAuthenticated === "true") {
      router.replace("/admin/dashboard");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (adminId.trim() === DEFAULT_ID && password === DEFAULT_PASSWORD) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("admin-authenticated", "true");
      }
      router.push("/admin/dashboard");
    } else {
      setError("접속 정보가 일치하지 않습니다. 기본 제공 계정을 다시 확인하세요.");
    }

    setIsSubmitting(false);
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-950 to-sky-900/60 p-12 xl:flex">
        <div className="space-y-10">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-sky-300">HPC Portal</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">AI 기반 슈퍼컴퓨팅 운영 허브</h1>
            <p className="mt-4 max-w-md text-sm text-slate-300">
              승인된 관리자만 접근할 수 있는 운영 관제 영역입니다. 자원 승인, 노드 상태 모니터링,
              보안 정책을 한 번에 제어하세요.
            </p>
          </div>
          <div className="space-y-4 text-sm text-slate-200">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <LockKeyhole className="h-5 w-5 text-sky-200" />
              <div>
                <p className="font-semibold text-white">다중 인증 준비</p>
                <p className="text-xs text-slate-300">OTP 기반 2차 인증이 곧 적용됩니다.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <Terminal className="h-5 w-5 text-sky-200" />
              <div>
                <p className="font-semibold text-white">실시간 로그 스트림</p>
                <p className="text-xs text-slate-300">Kubernetes 이벤트, GPU 사용률을 한 화면에서 확인.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <ShieldCheck className="h-5 w-5 text-sky-200" />
              <div>
                <p className="font-semibold text-white">역할 기반 권한</p>
                <p className="text-xs text-slate-300">RBAC 정책으로 각 팀별 접근 권한을 제어합니다.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-3 text-xs text-slate-400">
          <p>ⓒ {new Date().getFullYear()} HPC Portal Operations Center</p>
          <p>보안 문의: secops@hpc-portal.kr</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-16 sm:px-12">
        <div className="w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.55)] backdrop-blur">
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">
              <Sparkles className="h-3.5 w-3.5" />
              Admin Access
            </div>
            <h2 className="text-2xl font-semibold text-white">관리자 포털 로그인</h2>
            <p className="text-sm text-slate-400">
              기본 계정으로 접속 후 운영 관리자 계정으로 변경하세요.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
            <p className="font-semibold text-white">기본 접속 정보</p>
            <p className="mt-2">ID: <span className="font-mono text-sky-200">{DEFAULT_ID}</span></p>
            <p>PWD: <span className="font-mono text-sky-200">{DEFAULT_PASSWORD}</span></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="admin-id" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                관리자 ID
              </label>
              <input
                id="admin-id"
                type="text"
                autoComplete="username"
                value={adminId}
                onChange={(event) => setAdminId(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:bg-slate-900 focus:ring-2 focus:ring-sky-400/40"
                placeholder="관리자 아이디를 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="admin-password" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                비밀번호
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:bg-slate-900 focus:ring-2 focus:ring-sky-400/40"
                placeholder="비밀번호를 입력하세요"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-white/20 bg-slate-900/70 accent-sky-400"
                  defaultChecked
                />
                로그인 정보 기억
              </label>
              <button
                type="button"
                className="text-sky-300 transition hover:text-sky-200"
              >
                비밀번호 재설정 요청
              </button>
            </div>

            {error && (
              <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-75"
            >
              로그인
              <ChevronRight className="h-4 w-4" />
            </button>
          </form>

          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/40 p-4 text-xs text-slate-400">
            외부 접속 시 VPN을 먼저 연결하고, 접속 후 30분 이상 미사용 시 자동으로 로그아웃됩니다.
          </div>
        </div>
      </div>
    </div>
  );
}
