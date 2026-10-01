import React, { useState, useEffect } from 'react';
import { store } from '../store';
import { useAuth } from '../auth';
import type { Program, Subject, Criterion, SubQuestion, EvaluationCycle } from '../types';
import Layout from '../components/Layout';

interface StudentDashboardProps {
  viewingCycleId?: string;
  onViewingCycleChange?: (cycleId: string) => void;
}

export default function StudentDashboard({ viewingCycleId, onViewingCycleChange }: StudentDashboardProps) {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [boundFaculty, setBoundFaculty] = useState<string>('');
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [subQuestions, setSubQuestions] = useState<SubQuestion[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<'success' | 'error' | null>(null);
  const [activeCycle, setActiveCycle] = useState<EvaluationCycle | undefined>();

  useEffect(() => {
    setPrograms(store.getPrograms());
    setCriteria(store.getCriteria());
    setSubQuestions(store.getSubQuestions());
    setActiveCycle(store.getActiveCycle());
  }, []);

  useEffect(() => {
    if (selectedProgram && user) {
      const subjects = store.getAvailableSubjectsForStudent(user.id);
      setAvailableSubjects(subjects.filter(s => s.programId === selectedProgram));
    }
  }, [selectedProgram, user]);

  useEffect(() => {
    if (selectedSubject) {
      const faculty = store.getFacultyBySubject(selectedSubject);
      if (faculty) {
        setBoundFaculty(faculty.name);
      }
    }
  }, [selectedSubject]);

  const handleProgramSelect = (programId: string) => {
    setSelectedProgram(programId);
    setSelectedSubject('');
    setBoundFaculty('');
    setRatings({});
  };

  const handleSubjectSelect = (subjectId: string) => {
    setSelectedSubject(subjectId);
    setRatings({});
  };

  const handleRatingChange = (sqId: string, value: string) => {
    const rating = parseInt(value);
    if (!isNaN(rating) && rating >= 1 && rating <= 5) {
      setRatings(prev => ({ ...prev, [sqId]: rating }));
    }
  };

  const handleSubmit = async () => {
    if (!selectedSubject || !boundFaculty || !user || !activeCycle) return;
    
    setSubmitting(true);
    setSubmitResult(null);

    try {
      const faculty = store.getFacultyBySubject(selectedSubject);
      if (!faculty) throw new Error('Faculty not found');

      await store.submitEvaluation({
        facultyId: faculty.id,
        courseId: selectedSubject,
        cycleId: activeCycle.id,
        ratings,
        feedback,
      }, user.id);

      setSubmitResult('success');
      setSelectedProgram('');
      setSelectedSubject('');
      setBoundFaculty('');
      setRatings({});
      setFeedback('');
      
      // Refresh available subjects
      const subjects = store.getAvailableSubjectsForStudent(user.id);
      setAvailableSubjects(subjects.filter(s => s.programId === selectedProgram));
    } catch (error) {
      setSubmitResult('error');
    } finally {
      setSubmitting(false);
    }
  };

  const allRated = subQuestions.every(sq => ratings[sq.id] !== undefined);

  return (
    <Layout viewingCycleId={viewingCycleId} onViewingCycleChange={onViewingCycleChange}>
      <div className="space-y-6">
        <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#002366' }}>Submit Evaluation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#1A1A1A' }}>1. Select Program</label>
              <select
                value={selectedProgram}
                onChange={(e) => handleProgramSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border"
                style={{ backgroundColor: '#F8F6F1', borderColor: '#D5D8DC' }}
              >
                <option value="">-- Choose program --</option>
                {programs.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#1A1A1A' }}>2. Select Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => handleSubjectSelect(e.target.value)}
                disabled={!selectedProgram}
                className="w-full px-3 py-2 rounded-lg border disabled:opacity-50"
                style={{ backgroundColor: '#F8F6F1', borderColor: '#D5D8DC' }}
              >
                <option value="">-- Choose subject --</option>
                {availableSubjects.map(s => (
                  <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#1A1A1A' }}>3. Assigned Professor</label>
              <input
                type="text"
                value={boundFaculty}
                disabled
                className="w-full px-3 py-2 rounded-lg border disabled:opacity-50"
                style={{ backgroundColor: '#D5D8DC', borderColor: '#D5D8DC' }}
                placeholder="Select subject first"
              />
            </div>
          </div>

          {selectedSubject && boundFaculty && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#002366' }}>Rate each criterion (1-5 scale)</h3>
                <div className="space-y-3">
                  {criteria.map(criterion => (
                    <div key={criterion.id} className="p-3 rounded-lg" style={{ backgroundColor: '#EDEBE8' }}>
                      <h4 className="text-sm font-semibold mb-2" style={{ color: '#002366' }}>{criterion.name}</h4>
                      <div className="space-y-2">
                        {subQuestions.filter(sq => sq.criterionId === criterion.id).map(sq => (
                          <div key={sq.id} className="flex items-center justify-between gap-3">
                            <span className="text-xs flex-1" style={{ color: '#1A1A1A' }}>{sq.text}</span>
                            <select
                              value={ratings[sq.id] || ''}
                              onChange={(e) => handleRatingChange(sq.id, e.target.value)}
                              className="px-2 py-1 rounded border text-xs"
                              style={{ backgroundColor: '#F8F6F1', borderColor: '#D5D8DC' }}
                            >
                              <option value="">--</option>
                              {[1, 2, 3, 4, 5].map(n => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#1A1A1A' }}>Additional Feedback (Optional)</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ backgroundColor: '#F8F6F1', borderColor: '#D5D8DC' }}
                  rows={4}
                  placeholder="Share your thoughts..."
                />
              </div>

              {submitResult === 'success' && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#D1FAE5', color: '#2E8B57' }}>
                  ✓ Evaluation submitted successfully!
                </div>
              )}

              {submitResult === 'error' && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#FEE2E2', color: '#C41E3A' }}>
                  ✗ Failed to submit evaluation. Please try again.
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!allRated || submitting}
                className="w-full py-3 rounded-lg font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: '#002366' }}
              >
                {submitting ? 'Submitting...' : 'Submit Evaluation'}
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
