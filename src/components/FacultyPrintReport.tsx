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

  // Inline styles for print document
  const styles = {
    page: {
      fontFamily: 'Georgia, serif',
      color: '#1A1A1A',
      lineHeight: 1.6,
      padding: '0',
      maxWidth: '8.5in',
      margin: '0 auto',
      backgroundColor: 'white',
    },
    header: {
      borderBottom: '3px solid #002366',
      paddingBottom: '20px',
      marginBottom: '30px',
    },
    title: {
      fontSize: '28pt',
      fontWeight: 'bold',
      color: '#002366',
      margin: '0 0 8px 0',
      fontFamily: 'Georgia, serif',
    },
    subtitle: {
      fontSize: '14pt',
      color: '#B87333',
      margin: '0',
      fontStyle: 'italic',
    },
    section: {
      marginBottom: '30px',
      breakInside: 'avoid' as any,
    },
    sectionTitle: {
      fontSize: '16pt',
      fontWeight: 'bold',
      color: '#002366',
      borderBottom: '2px solid #B87333',
      paddingBottom: '8px',
      marginBottom: '15px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginBottom: '15px',
      fontSize: '11pt',
    },
    th: {
      backgroundColor: '#002366',
      color: 'white',
      padding: '10px',
      textAlign: 'left' as const,
      fontWeight: 'bold',
      border: '1px solid #002366',
    },
    td: {
      padding: '10px',
      border: '1px solid #D5D8DC',
    },
    metricBox: {
      display: 'inline-block',
      width: '30%',
      margin: '0 1.5% 15px 0',
      padding: '15px',
      border: '2px solid #D5D8DC',
      textAlign: 'center' as const,
      verticalAlign: 'top' as const,
    },
    metricValue: {
      fontSize: '24pt',
      fontWeight: 'bold',
      color: '#002366',
      margin: '8px 0',
    },
    metricLabel: {
      fontSize: '10pt',
      color: '#6B7280',
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
    },
    feedbackItem: {
      padding: '15px',
      margin: '12px 0',
      borderLeft: '4px solid #B87333',
      backgroundColor: '#F8F6F1',
      fontSize: '11pt',
    },
    footer: {
      borderTop: '2px solid #002366',
      paddingTop: '15px',
      marginTop: '40px',
      fontSize: '9pt',
      color: '#6B7280',
      textAlign: 'center' as const,
    },
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={styles.title}>Faculty Evaluation Report</h1>
            <p style={styles.subtitle}>Anonymous Faculty Evaluation System</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '10pt', color: '#6B7280' }}>Report Generated</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12pt', fontWeight: 'bold', color: '#002366' }}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* Faculty Information */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Faculty Information</h2>
        <table style={styles.table}>
          <tbody>
            <tr>
              <th style={{ ...styles.th, width: '30%' }}>Faculty Name</th>
              <td style={styles.td}>{faculty.name}</td>
            </tr>
            <tr>
              <th style={styles.th}>Department</th>
              <td style={styles.td}>{faculty.department}</td>
            </tr>
            <tr>
              <th style={styles.th}>Title</th>
              <td style={styles.td}>{faculty.title}</td>
            </tr>
            <tr>
              <th style={styles.th}>Evaluation Period</th>
              <td style={styles.td}>{cycleName}</td>
            </tr>
            <tr>
              <th style={styles.th}>Acknowledgment Status</th>
              <td style={styles.td}>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '10pt',
                  fontWeight: 'bold',
                  backgroundColor: faculty.acknowledgmentStatus === 'acknowledged' ? '#D1FAE5' : faculty.acknowledgmentStatus === 'disputed' ? '#FEE2E2' : '#F5E6D3',
                  color: faculty.acknowledgmentStatus === 'acknowledged' ? '#2E8B57' : faculty.acknowledgmentStatus === 'disputed' ? '#C41E3A' : '#B87333',
                }}>
                  {faculty.acknowledgmentStatus === 'acknowledged' ? '✓ Acknowledged' : faculty.acknowledgmentStatus === 'disputed' ? '⚠ Disputed' : '○ Pending'}
                </span>
                {faculty.acknowledgedAt && <span style={{ marginLeft: '12px', fontSize: '10pt', color: '#6B7280' }}>on {new Date(faculty.acknowledgedAt).toLocaleDateString()}</span>}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Performance Summary */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Performance Summary</h2>
        <div style={{ marginBottom: '20px' }}>
          <div style={styles.metricBox}>
            <div style={styles.metricLabel}>Total Submissions</div>
            <div style={styles.metricValue}>{metrics.totalSubmissions}</div>
          </div>
          <div style={styles.metricBox}>
            <div style={styles.metricLabel}>Overall Average</div>
            <div style={styles.metricValue}>{metrics.overallAverage.toFixed(2)}</div>
            <div style={{ fontSize: '10pt', color: '#6B7280', marginTop: '4px' }}>out of 5.0</div>
          </div>
          <div style={styles.metricBox}>
            <div style={styles.metricLabel}>Department Average</div>
            <div style={styles.metricValue}>{deptMetrics.institutionAverage.toFixed(2)}</div>
            <div style={{ fontSize: '10pt', color: '#6B7280', marginTop: '4px' }}>
              {metrics.overallAverage >= deptMetrics.institutionAverage ? '↑ Above' : '↓ Below'} by {Math.abs(metrics.overallAverage - deptMetrics.institutionAverage).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Criteria Performance */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Criteria Performance Breakdown</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Criterion</th>
              <th style={{ ...styles.th, width: '15%', textAlign: 'center' }}>Average</th>
              <th style={{ ...styles.th, width: '20%', textAlign: 'center' }}>Rating</th>
            </tr>
          </thead>
          <tbody>
            {critData.map((crit, i) => (
              <React.Fragment key={i}>
                <tr style={{ backgroundColor: '#F5E6D3' }}>
                  <td style={{ ...styles.td, fontWeight: 'bold' }}>{crit.name}</td>
                  <td style={{ ...styles.td, textAlign: 'center', fontWeight: 'bold', color: crit.avg >= BENCHMARK ? '#2E8B57' : '#C41E3A' }}>
                    {crit.avg.toFixed(2)}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center', fontWeight: 'bold' }}>
                    {crit.avg >= 4.5 ? 'Excellent' : crit.avg >= BENCHMARK ? 'Good' : crit.avg >= 2 ? 'Needs Improvement' : 'Critical'}
                  </td>
                </tr>
                {crit.subQuestions.map((sq, j) => (
                  <tr key={`${i}-${j}`}>
                    <td style={{ ...styles.td, paddingLeft: '30px', fontSize: '10pt' }}>→ {sq.text}</td>
                    <td style={{ ...styles.td, textAlign: 'center', fontSize: '10pt', color: sq.avg >= BENCHMARK ? '#2E8B57' : '#C41E3A' }}>
                      {sq.avg.toFixed(2)}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center', fontSize: '10pt' }}>
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
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Course Performance</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Course</th>
              <th style={{ ...styles.th, width: '20%', textAlign: 'center' }}>Submissions</th>
              <th style={{ ...styles.th, width: '20%', textAlign: 'center' }}>Average</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(metrics.courseBreakdown).map(([course, data], i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#F8F6F1' : 'white' }}>
                <td style={styles.td}>{course}</td>
                <td style={{ ...styles.td, textAlign: 'center' }}>{data.count}</td>
                <td style={{ ...styles.td, textAlign: 'center', fontWeight: 'bold', color: data.average >= BENCHMARK ? '#2E8B57' : '#C41E3A' }}>
                  {data.average.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Score Distribution */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Score Distribution</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Rating</th>
              <th style={{ ...styles.th, width: '20%', textAlign: 'center' }}>Count</th>
              <th style={{ ...styles.th, width: '20%', textAlign: 'center' }}>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {[5, 4, 3, 2, 1].map((star, i) => {
              const count = metrics.scoreDistribution[star - 1];
              const total = metrics.scoreDistribution.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
              return (
                <tr key={star} style={{ backgroundColor: i % 2 === 0 ? '#F8F6F1' : 'white' }}>
                  <td style={styles.td}>{star} Star{star > 1 ? 's' : ''}</td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>{count}</td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>{pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Student Feedback */}
      {metrics.feedback.length > 0 && (
        <div style={{ ...styles.section, pageBreakBefore: 'always' as any }}>
          <h2 style={styles.sectionTitle}>Student Feedback (PII-Redacted)</h2>
          <p style={{ fontSize: '10pt', color: '#6B7280', fontStyle: 'italic', marginBottom: '15px' }}>
            All personally identifiable information has been automatically redacted to protect student anonymity.
          </p>
          {metrics.feedback.map((fb, i) => (
            <div key={i} style={styles.feedbackItem}>
              <p style={{ margin: '0 0 8px 0', fontSize: '11pt', fontStyle: 'italic' }}>"{fb.feedback}"</p>
              <div style={{ fontSize: '9pt', color: '#6B7280', marginTop: '6px' }}>
                Course: {fb.courseId} • Submitted: {new Date(fb.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>Anonymous Faculty Evaluation System (AFES)</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '9pt' }}>This report contains confidential evaluation data. Handle with appropriate care.</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>Page 1 of 1</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '9pt' }}>Generated: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
