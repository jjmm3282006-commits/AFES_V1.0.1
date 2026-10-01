import React, { useState, useEffect } from 'react';
import { store, BENCHMARK, THRESHOLD } from '../store';
import { useAuth } from '../auth';
import type { FacultyMetrics, Criterion, SubQuestion } from '../types';
import Layout from '../components/Layout';

interface FacultyDashboardProps {
  viewingCycleId?: string;
  onViewingCycleChange?: (cycleId: string) => void;
}

export default function FacultyDashboard({ viewingCycleId, onViewingCycleChange }: FacultyDashboardProps) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<FacultyMetrics | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [subQuestions, setSubQuestions] = useState<SubQuestion[]>([]);
  const [courseFilter, setCourseFilter] = useState('all');

  const facultyId = user?.facultyId || 'F001';
  const faculty = store.getFacultyById(facultyId);
  const facultyCourses = store.getFacultyCourses(facultyId);
  const cycleId = viewingCycleId || store.getActiveCycle()?.id;

  useEffect(() => {
    const loadData = () => {
      setCriteria(store.getCriteria());
      setSubQuestions(store.getSubQuestions());
      const courseId = courseFilter === 'all' ? undefined : courseFilter;
      setMetrics(store.getFacultyMetrics(facultyId, cycleId, courseId));
    };
    loadData();
    const unsubs = [
      store.subscribe('submission_added', loadData),
      store.subscribe('criteria_changed', loadData),
    ];
    return () => unsubs.forEach(u => u());
  }, [facultyId, cycleId, courseFilter]);

  if (!faculty || !metrics) return null;

  const belowThreshold = metrics.totalSubmissions < THRESHOLD;

  return (
    <Layout viewingCycleId={viewingCycleId} onViewingCycleChange={onViewingCycleChange}>
      <div className="space-y-6">
        <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#002366' }}>{faculty.name}</h2>
          <p className="text-sm mb-4" style={{ color: '#4B5563' }}>{faculty.title} • {faculty.department}</p>

          <div className="flex items-center gap-2 mb-6">
            <label className="text-sm font-medium">Course:</label>
            <select
              value={courseFilter}
              onChange={e => setCourseFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border text-sm"
              style={{ backgroundColor: '#F8F6F1', borderColor: '#D5D8DC' }}
            >
              <option value="all">All Courses</option>
              {facultyCourses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {belowThreshold ? (
            <div className="p-6 text-center rounded-lg" style={{ backgroundColor: '#F8F6F1', border: '2px dashed #B87333' }}>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#002366' }}>Insufficient Data</h3>
              <p className="text-sm" style={{ color: '#4B5563' }}>{THRESHOLD - metrics.totalSubmissions} more submissions needed</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
                  <p className="text-xs mb-1" style={{ color: '#4B5563' }}>Total Submissions</p>
                  <p className="text-2xl font-bold" style={{ color: '#002366' }}>{metrics.totalSubmissions}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
                  <p className="text-xs mb-1" style={{ color: '#4B5563' }}>Overall Average</p>
                  <p className="text-2xl font-bold" style={{ color: '#002366' }}>{metrics.overallAverage.toFixed(2)}</p>
                  <p className="text-xs" style={{ color: '#4B5563' }}>out of 5.0</p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
                  <p className="text-xs mb-1" style={{ color: '#4B5563' }}>Courses Evaluated</p>
                  <p className="text-2xl font-bold" style={{ color: '#002366' }}>{Object.keys(metrics.courseBreakdown).length}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#002366' }}>Criteria Performance</h3>
                <div className="space-y-2">
                  {criteria.map(c => {
                    const avg = metrics.criteriaAverages[c.id] || 0;
                    return (
                      <div key={c.id} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#EDEBE8' }}>
                        <span className="text-sm font-medium">{c.name}</span>
                        <span className="text-sm font-bold" style={{ color: avg >= BENCHMARK ? '#2E8B57' : '#C41E3A' }}>
                          {avg.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#002366' }}>Acknowledgment Status</h3>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={{
                    backgroundColor: faculty.acknowledgmentStatus === 'acknowledged' ? '#D1FAE5' : '#F5E6D3',
                    color: faculty.acknowledgmentStatus === 'acknowledged' ? '#2E8B57' : '#B87333',
                  }}>
                    {faculty.acknowledgmentStatus === 'acknowledged' ? '✓ Acknowledged' : '○ Pending'}
                  </span>
                  {faculty.acknowledgedAt && (
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>
                      {new Date(faculty.acknowledgedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
