import { v4 as uuidv4 } from 'uuid';
import type { User, Faculty, Student, Dean, EvaluationCycle, Criterion, SubQuestion, Evaluation, AuditLogEntry, RateLimitEntry, FacultyMetrics, EventType, TrainingRecommendation } from './types';

const BENCHMARK = 6.0;
const THRESHOLD = 10;

const SUB_QUESTIONS: SubQuestion[] = [
  { id: 'sq-clarity-1', criterionId: 'crit-clarity', text: 'Explains concepts in a clear and understandable manner', order: 1 },
  { id: 'sq-clarity-2', criterionId: 'crit-clarity', text: 'Uses appropriate language and terminology for the course level', order: 2 },
  { id: 'sq-clarity-3', criterionId: 'crit-clarity', text: 'Provides clear instructions for assignments and exams', order: 3 },
  { id: 'sq-pacing-1', criterionId: 'crit-pacing', text: 'Covers material at an appropriate speed', order: 1 },
  { id: 'sq-pacing-2', criterionId: 'crit-pacing', text: 'Allows sufficient time for questions and discussion', order: 2 },
  { id: 'sq-pacing-3', criterionId: 'crit-pacing', text: 'Balances theory and practical applications well', order: 3 },
  { id: 'sq-engagement-1', criterionId: 'crit-engagement', text: 'Creates an interactive and stimulating learning environment', order: 1 },
  { id: 'sq-engagement-2', criterionId: 'crit-engagement', text: 'Encourages student participation and questions', order: 2 },
  { id: 'sq-engagement-3', criterionId: 'crit-engagement', text: 'Uses varied teaching methods effectively', order: 3 },
  { id: 'sq-assessment-1', criterionId: 'crit-assessment', text: 'Assessments align with course learning objectives', order: 1 },
  { id: 'sq-assessment-2', criterionId: 'crit-assessment', text: 'Grading criteria are transparent and consistently applied', order: 2 },
  { id: 'sq-assessment-3', criterionId: 'crit-assessment', text: 'Provides constructive and timely feedback on assessments', order: 3 },
  { id: 'sq-workload-1', criterionId: 'crit-workload', text: 'Course workload is reasonable for the credit hours', order: 1 },
  { id: 'sq-workload-2', criterionId: 'crit-workload', text: 'Reading and assignment deadlines are manageable', order: 2 },
  { id: 'sq-workload-3', criterionId: 'crit-workload', text: 'Balance between coursework and other commitments is appropriate', order: 3 },
];

const FACULTY_SEED: Faculty[] = [
  { id: 'F001', name: 'Dr. Sarah Chen', department: 'Computer Science', title: 'Associate Professor', courses: ['CS101', 'CS201', 'CS301'], acknowledgmentStatus: 'acknowledged', acknowledgedAt: '2026-03-10T14:30:00Z', acknowledgedBy: 'F001' },
  { id: 'F002', name: 'Dr. James Wilson', department: 'Computer Science', title: 'Professor', courses: ['CS401', 'CS350'], acknowledgmentStatus: 'pending_acknowledgment' },
  { id: 'F003', name: 'Dr. Maria Garcia', department: 'Mathematics', title: 'Assistant Professor', courses: ['MATH101', 'MATH201'], acknowledgmentStatus: 'pending_review' },
  { id: 'F004', name: 'Dr. Robert Kim', department: 'Mathematics', title: 'Professor', courses: ['MATH301'], acknowledgmentStatus: 'pending_review' },
  { id: 'F005', name: 'Dr. Emily Thompson', department: 'Physics', title: 'Associate Professor', courses: ['PHYS101', 'PHYS301'], acknowledgmentStatus: 'pending_acknowledgment' },
];

