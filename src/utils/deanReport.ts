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
    if (!cycle) throw new Error('Evaluation cycle not found');
    if (deptMetrics.totalSubmissions === 0) throw new Error('No evaluation data available');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AFES';
    workbook.created = new Date();

    const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002366' } };
    const headerFont: Partial<ExcelJS.Font> = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
    const borderStyle: Partial<ExcelJS.Borders> = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

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
    [3, 4, 5, 6, 7, 8].forEach(r => { overviewSheet.getRow(r).eachCell((cell: any) => { cell.border = borderStyle; }); });

    const facultySheet = workbook.addWorksheet('Faculty Summary');
    facultySheet.columns = [{ width: 30 }, { width: 15 }, { width: 15 }, { width: 20 }, { width: 20 }];
    facultySheet.getRow(1).values = ['Faculty Name', 'Submissions', 'Average', 'Status', 'Acknowledgment'];
    facultySheet.getRow(1).eachCell((cell: any) => { cell.fill = headerFill; cell.font = headerFont; cell.border = borderStyle; });

    faculty.forEach((f, i) => {
      const metrics = store.getFacultyMetrics(f.id, effectiveCycleId);
      const belowThreshold = metrics.totalSubmissions < THRESHOLD;
      const status = belowThreshold ? 'Insufficient Data' : metrics.overallAverage >= 4.5 ? 'Excellent' : metrics.overallAverage >= BENCHMARK ? 'Good' : 'Below Benchmark';
      const rowNum = i + 2;
      const row = facultySheet.getRow(rowNum);
      row.values = [f.name, metrics.totalSubmissions, belowThreshold ? 'N/A' : metrics.overallAverage.toFixed(2), status, f.acknowledgmentStatus.replace('_', ' ')];
      row.eachCell((cell: any) => { cell.border = borderStyle; });
      if (i % 2 === 0) row.eachCell((cell: any) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F6F1' } }; });
    });

    const criteriaSheet = workbook.addWorksheet('Criteria Performance');
    criteriaSheet.columns = [{ width: 30 }, { width: 15 }, { width: 20 }];
    criteriaSheet.getRow(1).values = ['Criterion', 'Department Average', 'Rating'];
    criteriaSheet.getRow(1).eachCell((cell: any) => { cell.fill = headerFill; cell.font = headerFont; cell.border = borderStyle; });

    criteria.forEach((crit, i) => {
      const critAvg = deptMetrics.criteriaAverages[crit.id] || 0;
      const rating = critAvg >= 4.5 ? 'Excellent' : critAvg >= BENCHMARK ? 'Good' : critAvg >= 2 ? 'Needs Improvement' : 'Critical';
      const rowNum = i + 2;
      const row = criteriaSheet.getRow(rowNum);
      row.values = [crit.name, critAvg.toFixed(2), rating];
      row.eachCell((cell: any) => { cell.border = borderStyle; });
      if (i % 2 === 0) row.eachCell((cell: any) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F6F1' } }; });
    });

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
