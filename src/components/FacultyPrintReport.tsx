import React from 'react';
import { store, BENCHMARK } from '../store';
import type { FacultyMetrics, Criterion, SubQuestion } from '../types';

interface PrintReportProps {
  facultyId: string;
  metrics: FacultyMetrics;
  criteria: Criterion[];
  subQuestions: SubQuestion[];
  cycleName: string;
}

export default function FacultyPrintReport({ facultyId, metrics, criteria, subQuestions, cycleName }: PrintReportProps) {
  const faculty = store.getFacultyById(facultyId);
  if (!faculty) return null;

  const deptMetrics = store.getDepartmentMetrics(faculty.department);
  const critData = criteria.map(c => ({
    name: c.name,
    avg: metrics.criteriaAverages[c.id] || 0,
    subQuestions: subQuestions.filter(sq => sq.criterionId === c.id).map(sq => ({
      text: sq.text,
      avg: metrics.subQuestionAverages[sq.id] || 0,
    })),
  }));

  return (
    <div className="print-only" style={{ display: 'none' }}>
      {/* Header */}
      <div className="print-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24pt', color: '#002366' }}>Faculty Evaluation Report</h1>
            <p style={{ margin: '4pt 0 0 0', fontSize: '11pt', color: '#6B7280' }}>Anonymous Faculty Evaluation System</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '10pt', color: '#6B7280' }}>Report Date</p>
            <p style={{ margin: '2pt 0 0 0', fontSize: '11pt', fontWeight: 'bold' }}>{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Faculty Information */}
      <div className="print-section">
        <h2>Faculty Information</h2>
        <table>
          <tbody>
            <tr>
              <th style={{ width: '30%' }}>Faculty Name</th>
              <td>{faculty.name}</td>
            </tr>
            <tr>
              <th>Department</th>
              <td>{faculty.department}</td>
            </tr>
            <tr>
              <th>Title</th>
              <td>{faculty.title}</td>
            </tr>
            <tr>
              <th>Evaluation Period</th>
              <td>{cycleName}</td>
            </tr>
            <tr>
              <th>Acknowledgment Status</th>
              <td>
                <span className={`status-badge status-${faculty.acknowledgmentStatus === 'acknowledged' ? 'acknowledged' : faculty.acknowledgmentStatus === 'disputed' ? 'disputed' : 'pending'}`}>
                  {faculty.acknowledgmentStatus === 'acknowledged' ? '✓ Acknowledged' : faculty.acknowledgmentStatus === 'disputed' ? '⚠ Disputed' : '○ Pending'}
                </span>
                {faculty.acknowledgedAt && <span style={{ marginLeft: '8pt', fontSize: '9pt', color: '#6B7280' }}>on {new Date(faculty.acknowledgedAt).toLocaleDateString()}</span>}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Performance Summary */}
      <div className="print-section">
        <h2>Performance Summary</h2>
        <div style={{ display: 'flex', gap: '12pt', marginBottom: '12pt' }}>
          <div className="metric-card">
            <div className="metric-label">Total Submissions</div>
            <div className="metric-value">{metrics.totalSubmissions}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Overall Average</div>
            <div className="metric-value">{metrics.overallAverage.toFixed(2)}</div>
            <div style={{ fontSize: '9pt', color: '#6B7280' }}>out of 5.0</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Department Average</div>
            <div className="metric-value">{deptMetrics.institutionAverage.toFixed(2)}</div>
            <div style={{ fontSize: '9pt', color: '#6B7280' }}>
              {metrics.overallAverage >= deptMetrics.institutionAverage ? '↑ Above' : '↓ Below'} by {Math.abs(metrics.overallAverage - deptMetrics.institutionAverage).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Criteria Performance */}
      <div className="print-section">
        <h2>Criteria Performance Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Criterion</th>
              <th style={{ width: '15%', textAlign: 'center' }}>Average</th>
              <th style={{ width: '20%', textAlign: 'center' }}>Rating</th>
            </tr>
          </thead>
          <tbody>
            {critData.map((crit, i) => (
              <React.Fragment key={i}>
                <tr style={{ backgroundColor: '#F5E6D3 !important' }}>
                  <td style={{ fontWeight: 'bold' }}>{crit.name}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: crit.avg >= BENCHMARK ? '#2E8B57' : '#C41E3A' }}>
                    {crit.avg.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                    {crit.avg >= 4.5 ? 'Excellent' : crit.avg >= BENCHMARK ? 'Good' : crit.avg >= 2 ? 'Needs Improvement' : 'Critical'}
                  </td>
                </tr>
                {crit.subQuestions.map((sq, j) => (
                  <tr key={`${i}-${j}`}>
                    <td style={{ paddingLeft: '20pt', fontSize: '9pt' }}>→ {sq.text}</td>
                    <td style={{ textAlign: 'center', fontSize: '9pt', color: sq.avg >= BENCHMARK ? '#2E8B57' : '#C41E3A' }}>
                      {sq.avg.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center', fontSize: '9pt' }}>
                      {sq.avg >= 4.5 ? 'Excellent' : sq.avg >= BENCHMARK ? 'Good' : sq.avg >= 2 ? 'Needs Improvement' : 'Critical'}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Course Performance */}
      <div className="print-section">
        <h2>Course Performance</h2>
        <table>
          <thead>
            <tr>
              <th>Course</th>
              <th style={{ width: '20%', textAlign: 'center' }}>Submissions</th>
              <th style={{ width: '20%', textAlign: 'center' }}>Average</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(metrics.courseBreakdown).map(([course, data], i) => (
              <tr key={i}>
                <td>{course}</td>
                <td style={{ textAlign: 'center' }}>{data.count}</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold', color: data.average >= BENCHMARK ? '#2E8B57' : '#C41E3A' }}>
                  {data.average.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Score Distribution */}
      <div className="print-section">
        <h2>Score Distribution</h2>
        <table>
          <thead>
            <tr>
              <th>Rating</th>
              <th style={{ width: '20%', textAlign: 'center' }}>Count</th>
              <th style={{ width: '20%', textAlign: 'center' }}>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {[5, 4, 3, 2, 1].map((star, i) => {
              const count = metrics.scoreDistribution[star - 1];
              const total = metrics.scoreDistribution.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
              return (
                <tr key={star}>
                  <td>{star} Star{star > 1 ? 's' : ''}</td>
                  <td style={{ textAlign: 'center' }}>{count}</td>
                  <td style={{ textAlign: 'center' }}>{pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Student Feedback */}
      {metrics.feedback.length > 0 && (
        <div className="print-section page-break">
          <h2>Student Feedback (PII-Redacted)</h2>
          <p style={{ fontSize: '9pt', color: '#6B7280', fontStyle: 'italic', marginBottom: '8pt' }}>
            All personally identifiable information has been automatically redacted to protect student anonymity.
          </p>
          {metrics.feedback.map((fb, i) => (
            <div key={i} className="feedback-item">
              <p style={{ margin: 0, fontSize: '10pt' }}>"{fb.feedback}"</p>
              <div className="feedback-meta">
                Course: {fb.courseId} • Submitted: {new Date(fb.submittedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="print-footer">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0 }}>Anonymous Faculty Evaluation System (AFES)</p>
            <p style={{ margin: '2pt 0 0 0', fontSize: '8pt' }}>This report contains confidential evaluation data. Handle with appropriate care.</p>
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