const STUDENTS_SEED: Student[] = [
  { id: 'C24-001', name: 'Alice Johnson', enrolledCourses: ['CS101', 'MATH101', 'PHYS101'] },
  { id: 'C24-002', name: 'Bob Smith', enrolledCourses: ['CS101', 'CS201', 'MATH101'] },
  { id: 'C24-003', name: 'Carol Davis', enrolledCourses: ['CS201', 'MATH201', 'PHYS101'] },
  { id: 'C24-004', name: 'David Lee', enrolledCourses: ['CS301', 'MATH201', 'PHYS301'] },
  { id: 'C24-005', name: 'Emma Wilson', enrolledCourses: ['CS101', 'CS301', 'PHYS101'] },
  { id: 'C24-006', name: 'Frank Brown', enrolledCourses: ['CS401', 'MATH101', 'PHYS101'] },
  { id: 'C24-007', name: 'Grace Taylor', enrolledCourses: ['CS350', 'MATH201', 'PHYS301'] },
  { id: 'C24-008', name: 'Henry Martinez', enrolledCourses: ['CS201', 'CS401', 'MATH301'] },
  { id: 'C24-009', name: 'Ivy Anderson', enrolledCourses: ['CS301', 'MATH101', 'PHYS101'] },
  { id: 'C24-010', name: 'Jack Thomas', enrolledCourses: ['CS350', 'MATH301', 'PHYS301'] },
  { id: 'C24-011', name: 'Karen White', enrolledCourses: ['CS101', 'CS201', 'MATH201'] },
  { id: 'C24-012', name: 'Laura Palmer', enrolledCourses: ['CS401', 'MATH101', 'PHYS101'] },
];

const DEANS_SEED: Dean[] = [
  { id: 'M001', name: 'Dr. Patricia Moore', department: 'Computer Science' },
  { id: 'M002', name: 'Dr. William Chang', department: 'Mathematics' },
  { id: 'M003', name: 'Dr. Elizabeth Brown', department: 'Physics' },
];

const CYCLES_SEED: EvaluationCycle[] = [
  { id: 'cyc-001', name: 'Spring 2026 Midterm', displayName: 'AY 2025–2026 | Second Semester', startDate: '2026-03-01', endDate: '2026-03-31', status: 'active' },
  { id: 'cyc-002', name: 'Spring 2026 Final', displayName: 'AY 2025–2026 | Second Semester Final', startDate: '2026-05-15', endDate: '2026-06-15', status: 'upcoming' },
  { id: 'cyc-003', name: 'Fall 2025 Final', displayName: 'AY 2025–2026 | First Semester', startDate: '2025-12-01', endDate: '2025-12-31', status: 'completed' },
  { id: 'cyc-004', name: 'Fall 2025 Midterm', displayName: 'AY 2025–2026 | First Semester Midterm', startDate: '2025-10-01', endDate: '2025-10-31', status: 'archived' },
];

const CRITERIA_SEED: Criterion[] = [
  { id: 'crit-clarity', name: 'Clarity', order: 1 },
  { id: 'crit-pacing', name: 'Pacing', order: 2 },
  { id: 'crit-engagement', name: 'Engagement', order: 3 },
  { id: 'crit-assessment', name: 'Assessment Fairness', order: 4 },
  { id: 'crit-workload', name: 'Workload', order: 5 },
];

