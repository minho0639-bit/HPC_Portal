"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  CheckSquare2,
  PlusCircle,
  RefreshCcw,
  Server,
  Square,
  Tag,
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

const STATUS_BADGE: Record<NodeStatus, string> = {
  healthy: "bg-emerald-500/15 text-emerald-200 border border-emerald-500/40",
  warning: "bg-amber-500/15 text-amber-200 border border-amber-500/40",
  critical: "bg-rose-500/15 text-rose-200 border border-rose-500/40",
};

const STATUS_LABEL: Record<NodeStatus, string> = {
  healthy: "정상",
  warning: "주의",
  critical: "위험",
};

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

const ZONE_OPTIONS = [
  { id: "zone-gpu", label: "GPU 존" },
  { id: "zone-cpu", label: "CPU 존" },
  { id: "zone-storage", label: "스토리지 존" },
] as const;

function formatLabels(labels: string[]) {
  if (labels.length === 0) {
    return "레이블 없음";
  }
  return labels.join(", ");
}

export default function NodeRegistryPanel() {
  const [nodes, setNodes] = useState<RegisteredNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    name: "",
    ipAddress: "",
    zones: [] as string[],
    sshUser: "",
    sshPort: "",
  });
  const [editingNode, setEditingNode] = useState<RegisteredNode | null>(null);
  const [nodeResources, setNodeResources] = useState<
    Record<string, NodeResourceSnapshot | undefined>
  >({});
  const [resourceErrors, setResourceErrors] = useState<Record<string, string>>(
    {},
  );

  const deriveStatus = useCallback(
    (node: RegisteredNode): NodeStatus => {
      const error = resourceErrors[node.id];
      if (error) {
        return "critical";
      }
      const resource = nodeResources[node.id];
      if (!resource) {
        return "warning";
      }
      const cpu = resource.cpu?.usagePercent ?? 0;
      const memory = resource.memory?.usagePercent ?? 0;
      let gpu = 0;
      if (resource.gpus && resource.gpus.length > 0) {
        gpu = Math.max(
          ...resource.gpus.map((gpu) => gpu.usagePercent ?? 0),
          0,
        );
      }
      const maxMetric = Math.max(cpu, memory, gpu);
      if (maxMetric >= 90) return "critical";
      if (maxMetric >= 75) return "warning";
      return "healthy";
    },
    [nodeResources, resourceErrors],
  );

  const totalByStatus = useMemo(() => {
    return nodes.reduce(
      (acc, node) => {
        const status = deriveStatus(node);
        acc[status] += 1;
        return acc;
      },
      { healthy: 0, warning: 0, critical: 0 } as Record<NodeStatus, number>,
    );
  }, [deriveStatus, nodes]);

  const fetchNodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/nodes", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("노드 데이터를 불러오지 못했습니다.");
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
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "노드 데이터를 불러오지 못했습니다.",
      );
      setNodes([]);
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
    const handler = () => {
      fetchNodes();
    };
    window.addEventListener("admin-nodes:updated", handler);
    return () => {
      window.removeEventListener("admin-nodes:updated", handler);
    };
  }, [fetchNodes]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      setSuccess(null);
      setSubmitting(true);

      const zoneLabels = formState.zones
        .map((zoneId) => {
          const option = ZONE_OPTIONS.find((item) => item.id === zoneId);
          return option ? option.label : null;
        })
        .filter((label): label is string => Boolean(label));

        if (zoneLabels.length === 0) {
          setSubmitting(false);
          setError("최소 한 개의 클러스터 존을 선택하세요.");
          return;
        }

        const labels = Array.from(new Set([...zoneLabels]));

        const basePayload = {
          name: formState.name.trim(),
          ipAddress: formState.ipAddress.trim(),
          labels,
          sshUser: formState.sshUser.trim() || undefined,
        };

        const portText = formState.sshPort.trim();
        const parsedPort = portText ? Number.parseInt(portText, 10) : undefined;
        const portValue =
          parsedPort !== undefined && Number.isFinite(parsedPort)
            ? parsedPort
            : undefined;

        if (portText && portValue === undefined) {
          setSubmitting(false);
          setError("SSH 포트는 숫자만 입력할 수 있습니다.");
          return;
        }

        const isEditMode = Boolean(editingNode);
        const url = isEditMode
          ? `/api/admin/nodes/${editingNode!.id}`
          : "/api/admin/nodes";
        const method = isEditMode ? "PATCH" : "POST";

        const payload = {
          ...basePayload,
          sshPort: isEditMode
            ? portText === "" && editingNode?.sshPort
              ? null
              : portValue
            : portValue,
        };

        try {
          const normalizedName = payload.name.toLowerCase();
          const derivedRole = formState.zones.includes("zone-gpu")
            ? "GPU Cluster"
            : formState.zones.includes("zone-storage")
              ? "Storage Node"
              : formState.zones.includes("zone-cpu")
                ? "Compute Node"
                : normalizedName.includes("gpu")
                  ? "GPU Cluster"
                  : normalizedName.includes("storage")
                    ? "Storage Node"
                    : "Compute Node";

          const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...payload,
              role: derivedRole,
            }),
          });

          const result = (await response.json()) as {
            error?: string;
            node?: RegisteredNode;
          };

          if (!response.ok) {
            throw new Error(
              result.error ??
                (isEditMode
                  ? "노드 정보를 수정하지 못했습니다."
                  : "노드 등록에 실패했습니다."),
            );
          }

          setSuccess(
            `${result.node?.name ?? payload.name} 노드가 ${
              isEditMode ? "수정" : "등록"
            }되었습니다.`,
          );
          setFormState({
            name: "",
            ipAddress: "",
        zones: [],
            sshUser: "",
            sshPort: "",
          });
          setEditingNode(null);

          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("admin-nodes:updated"));
          } else {
            fetchNodes();
          }
        } catch (submitError) {
          setError(
            submitError instanceof Error
              ? submitError.message
              : isEditMode
                ? "노드 정보를 수정하지 못했습니다."
                : "노드 등록에 실패했습니다.",
          );
        } finally {
          setSubmitting(false);
        }
    },
      [editingNode, fetchNodes, formState],
  );

    const handleEdit = useCallback((node: RegisteredNode) => {
      setEditingNode(node);
      setFormState({
        name: node.name,
        ipAddress: node.ipAddress,
        zones: ZONE_OPTIONS.filter((option) =>
          node.labels.includes(option.label),
        ).map((option) => option.id),
        sshUser: node.sshUser ?? "",
        sshPort: node.sshPort ? String(node.sshPort) : "",
      });
      setSuccess(null);
      setError(null);
    }, []);

    const handleCancelEdit = useCallback(() => {
      setEditingNode(null);
      setFormState({
        name: "",
        ipAddress: "",
        zones: [],
        sshUser: "",
        sshPort: "",
      });
      setError(null);
      setSuccess(null);
    }, []);

    const handleDelete = useCallback(
      async (node: RegisteredNode) => {
        if (
          typeof window === "undefined" ||
          !window.confirm(
            `${node.name} 노드를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
          )
        ) {
          return;
        }
        setSubmitting(true);
        setError(null);
        setSuccess(null);
        try {
          const response = await fetch(`/api/admin/nodes/${node.id}`, {
            method: "DELETE",
          });
          if (!response.ok && response.status !== 204) {
            const result = await response.json();
            throw new Error(result.error ?? "노드를 삭제하지 못했습니다.");
          }
          setSuccess(`${node.name} 노드가 삭제되었습니다.`);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("admin-nodes:updated"));
          } else {
            fetchNodes();
          }
          setNodeResources((prev) => {
            const next = { ...prev };
            delete next[node.id];
            return next;
          });
          setResourceErrors((prev) => {
            const next = { ...prev };
            delete next[node.id];
            return next;
          });
          if (editingNode?.id === node.id) {
            handleCancelEdit();
          }
        } catch (deleteError) {
          setError(
            deleteError instanceof Error
              ? deleteError.message
              : "노드를 삭제하지 못했습니다.",
          );
        } finally {
          setSubmitting(false);
        }
      },
      [editingNode, fetchNodes, handleCancelEdit],
    );

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-8 xl:flex-row">
        <div className="xl:w-[320px] xl:flex-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                노드 등록
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                모니터링 대상 추가
              </h3>
            </div>
            <Server className="h-5 w-5 text-sky-300" />
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5 text-sm text-slate-200">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                노드 이름
              </label>
              <input
                type="text"
                required
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
                placeholder="예) gpu-node-a01"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                IP 주소
              </label>
              <input
                type="text"
                required
                value={formState.ipAddress}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    ipAddress: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
                placeholder="192.168.20.34"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                클러스터 존
              </label>
              <div className="grid gap-2 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-slate-200">
                {ZONE_OPTIONS.map((option) => {
                  const selected = formState.zones.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        setFormState((prev) => ({
                          ...prev,
                          zones: prev.zones.includes(option.id)
                            ? prev.zones.filter((zone) => zone !== option.id)
                            : [...prev.zones, option.id],
                        }))
                      }
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 transition ${
                        selected
                          ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-100"
                          : "border-white/10 bg-transparent text-slate-300 hover:border-emerald-300/50 hover:text-emerald-100"
                      }`}
                    >
                      <span>{option.label}</span>
                      {selected ? (
                        <CheckSquare2 className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  );
                })}
              </div>
                <p className="text-[11px] text-slate-400">
                  여러 존을 선택할 수 있으며, 선택한 존 레이블이 자동으로 적용됩니다.
                </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                SSH 사용자 (선택)
              </label>
              <input
                type="text"
                value={formState.sshUser}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, sshUser: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
                placeholder="기본값 사용 시 비워두세요"
              />
              <p className="text-[11px] text-slate-400">
                비워두면 서버 환경 변수 <code>NODE_MONITOR_DEFAULT_SSH_USER</code> 값을 사용합니다.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                SSH 포트 (선택)
              </label>
              <input
                type="number"
                min={1}
                max={65535}
                value={formState.sshPort}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, sshPort: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
                placeholder="기본값 22"
              />
            </div>
            {error && (
              <p className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
                <AlertCircle className="h-4 w-4" /> {error}
              </p>
            )}
            {success && (
              <p className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
                <CheckCircle2 className="h-4 w-4" /> {success}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <PlusCircle className="h-4 w-4" />
                {submitting
                  ? editingNode
                    ? "수정 중..."
                    : "등록 중..."
                  : editingNode
                    ? "노드 수정"
                    : "노드 등록"}
              </button>
              {editingNode && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-rose-300 hover:text-rose-200"
                >
                  취소
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                등록 현황
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">
                실시간 노드 상태
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <button
                onClick={() => fetchNodes()}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 transition hover:border-sky-300 hover:text-sky-200"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                새로고침
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 text-xs text-slate-300 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-400">
                <Activity className="h-3.5 w-3.5 text-sky-200" />
                전체 노드
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">{nodes.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-400">정상</p>
              <p className="mt-3 text-2xl font-semibold text-emerald-200">
                {totalByStatus.healthy}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-400">주의 / 위험</p>
              <p className="mt-3 text-2xl font-semibold text-amber-200">
                {totalByStatus.warning + totalByStatus.critical}
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full divide-y divide-white/5 text-left text-xs text-slate-200">
              <thead className="bg-slate-950/60 text-[11px] uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-4 py-3">노드</th>
                  <th className="px-4 py-3">IP / 영역</th>
                  <th className="px-4 py-3">레이블</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">지표</th>
                  <th className="px-4 py-3 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                      노드 정보를 불러오는 중입니다...
                    </td>
                  </tr>
                ) : nodes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      아직 등록된 노드가 없습니다. 왼쪽 폼에서 노드를 추가하세요.
                    </td>
                  </tr>
                ) : (
                  nodes.map((node) => {
                    const resource = nodeResources[node.id];
                    const resourceError = resourceErrors[node.id];
                    const status = deriveStatus(node);
                    const gpuUsage =
                      resource && resource.gpus.length > 0
                        ? Math.max(
                            ...resource.gpus.map((gpu) => gpu.usagePercent ?? 0),
                            0,
                          )
                        : null;

                    return (
                      <tr key={node.id} className="hover:bg-white/5">
                        <td className="px-4 py-4">
                          <p className="font-semibold text-white">{node.name}</p>
                          <p className="text-[11px] text-slate-400">
                            등록 {formatRelative(node.createdAt)}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-mono text-sm text-sky-200">{node.ipAddress}</p>
                          <p className="text-[11px] text-slate-400">{node.role}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="flex items-center gap-2 text-[11px] text-slate-300">
                            <Tag className="h-3 w-3 text-slate-400" />
                            {formatLabels(node.labels)}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ${STATUS_BADGE[status]}`}
                          >
                            <span className="h-2 w-2 rounded-full bg-current" />
                            {STATUS_LABEL[status]}
                          </span>
                          {resourceError ? (
                            <p className="mt-2 text-[10px] text-rose-300">{resourceError}</p>
                          ) : (
                            <p className="mt-2 text-[10px] text-slate-400">
                              {resource
                                ? `수집 ${formatRelative(resource.timestamp)}`
                                : "수집 중..."}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="grid gap-1 text-[11px] text-slate-300">
                            <p>
                              CPU{" "}
                              {resource
                                ? `${resource.cpu.usagePercent.toFixed(1)}%`
                                : "--"}
                            </p>
                            <p>
                              Memory{" "}
                              {resource
                                ? `${resource.memory.usagePercent.toFixed(1)}%`
                                : "--"}
                            </p>
                            {gpuUsage !== null && (
                              <p>GPU {gpuUsage.toFixed(1)}%</p>
                            )}
                            <p>
                              Net In{" "}
                              {resource
                                ? `${resource.network.inboundMbps.toFixed(2)} Mbps`
                                : "--"}
                            </p>
                            <p>
                              Net Out{" "}
                              {resource
                                ? `${resource.network.outboundMbps.toFixed(2)} Mbps`
                                : "--"}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(node)}
                              className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-sky-300 hover:text-sky-100"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDelete(node)}
                              className="rounded-full border border-rose-400/40 px-3 py-1 text-[11px] font-semibold text-rose-200 transition hover:border-rose-300 hover:text-rose-100"
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
