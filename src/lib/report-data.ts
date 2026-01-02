// 리포트 페이지용 데이터 타입 정의 및 유틸리티

import type { ResourceRequest, ContainerAllocation } from "./admin-resource-allocations";

export interface EfficiencyMetric {
  label: string;
  value: string;
  change: string;
  detail: string;
}

export interface OrganizationUsage {
  name: string;
  share: number;
  hours: number;
}

export interface PolicyCompliance {
  title: string;
  description: string;
}

export interface OptimizationTip {
  text: string;
}

export interface MonthlyReport {
  month: string;
  title: string;
}

export interface HourlyTrendData {
  hour: number;
  gpuUsage: number;
  cpuUsage: number;
}

// 효율성 지표 데이터
export const efficiencyMetrics: EfficiencyMetric[] = [
  {
    label: "GPU 효율",
    value: "86%",
    change: "+4.2%",
    detail: "우선순위 정책 적용 후",
  },
  {
    label: "CPU 효율",
    value: "79%",
    change: "+2.7%",
    detail: "큐 정렬 최적화",
  },
  {
    label: "큐 대기 시간",
    value: "3.8분",
    change: "-1.2분",
    detail: "SLA 10분 이하 유지",
  },
  {
    label: "자원 활용률",
    value: "82%",
    change: "+3.5%",
    detail: "전체 클러스터 기준",
  },
];

/**
 * 실제 데이터에서 조직별 사용량을 계산합니다.
 * 현재 실행 중인 allocations를 기준으로 조직별 CPU 코어 수를 집계합니다.
 * 
 * 주의: 이 함수는 서버 사이드에서만 실행되어야 합니다.
 * 클라이언트에서는 API 라우트를 통해 호출해야 합니다.
 */
export function calculateOrganizationUsage(
  requests: ResourceRequest[],
  allocations: ContainerAllocation[]
): OrganizationUsage[] {
  try {

    // 실행 중인 allocations만 필터링
    const runningAllocations = allocations.filter(
      (allocation) => allocation.status === "running"
    );

    // requestId로 request 찾기
    const requestMap = new Map<string, ResourceRequest>();
    requests.forEach((request) => {
      requestMap.set(request.id, request);
    });

    // 조직별로 CPU 코어 수 집계
    const orgUsageMap = new Map<string, number>();

    runningAllocations.forEach((allocation) => {
      const request = requestMap.get(allocation.requestId);
      if (request && request.organisation) {
        const org = request.organisation;
        const current = orgUsageMap.get(org) || 0;
        // CPU 코어 수를 사용량으로 계산 (실제로는 시간을 곱해야 하지만, 간단하게 코어 수로 표시)
        orgUsageMap.set(org, current + allocation.cpuCores);
      }
    });

    // Map을 배열로 변환
    const orgUsageArray = Array.from(orgUsageMap.entries()).map(([name, cpuCores]) => ({
      name,
      cpuCores,
    }));

    // 사용량이 없으면 빈 배열 반환
    if (orgUsageArray.length === 0) {
      return [];
    }

    // 총 CPU 코어 수 계산
    const totalCpuCores = orgUsageArray.reduce((sum, org) => sum + org.cpuCores, 0);

    // 비율 계산 및 정렬 (내림차순)
    const result = orgUsageArray
      .map((org) => ({
        name: org.name,
        share: Math.round((org.cpuCores / totalCpuCores) * 100),
        // 간단하게 CPU 코어 수를 core-hr로 표시 (실제로는 실행 시간을 곱해야 함)
        hours: org.cpuCores * 24, // 예시: 하루 기준
      }))
      .sort((a, b) => b.share - a.share);

    // 비율이 100%가 되도록 조정 (반올림 오차 보정)
    const totalShare = result.reduce((sum, org) => sum + org.share, 0);
    if (totalShare !== 100 && result.length > 0) {
      const diff = 100 - totalShare;
      result[0].share += diff;
    }

    return result;
  } catch (error) {
    console.error("조직별 사용량 계산 중 오류:", error);
    // 오류 발생 시 빈 배열 반환
    return [];
  }
}

// 정책 준수 데이터
export const policyCompliance: PolicyCompliance[] = [
  {
    title: "접근 제어",
    description: "MFA 미등록 계정 2건 → 메일 발송 완료",
  },
  {
    title: "데이터 보관 정책",
    description: "14건 만료 예정 → 자동 아카이브 준비",
  },
  {
    title: "정책 위반",
    description: "이번 달 0건 (전달 3건 대비 개선)",
  },
];

// 최적화 추천 데이터
export const optimizationTips: OptimizationTip[] = [
  { text: "GPU 풀에 야간 자동 스케일 전략 적용 시 효율 +6%" },
  { text: "스토리지 tier-2 데이터 18TB 아카이빙 권장" },
  { text: "큐 정책에서 산업 협력 프로젝트 가중치 +0.3 필요" },
];

// 주간 사용량 트렌드 정보
export const weeklyTrendNotes = [
  "새벽 02~05시 GPU 사용률 92% → 야간 큐 재배치 필요",
  "산업 협력 프로젝트 CPU 사용량 주간 평균 +7% 증가",
  "네임스페이스 자동 스케일 이벤트 18건, 실패 0건",
];

// 시간대별 트렌드 데이터 (24시간, 시간당 데이터)
export const hourlyTrendData: HourlyTrendData[] = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  // GPU 사용률: 새벽 2-5시에 높고, 주간에 낮고, 저녁에 다시 증가
  gpuUsage: Math.round(
    40 +
      (hour >= 2 && hour <= 5 ? 45 + Math.sin((hour - 2) * Math.PI / 4) * 10 : 0) +
      (hour >= 14 && hour <= 18 ? 20 + Math.sin((hour - 14) * Math.PI / 4) * 15 : 0) +
      Math.sin((hour / 24) * Math.PI * 2) * 10
  ),
  // CPU 사용률: 주간에 높고 심야에 낮음
  cpuUsage: Math.round(
    50 +
      (hour >= 9 && hour <= 17 ? 25 : 0) +
      Math.sin((hour / 24) * Math.PI * 2) * 15 -
      (hour >= 0 && hour <= 6 ? 20 : 0)
  ),
}));

// 월간 리포트 아카이브 데이터
export const monthlyReports: MonthlyReport[] = [
  { month: "2025-02", title: "2025년 2월 월간 리포트" },
  { month: "2025-01", title: "2025년 1월 월간 리포트" },
  { month: "2024-12", title: "2024년 12월 월간 리포트" },
  { month: "2024-11", title: "2024년 11월 월간 리포트" },
];
