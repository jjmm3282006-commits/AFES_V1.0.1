# AFES - Anonymous Faculty Evaluation System
## Developer Documentation

**Last Updated:** March 2026  
**Stack:** React 18 + TypeScript + Vite + Tailwind CSS v4

---

## 📋 Project Overview

AFES is a comprehensive faculty evaluation system that collects anonymous student feedback while guaranteeing privacy through PII stripping, identity decoupling, and aggregation thresholds.

### Core Features
- **Multi-role access:** Admin, Faculty, Student, Dean
- **Anonymous submissions:** UUID-based, PII-stripped feedback
- **Progressive survey reveal:** Sub-questions unlock sequentially with 5-second timers
- **Sub-question level evaluation:** 15 sub-questions across 5 criteria (3 each)
- **Dynamic reporting:** Excel exports reflect current viewing period
- **AI-powered TNA:** Automated training needs analysis with editable recommendations
- **Digital acknowledgment:** Faculty sign-off workflow with compliance tracking
- **Audit logging:** Comprehensive action tracking with detailed context

---

## 🏗️ Architecture

### File Structure
```
src/
├── App.tsx                    # Main router with role-based routing
├── auth.tsx                   # Auth context and provider
├── store.ts                   # In-memory data store with pub/sub
├── types.ts                   # TypeScript interfaces
├── components/
│   ├── Login.tsx              # Login with active period banner
│   ├── Layout.tsx             # Navigation with period filter
│   └── ConfirmDialog.tsx      # Themed confirmation modals
├── pages/
│   ├── StudentDashboard.tsx   # Course-first selection, progressive reveal
│   ├── FacultyDashboard.tsx   # Metrics, charts, sign-off, print
│   ├── AdminDashboard.tsx     # Full control, TNA, criteria management
│   └── DeanDashboard.tsx      # Department aggregates only
└── utils/
    ├── pii.ts                 # PII detection and stripping
    └── excel.ts               # ExcelJS export with professional styling
```

### Data Flow
1. **Store Pattern:** In-memory with simulated API latency (300-500ms)
2. **Pub/Sub Events:** `criteria_changed`, `cycle_changed`, `submission_added`, `acknowledgment_changed`, `training_changed`
3. **Reactive Updates:** Components subscribe to relevant events and reload data

---

## 🔐 Privacy & Security

### PII Stripping (`src/utils/pii.ts`)
- **Regex patterns:** Email, phone, SSN, student IDs (C24-XXX), URLs
- **Name detection:** Common first/last names keyword list
- **Replacement tokens:** `[REDACTED_EMAIL]`, `[REDACTED_NAME]`, etc.
- **Applied to:** All free-text feedback before storage

### Identity Decoupling
- Submissions stored with UUID, never student ID
- No mapping between student and submissions exposed
- Session tracking uses in-memory Set (cleared on refresh)

### Aggregation Threshold
- **Threshold:** 10 submissions minimum
- **Enforcement:** Faculty metrics return "Insufficient Data" below threshold
- **Rationale:** Protects individual anonymity in small classes

### Rate Limiting
- 100 requests per minute per student
- Tracked via `rateLimits` Map in store

---

## 📊 Data Model

### Evaluation Cycles
```typescript
interface EvaluationCycle {
  id: string;
  name: string;              // Internal: "Spring 2026 Midterm"
  displayName: string;       // Public: "AY 2025–2026 | Second Semester"
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'completed' | 'archived';
}
```

### Criteria & Sub-Questions
```typescript
interface Criterion {
  id: string;                // e.g., "crit-clarity"
  name: string;              // e.g., "Clarity"
  order: number;
}

interface SubQuestion {
  id: string;                // e.g., "sq-clarity-1"
  criterionId: string;       // Links to parent criterion
  text: string;              // Actual survey question
  order: number;
}
```

**Default Structure:**
- 5 criteria: Clarity, Pacing, Engagement, Assessment Fairness, Workload
- 3 sub-questions per criterion (15 total)
- Sub-question averages roll up to criterion averages

