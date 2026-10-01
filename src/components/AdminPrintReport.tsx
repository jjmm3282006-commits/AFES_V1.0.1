import React from 'react';
import { store, BENCHMARK, THRESHOLD } from '../store';
import type { Criterion } from '../types';

interface AdminPrintReportProps {
  cycleName: string;
  criteria: Criterion[];
}

export default function AdminPrintReport({ cycleName, criteria }: AdminPrintReportProps) {
  const faculty = store.getFaculty();
  const cycles = store.getCycles();
  const activeCycle = store.getActiveCycle();
  const cycleId = activeCycle?.id;
  
  const totalEvaluations = store.getEvaluations().filter(e => e.cycleId === cycleId).length;
  const acknowledged = faculty.filter(f => f.acknowledgmentStatus === 'acknowledged').length;
  const pendingAck = faculty.filter(f => f.acknowledgmentStatus === 'pending_acknowledgment').length;
  const disputed = faculty.filter(f => f.acknowledgmentStatus === 'disputed').length;
  const pendingReview = faculty.filter(f => f.acknowledgmentStatus === 'pending_review').length;

  const departments = ['Computer Science', 'Mathematics', 'Physics'];
  const deptData = departments.map(dept => {
    const deptFaculty = faculty.filter(f => f.department === dept);
    const metrics = deptFaculty.map(f => store.getFacultyMetrics(f.id, cycleId));
    const totalSubs = metrics.reduce((sum, m) => sum + m.totalSubmissions, 0);
    const avgScore = metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.overallAverage, 0) / metrics.length : 0;
    return { name: dept, faculty: deptFaculty.length, submissions: totalSubs, average: avgScore };
  });

  const critData = criteria.map(c => {
    let total = 0;
    let count = 0;
    faculty.forEach(f => {
      const metrics = store.getFacultyMetrics(f.id, cycleId);
      const avg = metrics.criteriaAverages[c.id] || 0;
      if (avg > 0) {
        total += avg;
        count++;
      }
    });
    return { name: c.name, avg: count > 0 ? total / count : 0 };
  });

  const flaggedFaculty = faculty.filter(f => {
    const metrics = store.getFacultyMetrics(f.id, cycleId);
    return metrics.totalSubmissions >= THRESHOLD && metrics.overallAverage < BENCHMARK;
  });

  const disputes = store.getDisputes();
  const pendingDisputes = disputes.filter(d => d.status === 'pending');

  const styles = {
    page: { fontFamily: 'Georgia, serif', color: '#1A1A1A', lineHeight: 1.6, padding: '0', maxWidth: '8.5in', margin: '0 auto', backgroundColor: 'white' },
    header: { borderBottom: '3px solid #002366', paddingBottom: '20px', marginBottom: '30px' },
    title: { fontSize: '28pt', fontWeight: 'bold', color: '#002366', margin: '0 0 8px 0', fontFamily: 'Georgia, serif' },
    subtitle: { fontSize: '14pt', color: '#B87333', margin: '0', fontStyle: 'italic' },
    section: { marginBottom: '30px', breakInside: 'avoid' as any },
    sectionTitle: { fontSize: '16pt', fontWeight: 'bold', color: '#002366', borderBottom: '2px solid #B87333', paddingBottom: '8px', marginBottom: '15px' },
    table: { width: '100%', borderCollapse: 'collapse' as const, marginBottom: '15px', fontSize: '11pt' },
    th: { backgroundColor: '#002366', color: 'white', padding: '10px', textAlign: 'left' as const, fontWeight: 'bold', border: '1px solid #002366' },
    td: { padding: '10px', border: '1px solid #D5D8DC' },
    metricBox: { display: 'inline-block', width: '22%', margin: '0 1% 15px 0', padding: '15px', border: '2px solid #D5D8DC', textAlign: 'center' as const, verticalAlign: 'top' as const },
    metricValue: { fontSize: '24pt', fontWeight: 'bold', margin: '8px 0' },
    metricLabel: { fontSize: '10pt', color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '1px' },
    footer: { borderTop: '2px solid #002366', paddingTop: '15px', marginTop: '40px', fontSize: '9pt', color: '#6B7280', textAlign: 'center' as const },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div><h1 style={styles.title}>Institution-Wide Evaluation Report</h1><p style={styles.subtitle}>Administrative Summary</p></div>
          <div style={{ textAlign: 'right' }}><p style={{ margin: 0, fontSize: '10pt', color: '#6B7280' }}>Report Generated</p><p style={{ margin: '4px 0 0 0', fontSize: '12pt', fontWeight: 'bold', color: '#002366' }}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
        </div>
      </div>

      <div style={styles.section}><h2 style={styles.sectionTitle}>System Overview</h2><table style={styles.table}><tbody><tr><th style={{ ...styles.th, width: '40%' }}>Evaluation Period</th><td style={styles.td}>{cycleName}</td></tr><tr><th style={styles.th}>Total Faculty</th><td style={styles.td}>{faculty.length}</td></tr><tr><th style={styles.th}>Total Evaluations</th><td style={styles.td}>{totalEvaluations}</td></tr><tr><th style={styles.th}>Active Cycles</th><td style={styles.td}>{cycles.filter(c => c.status === 'active').length}</td></tr><tr><th style={styles.th}>Departments</th><td style={styles.td}>{departments.length}</td></tr></tbody></table></div>

      <div style={styles.section}><h2 style={styles.sectionTitle}>Institution-Wide Acknowledgment Compliance</h2><div style={{ marginBottom: '20px' }}><div style={styles.metricBox}><div style={styles.metricLabel}>Acknowledged</div><div style={{ ...styles.metricValue, color: '#2E8B57' }}>{acknowledged}</div></div><div style={styles.metricBox}><div style={styles.metricLabel}>Pending Ack.</div><div style={{ ...styles.metricValue, color: '#B87333' }}>{pendingAck}</div></div><div style={styles.metricBox}><div style={styles.metricLabel}>Disputed</div><div style={{ ...styles.metricValue, color: '#C41E3A' }}>{disputed}</div></div><div style={styles.metricBox}><div style={styles.metricLabel}>Pending Review</div><div style={{ ...styles.metricValue, color: '#4B5563' }}>{pendingReview}</div></div></div><div style={{ fontSize: '10pt', color: '#6B7280' }}>Overall Compliance Rate: {faculty.length > 0 ? Math.round((acknowledged / faculty.length) * 100) : 0}%</div></div>

      <div style={styles.section}><h2 style={styles.sectionTitle}>Department Summary</h2><table style={styles.table}><thead><tr><th style={styles.th}>Department</th><th style={{ ...styles.th, width: '15%', textAlign: 'center' }}>Faculty</th><th style={{ ...styles.th, width: '20%', textAlign: 'center' }}>Submissions</th><th style={{ ...styles.th, width: '20%', textAlign: 'center' }}>Average</th></tr></thead><tbody>{deptData.map((dept, i) => (<tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#F8F6F1' : 'white' }}><td style={styles.td}>{dept.name}</td><td style={{ ...styles.td, textAlign: 'center' }}>{dept.faculty}</td><td style={{ ...styles.td, textAlign: 'center' }}>{dept.submissions}</td><td style={{ ...styles.td, textAlign: 'center', fontWeight: 'bold', color: dept.average >= BENCHMARK ? '#2E8B57' : '#C41E3A' }}>{dept.average.toFixed(2)}</td></tr>))}</tbody></table></div>

      <div style={styles.section}><h2 style={styles.sectionTitle}>Institution-Wide Criteria Performance</h2><table style={styles.table}><thead><tr><th style={styles.th}>Criterion</th><th style={{ ...styles.th, width: '20%', textAlign: 'center' }}>Institution Average</th><th style={{ ...styles.th, width: '20%', textAlign: 'center' }}>Rating</th></tr></thead><tbody>{critData.map((crit, i) => (<tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#F8F6F1' : 'white' }}><td style={styles.td}>{crit.name}</td><td style={{ ...styles.td, textAlign: 'center', fontWeight: 'bold', color: crit.avg >= BENCHMARK ? '#2E8B57' : '#C41E3A' }}>{crit.avg.toFixed(2)}</td><td style={{ ...styles.td, textAlign: 'center' }}>{crit.avg >= 4.5 ? 'Excellent' : crit.avg >= BENCHMARK ? 'Good' : crit.avg >= 2 ? 'Needs Improvement' : 'Critical'}</td></tr>))}</tbody></table></div>

      {flaggedFaculty.length > 0 && (<div style={styles.section}><h2 style={{ ...styles.sectionTitle, color: '#C41E3A' }}>Faculty Below Benchmark (Average &lt; {BENCHMARK.toFixed(1)})</h2><table style={styles.table}><thead><tr><th style={styles.th}>Faculty Name</th><th style={{ ...styles.th, width: '25%' }}>Department</th><th style={{ ...styles.th, width: '15%', textAlign: 'center' }}>Average</th></tr></thead><tbody>{flaggedFaculty.map((f, i) => { const metrics = store.getFacultyMetrics(f.id, cycleId); return (<tr key={f.id} style={{ backgroundColor: i % 2 === 0 ? '#FEE2E2' : 'white' }}><td style={styles.td}>{f.name}</td><td style={styles.td}>{f.department}</td><td style={{ ...styles.td, textAlign: 'center', fontWeight: 'bold', color: '#C41E3A' }}>{metrics.overallAverage.toFixed(2)}</td></tr>); })}</tbody></table></div>)}

      <div style={{ ...styles.section, pageBreakBefore: 'always' as any }}><h2 style={styles.sectionTitle}>Dispute Resolution Status</h2><div style={{ fontSize: '10pt', color: '#6B7280', marginBottom: '12px' }}>Total Disputes: {disputes.length} | Pending: {pendingDisputes.length} | Resolved: {disputes.filter(d => d.status === 'resolved').length} | Dismissed: {disputes.filter(d => d.status === 'dismissed').length}</div>{disputes.length > 0 ? (<table style={styles.table}><thead><tr><th style={styles.th}>Faculty</th><th style={{ ...styles.th, width: '20%' }}>Cycle</th><th style={{ ...styles.th, width: '15%', textAlign: 'center' }}>Status</th><th style={{ ...styles.th, width: '20%', textAlign: 'center' }}>Submitted</th><th style={{ ...styles.th, width: '20%', textAlign: 'center' }}>Resolved</th></tr></thead><tbody>{disputes.map((d, i) => { const f = store.getFacultyById(d.facultyId); const c = cycles.find(c => c.id === d.cycleId); return (<tr key={d.id} style={{ backgroundColor: i % 2 === 0 ? '#F8F6F1' : 'white' }}><td style={styles.td}>{f?.name || 'Unknown'}</td><td style={styles.td}>{c?.displayName || 'Unknown'}</td><td style={{ ...styles.td, textAlign: 'center' }}><span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '4px', fontSize: '10pt', fontWeight: 'bold', backgroundColor: d.status === 'resolved' ? '#D1FAE5' : d.status === 'pending' ? '#F5E6D3' : '#FEE2E2', color: d.status === 'resolved' ? '#2E8B57' : d.status === 'pending' ? '#B87333' : '#C41E3A' }}>{d.status === 'resolved' ? '✓ Resolved' : d.status === 'pending' ? '○ Pending' : '⚠ Dismissed'}</span></td><td style={{ ...styles.td, textAlign: 'center' }}>{new Date(d.submittedAt).toLocaleDateString()}</td><td style={{ ...styles.td, textAlign: 'center' }}>{d.resolvedAt ? new Date(d.resolvedAt).toLocaleDateString() : '—'}</td></tr>); })}</tbody></table>) : (<p style={{ fontSize: '10pt', color: '#6B7280', fontStyle: 'italic' }}>No disputes submitted</p>)}</div>

      <div style={styles.footer}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ textAlign: 'left' }}><p style={{ margin: 0, fontWeight: 'bold' }}>Anonymous Faculty Evaluation System (AFES)</p><p style={{ margin: '4px 0 0 0', fontSize: '9pt' }}>Institution-Wide Administrative Report • Confidential</p></div><div style={{ textAlign: 'right' }}><p style={{ margin: 0, fontWeight: 'bold' }}>Page 1 of 1</p><p style={{ margin: '4px 0 0 0', fontSize: '9pt' }}>Generated: {new Date().toLocaleString()}</p></div></div></div>
    </div>
  );
}