function generateSeedEvaluations(): Evaluation[] {
  const evals: Evaluation[] = [];
  const feedbacks = [
    'Excellent teaching style, very engaging lectures.',
    'Could improve on pacing, sometimes moves too fast.',
    'Great at explaining complex concepts clearly.',
    'Assessments are fair and well-structured.',
    'The workload is manageable and well-distributed.',
    'Very approachable during office hours.',
    'Lectures could use more real-world examples.',
    'Excellent use of visual aids in presentations.',
    'Sometimes the material feels overwhelming.',
    'Very passionate about the subject matter.',
  ];

  const genRatings = (min: number, max: number): Record<string, number> => {
    const r: Record<string, number> = {};
    SUB_QUESTIONS.forEach(sq => { r[sq.id] = Math.floor(Math.random() * (max - min + 1)) + min; });
    return r;
  };

  // F001 - High performer (14 subs)
  for (let i = 0; i < 14; i++) {
    evals.push({ id: uuidv4(), facultyId: 'F001', courseId: FACULTY_SEED[0].courses[i % 3], cycleId: 'cyc-001', ratings: genRatings(7, 10), feedback: feedbacks[i % feedbacks.length], submittedAt: new Date(2026, 2, 5 + i).toISOString() });
  }
  // F002 - Mid performer with pacing issues (12 subs)
  for (let i = 0; i < 12; i++) {
    const ratings = genRatings(5, 8);
    SUB_QUESTIONS.filter(sq => sq.criterionId === 'crit-pacing').forEach(sq => { ratings[sq.id] = Math.floor(Math.random() * 3) + 3; });
    evals.push({ id: uuidv4(), facultyId: 'F002', courseId: FACULTY_SEED[1].courses[i % 2], cycleId: 'cyc-001', ratings, feedback: feedbacks[(i + 3) % feedbacks.length], submittedAt: new Date(2026, 2, 7 + i).toISOString() });
  }
  // F003 - Low performer (11 subs)
  for (let i = 0; i < 11; i++) {
    const ratings = genRatings(3, 7);
    SUB_QUESTIONS.filter(sq => sq.criterionId === 'crit-engagement' || sq.criterionId === 'crit-assessment').forEach(sq => { ratings[sq.id] = Math.floor(Math.random() * 3) + 2; });
    evals.push({ id: uuidv4(), facultyId: 'F003', courseId: FACULTY_SEED[2].courses[i % 2], cycleId: 'cyc-001', ratings, feedback: feedbacks[(i + 5) % feedbacks.length], submittedAt: new Date(2026, 2, 10 + i).toISOString() });
  }
  // F004 - Below threshold (7 subs)
  for (let i = 0; i < 7; i++) {
    evals.push({ id: uuidv4(), facultyId: 'F004', courseId: 'MATH301', cycleId: 'cyc-001', ratings: genRatings(7, 10), feedback: feedbacks[(i + 7) % feedbacks.length], submittedAt: new Date(2026, 2, 12 + i).toISOString() });
  }
  // F005 - Below threshold with workload issues (5 subs)
  for (let i = 0; i < 5; i++) {
    const ratings = genRatings(5, 8);
    SUB_QUESTIONS.filter(sq => sq.criterionId === 'crit-workload').forEach(sq => { ratings[sq.id] = Math.floor(Math.random() * 3) + 3; });
    evals.push({ id: uuidv4(), facultyId: 'F005', courseId: FACULTY_SEED[4].courses[i % 2], cycleId: 'cyc-001', ratings, feedback: feedbacks[(i + 9) % feedbacks.length], submittedAt: new Date(2026, 2, 15 + i).toISOString() });
  }
  // Completed cycle
  for (let i = 0; i < 8; i++) {
    evals.push({ id: uuidv4(), facultyId: FACULTY_SEED[i % 5].id, courseId: FACULTY_SEED[i % 5].courses[0], cycleId: 'cyc-003', ratings: genRatings(5, 10), feedback: feedbacks[i % feedbacks.length], submittedAt: new Date(2025, 11, 5 + i).toISOString() });
  }
  // Archived cycle
  for (let i = 0; i < 6; i++) {
    evals.push({ id: uuidv4(), facultyId: FACULTY_SEED[i % 5].id, courseId: FACULTY_SEED[i % 5].courses[0], cycleId: 'cyc-004', ratings: genRatings(5, 9), feedback: feedbacks[(i + 2) % feedbacks.length], submittedAt: new Date(2025, 9, 5 + i).toISOString() });
  }
  return evals;
}

