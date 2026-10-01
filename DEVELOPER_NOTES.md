# AFES - Developer Guide & System Insights

**Last Updated:** March 2026

---

## 🎯 Why This System Exists

AFES solves a fundamental problem: **how do you collect honest student feedback about faculty while protecting student anonymity?**

The challenge isn't just technical—it's psychological. Students won't give honest feedback if they fear retaliation or if their identity can be traced. So we built a system where:

1. **Submissions are truly anonymous** - We use UUIDs, never store student IDs with evaluations
2. **PII is automatically stripped** - Even if a student accidentally includes their name, we redact it
3. **Small classes are protected** - We don't show metrics until 10+ submissions exist (prevents identification)
4. **Audit trails exist without compromising privacy** - We log actions but never expose who submitted what

---

## 🏗️ Architecture Decisions & Why

### Why In-Memory Store Instead of a Database?

**Decision:** All data lives in a JavaScript class instance (`src/store.ts`), not a real database.

**Why:**
- This is a **demo/prototype** - we wanted zero setup friction
- Simulates real API latency (300-500ms delays) so you can test loading states
- Makes it trivial to reset state (just refresh the page)
- No need for backend infrastructure, migrations, or authentication servers

**Trade-offs:**
- Data disappears on refresh (no persistence)
- Can't scale to real production use
- All users see the same data (no multi-tenancy)

**If you want to add a database:**
- Replace `DataStore` class methods with API calls
- Keep the same method signatures so UI code doesn't change
- Add proper authentication (JWT tokens, etc.)
- Implement row-level security for multi-tenant scenarios

---

### Why Pub/Sub Event System?

**Decision:** Components subscribe to events like `submission_added`, `criteria_changed`, etc.

**Why:**
- **Reactive updates** - When a student submits an evaluation, all dashboards automatically refresh
- **Decoupled architecture** - The student dashboard doesn't need to know the admin dashboard exists
- **Simple to implement** - No need for complex state management libraries like Redux

**How it works:**
```typescript
// In a component:
useEffect(() => {
  loadData(); // Initial load
  const unsub = store.subscribe('submission_added', loadData);
  return () => unsub(); // Cleanup on unmount
}, []);
```

**Gotcha:** If you forget to unsubscribe, you'll get memory leaks and stale data. Always return the cleanup function.

---

### Why Sub-Questions Instead of Just Criteria?

**Decision:** Each criterion (e.g., "Clarity") has 3 sub-questions that students rate individually.

**Why:**
- **Granular feedback** - "Clarity" is too vague. Are students confused by lectures? Instructions? Terminology?
- **Actionable insights** - The AI can say "Students struggle with assignment instructions" instead of just "Clarity is low"
- **Better TNA recommendations** - We can target specific teaching behaviors, not just abstract qualities

**How it works:**
```
Criterion: "Clarity" (avg: 3.2)
  ├─ Sub-Q 1: "Explains concepts clearly" (avg: 3.8)
  ├─ Sub-Q 2: "Uses appropriate language" (avg: 3.1)
  └─ Sub-Q 3: "Provides clear instructions" (avg: 2.7) ← Problem!
```

**Trade-off:** More data to manage, but the insights are worth it.

---

### Why Progressive Survey Reveal?

**Decision:** Sub-questions unlock one at a time with 5-second delays.

**Why:**
- **Prevents rushing** - Students can't just click "5" for everything
- **Encourages thoughtful responses** - Forces them to consider each question
- **Reduces survey fatigue** - Breaking it into chunks feels less overwhelming

**Implementation:**
```typescript
const [unlockedSQs, setUnlockedSQs] = useState<Set<string>>(new Set());
const [countdown, setCountdown] = useState<number | null>(null);

// When student rates a sub-question:
const handleRating = (sqId: string, rating: number) => {
  setRatings(prev => ({ ...prev, [sqId]: rating }));
  
  // Find next sub-question and start countdown
  const nextSQ = subQuestions[currentIndex + 1];
  if (nextSQ && !unlockedSQs.has(nextSQ.id)) {
    setCountdown(5);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setUnlockedSQs(prevSet => new Set([...prevSet, nextSQ.id]));
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }
};
```

**Gotcha:** The timer resets if the student changes their selection. This is intentional—it prevents gaming the system.

---

### Why Course-First Selection (Not Faculty-First)?

**Decision:** Students select a course first, then the faculty is auto-bound.