### Evaluation
```typescript
interface Evaluation {
  id: string;                // UUID (anonymous)
  facultyId: string;
  courseId: string;
  cycleId: string;
  ratings: Record<string, number>;  // subQuestionId → rating (1-5)
  feedback: string;          // PII-stripped
  submittedAt: string;
}
```

### Faculty
```typescript
interface Faculty {
  id: string;
  name: string;
  department: string;
  title: string;
  courses: string[];
  acknowledgmentStatus: 'pending_review' | 'pending_acknowledgment' | 'acknowledged';
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}
```

### Student
```typescript
interface Student {
  id: string;                // e.g., "C24-001"
  name: string;
  enrolledCourses: string[]; // Courses for active cycle
}
```

---

## 🎯 Key Features

### 1. Progressive Survey Reveal (Student Dashboard)
**Flow:**
1. Student selects course → faculty auto-bound
2. First sub-question unlocks after 5 seconds
3. Student rates → next sub-question unlocks after 5 seconds
4. Continue until all 15 sub-questions rated
5. Optional feedback (PII warnings shown if detected)
6. Submit → anonymous storage

**Implementation:**
- `unlockedSQs` Set tracks unlocked sub-questions
- `countdown` state for timer display
- `handleRating()` triggers next unlock

### 2. Dynamic Excel Export (`src/utils/excel.ts`)
**5 Professional Sheets:**
1. **Cover:** Faculty info, summary stats, score distribution
2. **Criteria Analysis:** Hierarchical criteria → sub-questions with color-coded scores
3. **Course Performance:** Per-course breakdown with totals
4. **Student Feedback:** PII-redacted feedback with dates
5. **Feedback Summary:** Analytical metrics and percentages

**Styling:**
- Royal blue headers, copper-tinted sub-headers
- Alternating row backgrounds
- Score-based color coding (emerald ≥4.0, crimson <3.0)
- Tab colors for easy navigation

**Dynamic Data:**
- Accepts `cycleId` parameter
- Reflects current viewing period filter
- File naming includes period: `AFES_Dr_Sarah_Chen_AY_2025_2026_Second_Semester_2026-03-20.xlsx`

### 3. AI-Powered TNA (Training Needs Analysis)
**Location:** Admin Dashboard → TNA tab

**How it works:**
1. Identifies criteria below 3.0 benchmark
2. Analyzes sub-question scores within each criterion
3. Generates specific, actionable recommendations
4. Prioritizes by severity (lowest scores first)

**Recommendation Structure:**
```
**Criterion Name (Score/5.0)**
[Explanation of what students reported]

Recommended actions:
• [Specific classroom strategy based on sub-question feedback]
• [Another targeted action]
• [Third action]

Why this matters: [Pedagogical reasoning]
```

**Example:**
```
**Engagement (2.45/5.0)**
Students report the learning environment feels passive...

Recommended actions:
• Replace 10 minutes of lecture with active learning activities
• Use think-pair-share techniques
• Incorporate case studies and group work

Why this matters: Passive learning leads to lower retention...
```

**Admin Control:**
- Can edit any AI recommendation
- Edited recommendations marked as "Admin-Edited"
- Can delete and regenerate

### 4. Sub-Question Management (Admin Dashboard → Criteria tab)
**Features:**
- Expandable sections for each criterion
- Add new sub-questions via input field
- Delete sub-questions with trash icon
- Auto-reorders remaining sub-questions
- Shows count of sub-questions per criterion

**Implementation:**
- `expandedCriteria` Set tracks which criteria are expanded
- `newSubQs` Record stores input values per criterion
- `store.addSubQuestion()` and `store.removeSubQuestion()` methods

### 5. Digital Acknowledgment (Faculty Dashboard)
**Workflow:**
1. Faculty views evaluation report
2. Clicks "Sign & Acknowledge" button
3. Password verification modal appears
4. Submits password → status updates to "acknowledged"
5. Timestamp and verifier recorded