function generateTrainingRecommendation(facultyName: string, lowCriteria: { name: string; avg: number }[], subQuestionData: { criterionName: string; subQuestions: { text: string; avg: number }[] }[]): string {
  if (lowCriteria.length === 0) return 'No areas below benchmark identified. Continue current teaching practices.';
  const recommendations: string[] = [];
  const sorted = [...lowCriteria].sort((a, b) => a.avg - b.avg);
  sorted.forEach(({ name, avg }) => {
    const score = avg.toFixed(2);
    const critData = subQuestionData.find(c => c.criterionName === name);
    const lowSQs = critData?.subQuestions.filter(sq => sq.avg < BENCHMARK) || [];
    switch (name.toLowerCase()) {
      case 'clarity':
        const ca: string[] = [];
        if (lowSQs.some(sq => sq.text.includes('clear and understandable'))) ca.push('• Break down complex concepts into smaller segments with real-world examples');
        if (lowSQs.some(sq => sq.text.includes('appropriate language'))) ca.push('• Define technical terms when first introduced and provide a glossary');
        if (lowSQs.some(sq => sq.text.includes('clear instructions'))) ca.push('• Provide written assignment guidelines with rubrics and exemplars');
        recommendations.push(`**Clarity (${score}/10)**\nStudents report difficulty understanding course material. This suggests content may be presented too abstractly.\n\nRecommended actions:\n${ca.join('\n')}\n\nWhy this matters: When students cannot follow explanations, they cannot engage meaningfully with the material.`);
        break;
      case 'pacing':
        const pa: string[] = [];
        if (lowSQs.some(sq => sq.text.includes('appropriate speed'))) pa.push('• Allocate specific time blocks for each topic and use a timer');
        if (lowSQs.some(sq => sq.text.includes('time for questions'))) pa.push('• Build in 5-minute pauses every 20 minutes for questions');
        if (lowSQs.some(sq => sq.text.includes('theory and practical'))) pa.push('• Alternate between theoretical explanation and hands-on application');
        recommendations.push(`**Pacing (${score}/10)**\nStudents feel the course moves too quickly or too slowly.\n\nRecommended actions:\n${pa.join('\n')}\n\nWhy this matters: Poor pacing reduces learning outcomes and student engagement.`);
        break;
      case 'engagement':
        const ea: string[] = [];
        if (lowSQs.some(sq => sq.text.includes('interactive'))) ea.push('• Replace 10 minutes of lecture with active learning activities');
        if (lowSQs.some(sq => sq.text.includes('participation'))) ea.push('• Use think-pair-share techniques to encourage participation');
        if (lowSQs.some(sq => sq.text.includes('varied teaching'))) ea.push('• Incorporate case studies, group work, and multimedia');
        recommendations.push(`**Engagement (${score}/10)**\nStudents report the learning environment feels passive.\n\nRecommended actions:\n${ea.join('\n')}\n\nWhy this matters: Passive learning leads to lower retention and motivation.`);
        break;
      case 'assessment fairness':
        const aa: string[] = [];
        if (lowSQs.some(sq => sq.text.includes('learning objectives'))) aa.push('• Map each assessment to specific learning objectives and share with students');
        if (lowSQs.some(sq => sq.text.includes('transparent'))) aa.push('• Provide detailed rubrics before assignments');
        if (lowSQs.some(sq => sq.text.includes('timely feedback'))) aa.push('• Return graded work within 1 week with specific comments');
        recommendations.push(`**Assessment Fairness (${score}/10)**\nStudents perceive assessments as misaligned or grading as inconsistent.\n\nRecommended actions:\n${aa.join('\n')}\n\nWhy this matters: Unclear evaluation undermines trust and focuses students on gaming the system.`);
        break;
      case 'workload':
        const wa: string[] = [];
        if (lowSQs.some(sq => sq.text.includes('reasonable'))) wa.push('• Audit assignment scope: ensure 2-3 hours of work per credit hour per week');
        if (lowSQs.some(sq => sq.text.includes('deadlines'))) wa.push('• Stagger major deadlines across the semester');
        if (lowSQs.some(sq => sq.text.includes('balance'))) wa.push('• Coordinate with other instructors to distribute workload evenly');
        recommendations.push(`**Workload (${score}/10)**\nStudents report course demands exceed reasonable expectations.\n\nRecommended actions:\n${wa.join('\n')}\n\nWhy this matters: Excessive workload forces surface-level learning over deep comprehension.`);
        break;
      default:
        recommendations.push(`**${name} (${score}/10)**\nThis area scored below benchmark. Review sub-question feedback to identify patterns.`);
    }
  });
  return `**Survey Analysis for ${facultyName}**\n\nThe following areas scored below the ${BENCHMARK}/10 benchmark. Actions are prioritized by severity.\n\n${recommendations.join('\n\n---\n\n')}`;
}

class DataStore {
  private faculty: Faculty[] = JSON.parse(JSON.stringify(FACULTY_SEED));
  private students: Student[] = [...STUDENTS_SEED];
  private deans: Dean[] = [...DEANS_SEED];
  private cycles: EvaluationCycle[] = JSON.parse(JSON.stringify(CYCLES_SEED));
  private criteria: Criterion[] = [...CRITERIA_SEED];
  private subQuestions: SubQuestion[] = [...SUB_QUESTIONS];
  private evaluations: Evaluation[] = generateSeedEvaluations();
  private auditLog: AuditLogEntry[] = [];
  private rateLimits: Map<string, RateLimitEntry> = new Map();
  private listeners: Map<EventType, Set<() => void>> = new Map();
  private studentSessionEvals: Map<string, Set<string>> = new Map();
  private trainingRecommendations: TrainingRecommendation[] = [];
  private users: User[] = [
    { id: 'admin', username: 'admin', password: 'admin', role: 'admin', displayName: 'System Administrator' },
    { id: 'faculty', username: 'faculty', password: 'faculty', role: 'faculty', displayName: 'Dr. Sarah Chen', facultyId: 'F001', department: 'Computer Science' },
    { id: 'dean_cs', username: 'M001', password: 'dean123', role: 'dean', displayName: 'Dr. Patricia Moore', department: 'Computer Science' },
    { id: 'dean_math', username: 'M002', password: 'dean123', role: 'dean', displayName: 'Dr. William Chang', department: 'Mathematics' },
    { id: 'dean_phys', username: 'M003', password: 'dean123', role: 'dean', displayName: 'Dr. Elizabeth Brown', department: 'Physics' },
    ...STUDENTS_SEED.map(s => ({ id: s.id, username: s.id, password: 'pass123', role: 'student' as const, displayName: s.name })),
  ];

