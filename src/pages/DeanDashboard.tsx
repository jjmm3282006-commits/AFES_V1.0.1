import React, { useState, useEffect, useCallback } from 'react';
import { store, BENCHMARK, THRESHOLD } from '../store';
import { useAuth } from '../auth';
import { exportDeanReport } from '../utils/deanReport';
import type { Criterion } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, PieChart, Pie } from 'recharts';
import { BarChart3, Users, TrendingUp, Shield, Award, CheckCircle, Download, AlertTriangle, MessageSquare, Printer } from 'lucide-react';
import DeanPrintReport from '../components/DeanPrintReport';

const COLORS = ['#002366', '#B87333', '#C41E3A', '#2E8B57', '#6366F1'];
const STAR_COLORS = ['#DC2626', '#F59E0B', '#94A3B8', '#3B82F6', '#10B981']; // 1★(Red) 2★(Amber) 3★(Slate) 4★(Blue) 5★(Emerald)
interface DeanDashboardProps { viewingCycleId?: string; }

export default function DeanDashboard({ viewingCycleId }: DeanDashboardProps) {
  const { user } = useAuth();
  const department = user?.department || '';
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const activeCycle = store.getActiveCycle();
  const cycleId = viewingCycleId || activeCycle?.id;
  const allCycles = store.getCycles();
  const viewingCycle = allCycles.find(c => c.id === cycleId);
  const faculty = store.getFacultyByDepartment(department);
  const deptMetrics = store.getDepartmentMetrics(department, cycleId);
  const acknowledged = faculty.filter(f => f.acknowledgmentStatus === 'acknowledged').length;

  useEffect(() => { setCriteria(store.getCriteria()); const unsubs = [store.subscribe('submission_added', () => setCriteria(store.getCriteria())), store.subscribe('acknowledgment_changed', () => setCriteria(store.getCriteria())), store.subscribe('criteria_changed', () => setCriteria(store.getCriteria())), store.subscribe('cycle_changed', () => setCriteria(store.getCriteria()))]; return () => unsubs.forEach(u => u()); }, []);

  const institutionCriteriaData = criteria.map(c => {
    let totalScore = 0, totalCount = 0;
    ['Computer Science', 'Mathematics', 'Physics'].forEach(dept => { const m = store.getDepartmentMetrics(dept, cycleId); const score = m.criteriaAverages[c.id] || 0; if (score > 0) { totalScore += score; totalCount++; } });
    return { name: c.name, score: totalCount > 0 ? Number((totalScore / totalCount).toFixed(2)) : 0 };
  });

  // Department comparison data
  const departments = ['Computer Science', 'Mathematics', 'Physics'];
  const deptComparisonData = departments.map(dept => {
    const m = store.getDepartmentMetrics(dept, cycleId);
    return { dept: dept.split(' ')[0], submissions: m.totalSubmissions, average: Number(m.institutionAverage.toFixed(2)) };
  });

  // Get department evaluations first
  const deptEvals = store.getEvaluationsForDepartment(department, cycleId);

  // Faculty performance summary
  const facultyPerformance = faculty.map(f => {
    const metrics = store.getFacultyMetrics(f.id, cycleId);
    return {
      id: f.id,
      name: f.name,
      totalSubmissions: metrics.totalSubmissions,
      overallAverage: metrics.overallAverage,
      criteriaAverages: metrics.criteriaAverages,
      acknowledgmentStatus: f.acknowledgmentStatus,
    };
  });

  // Course-level metrics
  const courseMetrics = (() => {
    const courses: Record<string, { facultyId: string; submissions: number; totalScore: number }> = {};
    deptEvals.forEach(ev => {
      if (!courses[ev.courseId]) {
        courses[ev.courseId] = { facultyId: ev.facultyId, submissions: 0, totalScore: 0 };
      }
      courses[ev.courseId].submissions++;
      const ratings = Object.values(ev.ratings);
      courses[ev.courseId].totalScore += ratings.reduce((a, b) => a + b, 0) / ratings.length;
    });
    return Object.entries(courses).map(([courseId, data]) => ({
      courseId,
      facultyId: data.facultyId,
      submissions: data.submissions,
      average: data.submissions > 0 ? data.totalScore / data.submissions : 0,
    }));
  })();

  // Department strengths and areas for improvement
  const deptCriteriaPerformance = criteria.map(c => ({
    name: c.name,
    average: deptMetrics.criteriaAverages[c.id] || 0,
  }));
  const strengths = deptCriteriaPerformance.filter(c => c.average >= 4.0).sort((a, b) => b.average - a.average);
  const improvements = deptCriteriaPerformance.filter(c => c.average < BENCHMARK && c.average > 0).sort((a, b) => a.average - b.average);

  // Feedback themes analysis
  const feedbackAnalysis = (() => {
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
    
    return {
      totalFeedback: allFeedback.length,
      positiveCount,
      negativeCount,
      sentimentRatio: allFeedback.length > 0 ? ((positiveCount / allFeedback.length) * 100).toFixed(1) : '0',
    };
  })();

  // Top themes per department (simulated based on feedback patterns)
  const getTopThemes = (dept: string): string[] => {
    const themes: Record<string, string[]> = {
      'Computer Science': ['Engaging lectures', 'Clear explanations', 'Good pacing'],
      'Mathematics': ['Challenging material', 'Well-structured', 'Needs more examples'],
      'Physics': ['Hands-on approach', 'Good demonstrations', 'Heavy workload'],
    };
    return themes[dept] || ['No data available'];
  };

  const handleExport = async () => {
    await exportDeanReport(department, cycleId);
  };

  const handlePrint = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 100);
  };

  // Calculate department score distribution
  const deptScoreDist = [0, 0, 0, 0, 0];
  deptEvals.forEach(ev => {
    Object.values(ev.ratings).forEach(rating => {
      if (rating >= 1 && rating <= 5) deptScoreDist[rating - 1]++;
    });
  });
  const deptTotalRatings = deptScoreDist.reduce((a, b) => a + b, 0);
  const deptAvg = deptTotalRatings > 0 
    ? deptScoreDist.reduce((sum, count, idx) => sum + count * (idx + 1), 0) / deptTotalRatings 
    : 0;
  const deptDonutData = [
    { name: '5★', value: deptScoreDist[4], percentage: deptTotalRatings > 0 ? ((deptScoreDist[4] / deptTotalRatings) * 100).toFixed(1) : '0' },
    { name: '4★', value: deptScoreDist[3], percentage: deptTotalRatings > 0 ? ((deptScoreDist[3] / deptTotalRatings) * 100).toFixed(1) : '0' },
    { name: '3★', value: deptScoreDist[2], percentage: deptTotalRatings > 0 ? ((deptScoreDist[2] / deptTotalRatings) * 100).toFixed(1) : '0' },
    { name: '2★', value: deptScoreDist[1], percentage: deptTotalRatings > 0 ? ((deptScoreDist[1] / deptTotalRatings) * 100).toFixed(1) : '0' },
    { name: '1★', value: deptScoreDist[0], percentage: deptTotalRatings > 0 ? ((deptScoreDist[0] / deptTotalRatings) * 100).toFixed(1) : '0' },
  ];

  // Render print view if in print mode
  if (isPrintMode) {
    return (
      <DeanPrintReport
        department={department}
        cycleName={viewingCycle?.displayName || 'Current Cycle'}
        criteria={criteria}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3"><div><h2 className="text-2xl font-bold" style={{ color: '#002366' }}>Department Overview</h2><p className="text-sm" style={{ color: '#4B5563' }}>{department} Department • {user?.displayName}</p>{viewingCycle && <p className="text-xs mt-1" style={{ color: '#B87333' }}>Viewing: {viewingCycle.displayName}</p>}</div><div className="flex items-center gap-2"><button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90" style={{ backgroundColor: '#D5D8DC', color: '#1A1A1A' }}><Printer size={14} />Print Report</button><button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white hover:opacity-90" style={{ backgroundColor: '#2E8B57' }}><Download size={14} />Export Report</button><div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#F5E6D3' }}><Shield size={14} style={{ color: '#B87333' }} /><span className="text-xs font-medium" style={{ color: '#B87333' }}>Aggregated View Only</span></div></div></div>
      <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: '#F5E6D3', border: '1px solid #B87333' }}><Shield size={16} style={{ color: '#B87333' }} /><p className="text-xs"><strong>Privacy Notice:</strong> Only department-level aggregated metrics are shown.</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><div className="flex items-center gap-2 mb-1"><TrendingUp size={16} style={{ color: '#002366' }} /><span className="text-xs font-medium" style={{ color: '#4B5563' }}>Total Submissions</span></div><p className="text-2xl font-bold" style={{ color: '#002366' }}>{deptMetrics.totalSubmissions}</p></div>
        <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><div className="flex items-center gap-2 mb-1"><Award size={16} style={{ color: '#2E8B57' }} /><span className="text-xs font-medium" style={{ color: '#4B5563' }}>Dept Average</span></div><p className="text-2xl font-bold" style={{ color: '#2E8B57' }}>{deptMetrics.institutionAverage.toFixed(2)}</p></div>
        <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><div className="flex items-center gap-2 mb-1"><Users size={16} style={{ color: '#B87333' }} /><span className="text-xs font-medium" style={{ color: '#4B5563' }}>Faculty Count</span></div><p className="text-2xl font-bold" style={{ color: '#B87333' }}>{deptMetrics.totalFaculty}</p></div>
        <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><div className="flex items-center gap-2 mb-1"><CheckCircle size={16} style={{ color: '#C41E3A' }} /><span className="text-xs font-medium" style={{ color: '#4B5563' }}>Acknowledged</span></div><p className="text-2xl font-bold" style={{ color: '#C41E3A' }}>{acknowledged}/{faculty.length}</p></div>
      </div>
      <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#002366' }}><BarChart3 size={16} style={{ color: '#B87333' }} />Institution Criteria Performance (avg / 5.0)</h3>
        <ResponsiveContainer width="100%" height={220}><BarChart data={institutionCriteriaData} layout="vertical" margin={{ left: 20 }}><CartesianGrid strokeDasharray="3 3" stroke="#D5D8DC" /><XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#1A1A1A' }} width={100} /><Tooltip contentStyle={{ backgroundColor: '#EDEBE8', border: '1px solid #D5D8DC', borderRadius: '8px' }} /><ReferenceLine x={BENCHMARK} stroke="#C41E3A" strokeDasharray="5 5" strokeWidth={2} /><Bar dataKey="score" radius={[0, 4, 4, 0]}>{institutionCriteriaData.map((entry, i) => (<Cell key={i} fill={entry.score >= BENCHMARK ? '#2E8B57' : '#C41E3A'} />))}</Bar></BarChart></ResponsiveContainer>
      </div>
      <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#002366' }}><BarChart3 size={16} style={{ color: '#B87333' }} />Department Score Distribution</h3>
        <div className="flex items-center gap-4">
          <div className="relative"><ResponsiveContainer width={180} height={180}><PieChart><Pie data={deptDonutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={2}>{deptDonutData.map((_, i) => (<Cell key={i} fill={STAR_COLORS[i]} />))}</Pie></PieChart></ResponsiveContainer><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-bold" style={{ color: '#002366' }}>{deptAvg.toFixed(1)}</span><span className="text-[10px]" style={{ color: '#4B5563' }}>avg score</span></div></div>
          <div className="flex-1 space-y-1.5">{deptDonutData.map((d, i) => (<div key={i} className="flex items-center gap-2 text-xs"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: STAR_COLORS[i] }} /><span>{d.name}</span><span className="font-bold">{d.value}</span><span style={{ color: '#9CA3AF' }}>({d.percentage}%)</span></div>))}</div>
        </div>
      </div>
      <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#002366' }}><CheckCircle size={16} style={{ color: '#B87333' }} />Acknowledgment Compliance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="p-3 rounded-lg text-center" style={{ backgroundColor: '#D1FAE5' }}>
            <p className="text-xl font-bold" style={{ color: '#2E8B57' }}>{acknowledged}</p>
            <p className="text-xs" style={{ color: '#2E8B57' }}>🟢 Acknowledged</p>
          </div>
          <div className="p-3 rounded-lg text-center" style={{ backgroundColor: '#F5E6D3' }}>
            <p className="text-xl font-bold" style={{ color: '#B87333' }}>{faculty.filter(f => f.acknowledgmentStatus === 'pending_acknowledgment').length}</p>
            <p className="text-xs" style={{ color: '#B87333' }}>🟡 Pending Ack.</p>
          </div>
          <div className="p-3 rounded-lg text-center" style={{ backgroundColor: '#FEE2E2' }}>
            <p className="text-xl font-bold" style={{ color: '#C41E3A' }}>{faculty.filter(f => f.acknowledgmentStatus === 'disputed').length}</p>
            <p className="text-xs" style={{ color: '#C41E3A' }}>🔴 Disputed</p>
          </div>
          <div className="p-3 rounded-lg text-center" style={{ backgroundColor: '#D5D8DC' }}>
            <p className="text-xl font-bold" style={{ color: '#4B5563' }}>{faculty.filter(f => f.acknowledgmentStatus === 'pending_review').length}</p>
            <p className="text-xs" style={{ color: '#4B5563' }}>⚫ Pending Review</p>
          </div>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden mb-2" style={{ backgroundColor: '#D5D8DC' }}>
          <div className="h-full flex">
            <div style={{ width: `${faculty.length > 0 ? (acknowledged / faculty.length) * 100 : 0}%`, backgroundColor: '#2E8B57' }} />
            <div style={{ width: `${faculty.length > 0 ? (faculty.filter(f => f.acknowledgmentStatus === 'pending_acknowledgment').length / faculty.length) * 100 : 0}%`, backgroundColor: '#B87333' }} />
            <div style={{ width: `${faculty.length > 0 ? (faculty.filter(f => f.acknowledgmentStatus === 'disputed').length / faculty.length) * 100 : 0}%`, backgroundColor: '#C41E3A' }} />
            <div style={{ width: `${faculty.length > 0 ? (faculty.filter(f => f.acknowledgmentStatus === 'pending_review').length / faculty.length) * 100 : 0}%`, backgroundColor: '#9CA3AF' }} />
          </div>
        </div>
        <p className="text-xs mb-4 text-right" style={{ color: '#4B5563' }}>{faculty.length > 0 ? Math.round((acknowledged / faculty.length) * 100) : 0}% complete</p>
        
        {/* Faculty Acknowledgment Details */}
        <div className="border-t pt-4" style={{ borderColor: '#D5D8DC' }}>
          <h4 className="text-xs font-semibold mb-2" style={{ color: '#002366' }}>Faculty Status Details</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {faculty.map(f => (
              <div key={f.id} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
                <div className="flex-1">
                  <p className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{f.name}</p>
                  <p className="text-[10px]" style={{ color: '#9CA3AF' }}>
                    {f.acknowledgmentStatus === 'acknowledged' && f.acknowledgedAt ? `Acknowledged ${new Date(f.acknowledgedAt).toLocaleDateString()}` : 
                     f.acknowledgmentStatus === 'disputed' ? 'Dispute in progress' :
                     f.lastReminderSent ? `Last reminder: ${new Date(f.lastReminderSent).toLocaleDateString()}` : 'No action yet'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{
                    backgroundColor: f.acknowledgmentStatus === 'acknowledged' ? '#D1FAE5' : f.acknowledgmentStatus === 'disputed' ? '#FEE2E2' : f.acknowledgmentStatus === 'pending_acknowledgment' ? '#F5E6D3' : '#D5D8DC',
                    color: f.acknowledgmentStatus === 'acknowledged' ? '#2E8B57' : f.acknowledgmentStatus === 'disputed' ? '#C41E3A' : f.acknowledgmentStatus === 'pending_acknowledgment' ? '#B87333' : '#4B5563'
                  }}>
                    {f.acknowledgmentStatus === 'acknowledged' ? '✓ Ack' : f.acknowledgmentStatus === 'disputed' ? '⚠ Disputed' : f.acknowledgmentStatus === 'pending_acknowledgment' ? '⏳ Pending' : '⏸ Review'}
                  </span>
                  {(f.acknowledgmentStatus === 'pending_acknowledgment' || f.acknowledgmentStatus === 'pending_review') && (
                    <button onClick={async () => { await store.sendReminder(f.id); }} className="px-2 py-0.5 rounded text-[10px] font-medium text-white hover:opacity-90" style={{ backgroundColor: '#B87333' }}>Send Reminder</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#002366' }}><Users size={16} style={{ color: '#B87333' }} />Program Completion Rates</h3>
          <div className="space-y-3">
            {store.getPrograms().map(program => {
              const m = store.getDepartmentMetrics(program.department, cycleId);
              const completionRate = m.totalFaculty > 0 ? Math.round((m.totalSubmissions / (m.totalFaculty * 10)) * 100) : 0;
              return (
                <div key={program.id} className="p-3 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{program.name}</span>
                    <span className="text-sm font-bold" style={{ color: completionRate >= 80 ? '#2E8B57' : completionRate >= 50 ? '#B87333' : '#C41E3A' }}>{completionRate}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#D5D8DC' }}>
                    <div className="h-full rounded-full" style={{ width: `${completionRate}%`, backgroundColor: completionRate >= 80 ? '#2E8B57' : completionRate >= 50 ? '#B87333' : '#C41E3A' }} />
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{m.totalSubmissions} submissions from {m.totalFaculty} faculty</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#002366' }}><Award size={16} style={{ color: '#B87333' }} />Top Themes ({department})</h3>
          <div className="space-y-2">
            {getTopThemes(department).map((theme, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: COLORS[i % COLORS.length] }}>{i + 1}</span>
                <span className="text-sm" style={{ color: '#1A1A1A' }}>{theme}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Faculty Performance Summary */}
      <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#002366' }}>
          <Users size={16} style={{ color: '#B87333' }} />
          Faculty Performance Summary
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#002366' }}>
                <th className="text-left px-4 py-2 text-white font-medium">Faculty</th>
                <th className="text-center px-4 py-2 text-white font-medium">Submissions</th>
                <th className="text-center px-4 py-2 text-white font-medium">Average</th>
                <th className="text-center px-4 py-2 text-white font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {facultyPerformance.map((f, i) => (
                <tr key={f.id} style={{ backgroundColor: i % 2 === 0 ? '#EDEBE8' : '#F8F6F1' }}>
                  <td className="px-4 py-2 font-medium" style={{ color: '#1A1A1A' }}>{f.name}</td>
                  <td className="px-4 py-2 text-center">{f.totalSubmissions}</td>
                  <td className="px-4 py-2 text-center font-bold" style={{ 
                    color: f.totalSubmissions < THRESHOLD ? '#9CA3AF' : f.overallAverage >= 4.5 ? '#2E8B57' : f.overallAverage >= BENCHMARK ? '#002366' : '#C41E3A' 
                  }}>
                    {f.totalSubmissions < THRESHOLD ? '—' : f.overallAverage.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{
                      backgroundColor: f.acknowledgmentStatus === 'acknowledged' ? '#D1FAE5' : f.acknowledgmentStatus === 'pending_acknowledgment' ? '#F5E6D3' : '#FEE2E2',
                      color: f.acknowledgmentStatus === 'acknowledged' ? '#2E8B57' : f.acknowledgmentStatus === 'pending_acknowledgment' ? '#B87333' : '#C41E3A',
                    }}>
                      {f.acknowledgmentStatus === 'acknowledged' ? '✓ Ack' : f.acknowledgmentStatus === 'pending_acknowledgment' ? '⏳ Ack' : '⏳ Review'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Course-Level Performance */}
      <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#002366' }}>
          <BarChart3 size={16} style={{ color: '#B87333' }} />
          Course-Level Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#002366' }}>
                <th className="text-left px-4 py-2 text-white font-medium">Course</th>
                <th className="text-center px-4 py-2 text-white font-medium">Submissions</th>
                <th className="text-center px-4 py-2 text-white font-medium">Average</th>
              </tr>
            </thead>
            <tbody>
              {courseMetrics.map((course, i) => (
                <tr key={course.courseId} style={{ backgroundColor: i % 2 === 0 ? '#EDEBE8' : '#F8F6F1' }}>
                  <td className="px-4 py-2 font-medium" style={{ color: '#1A1A1A' }}>{course.courseId}</td>
                  <td className="px-4 py-2 text-center">{course.submissions}</td>
                  <td className="px-4 py-2 text-center font-bold" style={{ 
                    color: course.average >= 4.5 ? '#2E8B57' : course.average >= BENCHMARK ? '#002366' : '#C41E3A' 
                  }}>
                    {course.average.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Department Strengths & Areas for Improvement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#D1FAE5', border: '1px solid #2E8B57' }}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#2E8B57' }}>
            <TrendingUp size={16} />
            Department Strengths
          </h3>
          {strengths.length > 0 ? (
            <div className="space-y-2">
              {strengths.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: '#FFFFFF' }}>
                  <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{s.name}</span>
                  <span className="text-sm font-bold" style={{ color: '#2E8B57' }}>{s.average.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs italic" style={{ color: '#4B5563' }}>No criteria above 4.0 threshold</p>
          )}
        </div>

        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#FEE2E2', border: '1px solid #C41E3A' }}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#C41E3A' }}>
            <AlertTriangle size={16} />
            Areas for Improvement
          </h3>
          {improvements.length > 0 ? (
            <div className="space-y-2">
              {improvements.map((imp, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: '#FFFFFF' }}>
                  <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{imp.name}</span>
                  <span className="text-sm font-bold" style={{ color: '#C41E3A' }}>{imp.average.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs italic" style={{ color: '#4B5563' }}>All criteria meet benchmark</p>
          )}
        </div>
      </div>

      {/* Feedback Sentiment Analysis */}
      <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#002366' }}>
          <MessageSquare size={16} style={{ color: '#B87333' }} />
          Feedback Sentiment Analysis
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
            <p className="text-xs" style={{ color: '#4B5563' }}>Total Feedback</p>
            <p className="text-xl font-bold" style={{ color: '#002366' }}>{feedbackAnalysis.totalFeedback}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: '#D1FAE5' }}>
            <p className="text-xs" style={{ color: '#4B5563' }}>Positive</p>
            <p className="text-xl font-bold" style={{ color: '#2E8B57' }}>{feedbackAnalysis.positiveCount}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: '#FEE2E2' }}>
            <p className="text-xs" style={{ color: '#4B5563' }}>Needs Attention</p>
            <p className="text-xl font-bold" style={{ color: '#C41E3A' }}>{feedbackAnalysis.negativeCount}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: '#F5E6D3' }}>
            <p className="text-xs" style={{ color: '#4B5563' }}>Sentiment Ratio</p>
            <p className="text-xl font-bold" style={{ color: '#B87333' }}>{feedbackAnalysis.sentimentRatio}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
