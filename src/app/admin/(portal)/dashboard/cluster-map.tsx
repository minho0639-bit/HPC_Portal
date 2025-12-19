"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Server } from "lucide-react";

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

interface ClusterMapProps {
  className?: string;
  nodes: RegisteredNode[];
}

const STATUS_STYLE: Record<
  "healthy" | "warning" | "critical",
  string
> = {
  healthy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  critical: "border-rose-500/30 bg-rose-500/10 text-rose-100",
};

const STATUS_LABEL: Record<"healthy" | "warning" | "critical", string> = {
  healthy: "정상",
  warning: "주의",
  critical: "위험",
};

type ClusterZoneKey = "gpu" | "cpu" | "storage";

const CLUSTER_ZONE_META: Record<
  ClusterZoneKey,
  { label: string; description: string; accent: string }
> = {
  gpu: {
    label: "GPU 존",
    description: "고성능 연산 노드",
    accent: "from-sky-400/20 via-cyan-300/10 to-transparent",
  },
  cpu: {
    label: "CPU 존",
    description: "범용 컴퓨팅 노드",
    accent: "from-emerald-400/20 via-teal-300/10 to-transparent",
  },
  storage: {
    label: "스토리지 존",
    description: "고속 데이터 노드",
    accent: "from-amber-400/20 via-orange-300/10 to-transparent",
  },
};

export default function ClusterMap({ className, nodes }: ClusterMapProps) {
  const [nodeResources, setNodeResources] = useState<
    Record<string, NodeResourceSnapshot | undefined>
  >({});
  const [resourceErrors, setResourceErrors] = useState<Record<string, string>>(
    {},
  );

  const fetchResources = useCallback(async () => {
    const resourcesMap: Record<string, NodeResourceSnapshot | undefined> = {};
    const errorsMap: Record<string, string> = {};

    await Promise.all(
      nodes.map(async (node) => {
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
  }, [nodes]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const interval = window.setInterval(fetchResources, 15000);
    return () => {
      window.clearInterval(interval);
    };
  }, [fetchResources]);

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

  const nodesByZone = useMemo(() => {
    return (Object.keys(CLUSTER_ZONE_META) as ClusterZoneKey[]).map((key) => {
      const meta = CLUSTER_ZONE_META[key];
      const zoneNodes = nodes.filter((node) => node.labels.includes(meta.label));
      return {
        key,
        label: meta.label,
        description: meta.description,
        nodes: zoneNodes,
      };
    });
  }, [nodes]);

  return (
    <div className={className}>
      <p className="text-xs uppercase tracking-[0.35em] text-sky-200">클러스터 지도</p>
      <h3 className="mt-2 text-lg font-semibold text-white">물리 노드 상태</h3>
      <div className="mt-6 space-y-5 text-xs text-slate-200">
        {nodesByZone.map((zone) => (
          <div key={zone.key} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{zone.label}</p>
              <span className="text-[11px] text-slate-400">{zone.description}</span>
            </div>
            {zone.nodes.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-3 text-slate-400">
                등록된 노드 없음
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {zone.nodes.map((node) => {
                  const status = deriveStatus(node.id);
                  return (
                    <span
                      key={node.id}
                      title={`${node.ipAddress}`}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${STATUS_STYLE[status]}`}
                    >
                      <span className="h-2 w-2 rounded-full bg-current" />
                      {node.name}
                      <span className="text-[10px] uppercase tracking-widest text-slate-200/80">
                        {STATUS_LABEL[status]}
                      </span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-3 text-xs text-slate-200">
        {[
          { label: "InfiniBand Fabric", metric: "99.92%", detail: "에러 패킷 0.03%" },
          { label: "동기화 지연", metric: "1.8ms", detail: "SLA 3ms" },
          { label: "네임스페이스 라우팅", metric: "정상", detail: "최근 전환 12분 전" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
              {item.label}
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {item.metric}
            </p>
            <p className="mt-1 text-xs text-slate-400">{item.detail}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <Server className="h-5 w-5 text-sky-200" />
        <div>
          <p className="font-semibold text-white">API Gateway 상태</p>
          <p className="text-xs text-slate-400">요청 성공률 99.98%, 평균 지연 112ms</p>
        </div>
      </div>
    </div>
  );
}

