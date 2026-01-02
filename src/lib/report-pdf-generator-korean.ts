// 월간 리포트 PDF 생성 유틸리티 (한글 지원 버전)
// html2canvas를 사용하여 HTML을 이미지로 변환한 후 PDF에 추가

import type {
  EfficiencyMetric,
  OrganizationUsage,
  PolicyCompliance,
  OptimizationTip,
} from "./report-data";

export interface MonthlyReportData {
  month: string;
  efficiencyMetrics: EfficiencyMetric[];
  organizationBreakdown: OrganizationUsage[];
  policyCompliance: PolicyCompliance[];
  optimizationTips: OptimizationTip[];
  weeklyTrendNotes: string[];
}

/**
 * 월간 리포트 PDF를 생성합니다 (한글 지원).
 * html2canvas를 사용하여 HTML 컨텐츠를 이미지로 변환한 후 jspdf로 PDF를 생성합니다.
 */
export async function generateMonthlyReportPDFKorean(data: MonthlyReportData): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const html2canvas = (await import("html2canvas")).default;

  // 리포트 컨텐츠를 담을 HTML 엘리먼트 생성
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.width = "210mm"; // A4 width
  container.style.padding = "20mm";
  container.style.backgroundColor = "#ffffff";
  container.style.color = "#000000";
  container.style.fontFamily = "system-ui, -apple-system, sans-serif";
  document.body.appendChild(container);

  try {
    // 리포트 HTML 생성
    container.innerHTML = `
      <div style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">
        월간 리포트 - ${data.month}
      </div>
      <div style="font-size: 12px; color: #666; margin-bottom: 30px;">
        생성 일시: ${new Date().toLocaleString("ko-KR")}
      </div>
      
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">효율성 지표</h2>
        ${data.efficiencyMetrics.map(metric => `
          <div style="margin-bottom: 12px;">
            <strong>${metric.label}:</strong> ${metric.value} (${metric.change})<br/>
            <span style="font-size: 11px; color: #666;">${metric.detail}</span>
          </div>
        `).join("")}
      </div>
      
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">조직별 사용량 분포</h2>
        ${data.organizationBreakdown.map(org => `
          <div style="margin-bottom: 12px;">
            <strong>${org.name}:</strong> ${org.share}%<br/>
            <span style="font-size: 11px; color: #666;">누적 사용: ${org.hours.toLocaleString()} core-hr</span>
          </div>
        `).join("")}
      </div>
      
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">정책 준수 현황</h2>
        ${data.policyCompliance.map(policy => `
          <div style="margin-bottom: 12px;">
            <strong>${policy.title}:</strong><br/>
            <span style="font-size: 11px; color: #666;">${policy.description}</span>
          </div>
        `).join("")}
      </div>
      
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">최적화 추천</h2>
        ${data.optimizationTips.map(tip => `
          <div style="margin-bottom: 8px;">• ${tip.text}</div>
        `).join("")}
      </div>
      
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">주간 사용량 트렌드</h2>
        ${data.weeklyTrendNotes.map(note => `
          <div style="margin-bottom: 8px;">• ${note}</div>
        `).join("")}
      </div>
    `;

    // HTML을 canvas로 변환
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    // PDF 생성
    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    const doc = new jsPDF("p", "mm", "a4");
    let position = 0;

    // 첫 페이지 추가
    doc.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // 추가 페이지가 필요한 경우
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // PDF 저장
    const fileName = `월간리포트_${data.month}.pdf`;
    doc.save(fileName);
  } finally {
    // 임시 엘리먼트 제거
    document.body.removeChild(container);
  }
}