**Compliance Tracking:**
- Admin sees acknowledgment status in faculty table
- Dean sees department-level compliance gauge
- Status: Pending Review → Pending Acknowledgment → Acknowledged

### 6. Viewing Period Filter (All dashboards except Student)
**Location:** Sticky header below navigation

**Features:**
- Dropdown shows all completed/archived cycles
- Switching period updates all charts, metrics, feedback
- Shows "⚠️ Viewing Archived Evaluation Data" warning
- Does NOT change active system period (admin-only action)

**Implementation:**
- `viewingCycleId` state in App.tsx
- Passed to Layout and dashboards via props
- Excel export uses `cycleId` parameter

---

## 🔑 Test Credentials

| Role | Username | Password | Access |
|------|----------|----------|--------|
| Admin | `admin` | `admin` | Full system control |
| Faculty | `faculty` | `faculty` | Dr. Sarah Chen (F001) |
| Student | `C24-001` through `C24-012` | `pass123` | Submit evaluations |
| Dean | `M001`, `M002`, `M003` | `dean123` | Department aggregates |

**Student Enrollment Example:**
- C24-001 (Alice Johnson): CS101, MATH101, PHYS101
- C24-002 (Bob Smith): CS101, CS201, MATH101

---

## 🎨 Design System

### Color Palette
```css
Primary: Royal Blue #002366 (nav, buttons)
Secondary: Copper Bronze #B87333 (accents, icons)
Accent: Crimson Red #C41E3A (alerts, CTAs)
Neutral Light: Warm Stone #EDEBE8 (card backgrounds)
Neutral Dark: Charcoal #1A1A1A (footer, text)
Background: Muted Slate #D5D8DC (page background)
Success: Emerald #2E8B57 (positive states)
Cream: #F8F6F1 (alternate cards)
Copper Tint: #F5E6D3 (highlights, badges)
```

### Logo
"W" in rounded square with royal blue gradient, copper border, Georgia serif font

