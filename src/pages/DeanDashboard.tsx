import React, { useState, useEffect } from 'react';
import { store, BENCHMARK, THRESHOLD } from '../store';
import { useAuth } from '../auth';
import type { Criterion } from '../types';
import Layout from '../components/Layout';

interface DeanDashboardProps {
  viewingCycleId?: string;
  onViewingCycleChange?: (cycleId: string) => void;
}

export default function DeanDashboard({ viewingCycleId, onViewingCycleChange }: DeanDashboardProps) {
  const { user } = useAuth();
  const department = user?.department || '';
  const [criteria, setCriteria] = useState<Criterion[]>([]);

  const cycleId = viewingCycleId || store.getActiveCycle()?.id;
  const faculty = store.getFacultyByDepartment(department);
  const deptMetrics = store.getDepartmentMetrics(department, cycleId);

  useEffect(() => {
    setCriteria(store.getCriteria());
  }, []);

  const acknowledged = faculty.filter(f => f.acknowledgmentStatus === 'acknowledged').length;

  return (
    <Layout viewingCycleId={viewingCycleId} onViewingCycleChange={onViewingCycleChange}>
      <div className="space-y-6">
        <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#002366' }}>Department Overview</h2>
          <p className="text-sm mb-4" style={{ color: '#4B5563' }}>{department} Department</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
              <p className="text-xs mb-1" style={{ color: '#4B5563' }}>Total Submissions</p>
              <p className="text-2xl font-bold" style={{ color: '#002366' }}>{deptMetrics.totalSubmissions}</p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
              <p className="text-xs mb-1" style={{ color: '#4B5563' }}>Department Average</p>
              <p className="text-2xl font-bold" style={{ color: '#2E8B57' }}>{deptMetrics.institutionAverage.toFixed(2)}</p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
              <p className="text-xs mb-1" style={{ color: '#4B5563' }}>Faculty Count</p>
              <p className="text-2xl font-bold" style={{ color: '#B87333' }}>{deptMetrics.totalFaculty}</p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
              <p className="text-xs mb-1" style={{ color: '#4B5563' }}>Acknowledged</p>
              <p className="text-2xl font-bold" style={{ color: '#002366' }}>{acknowledged}/{faculty.length}</p>
            </div>
          </div>

          <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: '#F8F6F1' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#002366' }}>Program Completion Rates</h3>
            <div className="space-y-3">
              {store.getPrograms().map(program => {
                const programFaculty = faculty.filter(f => f.department === program.department);
                const totalSubs = programFaculty.reduce((sum, f) => sum + store.getFacultyMetrics(f.id, cycleId).totalSubmissions, 0);
                const facultyWithThreshold = programFaculty.filter(f => store.getFacultyMetrics(f.id, cycleId).totalSubmissions >= THRESHOLD).length;
                const completionRate = programFaculty.length > 0 ? Math.round((facultyWithThreshold / programFaculty.length) * 100) : 0;
                return (
                  <div key={program.id} className="p-3 rounded-lg" style={{ backgroundColor: '#EDEBE8' }}>
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

          <div className="p-4 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#002366' }}>Faculty Performance</h3>
            <div className="space-y-2">
              {faculty.map(f => {
                const m = store.getFacultyMetrics(f.id, cycleId);
                const belowThreshold = m.totalSubmissions < THRESHOLD;
                return (
                  <div key={f.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#EDEBE8' }}>
                    <div>
                      <p className="text-sm font-medium">{f.name}</p>
                      <p className="text-xs" style={{ color: '#4B5563' }}>{f.title}</p>
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
        </div>
      </div>
    </Layout>
  );
}
