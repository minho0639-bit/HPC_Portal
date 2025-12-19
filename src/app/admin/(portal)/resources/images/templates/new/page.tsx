"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Server } from "lucide-react";
import Link from "next/link";

export default function NewTemplatePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [allImages, setAllImages] = useState<
    Array<{
      name: string;
      tag: string;
      digest: string;
      size: string;
    }>
  >([]);
  const [showNodeImages, setShowNodeImages] = useState(false);
  const [form, setForm] = useState({
    name: "",
    image: "",
    description: "",
    runtime: "",
    tags: "",
    createdBy: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const imagesResponse = await fetch("/api/admin/container-images/images");
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
        console.error("이미지 데이터를 불러오지 못했습니다:", error);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const tags = form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const response = await fetch("/api/admin/container-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "template",
          data: {
            name: form.name.trim(),
            image: form.image.trim(),
            description: form.description.trim() || undefined,
            runtime: form.runtime.trim() || undefined,
            tags,
            createdBy: form.createdBy.trim() || "관리자",
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "템플릿을 생성하지 못했습니다.");
      }

      router.push("/admin/resources/images");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "템플릿을 생성하지 못했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/resources/images"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-white">새 이미지 템플릿</h1>
          <p className="mt-1 text-sm text-slate-400">
            자주 사용하는 컨테이너 이미지를 템플릿으로 저장합니다.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 space-y-6">
        <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
              템플릿 이름 *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
              placeholder="예) PyTorch GPU 학습 환경"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                컨테이너 이미지 *
              </label>
              <button
                type="button"
                onClick={() => setShowNodeImages(!showNodeImages)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:border-emerald-400 hover:text-emerald-200"
              >
                <Server className="h-3 w-3" />
                이미지 선택 {allImages.length > 0 ? `(${allImages.length})` : ""}
              </button>
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
                            image: fullImage,
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
            <input
              type="text"
              required
              value={form.image}
              onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
              placeholder="예) pytorch/pytorch:2.0.1-cuda11.7-cudnn8-runtime"
            />
            <p className="text-xs text-slate-400">
              이미지를 선택하거나 직접 입력하세요 (registry/namespace/image:tag)
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
              설명
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
              placeholder="이 템플릿에 대한 설명을 입력하세요..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                런타임
              </label>
              <input
                type="text"
                value={form.runtime}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, runtime: e.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
                placeholder="예) Kubernetes + Slurm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                태그 (쉼표로 구분)
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, tags: e.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
                placeholder="예) pytorch, gpu, ml"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
              생성자
            </label>
            <input
              type="text"
              value={form.createdBy}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, createdBy: e.target.value }))
              }
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
              placeholder="관리자"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/resources/images"
            className="rounded-full border border-white/15 px-6 py-2 text-sm font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-slate-950 shadow-[0_12px_30px_rgba(56,189,248,0.35)] transition hover:bg-sky-400 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {submitting ? "저장 중..." : "템플릿 저장"}
          </button>
        </div>
      </form>
    </div>
  );
}

