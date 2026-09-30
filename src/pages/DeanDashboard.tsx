import React, { useState, useEffect, useCallback } from 'react';
import { store, BENCHMARK, THRESHOLD } from '../store';
import { useAuth } from '../auth';
import { exportDeanReport } from '../utils/deanReport';
import type { Criterion } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { BarChart3, Users, TrendingUp, Shield, Award, CheckCircle, Download } from 'lucide-react';

const COLORS = ['#002366', '#B87333', '#C41E3A', '#2E8B57', '#6366F1'];
interface DeanDashboardProps { viewingCycleId?: string; }

export default function DeanDashboard({ viewingCycleId }: DeanDashboardProps) {
  const { user } = useAuth();
  const department = user?.department || '';
  const [criteria, setCriteria] = useState<Criterion[]>([]);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3"><div><h2 className="text-2xl font-bold" style={{ color: '#002366' }}>Department Overview</h2><p className="text-sm" style={{ color: '#4B5563' }}>{department} Department • {user?.displayName}</p>{viewingCycle && <p className="text-xs mt-1" style={{ color: '#B87333' }}>Viewing: {viewingCycle.displayName}</p>}</div><div className="flex items-center gap-2"><button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white hover:opacity-90" style={{ backgroundColor: '#2E8B57' }}><Download size={14} />Export Report</button><div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#F5E6D3' }}><Shield size={14} style={{ color: '#B87333' }} /><span className="text-xs font-medium" style={{ color: '#B87333' }}>Aggregated View Only</span></div></div></div>
      <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: '#F5E6D3', border: '1px solid #B87333' }}><Shield size={16} style={{ color: '#B87333' }} /><p className="text-xs"><strong>Privacy Notice:</strong> Only department-level aggregated metrics are shown.</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><div className="flex items-center gap-2 mb-1"><TrendingUp size={16} style={{ color: '#002366' }} /><span className="text-xs font-medium" style={{ color: '#4B5563' }}>Total Submissions</span></div><p className="text-2xl font-bold" style={{ color: '#002366' }}>{deptMetrics.totalSubmissions}</p></div>
        <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><div className="flex items-center gap-2 mb-1"><Award size={16} style={{ color: '#2E8B57' }} /><span className="text-xs font-medium" style={{ color: '#4B5563' }}>Dept Average</span></div><p className="text-2xl font-bold" style={{ color: '#2E8B57' }}>{deptMetrics.institutionAverage.toFixed(2)}</p></div>
        <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><div className="flex items-center gap-2 mb-1"><Users size={16} style={{ color: '#B87333' }} /><span className="text-xs font-medium" style={{ color: '#4B5563' }}>Faculty Count</span></div><p className="text-2xl font-bold" style={{ color: '#B87333' }}>{deptMetrics.totalFaculty}</p></div>
        <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><div className="flex items-center gap-2 mb-1"><CheckCircle size={16} style={{ color: '#C41E3A' }} /><span className="text-xs font-medium" style={{ color: '#4B5563' }}>Acknowledged</span></div><p className="text-2xl font-bold" style={{ color: '#C41E3A' }}>{acknowledged}/{faculty.length}</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#002366' }}><BarChart3 size={16} style={{ color: '#B87333' }} />Department Performance Comparison</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D5D8DC" />
              <XAxis dataKey="dept" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#EDEBE8', border: '1px solid #D5D8DC', borderRadius: '8px' }} />
              <Bar dataKey="submissions" name="Submissions" fill="#002366" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#002366' }}><BarChart3 size={16} style={{ color: '#B87333' }} />Institution Criteria Performance (avg / 10.0)</h3>
          <ResponsiveContainer width="100%" height={220}><BarChart data={institutionCriteriaData} layout="vertical" margin={{ left: 20 }}><CartesianGrid strokeDasharray="3 3" stroke="#D5D8DC" /><XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#1A1A1A' }} width={100} /><Tooltip contentStyle={{ backgroundColor: '#EDEBE8', border: '1px solid #D5D8DC', borderRadius: '8px' }} /><ReferenceLine x={BENCHMARK} stroke="#C41E3A" strokeDasharray="5 5" strokeWidth={2} /><Bar dataKey="score" radius={[0, 4, 4, 0]}>{institutionCriteriaData.map((entry, i) => (<Cell key={i} fill={entry.score >= BENCHMARK ? '#2E8B57' : '#C41E3A'} />))}</Bar></BarChart></ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#002366' }}><CheckCircle size={16} style={{ color: '#B87333' }} />Acknowledgment Compliance</h3>
        <div className="grid grid-cols-3 gap-4 mb-4"><div className="p-3 rounded-lg text-center" style={{ backgroundColor: '#D1FAE5' }}><p className="text-xl font-bold" style={{ color: '#2E8B57' }}>{acknowledged}</p><p className="text-xs" style={{ color: '#2E8B57' }}>Acknowledged</p></div><div className="p-3 rounded-lg text-center" style={{ backgroundColor: '#F5E6D3' }}><p className="text-xl font-bold" style={{ color: '#B87333' }}>{faculty.filter(f => f.acknowledgmentStatus === 'pending_acknowledgment').length}</p><p className="text-xs" style={{ color: '#B87333' }}>Pending Ack.</p></div><div className="p-3 rounded-lg text-center" style={{ backgroundColor: '#FEE2E2' }}><p className="text-xl font-bold" style={{ color: '#C41E3A' }}>{faculty.filter(f => f.acknowledgmentStatus === 'pending_review').length}</p><p className="text-xs" style={{ color: '#C41E3A' }}>Pending Review</p></div></div>
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: '#D5D8DC' }}><div className="h-full flex"><div style={{ width: `${faculty.length > 0 ? (acknowledged / faculty.length) * 100 : 0}%`, backgroundColor: '#2E8B57' }} /><div style={{ width: `${faculty.length > 0 ? (faculty.filter(f => f.acknowledgmentStatus === 'pending_acknowledgment').length / faculty.length) * 100 : 0}%`, backgroundColor: '#B87333' }} /><div style={{ width: `${faculty.length > 0 ? (faculty.filter(f => f.acknowledgmentStatus === 'pending_review').length / faculty.length) * 100 : 0}%`, backgroundColor: '#C41E3A' }} /></div></div>
        <p className="text-xs mt-1 text-right" style={{ color: '#4B5563' }}>{faculty.length > 0 ? Math.round((acknowledged / faculty.length) * 100) : 0}% complete</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#002366' }}><Users size={16} style={{ color: '#B87333' }} />Department Completion Rates</h3>
          <div className="space-y-3">
            {departments.map(dept => {
              const m = store.getDepartmentMetrics(dept, cycleId);
              const completionRate = m.totalFaculty > 0 ? Math.round((m.totalSubmissions / (m.totalFaculty * 10)) * 100) : 0;
              return (
                <div key={dept} className="p-3 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{dept}</span>
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
    </div>
  );
}
