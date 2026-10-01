import ExcelJS from 'exceljs';
import { store, BENCHMARK } from '../store';

export async function exportFacultyReport(facultyId: string, cycleId?: string): Promise<void> {
  const faculty = store.getFacultyById(facultyId);
  if (!faculty) return;

  const allCycles = store.getCycles();
  const activeCycle = store.getActiveCycle();
  const effectiveCycleId = cycleId || activeCycle?.id;
  const cycle = allCycles.find(c => c.id === effectiveCycleId);
  const metrics = store.getFacultyMetrics(facultyId, effectiveCycleId);
  const criteria = store.getCriteria();
  const subQuestions = store.getSubQuestions();

  try {
    if (!faculty) throw new Error('Faculty not found');
    if (!metrics || metrics.totalSubmissions === 0) throw new Error('No evaluation data available');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AFES';
    workbook.created = new Date();

    const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002366' } };
    const headerFont: Partial<ExcelJS.Font> = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
    const borderStyle: Partial<ExcelJS.Borders> = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    const coverSheet = workbook.addWorksheet('Cover');
    coverSheet.columns = [{ width: 30 }, { width: 40 }];
    coverSheet.getRow(1).values = ['AFES Faculty Evaluation Report', ''];
    coverSheet.getRow(1).font = { bold: true, size: 16, color: { argb: 'FF002366' } };
    coverSheet.getRow(2).values = ['Professional Development Portfolio', ''];
    coverSheet.getRow(2).font = { bold: true, size: 12, color: { argb: 'FFB87333' } };
    
    // Generate tracking ID and timestamp
    const trackingId = `AFES-${Date.now()}-${facultyId}`;
    const generationTimestamp = new Date().toLocaleString();
    
    // Metadata Section
    coverSheet.getRow(4).values = ['Report Metadata', ''];
    coverSheet.getRow(4).font = { bold: true, size: 11, color: { argb: 'FF002366' } };
    coverSheet.getRow(5).values = ['Tracking ID', trackingId];
    coverSheet.getRow(6).values = ['Generated', generationTimestamp];
    coverSheet.getRow(7).values = ['Status', faculty.acknowledgmentStatus === 'acknowledged' ? '✓ Faculty Signed & Acknowledged' : '○ Pending Acknowledgment'];
    [5, 6, 7].forEach(r => { coverSheet.getRow(r).eachCell(cell => { cell.border = borderStyle; }); });
    
    coverSheet.getRow(9).values = ['Faculty Information', ''];
    coverSheet.getRow(4).font = { bold: true, size: 11, color: { argb: 'FF002366' } };
    coverSheet.getRow(5).values = ['Faculty Name', faculty.name];
    coverSheet.getRow(6).values = ['Department', faculty.department];
    coverSheet.getRow(7).values = ['Title', faculty.title];
    coverSheet.getRow(8).values = ['Evaluation Period', cycle?.displayName || 'N/A'];
    [5, 6, 7, 8].forEach(r => { coverSheet.getRow(r).eachCell(cell => { cell.border = borderStyle; }); });
    coverSheet.getRow(10).values = ['Performance Summary', ''];
    coverSheet.getRow(10).font = { bold: true, size: 11, color: { argb: 'FF002366' } };
    coverSheet.getRow(11).values = ['Total Submissions', metrics.totalSubmissions];
    coverSheet.getRow(12).values = ['Overall Average', `${metrics.overallAverage.toFixed(2)} / 5.00`];
    coverSheet.getRow(13).values = ['Acknowledgment Status', faculty.acknowledgmentStatus.replace('_', ' ').toUpperCase()];
    coverSheet.getRow(14).values = ['Report Generated', new Date().toLocaleString()];
    [11, 12, 13, 14].forEach(r => { coverSheet.getRow(r).eachCell(cell => { cell.border = borderStyle; }); });

    const deptMetrics = store.getDepartmentMetrics(faculty.department, effectiveCycleId);
    coverSheet.getRow(16).values = ['Benchmark Comparison', ''];
    coverSheet.getRow(16).font = { bold: true, size: 11, color: { argb: 'FF002366' } };
    coverSheet.getRow(17).values = ['Your Average', metrics.overallAverage.toFixed(2)];
    coverSheet.getRow(18).values = ['Department Average', deptMetrics.institutionAverage.toFixed(2)];
    coverSheet.getRow(19).values = ['Difference', (metrics.overallAverage - deptMetrics.institutionAverage).toFixed(2)];
    [17, 18, 19].forEach(r => { coverSheet.getRow(r).eachCell(cell => { cell.border = borderStyle; }); });

    const criteriaSheet = workbook.addWorksheet('Criteria Analysis');
    criteriaSheet.columns = [{ width: 50 }, { width: 15 }, { width: 15 }, { width: 20 }];
    criteriaSheet.getRow(1).values = ['Criterion / Sub-Question', 'Type', 'Avg Score', 'Rating'];
    criteriaSheet.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; cell.border = borderStyle; });

    let rowNum = 2;
    criteria.forEach(crit => {
      const critAvg = metrics.criteriaAverages[crit.id] || 0;
      const rating = critAvg >= 4.5 ? 'Excellent' : critAvg >= BENCHMARK ? 'Good' : critAvg >= 2 ? 'Needs Improvement' : 'Critical';
      const r = criteriaSheet.getRow(rowNum);
      r.values = [crit.name, 'CRITERION', critAvg.toFixed(2), rating];
      r.eachCell(cell => { cell.border = borderStyle; cell.font = { bold: true }; });
      rowNum++;
      const critSQs = subQuestions.filter(sq => sq.criterionId === crit.id);
      critSQs.forEach(sq => {
        const sqAvg = metrics.subQuestionAverages[sq.id] || 0;
        const sqRating = sqAvg >= 4.5 ? 'Excellent' : sqAvg >= BENCHMARK ? 'Good' : sqAvg >= 2 ? 'Needs Improvement' : 'Critical';
        const sr = criteriaSheet.getRow(rowNum);
        sr.values = [`  → ${sq.text}`, 'Sub-Question', sqAvg.toFixed(2), sqRating];
        sr.eachCell(cell => { cell.border = borderStyle; });
        rowNum++;
      });
    });

    const courseSheet = workbook.addWorksheet('Course Performance');
    courseSheet.columns = [{ width: 20 }, { width: 15 }, { width: 15 }];
    courseSheet.getRow(1).values = ['Course', 'Submissions', 'Average Score'];
    courseSheet.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; cell.border = borderStyle; });
    Object.entries(metrics.courseBreakdown).forEach(([course, data], i) => {
      const r = courseSheet.getRow(i + 2);
      r.values = [course, data.count, data.average.toFixed(2)];
      r.eachCell(cell => { cell.border = borderStyle; });
    });

    const feedbackSheet = workbook.addWorksheet('Student Feedback');
    feedbackSheet.columns = [{ width: 15 }, { width: 60 }, { width: 20 }];
    feedbackSheet.getRow(1).values = ['Course', 'Feedback (PII-Redacted)', 'Date'];
    feedbackSheet.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; cell.border = borderStyle; });
    metrics.feedback.forEach((fb, i) => {
      const r = feedbackSheet.getRow(i + 2);
      r.values = [fb.courseId, fb.feedback, new Date(fb.submittedAt).toLocaleDateString()];
      r.eachCell(cell => { cell.border = borderStyle; });
    });

    const summarySheet = workbook.addWorksheet('Feedback Summary');
    summarySheet.columns = [{ width: 30 }, { width: 40 }];
    summarySheet.getRow(1).values = ['Metric', 'Value'];
    summarySheet.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; cell.border = borderStyle; });
    const totalRatings = metrics.scoreDistribution.reduce((a, b) => a + b, 0);
    const summaryData = [
      ['Total Feedback Entries', metrics.feedback.length],
      ['Score Distribution - 5★ (Excellent)', `${metrics.scoreDistribution[4]} (${totalRatings > 0 ? ((metrics.scoreDistribution[4] / totalRatings) * 100).toFixed(1) : 0}%)`],
      ['Score Distribution - 4★ (Very Good)', `${metrics.scoreDistribution[3]} (${totalRatings > 0 ? ((metrics.scoreDistribution[3] / totalRatings) * 100).toFixed(1) : 0}%)`],
      ['Score Distribution - 3★ (Good)', `${metrics.scoreDistribution[2]} (${totalRatings > 0 ? ((metrics.scoreDistribution[2] / totalRatings) * 100).toFixed(1) : 0}%)`],
      ['Score Distribution - 2★ (Needs Improvement)', `${metrics.scoreDistribution[1]} (${totalRatings > 0 ? ((metrics.scoreDistribution[1] / totalRatings) * 100).toFixed(1) : 0}%)`],
      ['Score Distribution - 1★ (Critical)', `${metrics.scoreDistribution[0]} (${totalRatings > 0 ? ((metrics.scoreDistribution[0] / totalRatings) * 100).toFixed(1) : 0}%)`],
    ];
    summaryData.forEach((row, i) => {
      const r = summarySheet.getRow(i + 2);
      r.values = row;
      r.eachCell(cell => { cell.border = borderStyle; });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AFES_${faculty.name.replace(/[^a-zA-Z0-9]/g, '_')}_${cycle?.displayName.replace(/[^a-zA-Z0-9]/g, '_') || 'report'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 200);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Error generating Excel report:', error);
    alert(`Failed to generate Excel report: ${errorMessage}`);
  }
}
