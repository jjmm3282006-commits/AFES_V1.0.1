import React, { useState, useEffect } from 'react';
import { store, BENCHMARK, THRESHOLD } from '../store';
import type { Faculty, EvaluationCycle, Criterion } from '../types';
import Layout from '../components/Layout';

interface AdminDashboardProps {
  viewingCycleId?: string;
  onViewingCycleChange?: (cycleId: string) => void;
}

export default function AdminDashboard({ viewingCycleId, onViewingCycleChange }: AdminDashboardProps) {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'faculty' | 'cycles' | 'criteria'>('overview');

  const cycleId = viewingCycleId || store.getActiveCycle()?.id;

  useEffect(() => {
    const loadData = () => {
      setFaculty(store.getFaculty());
      setCycles(store.getCycles());
      setCriteria(store.getCriteria());
    };
    loadData();
    const unsubs = [
      store.subscribe('criteria_changed', loadData),
      store.subscribe('cycle_changed', loadData),
      store.subscribe('submission_added', loadData),
      store.subscribe('acknowledgment_changed', loadData),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const totalEvaluations = store.getEvaluations().filter(e => e.cycleId === cycleId).length;
  const acknowledgedCount = faculty.filter(f => f.acknowledgmentStatus === 'acknowledged').length;

  return (
    <Layout viewingCycleId={viewingCycleId} onViewingCycleChange={onViewingCycleChange}>
      <div className="space-y-6">
        <div className="flex gap-2 p-1 rounded-xl" style={{ backgroundColor: '#EDEBE8' }}>
          {(['overview', 'faculty', 'cycles', 'criteria'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-lg text-sm font-medium capitalize"
              style={{
                backgroundColor: activeTab === tab ? '#002366' : 'transparent',
                color: activeTab === tab ? '#FFFFFF' : '#1A1A1A',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl" style={{ backgroundColor: '#EDEBE8' }}>
                <p className="text-xs mb-1" style={{ color: '#4B5563' }}>Total Submissions</p>
                <p className="text-2xl font-bold" style={{ color: '#002366' }}>{totalEvaluations}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: '#EDEBE8' }}>
                <p className="text-xs mb-1" style={{ color: '#4B5563' }}>Faculty</p>
                <p className="text-2xl font-bold" style={{ color: '#B87333' }}>{faculty.length}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: '#EDEBE8' }}>
                <p className="text-xs mb-1" style={{ color: '#4B5563' }}>Acknowledged</p>
                <p className="text-2xl font-bold" style={{ color: '#2E8B57' }}>{acknowledgedCount}/{faculty.length}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: '#EDEBE8' }}>
                <p className="text-xs mb-1" style={{ color: '#4B5563' }}>Criteria</p>
                <p className="text-2xl font-bold" style={{ color: '#002366' }}>{criteria.length}</p>
              </div>
            </div>

            <div className="p-5 rounded-xl" style={{ backgroundColor: '#EDEBE8' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#002366' }}>Completion by Program</h3>
              <div className="space-y-3">
                {store.getPrograms().map(program => {
                  const programFaculty = faculty.filter(f => f.department === program.department);
                  const totalSubs = programFaculty.reduce((sum, f) => sum + store.getFacultyMetrics(f.id, cycleId).totalSubmissions, 0);
                  const facultyWithThreshold = programFaculty.filter(f => store.getFacultyMetrics(f.id, cycleId).totalSubmissions >= THRESHOLD).length;
                  const completionRate = programFaculty.length > 0 ? Math.round((facultyWithThreshold / programFaculty.length) * 100) : 0;
                  return (
                    <div key={program.id} className="p-3 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{program.name}</span>
                        <span className="text-sm font-bold" style={{ color: completionRate >= 80 ? '#2E8B57' : completionRate >= 50 ? '#B87333' : '#C41E3A' }}>
                          {completionRate}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#D5D8DC' }}>
                        <div className="h-full rounded-full" style={{ width: `${completionRate}%`, backgroundColor: completionRate >= 80 ? '#2E8B57' : completionRate >= 50 ? '#B87333' : '#C41E3A' }} />
                      </div>
                      <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                        {facultyWithThreshold}/{programFaculty.length} faculty met threshold ({totalSubs} total submissions)
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'faculty' && (
          <div className="rounded-xl p-5" style={{ backgroundColor: '#EDEBE8' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#002366' }}>Faculty List</h3>
            <div className="space-y-2">
              {faculty.map(f => {
                const m = store.getFacultyMetrics(f.id, cycleId);
                const belowThreshold = m.totalSubmissions < THRESHOLD;
                return (
                  <div key={f.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
                    <div>
                      <p className="text-sm font-medium">{f.name}</p>
                      <p className="text-xs" style={{ color: '#4B5563' }}>{f.department} • {f.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: belowThreshold ? '#9CA3AF' : m.overallAverage >= 4.5 ? '#2E8B57' : m.overallAverage >= BENCHMARK ? '#002366' : '#C41E3A' }}>
                        {belowThreshold ? '—' : m.overallAverage.toFixed(2)}
                      </p>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>{m.totalSubmissions} submissions</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'cycles' && (
          <div className="rounded-xl p-5" style={{ backgroundColor: '#EDEBE8' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#002366' }}>Evaluation Cycles</h3>
            <div className="space-y-2">
              {cycles.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
                  <div>
                    <p className="text-sm font-medium">{c.displayName}</p>
                    <p className="text-xs" style={{ color: '#4B5563' }}>{c.startDate} to {c.endDate}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium" style={{
                    backgroundColor: c.status === 'active' ? '#D1FAE5' : c.status === 'upcoming' ? '#F5E6D3' : '#D5D8DC',
                    color: c.status === 'active' ? '#2E8B57' : c.status === 'upcoming' ? '#B87333' : '#4B5563',
                  }}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'criteria' && (
          <div className="rounded-xl p-5" style={{ backgroundColor: '#EDEBE8' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#002366' }}>Evaluation Criteria</h3>
            <div className="space-y-3">
              {criteria.map(c => {
                const subQs = store.getSubQuestionsForCriterion(c.id);
                return (
                  <div key={c.id} className="p-3 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
                    <p className="text-sm font-semibold mb-2">{c.name}</p>
                    <div className="space-y-1">
                      {subQs.map(sq => (
                        <p key={sq.id} className="text-xs pl-4" style={{ color: '#4B5563' }}>• {sq.text}</p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
