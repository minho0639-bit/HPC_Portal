"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Package,
  Plus,
  Search,
  Trash2,
  Edit,
  Star,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

interface ContainerImageRegistry {
  id: string;
  name: string;
  type: "docker-hub" | "private" | "quay" | "ghcr" | "other";
  baseUrl: string;
  requiresAuth: boolean;
  createdAt: string;
  description?: string;
}

interface ContainerImageTemplate {
  id: string;
  name: string;
  image: string;
  description?: string;
  tags: string[];
  runtime?: string;
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
  createdBy: string;
}

export default function ContainerImagesPage() {
  const [registries, setRegistries] = useState<ContainerImageRegistry[]>([]);
  const [templates, setTemplates] = useState<ContainerImageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"templates" | "registries">(
    "templates",
  );
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showCreateRegistry, setShowCreateRegistry] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/container-images");
      if (!response.ok) {
        throw new Error("데이터를 불러오지 못했습니다.");
      }
      const data = (await response.json()) as {
        registries: ContainerImageRegistry[];
        templates: ContainerImageTemplate[];
      };
      setRegistries(data.registries);
      setTemplates(data.templates);
      setError(null);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "데이터를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("이 템플릿을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/container-images?type=template&id=${templateId}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        throw new Error("템플릿을 삭제하지 못했습니다.");
      }
      await fetchData();
    } catch (deleteError) {
      alert(
        deleteError instanceof Error
          ? deleteError.message
          : "템플릿을 삭제하지 못했습니다.",
      );
    }
  };

  const handleDeleteRegistry = async (registryId: string) => {
    if (!confirm("이 레지스트리를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/container-images?type=registry&id=${registryId}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        throw new Error("레지스트리를 삭제하지 못했습니다.");
      }
      await fetchData();
    } catch (deleteError) {
      alert(
        deleteError instanceof Error
          ? deleteError.message
          : "레지스트리를 삭제하지 못했습니다.",
      );
    }
  };

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.image.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  const filteredRegistries = registries.filter(
    (registry) =>
      registry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      registry.baseUrl.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-slate-400">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">컨테이너 이미지 관리</h1>
        <p className="mt-2 text-sm text-slate-400">
          자주 사용하는 이미지 템플릿과 레지스트리를 관리합니다.
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-6">
        {/* 탭 */}
        <div className="flex gap-2 border-b border-white/10">
          <button
            onClick={() => setActiveTab("templates")}
            className={`px-4 py-2 text-sm font-semibold transition ${
              activeTab === "templates"
                ? "border-b-2 border-sky-400 text-sky-200"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            이미지 템플릿 ({templates.length})
          </button>
          <button
            onClick={() => setActiveTab("registries")}
            className={`px-4 py-2 text-sm font-semibold transition ${
              activeTab === "registries"
                ? "border-b-2 border-sky-400 text-sky-200"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            레지스트리 ({registries.length})
          </button>
        </div>

        {/* 검색 및 액션 */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === "templates"
                  ? "템플릿 검색..."
                  : "레지스트리 검색..."
              }
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 pl-10 pr-4 py-2 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
            />
          </div>
          {activeTab === "templates" ? (
            <Link
              href="/admin/resources/images/templates/new"
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_12px_30px_rgba(56,189,248,0.35)] transition hover:bg-sky-400"
            >
              <Plus className="h-3.5 w-3.5" />
              템플릿 추가
            </Link>
          ) : (
            <Link
              href="/admin/resources/images/registries/new"
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_12px_30px_rgba(56,189,248,0.35)] transition hover:bg-sky-400"
            >
              <Plus className="h-3.5 w-3.5" />
              레지스트리 추가
            </Link>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        {/* 템플릿 목록 */}
        {activeTab === "templates" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-white/20 bg-slate-950/40 p-8 text-center text-sm text-slate-400">
                {searchQuery
                  ? "검색 결과가 없습니다."
                  : "등록된 템플릿이 없습니다. 템플릿을 추가하여 자주 사용하는 이미지를 빠르게 선택할 수 있습니다."}
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-sky-300" />
                        <h3 className="font-semibold text-white">
                          {template.name}
                        </h3>
                      </div>
                      <p className="mt-2 text-xs text-slate-300">
                        {template.image}
                      </p>
                      {template.description && (
                        <p className="mt-2 text-xs text-slate-400">
                          {template.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-500/20 hover:text-rose-300"
                        title="삭제"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {template.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {template.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {template.usageCount}회 사용
                      </span>
                      {template.runtime && (
                        <span>{template.runtime}</span>
                      )}
                    </div>
                    {template.lastUsedAt && (
                      <span>
                        {new Date(template.lastUsedAt).toLocaleDateString("ko-KR")}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 레지스트리 목록 */}
        {activeTab === "registries" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRegistries.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-white/20 bg-slate-950/40 p-8 text-center text-sm text-slate-400">
                {searchQuery
                  ? "검색 결과가 없습니다."
                  : "등록된 레지스트리가 없습니다."}
              </div>
            ) : (
              filteredRegistries.map((registry) => (
                <div
                  key={registry.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-emerald-300" />
                        <h3 className="font-semibold text-white">
                          {registry.name}
                        </h3>
                      </div>
                      <p className="mt-2 text-xs text-slate-300">
                        {registry.baseUrl}
                      </p>
                      {registry.description && (
                        <p className="mt-2 text-xs text-slate-400">
                          {registry.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteRegistry(registry.id)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-500/20 hover:text-rose-300"
                      title="삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="rounded-full bg-white/10 px-2 py-1 text-slate-300">
                      {registry.type}
                    </span>
                    {registry.requiresAuth && (
                      <span className="flex items-center gap-1 text-amber-300">
                        <CheckCircle2 className="h-3 w-3" />
                        인증 필요
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

