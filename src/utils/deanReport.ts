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

    // Sheet 6: Course-Level Performance
    const courseSheet = workbook.addWorksheet('Course Performance');
    courseSheet.columns = [{ width: 20 }, { width: 15 }, { width: 15 }];
    courseSheet.getRow(1).values = ['Course', 'Submissions', 'Average'];
    courseSheet.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; cell.border = borderStyle; });

    const deptEvals = store.getEvaluationsForDepartment(department, effectiveCycleId);
    const courseMetrics: Record<string, { facultyId: string; submissions: number; totalScore: number }> = {};
    deptEvals.forEach(ev => {
      if (!courseMetrics[ev.courseId]) {
        courseMetrics[ev.courseId] = { facultyId: ev.facultyId, submissions: 0, totalScore: 0 };
      }
      courseMetrics[ev.courseId].submissions++;
      const ratings = Object.values(ev.ratings);
      courseMetrics[ev.courseId].totalScore += ratings.reduce((a, b) => a + b, 0) / ratings.length;
    });

    const courseData = Object.entries(courseMetrics).map(([courseId, data]) => ({
      courseId,
      submissions: data.submissions,
      average: data.submissions > 0 ? data.totalScore / data.submissions : 0,
    }));

    courseData.forEach((course, i) => {
      const rowNum = i + 2;
      const row = courseSheet.getRow(rowNum);
      row.values = [course.courseId, course.submissions, course.average.toFixed(2)];
      row.eachCell(cell => { cell.border = borderStyle; });
      if (i % 2 === 0) row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F6F1' } }; });
    });

    // Sheet 7: Department Strengths & Improvements
    const analysisSheet = workbook.addWorksheet('Strengths & Improvements');
    analysisSheet.columns = [{ width: 30 }, { width: 15 }, { width: 20 }];
    
    // Strengths section
    analysisSheet.getRow(1).values = ['DEPARTMENT STRENGTHS (≥4.0)', '', ''];
    analysisSheet.getRow(1).eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E8B57' } }; cell.font = { ...headerFont, color: { argb: 'FFFFFFFF' } }; cell.border = borderStyle; });
    
    const strengths = criteria.map(c => ({
      name: c.name,
      average: deptMetrics.criteriaAverages[c.id] || 0,
    })).filter(c => c.average >= 4.0).sort((a, b) => b.average - a.average);

    let analysisRowNum = 2;
    strengths.forEach((s, i) => {
      const row = analysisSheet.getRow(analysisRowNum);
      row.values = [s.name, s.average.toFixed(2), s.average >= 4.5 ? 'Excellent' : 'Very Good'];
      row.eachCell(cell => { cell.border = borderStyle; });
      if (i % 2 === 0) row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }; });
      analysisRowNum++;
    });

    // Improvements section
    analysisRowNum++;
    analysisSheet.getRow(analysisRowNum).values = ['AREAS FOR IMPROVEMENT (<3.0)', '', ''];
    analysisSheet.getRow(analysisRowNum).eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC41E3A' } }; cell.font = { ...headerFont, color: { argb: 'FFFFFFFF' } }; cell.border = borderStyle; });
    analysisRowNum++;

    const improvements = criteria.map(c => ({
      name: c.name,
      average: deptMetrics.criteriaAverages[c.id] || 0,
    })).filter(c => c.average < BENCHMARK && c.average > 0).sort((a, b) => a.average - b.average);

    improvements.forEach((imp, i) => {
      const row = analysisSheet.getRow(analysisRowNum);
      row.values = [imp.name, imp.average.toFixed(2), imp.average >= 2 ? 'Needs Improvement' : 'Critical'];
      row.eachCell(cell => { cell.border = borderStyle; });
      if (i % 2 === 0) row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; });
      analysisRowNum++;
    });

    // Sheet 8: Feedback Sentiment Analysis
    const sentimentSheet = workbook.addWorksheet('Feedback Sentiment');
    sentimentSheet.columns = [{ width: 30 }, { width: 15 }];
    sentimentSheet.getRow(1).values = ['Metric', 'Value'];
    sentimentSheet.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; cell.border = borderStyle; });

    const allFeedback = deptEvals.map(e => e.feedback).filter(f => f && f.trim().length > 0);
    const positiveKeywords = ['excellent', 'great', 'good', 'clear', 'engaging', 'helpful', 'organized', 'fair'];
    const negativeKeywords = ['confusing', 'difficult', 'unclear', 'slow', 'fast', 'hard', 'unfair', 'disorganized'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    allFeedback.forEach(feedback => {
      const lower = feedback.toLowerCase();
      if (positiveKeywords.some(kw => lower.includes(kw))) positiveCount++;
      if (negativeKeywords.some(kw => lower.includes(kw))) negativeCount++;
    });

    const sentimentData = [
      ['Total Feedback Entries', allFeedback.length],
      ['Positive Feedback', positiveCount],
      ['Needs Attention', negativeCount],
      ['Sentiment Ratio', `${allFeedback.length > 0 ? ((positiveCount / allFeedback.length) * 100).toFixed(1) : 0}%`],
    ];

    sentimentData.forEach((data, i) => {
      const rowNum = i + 2;
      const row = sentimentSheet.getRow(rowNum);
      row.values = data;
      row.eachCell(cell => { cell.border = borderStyle; });
      if (i % 2 === 0) row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F6F1' } }; });
    });

    // Sheet 9: Compliance Tracking Log
    const complianceLogSheet = workbook.addWorksheet('Compliance Log');
    complianceLogSheet.columns = [
      { width: 30 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 30 }
    ];
    complianceLogSheet.getRow(1).values = ['Faculty Name', 'Status', 'Acknowledged Date', 'Last Reminder', 'Notes'];
    complianceLogSheet.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; cell.border = borderStyle; });

    faculty.forEach((f, i) => {
      const rowNum = i + 2;
      const row = complianceLogSheet.getRow(rowNum);
      const statusText = f.acknowledgmentStatus === 'acknowledged' ? '🟢 Acknowledged' : 
                         f.acknowledgmentStatus === 'disputed' ? '🔴 Disputed' : 
                         f.acknowledgmentStatus === 'pending_acknowledgment' ? '🟡 Pending Ack.' : '⚫ Pending Review';
      row.values = [
        f.name,
        statusText,
        f.acknowledgedAt ? new Date(f.acknowledgedAt).toLocaleDateString() : '—',
        f.lastReminderSent ? new Date(f.lastReminderSent).toLocaleDateString() : '—',
        f.acknowledgmentStatus === 'disputed' ? 'Dispute in progress' : ''
      ];
      row.eachCell(cell => { cell.border = borderStyle; });
      if (i % 2 === 0) row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F6F1' } }; });
      
      // Color code status
      const statusCell = row.getCell(2);
      if (f.acknowledgmentStatus === 'acknowledged') {
        statusCell.font = { color: { argb: 'FF2E8B57' }, bold: true };
      } else if (f.acknowledgmentStatus === 'disputed') {
        statusCell.font = { color: { argb: 'FFC41E3A' }, bold: true };
      }
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
