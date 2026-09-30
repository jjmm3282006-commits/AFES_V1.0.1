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

  return (
    <div className="print-only" style={{ display: 'none' }}>
      {/* Header */}
      <div className="print-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24pt', color: '#002366' }}>Department Evaluation Report</h1>
            <p style={{ margin: '4pt 0 0 0', fontSize: '11pt', color: '#6B7280' }}>{department} Department</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '10pt', color: '#6B7280' }}>Report Date</p>
            <p style={{ margin: '2pt 0 0 0', fontSize: '11pt', fontWeight: 'bold' }}>{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Department Overview */}
      <div className="print-section">
        <h2>Department Overview</h2>
        <table>
          <tbody>
            <tr>
              <th style={{ width: '40%' }}>Department</th>
              <td>{department}</td>
            </tr>
            <tr>
              <th>Evaluation Period</th>
              <td>{cycleName}</td>
            </tr>
            <tr>
              <th>Total Faculty</th>
              <td>{faculty.length}</td>
            </tr>
            <tr>
              <th>Total Submissions</th>
              <td>{deptMetrics.totalSubmissions}</td>
            </tr>
            <tr>
              <th>Department Average</th>
              <td style={{ fontWeight: 'bold', color: '#002366' }}>{deptMetrics.institutionAverage.toFixed(2)} / 5.00</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Acknowledgment Compliance */}
      <div className="print-section">
        <h2>Acknowledgment Compliance</h2>
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
          Compliance Rate: {faculty.length > 0 ? Math.round((acknowledged / faculty.length) * 100) : 0}%
        </div>
      </div>

      {/* Faculty Performance Summary */}
      <div className="print-section">
        <h2>Faculty Performance Summary</h2>
        <table>
          <thead>
            <tr>
              <th>Faculty Name</th>
              <th style={{ width: '15%', textAlign: 'center' }}>Submissions</th>
              <th style={{ width: '15%', textAlign: 'center' }}>Average</th>
              <th style={{ width: '20%', textAlign: 'center' }}>Status</th>
              <th style={{ width: '20%', textAlign: 'center' }}>Acknowledgment</th>
            </tr>
          </thead>
          <tbody>
            {faculty.map((f, i) => {
              const metrics = store.getFacultyMetrics(f.id, cycleId);
              const belowThreshold = metrics.totalSubmissions < THRESHOLD;
              return (
                <tr key={f.id}>
                  <td>{f.name}</td>
                  <td style={{ textAlign: 'center' }}>{metrics.totalSubmissions}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: belowThreshold ? '#9CA3AF' : metrics.overallAverage >= 4.5 ? '#2E8B57' : metrics.overallAverage >= BENCHMARK ? '#002366' : '#C41E3A' }}>
                    {belowThreshold ? '—' : metrics.overallAverage.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {belowThreshold ? 'Insufficient Data' : metrics.overallAverage >= 4.5 ? 'Excellent' : metrics.overallAverage >= BENCHMARK ? 'Good' : 'Below Benchmark'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`status-badge status-${f.acknowledgmentStatus === 'acknowledged' ? 'acknowledged' : f.acknowledgmentStatus === 'disputed' ? 'disputed' : 'pending'}`}>
                      {f.acknowledgmentStatus === 'acknowledged' ? '✓ Ack' : f.acknowledgmentStatus === 'disputed' ? '⚠ Disputed' : '○ Pending'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Criteria Performance */}
      <div className="print-section">
        <h2>Department Criteria Performance</h2>
        <table>
          <thead>
            <tr>
              <th>Criterion</th>
              <th style={{ width: '20%', textAlign: 'center' }}>Department Average</th>
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

      {/* Strengths and Improvements */}
      <div className="print-section">
        <h2>Department Analysis</h2>
        <div style={{ display: 'flex', gap: '20pt' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ color: '#2E8B57', fontSize: '12pt' }}>Department Strengths</h3>
            {strengths.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Criterion</th>
                    <th style={{ width: '20%', textAlign: 'center' }}>Average</th>
                  </tr>
                </thead>
                <tbody>
                  {strengths.map((s, i) => (
                    <tr key={i}>
                      <td>{s.name}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#2E8B57' }}>{s.avg.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ fontSize: '10pt', color: '#6B7280', fontStyle: 'italic' }}>No criteria above 4.0 threshold</p>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ color: '#C41E3A', fontSize: '12pt' }}>Areas for Improvement</h3>
            {improvements.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Criterion</th>
                    <th style={{ width: '20%', textAlign: 'center' }}>Average</th>
                  </tr>
                </thead>
                <tbody>
                  {improvements.map((imp, i) => (
                    <tr key={i}>
                      <td>{imp.name}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#C41E3A' }}>{imp.avg.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ fontSize: '10pt', color: '#6B7280', fontStyle: 'italic' }}>All criteria meet benchmark</p>
            )}
          </div>
        </div>
      </div>

      {/* Compliance Tracking Log */}
      <div className="print-section page-break">
        <h2>Compliance Tracking Log</h2>
        <table>
          <thead>
            <tr>
              <th>Faculty Name</th>
              <th style={{ width: '20%', textAlign: 'center' }}>Status</th>
              <th style={{ width: '20%', textAlign: 'center' }}>Acknowledged Date</th>
              <th style={{ width: '20%', textAlign: 'center' }}>Last Reminder</th>
            </tr>
          </thead>
          <tbody>
            {faculty.map((f, i) => (
              <tr key={f.id}>
                <td>{f.name}</td>
                <td style={{ textAlign: 'center' }}>
                  <span className={`status-badge status-${f.acknowledgmentStatus === 'acknowledged' ? 'acknowledged' : f.acknowledgmentStatus === 'disputed' ? 'disputed' : 'pending'}`}>
                    {f.acknowledgmentStatus === 'acknowledged' ? '🟢 Acknowledged' : f.acknowledgmentStatus === 'disputed' ? '🔴 Disputed' : f.acknowledgmentStatus === 'pending_acknowledgment' ? '🟡 Pending' : '⚫ Review'}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  {f.acknowledgedAt ? new Date(f.acknowledgedAt).toLocaleDateString() : '—'}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {f.lastReminderSent ? new Date(f.lastReminderSent).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="print-footer">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0 }}>Anonymous Faculty Evaluation System (AFES)</p>
            <p style={{ margin: '2pt 0 0 0', fontSize: '8pt' }}>{department} Department Report • Confidential</p>
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
