import React from 'react';
import { store, BENCHMARK, THRESHOLD } from '../store';
import type { Criterion } from '../types';

interface DeanPrintReportProps {
  department: string;
  cycleName: string;
  criteria: Criterion[];
}

export default function DeanPrintReport({ department, cycleName, criteria }: DeanPrintReportProps) {
  const faculty = store.getFacultyByDepartment(department);
  const deptMetrics = store.getDepartmentMetrics(department);
  const cycleId = store.getActiveCycle()?.id;
  
  const acknowledged = faculty.filter(f => f.acknowledgmentStatus === 'acknowledged').length;
  const pendingAck = faculty.filter(f => f.acknowledgmentStatus === 'pending_acknowledgment').length;
  const disputed = faculty.filter(f => f.acknowledgmentStatus === 'disputed').length;
  const pendingReview = faculty.filter(f => f.acknowledgmentStatus === 'pending_review').length;

  const critData = criteria.map(c => ({
    name: c.name,
    avg: deptMetrics.criteriaAverages[c.id] || 0,
  }));

  const strengths = critData.filter(c => c.avg >= 4.0).sort((a, b) => b.avg - a.avg);
  const improvements = critData.filter(c => c.avg < BENCHMARK && c.avg > 0).sort((a, b) => a.avg - b.avg);

  // Generate tracking ID and metadata
  const trackingId = `AFES-DEAN-${Date.now()}-${department.replace(/\s+/g, '-')}`;
  const generationTimestamp = new Date().toLocaleString();

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
          <div><h1 style={styles.title}>Department Evaluation Report</h1><p style={styles.subtitle}>{department} Department</p></div>
          <div style={{ textAlign: 'right' }}><p style={{ margin: 0, fontSize: '10pt', color: '#6B7280' }}>Report Generated</p><p style={{ margin: '4px 0 0 0', fontSize: '12pt', fontWeight: 'bold', color: '#002366' }}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
        </div>
      </div>

      <div className="print-section"><h2>Department Overview</h2><table><tbody><tr><th style={{ width: '40%' }}>Department</th><td>{department}</td></tr><tr><th>Evaluation Period</th><td>{cycleName}</td></tr><tr><th>Total Faculty</th><td>{faculty.length}</td></tr><tr><th>Total Submissions</th><td>{deptMetrics.totalSubmissions}</td></tr><tr><th>Department Average</th><td style={{ fontWeight: 'bold', color: '#002366' }}>{deptMetrics.institutionAverage.toFixed(2)} / 5.00</td></tr></tbody></table></div>

      <div className="print-section"><h2>Acknowledgment Compliance</h2><div style={{ display: 'flex', gap: '12pt', marginBottom: '12pt' }}><div className="metric-card"><div className="metric-label">Acknowledged</div><div className="metric-value" style={{ color: '#2E8B57' }}>{acknowledged}</div></div><div className="metric-card"><div className="metric-label">Pending Ack.</div><div className="metric-value" style={{ color: '#B87333' }}>{pendingAck}</div></div><div className="metric-card"><div className="metric-label">Disputed</div><div className="metric-value" style={{ color: '#C41E3A' }}>{disputed}</div></div><div className="metric-card"><div className="metric-label">Pending Review</div><div className="metric-value" style={{ color: '#4B5563' }}>{pendingReview}</div></div></div><div style={{ fontSize: '10pt', color: '#6B7280' }}>Compliance Rate: {faculty.length > 0 ? Math.round((acknowledged / faculty.length) * 100) : 0}%</div></div>

      <div className="print-section"><h2>Faculty Performance Summary</h2><table><thead><tr><th>Faculty Name</th><th style={{ width: '15%', textAlign: 'center' }}>Submissions</th><th style={{ width: '15%', textAlign: 'center' }}>Average</th><th style={{ width: '20%', textAlign: 'center' }}>Status</th><th style={{ width: '20%', textAlign: 'center' }}>Acknowledgment</th></tr></thead><tbody>{faculty.map((f, i) => { const metrics = store.getFacultyMetrics(f.id, cycleId); const belowThreshold = metrics.totalSubmissions < THRESHOLD; return (<tr key={f.id}><td>{f.name}</td><td style={{ textAlign: 'center' }}>{metrics.totalSubmissions}</td><td style={{ textAlign: 'center', fontWeight: 'bold', color: belowThreshold ? '#9CA3AF' : metrics.overallAverage >= 4.5 ? '#2E8B57' : metrics.overallAverage >= BENCHMARK ? '#002366' : '#C41E3A' }}>{belowThreshold ? '—' : metrics.overallAverage.toFixed(2)}</td><td style={{ textAlign: 'center' }}>{belowThreshold ? 'Insufficient Data' : metrics.overallAverage >= 4.5 ? 'Excellent' : metrics.overallAverage >= BENCHMARK ? 'Good' : 'Below Benchmark'}</td><td style={{ textAlign: 'center' }}><span className={`status-badge status-${f.acknowledgmentStatus === 'acknowledged' ? 'acknowledged' : f.acknowledgmentStatus === 'disputed' ? 'disputed' : 'pending'}`}>{f.acknowledgmentStatus === 'acknowledged' ? '✓ Ack' : f.acknowledgmentStatus === 'disputed' ? '⚠ Disputed' : '○ Pending'}</span></td></tr>); })}</tbody></table></div>

      <div className="print-section"><h2>Department Criteria Performance</h2><table><thead><tr><th>Criterion</th><th style={{ width: '20%', textAlign: 'center' }}>Department Average</th><th style={{ width: '20%', textAlign: 'center' }}>Rating</th></tr></thead><tbody>{critData.map((crit, i) => (<tr key={i}><td>{crit.name}</td><td style={{ textAlign: 'center', fontWeight: 'bold', color: crit.avg >= BENCHMARK ? '#2E8B57' : '#C41E3A' }}>{crit.avg.toFixed(2)}</td><td style={{ textAlign: 'center' }}>{crit.avg >= 4.5 ? 'Excellent' : crit.avg >= BENCHMARK ? 'Good' : crit.avg >= 2 ? 'Needs Improvement' : 'Critical'}</td></tr>))}</tbody></table></div>

      <div className="print-section"><h2>Department Analysis</h2><div style={{ display: 'flex', gap: '20pt' }}><div style={{ flex: 1 }}><h3 style={{ color: '#2E8B57', fontSize: '12pt' }}>Department Strengths</h3>{strengths.length > 0 ? (<table><thead><tr><th>Criterion</th><th style={{ width: '20%', textAlign: 'center' }}>Average</th></tr></thead><tbody>{strengths.map((s, i) => (<tr key={i}><td>{s.name}</td><td style={{ textAlign: 'center', fontWeight: 'bold', color: '#2E8B57' }}>{s.avg.toFixed(2)}</td></tr>))}</tbody></table>) : (<p style={{ fontSize: '10pt', color: '#6B7280', fontStyle: 'italic' }}>No criteria above 4.0 threshold</p>)}</div><div style={{ flex: 1 }}><h3 style={{ color: '#C41E3A', fontSize: '12pt' }}>Areas for Improvement</h3>{improvements.length > 0 ? (<table><thead><tr><th>Criterion</th><th style={{ width: '20%', textAlign: 'center' }}>Average</th></tr></thead><tbody>{improvements.map((imp, i) => (<tr key={i}><td>{imp.name}</td><td style={{ textAlign: 'center', fontWeight: 'bold', color: '#C41E3A' }}>{imp.avg.toFixed(2)}</td></tr>))}</tbody></table>) : (<p style={{ fontSize: '10pt', color: '#6B7280', fontStyle: 'italic' }}>All criteria meet benchmark</p>)}</div></div></div>

      <div className="print-section page-break"><h2>Compliance Tracking Log</h2><table><thead><tr><th>Faculty Name</th><th style={{ width: '20%', textAlign: 'center' }}>Status</th><th style={{ width: '20%', textAlign: 'center' }}>Acknowledged Date</th><th style={{ width: '20%', textAlign: 'center' }}>Last Reminder</th></tr></thead><tbody>{faculty.map((f, i) => (<tr key={f.id}><td>{f.name}</td><td style={{ textAlign: 'center' }}><span className={`status-badge status-${f.acknowledgmentStatus === 'acknowledged' ? 'acknowledged' : f.acknowledgmentStatus === 'disputed' ? 'disputed' : 'pending'}`}>{f.acknowledgmentStatus === 'acknowledged' ? '🟢 Acknowledged' : f.acknowledgmentStatus === 'disputed' ? '🔴 Disputed' : f.acknowledgmentStatus === 'pending_acknowledgment' ? '🟡 Pending' : '⚫ Review'}</span></td><td style={{ textAlign: 'center' }}>{f.acknowledgedAt ? new Date(f.acknowledgedAt).toLocaleDateString() : '—'}</td><td style={{ textAlign: 'center' }}>{f.lastReminderSent ? new Date(f.lastReminderSent).toLocaleDateString() : '—'}</td></tr>))}</tbody></table></div>

      <div className="print-footer"><div style={{ display: 'flex', justifyContent: 'space-between' }}><div><p style={{ margin: 0 }}>Anonymous Faculty Evaluation System (AFES)</p><p style={{ margin: '2pt 0 0 0', fontSize: '8pt' }}>{department} Department Report • Confidential</p></div><div style={{ textAlign: 'right' }}><p style={{ margin: 0 }}>Page 1 of 1</p><p style={{ margin: '2pt 0 0 0', fontSize: '8pt' }}>Generated: {new Date().toLocaleString()}</p></div></div></div>
    </div>
  );
}
