"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCcw,
  Server,
  SignalHigh,
} from "lucide-react";

import type { NodeResourceSnapshot } from "@/lib/admin-node-resources";

type NodeStatus = "healthy" | "warning" | "critical";

interface RegisteredNode {
  id: string;
  name: string;
  ipAddress: string;
  role: string;
  labels: string[];
  createdAt: string;
  sshUser?: string;
  sshPort?: number;
}

interface NodeMonitorOverviewProps {
  className?: string;
}

const STATUS_TEXT: Record<NodeStatus, string> = {
  healthy: "정상",
  warning: "주의",
  critical: "위험",
};

function classNames(...tokens: Array<string | false | null | undefined>) {
  return tokens.filter(Boolean).join(" ");
}

function formatRelative(isoDate: string) {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}초 전`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.round(diffHour / 24);
  return `${diffDay}일 전`;
}

export default function NodeMonitorOverview({ className }: NodeMonitorOverviewProps) {
  const [nodes, setNodes] = useState<RegisteredNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodeResources, setNodeResources] = useState<
    Record<string, NodeResourceSnapshot | undefined>
  >({});
  const [resourceErrors, setResourceErrors] = useState<Record<string, string>>(
    {},
  );

  const fetchNodes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/nodes", {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("노드 상태를 불러오지 못했습니다.");
      }
      const data = (await response.json()) as { nodes?: RegisteredNode[] };
      const fetchedNodes = data.nodes ?? [];
      setNodes(fetchedNodes);

      const resourcesMap: Record<string, NodeResourceSnapshot | undefined> = {};
      const errorsMap: Record<string, string> = {};

      await Promise.all(
        fetchedNodes.map(async (node) => {
          try {
            const res = await fetch(`/api/admin/nodes/${node.id}/resources`, {
              method: "GET",
              headers: { "Content-Type": "application/json" },
              cache: "no-store",
            });
            if (!res.ok) {
              const result = await res.json().catch(() => ({}));
              throw new Error(
                (result as { error?: string }).error ??
                  "리소스를 수집하지 못했습니다.",
              );
            }
            const result = (await res.json()) as {
              resources: NodeResourceSnapshot;
            };
            resourcesMap[node.id] = result.resources;
          } catch (resourceError) {
            errorsMap[node.id] =
              resourceError instanceof Error
                ? resourceError.message
                : "리소스를 수집하지 못했습니다.";
            resourcesMap[node.id] = undefined;
          }
        }),
      );

      setNodeResources(resourcesMap);
      setResourceErrors(errorsMap);
      setError(null);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "노드 상태를 불러오지 못했습니다.",
      );
      setNodeResources({});
      setResourceErrors({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handler = () => fetchNodes();
    window.addEventListener("admin-nodes:updated", handler);
    const interval = window.setInterval(handler, 15000);
    return () => {
      window.removeEventListener("admin-nodes:updated", handler);
      window.clearInterval(interval);
    };
  }, [fetchNodes]);

  const deriveStatus = useCallback(
    (nodeId: string): NodeStatus => {
      if (resourceErrors[nodeId]) {
        return "critical";
      }
      const resource = nodeResources[nodeId];
      if (!resource) {
        return "warning";
      }
      const cpu = resource.cpu?.usagePercent ?? 0;
      const memory = resource.memory?.usagePercent ?? 0;
      const gpu =
        resource.gpus && resource.gpus.length > 0
          ? Math.max(...resource.gpus.map((gpu) => gpu.usagePercent ?? 0), 0)
          : 0;
      const maxMetric = Math.max(cpu, memory, gpu);
      if (maxMetric >= 90) return "critical";
      if (maxMetric >= 75) return "warning";
      return "healthy";
    },
    [nodeResources, resourceErrors],
  );

  const aggregates = useMemo(
    () =>
      nodes.reduce(
        (acc, node) => {
          const status = deriveStatus(node.id);
          acc[status] += 1;
          return acc;
        },
        { healthy: 0, warning: 0, critical: 0 },
      ),
    [deriveStatus, nodes],
  );

  type ZoneKey = "gpu" | "cpu" | "storage";

  const ZONE_CONFIG: Record<
    ZoneKey,
    { label: string; accent: string; description: string }
  > = {
    gpu: {
      label: "GPU 존",
      accent: "from-sky-500/20 via-cyan-400/10 to-transparent",
      description: "고성능 연산 노드",
    },
    cpu: {
      label: "CPU 존",
      accent: "from-emerald-500/20 via-teal-400/10 to-transparent",
      description: "범용 컴퓨팅 노드",
    },
    storage: {
      label: "스토리지 존",
      accent: "from-amber-400/20 via-orange-300/10 to-transparent",
      description: "고속 데이터 노드",
    },
  };

  const zoneStats = useMemo(() => {
    const base = () => ({
      total: 0,
      healthy: 0,
      warning: 0,
      critical: 0,
      avgCpu: 0,
      avgGpu: 0,
      avgMemory: 0,
      sampleCount: 0,
    });

    const stats: Record<ZoneKey, ReturnType<typeof base>> = {
      gpu: base(),
      cpu: base(),
      storage: base(),
    };

    nodes.forEach((node) => {
      const matchedZones: ZoneKey[] = [];
      if (node.labels.includes("GPU 존")) matchedZones.push("gpu");
      if (node.labels.includes("CPU 존")) matchedZones.push("cpu");
      if (node.labels.includes("스토리지 존")) matchedZones.push("storage");

      if (matchedZones.length === 0) {
        return;
      }

      matchedZones.forEach((zone) => {
        const entry = stats[zone];
        entry.total += 1;
        const status = deriveStatus(node.id);
        entry[status] += 1;

        const resource = nodeResources[node.id];
        if (resource) {
          entry.avgCpu += resource.cpu.usagePercent;
          entry.avgMemory += resource.memory.usagePercent;
          const gpuUsage =
            resource.gpus && resource.gpus.length > 0
              ? Math.max(...resource.gpus.map((gpu) => gpu.usagePercent ?? 0), 0)
              : 0;
          entry.avgGpu += gpuUsage;
          entry.sampleCount += 1;
        }
      });
    });

    (Object.keys(stats) as ZoneKey[]).forEach((zone) => {
      const entry = stats[zone];
      if (entry.sampleCount > 0) {
        entry.avgCpu = Number((entry.avgCpu / entry.sampleCount).toFixed(1));
        entry.avgGpu = Number((entry.avgGpu / entry.sampleCount).toFixed(1));
        entry.avgMemory = Number(
          (entry.avgMemory / entry.sampleCount).toFixed(1),
        );
      }
    });

    return stats;
  }, [deriveStatus, nodeResources, nodes]);

  const topNodes = useMemo(() => {
    const enriched = nodes
      .map((node) => ({
        node,
        resource: nodeResources[node.id],
        status: deriveStatus(node.id),
        error: resourceErrors[node.id],
      }))
      .filter((entry) => entry.resource);

    enriched.sort(
        (a, b) => {
          const aGpu =
            a.resource && a.resource.gpus.length > 0
              ? Math.max(...a.resource.gpus.map((gpu) => gpu.usagePercent ?? 0))
              : 0;
          const bGpu =
            b.resource && b.resource.gpus.length > 0
              ? Math.max(...b.resource.gpus.map((gpu) => gpu.usagePercent ?? 0))
              : 0;
          const aScore = Math.max(
            a.resource?.cpu.usagePercent ?? 0,
            aGpu,
            a.resource?.memory.usagePercent ?? 0,
          );
          const bScore = Math.max(
            b.resource?.cpu.usagePercent ?? 0,
            bGpu,
            b.resource?.memory.usagePercent ?? 0,
          );
          return bScore - aScore;
        },
    );

    return enriched.slice(0, 4);
  }, [deriveStatus, nodeResources, nodes, resourceErrors]);

  return (
    <div
      className={classNames(
        "rounded-3xl border border-white/10 bg-slate-950/50 p-6",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
            노드 모니터링
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            실시간 상태 요약
          </h3>
        </div>
        <button
          onClick={fetchNodes}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:border-sky-300 hover:text-sky-200"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          새로고침
        </button>
      </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(Object.keys(ZONE_CONFIG) as ZoneKey[]).map((zone) => {
            const config = ZONE_CONFIG[zone];
            const stats = zoneStats[zone];
            const healthyRatio =
              stats.total > 0 ? Math.round((stats.healthy / stats.total) * 100) : 0;
            return (
              <div
                key={zone}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 p-4"
              >
                <div
                  className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${config.accent}`}
                />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">
                      {config.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {stats.total > 0
                        ? `정상 ${stats.healthy}/${stats.total}`
                        : "노드 없음"}
                    </p>
                  </div>
                  <p className="text-xs text-slate-300">{config.description}</p>
                </div>
                {stats.total > 0 ? (
                  <div className="mt-3 h-2 rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-sky-300 transition-all"
                      style={{ width: `${healthyRatio}%` }}
                    />
                  </div>
                ) : null}
                <div className="mt-3 grid gap-1 text-[11px] text-slate-300">
                  <p>
                    평균 CPU{" "}
                    {stats.sampleCount > 0 ? `${stats.avgCpu}%` : "--"}
                  </p>
                  <p>
                    평균 GPU{" "}
                    {stats.sampleCount > 0 ? `${stats.avgGpu}%` : "--"}
                  </p>
                  <p>
                    평균 메모리{" "}
                    {stats.sampleCount > 0 ? `${stats.avgMemory}%` : "--"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      <div className="mt-6 grid gap-3 text-sm text-slate-200 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-200" />
          <div>
            <p className="text-xs uppercase tracking-widest text-emerald-200">정상</p>
            <p className="text-lg font-semibold text-white">{aggregates.healthy}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-200" />
          <div>
            <p className="text-xs uppercase tracking-widest text-amber-200">주의</p>
            <p className="text-lg font-semibold text-white">{aggregates.warning}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
          <Server className="h-4 w-4 text-rose-200" />
          <div>
            <p className="text-xs uppercase tracking-widest text-rose-200">위험</p>
            <p className="text-lg font-semibold text-white">{aggregates.critical}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
          부하 상위 노드
        </p>
        {loading ? (
          <p className="text-sm text-slate-400">노드 상태를 불러오는 중입니다...</p>
        ) : error ? (
          <p className="text-sm text-rose-200">{error}</p>
        ) : topNodes.length === 0 ? (
          <p className="text-sm text-slate-400">
            수집된 노드가 없습니다. 자원 & 노드 페이지에서 노드를 추가하세요.
          </p>
        ) : (
          <div className="space-y-3">
            {topNodes.map(({ node, resource, status, error: statusError }) => (
              <div
                key={node.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200"
              >
                <div>
                  <p className="font-semibold text-white">{node.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {node.ipAddress} · {node.role}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">
                        CPU / GPU / Memory
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {resource
                          ? `${resource.cpu.usagePercent.toFixed(1)}% / ${
                              resource.gpus && resource.gpus.length > 0
                                ? Math.max(
                                    ...resource.gpus.map(
                                      (gpu) => gpu.usagePercent ?? 0,
                                    ),
                                  ).toFixed(1)
                                : "—"
                            }% / ${resource.memory.usagePercent.toFixed(1)}%`
                          : "-- / -- / --"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">
                      트래픽
                    </p>
                    <p className="text-sm font-semibold text-amber-200">
                      {resource
                        ? `${Math.max(
                            resource.network.inboundMbps,
                            resource.network.outboundMbps,
                          ).toFixed(2)} Mbps`
                        : "--"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">
                      상태
                    </p>
                    <p className="text-sm font-semibold">
                      {STATUS_TEXT[status]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">
                      수집 시각
                    </p>
                    <p className="text-sm font-semibold text-slate-300">
                      {resource
                        ? formatRelative(resource.timestamp)
                        : statusError
                          ? "오류"
                          : "수집 중"}
                    </p>
                  </div>
                  <SignalHigh className="h-4 w-4 text-sky-200" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
