import { store } from '../store';
import { clearLocalStorage } from '../utils/persistence';

describe('DataStore', () => {
  beforeEach(() => {
    clearLocalStorage();
    // Reset store to initial state
    store.resetData();
  });

  describe('Authentication', () => {
    it('should authenticate admin user', async () => {
      const user = await store.authenticate('admin', 'admin');
      expect(user).not.toBeNull();
      expect(user?.role).toBe('admin');
      expect(user?.displayName).toBe('System Administrator');
    });

    it('should authenticate faculty user', async () => {
      const user = await store.authenticate('faculty', 'faculty');
      expect(user).not.toBeNull();
      expect(user?.role).toBe('faculty');
      expect(user?.facultyId).toBe('F001');
    });

    it('should authenticate student user', async () => {
      const user = await store.authenticate('C24-001', 'pass123');
      expect(user).not.toBeNull();
      expect(user?.role).toBe('student');
    });

    it('should authenticate dean user', async () => {
      const user = await store.authenticate('M001', 'dean123');
      expect(user).not.toBeNull();
      expect(user?.role).toBe('dean');
      expect(user?.department).toBe('Computer Science');
    });

    it('should reject invalid credentials', async () => {
      const user = await store.authenticate('admin', 'wrongpassword');
      expect(user).toBeNull();
    });

    it('should reject non-existent user', async () => {
      const user = await store.authenticate('nonexistent', 'password');
      expect(user).toBeNull();
    });
  });

  describe('Faculty Management', () => {
    it('should get all faculty', () => {
      const faculty = store.getFaculty();
      expect(faculty.length).toBeGreaterThan(0);
      expect(faculty[0]).toHaveProperty('id');
      expect(faculty[0]).toHaveProperty('name');
      expect(faculty[0]).toHaveProperty('department');
    });

    it('should get faculty by ID', () => {
      const faculty = store.getFacultyById('F001');
      expect(faculty).toBeDefined();
      expect(faculty?.id).toBe('F001');
      expect(faculty?.name).toBe('Dr. Sarah Chen');
    });

    it('should return undefined for non-existent faculty', () => {
      const faculty = store.getFacultyById('NONEXISTENT');
      expect(faculty).toBeUndefined();
    });

    it('should get faculty by department', () => {
      const csFaculty = store.getFacultyByDepartment('Computer Science');
      expect(csFaculty.length).toBeGreaterThan(0);
      csFaculty.forEach(f => {
        expect(f.department).toBe('Computer Science');
      });
    });
  });

  describe('Cycle Management', () => {
    it('should get all cycles', () => {
      const cycles = store.getCycles();
      expect(cycles.length).toBeGreaterThan(0);
    });

    it('should get active cycle', () => {
      const activeCycle = store.getActiveCycle();
      expect(activeCycle).toBeDefined();
      expect(activeCycle?.status).toBe('active');
    });

    it('should add new cycle', async () => {
      const initialCount = store.getCycles().length;
      await store.addCycle({
        name: 'Test Cycle',
        displayName: 'Test Cycle Display',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        status: 'upcoming',
      });

      const cycles = store.getCycles();
      expect(cycles.length).toBe(initialCount + 1);
    });

    it('should activate cycle', async () => {
      const cycles = store.getCycles();
      const upcomingCycle = cycles.find(c => c.status === 'upcoming');
      
      if (upcomingCycle) {
        await store.activateCycle(upcomingCycle.id);
        const updatedCycle = store.getCycles().find(c => c.id === upcomingCycle.id);
        expect(updatedCycle?.status).toBe('active');
      }
    });

    it('should archive cycle', async () => {
      const cycles = store.getCycles();
      const activeCycle = cycles.find(c => c.status === 'active');
      
      if (activeCycle) {
        await store.archiveCycle(activeCycle.id);
        const updatedCycle = store.getCycles().find(c => c.id === activeCycle.id);
        expect(updatedCycle?.status).toBe('archived');
      }
    });
  });

  describe('Criteria Management', () => {
    it('should get all criteria', () => {
      const criteria = store.getCriteria();
      expect(criteria.length).toBeGreaterThan(0);
      expect(criteria[0]).toHaveProperty('id');
      expect(criteria[0]).toHaveProperty('name');
    });

    it('should get sub-questions', () => {
      const subQuestions = store.getSubQuestions();
      expect(subQuestions.length).toBeGreaterThan(0);
      expect(subQuestions[0]).toHaveProperty('id');
      expect(subQuestions[0]).toHaveProperty('criterionId');
      expect(subQuestions[0]).toHaveProperty('text');
    });

    it('should add new criterion', async () => {
      const initialCount = store.getCriteria().length;
      await store.addCriterion('Test Criterion');

      const criteria = store.getCriteria();
      expect(criteria.length).toBe(initialCount + 1);
    });

    it('should add sub-question to criterion', async () => {
      const criteria = store.getCriteria();
      const firstCriterion = criteria[0];
      
      const initialCount = store.getSubQuestionsForCriterion(firstCriterion.id).length;
      await store.addSubQuestion(firstCriterion.id, 'Test sub-question');

      const subQuestions = store.getSubQuestionsForCriterion(firstCriterion.id);
      expect(subQuestions.length).toBe(initialCount + 1);
    });
  });

  describe('Evaluation Submission', () => {
    it('should submit evaluation', async () => {
      const faculty = store.getFaculty()[0];
      const criteria = store.getCriteria();
      const subQuestions = store.getSubQuestions();

      const ratings: Record<string, number> = {};
      subQuestions.forEach(sq => {
        ratings[sq.id] = 4;
      });

      const evaluation = await store.submitEvaluation({
        facultyId: faculty.id,
        courseId: faculty.courses[0],
        cycleId: store.getActiveCycle()?.id || '',
        ratings,
        feedback: 'Great teaching!',
      });

      expect(evaluation).toBeDefined();
      expect(evaluation.id).toBeDefined();
      expect(evaluation.facultyId).toBe(faculty.id);
    });

    it('should strip PII from feedback', async () => {
      const faculty = store.getFaculty()[0];
      const subQuestions = store.getSubQuestions();

      const ratings: Record<string, number> = {};
      subQuestions.forEach(sq => {
        ratings[sq.id] = 5;
      });

      const evaluation = await store.submitEvaluation({
        facultyId: faculty.id,
        courseId: faculty.courses[0],
        cycleId: store.getActiveCycle()?.id || '',
        ratings,
        feedback: 'Contact me at test@example.com',
      });

      expect(evaluation.feedback).not.toContain('test@example.com');
      expect(evaluation.feedback).toContain('[REDACTED_EMAIL]');
    });
  });

  describe('Metrics Calculation', () => {
    it('should calculate faculty metrics', async () => {
      const faculty = store.getFaculty()[0];
      const subQuestions = store.getSubQuestions();

      // Submit multiple evaluations
      for (let i = 0; i < 15; i++) {
        const ratings: Record<string, number> = {};
        subQuestions.forEach(sq => {
          ratings[sq.id] = 4;
        });

        await store.submitEvaluation({
          facultyId: faculty.id,
          courseId: faculty.courses[0],
          cycleId: store.getActiveCycle()?.id || '',
          ratings,
          feedback: `Feedback ${i}`,
        });
      }

      const metrics = store.getFacultyMetrics(faculty.id);
      expect(metrics.totalSubmissions).toBeGreaterThanOrEqual(15);
      expect(metrics.overallAverage).toBeGreaterThan(0);
      expect(metrics.criteriaAverages).toBeDefined();
      expect(metrics.scoreDistribution).toHaveLength(5);
    });

    it('should calculate department metrics', () => {
      const metrics = store.getDepartmentMetrics('Computer Science');
      expect(metrics.totalSubmissions).toBeGreaterThanOrEqual(0);
      expect(metrics.totalFaculty).toBeGreaterThan(0);
      expect(metrics.criteriaAverages).toBeDefined();
    });
  });

  describe('Data Management', () => {
    it('should reset data', () => {
      const initialFaculty = store.getFaculty().length;
      
      // Add some data
      store.addCriterion('Test');
      
      // Reset
      store.resetData();
      
      const resetFaculty = store.getFaculty().length;
      expect(resetFaculty).toBe(initialFaculty);
    });

    it('should export all data', () => {
      const data = store.exportAllData();
      expect(data).toHaveProperty('faculty');
      expect(data).toHaveProperty('students');
      expect(data).toHaveProperty('cycles');
      expect(data).toHaveProperty('criteria');
      expect(data).toHaveProperty('evaluations');
    });

    it('should import data', () => {
      const originalFaculty = store.getFaculty();
      
      const newData = {
        faculty: [{ id: 'TEST', name: 'Test Faculty', department: 'Test', title: 'Test', courses: [] }],
      };

      store.importAllData(newData);
      const importedFaculty = store.getFaculty();
      
      expect(importedFaculty).toHaveLength(1);
      expect(importedFaculty[0].id).toBe('TEST');
      
      // Restore original data
      store.importAllData({ faculty: originalFaculty });
    });
  });

  describe('Event System', () => {
    it('should subscribe to events', () => {
      const callback = jest.fn();
      const unsubscribe = store.subscribe('submission_added', callback);
      
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should emit events on submission', async () => {
      const callback = jest.fn();
      store.subscribe('submission_added', callback);

      const faculty = store.getFaculty()[0];
      const subQuestions = store.getSubQuestions();
      const ratings: Record<string, number> = {};
      subQuestions.forEach(sq => {
        ratings[sq.id] = 5;
      });

      await store.submitEvaluation({
        facultyId: faculty.id,
        courseId: faculty.courses[0],
        cycleId: store.getActiveCycle()?.id || '',
        ratings,
        feedback: 'Test',
      });

      expect(callback).toHaveBeenCalled();
    });
  });
});