**Why:**
- **Students think in courses, not faculty** - "I'm taking CS101" not "I'm being taught by Dr. Chen"
- **Prevents confusion** - Some faculty teach multiple courses; this avoids ambiguity
- **Enables enrollment validation** - We can check if the student is actually enrolled in that course

**Implementation:**
```typescript
// Student selects course
const handleCourseSelect = (courseId: string) => {
  setSelectedCourse(courseId);
  
  // Auto-bind faculty
  const course = availableCourses.find(c => c.courseId === courseId);
  if (course) {
    setBoundFacultyId(course.facultyId);
    setBoundFacultyName(course.facultyName);
  }
};
```

**Trade-off:** The faculty field is disabled (read-only), which some users find confusing. We added a note: "Select a course first..."

---

### Why AI-Generated TNA Instead of Predefined Modules?

**Decision:** Training recommendations are generated dynamically based on actual evaluation data, not selected from a dropdown.

**Why:**
- **Contextual** - "Your engagement score is 2.4 because students say lectures feel passive" is more useful than "Take Engagement Workshop 101"
- **Actionable** - Specific suggestions like "use think-pair-share techniques" vs. vague "improve engagement"
- **Editable** - Admins can override AI suggestions if they know better
- **Scalable** - No need to maintain a library of training modules

**How it works:**
```typescript
function generateTrainingRecommendation(facultyName, lowCriteria, subQuestionData) {
  // Sort by severity (lowest scores first)
  const sortedCriteria = [...lowCriteria].sort((a, b) => a.avg - b.avg);
  
  sortedCriteria.forEach(({ name, avg }) => {
    // Find which sub-questions are dragging down the score
    const lowSubQuestions = subQuestionData.find(c => c.criterionName === name)
      ?.subQuestions.filter(sq => sq.avg < 3.0);
    
    // Generate specific recommendations based on sub-question patterns
    if (lowSubQuestions.some(sq => sq.text.includes('interactive'))) {
      recommendations.push('Replace 10 minutes of lecture with active learning activities');
    }
  });
}
```

**Trade-off:** The "AI" is just a switch/case statement, not a real LLM. But it's good enough for a demo and shows the concept.

---

## 🔐 Privacy Deep Dive

### How PII Stripping Actually Works

**Location:** `src/utils/pii.ts`

**What it catches:**
- Emails: `john@example.com` → `[REDACTED_EMAIL]`
- Phone numbers: `(555) 123-4567` → `[REDACTED_PHONE]`
- Student IDs: `C24-001` → `[REDACTED_STUDENT_ID]`
- SSNs: `123-45-6789` → `[REDACTED_SSN]`
- URLs: `https://example.com` → `[REDACTED_URL]`
- Names: `John`, `Smith`, `Chen` → `[REDACTED_NAME]`

**How it works:**
```typescript
export function stripPII(text: string): string {
  let result = text;
  
  // Apply regex patterns
  PII_PATTERNS.forEach(({ pattern, replacement }) => {
    result = result.replace(pattern, replacement);
  });
  
  // Check for common names (case-insensitive, whole word)
  COMMON_NAMES.forEach(name => {
    const namePattern = new RegExp(`\\b${name}\\b`, 'gi');
    result = result.replace(namePattern, '[REDACTED_NAME]');
  });
  
  return result;
}
```

**Gotcha:** The name list is hardcoded. If a student writes "I talked to Professor Rodriguez about this," it won't be caught. You'd need NLP or a more comprehensive name database.

**Why we show PII warnings:**
- Transparency - Students should know we're redacting their feedback
- Education - Helps them understand what counts as PII
- Trust - Shows we're not secretly collecting their data

---

### Why the 10-Submission Threshold?

**Decision:** Faculty metrics only display after 10+ submissions.

**Why:**
- **Statistical significance** - 3 submissions isn't enough to draw conclusions
- **Privacy protection** - In a class of 8 students, showing "average: 4.5" makes it obvious who gave what rating
- **Prevents harassment** - Faculty can't pressure individual students to change their ratings

**Implementation:**
```typescript
getFacultyMetrics(facultyId: string, cycleId?: string): FacultyMetrics {
  const evals = this.getEvaluationsForFaculty(facultyId, cycleId);
  
  if (evals.length < 10) {
    return {
      totalSubmissions: evals.length,
      overallAverage: 0, // Not calculated
      criteriaAverages: {}, // Not calculated
      // ... other fields
    };
  }
  
  // Calculate metrics...
}
```

