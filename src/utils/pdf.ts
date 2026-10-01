import { jsPDF } from 'jspdf';
import { store, BENCHMARK, THRESHOLD } from '../store';

export async function exportFacultyPDF(facultyId: string, cycleId?: string): Promise<void> {
  const faculty = store.getFacultyById(facultyId);
  if (!faculty) {
    alert('Faculty not found');
    return;
  }

  const allCycles = store.getCycles();
  const activeCycle = store.getActiveCycle();
  const effectiveCycleId = cycleId || activeCycle?.id;
  const cycle = allCycles.find(c => c.id === effectiveCycleId);
  const metrics = store.getFacultyMetrics(facultyId, effectiveCycleId);
  const criteria = store.getCriteria();
  const subQuestions = store.getSubQuestions();

  if (!metrics || metrics.totalSubmissions === 0) {
    alert('No evaluation data available for this period');
    return;
  }

  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = margin;

    // Generate tracking ID
    const trackingId = `AFES-${Date.now()}-${facultyId}`;
    const generationTimestamp = new Date().toLocaleString();

    // Header
    doc.setFillColor(0, 35, 102); // Royal Blue
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('FACULTY EVALUATION REPORT', margin, 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Anonymous Faculty Evaluation System', margin, 30);

    yPos = 50;
    doc.setTextColor(0, 0, 0);

    // Metadata Section
    doc.setFillColor(248, 246, 241); // Soft Cream
    doc.rect(margin, yPos, pageWidth - 2 * margin, 35, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Metadata', margin + 5, yPos + 8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tracking ID: ${trackingId}`, margin + 5, yPos + 16);
    doc.text(`Generated: ${generationTimestamp}`, margin + 5, yPos + 22);
    doc.text(`Status: ${faculty.acknowledgmentStatus === 'acknowledged' ? '✓ Faculty Signed & Acknowledged' : '○ Pending Acknowledgment'}`, margin + 5, yPos + 28);

    yPos += 45;

    // Faculty Information
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 35, 102);
    doc.text('Faculty Information', margin, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const facultyInfo = [
      ['Name:', faculty.name],
      ['Department:', faculty.department],
      ['Title:', faculty.title],
      ['Evaluation Period:', cycle?.displayName || 'N/A'],
      ['Total Submissions:', metrics.totalSubmissions.toString()],
      ['Overall Average:', `${metrics.overallAverage.toFixed(2)} / 5.0`],
    ];

    facultyInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 50, yPos);
      yPos += 7;
    });

    yPos += 10;

    // Signature Section (if acknowledged)
    if (faculty.acknowledgmentStatus === 'acknowledged' && faculty.signature) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 35, 102);
      doc.text('Faculty Signature', margin, yPos);
      yPos += 10;

      // Add signature image
      try {
        const imgData = faculty.signature;
        doc.addImage(imgData, 'PNG', margin, yPos, 80, 30);
        yPos += 35;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Signed: ${new Date(faculty.acknowledgedAt || '').toLocaleString()}`, margin, yPos);
        doc.text(`Verified by: ${faculty.acknowledgedBy || 'Self'}`, margin, yPos + 5);
        yPos += 15;
      } catch (error) {
        console.error('Error adding signature image:', error);
        yPos += 5;
      }
    }

    // Criteria Performance
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 35, 102);
    doc.text('Criteria Performance Breakdown', margin, yPos);
    yPos += 10;

    // Table header
    doc.setFillColor(0, 35, 102);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Criterion', margin + 5, yPos + 5);
    doc.text('Average', margin + 100, yPos + 5);
    doc.text('Rating', margin + 130, yPos + 5);
    yPos += 8;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    criteria.forEach((crit, i) => {
      const critAvg = metrics.criteriaAverages[crit.id] || 0;
      const rating = critAvg >= 4.5 ? 'Excellent' : critAvg >= BENCHMARK ? 'Good' : critAvg >= 2 ? 'Needs Improvement' : 'Critical';
      
      // Alternate row colors
      if (i % 2 === 0) {
        doc.setFillColor(248, 246, 241);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');
      }

      doc.text(crit.name, margin + 5, yPos + 5);
      doc.text(critAvg.toFixed(2), margin + 100, yPos + 5);
      
      // Color code rating
      if (critAvg >= BENCHMARK) {
        doc.setTextColor(46, 139, 87); // Emerald
      } else {
        doc.setTextColor(196, 30, 58); // Crimson
      }
      doc.text(rating, margin + 130, yPos + 5);
      doc.setTextColor(0, 0, 0);
      
      yPos += 7;

      // Sub-questions
      const critSQs = subQuestions.filter(sq => sq.criterionId === crit.id);
      critSQs.forEach(sq => {
        const sqAvg = metrics.subQuestionAverages[sq.id] || 0;
        const sqRating = sqAvg >= 4.5 ? 'Excellent' : sqAvg >= BENCHMARK ? 'Good' : sqAvg >= 2 ? 'Needs Improvement' : 'Critical';
        
        doc.setFontSize(9);
        doc.text(`  → ${sq.text}`, margin + 10, yPos + 4, { maxWidth: 90 });
        doc.text(sqAvg.toFixed(2), margin + 100, yPos + 4);
        
        if (sqAvg >= BENCHMARK) {
          doc.setTextColor(46, 139, 87);
        } else {
          doc.setTextColor(196, 30, 58);
        }
        doc.text(sqRating, margin + 130, yPos + 4);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        
        yPos += 6;
      });
    });

    yPos += 10;

    // Course Performance
    if (yPos > 240) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 35, 102);
    doc.text('Course Performance', margin, yPos);
    yPos += 10;

    // Table header
    doc.setFillColor(0, 35, 102);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Course', margin + 5, yPos + 5);
    doc.text('Submissions', margin + 80, yPos + 5);
    doc.text('Average', margin + 120, yPos + 5);
    yPos += 8;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    Object.entries(metrics.courseBreakdown).forEach(([course, data], i) => {
      if (i % 2 === 0) {
        doc.setFillColor(248, 246, 241);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');
      }

      doc.text(course, margin + 5, yPos + 5);
      doc.text(data.count.toString(), margin + 80, yPos + 5);
      
      if (data.average >= BENCHMARK) {
        doc.setTextColor(46, 139, 87);
      } else {
        doc.setTextColor(196, 30, 58);
      }
      doc.text(data.average.toFixed(2), margin + 120, yPos + 5);
      doc.setTextColor(0, 0, 0);
      
      yPos += 7;
    });

    yPos += 10;

    // Score Distribution
    if (yPos > 240) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 35, 102);
    doc.text('Score Distribution', margin, yPos);
    yPos += 10;

    // Table header
    doc.setFillColor(0, 35, 102);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Rating', margin + 5, yPos + 5);
    doc.text('Count', margin + 80, yPos + 5);
    doc.text('Percentage', margin + 120, yPos + 5);
    yPos += 8;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    const totalRatings = metrics.scoreDistribution.reduce((a, b) => a + b, 0);
    [5, 4, 3, 2, 1].forEach((star, i) => {
      const count = metrics.scoreDistribution[star - 1];
      const pct = totalRatings > 0 ? ((count / totalRatings) * 100).toFixed(1) : '0.0';

      if (i % 2 === 0) {
        doc.setFillColor(248, 246, 241);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');
      }

      doc.text(`${star} Star${star > 1 ? 's' : ''}`, margin + 5, yPos + 5);
      doc.text(count.toString(), margin + 80, yPos + 5);
      doc.text(`${pct}%`, margin + 120, yPos + 5);
      
      yPos += 7;
    });

    yPos += 10;

    // Student Feedback
    if (yPos > 200) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 35, 102);
    doc.text('Student Feedback (PII-Redacted)', margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('All personally identifiable information has been automatically redacted to protect student anonymity.', margin, yPos);
    yPos += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    metrics.feedback.slice(0, 10).forEach((fb, i) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFillColor(248, 246, 241);
      doc.setDrawColor(184, 115, 51);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, margin, yPos + 15);
      doc.rect(margin + 2, yPos, pageWidth - 2 * margin - 4, 15, 'F');
      
      doc.setFontSize(9);
      doc.text(`"${fb.feedback}"`, margin + 5, yPos + 5, { maxWidth: pageWidth - 2 * margin - 10 });
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Course: ${fb.courseId} • ${new Date(fb.submittedAt).toLocaleDateString()}`, margin + 5, yPos + 12);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      
      yPos += 18;
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      doc.setDrawColor(0, 35, 102);
      doc.setLineWidth(0.5);
      doc.line(margin, doc.internal.pageSize.getHeight() - 20, pageWidth - margin, doc.internal.pageSize.getHeight() - 20);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Anonymous Faculty Evaluation System (AFES)', margin, doc.internal.pageSize.getHeight() - 15);
      doc.text('This report contains confidential evaluation data. Handle with appropriate care.', margin, doc.internal.pageSize.getHeight() - 10);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, doc.internal.pageSize.getHeight() - 15);
      doc.text(`Generated: ${generationTimestamp}`, pageWidth - margin - 40, doc.internal.pageSize.getHeight() - 10);
    }

    // Save PDF
    const fileName = `AFES_${faculty.name.replace(/[^a-zA-Z0-9]/g, '_')}_${cycle?.displayName.replace(/[^a-zA-Z0-9]/g, '_') || 'report'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    // Log to audit (will be handled by the calling component)

  } catch (error) {
    console.error('Error generating PDF report:', error);
    alert('Failed to generate PDF report. Please try again.');
  }
}
