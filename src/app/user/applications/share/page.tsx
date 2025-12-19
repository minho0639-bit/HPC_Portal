import Link from "next/link";
import {
  ArrowUpRight,
  AtSign,
  CheckCircle2,
  MailPlus,
  ShieldPlus,
  Users,
} from "lucide-react";

import { PortalHeader } from "@/components/portal/portal-header";

const collaborators = [
  {
    name: "박민수 연구원",
    organization: "국가재난대응본부",
    role: "공동 연구자",
    status: "활성",
  },
  {
    name: "이수정 박사",
    organization: "국가기상센터",
    role: "데이터 분석",
    status: "초대 발송",
  },
];

export default function ShareAccessPage() {
  return (
    <div className="flex min-h-full flex-col">
      <PortalHeader
        title="파트너 공유 관리"
        description="승인된 자원을 공동 연구자와 안전하게 공유하고 접근 권한을 관리하세요."
      />

      <div className="flex-1 space-y-8 px-6 py-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">새 초대</p>
              <h2 className="text-2xl font-semibold text-white">공동 연구자 초대</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200">
              <ShieldPlus className="h-3.5 w-3.5 text-sky-200" /> IAM 정책 자동 적용
            </div>
          </div>
          <form className="mt-6 grid gap-6 text-sm text-slate-200">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.35em] text-slate-400">이메일</span>
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                  <AtSign className="h-4 w-4 text-slate-500" />
                  <input
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                    placeholder="partner@lab.kr"
                  />
                </div>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.35em] text-slate-400">역할</span>
                <select className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-sky-300 focus:outline-none">
                  <option value="viewer">뷰어</option>
                  <option value="editor">편집</option>
                  <option value="admin">관리</option>
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.35em] text-slate-400">공유 범위</span>
              <textarea
                className="min-h-[120px] rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-300 focus:outline-none"
                placeholder="공동 연구 목적과 필요한 권한을 설명하세요."
              />
            </label>
            <button className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-400">
              초대 발송
              <MailPlus className="h-3.5 w-3.5" />
            </button>
          </form>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">공유 중인 파트너</p>
            <div className="mt-4 space-y-4">
              {collaborators.map((collaborator) => (
                <div key={collaborator.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-200">
                  <div>
                    <p className="font-semibold text-white">{collaborator.name}</p>
                    <p className="text-xs text-slate-400">{collaborator.organization}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-semibold text-sky-200">{collaborator.role}</p>
                    <p className="text-slate-400">{collaborator.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-slate-900/70 to-slate-950/80 p-6 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-200">공유 정책</p>
            <ul className="mt-4 space-y-3 text-slate-200">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-sky-200" /> 초대 수락 시 자동으로 네임스페이스 접근 권한이 부여됩니다.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-sky-200" /> 데이터 다운로드는 감사 로그에 기록되며 90일간 보관됩니다.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-sky-200" /> 필요 시 언제든지 접근을 해제하고 액세스 토큰을 무효화할 수 있습니다.
              </li>
            </ul>
            <Link
              href="/user/support"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-sky-100 transition hover:bg-white/20"
            >
              공유 가이드 보기
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-slate-300/80">
            <Users className="h-4 w-4" /> 협업 포털 연동
          </div>
          <p className="mt-3 text-sm text-slate-300/80">
            파트너 기관에서 SSO를 사용 중이라면 연동 요청을 통해 자동 로그인으로 접근을 허용할 수 있습니다. SSO 연동은 관리자 승인 후 활성화됩니다.
          </p>
        </section>
      </div>
    </div>
  );
}