**UI handling:**
```typescript
if (metrics.totalSubmissions < THRESHOLD) {
  return <div>Insufficient Data ({THRESHOLD - metrics.totalSubmissions} more needed)</div>;
}
```

**Trade-off:** New faculty or small classes won't see feedback until they hit the threshold. This is intentional—we prioritize privacy over immediate feedback.

---

## 📊 Excel Export: Why It's Complex

**Location:** `src/utils/excel.ts`

**Why ExcelJS instead of a simpler library?**
- Professional styling (colors, borders, merged cells)
- Multiple sheets with different layouts
- Tab colors for easy navigation
- Handles large datasets efficiently

**The 5-sheet structure:**
1. **Cover** - Executive summary for busy administrators
2. **Criteria Analysis** - Deep dive for faculty improvement
3. **Course Performance** - Compare across courses
4. **Student Feedback** - Qualitative insights (PII-redacted)
5. **Feedback Summary** - Statistical overview

**Why color-coded scores?**
- **Emerald (≥4.0)** - Excellent, no action needed
- **Royal Blue (3.0-3.99)** - Good, minor improvements possible
- **Copper (2.0-2.99)** - Needs attention
- **Crimson (<2.0)** - Critical, immediate action required

**Dynamic data flow:**
```typescript
export async function exportFacultyReport(facultyId: string, cycleId?: string) {
  // Get data for the specific cycle
  const metrics = store.getFacultyMetrics(facultyId, cycleId);
  
  // Generate workbook
  const workbook = new ExcelJS.Workbook();
  await addCoverSheet(workbook, faculty, cycle, metrics);
  await addCriteriaSheet(workbook, metrics, criteria, subQuestions);
  // ... more sheets
  
  // Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `AFES_Report_...`;
  link.click();
}
```

**Gotcha:** ExcelJS is ~1MB. If bundle size is a concern, consider lazy-loading or switching to a lighter library like `xlsx` (SheetJS).

---

## 🎯 Common Debugging Scenarios

### "My changes aren't showing up"

**Check:**
1. Did you subscribe to the right event?
   ```typescript
   store.subscribe('submission_added', loadData); // ✓
   store.subscribe('submission_added', loadData); // ✗ Forgot to unsubscribe
   ```

2. Are you mutating state directly?
   ```typescript
   this.faculty.push(newFaculty); // ✗ Mutates original array
   this.faculty = [...this.faculty, newFaculty]; // ✓ Creates new array
   ```

3. Did you emit the event?
   ```typescript
   this.evaluations.push(evaluation);
   this.emit('submission_added'); // ← Don't forget this!
   ```

---

### "The Excel file is empty"

**Check:**
1. Is the faculty ID correct?
   ```typescript
   const faculty = store.getFacultyById(facultyId);
   if (!faculty) {
     console.error('Faculty not found:', facultyId);
     return;
   }
   ```

2. Are there evaluations for this cycle?
   ```typescript
   const metrics = store.getFacultyMetrics(facultyId, cycleId);
   console.log('Submissions:', metrics.totalSubmissions); // Should be > 0
   ```

3. Is the cycle ID valid?
   ```typescript
   const cycle = store.getCycles().find(c => c.id === cycleId);
   if (!cycle) {
     console.error('Cycle not found:', cycleId);
   }
   ```

---

### "Sub-questions aren't unlocking"

**Check:**
1. Is the countdown timer running?
   ```typescript
   console.log('Countdown:', countdown); // Should be 5, 4, 3, 2, 1, null
   ```

2. Is the sub-question ID in the unlocked set?
   ```typescript
   console.log('Unlocked:', unlockedSQs); // Should grow over time
   ```

3. Did you call `handleRating()` when the student clicks?
   ```typescript
   <button onClick={() => handleRating(sq.id, rating)}>
   ```

---

## 🚀 Performance Considerations

### Why Simulated Latency?

**Decision:** Every store method has `await this.simulateLatency()` (300-500ms delay).

**Why:**
- Tests loading states in the UI
- Simulates real-world API calls
- Prevents "it works on my machine" syndrome

**Trade-off:** Makes the demo feel slower than production would be.

**To remove for production:**
```typescript
private async simulateLatency(): Promise<void> {
  // return new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
  return Promise.resolve(); // Instant
}
```

---

### Why Not Use React Query or SWR?

**Decision:** We use plain `useState` + `useEffect` + pub/sub.

