// 시간대별 트렌드 차트 컴포넌트

import type { HourlyTrendData } from "@/lib/report-data";

interface HourlyTrendChartProps {
  data: HourlyTrendData[];
  className?: string;
}

export function HourlyTrendChart({ data, className = "" }: HourlyTrendChartProps) {
  const chartHeight = 120;
  const chartWidth = 600;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const maxValue = 100;
  const minValue = 0;

  const getX = (index: number) => padding.left + (index / (data.length - 1)) * innerWidth;
  const getY = (value: number) => padding.top + innerHeight - ((value - minValue) / (maxValue - minValue)) * innerHeight;

  // GPU 사용률 선 경로 생성
  const gpuPath = data
    .map((point, index) => {
      const x = getX(index);
      const y = getY(point.gpuUsage);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(" ");

  // GPU 사용률 영역 경로 생성 (그래프 아래 영역)
  const gpuAreaPath = `${gpuPath} L ${getX(data.length - 1)} ${getY(0)} L ${getX(0)} ${getY(0)} Z`;

  // CPU 사용률 선 경로 생성
  const cpuPath = data
    .map((point, index) => {
      const x = getX(index);
      const y = getY(point.cpuUsage);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(" ");

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        {/* 그리드 라인 */}
        {[0, 25, 50, 75, 100].map((value) => {
          const y = getY(value);
          return (
            <g key={value}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + innerWidth}
                y2={y}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                fill="rgba(255, 255, 255, 0.5)"
                fontSize="10"
                textAnchor="end"
              >
                {value}%
              </text>
            </g>
          );
        })}

        {/* 시간 축 레이블 (6시간 간격) */}
        {[0, 6, 12, 18, 23].map((hour) => {
          const x = getX(hour);
          return (
            <text
              key={hour}
              x={x}
              y={chartHeight - 10}
              fill="rgba(255, 255, 255, 0.5)"
              fontSize="10"
              textAnchor="middle"
            >
              {hour}시
            </text>
          );
        })}

        {/* GPU 사용률 영역 (그래프 아래) */}
        <path
          d={gpuAreaPath}
          fill="url(#gpuGradient)"
          opacity="0.3"
        />

        {/* GPU 사용률 선 */}
        <path
          d={gpuPath}
          fill="none"
          stroke="url(#gpuLineGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* CPU 사용률 선 */}
        <path
          d={cpuPath}
          fill="none"
          stroke="url(#cpuLineGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="4 4"
        />

        {/* GPU 점 */}
        {data.map((point, index) => {
          if (index % 3 !== 0) return null; // 3시간 간격으로 점 표시
          const x = getX(index);
          const y = getY(point.gpuUsage);
          return (
            <circle
              key={`gpu-${index}`}
              cx={x}
              cy={y}
              r="3"
              fill="#38bdf8"
            />
          );
        })}

        {/* CPU 점 */}
        {data.map((point, index) => {
          if (index % 4 !== 0) return null; // 4시간 간격으로 점 표시
          const x = getX(index);
          const y = getY(point.cpuUsage);
          return (
            <circle
              key={`cpu-${index}`}
              cx={x}
              cy={y}
              r="3"
              fill="#06b6d4"
            />
          );
        })}

        {/* 그라디언트 정의 */}
        <defs>
          <linearGradient id="gpuGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="gpuLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          <linearGradient id="cpuLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
        </defs>
      </svg>

      {/* 범례 */}
      <div className="mt-4 flex items-center gap-4 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-6 bg-sky-400" />
          <span>GPU 사용률</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-6 border-t border-dashed border-cyan-500" />
          <span>CPU 사용률</span>
        </div>
      </div>
    </div>
  );
}

