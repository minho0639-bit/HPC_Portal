"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, LockKeyhole, Sparkles, Terminal, User } from "lucide-react";

export default function UserLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const isAuthenticated = sessionStorage.getItem("user-authenticated");
    const userData = sessionStorage.getItem("user-data");
    if (isAuthenticated === "true" && userData) {
      router.replace("/user/dashboard");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/user/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "로그인에 실패했습니다.");
      }

      const data = await response.json();
      
      if (typeof window !== "undefined") {
        sessionStorage.setItem("user-authenticated", "true");
        sessionStorage.setItem("user-data", JSON.stringify(data.user));
      }

      router.push("/user/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-950 to-sky-900/60 p-12 xl:flex">
        <div className="space-y-10">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-sky-300">HPC Portal</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">슈퍼컴퓨팅 자원 신청 포털</h1>
            <p className="mt-4 max-w-md text-sm text-slate-300">
              GPU, CPU, 스토리지 등 고성능 컴퓨팅 자원을 신청하고 관리하세요. 승인된 사용자만 접근할 수 있습니다.
            </p>
          </div>
          <div className="space-y-4 text-sm text-slate-200">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <Sparkles className="h-5 w-5 text-sky-200" />
              <div>
                <p className="font-semibold text-white">자동 자원 할당</p>
                <p className="text-xs text-slate-300">신청 승인 즉시 Kubernetes 네임스페이스와 리소스가 자동 구성됩니다.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <Terminal className="h-5 w-5 text-sky-200" />
              <div>
                <p className="font-semibold text-white">실시간 모니터링</p>
                <p className="text-xs text-slate-300">할당된 자원 사용량과 프로젝트 진행 상황을 실시간으로 확인할 수 있습니다.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <LockKeyhole className="h-5 w-5 text-sky-200" />
              <div>
                <p className="font-semibold text-white">안전한 접근</p>
                <p className="text-xs text-slate-300">RBAC 정책으로 프로젝트별 접근 권한이 관리됩니다.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-3 text-xs text-slate-400">
          <p>ⓒ {new Date().getFullYear()} QuantumFlow Supercomputing Portal</p>
          <p>문의: hpc-support@quantumflow.kr</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-16 sm:px-12">
        <div className="w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.55)] backdrop-blur">
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">
              <User className="h-3.5 w-3.5" />
              User Access
            </div>
            <h2 className="text-2xl font-semibold text-white">사용자 포털 로그인</h2>
            <p className="text-sm text-slate-400">
              관리자가 발급한 계정 정보로 로그인하세요.
            </p>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                사용자 이름
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:bg-slate-900 focus:ring-2 focus:ring-sky-400/40"
                placeholder="사용자 이름을 입력하세요"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:bg-slate-900 focus:ring-2 focus:ring-sky-400/40"
                placeholder="비밀번호를 입력하세요"
                required
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
            계정이 없으신가요? 관리자에게 계정 발급을 요청하세요. 문의: hpc-support@quantumflow.kr
          </div>
        </div>
      </div>
    </div>
  );
}

