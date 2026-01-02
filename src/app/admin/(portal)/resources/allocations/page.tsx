"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Cpu,
  Database,
  Loader2,
  MapPin,
  Network,
  NotebookPen,
  Package,
  Server,
  ShieldCheck,
  Swords,
} from "lucide-react";

import { PortalHeader } from "@/components/portal/portal-header";

type ResourceRequestStatus = "pending" | "allocating" | "fulfilled" | "archived";

type ResourceRequest = {
  id: string;
  project: string;
  owner: string;
  organisation: string;
  requestedAt: string;
  deadline?: string;
  status: ResourceRequestStatus;
  summary: string;
  preferredRuntime: string;
  preferredImage: string;
  tags: string[];
  requirements: {
    gpuCount: number;
    cpuCores: number;
    memoryGb: number;
    storageTb: number;
  };
  reviewerNotes?: string;
};

type StoredNode = {
  id: string;
  name: string;
  role: string;
  ipAddress: string;
  labels: string[];
  createdAt: string;
};

type ContainerAllocationStatus =
  | "deploying"
  | "running"
  | "failed"
  | "terminated";

type ContainerAllocation = {
  id: string;
  requestId: string;
  nodeId: string;
  namespace: string;
  containerImage: string;
  runtime: string;
  version: string;
  cpuCores: number;
  gpuCount: number;
  memoryGb: number;
  storageGb: number;
  status: ContainerAllocationStatus;
  createdAt: string;
  assignedBy: string;
  notes?: string;
};

type AllocationPayload = {
  requestId: string;
  nodeId: string;
  namespace: string;
  containerImage: string;
  runtime: string;
  version: string;
  cpuCores: string;
  gpuCount: string;
  memoryGb: string;
  storageGb: string;
  assignedBy: string;
  notes: string;
};

const STATUS_CONFIG: Record<
  ResourceRequestStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "대기",
    className:
      "border border-white/15 bg-white/10 text-slate-200",
  },
  allocating: {
    label: "할당 중",
    className:
      "border border-sky-400/40 bg-sky-500/10 text-sky-100",
  },
  fulfilled: {
    label: "배포 완료",
    className:
      "border border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
  },
  archived: {
    label: "종료",
    className:
      "border border-slate-500/40 bg-slate-500/10 text-slate-200",
  },
};

const ALLOCATION_STATUS_LABEL: Record<
  ContainerAllocationStatus,
  { label: string; className: string }
