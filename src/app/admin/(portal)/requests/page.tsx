import Link from "next/link";

import { PortalHeader } from "@/components/portal/portal-header";
import {
  listResourceRequests,
  type ResourceRequestStatus,
} from "@/lib/admin-resource-allocations";

const STATUS_LABEL: Record<ResourceRequestStatus, string> = {
  pending: "대기",
  allocating: "할당 중",
  fulfilled: "완료",
  archived: "종료",
};

const STATUS_BADGE: Record<ResourceRequestStatus, string> = {
  pending: "bg-amber-500/10 text-amber-100 border border-amber-400/40",
  allocating: "bg-sky-500/10 text-sky-100 border border-sky-400/40",
  fulfilled: "bg-emerald-500/10 text-emerald-100 border border-emerald-400/40",
  archived: "bg-slate-500/10 text-slate-200 border border-slate-400/40",
};

function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}일 전`;
}

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  const requests = await listResourceRequests();

  const statusCounts = requests.reduce<Record<ResourceRequestStatus, number>>(
    (acc, request) => {
      acc[request.status] += 1;
      return acc;
    },
    {
      pending: 0,
      allocating: 0,
      fulfilled: 0,
      archived: 0,
    },
  );

  const groupedByStatus = (["pending", "allocating", "fulfilled"] as ResourceRequestStatus[])
    .map((status) => ({
      status,
      requests: requests.filter((request) => request.status === status),
    }))
    .filter((group) => group.requests.length > 0);

  const archivedRequests = requests.filter(
    (request) => request.status === "archived",
  );

  const total = requests.length;

  return (
    <div className="flex min-h-full flex-col">
      <PortalHeader
        title="신청 관리"
        description="대기 중인 자원 신청을 검토하고 정책에 따라 승인·할당 상태를 조정하세요."
        userName="관리자"
        userRole="운영 총괄"
        avatarLabel="AD"
        actions={
          <Link
            href="/admin/resources/allocations"
            className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_10px_25px_rgba(56,189,248,0.35)] transition hover:bg-sky-400"
          >
            컨테이너 할당
          </Link>
        }
      />

      <div className="flex-1 space-y-10 px-6 py-8">
        <section className="grid gap-4 text-sm text-slate-200 sm:grid-cols-4">
          {[
            {
              label: "전체 신청",
              value: total,
              hint: "데이터 파일: admin-resource-allocations.json",
            },
            {
              label: "승인 대기",
              value: statusCounts.pending,
              hint: "검토 후 승인 또는 보류 처리하세요.",
            },
            {
              label: "할당 진행",
              value: statusCounts.allocating,
              hint: "컨테이너 배포가 진행 중인 신청입니다.",
            },
            {
              label: "배포 완료",
              value: statusCounts.fulfilled,
              hint: "실행 중인 워크로드 수와 연동됩니다.",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-3xl border border-white/10 bg-white/5 p-5"
            >
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                {card.label}
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {card.value}
              </p>
              <p className="mt-2 text-[11px] text-slate-400">{card.hint}</p>
            </div>
          ))}
        </section>

        {total === 0 ? (
          <section className="rounded-3xl border border-dashed border-white/20 bg-slate-950/40 p-10 text-center text-sm text-slate-300">
            아직 등록된 신청이 없습니다. <code className="rounded bg-slate-950/60 px-1 py-0.5 text-[11px]">data/admin-resource-allocations.json</code> 파일의 <code>requests</code> 배열에 신규 신청을 추가하거나 API를 통해 생성하세요.
          </section>
        ) : (
          <>
            <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                    진행 중 신청
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    상태별 큐
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  승인·할당·배포 진행 중인 신청만 표시됩니다.
                </span>
              </div>

              {groupedByStatus.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/20 bg-slate-950/40 p-8 text-sm text-slate-300">
                  진행 중인 신청이 없습니다. 모든 신청이 종료 상태입니다.
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-3">
                  {groupedByStatus.map((group) => (
                    <div
                      key={group.status}
                      className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/40 p-5"
                    >
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-sky-200">
                          {STATUS_LABEL[group.status]}
                        </p>
                        <p className="text-xs text-slate-400">
                          {group.requests.length}건
                        </p>
                      </div>
                      <div className="space-y-4">
                        {group.requests.map((request) => (
                          <article
                            key={request.id}
                            className="rounded-2xl border border-white/10 bg-white/5 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">
                                  {request.project}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {request.organisation} · {request.owner}
                                </p>
                              </div>
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${STATUS_BADGE[request.status]}`}
                              >
                                {STATUS_LABEL[request.status]}
                              </span>
                            </div>
                            <p className="mt-3 text-xs text-slate-300">
                              {request.summary}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1">
                                CPU {request.requirements.cpuCores} vCore
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1">
                                GPU {request.requirements.gpuCount}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1">
                                메모리 {request.requirements.memoryGb}GB / 스토리지 {request.requirements.storageTb}TB
                              </span>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                              <span>요청 {formatRelativeTime(request.requestedAt)}</span>
                              <Link
                                href={`/admin/requests/${request.id}`}
                                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold text-sky-100 transition hover:bg-white/20"
                              >
                                상세 보기
                              </Link>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {archivedRequests.length > 0 ? (
              <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                      종료된 신청
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">
                      보관 내역
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    최근 50건만 표시됩니다.
                  </span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <table className="min-w-full divide-y divide-white/10 text-left text-xs text-slate-200">
                    <thead className="bg-slate-950/60 text-[11px] uppercase tracking-widest text-slate-400">
                      <tr>
                        <th className="px-4 py-3">신청 ID</th>
                        <th className="px-4 py-3">프로젝트</th>
                        <th className="px-4 py-3">요청 자원</th>
                        <th className="px-4 py-3">마지막 상태</th>
                        <th className="px-4 py-3">신청 시각</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {archivedRequests.slice(0, 50).map((request) => (
                        <tr key={request.id} className="hover:bg-white/5">
                          <td className="px-4 py-3 font-semibold text-white">
                            {request.id}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-white">
                              {request.project}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {request.organisation}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-300">
                            CPU {request.requirements.cpuCores} vCore · GPU{" "}
                            {request.requirements.gpuCount} · 메모리{" "}
                            {request.requirements.memoryGb}GB · 스토리지{" "}
                            {request.requirements.storageTb}TB
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${STATUS_BADGE[request.status]}`}
                            >
                              {STATUS_LABEL[request.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[11px] text-slate-400">
                            {formatRelativeTime(request.requestedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
