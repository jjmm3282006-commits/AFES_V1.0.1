# Dean Report Export Feature

## Overview
The Dean dashboard now includes a professional Excel report export feature that generates a comprehensive, presentable report of the department's evaluation data for the currently viewed cycle.

## Features

### 1. Export Button
- Located in the Dean dashboard header next to the "Aggregated View Only" badge
- Green button with download icon for easy identification
- Automatically exports data for the currently selected viewing cycle

### 2. Report Structure (5 Professional Sheets)

#### Sheet 1: Department Overview
- Department name
- Evaluation period (cycle display name)
- Total faculty count
- Total submissions
- Department average score
- Report generation timestamp

#### Sheet 2: Faculty Summary
- Faculty name
- Number of submissions
- Average score (or "N/A" if below threshold)
- Performance status:
  - "Insufficient Data" (< 10 submissions)
  - "Excellent" (≥ 8.0)
  - "Good" (≥ 6.0)
  - "Below Benchmark" (< 6.0)
- Acknowledgment status

#### Sheet 3: Criteria Performance
- Each criterion name
- Department average score
- Rating classification:
  - "Excellent" (≥ 8.0)
  - "Good" (≥ 6.0)
  - "Needs Improvement" (≥ 4.0)
  - "Critical" (< 4.0)

#### Sheet 4: Sub-Question Analysis
- Hierarchical view showing criteria and their sub-questions
- Individual sub-question scores
- Detailed breakdown for deep analysis
- Color-coded headers for criteria rows

#### Sheet 5: Acknowledgment Compliance
- Count of acknowledged faculty
- Count of pending acknowledgment
- Count of pending review
- Total faculty count
- Compliance rate percentage

## Professional Formatting

### Visual Design
- **Royal Blue headers** (#002366) with white text
- **Alternating row colors** (cream #F8F6F1) for readability
- **Copper-tinted headers** (#F5E6D3) for criteria sections
- **Thin borders** on all cells
- **Color-coded scores** based on performance level

### File Naming
```
AFES_{Department}_Department_Report_{Cycle}_{Date}.xlsx
```
Example: `AFES_Computer_Science_Department_Report_AY_2025_2026_Second_Semester_2026-03-20.xlsx`

## Dynamic Data

The report reflects the currently viewed cycle:
- If viewing active cycle → exports active cycle data
- If viewing archived cycle → exports archived cycle data
- All metrics are calculated on-demand (never cached)
- Sub-question analysis includes current sub-question text (even if edited)

## Usage

1. Navigate to Dean dashboard
2. (Optional) Select a different viewing cycle from the dropdown
3. Click "Export Report" button
4. Excel file downloads automatically
5. File contains 5 professionally formatted sheets

## Privacy & Security

- **No individual student feedback** is included (privacy protected)
- **Only aggregated department-level data** is exported
- **PII is already stripped** from any feedback that might be referenced
- **Threshold protection** maintained (faculty below 10 submissions show "N/A")

## Integration with Existing Features

- ✅ Respects viewing cycle filter
- ✅ Uses current sub-question text (even if edited)
- ✅ Reflects latest acknowledgment status
- ✅ Includes current criteria and sub-questions
- ✅ Professional formatting matches Faculty/Admin exports
- ✅ UTF-8 compatible for international characters

## Example Report Contents

### Department Overview Sheet
```
AFES Department Report

Department: Computer Science
Evaluation Period: AY 2025–2026 | Second Semester
Total Faculty: 2
Total Submissions: 26
Department Average: 6.45 / 10.00
Report Generated: 3/20/2026, 2:30:45 PM
```

### Faculty Summary Sheet
```
Faculty Name          | Submissions | Average | Status          | Acknowledgment
Dr. Sarah Chen        | 14          | 8.25    | Excellent       | acknowledged
Dr. James Wilson      | 12          | 5.80    | Below Benchmark | pending_acknowledgment
```

### Criteria Performance Sheet
```
Criterion              | Department Average | Rating
Clarity                | 7.15               | Good
Pacing                 | 5.90               | Below Benchmark
Engagement             | 6.80               | Good
Assessment Fairness    | 6.50               | Good
Workload               | 6.30               | Good
```

## Technical Details

### Function Signature
```typescript
export async function exportDeanReport(
  department: string,
  cycleId?: string
): Promise<void>
```

### Dependencies
- ExcelJS library for Excel generation
- Store methods for data retrieval
- BENCHMARK and THRESHOLD constants for classification

### Error Handling
- Catches and logs export errors
- Shows user-friendly alert on failure
- Cleans up object URLs after download

## Future Enhancements (Not Implemented)

Potential additions for future versions:
- PDF export option
- Custom date range selection
- Comparison with previous cycle
- Trend analysis charts
- Department vs institution comparison
- Export scheduling (automatic weekly/monthly reports)