> = {
  deploying: {
    label: "배포 중",
    className: "bg-sky-500/15 text-sky-100 border border-sky-400/40",
  },
  running: {
    label: "실행 중",
    className:
      "bg-emerald-500/15 text-emerald-100 border border-emerald-400/40",
  },
  failed: {
    label: "실패",
    className: "bg-rose-500/15 text-rose-100 border border-rose-400/40",
  },
  terminated: {
    label: "종료",
    className:
      "bg-slate-500/15 text-slate-100 border border-slate-400/40",
  },
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatNodeLabels = (labels: string[]) =>
  labels.length > 0 ? labels.join(", ") : "레이블 없음";

export default function ContainerAllocationPage() {
  const [requests, setRequests] = useState<ResourceRequest[]>([]);
  const [allRequests, setAllRequests] = useState<ResourceRequest[]>([]); // 타임라인용: 모든 신청 포함
  const [nodes, setNodes] = useState<StoredNode[]>([]);
  const [allocations, setAllocations] = useState<ContainerAllocation[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<Record<string, boolean>>(
    {},
  );
  const [templates, setTemplates] = useState<
    Array<{
      id: string;
      name: string;
      image: string;
      runtime?: string;
    }>
  >([]);
  const [showTemplateSelect, setShowTemplateSelect] = useState(false);
  const [allImages, setAllImages] = useState<
    Array<{
      name: string;
      tag: string;
      digest: string;
      size: string;
    }>
  >([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [showNodeImages, setShowNodeImages] = useState(false);
  const [form, setForm] = useState<AllocationPayload>({
    requestId: "",
    nodeId: "",
    namespace: "",
    containerImage: "",
    runtime: "",
    version: "v1",
    cpuCores: "",
    gpuCount: "",
    memoryGb: "",
    storageGb: "",
    assignedBy: "관리자",
    notes: "",
  });

  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === selectedRequestId) ?? null,
    [requests, selectedRequestId],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const response = await fetch("/api/admin/allocations", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("할당 데이터를 불러오지 못했습니다.");
        }
        const data = (await response.json()) as {
          requests: ResourceRequest[];
          allocations: ContainerAllocation[];
          nodes: StoredNode[];
        };
        if (cancelled) return;
        // 모든 신청 저장 (타임라인에서 종료된 컨테이너의 신청 정보를 찾기 위해)
        setAllRequests(data.requests);
        // archived(종료) 상태의 신청은 제외 (신청 선택 드롭다운용)
        const activeRequests = data.requests.filter(
          (req) => req.status !== "archived"
        );
        setRequests(activeRequests);
        setAllocations(data.allocations);
        setNodes(data.nodes);

        if (!selectedRequestId && activeRequests.length > 0) {
          setSelectedRequestId(activeRequests[0].id);
        }
      } catch (fetchError) {
        if (cancelled) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "할당 데이터를 불러오지 못했습니다.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [templatesResponse, imagesResponse] = await Promise.all([
          fetch("/api/admin/container-images?action=templates"),
          fetch("/api/admin/container-images/images"),
        ]);
        
        if (templatesResponse.ok) {
          const templatesData = (await templatesResponse.json()) as {
            templates: Array<{
              id: string;
              name: string;
              image: string;
              runtime?: string;
            }>;
          };
          setTemplates(templatesData.templates);
        }

        if (imagesResponse.ok) {
          const imagesData = (await imagesResponse.json()) as {
            images: Array<{
              name: string;
              tag: string;
              digest: string;
              size: string;
            }>;
            error?: string;
          };
          if (imagesData.error) {
            console.error("이미지 조회 오류:", imagesData.error);
          }
          setAllImages(imagesData.images || []);
        } else {
          const errorData = await imagesResponse.json().catch(() => ({}));
          console.error("이미지 조회 실패:", errorData);
          setAllImages([]);
        }
      } catch (error) {
        console.error("데이터를 불러오지 못했습니다:", error);
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedRequest) {
      const namespaceSuggestion = selectedRequest.project
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 42);

      const storageGb = Math.round(selectedRequest.requirements.storageTb * 1024);

      setForm((prev) => ({
        ...prev,
        requestId: selectedRequest.id,
        namespace:
          prev.requestId === selectedRequest.id && prev.namespace
            ? prev.namespace
            : namespaceSuggestion || `${selectedRequest.id.toLowerCase()}-ns`,
        containerImage:
          prev.requestId === selectedRequest.id && prev.containerImage
            ? prev.containerImage
            : selectedRequest.preferredImage,
        runtime:
          prev.requestId === selectedRequest.id && prev.runtime
            ? prev.runtime
            : selectedRequest.preferredRuntime,
        cpuCores:
          prev.requestId === selectedRequest.id && prev.cpuCores
            ? prev.cpuCores
            : String(selectedRequest.requirements.cpuCores),
        gpuCount:
          prev.requestId === selectedRequest.id && prev.gpuCount
            ? prev.gpuCount
            : String(selectedRequest.requirements.gpuCount),
        memoryGb:
          prev.requestId === selectedRequest.id && prev.memoryGb
            ? prev.memoryGb
            : String(selectedRequest.requirements.memoryGb),
        storageGb:
          prev.requestId === selectedRequest.id && prev.storageGb
            ? prev.storageGb
            : String(storageGb),
        notes:
          prev.requestId === selectedRequest.id && prev.notes
            ? prev.notes
            : selectedRequest.reviewerNotes ?? "",
      }));
    }
  }, [selectedRequest]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.requestId) {
      setError("먼저 할당할 신청을 선택하세요.");
      return;
    }
    if (!form.nodeId) {
      setError("할당할 노드를 선택하세요.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          cpuCores: Number.parseFloat(form.cpuCores),
          gpuCount: Number.parseFloat(form.gpuCount),
          memoryGb: Number.parseFloat(form.memoryGb),
          storageGb: Number.parseFloat(form.storageGb),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          (result as { error?: string }).error ??
            "컨테이너 할당에 실패했습니다.",
        );
      }

      const { allocation, request } = result as {
        allocation: ContainerAllocation;
        request: ResourceRequest;
      };

      setAllocations((prev) => [allocation, ...prev]);
      setRequests((prev) =>
        prev.map((entry) =>
          entry.id === request.id ? { ...request } : entry,
        ),
      );

      setSuccess(
        `${allocation.containerImage} 이미지를 ${allocation.namespace} 네임스페이스에 배포 중입니다.`,
      );

      setForm((prev) => ({
        ...prev,
        nodeId: "",
        version: `v${Number.parseInt(prev.version.replace(/\D/g, ""), 10) + 1 || 2}`,
      }));
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "컨테이너 할당에 실패했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (
    allocationId: string,
    status: ContainerAllocationStatus,
  ) => {
    setStatusUpdating((prev) => ({ ...prev, [allocationId]: true }));
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/allocations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocationId, status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          (result as { error?: string }).error ??
            "할당 상태를 변경하지 못했습니다.",
        );
      }

      const updated = (result as { allocation: ContainerAllocation }).allocation;

      setAllocations((prev) =>
        prev.map((entry) =>
          entry.id === updated.id ? { ...entry, status: updated.status } : entry,
        ),
      );

      if (allocationId === updated.id) {
        const relatedRequestId =
          allocations.find((entry) => entry.id === allocationId)?.requestId ??
          updated.requestId;

        if (relatedRequestId) {
          // 최신 데이터를 다시 가져오지 않고 상태만 추정으로 업데이트
          const relatedAllocations = allocations
            .map((entry) =>
              entry.id === updated.id ? { ...entry, status: updated.status } : entry,
            )
            .filter((entry) => entry.requestId === relatedRequestId);

          const nextStatus = (() => {
            if (relatedAllocations.length === 0) {
              return "pending" as const;
            }
            if (relatedAllocations.some((entry) => entry.status === "running")) {
              return "fulfilled" as const;
            }
            if (relatedAllocations.every((entry) => entry.status === "terminated")) {
              return "archived" as const;
            }
            return "allocating" as const;
          })();

          setRequests((prev) =>
            prev.map((request) =>
              request.id === relatedRequestId
                ? { ...request, status: nextStatus }
                : request,
            ),
          );
        }
      }

      setSuccess("할당 상태가 업데이트되었습니다.");
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "할당 상태를 변경하지 못했습니다.",
      );
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [allocationId]: false }));
    }
  };

  const totalRunning = allocations.filter(
    (allocation) => allocation.status === "running",
  ).length;

  const totalDeploying = allocations.filter(
    (allocation) => allocation.status === "deploying",
  ).length;

  return (
    <div className="flex min-h-full flex-col">
      <PortalHeader
        title="컨테이너 할당"
        description="승인된 신청을 컨테이너로 배포하고 노드에 할당 상태를 추적하세요."
        userName="관리자"
        userRole="운영 총괄"
        avatarLabel="AD"
        actions={
          <Link
            href="/admin/resources"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            자원 목록으로
          </Link>
        }
      />

      <div className="flex-1 space-y-8 px-6 py-8">
        <section className="grid gap-4 text-sm text-slate-200 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                  대기 신청
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {requests.filter((request) => request.status === "pending").length}
                </p>
              </div>
              <ClipboardList className="h-5 w-5 text-sky-200" />
            </div>
            <p className="mt-3 text-xs text-slate-400">
              승인 완료 후 아직 배포되지 않은 신청 수
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                  배포 진행 중
                </p>
                <p className="mt-2 text-2xl font-semibold text-sky-100">
                  {totalDeploying}
                </p>
              </div>
              <Loader2 className="h-5 w-5 animate-spin text-sky-200" />
            </div>
            <p className="mt-3 text-xs text-slate-400">
              현재 배포 파이프라인이 수행 중인 컨테이너 할당
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                  실행 중 컨테이너
                </p>
                <p className="mt-2 text-2xl font-semibold text-emerald-100">
                  {totalRunning}
                </p>
              </div>
              <ShieldCheck className="h-5 w-5 text-emerald-200" />
            </div>
            <p className="mt-3 text-xs text-slate-400">
              정상적으로 실행 중인 컨테이너 파드 수
            </p>
          </div>
        </section>

        {error && (
          <div className="flex items-center gap-3 rounded-3xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
            <AlertCircle className="h-5 w-5" /> {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
            <CheckCircle2 className="h-5 w-5" /> {success}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,_1fr)_minmax(0,_1fr)]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                  신청 목록
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">배포 대상</h3>
              </div>
              <Swords className="h-5 w-5 text-sky-200" />
            </div>

            <div className="mt-5 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-slate-950/50 p-6 text-xs text-slate-400">
                  데이터를 불러오는 중입니다...
                </div>
              ) : requests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/20 bg-slate-950/50 p-6 text-sm text-slate-400">
                  아직 할당할 신청이 없습니다. 신청이 승인되면 이곳에서 바로 컨테이너 배포를 시작할 수 있습니다.
                </div>
              ) : (
                requests.map((request) => {
                  const isSelected = request.id === selectedRequestId;
                  return (
                    <button
                      key={request.id}
                      onClick={() => setSelectedRequestId(request.id)}
                      className={`w-full rounded-2xl border px-5 py-4 text-left transition ${
                        isSelected
                          ? "border-sky-400/60 bg-sky-500/10 text-white shadow-[0_20px_35px_rgba(56,189,248,0.15)]"
                          : "border-white/10 bg-slate-950/50 hover:border-sky-300/50 hover:bg-sky-500/5"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {request.project}
                          </p>
                          <p className="mt-1 text-xs text-slate-300">
                            {request.organisation} · {request.owner}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${STATUS_CONFIG[request.status].className}`}
                        >
                          {STATUS_CONFIG[request.status].label}
                        </span>
                      </div>
                      <p className="mt-3 text-xs text-slate-300 line-clamp-2">
                        {request.summary}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 font-semibold text-sky-100">
                          <Cpu className="h-3.5 w-3.5" />
                          CPU {request.requirements.cpuCores} vCore
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 font-semibold text-sky-100">
                          <Server className="h-3.5 w-3.5" />
                          GPU {request.requirements.gpuCount}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 font-semibold text-sky-100">
                          <Database className="h-3.5 w-3.5" />
                          메모리 {request.requirements.memoryGb}GB · 스토리지{" "}
                          {request.requirements.storageTb}TB
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest text-slate-400">
                        <span>요청 {formatDate(request.requestedAt)}</span>
                        {request.deadline ? (
                          <span>데드라인 {formatDate(request.deadline)}</span>
                        ) : null}
                        {request.tags.length > 0 ? (
                          <span>{request.tags.join(" · ")}</span>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                  컨테이너 배포
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  노드에 할당
                </h3>
              </div>
              <NotebookPen className="h-5 w-5 text-sky-200" />
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-5 space-y-5 text-sm text-slate-200"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                    신청 ID
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={selectedRequest?.id ?? ""}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300"
                    placeholder="신청을 먼저 선택하세요"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                    노드 선택
                  </label>
                  <select
                    value={form.nodeId}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, nodeId: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
                  >
                    <option value="">노드를 선택하세요</option>
                    {nodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.name} · {node.role}
                      </option>
                    ))}
                  </select>
                    {nodes.length === 0 ? (
                      <p className="text-[11px] text-rose-200">
                        노드가 없습니다. 먼저{" "}
                        <Link
                          href="/admin/resources"
                          className="text-sky-200 underline underline-offset-2"
                        >
                          노드 등록
                        </Link>
                        을 완료하세요.
                      </p>
                    ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                    네임스페이스
                  </label>
                  <input
                    type="text"
                    value={form.namespace}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, namespace: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
                    placeholder="예) disaster-ai"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                    배포 버전
                  </label>
                  <input
                    type="text"
                    value={form.version}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, version: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
                    placeholder="예) v1.0.0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                    컨테이너 이미지
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNodeImages(!showNodeImages);
                        setShowTemplateSelect(false);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:border-emerald-400 hover:text-emerald-200"
                    >
                      <Server className="h-3 w-3" />
                      이미지 선택 {allImages.length > 0 ? `(${allImages.length})` : ""}
                    </button>
                    {templates.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowTemplateSelect(!showTemplateSelect);
                          setShowNodeImages(false);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:border-sky-400 hover:text-sky-200"
                      >
                        <Package className="h-3 w-3" />
                        템플릿 선택
                      </button>
                    )}
                  </div>
                </div>
                {showNodeImages && (
                  <div className="mb-2 rounded-xl border border-white/10 bg-slate-950/80 p-2 max-h-64 overflow-y-auto">
                    {allImages.length > 0 ? (
                      allImages.map((image, index) => {
                        const fullImage = `${image.name}:${image.tag}`;
                        return (
                          <button
                            key={`${image.name}-${image.tag}-${index}`}
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({
                                ...prev,
                                containerImage: fullImage,
                              }));
                              setShowNodeImages(false);
                            }}
                            className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-left text-xs text-slate-200 transition hover:bg-white/10 hover:border-emerald-400/40"
                          >
                            <div className="font-semibold text-white">{fullImage}</div>
                            <div className="mt-1 flex items-center gap-3 text-slate-400">
                              <span className="text-[10px]">{image.size}</span>
                              {image.digest && image.digest !== "<none>" && (
                                <span className="truncate text-[10px] font-mono">
                                  {image.digest.substring(0, 20)}...
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400">
                        이미지가 없습니다. 노드에서 이미지를 확인할 수 없거나 조회 중입니다.
                      </div>
                    )}
                  </div>
                )}
                {showTemplateSelect && templates.length > 0 && (
                  <div className="mb-2 rounded-xl border border-white/10 bg-slate-950/80 p-2 max-h-48 overflow-y-auto">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            containerImage: template.image,
                            runtime: template.runtime || prev.runtime,
                          }));
                          setShowTemplateSelect(false);
                          // 템플릿 사용 기록
                          fetch(`/api/admin/container-images`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              templateId: template.id,
                              recordUsage: true,
                            }),
                          }).catch(() => {});
                        }}
                        className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-left text-xs text-slate-200 transition hover:bg-white/10 hover:border-sky-400/40"
                      >
                        <div className="font-semibold text-white">{template.name}</div>
                        <div className="mt-1 text-slate-400">{template.image}</div>
                        {template.runtime && (
                          <div className="mt-1 text-slate-500">{template.runtime}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  value={form.containerImage}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      containerImage: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
                  placeholder="registry/namespace/image:tag"
                />
                <p className="text-xs text-slate-400">
                  템플릿을 선택하거나 직접 입력하세요.{" "}
                  <Link
                    href="/admin/resources/images"
                    className="text-sky-300 underline underline-offset-4 hover:text-sky-200"
                  >
                    이미지 관리
                  </Link>
                  에서 템플릿을 추가할 수 있습니다.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                  런타임
                </label>
                <input
                  type="text"
                  value={form.runtime}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, runtime: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
                  placeholder="예) Kubernetes + Slurm"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: "CPU vCore",
                    value: form.cpuCores,
                    key: "cpuCores",
                    icon: Cpu,
                  },
                  {
                    label: "GPU",
                    value: form.gpuCount,
                    key: "gpuCount",
                    icon: Server,
                  },
                  {
                    label: "메모리 (GB)",
                    value: form.memoryGb,
                    key: "memoryGb",
                    icon: Network,
                  },
                  {
                    label: "스토리지 (GB)",
                    value: form.storageGb,
                    key: "storageGb",
                    icon: Database,
                  },
                ].map((field) => (
                  <div key={field.key} className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                      {field.label}
                    </label>
                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white transition focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-400/40">
                      <field.icon className="h-4 w-4 text-sky-200" />
                      <input
                        type="number"
                        min={0}
                        value={field.value}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            [field.key]: event.target.value,
                          }))
                        }
                        className="w-full bg-transparent text-sm text-white outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                    배포 담당자
                  </label>
                  <input
                    type="text"
                    value={form.assignedBy}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        assignedBy: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
                    placeholder="예) 운영1팀 김연구"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                    비고 / 전달 사항
                  </label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, notes: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
                    placeholder="배포 후 검증 절차 등"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] text-slate-400">
                  제출 시 즉시 배포 파이프라인이 실행되며, 상태 변화는 아래 테이블에서 실시간으로 확인 가능합니다.
                </p>
                <button
                  type="submit"
                  disabled={submitting || loading}
                  className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" />
                  )}
                  컨테이너 배포 시작
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                할당 현황
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                컨테이너 배포 타임라인
              </h3>
            </div>
            <MapPin className="h-5 w-5 text-sky-200" />
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-left text-xs text-slate-200">
              <thead className="bg-slate-950/60 text-[11px] uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-4 py-3">컨테이너</th>
                  <th className="px-4 py-3">신청 / 노드</th>
                  <th className="px-4 py-3">리소스</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-slate-400"
                    >
                      데이터를 불러오는 중입니다...
                    </td>
                  </tr>
                ) : allocations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      아직 생성된 컨테이너 할당이 없습니다. 상단에서 신청을 선택하여 배포를 시작하세요.
                    </td>
                  </tr>
                ) : (
                  allocations.map((allocation) => {
                    const node = nodes.find((entry) => entry.id === allocation.nodeId);
                    // 타임라인에서는 모든 신청(allRequests)에서 찾아야 종료된 컨테이너의 신청 정보도 표시됨
                    const request = allRequests.find(
                      (entry) => entry.id === allocation.requestId,
                    );
                    return (
                      <tr key={allocation.id} className="hover:bg-white/5">
                        <td className="px-4 py-4">
                          <p className="font-semibold text-white">
                            {allocation.containerImage}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {allocation.namespace} · {allocation.runtime}
                          </p>
                          <p className="mt-1 text-[10px] uppercase tracking-widest text-slate-500">
                            {formatDate(allocation.createdAt)}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-[11px] text-slate-300">
                            {request ? `${request.organisation} · ${request.owner}` : `신청 ${allocation.requestId}`}
                          </p>
                          <p className="text-sm font-semibold text-sky-100">
                            {request?.project ?? "알 수 없는 신청"}
                          </p>
                          <p className="mt-2 text-[11px] text-slate-300">
                            노드 {node?.name ?? "미등록"} · {node?.role ?? "역할 미상"}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {node ? formatNodeLabels(node.labels) : "노드 정보 없음"}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="grid gap-1 text-[11px] text-slate-300">
                            <span>CPU {allocation.cpuCores} vCore</span>
                            <span>GPU {allocation.gpuCount}</span>
                            <span>메모리 {allocation.memoryGb} GB</span>
                            <span>스토리지 {allocation.storageGb} GB</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${ALLOCATION_STATUS_LABEL[allocation.status].className}`}
                          >
                            {ALLOCATION_STATUS_LABEL[allocation.status].label}
                          </span>
                          <p className="mt-2 text-[10px] text-slate-400">
                            담당 {allocation.assignedBy}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <select
                              value={allocation.status}
                              onChange={(event) =>
                                handleStatusChange(
                                  allocation.id,
                                  event.target.value as ContainerAllocationStatus,
                                )
                              }
                              disabled={statusUpdating[allocation.id]}
                              className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-[11px] font-semibold text-slate-200 outline-none transition hover:border-sky-300 hover:text-sky-100 disabled:cursor-not-allowed"
                            >
                              <option value="deploying">배포 중</option>
                              <option value="running">실행 중</option>
                              <option value="failed">실패</option>
                              <option value="terminated">종료</option>
                            </select>
                            <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-widest text-slate-400">
                              {allocation.version}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                운영 가이드
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                검증 및 후속 조치
              </h3>
            </div>
            <CheckCircle2 className="h-5 w-5 text-sky-200" />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "배포 완료 검증",
                description:
                  "컨테이너 상태가 Running으로 전환되면 자동으로 테스트 시나리오를 실행하고 결과 로그를 첨부하세요.",
              },
              {
                title: "자원 쿼터 동기화",
                description:
                  "배포된 네임스페이스의 CPU/GPU/메모리 쿼터를 신청서 요구사항과 비교해 초과 배포 여부를 확인합니다.",
              },
              {
                title: "보안 정책 적용",
                description:
                  "네트워크 정책, 이미지 서명, 비밀 정보(Secrets) 적용 여부를 검증하고 로그를 정책 저장소에 업로드하세요.",
              },
              {
                title: "모니터링 핸드오버",
                description:
                  "24시간 이내 모니터링 대시보드에 워크로드를 추가하고 SLA 알림을 설정한 뒤, 요청자에게 완료 소식을 전송합니다.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
              >
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-xs text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

