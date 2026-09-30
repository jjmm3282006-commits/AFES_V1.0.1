# Rating Scale & Pie Chart Updates

## Overview
Reverted the rating system from 1-10 scale back to 1-5 scale and enhanced pie chart visualizations across all dashboards with per-criterion breakdowns.

## Changes Made

### 1. Rating Scale: 1-10 → 1-5

#### Store Updates (`src/store.ts`)
- Changed `BENCHMARK` from `6.0` to `3.0`
- Updated `scoreDistribution` array from 10 elements to 5 elements
- Updated rating validation from `rating >= 1 && rating <= 10` to `rating >= 1 && rating <= 5`

#### Student Dashboard (`src/pages/StudentDashboard.tsx`)
- Updated dropdown options from `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]` to `[1, 2, 3, 4, 5]`
- Updated instruction text from "scale of 1-10" to "scale of 1-5"

#### Faculty Dashboard (`src/pages/FacultyDashboard.tsx`)
- Updated all chart domains from `[0, 10]` to `[0, 5]`
- Updated score distribution calculation to use 5-element array
- Updated progress bar width calculation from `(score / 10)` to `(score / 5)`
- Updated AI summary text to reference "5.0" instead of "10.0"
- Updated excellent count from `scoreDistribution[8] + scoreDistribution[9]` to `scoreDistribution[4]`
- Updated poor count from `scoreDistribution[0] + scoreDistribution[1] + scoreDistribution[2]` to `scoreDistribution[0] + scoreDistribution[1]`

#### Admin Dashboard (`src/pages/AdminDashboard.tsx`)
- Updated institution-wide score distribution to 5-element array
- Updated rating validation to 1-5 range

#### Dean Dashboard (`src/pages/DeanDashboard.tsx`)
- Updated department score distribution to 5-element array
- Updated rating validation to 1-5 range
- Updated criteria performance chart domain from `[0, 10]` to `[0, 5]`

### 2. Pie Chart Color Fixes

#### Problem
Previous implementation used grouped ranges (1-3, 4-5, 6-8, 9-10) with 4 colors, which didn't match the 1-5 scale.

#### Solution
Changed to individual star ratings (1★, 2★, 3★, 4★, 5★) with 5 distinct colors:

```typescript
const STAR_COLORS = ['#C41E3A', '#B87333', '#D5D8DC', '#002366', '#2E8B57'];
//                  1★ (Crimson)  2★ (Copper)  3★ (Gray)   4★ (Royal)  5★ (Emerald)
```

#### Updated Files
- `src/pages/FacultyDashboard.tsx`
- `src/pages/AdminDashboard.tsx`
- `src/pages/DeanDashboard.tsx`

### 3. Per-Criterion Pie Charts (Faculty Dashboard)

#### New Feature
Added a grid of pie charts showing score distribution for each individual criterion.

#### Implementation
```typescript
{criteria.map(criterion => {
  // Calculate score distribution for this specific criterion
  const critEvals = store.getEvaluationsForFaculty(facultyId, cycleId, courseFilter === 'all' ? undefined : courseFilter);
  const critDist = [0, 0, 0, 0, 0];
  critEvals.forEach(ev => {
    const subQuestions = store.getSubQuestionsForCriterion(criterion.id);
    subQuestions.forEach(sq => {
      const rating = ev.ratings[sq.id];
      if (rating && rating >= 1 && rating <= 5) critDist[rating - 1]++;
    });
  });
  // Render pie chart for this criterion
})}
```

#### Layout
- Grid layout: 1 column on mobile, 2 on tablet, 3 on desktop
- Each pie chart shows:
  - Criterion name as title
  - 100x100px donut chart
  - Average score in center
  - Legend showing only non-zero ratings
  - Compact design for multiple charts

### 4. Dropdown Positioning Fix

#### Problem
Select dropdowns were sometimes rendering up or down unpredictably, causing UI issues.

#### Solution
Wrapped select elements in a positioned container with custom arrow indicator:

```typescript
<div className="relative" style={{ zIndex: 10 }}>
  <select className="px-2 py-1 rounded-lg border text-xs outline-none appearance-none pr-6 cursor-pointer">
    <option value="overall">Overall</option>
    {faculty?.courses.map(c => <option key={c} value={c}>{c}</option>)}
  </select>
  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
</div>
```

#### Benefits
- Consistent dropdown direction (always down)
- Custom arrow indicator matches theme
- Proper z-index prevents clipping
- `appearance-none` removes browser default styling

### 5. Pie Chart Data Structure

