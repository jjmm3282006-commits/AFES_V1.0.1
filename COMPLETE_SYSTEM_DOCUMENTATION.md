# AFES - Complete System Documentation

**Anonymous Faculty Evaluation System**  
**Version:** 1.0.0  
**Last Updated:** 2026-03-20  
**Status:** Production Ready

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Design System](#3-design-system)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [Core Features](#5-core-features)
6. [Data Models](#6-data-models)
7. [Privacy & Security](#7-privacy--security)
8. [Technical Implementation](#8-technical-implementation)
9. [Testing & Verification](#9-testing--verification)
10. [Deployment Guide](#10-deployment-guide)

---

## 1. Project Overview

### 1.1 Purpose

The Anonymous Faculty Evaluation System (AFES) is a comprehensive web application designed to collect honest student feedback about faculty performance while guaranteeing complete anonymity. The system addresses the fundamental challenge of gathering authentic evaluations without fear of retaliation or identification.

### 1.2 Core Problem Solved

**Problem:** Students often provide dishonest or incomplete feedback due to concerns about:
- Being identified by faculty
- Potential retaliation or grade impact
- Lack of anonymity in traditional evaluation systems

**Solution:** AFES implements multiple layers of privacy protection:
- UUID-based anonymous submissions (no student ID stored)
- Automatic PII (Personally Identifiable Information) stripping
- Aggregation thresholds (metrics only shown after 10+ submissions)
- Identity decoupling (no mapping between students and submissions)

### 1.3 Target Users

- **Students:** Submit anonymous evaluations
- **Faculty:** View their own anonymized performance metrics
- **Deans:** Access department-level aggregated data
- **Administrators:** Full system control and oversight

### 1.4 Key Principles

1. **Privacy First:** Every feature designed with anonymity in mind
2. **Data Integrity:** All metrics calculated from real evaluation data
3. **Transparency:** Clear data flow and verification systems
4. **Accessibility:** Intuitive interfaces for all user types
5. **Scalability:** Architecture supports future growth

---

## 2. System Architecture

### 2.1 Technology Stack

**Frontend:**
- **React 18** - UI framework with hooks and functional components
- **TypeScript** - Type-safe JavaScript superset
- **Vite** - Fast build tool and dev server
- **Tailwind CSS v4** - Utility-first CSS framework
- **Recharts** - Data visualization library
- **Lucide React** - Icon library
- **React Router DOM** - Client-side routing
- **ExcelJS** - Excel file generation

**State Management:**
- **Custom Pub/Sub System** - Event-driven state updates
- **In-Memory Store** - Simulated backend with persistence
- **localStorage** - Data persistence across sessions

**Testing:**
- **Jest** - Testing framework
- **React Testing Library** - Component testing
- **Custom Verification Utilities** - Data integrity checks

### 2.2 Architecture Pattern

```
┌─────────────────────────────────────────────────────────┐
│                      React Components                    │
│  (StudentDashboard, FacultyDashboard, AdminDashboard)   │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Subscribe to events
                     │
┌────────────────────▼────────────────────────────────────┐
│                    Event Bus (Pub/Sub)                   │
│  (submission_added, criteria_changed, cycle_changed)    │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Emit events
                     │
┌────────────────────▼────────────────────────────────────┐
│                    DataStore (Singleton)                 │
│  - Faculty, Students, Cycles, Criteria, Evaluations    │
│  - Metrics calculation                                  │
│  - PII stripping                                        │
│  - Persistence layer                                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Save/Load
                     │
┌────────────────────▼────────────────────────────────────┐
│                   localStorage                           │
│  (Persistent data across page refreshes)                │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Data Flow

**Evaluation Submission Flow:**
```
Student fills form
    ↓
PII detection & stripping
    ↓
Generate UUID (anonymous ID)
    ↓
Store evaluation in memory
    ↓
Persist to localStorage
    ↓
Emit 'submission_added' event
    ↓
All subscribed dashboards update
    ↓
Metrics recalculated from raw data
    ↓
UI displays updated metrics
```

**Data Verification Flow:**
```
App initializes
    ↓
Load persisted data (if exists)
    ↓
Run integrity checks
    ↓
Verify all evaluations have ratings
    ↓
Verify all ratings in valid range (1-5)
    ↓
Verify metrics match raw data
    ↓
Log verification report to console
    ↓
Display verification status in UI
```

### 2.4 Component Hierarchy

```
App
├── AuthProvider (Authentication context)
├── Router
│   ├── Login (Authentication page)
│   └── ProtectedRoute
│       └── Layout (Navigation + Footer)
│           ├── StudentDashboard
│           ├── FacultyDashboard
│           ├── AdminDashboard
│           └── DeanDashboard
```

---

## 3. Design System

### 3.1 Color Palette

**Primary Colors:**
- **Royal Blue** `#002366` - Navigation, primary buttons, key highlights
- **Copper Bronze** `#B87333` - Accents, icons, hover states
- **Crimson Red** `#C41E3A` - Alerts, CTAs, badges, error states

**Neutral Colors:**
- **Warm Stone** `#EDEBE8` - Card backgrounds (NOT pure white)
- **Charcoal** `#1A1A1A` - Footer, text, overlays
- **Muted Slate** `#D5D8DC` - Page backgrounds
- **Soft Cream** `#F8F6F1` - Alternate card backgrounds
- **Copper Tint** `#F5E6D3` - Highlights, badges

**Semantic Colors:**
- **Emerald** `#2E8B57` - Success, positive states, excellent performance
- **Amber** `#F59E0B` - Warning, caution states
- **Slate** `#94A3B8` - Neutral, average performance
- **Blue** `#3B82F6` - Information, good performance
- **Red** `#DC2626` - Critical, poor performance

**Star Rating Colors (1-5 scale):**
```typescript
const STAR_COLORS = [
  '#DC2626', // 1★ - Red (Poor)
  '#F59E0B', // 2★ - Amber (Needs Improvement)
  '#94A3B8', // 3★ - Slate (Average)
  '#3B82F6', // 4★ - Blue (Good)
  '#10B981', // 5★ - Emerald (Excellent)
];
```

### 3.2 Typography

**Font Families:**
- **Primary:** System fonts (`system-ui, -apple-system, sans-serif`)
- **Logo:** Georgia serif, bold weight

**Font Sizes:**
- Page titles: `text-2xl` (24px)
- Section headers: `text-lg` (18px)
- Card headers: `text-sm` (14px)
- Body text: `text-sm` (14px)
- Small text: `text-xs` (12px)
- Tiny text: `text-[10px]` (10px)

**Font Weights:**
- Bold: `font-bold` (700)
- Semibold: `font-semibold` (600)
- Medium: `font-medium` (500)
- Regular: `font-normal` (400)

### 3.3 Spacing & Layout

**Container Widths:**
- Max content width: `max-w-7xl` (1280px)
- Padding: `px-4 sm:px-6` (16px mobile, 24px desktop)

**Spacing Scale:**
- Section gaps: `space-y-6` (24px)
- Card padding: `p-4` to `p-6` (16px to 24px)
- Element gaps: `gap-2` to `gap-4` (8px to 16px)

**Border Radius:**
- Cards: `rounded-xl` (12px)
- Buttons: `rounded-lg` (8px)
- Badges: `rounded-full` (9999px)
- Inputs: `rounded-lg` (8px)

### 3.4 Shadows & Effects

**Box Shadows:**
- Cards: `shadow-sm` (subtle elevation)
- Modals: `shadow-2xl` (strong elevation)
- Navigation: `shadow-md` (medium elevation)

**Transitions:**
```css
button, a, input, select, textarea {
  transition: all 0.2s ease;
}
```

**Hover States:**
- Buttons: `hover:opacity-90`
- Links: `hover:underline`
- Cards: Subtle background color change

### 3.5 Logo Design

**Specification:**
- Shape: Rounded square (`rounded-2xl`)
- Size: 80x80px (login), 36x36px (navigation)
- Background: Royal Blue gradient (`linear-gradient(135deg, #002366, #003399)`)
- Border: Copper Bronze, 3px solid
- Letter: "W" in Georgia serif, bold, Copper Bronze color
- Letter size: 4xl (36px) for login, lg (18px) for navigation

### 3.6 Visual Style Guidelines

**DO:**
- ✅ Use warm stone (#EDEBE8) or soft cream (#F8F6F1) for backgrounds
- ✅ Apply soft shadows for depth
- ✅ Use rounded corners (xl) consistently
- ✅ Implement smooth transitions
- ✅ Show focus-visible states with royal blue outline

**DON'T:**
- ❌ Use pure white backgrounds
- ❌ Use harsh shadows
- ❌ Use sharp corners
- ❌ Skip transitions
- ❌ Forget focus states

### 3.7 Custom Scrollbars

```css
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #D5D8DC;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #9CA3AF;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #6B7280;
}
```

### 3.8 Responsive Design

**Breakpoints:**
- Mobile: Default (< 640px)
- Small: `sm:` (≥ 640px)
- Medium: `md:` (≥ 768px)
- Large: `lg:` (≥ 1024px)

**Responsive Patterns:**
- Grid layouts: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Flex direction: `flex-col md:flex-row`
- Hide/show: `hidden md:block`
- Font sizes: `text-sm md:text-base`

---

## 4. User Roles & Permissions

### 4.1 Role Definitions

#### Student
**Credentials:** `C24-001` through `C24-012` / `pass123`

**Permissions:**
- ✅ Submit evaluations for enrolled courses
- ✅ View active evaluation cycle
- ✅ See PII warnings before submission
- ❌ Cannot view any metrics or results
- ❌ Cannot access other students' data

**Access:**
- Student Dashboard only
- Course-first selection (auto-binds faculty)
- 1-5 rating scale with dropdowns
- Optional free-text feedback

#### Faculty
**Credentials:** `faculty` / `faculty` (Dr. Sarah Chen, F001)

**Permissions:**
- ✅ View own anonymized metrics
- ✅ See performance charts and feedback
- ✅ Sign & acknowledge evaluation reports
- ✅ Export own reports to Excel
- ❌ Cannot see other faculty data
- ❌ Cannot see student identities

**Access:**
- Faculty Dashboard only
- Metrics gated by 10-submission threshold
- Course filter (own courses only)
- Performance summary, charts, feedback

#### Dean
**Credentials:** `M001` / `dean123` (CS), `M002` / `dean123` (Math), `M003` / `dean123` (Physics)

**Permissions:**
- ✅ View department-level aggregated data
- ✅ See faculty performance summary (no individual details)
- ✅ Access course-level metrics
- ✅ View department strengths & improvements
- ✅ Analyze feedback sentiment
- ✅ Export comprehensive department reports
- ❌ Cannot see individual faculty details
- ❌ Cannot see raw student feedback
- ❌ Cannot see submission-level data

**Access:**
- Dean Dashboard only
- Aggregated views only
- Department-scoped data
- 8-sheet Excel export

#### Admin
**Credentials:** `admin` / `admin`

**Permissions:**
- ✅ Full system control
- ✅ Manage evaluation cycles
- ✅ Manage criteria and sub-questions
- ✅ View all faculty data
- ✅ Generate TNA recommendations
- ✅ Edit training recommendations
- ✅ Access audit logs
- ✅ Export any faculty report
- ✅ Reset/import system data

**Access:**
- Admin Dashboard with 6 tabs:
  1. Overview - System-wide metrics
  2. Faculty - Faculty management
  3. Cycles - Cycle management
  4. Criteria - Criteria & sub-question management
  5. TNA - Training Needs Analysis
  6. Audit Log - System audit trail

### 4.2 Access Control Matrix

| Feature | Student | Faculty | Dean | Admin |
|---------|---------|---------|------|-------|
| Submit Evaluations | ✅ | ❌ | ❌ | ❌ |
| View Own Metrics | ❌ | ✅ | ❌ | ❌ |
| View Dept Metrics | ❌ | ❌ | ✅ | ❌ |
| View All Faculty | ❌ | ❌ | ❌ | ✅ |
| Manage Cycles | ❌ | ❌ | ❌ | ✅ |
| Manage Criteria | ❌ | ❌ | ❌ | ✅ |
| View Audit Log | ❌ | ❌ | ❌ | ✅ |
| Export Reports | ❌ | ✅ (own) | ✅ (dept) | ✅ (all) |
| Data Management | ❌ | ❌ | ❌ | ✅ |

---

## 5. Core Features

### 5.1 Student Evaluation System

**Purpose:** Collect anonymous student feedback with maximum privacy protection.

**Key Features:**

#### Course-First Selection
**Why:** Students think in terms of courses, not faculty names. This also enables enrollment validation.

**How it works:**
1. Student sees dropdown of enrolled courses (from `student.enrolledCourses`)
2. Selecting a course auto-binds the faculty member
3. Faculty field is disabled (read-only) to prevent confusion

**Implementation:**
```typescript
const handleCourseSelect = (courseId: string) => {
  setSelectedCourse(courseId);
  const course = availableCourses.find(c => c.courseId === courseId);
  if (course) {
    setBoundFacultyId(course.facultyId);
    setBoundFacultyName(course.facultyName);
  }
};
```

#### 1-5 Rating Scale with Dropdowns
**Why:** Simpler than buttons, prevents accidental clicks, standard evaluation format.

**How it works:**
- Each sub-question has a dropdown with options 1-5
- 1 = Poor, 5 = Excellent
- All questions visible at once (no progressive reveal)

**Implementation:**
```typescript
<select value={ratings[sqId] || ''} onChange={e => handleRatingChange(sqId, e.target.value)}>
  <option value="">--</option>
  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
</select>
```

#### Sub-Question Level Evaluation
**Why:** Provides granular feedback. "Clarity" is too vague - are students confused by lectures, instructions, or terminology?

**Structure:**
- 5 criteria (Clarity, Pacing, Engagement, Assessment Fairness, Workload)
- 3 sub-questions per criterion (15 total)
- Sub-question averages roll up to criterion averages

**Example:**
```
Criterion: Clarity (avg: 4.2)
  ├─ Sub-Q 1: "Explains concepts clearly" (avg: 4.5)
  ├─ Sub-Q 2: "Uses appropriate language" (avg: 4.0)
  └─ Sub-Q 3: "Provides clear instructions" (avg: 4.1)
```

#### PII Detection & Stripping
**Why:** Protects student anonymity even if they accidentally include personal information.

**What it detects:**
- Email addresses → `[REDACTED_EMAIL]`
- Phone numbers → `[REDACTED_PHONE]`
- Student IDs (C24-XXX) → `[REDACTED_STUDENT_ID]`
- URLs → `[REDACTED_URL]`
- SSNs → `[REDACTED_SSN]`
- Common names → `[REDACTED_NAME]`

**Implementation:**
```typescript
export function stripPII(text: string): string {
  let result = text;
  // Apply regex patterns
  PII_PATTERNS.forEach(({ pattern, replacement }) => {
    result = result.replace(pattern, replacement);
  });
  // Check for common names
  COMMON_NAMES.forEach(name => {
    const namePattern = new RegExp(`\\b${name}\\b`, 'gi');
    result = result.replace(namePattern, '[REDACTED_NAME]');
  });
  return result;
}
```

#### Session-Based Completion Tracking
**Why:** Prevents duplicate submissions and tracks progress within a session.

**How it works:**
- Tracks which courses student has evaluated in current session
- Removes evaluated courses from dropdown
- Resets on page refresh (intentional - allows re-evaluation if needed)

**Implementation:**
```typescript
getAvailableCoursesForStudent(studentId: string) {
  const student = this.students.find(s => s.id === studentId);
  return student.enrolledCourses
    .filter(courseId => !this.isCourseEvaluatedByStudent(studentId, courseId))
    .map(courseId => {
      const fac = this.faculty.find(f => f.courses.includes(courseId));
      return { courseId, facultyId: fac?.id, facultyName: fac?.name };
    });
}
```

### 5.2 Faculty Dashboard

**Purpose:** Provide faculty with anonymized performance metrics to improve teaching.

**Key Features:**

#### Threshold Protection (10 Submissions)
**Why:** Protects individual anonymity in small classes. With <10 submissions, individual ratings could be identified.

**How it works:**
- Metrics only displayed if `totalSubmissions >= 10`
- Otherwise shows "Insufficient Data" message
- Shows how many more submissions needed

**Implementation:**
```typescript
if (metrics.totalSubmissions < THRESHOLD) {
  return <div>Insufficient Data ({THRESHOLD - metrics.totalSubmissions} more needed)</div>;
}
```

#### Dynamic Performance Summary
**Why:** Provides instant insights without requiring manual generation. Updates automatically when data changes.

**What it shows:**
- Overall performance score
- Strengths (criteria ≥4.0)
- Areas for improvement (criteria <3.0)
- Response distribution (5★ and 1-2★ counts)

**Implementation:**
```typescript
const performanceSummary = metrics ? (() => {
  const lowCriteria = criteria.filter(c => metrics.criteriaAverages[c.id] < BENCHMARK);
  const highCriteria = criteria.filter(c => metrics.criteriaAverages[c.id] >= 4);
  
  let summary = `Based on ${metrics.totalSubmissions} evaluations, your overall performance is ${metrics.overallAverage.toFixed(2)}/5.0. `;
  
  if (highCriteria.length > 0) {
    summary += `You excel in ${highCriteria.map(c => c.name).join(', ')}. `;
  }
  
  if (lowCriteria.length > 0) {
    summary += `Areas for improvement: ${lowCriteria.map(c => c.name).join(', ')} scored below the ${BENCHMARK}/5.0 benchmark. `;
  }
  
  return summary;
})() : '';
```

#### Horizontal Bar Charts with Benchmark
**Why:** Clear visual comparison of criteria performance against benchmark (3.0).

**Design:**
- Horizontal bars for easy label reading
- Color-coded: Green (≥3.0), Red (<3.0)
- Dashed red line at benchmark (3.0)
- Domain: 0-5

**Implementation:**
```typescript
<BarChart data={criteriaBarData} layout="vertical">
  <ReferenceLine x={BENCHMARK} stroke="#C41E3A" strokeDasharray="5 5" />
  <Bar dataKey="score">
    {criteriaBarData.map((entry, i) => (
      <Cell key={i} fill={entry.score >= BENCHMARK ? '#2E8B57' : '#C41E3A'} />
    ))}
  </Bar>
</BarChart>
```

#### Donut Chart for Score Distribution
**Why:** Visual representation of rating distribution with average in center.

**Design:**
- 5 segments (1★ to 5★)
- Color-coded with STAR_COLORS
- Average score displayed in center
- Legend shows count and percentage

**Implementation:**
```typescript
<Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}>
  {donutData.map((_, i) => <Cell key={i} fill={STAR_COLORS[i]} />)}
</Pie>
```

#### Per-Criteria Pie Charts
**Why:** Shows score distribution for each criterion individually. Helps identify specific areas of strength/weakness.

**Design:**
- Grid layout (1/2/3 columns responsive)
- Smaller charts (100x100px)
- Average in center
- Legend shows only non-zero values

#### Course Filter
**Why:** Faculty teaches multiple courses. Need to see performance per course.

**How it works:**
- Dropdown shows only faculty's own courses
- "All Courses" option for aggregate view
- Metrics recalculate based on selection

**Implementation:**
```typescript
const facultyCourses = store.getFacultyCourses(facultyId);
// ...
<select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
  <option value="all">All Courses</option>
  {facultyCourses.map(c => <option key={c} value={c}>{c}</option>)}
</select>
```

#### Digital Acknowledgment
**Why:** Formal sign-off process for evaluation reports. Creates audit trail.

**Workflow:**
1. Faculty clicks "Sign & Acknowledge" button
2. Password verification modal appears
3. Faculty enters password
4. Status updates to "acknowledged"
5. Timestamp and verifier recorded

**Implementation:**
```typescript
async acknowledgeFaculty(facultyId: string, verifiedBy: string) {
  const f = this.faculty.find(fc => fc.id === facultyId);
  if (f) {
    f.acknowledgmentStatus = 'acknowledged';
    f.acknowledgedAt = new Date().toISOString();
    f.acknowledgedBy = verifiedBy;
  }
  this.addAuditLog(`faculty:${facultyId}`, 'acknowledgment', facultyId, 
    `Faculty acknowledged report. Verified by: ${verifiedBy}`);
  this.persistData();
  this.emit('acknowledgment_changed');
}
```

#### Excel Export
**Why:** Faculty need professional reports for tenure reviews, promotions, etc.

**What's included:**
- Cover sheet with faculty info
- Criteria analysis with sub-questions
- Course performance breakdown
- Student feedback (PII-redacted)
- Feedback summary with statistics

**Implementation:**
```typescript
export async function exportFacultyReport(facultyId: string, cycleId?: string) {
  const workbook = new ExcelJS.Workbook();
  // ... create 5 sheets with professional formatting
  const buffer = await workbook.xlsx.writeBuffer();
  // ... download file
}
```

### 5.3 Admin Dashboard

**Purpose:** Full system control and oversight for administrators.

**Key Features:**

#### Overview Tab
**What it shows:**
- Total submissions, faculty count, acknowledgment status
- Completion by department (progress bars)
- Top rated faculty
- Institution score distribution (pie chart)
- Per-criteria pie charts
- Below benchmark faculty list
- AI system summary

**Why:** Quick system health check at a glance.

#### Faculty Tab
**What it shows:**
- Searchable faculty table
- Average scores with color coding
- Status badges (Active/Below Benchmark/Insufficient Data)
- Acknowledgment status
- View details and export buttons

**Faculty Detail View:**
- Back button
- Metrics cards (submissions, average, courses)
- Criteria performance chart
- Student feedback list
- Export button

**Why:** Comprehensive faculty management and oversight.

#### Cycles Tab
**What it shows:**
- List of all evaluation cycles
- Create new cycle form
- Activate/Archive/Remove buttons
- Status indicators

**Why:** Manage evaluation periods and control active cycle.

#### Criteria Tab
**What it shows:**
- List of all criteria
- Expandable sections for sub-questions
- Add/Edit/Remove functionality
- Inline editing for sub-questions

**Why:** Customize evaluation structure to match institutional needs.

#### TNA (Training Needs Analysis) Tab
**What it shows:**
- Faculty below benchmark list
- AI-generated recommendations
- Edit/Delete buttons for recommendations
- Generate new recommendations

**AI Recommendation Logic:**
```typescript
function generateTrainingRecommendation(facultyName, lowCriteria, subQuestionData) {
  // Sort by severity (lowest scores first)
  const sorted = [...lowCriteria].sort((a, b) => a.avg - b.avg);
  
  sorted.forEach(({ name, avg }) => {
    // Find specific sub-questions that are low
    const lowSQs = subQuestionData.find(c => c.criterionName === name)
      ?.subQuestions.filter(sq => sq.avg < BENCHMARK);
    
    // Generate specific recommendations based on sub-question patterns
    if (lowSQs.some(sq => sq.text.includes('interactive'))) {
      recommendations.push('Replace 10 minutes of lecture with active learning activities');
    }
  });
}
```

**Why:** Provides actionable, data-driven training recommendations instead of generic advice.

#### Audit Log Tab
**What it shows:**
- Timestamp, actor, action, target, details
- Color-coded by action type
- Searchable and filterable

**Why:** Complete transparency and compliance tracking.

### 5.4 Dean Dashboard

**Purpose:** Department-level oversight without access to individual faculty details.

**Key Features:**

#### Faculty Performance Summary
**What it shows:**
- Table of all faculty in department
- Submission counts
- Overall averages (color-coded)
- Acknowledgment status

**Why:** Quick overview of department performance.

#### Course-Level Performance
**What it shows:**
- Table of all courses in department
- Submission counts per course
- Average scores per course

**Why:** Identify which courses are excelling or need attention.

#### Department Strengths
**What it shows:**
- Criteria with averages ≥4.0
- Sorted by highest performance
- Green-themed section

**Why:** Highlight what the department does well for recognition and best practices.

#### Areas for Improvement
**What it shows:**
- Criteria with averages <3.0
- Sorted by lowest performance
- Red-themed section

**Why:** Clear priorities for improvement efforts.

#### Feedback Sentiment Analysis
**What it shows:**
- Total feedback count
- Positive feedback count (keyword-based)
- Needs attention count (keyword-based)
- Sentiment ratio percentage

**Why:** Quantitative measure of student satisfaction.

#### Excel Export (8 Sheets)
**What's included:**
1. Department Overview
2. Faculty Summary
3. Criteria Performance
4. Sub-Question Analysis
5. Acknowledgment Compliance
6. Course Performance
7. Strengths & Improvements
8. Feedback Sentiment

**Why:** Comprehensive reports for accreditation, stakeholders, strategic planning.

### 5.5 Data Persistence

**Purpose:** Prevent data loss on page refresh. Enable meaningful demos and testing.

**How it works:**
- Auto-save to localStorage after every mutation
- Auto-load on app initialization
- Version checking for compatibility
- Export/Import functionality
- Reset to seed data option

**Implementation:**
```typescript
// Save
saveToLocalStorage(data) {
  const persistedData = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    data,
  };
  localStorage.setItem('afes_data', JSON.stringify(persistedData));
}

// Load
loadFromLocalStorage() {
  const stored = localStorage.getItem('afes_data');
  const parsed = JSON.parse(stored);
  if (parsed.version !== '1.0.0') return null; // Version mismatch
  return parsed.data;
}
```

**UI Controls:**
- Data management panel (admin only)
- Shows storage size
- Export/Import/Reset buttons
- Indicates data source (persisted vs seed)

### 5.6 Viewing Period Filter

**Purpose:** Allow users to view historical data without changing active cycle.

**How it works:**
- Dropdown shows all completed/archived cycles
- Selecting a cycle updates all dashboards
- Shows warning when viewing archived data
- Does NOT change active system period

**Implementation:**
```typescript
const [viewingCycleId, setViewingCycleId] = useState<string>('');
const cycleId = viewingCycleId || activeCycle?.id;

// All data fetching uses cycleId
const metrics = store.getFacultyMetrics(facultyId, cycleId);
```

**Why:** Enables historical analysis and trend tracking.

---

## 6. Data Models

### 6.1 Core Entities

#### User
```typescript
interface User {
  id: string;              // Unique identifier
  username: string;        // Login username
  password: string;        // Login password (plain text for demo)
  role: UserRole;          // 'admin' | 'faculty' | 'student' | 'dean'
  displayName: string;     // Full name for display
  facultyId?: string;      // Link to Faculty (if role is faculty)
  department?: string;     // Department (if role is faculty/dean)
}
```

#### Faculty
```typescript
interface Faculty {
  id: string;                          // Unique identifier (e.g., 'F001')
  name: string;                        // Full name
  department: string;                  // Department name
  title: string;                       // Academic title
  courses: string[];                   // List of course IDs taught
  acknowledgmentStatus:                // Sign-off status
    'pending_review' | 
    'pending_acknowledgment' | 
    'acknowledged';
  acknowledgedAt?: string;             // ISO timestamp
  acknowledgedBy?: string;             // Who verified
}
```

#### Student
```typescript
interface Student {
  id: string;              // Student ID (e.g., 'C24-001')
  name: string;            // Full name
  enrolledCourses: string[]; // Course IDs for active cycle
}
```

#### Dean
```typescript
interface Dean {
  id: string;              // Dean ID (e.g., 'M001')
  name: string;            // Full name
  department: string;      // Department they oversee
}
```

#### EvaluationCycle
```typescript
interface EvaluationCycle {
  id: string;              // Unique identifier
  name: string;            // Internal name (e.g., 'Spring 2026 Midterm')
  displayName: string;     // Public name (e.g., 'AY 2025–2026 | Second Semester')
  startDate: string;       // ISO date string
  endDate: string;         // ISO date string
  status:                  // Current status
    'active' | 
    'upcoming' | 
    'completed' | 
    'archived';
}
```

#### Criterion
```typescript
interface Criterion {
  id: string;              // Unique identifier (e.g., 'crit-clarity')
  name: string;            // Display name (e.g., 'Clarity')
  order: number;           // Display order
}
```

#### SubQuestion
```typescript
interface SubQuestion {
  id: string;              // Unique identifier (e.g., 'sq-clarity-1')
  criterionId: string;     // Parent criterion ID
  text: string;            // Question text
  order: number;           // Display order within criterion
}
```

#### Evaluation
```typescript
interface Evaluation {
  id: string;              // UUID (anonymous, never student ID)
  facultyId: string;       // Faculty being evaluated
  courseId: string;        // Course being evaluated
  cycleId: string;         // Evaluation cycle
  ratings: Record<string, number>; // subQuestionId → rating (1-5)
  feedback: string;        // Free-text feedback (PII-stripped)
  submittedAt: string;     // ISO timestamp
}
```

#### AuditLogEntry
```typescript
interface AuditLogEntry {
  id: string;              // Unique identifier
  timestamp: string;       // ISO timestamp
  actor: string;           // Who performed action (anonymous reference)
  action: string;          // What action was performed
  target: string;          // What was affected
  details?: string;        // Additional context
}
```

#### FacultyMetrics
```typescript
interface FacultyMetrics {
  totalSubmissions: number;                    // Count of evaluations
  overallAverage: number;                      // Average of all ratings
  criteriaAverages: Record<string, number>;    // Average per criterion
  subQuestionAverages: Record<string, number>; // Average per sub-question
  scoreDistribution: number[];                 // [1s, 2s, 3s, 4s, 5s]
  feedback: Array<{                            // List of feedback entries
    feedback: string;
    courseId: string;
    submittedAt: string;
  }>;
  courseBreakdown: Record<string, {            // Metrics per course
    count: number;
    average: number;
  }>;
}
```

#### TrainingRecommendation
```typescript
interface TrainingRecommendation {
  id: string;              // Unique identifier
  facultyId: string;       // Faculty this recommendation is for
  cycleId: string;         // Evaluation cycle
  recommendation: string;  // AI-generated text
  generatedAt: string;     // ISO timestamp
  editedByAdmin: boolean;  // Whether admin modified it
}
```

### 6.2 Data Relationships

```
User (1) ──────> (0..1) Faculty
  │
  └──────> (0..1) Student
  │
  └──────> (0..1) Dean

Faculty (1) ──────> (*) Evaluation
  │
  └──────> (0..1) TrainingRecommendation

EvaluationCycle (1) ──────> (*) Evaluation

Criterion (1) ──────> (*) SubQuestion

SubQuestion (1) ──────> (*) Evaluation.ratings
```

### 6.3 Seed Data

**Faculty (5):**
- F001: Dr. Sarah Chen (CS, Associate Prof) - 14 submissions, avg ~4.47
- F002: Dr. James Wilson (CS, Professor) - 12 submissions, avg ~3.20
- F003: Dr. Maria Garcia (Math, Assistant Prof) - 11 submissions, avg ~2.30
- F004: Dr. Robert Kim (Math, Professor) - 7 submissions (below threshold)
- F005: Dr. Emily Thompson (Physics, Associate Prof) - 5 submissions (below threshold)

**Students (12):**
- C24-001 through C24-012
- Each enrolled in 3 courses

**Deans (3):**
- M001: Dr. Patricia Moore (CS)
- M002: Dr. William Chang (Math)
- M003: Dr. Elizabeth Brown (Physics)

**Cycles (4):**
- cyc-001: Spring 2026 Midterm (ACTIVE) - 49 evaluations
- cyc-002: Spring 2026 Final (UPCOMING)
- cyc-003: Fall 2025 Final (COMPLETED) - 8 evaluations
- cyc-004: Fall 2025 Midterm (ARCHIVED) - 6 evaluations

**Total Evaluations:** 57 (across all cycles)

---

## 7. Privacy & Security

### 7.1 Privacy Mechanisms

#### UUID-Based Anonymity
**Why:** Never store student ID with evaluation. Prevents any possibility of identification.

**Implementation:**
```typescript
const evaluation: Evaluation = {
  id: uuidv4(),  // Random UUID, not student ID
  facultyId: evalData.facultyId,
  courseId: evalData.courseId,
  cycleId: evalData.cycleId,
  ratings: evalData.ratings,
  feedback: stripPII(evalData.feedback),
  submittedAt: new Date().toISOString(),
};
```

#### PII Stripping
**Why:** Even if student accidentally includes personal info, it's automatically removed.

**What it catches:**
- Emails (regex pattern)
- Phone numbers (multiple formats)
- Student IDs (C24-XXX format)
- URLs (http/https)
- SSNs (XXX-XX-XXXX format)
- Common names (keyword list)

**Replacement tokens:**
- `[REDACTED_EMAIL]`
- `[REDACTED_PHONE]`
- `[REDACTED_STUDENT_ID]`
- `[REDACTED_URL]`
- `[REDACTED_SSN]`
- `[REDACTED_NAME]`

#### Aggregation Threshold (10 Submissions)
**Why:** With <10 submissions, individual ratings could be identified. This protects small classes.

**Implementation:**
```typescript
if (metrics.totalSubmissions < THRESHOLD) {
  return {
    totalSubmissions: metrics.totalSubmissions,
    overallAverage: 0,  // Not calculated
    criteriaAverages: {},  // Not calculated
    // ... other fields empty
  };
}
```

#### Identity Decoupling
**Why:** No mapping between student and submission is ever stored or exposed.

**How it works:**
- Student ID used only for session tracking (in-memory, not persisted)
- Evaluation stored with UUID only
- No database table linking students to evaluations
- Audit log uses anonymous actor references

### 7.2 Security Measures

#### Rate Limiting
**Why:** Prevent abuse and spam submissions.

**Implementation:**
```typescript
checkRateLimit(studentId: string): boolean {
  const now = Date.now();
  const entry = this.rateLimits.get(studentId);
  if (!entry || now - entry.windowStart > 60000) {
    this.rateLimits.set(studentId, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= 100) return false;  // 100 requests per minute
  entry.count++;
  return true;
}
```

#### Audit Logging
**Why:** Complete transparency and compliance tracking.

**What's logged:**
- Every login (successful and failed)
- Every evaluation submission
- Every threshold check
- Every admin action
- Every data modification

**Log structure:**
```typescript
{
  id: uuidv4(),
  timestamp: new Date().toISOString(),
  actor: 'student:anonymous',  // Anonymous reference
  action: 'submission',
  target: 'F001',  // Faculty ID
  details: 'Faculty: "Dr. Sarah Chen", Course: CS101, Avg: 4.67/5'
}
```

#### Password Protection (Demo Only)
**Current:** Plain text passwords for demo purposes.

**Production Requirements:**
- Password hashing (bcrypt, argon2)
- JWT tokens with refresh
- Session management
- Rate limiting on login attempts
- Account lockout after failed attempts

### 7.3 Privacy Guarantees

✅ **Student anonymity is guaranteed:**
- No student ID stored with evaluation
- PII automatically stripped from feedback
- No mapping between student and submission exists
- Aggregation threshold prevents identification in small classes

✅ **Faculty privacy is protected:**
- Only see their own metrics
- Cannot see other faculty data
- Cannot see student identities

✅ **Data integrity is maintained:**
- All metrics calculated from real evaluation data
- Verification system ensures data consistency
- Audit trail tracks all changes

---

## 8. Technical Implementation

### 8.1 State Management

#### Pub/Sub Event System
**Why:** Decoupled architecture. Components don't need to know about each other.

**Event Types:**
```typescript
type EventType = 
  | 'criteria_changed'      // Criteria or sub-questions modified
  | 'cycle_changed'         // Evaluation cycles modified
  | 'submission_added'      // New evaluation submitted
  | 'acknowledgment_changed' // Faculty acknowledgment status changed
  | 'training_changed'      // Training recommendations modified
  | 'data_refresh';         // Manual refresh trigger
```

**Subscription Pattern:**
```typescript
useEffect(() => {
  loadData();  // Initial load
  const unsubs = [
    store.subscribe('submission_added', loadData),
    store.subscribe('criteria_changed', loadData),
  ];
  return () => unsubs.forEach(u => u());  // Cleanup
}, []);
```

**Emission Pattern:**
```typescript
async submitEvaluation(evalData) {
  // ... save evaluation
  this.persistData();
  this.emit('submission_added');  // Notify all subscribers
}
```

### 8.2 Metrics Calculation

**Why on-demand:** Ensures metrics always reflect current data. No stale cached values.

**Calculation Flow:**
```typescript
getFacultyMetrics(facultyId, cycleId, courseId) {
  // 1. Get evaluations
  const evals = this.getEvaluationsForFaculty(facultyId, cycleId, courseId);
  
  // 2. Initialize accumulators
  const sqTotals = {};  // subQuestionId → {total, count}
  const scoreDistribution = [0, 0, 0, 0, 0];
  const courseBreakdown = {};
  
  // 3. Iterate through evaluations
  evals.forEach(ev => {
    Object.entries(ev.ratings).forEach(([sqId, rating]) => {
      // Accumulate sub-question totals
      if (!sqTotals[sqId]) sqTotals[sqId] = { total: 0, count: 0 };
      sqTotals[sqId].total += rating;
      sqTotals[sqId].count++;
      
      // Update score distribution
      scoreDistribution[rating - 1]++;
    });
    
    // Update course breakdown
    if (!courseBreakdown[ev.courseId]) {
      courseBreakdown[ev.courseId] = { count: 0, total: 0 };
    }
    courseBreakdown[ev.courseId].count++;
    courseBreakdown[ev.courseId].total += avgRating;
  });
  
  // 4. Calculate averages
  const sqAvgs = {};
  subQuestions.forEach(sq => {
    const data = sqTotals[sq.id];
    sqAvgs[sq.id] = data ? data.total / data.count : 0;
  });
  
  const critAvgs = {};
  criteria.forEach(c => {
    const critSQs = subQuestions.filter(sq => sq.criterionId === c.id);
    critAvgs[c.id] = critSQs.reduce((sum, sq) => sum + sqAvgs[sq.id], 0) / critSQs.length;
  });
  
  const overallAvg = evals.reduce((sum, ev) => {
    const vals = Object.values(ev.ratings);
    return sum + vals.reduce((a, b) => a + b, 0) / vals.length;
  }, 0) / evals.length;
  
  // 5. Return metrics
  return {
    totalSubmissions: evals.length,
    overallAverage: overallAvg,
    criteriaAverages: critAvgs,
    subQuestionAverages: sqAvgs,
    scoreDistribution,
    feedback: evals.map(e => ({ feedback: e.feedback, courseId: e.courseId, submittedAt: e.submittedAt })),
    courseBreakdown,
  };
}
```

### 8.3 Data Persistence

**Storage Key:** `afes_data`  
**Version:** `1.0.0`

**Save Operation:**
```typescript
persistData() {
  saveToLocalStorage({
    faculty: this.faculty,
    students: this.students,
    deans: this.deans,
    cycles: this.cycles,
    criteria: this.criteria,
    subQuestions: this.subQuestions,
    evaluations: this.evaluations,
    auditLog: this.auditLog,
    trainingRecommendations: this.trainingRecommendations,
  });
}
```

**Load Operation:**
```typescript
constructor() {
  const persistedData = loadFromLocalStorage();
  if (persistedData) {
    this.faculty = persistedData.faculty;
    this.students = persistedData.students;
    // ... restore all data
    this.addAuditLog('system', 'data_restored', 'DataStore', 'Data restored from localStorage');
  } else {
    // Initialize with seed data
    this.addAuditLog('system', 'system_init', 'DataStore', 'System initialized with seed data');
  }
}
```

### 8.4 Excel Export

**Library:** ExcelJS

**Faculty Report Structure:**
```
Sheet 1: Cover
  - Faculty info
  - Summary statistics
  - Score distribution

Sheet 2: Criteria Analysis
  - Criteria averages
  - Sub-question breakdown
  - Color-coded ratings

Sheet 3: Course Performance
  - Per-course metrics
  - Submission counts
  - Average scores

Sheet 4: Student Feedback
  - PII-redacted feedback
  - Course IDs
  - Submission dates

Sheet 5: Feedback Summary
  - Total feedback count
  - Score distribution
  - Statistical analysis
```

**Dean Report Structure:**
```
Sheet 1: Department Overview
Sheet 2: Faculty Summary
Sheet 3: Criteria Performance
Sheet 4: Sub-Question Analysis
Sheet 5: Acknowledgment Compliance
Sheet 6: Course Performance
Sheet 7: Strengths & Improvements
Sheet 8: Feedback Sentiment
```

**Styling:**
```typescript
const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002366' } };
const headerFont = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
const borderStyle = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
```

### 8.5 Routing

**React Router Configuration:**
```typescript
<Routes>
  <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
  <Route path="/" element={
    <ProtectedRoute allowedRoles={['admin', 'faculty', 'student', 'dean']}>
      <DashboardRouter />
    </ProtectedRoute>
  } />
  <Route path="*" element={<Navigate to="/" />} />
</Routes>
```

**Role-Based Routing:**
```typescript
function DashboardRouter() {
  const { user } = useAuth();
  switch (user?.role) {
    case 'admin': return <AdminDashboard />;
    case 'faculty': return <FacultyDashboard />;
    case 'student': return <StudentDashboard />;
    case 'dean': return <DeanDashboard />;
    default: return <Navigate to="/login" />;
  }
}
```

---

## 9. Testing & Verification

### 9.1 Automated Testing

**Framework:** Jest + React Testing Library

**Test Coverage:**
- PII utility functions (23 tests)
- Persistence utility (13 tests)
- DataStore methods (30+ tests)
- Login component (10 tests)
- ConfirmDialog component (13 tests)

**Total:** 89+ tests

**Running Tests:**
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### 9.2 Data Verification

**Utility:** `src/utils/dataVerification.ts`

**Functions:**
- `verifyDataIntegrity()` - Checks all data is valid
- `getDataSummary()` - Returns data counts
- `logVerificationReport()` - Logs to console

**Verification Checks:**
- ✅ All evaluations have ratings
- ✅ All ratings in valid range (1-5)
- ✅ Metrics match raw evaluation data

**Console Output:**
```
=== AFES Data Verification Report ===
Timestamp: 2026-03-20T...
Total Evaluations: 57

Data Integrity:
  ✓ All evaluations have ratings: true
  ✓ All ratings in range (1-5): true
  ✓ Metrics match evaluations: true

Faculty Metrics:
  Dr. Sarah Chen (F001):
    Submissions: 14
    Overall Average: 4.47
    Verified: ✓
```

### 9.3 Manual Testing

**Test Scenarios:**

1. **Student Evaluation Flow**
   - Login as student
   - Select course
   - Rate all sub-questions
   - Submit evaluation
   - Verify success message
   - Verify course removed from dropdown

2. **Faculty Metrics Display**
   - Login as faculty
   - Verify metrics display
   - Check course filter works
   - Verify charts render correctly
   - Test acknowledgment flow

3. **Admin Operations**
   - Login as admin
   - Test all 6 tabs
   - Create/edit/remove cycles
   - Manage criteria and sub-questions
   - Generate TNA recommendations
   - View audit log

4. **Dean Dashboard**
   - Login as dean
   - Verify all sections display
   - Check faculty performance table
   - Verify course metrics
   - Test export functionality

5. **Data Persistence**
   - Make changes
   - Refresh page
   - Verify data persists
   - Test export/import
   - Test reset functionality

---

## 10. Deployment Guide

### 10.1 Development Setup

**Prerequisites:**
- Node.js 18+
- npm or yarn

**Installation:**
```bash
git clone <repository-url>
cd afes
npm install
```

**Development:**
```bash
npm run dev
```

**Build:**
```bash
npm run build
```

**Preview:**
```bash
npm run preview
```

### 10.2 Production Deployment

**Current Limitations:**
- In-memory store (no real database)
- Plain text passwords (no real authentication)
- localStorage only (no server-side persistence)

**Production Requirements:**

1. **Database Backend**
   - PostgreSQL or MongoDB
   - Migrations system
   - Backup strategy

2. **Authentication System**
   - JWT tokens
   - Password hashing (bcrypt)
   - Session management
   - OAuth/SSO integration

3. **API Layer**
   - RESTful API or GraphQL
   - Rate limiting
   - Request validation
   - Error handling

4. **Security**
   - HTTPS/SSL
   - CORS configuration
   - Input sanitization
   - SQL injection prevention
   - XSS protection

5. **Monitoring**
   - Error tracking (Sentry)
   - Performance monitoring
   - Audit log storage
   - Backup verification

### 10.3 Environment Variables

**Required:**
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=...
NODE_ENV=production
```

**Optional:**
```bash
API_RATE_LIMIT=100
SESSION_TIMEOUT=3600
LOG_LEVEL=info
```

### 10.4 Scaling Considerations

**Current Architecture:**
- Single-server, in-memory store
- Suitable for demo/prototype
- ~1000 evaluations max

**Production Architecture:**
- Load balancer
- Multiple app servers
- Database cluster
- Redis cache
- CDN for static assets

**Performance Optimization:**
- Code splitting
- Lazy loading
- Image optimization
- Database indexing
- Query optimization

---

## Appendix A: File Structure

```
afes/
├── src/
│   ├── components/
│   │   ├── Login.tsx
│   │   ├── Layout.tsx
│   │   └── ConfirmDialog.tsx
│   ├── pages/
│   │   ├── StudentDashboard.tsx
│   │   ├── FacultyDashboard.tsx
│   │   ├── AdminDashboard.tsx
│   │   └── DeanDashboard.tsx
│   ├── utils/
│   │   ├── pii.ts
│   │   ├── persistence.ts
│   │   ├── excel.ts
│   │   ├── deanReport.ts
│   │   └── dataVerification.ts
│   ├── __tests__/
│   │   ├── pii.test.ts
│   │   ├── persistence.test.ts
│   │   ├── store.test.ts
│   │   ├── Login.test.tsx
│   │   └── ConfirmDialog.test.tsx
│   ├── App.tsx
│   ├── main.tsx
│   ├── store.ts
│   ├── auth.tsx
│   ├── types.ts
│   └── index.css
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── jest.config.js
└── README.md
```

---

## Appendix B: Known Limitations

1. **In-Memory Storage**
   - Data resets on page refresh (unless localStorage used)
   - No multi-user support
   - No real database

2. **Authentication**
   - Plain text passwords
   - No real security
   - Demo only

3. **Bundle Size**
   - ~1.6MB JavaScript bundle
   - Could be optimized with code splitting

4. **Browser Support**
   - Modern browsers only
   - No IE11 support

5. **Accessibility**
   - Basic ARIA labels
   - Could be improved for screen readers

---

## Appendix C: Future Enhancements

1. **Real Database Backend**
   - PostgreSQL/MongoDB
   - API layer
   - Multi-user support

2. **Advanced Analytics**
   - Trend analysis
   - Predictive indicators
   - Heat maps

3. **Mobile App**
   - React Native
   - Offline support
   - Push notifications

4. **Integration**
   - LMS connectors (Canvas, Blackboard)
   - SSO integration
   - Webhook system

5. **AI Enhancements**
   - Real LLM integration
   - Sentiment analysis
   - Automated insights

---

**End of Documentation**

**Document Version:** 1.0.0  
**Last Updated:** 2026-03-20  
**Maintained By:** AFES Development Team
