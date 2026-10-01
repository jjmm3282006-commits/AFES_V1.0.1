# Dynamic Updates - Implementation Summary

## Overview
The AFES system now ensures that all data changes propagate dynamically across the entire application. When any data is modified, all relevant views update automatically without requiring manual refresh.

## Event-Driven Architecture

### Event Types
The system uses a pub/sub event system with the following event types:
- `criteria_changed` - Fired when criteria or sub-questions are added/removed/edited
- `cycle_changed` - Fired when evaluation cycles are created/activated/archived/removed
- `submission_added` - Fired when a student submits an evaluation
- `acknowledgment_changed` - Fired when faculty acknowledge their evaluation report
- `training_changed` - Fired when training recommendations are generated/edited/deleted
- `data_refresh` - Available for manual refresh triggers (not currently used)

### Store Methods & Event Emissions

All mutation methods in the store emit appropriate events:

```typescript
// Criteria Management
addCriterion() → emits 'criteria_changed'
removeCriterion() → emits 'criteria_changed'
addSubQuestion() → emits 'criteria_changed'
removeSubQuestion() → emits 'criteria_changed'
updateSubQuestion() → emits 'criteria_changed' ✅ NEW

// Cycle Management
addCycle() → emits 'cycle_changed'
activateCycle() → emits 'cycle_changed'
archiveCycle() → emits 'cycle_changed'
removeCycle() → emits 'cycle_changed'

// Evaluation Management
submitEvaluation() → emits 'submission_added'
                   → emits 'acknowledgment_changed' (if faculty was acknowledged)

// Faculty Management
acknowledgeFaculty() → emits 'acknowledgment_changed'

// Training Management
generateTrainingRecommendation() → emits 'training_changed'
updateTrainingRecommendation() → emits 'training_changed'
deleteTrainingRecommendation() → emits 'training_changed'
```

## Component Subscriptions

### Fixed Subscriptions

**FacultyDashboard** (previously missing subscriptions):
```typescript
// Now subscribes to:
- 'submission_added' ✅
- 'criteria_changed' ✅
- 'acknowledgment_changed' ✅ FIXED
- 'cycle_changed' ✅ FIXED
```

**DeanDashboard** (previously missing subscriptions):
```typescript
// Now subscribes to:
- 'submission_added' ✅
- 'acknowledgment_changed' ✅
- 'criteria_changed' ✅ FIXED
- 'cycle_changed' ✅ FIXED
```

**StudentDashboard** (already complete):
```typescript
// Subscribes to:
- 'criteria_changed' ✅
- 'cycle_changed' ✅
- 'submission_added' ✅
```

**AdminDashboard** (already complete):
```typescript
// Subscribes to:
- 'criteria_changed' ✅
- 'cycle_changed' ✅
- 'submission_added' ✅
- 'acknowledgment_changed' ✅
- 'training_changed' ✅
```

**Layout Component**:
```typescript
// Subscribes to:
- 'cycle_changed' ✅ (updates active cycle banner)
```

**Login Component**:
```typescript
// Subscribes to:
- 'cycle_changed' ✅ (updates active cycle display)
```

## Data Flow Examples

### Example 1: Editing a Sub-Question

1. Admin clicks edit button on sub-question
2. Admin modifies text and clicks Save
3. `store.updateSubQuestion(sqId, newText)` is called
4. Store updates the sub-question text
5. Store emits `'criteria_changed'` event
6. All subscribed components receive the event:
   - FacultyDashboard calls `loadData()`
   - DeanDashboard calls `loadData()`
   - AdminDashboard calls `loadData()`
   - StudentDashboard calls `loadData()`
7. Each component fetches fresh data:
   - `store.getCriteria()` - returns updated criteria
   - `store.getSubQuestions()` - returns updated sub-questions
   - `store.getFacultyMetrics()` - recalculates metrics with new data
8. UI re-renders with updated information ✅

### Example 2: Submitting an Evaluation

1. Student completes evaluation form
2. Student clicks Submit
3. `store.submitEvaluation(evalData, studentId)` is called
4. Store saves the evaluation
5. Store emits `'submission_added'` event
6. If faculty was previously acknowledged, store also emits `'acknowledgment_changed'`
7. All subscribed components receive the events
8. Metrics are recalculated:
   - Total submissions increases
   - Averages are updated
   - Score distribution changes
   - Course breakdown updates
9. UI re-renders with new metrics ✅

### Example 3: Changing Viewing Cycle

1. User selects different cycle from dropdown
2. `viewingCycleId` state updates in App.tsx
3. New `viewingCycleId` is passed to dashboard components
4. Dashboard components derive `cycleId` from `viewingCycleId`
5. `loadData()` is recreated (cycleId is in dependency array)
6. `useEffect` runs because `loadData` changed
7. `store.getFacultyMetrics(facultyId, cycleId)` fetches data for new cycle
8. UI re-renders with data from selected cycle ✅

### Example 4: Faculty Acknowledgment

1. Faculty clicks "Sign & Acknowledge"
2. Faculty enters password
3. `store.acknowledgeFaculty(facultyId, verifiedBy)` is called
4. Store updates faculty status to 'acknowledged'
5. Store records timestamp and verifier
6. Store emits `'acknowledgment_changed'` event
7. All subscribed components receive the event
8. Faculty status updates across all views:
   - FacultyDashboard shows "Acknowledged"
   - AdminDashboard shows updated status in table
   - DeanDashboard shows updated compliance gauge
9. UI re-renders ✅

## On-Demand Metric Calculation

Metrics are **not cached** - they are calculated on-demand every time they are requested:

```typescript
getFacultyMetrics(facultyId, cycleId, courseId) {
  // Fetches current evaluations
  const evals = this.getEvaluationsForFaculty(facultyId, cycleId, courseId);
  
  // Fetches current criteria and sub-questions
  const criteria = this.getCriteria();
  const subQuestions = this.getSubQuestions();
  
  // Calculates metrics from scratch
  // ... calculation logic ...
  
  return { totalSubmissions, overallAverage, criteriaAverages, ... };
}
```

This ensures that metrics always reflect the current state of the data.

## Viewing Cycle Filter

The viewing cycle filter allows users to view historical data without changing the active cycle:

1. `viewingCycleId` state is managed in `App.tsx`
2. Passed to `Layout` component for display
3. Passed to dashboard components via props
4. Each dashboard derives `cycleId` from `viewingCycleId || activeCycle?.id`
5. All data fetching uses this `cycleId`
6. When `viewingCycleId` changes, all data updates automatically

## Excel Export

The Excel export function accepts a `cycleId` parameter:

```typescript
exportFacultyReport(facultyId: string, cycleId?: string)
```

When called from dashboards, it receives the current `cycleId`, ensuring the exported data matches what's displayed on screen.

## Summary

The system is now fully dynamic:
- ✅ All mutations emit appropriate events
- ✅ All components subscribe to relevant events
- ✅ Metrics are calculated on-demand (never cached)
- ✅ Viewing cycle filter works across all dashboards
- ✅ Excel exports use current data
- ✅ Sub-questions can be edited and changes propagate everywhere
- ✅ No manual refresh required after any data change