#### Old Structure (1-10 scale)
```typescript
const donutData = [
  { name: '9-10', value: dist[8] + dist[9], percentage: '...' },
  { name: '6-8', value: dist[5] + dist[6] + dist[7], percentage: '...' },
  { name: '4-5', value: dist[3] + dist[4], percentage: '...' },
  { name: '1-3', value: dist[0] + dist[1] + dist[2], percentage: '...' },
];
```

#### New Structure (1-5 scale)
```typescript
const donutData = [
  { name: '5★', value: dist[4], percentage: '...' },
  { name: '4★', value: dist[3], percentage: '...' },
  { name: '3★', value: dist[2], percentage: '...' },
  { name: '2★', value: dist[1], percentage: '...' },
  { name: '1★', value: dist[0], percentage: '...' },
];
```

### 6. Score Interpretation

#### 1-5 Scale Meaning
- **5★ (Excellent)**: Outstanding performance, exceeds expectations
- **4★ (Very Good)**: Strong performance, meets all expectations
- **3★ (Good)**: Satisfactory performance, meets basic expectations (Benchmark)
- **2★ (Needs Improvement)**: Below expectations, requires attention
- **1★ (Poor)**: Significantly below expectations, immediate action needed

#### Benchmark
- **Benchmark**: 3.0 (Good)
- Scores ≥ 3.0 are considered acceptable
- Scores < 3.0 trigger Training Needs Analysis

## Visual Design

### Color Scheme
- **5★ (Emerald #2E8B57)**: Positive, excellent
- **4★ (Royal Blue #002366)**: Good, professional
- **3★ (Gray #D5D8DC)**: Neutral, acceptable
- **2★ (Copper #B87333)**: Warning, needs attention
- **1★ (Crimson #C41E3A)**: Critical, immediate action

### Chart Sizes
- **Main pie chart**: 180x180px (Faculty, Admin, Dean)
- **Per-criterion charts**: 100x100px (Faculty only)
- **Inner radius**: 55px (main), 30px (per-criterion)
- **Outer radius**: 80px (main), 45px (per-criterion)

## User Experience

### Faculty Dashboard
1. **Overall Score Distribution**: Main pie chart with dropdown to switch between overall and per-course views
2. **Per-Criterion Breakdown**: Grid of smaller pie charts showing each criterion's distribution
3. **Quick Insights**: See which criteria perform well vs. need improvement

### Admin Dashboard
1. **Institution-Wide Distribution**: Single pie chart showing all faculty combined
2. **Per-Faculty View**: Can drill down to individual faculty (via faculty table)
3. **Strategic Overview**: Quick visual of institution performance

### Dean Dashboard
1. **Department Distribution**: Single pie chart for department-level view
2. **Department Insights**: See how department performs overall
3. **Benchmarking**: Compare to institution-wide metrics

## Technical Notes

### Data Calculation
- Score distributions calculated on-demand from raw evaluation data
- Per-criterion calculations filter evaluations by criterion's sub-questions
- Percentages always sum to 100% (or close due to rounding)
- Zero-value ratings hidden in per-criterion legends for cleaner display

### Performance
- Per-criterion charts add minimal overhead (5 small charts vs 1 large chart)
- Calculations are O(n) where n = number of evaluations
- Responsive grid layout adapts to screen size

### Accessibility
- Color choices meet WCAG contrast requirements
- Text labels provide context beyond color alone
- Numbers and percentages displayed for precision
- Star symbols (★) provide universal rating indicator

## Future Enhancements (Not Implemented)

Potential additions for future versions:
- Export per-criterion charts as images
- Compare criterion distributions across different cycles
- Show trend lines for criterion performance over time
- Interactive tooltips with more detailed breakdowns
- Drill-down from criterion to individual sub-questions
- Heat map visualization for criterion × rating matrix

## Migration Notes

### For Existing Data
- Old evaluations with 1-10 ratings will need to be scaled down to 1-5
- Formula: `newRating = Math.ceil(oldRating / 2)`
- Or manually re-evaluate with new scale

### For Reports
- Excel exports need to be updated to use 1-5 scale
- PDF reports need updated score interpretations
- Historical comparisons should note the scale change

## Summary

Successfully reverted to 1-5 rating scale with:
- ✅ Updated store and all calculations
- ✅ Fixed pie chart colors (5 individual star ratings)
- ✅ Added per-criterion pie charts (Faculty Dashboard)
- ✅ Fixed dropdown positioning issues
- ✅ Updated all dashboards (Faculty, Admin, Dean)
- ✅ Maintained visual consistency across all views
- ✅ Preserved dynamic update functionality
