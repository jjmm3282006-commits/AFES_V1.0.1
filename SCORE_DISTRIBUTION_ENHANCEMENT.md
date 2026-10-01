# Score Distribution Pie Chart Enhancement

## Overview
Enhanced the Score Distribution pie chart feature to provide better visibility across all user roles and more detailed analysis for faculty members.

## Changes Made

### 1. Faculty Dashboard - Enhanced Pie Chart
**Location:** `src/pages/FacultyDashboard.tsx`

**New Features:**
- **View Toggle:** Added a dropdown selector to switch between "Overall" and individual course views
- **Dynamic Calculation:** Score distribution now calculates based on selected view:
  - **Overall:** Shows aggregated scores across all courses
  - **Per-Course:** Shows scores for a specific course (e.g., CS101, CS201, CS301)
- **Real-time Average:** Center of donut chart updates to show the average for the selected view
- **Per-Course Distribution:** Calculates score distribution from individual evaluations for each course

**Implementation Details:**
```typescript
// New state for tracking view mode
const [pieChartView, setPieChartView] = useState<string>('overall');

// Helper function to calculate score distribution
const getScoreDistribution = (courseId?: string) => {
  if (!courseId || courseId === 'all') return metrics.scoreDistribution;
  // Calculate per-course distribution from evaluations
  const evals = store.getEvaluationsForFaculty(facultyId, cycleId, courseId);
  const dist = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  evals.forEach(ev => {
    Object.values(ev.ratings).forEach(rating => {
      if (rating >= 1 && rating <= 10) dist[rating - 1]++;
    });
  });
  return dist;
};
```

**User Experience:**
1. Faculty sees the pie chart with "Overall" selected by default
2. Can switch to any specific course using the dropdown
3. Chart instantly updates to show that course's score distribution
4. Average score in the center updates accordingly
5. Percentages and counts reflect the selected view

### 2. Admin Dashboard - Institution-Wide Pie Chart
**Location:** `src/pages/AdminDashboard.tsx`

**New Features:**
- **Institution Score Distribution:** New pie chart showing overall score distribution across all faculty
- **Aggregated Data:** Combines all evaluations from all faculty members for the selected cycle
- **Consistent Design:** Uses the same donut chart style as Faculty Dashboard

**Implementation Details:**
```typescript
// Calculate institution-wide score distribution
const allEvals = store.getEvaluations().filter(e => e.cycleId === cycleId);
const institutionScoreDist = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
allEvals.forEach(ev => {
  Object.values(ev.ratings).forEach(rating => {
    if (rating >= 1 && rating <= 10) institutionScoreDist[rating - 1]++;
  });
});

// Calculate average and prepare donut data
const institutionTotalRatings = institutionScoreDist.reduce((a, b) => a + b, 0);
const institutionAvg = institutionTotalRatings > 0 
  ? institutionScoreDist.reduce((sum, count, idx) => sum + count * (idx + 1), 0) / institutionTotalRatings 
  : 0;
```

**Placement:**
- Added after "Top Rated Faculty" section
- Before "Below Benchmark" warning section
- Provides administrators with a quick visual overview of institution-wide performance

### 3. Dean Dashboard - Department Score Distribution
**Location:** `src/pages/DeanDashboard.tsx`

**New Features:**
- **Department Score Distribution:** Pie chart showing score distribution for the dean's department
- **Department-Specific:** Only shows evaluations for faculty in the dean's department
- **Consistent Design:** Matches the visual style of other dashboards

**Implementation Details:**
```typescript
// Calculate department score distribution
const deptEvals = store.getEvaluationsForDepartment(department, cycleId);
const deptScoreDist = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
deptEvals.forEach(ev => {
  Object.values(ev.ratings).forEach(rating => {
    if (rating >= 1 && rating <= 10) deptScoreDist[rating - 1]++;
  });
});

// Calculate department average
const deptTotalRatings = deptScoreDist.reduce((a, b) => a + b, 0);
const deptAvg = deptTotalRatings > 0 
  ? deptScoreDist.reduce((sum, count, idx) => sum + count * (idx + 1), 0) / deptTotalRatings 
  : 0;
```

**Placement:**
- Added after "Institution Criteria Performance" chart
- Before "Acknowledgment Compliance" section
- Provides deans with visual insight into their department's performance

## Visual Design

### Consistent Styling Across All Dashboards
- **Chart Type:** Donut chart (pie with inner radius)
- **Colors:** 
  - 9-10 (Excellent): Emerald (#2E8B57)
  - 6-8 (Good): Royal Blue (#002366)
  - 4-5 (Needs Improvement): Copper (#B87333)
  - 1-3 (Critical): Crimson (#C41E3A)
- **Center Display:** Average score with "avg score" label
- **Legend:** Shows score range, count, and percentage
- **Size:** 180x180 pixels
- **Background:** Warm Stone (#EDEBE8) card with shadow

### Score Groupings
All dashboards use the same score groupings for consistency:
- **9-10:** Excellent performance
- **6-8:** Good performance
- **4-5:** Needs improvement
- **1-3:** Critical - immediate attention needed

## Data Flow

### Dynamic Updates
All pie charts update automatically when:
- New evaluations are submitted (`submission_added` event)
- Viewing cycle is changed (`cycle_changed` event)
- Criteria or sub-questions are modified (`criteria_changed` event)

### Calculation Method
Score distributions are calculated on-demand from raw evaluation data:
1. Fetch all evaluations for the relevant scope (faculty/department/institution)
2. Filter by selected cycle
3. Iterate through all ratings in each evaluation
4. Count occurrences of each score (1-10)
5. Group into ranges (1-3, 4-5, 6-8, 9-10)
6. Calculate percentages and average

## User Benefits

### Faculty Members
- **Detailed Analysis:** Can see which courses perform better/worse
- **Targeted Improvement:** Identify specific courses needing attention
- **Data-Driven Decisions:** Make informed changes based on per-course data
- **Quick Comparison:** Easily compare overall vs individual course performance

### Administrators
- **Institution Overview:** Quick visual of overall performance distribution
- **Trend Identification:** Spot if most ratings are clustered in certain ranges
- **Strategic Planning:** Use distribution data for institution-wide initiatives
- **Communication Tool:** Visual aid for presentations and reports

### Deans
- **Department Insights:** See how their department performs overall
- **Resource Allocation:** Identify if department needs additional support
- **Benchmarking:** Compare department distribution to institution-wide
- **Reporting:** Visual data for department meetings and reviews

## Technical Notes

### Performance Considerations
- Score distributions are calculated on-demand (not cached)
- Calculations are O(n) where n = number of evaluations
- For typical dataset sizes (< 1000 evaluations), performance is negligible
- If dataset grows significantly, consider caching or memoization

### Data Consistency
- All calculations use the same score grouping logic
- Percentages always sum to 100% (or close due to rounding)
- Average calculation uses weighted mean (not simple average of averages)
- Handles edge cases (no evaluations, all same score, etc.)

### Accessibility
- Color choices meet WCAG contrast requirements
- Text labels provide context beyond color alone
- Numbers and percentages displayed for precision
- Responsive design works on mobile devices

## Future Enhancements (Not Implemented)

Potential additions for future versions:
- Export pie chart as image for reports
- Compare distributions across different cycles
- Show distribution trends over time
- Filter by specific criteria or sub-questions
- Interactive tooltips with more detailed breakdowns
- Drill-down from score range to individual evaluations