**Why:**
- Simpler to understand for developers new to the project
- No additional dependencies
- Fine for a demo with in-memory data

**When you'd want React Query:**
- Real API calls with caching
- Automatic refetching on window focus
- Optimistic updates
- Pagination and infinite scroll

---

## 💡 Design Patterns Used

### 1. Singleton Store
```typescript
class DataStore {
  // All data and methods in one place
}

export const store = new DataStore(); // Single instance
```

**Why:** Ensures all components see the same data. No need for context providers or prop drilling.

**Trade-off:** Harder to test (can't easily mock the store).

---

### 2. Immutable Updates
```typescript
// ✗ Bad - mutates original
this.faculty[0].name = 'New Name';

// ✓ Good - creates new object
this.faculty = this.faculty.map(f => 
  f.id === facultyId ? { ...f, name: 'New Name' } : f
);
```

**Why:** React relies on reference equality to detect changes. Mutating objects directly won't trigger re-renders.

---

### 3. Event-Driven Updates
```typescript
// Publisher (store):
this.evaluations.push(evaluation);
this.emit('submission_added');

// Subscriber (component):
const unsub = store.subscribe('submission_added', loadData);
```

**Why:** Decouples components. The student dashboard doesn't need to know the admin dashboard exists.

---

## 🔮 Future Enhancements & How to Implement

### Add Real Database

**Steps:**
1. Create API endpoints (REST or GraphQL)
2. Replace `DataStore` methods with `fetch()` calls
3. Add authentication (JWT, OAuth, etc.)
4. Implement row-level security for multi-tenancy
5. Add database migrations

**Example:**
```typescript
// Before:
async authenticate(username: string, password: string): Promise<User | null> {
  await this.simulateLatency();
  return this.users.find(u => u.username === username && u.password === password);
}

// After:
async authenticate(username: string, password: string): Promise<User | null> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  return response.json();
}
```

---

### Add Real LLM for TNA

**Steps:**
1. Integrate OpenAI API (or similar)
2. Send evaluation data + sub-question scores to LLM
3. Parse response and store as recommendation
4. Add error handling for API failures

**Example:**
```typescript
async generateTrainingRecommendation(facultyId: string, cycleId?: string) {
  const metrics = this.getFacultyMetrics(facultyId, cycleId);
  const lowCriteria = /* ... */;
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an educational consultant. Analyze faculty evaluation data and provide specific, actionable training recommendations.'
        },
        {
          role: 'user',
          content: `Faculty: ${faculty.name}\nLow criteria: ${JSON.stringify(lowCriteria)}\n\nProvide specific recommendations.`
        }
      ],
    }),
  });
  
  const data = await response.json();
  const recommendation = data.choices[0].message.content;
  
  // Store recommendation...
}
```

---

### Add Email Notifications

**Steps:**
1. Integrate email service (SendGrid, AWS SES, etc.)
2. Trigger emails on key events (new submission, acknowledgment due, etc.)
3. Add email preferences (opt-in/opt-out)
4. Handle email templates

**Example:**
```typescript
async submitEvaluation(data, studentId) {
  // ... existing code ...
  
  // Send notification to faculty
  await sendEmail({
    to: faculty.email,
    subject: 'New Evaluation Submitted',
    body: `A student has submitted an evaluation for your course ${data.courseId}.`,
  });
}
```

---

## 📝 Final Notes

### What Makes This System Unique

1. **Privacy-first design** - Every feature considers anonymity
2. **Granular feedback** - Sub-questions provide actionable insights
3. **AI-powered TNA** - Contextual recommendations, not generic advice
4. **Professional reporting** - Excel exports that administrators actually want to use
5. **Comprehensive audit trails** - Full transparency without compromising privacy

### Common Misconceptions

- **"Students can be identified"** - No, submissions use UUIDs and PII is stripped
- **"Small classes are unprotected"** - No, the 10-submission threshold prevents identification
- **"AI recommendations are generic"** - No, they're based on actual sub-question scores
- **"Excel exports are static"** - No, they reflect the current viewing period

### If You're Stuck

1. **Check the audit log** - It shows exactly what happened and when
2. **Review the store methods** - All data operations are in `src/store.ts`
3. **Look at the types** - `src/types.ts` defines all data structures
4. **Check the console** - Most errors are logged with context

---

**End of Developer Guide**

*This document explains the "why" behind the system. For the "what" and "how," see the code itself.*
