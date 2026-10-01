# Hierarchical Selection Flow Implementation

## Overview
Implemented the professor's requested 3-tier hierarchical selection flow for student evaluations:
**Program → Subject → Professor (auto-populated and locked)**

## Changes Made

### 1. Type Definitions (`src/types.ts`)
Added new interfaces to support the hierarchical structure:

```typescript
export interface Program {
  id: string;
  name: string;
  department: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  programId: string;
  facultyId: string;
}

export interface Student {
  id: string;
  name: string;
  programId: string;        // Changed from enrolledCourses
  enrolledSubjects: string[]; // Changed from enrolledCourses
}
```

### 2. Data Store (`src/store.ts`)

#### New Seed Data
- **PROGRAMS_SEED**: 3 programs (BSCS, BSMATH, BSPHYS)
- **SUBJECTS_SEED**: 15 subjects mapped to programs and faculty
- **Updated STUDENTS_SEED**: Students now have programId and enrolledSubjects

#### New Methods
```typescript
getPrograms(): Program[]
getSubjectsByProgram(programId: string): Subject[]
getSubjectById(subjectId: string): Subject | undefined
getFacultyBySubject(subjectId: string): Faculty | undefined
isSubjectEvaluatedByStudent(studentId: string, subjectId: string): boolean
getAvailableSubjectsForStudent(studentId: string): Subject[]
```

### 3. Student Dashboard (`src/pages/StudentDashboard.tsx`)

#### New State Variables
```typescript
const [programs, setPrograms] = useState<Program[]>([]);
const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
const [selectedProgram, setSelectedProgram] = useState('');
const [selectedSubject, setSelectedSubject] = useState('');
```

#### New Handler Functions
```typescript
handleProgramSelect(programId: string)
  - Clears subject and professor selections
  - Resets ratings
  
handleSubjectSelect(subjectId: string)
  - Auto-populates professor from subject mapping
  - Locks professor field
  - Resets ratings
```

#### UI Flow
1. **Step 1**: Program dropdown (enabled)
2. **Step 2**: Subject dropdown (disabled until program selected, filtered by program)
3. **Step 3**: Professor field (disabled, auto-populated, locked after subject selection)

## Data Relationships

```
Program (BSCS)
  ├─ Subject (CS101) → Faculty (F001 - Dr. Sarah Chen)
  ├─ Subject (CS150) → Faculty (F006 - Dr. Michael Brown)
  ├─ Subject (CS201) → Faculty (F001 - Dr. Sarah Chen)
  └─ ...

Student (C24-001)
  ├─ programId: BSCS
  └─ enrolledSubjects: [CS101, CS201, MATH101]
```

## User Experience Flow

### Before (Old Flow)
1. Student sees flat list of courses
2. Selects course
3. Professor auto-populated
4. Submits evaluation

### After (New Hierarchical Flow)
1. Student selects **Program** (e.g., "BS Computer Science")
2. Student selects **Subject** from filtered list (e.g., "CS101 - Introduction to Programming")
3. **Professor auto-populates and locks** (e.g., "Dr. Sarah Chen")
4. Student completes evaluation
5. Submission links to correct Subject-Professor mapping

## Benefits

1. **Clearer Organization**: Students navigate by program first, then subject
2. **Reduced Errors**: Professor is locked, preventing mismatches
3. **Better UX**: Visual hierarchy guides students through selection
4. **Maintains Anonymity**: UUID decoupling still intact
5. **Accurate Mapping**: Evaluations correctly link Subject → Professor

## Testing Checklist

- [ ] Student can select program
- [ ] Subject dropdown filters by selected program
- [ ] Professor auto-populates when subject is selected
- [ ] Professor field is locked (disabled)
- [ ] Changing program clears subject and professor
- [ ] Changing subject updates professor
- [ ] Evaluation submits with correct subject-professor mapping
- [ ] Already-evaluated subjects don't appear in dropdown
- [ ] All criteria and sub-questions display correctly
- [ ] PII detection still works
- [ ] Success/error messages display properly

## Files Modified

1. `src/types.ts` - Added Program and Subject interfaces, updated Student interface
2. `src/store.ts` - Added programs/subjects seed data, new methods for hierarchical lookup
3. `src/pages/StudentDashboard.tsx` - Implemented 3-tier selection UI and logic

## Backward Compatibility

- Legacy `getAvailableCoursesForStudent()` method updated to work with new structure
- Existing evaluation data structure unchanged (still uses courseId/facultyId)
- All existing features (PII stripping, audit logging, etc.) continue to work

## Future Enhancements

- Add program icons/logos
- Add subject descriptions
- Add professor office hours display
- Add subject prerequisites information
- Add multi-semester subject selection
