import React, { useState, useEffect, useCallback } from 'react';
import { store, BENCHMARK, THRESHOLD } from '../store';
import { exportFacultyReport } from '../utils/excel';
import ConfirmDialog from '../components/ConfirmDialog';
import type { Faculty, EvaluationCycle, Criterion, AuditLogEntry, SubQuestion, TrainingRecommendation } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { LayoutDashboard, Users, Calendar, ListChecks, ScrollText, Plus, Trash2, Search, AlertTriangle, CheckCircle, TrendingUp, Shield, FileSpreadsheet, GraduationCap, Edit3, Sparkles, Download, BarChart3 } from 'lucide-react';

const PIE_COLORS = ['#2E8B57', '#002366', '#B87333', '#C41E3A'];

type Tab = 'overview' | 'faculty' | 'cycles' | 'criteria' | 'tna' | 'audit';
interface AdminDashboardProps { viewingCycleId?: string; }

export default function AdminDashboard({ viewingCycleId }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [trainingRecs, setTrainingRecs] = useState<TrainingRecommendation[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCycleName, setNewCycleName] = useState('');
  const [newCycleDisplayName, setNewCycleDisplayName] = useState('');
  const [newCycleStart, setNewCycleStart] = useState('');
  const [newCycleEnd, setNewCycleEnd] = useState('');
  const [newCriterionName, setNewCriterionName] = useState('');
  const [newSubQs, setNewSubQs] = useState<Record<string, string>>({});
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(new Set());
  const [editingRec, setEditingRec] = useState<string | null>(null);
  const [editRecText, setEditRecText] = useState('');
  const [editingSubQ, setEditingSubQ] = useState<string | null>(null);
  const [editSubQText, setEditSubQText] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; type: 'danger' | 'warning' | 'info'; title: string; message: string; onConfirm: () => void }>({ open: false, type: 'warning', title: '', message: '', onConfirm: () => {} });

  const activeCycle = cycles.find(c => c.status === 'active');
  const cycleId = viewingCycleId || activeCycle?.id;

  const loadData = useCallback(() => { setFaculty(store.getFaculty()); setCycles(store.getCycles()); setCriteria(store.getCriteria()); setAuditLog(store.getAuditLog()); setTrainingRecs(store.getTrainingRecommendations()); }, []);
  useEffect(() => { loadData(); const unsubs = [store.subscribe('criteria_changed', loadData), store.subscribe('cycle_changed', loadData), store.subscribe('submission_added', loadData), store.subscribe('acknowledgment_changed', loadData), store.subscribe('training_changed', loadData)]; return () => unsubs.forEach(u => u()); }, [loadData]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [{ id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> }, { id: 'faculty', label: 'Faculty', icon: <Users size={16} /> }, { id: 'cycles', label: 'Cycles', icon: <Calendar size={16} /> }, { id: 'criteria', label: 'Criteria', icon: <ListChecks size={16} /> }, { id: 'tna', label: 'TNA', icon: <GraduationCap size={16} /> }, { id: 'audit', label: 'Audit Log', icon: <ScrollText size={16} /> }];

  const facultyWithMetrics = faculty.filter(f => store.getFacultyMetrics(f.id, cycleId).totalSubmissions >= THRESHOLD);
  const flaggedFaculty = facultyWithMetrics.filter(f => store.getFacultyMetrics(f.id, cycleId).overallAverage < BENCHMARK);
  const acknowledgedCount = faculty.filter(f => f.acknowledgmentStatus === 'acknowledged').length;
  const topRated = [...facultyWithMetrics].sort((a, b) => store.getFacultyMetrics(b.id, cycleId).overallAverage - store.getFacultyMetrics(a.id, cycleId).overallAverage).slice(0, 3);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [generatingAI, setGeneratingAI] = useState(false);

  const generateAISummary = async () => {
    setGeneratingAI(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const totalSubs = store.getEvaluations().filter(e => e.cycleId === cycleId).length;
    const deptGroups: Record<string, number> = {};
    faculty.forEach(f => { const m = store.getFacultyMetrics(f.id, cycleId); deptGroups[f.department] = (deptGroups[f.department] || 0) + m.totalSubmissions; });
    const topDept = Object.entries(deptGroups).sort((a, b) => b[1] - a[1])[0];
    const summary = `System Status: ${totalSubs} evaluations across ${faculty.length} faculty. ${facultyWithMetrics.length} have sufficient data (${THRESHOLD}+ submissions). ${flaggedFaculty.length} faculty below benchmark (${BENCHMARK.toFixed(1)}). ${acknowledgedCount} acknowledged, ${faculty.length - acknowledgedCount} pending. ${topDept?.[0] || 'N/A'} leads with ${topDept?.[1] || 0} submissions.`;
    setAiSummary(summary);
    setGeneratingAI(false);
  };

  // Calculate institution-wide score distribution
  const allEvals = store.getEvaluations().filter(e => e.cycleId === cycleId);
  const institutionScoreDist = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  allEvals.forEach(ev => {
    Object.values(ev.ratings).forEach(rating => {
      if (rating >= 1 && rating <= 10) institutionScoreDist[rating - 1]++;
    });
  });
  const institutionTotalRatings = institutionScoreDist.reduce((a, b) => a + b, 0);
  const institutionAvg = institutionTotalRatings > 0 
    ? institutionScoreDist.reduce((sum, count, idx) => sum + count * (idx + 1), 0) / institutionTotalRatings 
    : 0;
  const institutionDonutData = [
    { name: '9-10', value: institutionScoreDist[8] + institutionScoreDist[9], percentage: institutionTotalRatings > 0 ? (((institutionScoreDist[8] + institutionScoreDist[9]) / institutionTotalRatings) * 100).toFixed(1) : '0' },
    { name: '6-8', value: institutionScoreDist[5] + institutionScoreDist[6] + institutionScoreDist[7], percentage: institutionTotalRatings > 0 ? (((institutionScoreDist[5] + institutionScoreDist[6] + institutionScoreDist[7]) / institutionTotalRatings) * 100).toFixed(1) : '0' },
    { name: '4-5', value: institutionScoreDist[3] + institutionScoreDist[4], percentage: institutionTotalRatings > 0 ? (((institutionScoreDist[3] + institutionScoreDist[4]) / institutionTotalRatings) * 100).toFixed(1) : '0' },
    { name: '1-3', value: institutionScoreDist[0] + institutionScoreDist[1] + institutionScoreDist[2], percentage: institutionTotalRatings > 0 ? (((institutionScoreDist[0] + institutionScoreDist[1] + institutionScoreDist[2]) / institutionTotalRatings) * 100).toFixed(1) : '0' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ backgroundColor: '#EDEBE8' }}>{tabs.map(tab => (<button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedFaculty(null); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap" style={{ backgroundColor: activeTab === tab.id ? '#002366' : 'transparent', color: activeTab === tab.id ? '#FFFFFF' : '#1A1A1A' }}>{tab.icon}{tab.label}</button>))}</div>
      
      {activeTab === 'overview' && !selectedFaculty && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><p className="text-xs font-medium mb-1" style={{ color: '#4B5563' }}>Total Submissions</p><p className="text-2xl font-bold" style={{ color: '#002366' }}>{store.getEvaluations().filter(e => e.cycleId === cycleId).length}</p></div>
            <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><p className="text-xs font-medium mb-1" style={{ color: '#4B5563' }}>Faculty</p><p className="text-2xl font-bold" style={{ color: '#B87333' }}>{faculty.length}</p></div>
            <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><p className="text-xs font-medium mb-1" style={{ color: '#4B5563' }}>Acknowledged</p><p className="text-2xl font-bold" style={{ color: '#2E8B57' }}>{acknowledgedCount}/{faculty.length}</p></div>
            <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><p className="text-xs font-medium mb-1" style={{ color: '#4B5563' }}>Below Benchmark</p><p className="text-2xl font-bold" style={{ color: '#C41E3A' }}>{flaggedFaculty.length}</p></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#002366' }}>Completion by Department</h3>
              <div className="space-y-3">
                {['Computer Science', 'Mathematics', 'Physics'].map(dept => {
                  const deptFaculty = faculty.filter(f => f.department === dept);
                  const totalSubs = deptFaculty.reduce((sum, f) => sum + store.getFacultyMetrics(f.id, cycleId).totalSubmissions, 0);
                  const completionRate = deptFaculty.length > 0 ? Math.round((totalSubs / (deptFaculty.length * 10)) * 100) : 0;
                  return (
                    <div key={dept} className="p-3 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{dept}</span>
                        <span className="text-sm font-bold" style={{ color: completionRate >= 80 ? '#2E8B57' : completionRate >= 50 ? '#B87333' : '#C41E3A' }}>{completionRate}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#D5D8DC' }}>
                        <div className="h-full rounded-full" style={{ width: `${completionRate}%`, backgroundColor: completionRate >= 80 ? '#2E8B57' : completionRate >= 50 ? '#B87333' : '#C41E3A' }} />
                      </div>
                      <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{totalSubs} submissions from {deptFaculty.length} faculty</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#002366' }}>Top Rated Faculty</h3>
              <div className="space-y-2">
                {topRated.map((f, i) => {
                  const m = store.getFacultyMetrics(f.id, cycleId);
                  return (
                    <div key={f.id} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: ['#002366', '#B87333', '#C41E3A'][i] }}>{i + 1}</span>
                        <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{f.name}</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: '#2E8B57' }}>{m.overallAverage.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#002366' }}><BarChart3 size={16} style={{ color: '#B87333' }} />Institution Score Distribution</h3>
            <div className="flex items-center gap-4">
              <div className="relative"><ResponsiveContainer width={180} height={180}><PieChart><Pie data={institutionDonutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={2}>{institutionDonutData.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i]} />))}</Pie></PieChart></ResponsiveContainer><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-bold" style={{ color: '#002366' }}>{institutionAvg.toFixed(1)}</span><span className="text-[10px]" style={{ color: '#4B5563' }}>avg score</span></div></div>
              <div className="flex-1 space-y-1.5">{institutionDonutData.map((d, i) => (<div key={i} className="flex items-center gap-2 text-xs"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PIE_COLORS[i] }} /><span>{d.name}</span><span className="font-bold">{d.value}</span><span style={{ color: '#9CA3AF' }}>({d.percentage}%)</span></div>))}</div>
            </div>
          </div>
          {flaggedFaculty.length > 0 && (<div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#FEE2E2', border: '1px solid #C41E3A' }}><h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#C41E3A' }}><AlertTriangle size={16} />Below Benchmark (Average &lt; {BENCHMARK.toFixed(1)})</h3><div className="space-y-2">{flaggedFaculty.map(f => { const m = store.getFacultyMetrics(f.id, cycleId); return (<div key={f.id} className="flex items-center justify-between p-2 rounded-lg bg-white/50"><span className="text-sm">{f.name} ({f.department})</span><span className="text-sm font-bold" style={{ color: '#C41E3A' }}>{m.overallAverage.toFixed(2)}</span></div>); })}</div></div>)}
          <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#F8F6F1' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#002366' }}><TrendingUp size={16} style={{ color: '#B87333' }} />AI System Summary</h3>
              <button onClick={generateAISummary} disabled={generatingAI} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: '#B87333' }}>{generatingAI ? 'Analyzing...' : 'Generate'}</button>
            </div>
            {aiSummary && <p className="text-sm leading-relaxed" style={{ color: '#1A1A1A' }}>{aiSummary}</p>}
            {!aiSummary && !generatingAI && <p className="text-sm italic" style={{ color: '#9CA3AF' }}>Click "Generate" for AI-powered system insights.</p>}
            {generatingAI && <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: '#002366', borderTopColor: 'transparent' }} /><span className="text-sm" style={{ color: '#4B5563' }}>Analyzing...</span></div>}
          </div>
        </div>
      )}

      {activeTab === 'faculty' && !selectedFaculty && (
        <div className="space-y-4">
          <div className="relative max-w-md"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} /><input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search faculty..." className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none" style={{ backgroundColor: '#F8F6F1', borderColor: '#D5D8DC' }} /></div>
          <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: '#EDEBE8' }}><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr style={{ backgroundColor: '#002366' }}><th className="text-left px-4 py-3 text-white font-medium">Name</th><th className="text-left px-4 py-3 text-white font-medium">Dept</th><th className="text-center px-4 py-3 text-white font-medium">Avg</th><th className="text-center px-4 py-3 text-white font-medium">Actions</th></tr></thead><tbody>{faculty.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).map((f, i) => { const m = store.getFacultyMetrics(f.id, cycleId); const belowThreshold = m.totalSubmissions < THRESHOLD; return (<tr key={f.id} style={{ backgroundColor: i % 2 === 0 ? '#EDEBE8' : '#F8F6F1' }}><td className="px-4 py-3 font-medium">{f.name}</td><td className="px-4 py-3 text-xs" style={{ color: '#4B5563' }}>{f.department}</td><td className="px-4 py-3 text-center font-bold" style={{ color: belowThreshold ? '#9CA3AF' : m.overallAverage >= 8 ? '#2E8B57' : m.overallAverage < BENCHMARK ? '#C41E3A' : '#1A1A1A' }}>{belowThreshold ? '—' : m.overallAverage.toFixed(2)}</td><td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-1"><button onClick={() => setSelectedFaculty(f)} className="px-2 py-1 rounded text-xs font-medium text-white hover:opacity-80" style={{ backgroundColor: '#002366' }}>View</button><button onClick={() => exportFacultyReport(f.id, cycleId)} className="px-2 py-1 rounded text-xs text-white hover:opacity-80" style={{ backgroundColor: '#2E8B57' }}><FileSpreadsheet size={12} /></button></div></td></tr>); })}</tbody></table></div></div>
        </div>
      )}

      {activeTab === 'cycles' && (
        <div className="space-y-6">
          <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: '#002366' }}><Plus size={16} style={{ color: '#B87333' }} />Create New Cycle</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3"><input type="text" value={newCycleName} onChange={e => setNewCycleName(e.target.value)} placeholder="Internal name" className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ backgroundColor: '#F8F6F1', borderColor: '#D5D8DC' }} /><input type="text" value={newCycleDisplayName} onChange={e => setNewCycleDisplayName(e.target.value)} placeholder="Display name" className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ backgroundColor: '#F8F6F1', borderColor: '#D5D8DC' }} /><input type="date" value={newCycleStart} onChange={e => setNewCycleStart(e.target.value)} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ backgroundColor: '#F8F6F1', borderColor: '#D5D8DC' }} /><input type="date" value={newCycleEnd} onChange={e => setNewCycleEnd(e.target.value)} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ backgroundColor: '#F8F6F1', borderColor: '#D5D8DC' }} /></div><button onClick={async () => { if (newCycleName && newCycleDisplayName && newCycleStart && newCycleEnd) { await store.addCycle({ name: newCycleName, displayName: newCycleDisplayName, startDate: newCycleStart, endDate: newCycleEnd, status: 'upcoming' }); setNewCycleName(''); setNewCycleDisplayName(''); setNewCycleStart(''); setNewCycleEnd(''); } }} className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90" style={{ backgroundColor: '#002366' }}>Create Cycle</button></div>
          <div className="space-y-3">{cycles.map(cycle => (<div key={cycle.id} className="rounded-xl p-4 shadow-sm flex items-center justify-between flex-wrap gap-2" style={{ backgroundColor: '#EDEBE8' }}><div><p className="font-semibold text-sm" style={{ color: '#002366' }}>{cycle.displayName}</p><p className="text-xs" style={{ color: '#4B5563' }}>{cycle.startDate} — {cycle.endDate}</p></div><div className="flex items-center gap-2 flex-wrap"><span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: cycle.status === 'active' ? '#D1FAE5' : cycle.status === 'upcoming' ? '#F5E6D3' : '#D5D8DC', color: cycle.status === 'active' ? '#2E8B57' : cycle.status === 'upcoming' ? '#B87333' : '#4B5563' }}>{cycle.status}</span>{cycle.status !== 'active' && cycle.status !== 'archived' && <button onClick={() => store.activateCycle(cycle.id)} className="px-3 py-1 rounded text-xs font-medium text-white hover:opacity-90" style={{ backgroundColor: '#2E8B57' }}>Activate</button>}<button onClick={() => setConfirmDialog({ open: true, type: 'danger', title: 'Remove Cycle', message: `Remove "${cycle.displayName}"?`, onConfirm: async () => { await store.removeCycle(cycle.id); setConfirmDialog(prev => ({ ...prev, open: false })); } })} className="px-2 py-1 rounded text-xs text-white hover:opacity-90" style={{ backgroundColor: '#C41E3A' }}><Trash2 size={12} /></button></div></div>))}</div>
        </div>
      )}

      {activeTab === 'criteria' && (
        <div className="space-y-6">
          <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: '#002366' }}><Plus size={16} style={{ color: '#B87333' }} />Add New Criterion</h3><div className="flex gap-3"><input type="text" value={newCriterionName} onChange={e => setNewCriterionName(e.target.value)} placeholder="Criterion name" className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none" style={{ backgroundColor: '#F8F6F1', borderColor: '#D5D8DC' }} /><button onClick={async () => { if (newCriterionName) { await store.addCriterion(newCriterionName); setNewCriterionName(''); } }} className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90" style={{ backgroundColor: '#002366' }}>Add</button></div></div>
          <div className="space-y-3">{criteria.map(crit => { const subQs = store.getSubQuestionsForCriterion(crit.id); const isExpanded = expandedCriteria.has(crit.id); return (<div key={crit.id} className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: '#EDEBE8' }}><div className="p-4 flex items-center justify-between"><div className="flex items-center gap-3"><span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#002366' }}>{crit.order}</span><div><span className="text-sm font-semibold">{crit.name}</span><p className="text-xs" style={{ color: '#9CA3AF' }}>{subQs.length} sub-questions</p></div></div><div className="flex items-center gap-2"><button onClick={() => setExpandedCriteria(prev => { const n = new Set(prev); if (n.has(crit.id)) n.delete(crit.id); else n.add(crit.id); return n; })} className="px-2 py-1 rounded text-xs font-medium hover:opacity-80" style={{ backgroundColor: '#F5E6D3', color: '#B87333' }}>{isExpanded ? 'Hide' : 'Manage'} Sub-Qs</button><button onClick={() => setConfirmDialog({ open: true, type: 'warning', title: 'Remove Criterion', message: `Remove "${crit.name}" and ${subQs.length} sub-questions?`, onConfirm: async () => { await store.removeCriterion(crit.id); setConfirmDialog(prev => ({ ...prev, open: false })); } })} className="px-2 py-1 rounded text-xs text-white hover:opacity-90" style={{ backgroundColor: '#C41E3A' }}><Trash2 size={12} /></button></div></div>{isExpanded && (<div className="px-4 pb-4 border-t" style={{ borderColor: '#D5D8DC' }}><div className="mt-3 space-y-2">{subQs.map(sq => { const isEditing = editingSubQ === sq.id; return (<div key={sq.id} className="p-2.5 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}><div className="flex items-center gap-2"><span className="text-xs font-bold w-6 text-center flex-shrink-0" style={{ color: '#B87333' }}>{sq.order}.</span>{isEditing ? (<div className="flex-1 flex gap-2"><input type="text" value={editSubQText} onChange={e => setEditSubQText(e.target.value)} className="flex-1 px-2 py-1 rounded border text-xs outline-none" style={{ backgroundColor: '#FFFFFF', borderColor: '#D5D8DC' }} autoFocus /><button onClick={async () => { const text = editSubQText.trim(); if (text) { await store.updateSubQuestion(sq.id, text); setEditingSubQ(null); setEditSubQText(''); } }} className="px-2 py-1 rounded text-xs font-medium text-white hover:opacity-90" style={{ backgroundColor: '#2E8B57' }}>Save</button><button onClick={() => { setEditingSubQ(null); setEditSubQText(''); }} className="px-2 py-1 rounded text-xs hover:opacity-90" style={{ backgroundColor: '#D5D8DC' }}>Cancel</button></div>) : (<><span className="text-xs flex-1">{sq.text}</span><div className="flex gap-1 flex-shrink-0"><button onClick={() => { setEditingSubQ(sq.id); setEditSubQText(sq.text); }} className="px-2 py-1 rounded text-xs text-white hover:opacity-90" style={{ backgroundColor: '#002366' }}><Edit3 size={10} /></button><button onClick={() => store.removeSubQuestion(sq.id)} className="px-2 py-1 rounded text-xs text-white hover:opacity-90" style={{ backgroundColor: '#C41E3A' }}><Trash2 size={10} /></button></div></>)}</div></div>); })}</div><div className="mt-3 flex gap-2"><input type="text" value={newSubQs[crit.id] || ''} onChange={e => setNewSubQs(prev => ({ ...prev, [crit.id]: e.target.value }))} placeholder="New sub-question text..." className="flex-1 px-3 py-2 rounded-lg border text-xs outline-none" style={{ backgroundColor: '#F8F6F1', borderColor: '#D5D8DC' }} /><button onClick={async () => { const text = newSubQs[crit.id]?.trim(); if (text) { await store.addSubQuestion(crit.id, text); setNewSubQs(prev => ({ ...prev, [crit.id]: '' })); } }} className="px-3 py-2 rounded-lg text-xs font-medium text-white hover:opacity-90" style={{ backgroundColor: '#002366' }}><Plus size={12} />Add</button></div></div>)}</div>); })}</div>
        </div>
      )}

      {activeTab === 'tna' && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold" style={{ color: '#002366' }}>Training Needs Analysis</h3>
          <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: '#F5E6D3', border: '1px solid #B87333' }}><Sparkles size={16} style={{ color: '#B87333' }} /><p className="text-xs"><strong>AI-Powered:</strong> Recommendations are generated based on evaluation data. Admins can edit any recommendation.</p></div>
          <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#002366' }}><AlertTriangle size={16} style={{ color: '#C41E3A' }} />Faculty Below Benchmark (Average &lt; {BENCHMARK.toFixed(1)})</h4><div className="space-y-4">{faculty.filter(f => { const m = store.getFacultyMetrics(f.id, cycleId); return m.totalSubmissions >= THRESHOLD && Object.values(m.criteriaAverages).some(v => v < BENCHMARK && v > 0); }).map(f => { const m = store.getFacultyMetrics(f.id, cycleId); const rec = trainingRecs.find(r => r.facultyId === f.id && r.cycleId === cycleId); const isEditing = editingRec === rec?.id; return (<div key={f.id} className="p-4 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}><div className="flex items-center justify-between mb-2"><p className="font-semibold text-sm" style={{ color: '#002366' }}>{f.name}</p><span className="text-xs font-bold" style={{ color: '#C41E3A' }}>Overall: {m.overallAverage.toFixed(2)}</span></div>{rec ? (<div><div className="flex items-center justify-between mb-1"><span className="text-xs font-medium" style={{ color: rec.editedByAdmin ? '#B87333' : '#2E8B57' }}>{rec.editedByAdmin ? '✎ Admin-Edited' : '✦ AI-Generated'}</span><div className="flex items-center gap-1"><button onClick={() => { if (isEditing) { store.updateTrainingRecommendation(rec.id, editRecText); setEditingRec(null); } else { setEditingRec(rec.id); setEditRecText(rec.recommendation); } }} className="px-2 py-1 rounded text-xs font-medium text-white hover:opacity-90" style={{ backgroundColor: '#002366' }}><Edit3 size={10} className="inline mr-1" />{isEditing ? 'Save' : 'Edit'}</button>{isEditing && <button onClick={() => setEditingRec(null)} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: '#D5D8DC' }}>Cancel</button>}<button onClick={() => store.deleteTrainingRecommendation(rec.id)} className="px-2 py-1 rounded text-xs text-white hover:opacity-90" style={{ backgroundColor: '#C41E3A' }}><Trash2 size={10} /></button></div></div>{isEditing ? (<textarea value={editRecText} onChange={e => setEditRecText(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-xs outline-none resize-none" style={{ backgroundColor: '#FFFFFF', borderColor: '#D5D8DC' }} rows={6} />) : (<div className="p-3 rounded-lg text-xs leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: '#FFFFFF', border: '1px solid #D5D8DC' }}>{rec.recommendation}</div>)}</div>) : (<button onClick={async () => { await store.generateTrainingRecommendation(f.id, cycleId); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white hover:opacity-90" style={{ backgroundColor: '#B87333' }}><Sparkles size={12} />Generate AI Recommendation</button>)}</div>); })}{faculty.filter(f => { const m = store.getFacultyMetrics(f.id, cycleId); return m.totalSubmissions >= THRESHOLD && Object.values(m.criteriaAverages).some(v => v < BENCHMARK && v > 0); }).length === 0 && (<p className="text-sm italic" style={{ color: '#9CA3AF' }}>No faculty currently below benchmark.</p>)}</div></div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: '#EDEBE8' }}><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr style={{ backgroundColor: '#002366' }}><th className="text-left px-4 py-3 text-white font-medium">Timestamp</th><th className="text-left px-4 py-3 text-white font-medium">Actor</th><th className="text-left px-4 py-3 text-white font-medium">Action</th><th className="text-left px-4 py-3 text-white font-medium">Details</th></tr></thead><tbody>{auditLog.slice(0, 100).map((entry, i) => (<tr key={entry.id} style={{ backgroundColor: i % 2 === 0 ? '#EDEBE8' : '#F8F6F1' }}><td className="px-4 py-2 text-xs" style={{ color: '#4B5563' }}>{new Date(entry.timestamp).toLocaleString()}</td><td className="px-4 py-2 text-xs font-medium">{entry.actor}</td><td className="px-4 py-2"><span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: entry.action.includes('login') ? '#DBEAFE' : entry.action.includes('submission') ? '#D1FAE5' : '#F5E6D3', color: entry.action.includes('login') ? '#002366' : entry.action.includes('submission') ? '#2E8B57' : '#B87333' }}>{entry.action}</span></td><td className="px-4 py-2 text-xs" style={{ color: '#4B5563', maxWidth: '400px' }}>{entry.details || '—'}</td></tr>))}</tbody></table></div></div>
      )}

      <ConfirmDialog isOpen={confirmDialog.open} title={confirmDialog.title} message={confirmDialog.message} type={confirmDialog.type} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))} />
    </div>
  );
}
