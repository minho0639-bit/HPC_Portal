import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  ClipboardCheck,
  Layers,
  PackagePlus,
  ServerCog,
  ShieldCheck,
} from "lucide-react";

import { PortalHeader } from "@/components/portal/portal-header";
import { listStoredNodes } from "@/lib/admin-node-store";
import type { StoredNode } from "@/lib/admin-node-types";
import NodeRegistryPanel from "./node-registry-panel";

type ClusterZoneSummary = {
  title: string;
  count: number;
  sampleNode?: string;
  sampleIp?: string;
  sampleLabels?: string[];
};

type ContainerProfile = {
  name: string;
  type: string;
  quota: string;
  runtime: string;
  version?: string;
  digest?: string;
  lastScan?: string;
  security?: "pass" | "warn" | "fail";
  registry?: string;
  tag?: string;
  changelog?: string;
};

const containerProfiles: ContainerProfile[] = [];

const CLUSTER_ZONES: Array<{ label: string }> = [
  { label: "GPU 존" },
  { label: "CPU 존" },
  { label: "스토리지 존" },
];

function buildZoneSummary(nodes: StoredNode[]): ClusterZoneSummary[] {
  return CLUSTER_ZONES.map(({ label }) => {
    const zoneNodes = nodes.filter((node) => node.labels.includes(label));
    return {
      title: label,
      count: zoneNodes.length,
      sampleNode: zoneNodes[0]?.name,
      sampleIp: zoneNodes[0]?.ipAddress,
      sampleLabels: zoneNodes[0]?.labels ?? [],
    };
  });
}

export const dynamic = "force-dynamic";

