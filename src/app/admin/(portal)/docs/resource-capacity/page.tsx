import Link from "next/link";

import { PortalHeader } from "@/components/portal/portal-header";
import { getResourceCapacity } from "@/lib/resource-capacity-store";

export const dynamic = "force-dynamic";

const GUIDE_ITEMS = [
  {
    title: "CPU (vCore)",
    description:
      "vCore 기준은 하이퍼스레딩이 적용된 가상 CPU 단위입니다. 신청 검토 시 프로젝트별로 허용된 최대 vCore와 현재 클러스터 여유량을 함께 확인하세요.",
  },
  {
    title: "GPU",
    description:
      "GPU 총량은 운영 중인 가속기 수입니다. GPU 유형별 가중치가 필요한 경우 신청서에 등급(예: A100=1, H100=1.2)을 명시하고 수동 조정합니다.",
  },
  {
    title: "메모리",
    description:
      "메모리는 워크로드에 실제로 할당 가능한 용량(GB)입니다. NUMA 구성이 다른 노드는 노드 레이블을 통해 별도 관리하세요.",
  },
  {
    title: "스토리지",
    description:
      "스토리지는 고성능/공유 스토리지 등 운영 정책에 따라 구분할 수 있습니다. 필요한 경우 저장소 풀별 JSON을 분리해 관리하세요.",
  },
];

export default async function ResourceCapacityGuidePage() {
  const capacity = await getResourceCapacity();

  const capacityRows = [
    {
      label: "CPU 총량",
      value: `${capacity.cpu.totalCores.toLocaleString()} vCore`,
      description: capacity.cpu.description,
    },
    {
      label: "GPU 총량",
      value: `${capacity.gpu.totalUnits.toLocaleString()} GPU`,
      description: capacity.gpu.description,
    },
    {
      label: "메모리 총량",
      value: `${capacity.memory.totalGb.toLocaleString()} GB`,
      description: capacity.memory.description,
    },
    {
      label: "스토리지 총량",
      value: `${capacity.storage.totalGb.toLocaleString()} GB`,
      description: capacity.storage.description,
    },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <PortalHeader
        title="자원 용량 정의"
        description="컨테이너 워크로드 현황 계산에 사용되는 기준 용량을 관리합니다."
        userName="관리자"
        userRole="운영 총괄"
        avatarLabel="AD"
        actions={
          <Link
            href="/admin/resources"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100"
          >
            자원 현황 보기
          </Link>
        }
      />

      <div className="flex-1 space-y-8 px-6 py-8">
        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
          <h2 className="text-lg font-semibold text-white">현재 기준 용량</h2>
          <p className="text-xs text-slate-400">
            아래 값은 <code className="rounded bg-slate-950/60 px-1 py-0.5 text-[11px]">
              data/resource-capacity.json
            </code>{" "}
            파일을 수정하여 업데이트할 수 있습니다. 버전 관리를 위해 Git 저장소에 함께 보관하는 것을 권장합니다.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {capacityRows.map((row) => (
              <div
                key={row.label}
                className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
              >
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                  {row.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{row.value}</p>
                <p className="mt-2 text-xs text-slate-400">{row.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
          <h2 className="text-lg font-semibold text-white">신청 검토 시 참고</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {GUIDE_ITEMS.map((item) => (
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