### Visual Style
- NO pure white backgrounds (use #EDEBE8 or #F8F6F1)
- Soft shadows, rounded corners (xl)
- Custom scrollbars (thin, slate-colored)
- Smooth transitions (0.2s ease)
- Focus-visible: 2px royal blue outline

---

## 📈 Seed Data

### Faculty (5)
- F001: Dr. Sarah Chen (CS, Associate Prof) - 14 submissions, high performer
- F002: Dr. James Wilson (CS, Professor) - 12 submissions, pacing issues
- F003: Dr. Maria Garcia (Math, Assistant Prof) - 11 submissions, engagement/assessment issues
- F004: Dr. Robert Kim (Math, Professor) - 7 submissions (below threshold)
- F005: Dr. Emily Thompson (Physics, Associate Prof) - 5 submissions, workload issues

### Cycles (5)
- cyc-001: Spring 2026 Midterm (ACTIVE) - AY 2025–2026 | Second Semester
- cyc-002: Spring 2026 Final (UPCOMING)
- cyc-003: Fall 2025 Final (COMPLETED)
- cyc-004: Fall 2025 Midterm (ARCHIVED)
- cyc-005: Spring 2025 Final (ARCHIVED)

### Evaluations
- 51 total seed evaluations distributed across cycles
- Ratings generated with intentional patterns (some faculty have low scores in specific criteria)

---

## ⚙️ Important Implementation Details

### Store Methods
```typescript
// Auth
store.authenticate(username, password)

// Faculty
store.getFaculty()
store.getFacultyById(id)
store.getFacultyByDepartment(dept)
store.acknowledgeFaculty(facultyId, verifiedBy)

// Cycles
store.getCycles()
store.getActiveCycle()
store.addCycle(cycle)
store.activateCycle(cycleId)
store.archiveCycle(cycleId)
store.removeCycle(cycleId)

// Criteria & Sub-Questions
store.getCriteria()
store.getSubQuestions()
store.getSubQuestionsForCriterion(criterionId)
store.addCriterion(name)
store.removeCriterion(criterionId)
store.addSubQuestion(criterionId, text)
store.removeSubQuestion(sqId)

// Evaluations
store.submitEvaluation(data, studentId?)
store.getFacultyMetrics(facultyId, cycleId?, courseId?)
store.getDepartmentMetrics(dept, cycleId?)

// TNA
store.generateTrainingRecommendation(facultyId, cycleId?)
store.getTrainingRecommendationForFaculty(facultyId, cycleId?)
store.updateTrainingRecommendation(recId, newRecommendation)
store.deleteTrainingRecommendation(recId)

// Students
store.getAvailableCoursesForStudent(studentId)
store.isCourseEvaluatedByStudent(studentId, courseId)
```

### Metrics Calculation
```typescript
// Sub-question averages
sqAvgs[sq.id] = total / count

// Criterion averages (from sub-questions)
critAvgs[c.id] = sum(subQuestionAvgs) / subQuestionCount

// Overall average
overallAvg = sum(evalAverages) / evalCount
```

### Event Subscription Pattern
```typescript
useEffect(() => {
  loadData();
  const unsubs = [
    store.subscribe('submission_added', loadData),
    store.subscribe('criteria_changed', loadData),
  ];
  return () => unsubs.forEach(u => u());
}, [loadData]);
```

---

## 🐛 Known Constraints

1. **In-Memory Store:** Data resets on page refresh (no persistence)
2. **Single Active Cycle:** Only one cycle can be active at a time
3. **Student Session Tracking:** Evaluated courses tracked in memory only (cleared on refresh)
4. **AI Recommendations:** Simulated with switch/case logic (not actual LLM)
5. **Excel Export:** Uses ExcelJS library (large bundle size ~1.6MB)
6. **Print Layout:** Basic CSS print styles (may need refinement)

---

## 🔧 Common Tasks

### Add New Criterion
1. Admin Dashboard → Criteria tab
2. Enter name in "Add New Criterion" input
3. Click "Add"
4. Expand the new criterion → "Manage Sub-Qs"
5. Add sub-questions one by one

### Generate TNA Recommendation
1. Admin Dashboard → TNA tab
2. Find faculty below benchmark
3. Click "Generate AI Recommendation"
4. Review/edit as needed
5. Save changes

### Export Faculty Report
1. Admin Dashboard → Faculty tab → Click "Export XLSX" button
2. OR Faculty Dashboard → Click "Export XLSX" button
3. File downloads with current viewing period data

### Switch Viewing Period
1. Use dropdown in sticky header (below navigation)
2. Select desired cycle
3. All dashboards update automatically
4. Warning appears if viewing archived data

---

## 📝 Audit Log Details

All actions include comprehensive context:
- **Login:** Role, department, failed attempt details
- **Submission:** Faculty name, course, cycle, avg rating, feedback length
- **Cycle ops:** Previous active cycle, evaluation counts, dates
- **Criterion changes:** Names, IDs, sub-question counts
- **Acknowledgments:** Faculty name, verifier, timestamp
- **TNA ops:** AI generation details, low criteria scores, admin edits

Example:
```
Timestamp: 2026-03-20 14:32:15
Actor: student:anonymous
Action: submission
Target: F001
Details: Evaluation submitted — Faculty: "Dr. Sarah Chen", Course: CS101, 
         Cycle: cyc-001, Avg Rating: 4.67, Feedback length: 45 chars
```

---

## 🚀 Future Enhancements (Not Implemented)

- Persistent storage (database integration)
- Real LLM integration for TNA
- Bulk export for all faculty
- Department-level Excel exports
- Advanced analytics (trend analysis, comparisons)
- Email notifications for acknowledgments
- Multi-language support
- Accessibility improvements (WCAG compliance)

---

## 📞 Support

For questions or issues:
1. Check audit log for action details
2. Review store methods in `src/store.ts`
3. Check type definitions in `src/types.ts`
4. Review component props and state management

---

**End of Documentation**
