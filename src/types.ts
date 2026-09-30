export type UserRole = 'admin' | 'faculty' | 'student' | 'dean';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
  facultyId?: string;
  department?: string;
}

export interface SubQuestion {
  id: string;
  criterionId: string;
  text: string;
  order: number;
}

export interface Faculty {
  id: string;
  name: string;
  department: string;
  title: string;
  courses: string[];
  acknowledgmentStatus: 'pending_review' | 'pending_acknowledgment' | 'acknowledged' | 'disputed';
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  disputeId?: string;
  lastReminderSent?: string;
}

export interface Student {
  id: string;
  name: string;
  enrolledCourses: string[];
}

export interface Dean {
  id: string;
  name: string;
  department: string;
}

export interface EvaluationCycle {
  id: string;
  name: string;
  displayName: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'completed' | 'archived';
}

export interface Criterion {
  id: string;
  name: string;
  order: number;
}

export interface Evaluation {
  id: string;
  facultyId: string;
  courseId: string;
  cycleId: string;
  ratings: Record<string, number>; // subQuestionId -> rating (1-5)
  feedback: string;
  submittedAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  details?: string;
}

export interface RateLimitEntry {
  count: number;
  windowStart: number;
}

export type EventType = 'criteria_changed' | 'cycle_changed' | 'submission_added' | 'data_refresh' | 'acknowledgment_changed' | 'training_changed' | 'dispute_submitted' | 'dispute_resolved';

export interface Dispute {
  id: string;
  facultyId: string;
  cycleId: string;
  submittedAt: string;
  justification: string;
  status: 'pending' | 'resolved' | 'dismissed';
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
  adjustedScores?: Record<string, number>;
  redactedFeedback?: string[];
}

export interface FacultyMetrics {
  totalSubmissions: number;
  overallAverage: number;
  criteriaAverages: Record<string, number>;
  subQuestionAverages: Record<string, number>;
  scoreDistribution: number[]; // [1s, 2s, 3s, 4s, 5s]
  feedback: Array<{ feedback: string; courseId: string; submittedAt: string }>;
  courseBreakdown: Record<string, { count: number; average: number }>;
}

export interface TrainingRecommendation {
  id: string;
  facultyId: string;
  cycleId: string;
  recommendation: string;
  generatedAt: string;
  editedByAdmin: boolean;
}
