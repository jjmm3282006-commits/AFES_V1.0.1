import ExcelJS from 'exceljs';
import { store, BENCHMARK, THRESHOLD } from '../store';

export async function exportDeanReport(department: string, cycleId?: string): Promise<void> {
  const allCycles = store.getCycles();
  const activeCycle = store.getActiveCycle();
  const effectiveCycleId = cycleId || activeCycle?.id;
  const cycle = allCycles.find(c => c.id === effectiveCycleId);
  const faculty = store.getFacultyByDepartment(department);
  const deptMetrics = store.getDepartmentMetrics(department, effectiveCycleId);
  const criteria = store.getCriteria();
  const subQuestions = store.getSubQuestions();

  try {
    if (!cycle) {
      throw new Error('Evaluation cycle not found');
    }
    if (deptMetrics.totalSubmissions === 0) {
      throw new Error('No evaluation data available for this department and period');
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AFES';
    workbook.created = new Date();

    const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002366' } };
    const headerFont: Partial<ExcelJS.Font> = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
    const borderStyle: Partial<ExcelJS.Borders> = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    // Sheet 1: Department Overview
    const overviewSheet = workbook.addWorksheet('Department Overview');
    overviewSheet.columns = [{ width: 30 }, { width: 40 }];
    overviewSheet.getRow(1).values = ['AFES Department Report', ''];
    overviewSheet.getRow(1).font = { bold: true, size: 16, color: { argb: 'FF002366' } };
    overviewSheet.getRow(3).values = ['Department', department];
    overviewSheet.getRow(4).values = ['Evaluation Period', cycle?.displayName || 'N/A'];
    overviewSheet.getRow(5).values = ['Total Faculty', deptMetrics.totalFaculty];
    overviewSheet.getRow(6).values = ['Total Submissions', deptMetrics.totalSubmissions];
    overviewSheet.getRow(7).values = ['Department Average', `${deptMetrics.institutionAverage.toFixed(2)} / 5.00`];
    overviewSheet.getRow(8).values = ['Report Generated', new Date().toLocaleString()];
    [3, 4, 5, 6, 7, 8].forEach(r => { overviewSheet.getRow(r).eachCell(cell => { cell.border = borderStyle; }); });

    // Sheet 2: Faculty Summary
    const facultySheet = workbook.addWorksheet('Faculty Summary');
    facultySheet.columns = [
      { width: 30 },
      { width: 15 },
      { width: 15 },
      { width: 20 },
      { width: 20 }
    ];
    facultySheet.getRow(1).values = ['Faculty Name', 'Submissions', 'Average', 'Status', 'Acknowledgment'];
    facultySheet.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; cell.border = borderStyle; });

    faculty.forEach((f, i) => {
      const metrics = store.getFacultyMetrics(f.id, effectiveCycleId);
      const belowThreshold = metrics.totalSubmissions < THRESHOLD;
      const status = belowThreshold ? 'Insufficient Data' : metrics.overallAverage >= 4.5 ? 'Excellent' : metrics.overallAverage >= BENCHMARK ? 'Good' : 'Below Benchmark';
      const rowNum = i + 2;
      const row = facultySheet.getRow(rowNum);
      row.values = [
        f.name,
        metrics.totalSubmissions,
        belowThreshold ? 'N/A' : metrics.overallAverage.toFixed(2),
        status,
        f.acknowledgmentStatus.replace('_', ' ')
      ];
      row.eachCell(cell => { cell.border = borderStyle; });
      if (i % 2 === 0) row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F6F1' } }; });
    });

    // Sheet 3: Criteria Performance
    const criteriaSheet = workbook.addWorksheet('Criteria Performance');
    criteriaSheet.columns = [{ width: 30 }, { width: 15 }, { width: 20 }];
    criteriaSheet.getRow(1).values = ['Criterion', 'Department Average', 'Rating'];
    criteriaSheet.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; cell.border = borderStyle; });

    criteria.forEach((crit, i) => {
      const critAvg = deptMetrics.criteriaAverages[crit.id] || 0;
      const rating = critAvg >= 4.5 ? 'Excellent' : critAvg >= BENCHMARK ? 'Good' : critAvg >= 2 ? 'Needs Improvement' : 'Critical';
      const rowNum = i + 2;
      const row = criteriaSheet.getRow(rowNum);
      row.values = [crit.name, critAvg.toFixed(2), rating];
      row.eachCell(cell => { cell.border = borderStyle; });
      if (i % 2 === 0) row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F6F1' } }; });
    });

    // Sheet 4: Detailed Sub-Question Analysis
    const subQuestionSheet = workbook.addWorksheet('Sub-Question Analysis');
    subQuestionSheet.columns = [{ width: 50 }, { width: 15 }, { width: 15 }, { width: 20 }];
    subQuestionSheet.getRow(1).values = ['Criterion / Sub-Question', 'Type', 'Avg Score', 'Rating'];
    subQuestionSheet.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; cell.border = borderStyle; });

    let rowNum = 2;
    criteria.forEach(crit => {
      const critAvg = deptMetrics.criteriaAverages[crit.id] || 0;
      const rating = critAvg >= 4.5 ? 'Excellent' : critAvg >= BENCHMARK ? 'Good' : critAvg >= 2 ? 'Needs Improvement' : 'Critical';
      const r = subQuestionSheet.getRow(rowNum);
      r.values = [crit.name, 'CRITERION', critAvg.toFixed(2), rating];
      r.eachCell(cell => { cell.border = borderStyle; cell.font = { bold: true }; });
      r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5E6D3' } };
      rowNum++;

      const critSQs = subQuestions.filter(sq => sq.criterionId === crit.id);
      critSQs.forEach(sq => {
        const sqTotals: Record<string, { total: number; count: number }> = {};
        const evals = store.getEvaluationsForDepartment(department, effectiveCycleId);
        evals.forEach(ev => {
          Object.entries(ev.ratings).forEach(([sqId, rating]) => {
            if (!sqTotals[sqId]) sqTotals[sqId] = { total: 0, count: 0 };
            sqTotals[sqId].total += rating;
            sqTotals[sqId].count++;
          });
        });
        const sqAvg = sqTotals[sq.id] ? sqTotals[sq.id].total / sqTotals[sq.id].count : 0;
        const sqRating = sqAvg >= 4.5 ? 'Excellent' : sqAvg >= BENCHMARK ? 'Good' : sqAvg >= 2 ? 'Needs Improvement' : 'Critical';
        const sr = subQuestionSheet.getRow(rowNum);
        sr.values = [`  → ${sq.text}`, 'Sub-Question', sqAvg.toFixed(2), sqRating];
        sr.eachCell(cell => { cell.border = borderStyle; });
        rowNum++;
      });
    });

    // Sheet 5: Acknowledgment Compliance
    const complianceSheet = workbook.addWorksheet('Acknowledgment Compliance');
    complianceSheet.columns = [{ width: 30 }, { width: 15 }];
    complianceSheet.getRow(1).values = ['Status', 'Count'];
    complianceSheet.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; cell.border = borderStyle; });

    const acknowledged = faculty.filter(f => f.acknowledgmentStatus === 'acknowledged').length;
    const pendingAck = faculty.filter(f => f.acknowledgmentStatus === 'pending_acknowledgment').length;
    const pendingReview = faculty.filter(f => f.acknowledgmentStatus === 'pending_review').length;

    const complianceData = [
      ['Acknowledged', acknowledged],
      ['Pending Acknowledgment', pendingAck],
      ['Pending Review', pendingReview],
      ['Total Faculty', faculty.length],
      ['Compliance Rate', `${faculty.length > 0 ? Math.round((acknowledged / faculty.length) * 100) : 0}%`]
    ];

    complianceData.forEach((data, i) => {
      const rowNum = i + 2;
      const row = complianceSheet.getRow(rowNum);
      row.values = data;
      row.eachCell(cell => { cell.border = borderStyle; });
      if (i % 2 === 0) row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F6F1' } }; });
    });

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AFES_${department.replace(/\s+/g, '_')}_Department_Report_${cycle?.displayName.replace(/[^a-zA-Z0-9]/g, '_') || 'report'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 200);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Error generating Dean report:', error);
    alert(`Failed to generate department report: ${errorMessage}`);
  }
}