export default async function AdminResourcesPage() {
  const storedNodes = await listStoredNodes();
  const nodeSummary = buildZoneSummary(storedNodes);
  const hasAnyZoneData = nodeSummary.some((zone) => zone.count > 0);

  return (
    <div className="flex min-h-full flex-col">
      <PortalHeader
        title="자원 & 노드"
        description="클러스터 노드 상태, 네트워크, 컨테이너 프로파일을 관리하고 스케일링 작업을 실행합니다."
        userName="관리자"
        userRole="운영 총괄"
        avatarLabel="AD"
          actions={
            <>
              <Link
                href="/admin/resources/allocations"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_10px_25px_rgba(52,211,153,0.35)] transition hover:bg-emerald-300"
              >
                컨테이너 할당
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <button className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_10px_25px_rgba(56,189,248,0.35)] transition hover:bg-sky-400">
                노드 증설 계획
                <ServerCog className="h-3.5 w-3.5" />
              </button>
              <Link
                href="/admin/resources/images"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-emerald-300 hover:text-emerald-100"
              >
                이미지 관리
                <Layers className="h-3.5 w-3.5" />
              </Link>
            </>
          }
        />

          <div className="flex-1 space-y-10 px-6 py-8">
            <NodeRegistryPanel />

            <section className="flex flex-col gap-6 rounded-3xl border border-emerald-300/40 bg-gradient-to-br from-emerald-500/10 via-slate-950/60 to-slate-950/90 p-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">
                  신규 워크플로
                </p>
                <h3 className="text-xl font-semibold text-white">
                  사용자 신청을 컨테이너로 즉시 배포하세요
                </h3>
                <p className="text-sm text-slate-200">
                  승인된 신청을 선택하고 권한 있는 노드에 컨테이너 이미지를 할당합니다. 배포 상태와 리소스 사용량을 한 화면에서 추적할 수 있습니다.
                </p>
                <div className="flex flex-wrap gap-3 text-[11px] uppercase tracking-widest text-slate-300">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 px-3 py-1">
                    <Layers className="h-3.5 w-3.5 text-emerald-200" />
                    자동 네임스페이스 구성
                  </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 px-3 py-1">
                      <ServerCog className="h-3.5 w-3.5 text-emerald-200" />
                      GPU/CPU 할당 검증
                    </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 px-3 py-1">
                    <ServerCog className="h-3.5 w-3.5 text-emerald-200" />
                    상태 전환 추적
                  </span>
                </div>
              </div>
              <Link
                href="/admin/resources/allocations"
                className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-400 px-5 py-3 text-xs font-semibold text-slate-950 shadow-[0_15px_35px_rgba(52,211,153,0.35)] transition hover:bg-emerald-300 md:self-center"
              >
                컨테이너 할당 메뉴 열기
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </section>

          <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 md:grid-cols-2 xl:grid-cols-4">
            {!hasAnyZoneData ? (
              <div className="col-span-full rounded-3xl border border-dashed border-white/15 bg-slate-950/40 p-6 text-center text-sm text-slate-300">
                등록된 클러스터 존 데이터가 없습니다.{" "}
                <span className="text-sky-200">노드를 추가하고</span> 각 존의 실시간
                현황을 모니터링하세요.
              </div>
            ) : (
              nodeSummary.map((node) => (
                <div key={node.title} className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">{node.title}</p>
                  <p className="mt-3 text-lg font-semibold text-white">
                    등록 노드 {node.count}대
                  </p>
                  <div className="mt-4 space-y-3 text-xs text-slate-300">
                    {node.count > 0 ? (
                      <>
                        <p>최근 등록 노드 {node.sampleNode}</p>
                        <p className="font-mono text-slate-400">{node.sampleIp}</p>
                        <p className="text-[11px] text-slate-400">
                          레이블: {node.sampleLabels?.join(", ") ?? "—"}
                        </p>
                      </>
                    ) : (
                      <p>등록된 노드 없음</p>
                    )}
                  </div>
                  <Link
                    href="/admin/resources/nodes"
                    className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-sky-200"
                  >
                    상세 보기
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              ))
            )}
          </section>

          <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                  컨테이너 프로파일
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  운영 이미지 & 레지스트리
                </h3>
              </div>
              <Link
                href="/admin/resources/allocations"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-emerald-300 hover:text-emerald-100"
              >
                배포 현황 보기
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {containerProfiles.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-white/20 bg-slate-950/50 p-6 text-center text-sm text-slate-300">
                  운영 이미지가 아직 등록되지 않았습니다. CI/CD 파이프라인과 연동해
                  컨테이너 이미지를 업로드하면 이 영역에서 관리할 수 있습니다.
                </div>
              ) : (
                containerProfiles.map((profile) => {
                  const isSecure = profile.security !== "warn" && profile.security !== "fail";
                  const statusLabel =
                    profile.security === "pass"
                      ? "보안 통과"
                      : profile.security
                        ? "검토 필요"
                        : "검토 필요";
                  return (
                    <div
                      key={profile.name}
                      className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 text-sm text-slate-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                            {profile.type}
                          </p>
                          <h4 className="mt-2 text-lg font-semibold text-white">
                            {profile.name}
                          </h4>
                          <p className="mt-1 text-xs text-slate-400">
                            런타임: {profile.runtime}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                          {profile.version ? (
                            <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] uppercase tracking-widest text-slate-300">
                              v{profile.version}
                            </span>
                          ) : null}
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase ${
                              isSecure
                                ? "bg-emerald-400/15 text-emerald-200"
                                : "bg-rose-400/15 text-rose-200"
                            }`}
                          >
                            {isSecure ? (
                              <ShieldCheck className="h-3.5 w-3.5" />
                            ) : (
                              <AlertTriangle className="h-3.5 w-3.5" />
                            )}
                            {statusLabel}
                          </span>
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-slate-300">
                        요구 리소스 {profile.quota}
                      </p>
                      {profile.changelog ? (
                        <p className="mt-2 text-xs text-slate-400">
                          {profile.changelog}
                        </p>
                      ) : null}

                      <div className="mt-4 grid gap-2 text-[11px] text-slate-400">
                        {profile.digest ? (
                          <div className="flex items-center justify-between">
                            <span>체크섬</span>
                            <span className="font-mono text-slate-200">
                              {profile.digest}
                            </span>
                          </div>
                        ) : null}
                        {profile.lastScan ? (
                          <div className="flex items-center justify-between">
                            <span>최근 스캔</span>
                            <span>{profile.lastScan}</span>
                          </div>
                        ) : null}
                        {profile.registry ? (
                          <div className="flex items-center justify-between">
                            <span>레지스트리</span>
                            <span>{profile.registry}</span>
                          </div>
                        ) : null}
                        {profile.tag ? (
                          <div className="flex items-center justify-between">
                            <span>태그</span>
                            <span>{profile.tag}</span>
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
                        <button className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sky-100 transition hover:bg-white/20">
                          이미지 배포
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                        <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-slate-200 transition hover:border-sky-200 hover:text-sky-100">
                          스캔 보고서
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: PackagePlus,
                  title: "신규 이미지 등록",
                  description:
                    "CI/CD 파이프라인에서 푸시된 태그를 승인하고 자동 서명합니다.",
                  action: "등록 가이드",
                },
                {
                  icon: ClipboardCheck,
                  title: "취약점 스캔",
                  description:
                    "Trivy/Grype 연동으로 CVE 리포트를 생성하고 정책을 업데이트하세요.",
                  action: "스캔 수행",
                },
                {
                  icon: Layers,
                  title: "런타임 템플릿",
                  description:
                    "워크로드별 Helm 차트·K8s 매니페스트를 버전별로 관리합니다.",
                  action: "템플릿 관리",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-200"
                >
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                    <item.icon className="h-4 w-4 text-sky-200" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.description}
                    </p>
                  </div>
                  <button className="mt-auto inline-flex w-max items-center gap-2 text-xs font-semibold text-sky-100 transition hover:text-sky-50">
                    {item.action}
                    <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </section>
      </div>
    </div>
  );
}