  constructor() {
    this.addAuditLog('system', 'system_init', 'DataStore', `System initialized — Faculty: ${FACULTY_SEED.length}, Students: ${STUDENTS_SEED.length}, Deans: ${DEANS_SEED.length}, Cycles: ${CYCLES_SEED.length}, Criteria: ${CRITERIA_SEED.length}, Sub-Questions: ${SUB_QUESTIONS.length}, Seed Evaluations: ${this.evaluations.length}`);
  }

  private async simulateLatency(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
  }

  subscribe(event: EventType, cb: () => void): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
    return () => this.listeners.get(event)?.delete(cb);
  }

  emit(event: EventType): void {
    this.listeners.get(event)?.forEach(cb => cb());
  }

  async authenticate(username: string, password: string): Promise<User | null> {
    await this.simulateLatency();
    const user = this.users.find(u => u.username === username && u.password === password);
    if (user) this.addAuditLog(`user:${user.role}:${user.id}`, 'login', user.displayName, `Role: ${user.role}, Department: ${user.department || 'N/A'}`);
    else this.addAuditLog('user:unknown', 'login_failed', username, `Failed login attempt`);
    return user || null;
  }

  checkRateLimit(studentId: string): boolean {
    const now = Date.now();
    const entry = this.rateLimits.get(studentId);
    if (!entry || now - entry.windowStart > 60000) { this.rateLimits.set(studentId, { count: 1, windowStart: now }); return true; }
    if (entry.count >= 100) return false;
    entry.count++;
    return true;
  }

  getFaculty(): Faculty[] { return JSON.parse(JSON.stringify(this.faculty)); }
  getFacultyById(id: string): Faculty | undefined { return this.faculty.find(f => f.id === id); }
  getFacultyByDepartment(dept: string): Faculty[] { return this.faculty.filter(f => f.department === dept); }

  async acknowledgeFaculty(facultyId: string, verifiedBy: string): Promise<void> {
    await this.simulateLatency();
    const f = this.faculty.find(fc => fc.id === facultyId);
    if (f) { f.acknowledgmentStatus = 'acknowledged'; f.acknowledgedAt = new Date().toISOString(); f.acknowledgedBy = verifiedBy; }
    this.addAuditLog(`faculty:${facultyId}`, 'acknowledgment', facultyId, `Faculty acknowledged report. Verified by: ${verifiedBy}`);
    this.emit('acknowledgment_changed');
  }

  getTrainingRecommendations(): TrainingRecommendation[] { return [...this.trainingRecommendations]; }
  getTrainingRecommendationForFaculty(facultyId: string, cycleId?: string): TrainingRecommendation | undefined {
    return this.trainingRecommendations.find(r => r.facultyId === facultyId && r.cycleId === (cycleId || this.getActiveCycle()?.id));
  }

  async generateTrainingRecommendation(facultyId: string, cycleId?: string): Promise<TrainingRecommendation> {
    await this.simulateLatency();
    const faculty = this.getFacultyById(facultyId);
    if (!faculty) throw new Error('Faculty not found');
    const effectiveCycleId = cycleId || this.getActiveCycle()?.id || '';
    const metrics = this.getFacultyMetrics(facultyId, effectiveCycleId);
    const criteria = this.getCriteria();
    const lowCriteria = criteria.map(c => ({ name: c.name, avg: metrics.criteriaAverages[c.id] || 0 })).filter(c => c.avg < BENCHMARK && c.avg > 0);
    const subQuestionData = lowCriteria.map(crit => {
      const criterion = criteria.find(c => c.name === crit.name);
      const sqs = criterion ? this.getSubQuestionsForCriterion(criterion.id) : [];
      return { criterionName: crit.name, subQuestions: sqs.map(sq => ({ text: sq.text, avg: metrics.subQuestionAverages[sq.id] || 0 })) };
    });
    const recommendation = generateTrainingRecommendation(faculty.name, lowCriteria, subQuestionData);
    this.trainingRecommendations = this.trainingRecommendations.filter(r => !(r.facultyId === facultyId && r.cycleId === effectiveCycleId));
    const newRec: TrainingRecommendation = { id: uuidv4(), facultyId, cycleId: effectiveCycleId, recommendation, generatedAt: new Date().toISOString(), editedByAdmin: false };
    this.trainingRecommendations.push(newRec);
    this.addAuditLog('admin:ai', 'tna_generated', facultyId, `AI-generated TNA for "${faculty.name}". Low criteria: ${lowCriteria.map(c => `${c.name}(${c.avg.toFixed(2)})`).join(', ') || 'none'}`);
    this.emit('training_changed');
    return newRec;
  }

  async updateTrainingRecommendation(recId: string, newRec: string): Promise<void> {
    await this.simulateLatency();
    const rec = this.trainingRecommendations.find(r => r.id === recId);
    if (rec) { rec.recommendation = newRec; rec.editedByAdmin = true; this.emit('training_changed'); }
  }

  async deleteTrainingRecommendation(recId: string): Promise<void> {
    await this.simulateLatency();
    this.trainingRecommendations = this.trainingRecommendations.filter(r => r.id !== recId);
    this.emit('training_changed');
  }

  getCycles(): EvaluationCycle[] { return JSON.parse(JSON.stringify(this.cycles)); }
  getActiveCycle(): EvaluationCycle | undefined { return this.cycles.find(c => c.status === 'active'); }

  async addCycle(cycle: Omit<EvaluationCycle, 'id'>): Promise<EvaluationCycle> {
    await this.simulateLatency();
    const newCycle = { ...cycle, id: `cyc-${uuidv4().slice(0, 8)}` };
    this.cycles.push(newCycle);
    this.addAuditLog('admin', 'cycle_created', newCycle.id, `Created "${newCycle.displayName}". Dates: ${newCycle.startDate} to ${newCycle.endDate}`);
    this.emit('cycle_changed');
    return newCycle;
  }

  async activateCycle(cycleId: string): Promise<void> {
    await this.simulateLatency();
    const prev = this.cycles.find(c => c.status === 'active');
    this.cycles.forEach(c => { if (c.status === 'active') c.status = 'archived'; });
    const cycle = this.cycles.find(c => c.id === cycleId);
    if (cycle) cycle.status = 'active';
    this.addAuditLog('admin', 'cycle_activated', cycleId, `Activated "${cycle?.displayName}". Previous: "${prev?.displayName || 'none'}"`);
    this.emit('cycle_changed');
  }

  async archiveCycle(cycleId: string): Promise<void> {
    await this.simulateLatency();
    const cycle = this.cycles.find(c => c.id === cycleId);
    if (cycle) cycle.status = 'archived';
    this.addAuditLog('admin', 'cycle_archived', cycleId, `Archived "${cycle?.displayName}"`);
    this.emit('cycle_changed');
  }

  async removeCycle(cycleId: string): Promise<void> {
    await this.simulateLatency();
    const cycle = this.cycles.find(c => c.id === cycleId);
    this.cycles = this.cycles.filter(c => c.id !== cycleId);
    this.addAuditLog('admin', 'cycle_removed', cycleId, `Removed "${cycle?.name}"`);
    this.emit('cycle_changed');
  }

  getCriteria(): Criterion[] { return [...this.criteria].sort((a, b) => a.order - b.order); }
  getSubQuestions(): SubQuestion[] { return [...this.subQuestions].sort((a, b) => a.order - b.order); }
  getSubQuestionsForCriterion(criterionId: string): SubQuestion[] { return this.subQuestions.filter(sq => sq.criterionId === criterionId).sort((a, b) => a.order - b.order); }

  async addCriterion(name: string): Promise<Criterion> {
    await this.simulateLatency();
    const newCrit = { id: `crit-${uuidv4().slice(0, 8)}`, name, order: this.criteria.length + 1 };
    this.criteria.push(newCrit);
    this.addAuditLog('admin', 'criterion_added', newCrit.id, `Added "${name}"`);
    this.emit('criteria_changed');
    return newCrit;
  }

  async removeCriterion(criterionId: string): Promise<void> {
    await this.simulateLatency();
    const crit = this.criteria.find(c => c.id === criterionId);
    const sqCount = this.subQuestions.filter(sq => sq.criterionId === criterionId).length;
    this.criteria = this.criteria.filter(c => c.id !== criterionId);
    this.subQuestions = this.subQuestions.filter(sq => sq.criterionId !== criterionId);
    this.criteria.forEach((c, i) => c.order = i + 1);
    this.addAuditLog('admin', 'criterion_removed', criterionId, `Removed "${crit?.name}" and ${sqCount} sub-questions`);
    this.emit('criteria_changed');
  }

  async addSubQuestion(criterionId: string, text: string): Promise<SubQuestion> {
    await this.simulateLatency();
    const existing = this.subQuestions.filter(sq => sq.criterionId === criterionId);
    const newSQ: SubQuestion = { id: `sq-${uuidv4().slice(0, 8)}`, criterionId, text, order: existing.length + 1 };
    this.subQuestions.push(newSQ);
    const crit = this.criteria.find(c => c.id === criterionId);
    this.addAuditLog('admin', 'subquestion_added', newSQ.id, `Added to "${crit?.name}": "${text}"`);
    this.emit('criteria_changed');
    return newSQ;
  }

  async removeSubQuestion(sqId: string): Promise<void> {
    await this.simulateLatency();
    const sq = this.subQuestions.find(s => s.id === sqId);
    if (!sq) return;
    const crit = this.criteria.find(c => c.id === sq.criterionId);
    this.subQuestions = this.subQuestions.filter(s => s.id !== sqId);
    this.subQuestions.filter(s => s.criterionId === sq.criterionId).sort((a, b) => a.order - b.order).forEach((s, i) => s.order = i + 1);
    this.addAuditLog('admin', 'subquestion_removed', sqId, `Removed from "${crit?.name}": "${sq.text}"`);
    this.emit('criteria_changed');
  }

  getEvaluations(): Evaluation[] { return [...this.evaluations]; }
  getEvaluationsForFaculty(facultyId: string, cycleId?: string, courseId?: string): Evaluation[] {
    return this.evaluations.filter(e => e.facultyId === facultyId && (!cycleId || e.cycleId === cycleId) && (!courseId || e.courseId === courseId));
  }
  getEvaluationsForDepartment(dept: string, cycleId?: string): Evaluation[] {
    const facultyIds = this.faculty.filter(f => f.department === dept).map(f => f.id);
    return this.evaluations.filter(e => facultyIds.includes(e.facultyId) && (!cycleId || e.cycleId === cycleId));
  }

  isCourseEvaluatedByStudent(studentId: string, courseId: string): boolean {
    return this.studentSessionEvals.get(studentId)?.has(courseId) || false;
  }

  getAvailableCoursesForStudent(studentId: string): Array<{ courseId: string; facultyId: string; facultyName: string }> {
    const student = this.students.find(s => s.id === studentId);
    if (!student) return [];
    return student.enrolledCourses.filter(courseId => !this.isCourseEvaluatedByStudent(studentId, courseId)).map(courseId => {
      const fac = this.faculty.find(f => f.courses.includes(courseId));
      return { courseId, facultyId: fac?.id || '', facultyName: fac?.name || 'Unknown' };
    });
  }

  async submitEvaluation(evalData: Omit<Evaluation, 'id' | 'submittedAt'>, studentId?: string): Promise<Evaluation> {
    await this.simulateLatency();
    const evaluation: Evaluation = { ...evalData, id: uuidv4(), submittedAt: new Date().toISOString() };
    this.evaluations.push(evaluation);
    if (studentId) {
      if (!this.studentSessionEvals.has(studentId)) this.studentSessionEvals.set(studentId, new Set());
      this.studentSessionEvals.get(studentId)!.add(evalData.courseId);
    }
    const fac = this.faculty.find(f => f.id === evalData.facultyId);
    if (fac && fac.acknowledgmentStatus === 'acknowledged') { fac.acknowledgmentStatus = 'pending_acknowledgment'; this.emit('acknowledgment_changed'); }
    const vals = Object.values(evalData.ratings);
    const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    this.addAuditLog('student:anonymous', 'submission', evalData.facultyId, `Faculty: "${fac?.name}", Course: ${evalData.courseId}, Avg: ${avg.toFixed(2)}/10`);
    this.emit('submission_added');
    return evaluation;
  }

  getFacultyMetrics(facultyId: string, cycleId?: string, courseId?: string): FacultyMetrics {
    const evals = this.getEvaluationsForFaculty(facultyId, cycleId, courseId);
    const criteria = this.getCriteria();
    const subQuestions = this.getSubQuestions();
    const sqTotals: Record<string, { total: number; count: number }> = {};
    const scoreDistribution = Array(10).fill(0);
    const courseBreakdown: Record<string, { count: number; total: number }> = {};

    evals.forEach(ev => {
      let evalTotal = 0, evalCount = 0;
      Object.entries(ev.ratings).forEach(([sqId, rating]) => {
        if (!sqTotals[sqId]) sqTotals[sqId] = { total: 0, count: 0 };
        sqTotals[sqId].total += rating;
        sqTotals[sqId].count++;
        if (rating >= 1 && rating <= 10) scoreDistribution[rating - 1]++;
        evalTotal += rating;
        evalCount++;
      });
      if (!courseBreakdown[ev.courseId]) courseBreakdown[ev.courseId] = { count: 0, total: 0 };
      const avg = evalCount > 0 ? evalTotal / evalCount : 0;
      courseBreakdown[ev.courseId].count++;
      courseBreakdown[ev.courseId].total += avg;
    });

    const sqAvgs: Record<string, number> = {};
    subQuestions.forEach(sq => { const d = sqTotals[sq.id]; sqAvgs[sq.id] = d && d.count > 0 ? d.total / d.count : 0; });
    const critAvgs: Record<string, number> = {};
    criteria.forEach(c => {
      const critSQs = subQuestions.filter(sq => sq.criterionId === c.id);
      if (critSQs.length === 0) { critAvgs[c.id] = 0; return; }
      critAvgs[c.id] = critSQs.reduce((s, sq) => s + (sqAvgs[sq.id] || 0), 0) / critSQs.length;
    });

    const overallAvg = evals.length > 0 ? evals.reduce((sum, ev) => { const vals = Object.values(ev.ratings); return sum + vals.reduce((a, b) => a + b, 0) / vals.length; }, 0) / evals.length : 0;
    const cb: Record<string, { count: number; average: number }> = {};
    Object.entries(courseBreakdown).forEach(([course, data]) => { cb[course] = { count: data.count, average: data.count > 0 ? data.total / data.count : 0 }; });

    return { totalSubmissions: evals.length, overallAverage: overallAvg, criteriaAverages: critAvgs, subQuestionAverages: sqAvgs, scoreDistribution, feedback: evals.map(e => ({ feedback: e.feedback, courseId: e.courseId, submittedAt: e.submittedAt })), courseBreakdown: cb };
  }

  getDepartmentMetrics(dept: string, cycleId?: string) {
    const evals = this.getEvaluationsForDepartment(dept, cycleId);
    const facultyInDept = this.getFacultyByDepartment(dept);
    const criteria = this.getCriteria();
    const subQuestions = this.getSubQuestions();
    const sqTotals: Record<string, { total: number; count: number }> = {};
    let totalScore = 0, totalRatings = 0;
    evals.forEach(ev => {
      Object.entries(ev.ratings).forEach(([sqId, rating]) => {
        if (!sqTotals[sqId]) sqTotals[sqId] = { total: 0, count: 0 };
        sqTotals[sqId].total += rating;
        sqTotals[sqId].count++;
        totalScore += rating;
        totalRatings++;
      });
    });
    const sqAvgs: Record<string, number> = {};
    subQuestions.forEach(sq => { const d = sqTotals[sq.id]; sqAvgs[sq.id] = d && d.count > 0 ? d.total / d.count : 0; });
    const criteriaAverages: Record<string, number> = {};
    criteria.forEach(c => {
      const critSQs = subQuestions.filter(sq => sq.criterionId === c.id);
      if (critSQs.length === 0) { criteriaAverages[c.id] = 0; return; }
      criteriaAverages[c.id] = critSQs.reduce((s, sq) => s + (sqAvgs[sq.id] || 0), 0) / critSQs.length;
    });
    return { totalSubmissions: evals.length, institutionAverage: totalRatings > 0 ? totalScore / totalRatings : 0, totalFaculty: facultyInDept.length, criteriaAverages, facultyCompletion: facultyInDept.map(f => ({ faculty: f, submissions: evals.filter(e => e.facultyId === f.id).length, acknowledgmentStatus: f.acknowledgmentStatus })) };
  }

  private addAuditLog(actor: string, action: string, target: string, details?: string): void {
    this.auditLog.push({ id: uuidv4(), timestamp: new Date().toISOString(), actor, action, target, details });
  }

  getAuditLog(): AuditLogEntry[] { return [...this.auditLog].reverse(); }
  getStudents(): Student[] { return [...this.students]; }
  getStudentById(id: string): Student | undefined { return this.students.find(s => s.id === id); }
  getDeans(): Dean[] { return [...this.deans]; }
}

export const store = new DataStore();
export { BENCHMARK, THRESHOLD };
