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

  return (
    <div className="print-only" style={{ display: 'none' }}>
      {/* Header */}
      <div className="print-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24pt', color: '#002366' }}>Institution-Wide Evaluation Report</h1>
            <p style={{ margin: '4pt 0 0 0', fontSize: '11pt', color: '#6B7280' }}>Administrative Summary</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '10pt', color: '#6B7280' }}>Report Date</p>
            <p style={{ margin: '2pt 0 0 0', fontSize: '11pt', fontWeight: 'bold' }}>{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div className="print-section">
        <h2>System Overview</h2>
        <table>
          <tbody>
            <tr>
              <th style={{ width: '40%' }}>Evaluation Period</th>
              <td>{cycleName}</td>
            </tr>
            <tr>
              <th>Total Faculty</th>
              <td>{faculty.length}</td>
            </tr>
            <tr>
              <th>Total Evaluations</th>
              <td>{totalEvaluations}</td>
            </tr>
            <tr>
              <th>Active Cycles</th>
              <td>{cycles.filter(c => c.status === 'active').length}</td>
            </tr>
            <tr>
              <th>Departments</th>
              <td>{departments.length}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Institution-Wide Compliance */}
      <div className="print-section">
        <h2>Institution-Wide Acknowledgment Compliance</h2>
        <div style={{ display: 'flex', gap: '12pt', marginBottom: '12pt' }}>
          <div className="metric-card">
            <div className="metric-label">Acknowledged</div>
            <div className="metric-value" style={{ color: '#2E8B57' }}>{acknowledged}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Pending Ack.</div>
            <div className="metric-value" style={{ color: '#B87333' }}>{pendingAck}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Disputed</div>
            <div className="metric-value" style={{ color: '#C41E3A' }}>{disputed}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Pending Review</div>
            <div className="metric-value" style={{ color: '#4B5563' }}>{pendingReview}</div>
          </div>
        </div>
        <div style={{ fontSize: '10pt', color: '#6B7280' }}>
          Overall Compliance Rate: {faculty.length > 0 ? Math.round((acknowledged / faculty.length) * 100) : 0}%
        </div>
      </div>

      {/* Department Summary */}
      <div className="print-section">
        <h2>Department Summary</h2>
        <table>
          <thead>
            <tr>
              <th>Department</th>
              <th style={{ width: '15%', textAlign: 'center' }}>Faculty</th>
              <th style={{ width: '20%', textAlign: 'center' }}>Submissions</th>
              <th style={{ width: '20%', textAlign: 'center' }}>Average</th>
            </tr>
          </thead>
          <tbody>
            {deptData.map((dept, i) => (
              <tr key={i}>
                <td>{dept.name}</td>
                <td style={{ textAlign: 'center' }}>{dept.faculty}</td>
                <td style={{ textAlign: 'center' }}>{dept.submissions}</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold', color: dept.average >= BENCHMARK ? '#2E8B57' : '#C41E3A' }}>
                  {dept.average.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Institution-Wide Criteria Performance */}
      <div className="print-section">
        <h2>Institution-Wide Criteria Performance</h2>
        <table>
          <thead>
            <tr>
              <th>Criterion</th>
              <th style={{ width: '20%', textAlign: 'center' }}>Institution Average</th>
              <th style={{ width: '20%', textAlign: 'center' }}>Rating</th>
            </tr>
          </thead>
          <tbody>
            {critData.map((crit, i) => (
              <tr key={i}>
                <td>{crit.name}</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold', color: crit.avg >= BENCHMARK ? '#2E8B57' : '#C41E3A' }}>
                  {crit.avg.toFixed(2)}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {crit.avg >= 4.5 ? 'Excellent' : crit.avg >= BENCHMARK ? 'Good' : crit.avg >= 2 ? 'Needs Improvement' : 'Critical'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Flagged Faculty */}
      {flaggedFaculty.length > 0 && (
        <div className="print-section">
          <h2 style={{ color: '#C41E3A' }}>Faculty Below Benchmark (Average &lt; {BENCHMARK.toFixed(1)})</h2>
          <table>
            <thead>
              <tr>
                <th>Faculty Name</th>
                <th style={{ width: '25%' }}>Department</th>
                <th style={{ width: '15%', textAlign: 'center' }}>Average</th>
              </tr>
            </thead>
            <tbody>
              {flaggedFaculty.map((f, i) => {
                const metrics = store.getFacultyMetrics(f.id, cycleId);
                return (
                  <tr key={f.id}>
                    <td>{f.name}</td>
                    <td>{f.department}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#C41E3A' }}>
                      {metrics.overallAverage.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Dispute Resolution Status */}
      <div className="print-section page-break">
        <h2>Dispute Resolution Status</h2>
        <div style={{ fontSize: '10pt', color: '#6B7280', marginBottom: '8pt' }}>
          Total Disputes: {disputes.length} | Pending: {pendingDisputes.length} | Resolved: {disputes.filter(d => d.status === 'resolved').length} | Dismissed: {disputes.filter(d => d.status === 'dismissed').length}
        </div>
        {disputes.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Faculty</th>
                <th style={{ width: '20%' }}>Cycle</th>
                <th style={{ width: '15%', textAlign: 'center' }}>Status</th>
                <th style={{ width: '20%', textAlign: 'center' }}>Submitted</th>
                <th style={{ width: '20%', textAlign: 'center' }}>Resolved</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((d, i) => {
                const f = store.getFacultyById(d.facultyId);
                const c = cycles.find(c => c.id === d.cycleId);
                return (
                  <tr key={d.id}>
                    <td>{f?.name || 'Unknown'}</td>
                    <td>{c?.displayName || 'Unknown'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-badge status-${d.status === 'resolved' ? 'acknowledged' : d.status === 'pending' ? 'pending' : 'disputed'}`}>
                        {d.status === 'resolved' ? '✓ Resolved' : d.status === 'pending' ? '○ Pending' : '⚠ Dismissed'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{new Date(d.submittedAt).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'center' }}>{d.resolvedAt ? new Date(d.resolvedAt).toLocaleDateString() : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p style={{ fontSize: '10pt', color: '#6B7280', fontStyle: 'italic' }}>No disputes submitted</p>
        )}
      </div>

      {/* Footer */}
      <div className="print-footer">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0 }}>Anonymous Faculty Evaluation System (AFES)</p>
            <p style={{ margin: '2pt 0 0 0', fontSize: '8pt' }}>Institution-Wide Administrative Report • Confidential</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0 }}>Page 1 of 1</p>
            <p style={{ margin: '2pt 0 0 0', fontSize: '8pt' }}>Generated: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
