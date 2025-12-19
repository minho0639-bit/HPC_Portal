"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Check, ClipboardList, Package } from "lucide-react";

import { PortalHeader } from "@/components/portal/portal-header";
import { getUserFromSession, type UserData } from "@/lib/user-client";

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

const resourceOptions = [
  { label: "GPU", description: "", defaultValue: "16" },
  { label: "CPU", description: "vCore", defaultValue: "512" },
  { label: "메모리", description: "총 RAM (GB)", defaultValue: "2048" },
  { label: "스토리지", description: "고성능 병렬 스토리지 (TB)", defaultValue: "80" },
];

export default function NewApplicationPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [templates, setTemplates] = useState<ContainerImageTemplate[]>([]);
  const [showTemplateSelect, setShowTemplateSelect] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContainerImageTemplate | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const [formData, setFormData] = useState({
    project: "",
    summary: "",
    startDate: "",
    durationMonths: "6",
    organisation: "",
    gpu: "0",
    cpu: "0",
    memory: "0",
    storage: "0",
    preferredRuntime: "kubernetes",
    preferredImage: "",
    notes: "",
  });

  useEffect(() => {
    const userData = getUserFromSession();
    setUser(userData);
    if (userData) {
      setFormData(prev => ({
        ...prev,
        organisation: userData.organization || "",
      }));
    }
    loadTemplates();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (showTemplateSelect && !target.closest('.template-select-container')) {
        setShowTemplateSelect(false);
      }
    }
    if (showTemplateSelect) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTemplateSelect]);

  async function loadTemplates() {
    try {
      setLoadingTemplates(true);
      const response = await fetch("/api/admin/container-images?action=templates");
      if (!response.ok) {
        throw new Error("템플릿을 불러오지 못했습니다.");
      }
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error("Failed to load templates:", err);
    } finally {
      setLoadingTemplates(false);
    }
  }

  function handleTemplateSelect(template: ContainerImageTemplate) {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      preferredImage: template.image,
      preferredRuntime: template.runtime || "kubernetes",
    }));
    setShowTemplateSelect(false);
  }

  function getAvatarLabel(name: string): string {
    if (name.length >= 2) {
      return name.substring(name.length - 2).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase().padEnd(2, name[0] || "U");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/user/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project: formData.project,
          owner: user?.name || "",
          organisation: formData.organisation,
          summary: formData.summary,
          preferredRuntime: formData.preferredRuntime || "kubernetes",
          preferredImage: formData.preferredImage || "nvidia/cuda:latest",
          deadline: formData.startDate ? (() => {
            const start = new Date(formData.startDate);
            const months = Number(formData.durationMonths) || 6;
            start.setMonth(start.getMonth() + months);
            return start.toISOString().split('T')[0];
          })() : undefined,
          requirements: {
            gpuCount: Number(formData.gpu),
            cpuCores: Number(formData.cpu),
            memoryGb: Number(formData.memory),
            storageTb: Number(formData.storage),
          },
          tags: [],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "자원 신청에 실패했습니다.");
      }

      setSuccess("자원 신청이 완료되었습니다.");
      setTimeout(() => {
        router.push("/user/applications");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <PortalHeader
        title="새로운 자원 신청"
        description="프로젝트 목적과 필요한 자원을 입력하면 자동 검증 규칙이 실행됩니다."
        userName={user?.name || "사용자"}
        userRole={user?.organization || user?.role || "사용자 조직"}
        avatarLabel={user ? getAvatarLabel(user.name) : "U"}
      />

      <div className="flex-1 space-y-8 px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">프로젝트 정보</p>
              <h2 className="text-2xl font-semibold text-white">기본 정보 입력</h2>
            </div>
          </div>
          {error && (
            <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
              {success}
            </div>
          )}

          <div className="mt-6 grid gap-6 text-sm text-slate-200">
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.35em] text-slate-400">프로젝트 명 *</span>
              <input
                required
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-300 focus:outline-none"
                placeholder="예) 양자 시뮬레이션 플랫폼 고도화"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.35em] text-slate-400">연구 목적 *</span>
              <textarea
                required
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                className="min-h-[120px] rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-300 focus:outline-none"
                placeholder="프로젝트 배경, 기대 성과, 협력 기관 등을 입력하세요."
              />
            </label>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.35em] text-slate-400">프로젝트 기간</span>
                <div className="grid gap-3 md:grid-cols-[1fr_120px]">
                  <label className="flex flex-col gap-1">
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-sky-300 focus:outline-none"
                      placeholder="시작일"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <select
                      value={formData.durationMonths}
                      onChange={(e) => setFormData({ ...formData, durationMonths: e.target.value })}
                      className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-sky-300 focus:outline-none"
                    >
                      <option value="1">1개월</option>
                      <option value="3">3개월</option>
                      <option value="6">6개월</option>
                      <option value="12">12개월</option>
                      <option value="24">24개월</option>
                    </select>
                  </label>
                </div>
                {formData.startDate && (
                  <p className="text-xs text-slate-400">
                    종료 예정일: {(() => {
                      const start = new Date(formData.startDate);
                      const months = Number(formData.durationMonths) || 6;
                      start.setMonth(start.getMonth() + months);
                      return start.toLocaleDateString("ko-KR");
                    })()}
                  </p>
                )}
              </div>
              <label className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.35em] text-slate-400">소속 / 협력 기관 *</span>
                <input
                  required
                  value={formData.organisation}
                  onChange={(e) => setFormData({ ...formData, organisation: e.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-300 focus:outline-none"
                  placeholder="예) 국가재난대응본부 · 산학협력" />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">컨테이너 이미지</p>
              <h2 className="text-2xl font-semibold text-white">이미지 템플릿 선택</h2>
            </div>
            <div className="relative template-select-container">
              <button
                type="button"
                onClick={() => setShowTemplateSelect(!showTemplateSelect)}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
              >
                <Package className="h-3.5 w-3.5 text-sky-200" />
                {selectedTemplate ? selectedTemplate.name : "템플릿 선택"}
              </button>
              {showTemplateSelect && (
                <div className="absolute right-0 top-full z-10 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-xl template-select-container">
                  {loadingTemplates ? (
                    <div className="py-4 text-center text-sm text-slate-400">템플릿을 불러오는 중...</div>
                  ) : templates.length === 0 ? (
                    <div className="py-4 text-center text-sm text-slate-400">등록된 템플릿이 없습니다.</div>
                  ) : (
                    <div className="space-y-2">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => handleTemplateSelect(template)}
                          className={`w-full rounded-xl border p-3 text-left transition ${
                            selectedTemplate?.id === template.id
                              ? "border-sky-400/60 bg-sky-500/10"
                              : "border-white/10 bg-white/5 hover:border-sky-300/50 hover:bg-sky-500/5"
                          }`}
                        >
                          <p className="text-sm font-semibold text-white">{template.name}</p>
                          <p className="mt-1 text-xs text-slate-300">{template.image}</p>
                          {template.description && (
                            <p className="mt-1 text-xs text-slate-400">{template.description}</p>
                          )}
                          {template.runtime && (
                            <p className="mt-1 text-[10px] text-slate-500">런타임: {template.runtime}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {selectedTemplate && (
            <div className="mt-4 rounded-2xl border border-sky-400/30 bg-sky-500/10 p-4 text-sm text-slate-200">
              <p className="font-semibold text-white">선택된 템플릿: {selectedTemplate.name}</p>
              <p className="mt-1 text-xs text-slate-300">이미지: {selectedTemplate.image}</p>
              {selectedTemplate.runtime && (
                <p className="mt-1 text-xs text-slate-300">런타임: {selectedTemplate.runtime}</p>
              )}
            </div>
          )}
          {!selectedTemplate && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-400">
              템플릿을 선택하지 않으면 기본 이미지(nvidia/cuda:latest)가 사용됩니다.
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">자원 요구사항</p>
              <h2 className="text-2xl font-semibold text-white">필요 자원 설정</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200">
              <ClipboardList className="h-3.5 w-3.5 text-sky-200" /> 자동 검증 규칙 적용
            </div>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {resourceOptions.map((option) => {
              const fieldMap: Record<string, keyof typeof formData> = {
                "GPU": "gpu",
                "CPU": "cpu",
                "메모리": "memory",
                "스토리지": "storage",
              };
              const fieldName = fieldMap[option.label] || option.label.toLowerCase();
              
              return (
                <label key={option.label} className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-slate-950/50 p-4 text-sm">
                  <span className="text-xs uppercase tracking-[0.35em] text-slate-400">{option.label}</span>
                  {option.description && <span className="text-slate-200">{option.description}</span>}
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData[fieldName] as string}
                    onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.value })}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-sky-300 focus:outline-none"
                  />
                </label>
              );
            })}
          </div>
          <div className="mt-6 grid gap-4 text-xs text-slate-300">
            <p>• GPU 요청 16기 이상 시 SRE 자동 검토가 추가됩니다.</p>
            <p>• 스토리지 100TB 초과 시 전용 계층을 별도 협의합니다.</p>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-slate-900/70 to-slate-950/80 p-6 lg:grid-cols-[minmax(0,_1.1fr)_minmax(0,_0.9fr)]">
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-200">전문가 검토</p>
            <h3 className="mt-2 text-lg font-semibold text-white">추가 상담 요청</h3>
            <p className="mt-3 text-sm text-slate-300/80">
              워크로드 특성이나 보안 정책상 추가 검토가 필요한 경우 메시지를 남겨주세요. 운영팀이 24시간 이내 회신합니다.
            </p>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-4 min-h-[120px] rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-300 focus:outline-none"
              placeholder="예) GPU 메모리 확장 옵션 문의, 파트너 기관 공동 사용 예정"
            />
          </div>
          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/50 p-6 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-200">검증 요약</p>
            <div className="space-y-4">
              {[
                "자동 정책 검증 통과 (보안 레벨 L2)",
                "최근 사용량 초과 없음",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-200">{item}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-4 text-xs text-slate-200">
              제출 후 48시간 이내 운영팀이 검토하며, 승인 시 자동으로 네임스페이스와 자원 쿼터가 생성됩니다.
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5">
              <Check className="h-4 w-4 text-sky-200" />
            </div>
            <div>
              <p className="font-semibold text-white">제출 전 확인을 완료했습니다.</p>
              <p className="text-xs text-slate-400">정책 예외가 필요한 경우 신청서 내 메모를 남겨주세요.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/user/applications"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-75"
            >
              {isSubmitting ? "제출 중..." : "신청 제출"}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        </form>
      </div>
    </div>
  );
}

