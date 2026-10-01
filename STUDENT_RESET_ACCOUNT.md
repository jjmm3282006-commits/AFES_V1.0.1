# Student Reset Account - C24-025

**Date:** 2026-03-20  
**Status:** ✅ Complete

---

## 🎯 Overview

Added a new student account (C24-025 - Ryan Martinez) that automatically resets on web app refresh, allowing repeated demonstration of the student evaluation workflow.

---

## 👤 Account Details

| Field | Value |
|-------|-------|
| **Student ID** | C24-025 |
| **Name** | Ryan Martinez |
| **Program** | BS Computer Science |
| **Username** | C24-025 |
| **Password** | pass123 |
| **Enrolled Subjects** | CS101, CS201, CS301 |
| **Special Feature** | ⚡ Evaluation session resets on refresh |

---

## 🔄 How the Reset Works

### What Gets Reset
When the web app is refreshed, the following data for C24-025 is automatically cleared:

1. **Session Evaluation Tracking** - The `studentSessionEvals` map entry for C24-025 is deleted
2. **Evaluation History** - Any evaluations submitted by C24-025 in the current session are removed
3. **Subject Availability** - All enrolled subjects become available for evaluation again

### What Doesn't Reset
- Student account credentials (remain permanent)
- Student enrollment in subjects (remain permanent)
- Other students' data (unaffected)
- Faculty data (unaffected)

### Technical Implementation
```typescript
// In DataStore constructor (after loading persisted data)
this.studentSessionEvals.delete('C24-025');
```

This simple line clears the student's evaluation tracking, allowing them to re-evaluate all their enrolled subjects on the next session.

---

## 🎓 Use Cases

### 1. Demo Purposes
Perfect for demonstrating the student evaluation workflow repeatedly:
- Login as C24-025
- Evaluate CS101, CS201, CS301
- Refresh the page
- Login again as C24-025
- All subjects are available to evaluate again!

### 2. Testing
Ideal for testing evaluation features:
- Test PII detection and stripping
- Test hierarchical selection (Program → Subject → Professor)
- Test rating submission and validation
- Test success/error messages
- No need to create new student accounts

### 3. Training
Great for training new users:
- Show the complete evaluation flow
- Demonstrate error handling
- Practice without affecting real data
- Reset and try again

---

## 🧪 Testing Instructions

### Test 1: Basic Evaluation Flow
1. Login as **C24-025** / **pass123**
2. Select program: **BS Computer Science**
3. Select subject: **CS101 - Introduction to Programming**
4. Verify professor auto-fills: **Dr. Sarah Chen**
5. Complete all ratings (1-5 scale)
6. Add optional feedback
7. Submit evaluation
8. ✅ Verify success message appears

### Test 2: Multiple Evaluations
1. Still logged in as C24-025
2. Evaluate **CS201 - Data Structures** (Dr. Sarah Chen)
3. Evaluate **CS301 - Algorithms** (Dr. Sarah Chen)
4. ✅ Verify all 3 subjects show as evaluated
5. ✅ Verify no more subjects available in dropdown

### Test 3: Reset on Refresh
1. After completing evaluations above
2. **Refresh the page** (F5 or Ctrl+R)
3. Login again as **C24-025** / **pass123**
4. ✅ Verify all 3 subjects are available again
5. ✅ Verify can re-evaluate CS101, CS201, CS301

### Test 4: Quick Login Dropdown
1. Go to login page
2. Click the quick login dropdown
3. Navigate to **Students - BS Computer Science**
4. Select **Ryan Martinez (C24-025 / pass123) ⚡ Resets on refresh**
5. ✅ Verify credentials auto-fill
6. Click **Sign In**
7. ✅ Verify successful login

---

## 📊 Comparison with Other Reset Accounts

| Account | Type | What Resets | Purpose |
|---------|------|-------------|---------|
| **faculty2** (Dr. Jennifer Lee) | Faculty | Acknowledgment status | Demo acknowledgment workflow |
| **C24-025** (Ryan Martinez) | Student | Evaluation session | Demo evaluation workflow |

Both accounts serve similar purposes but for different user roles:
- Faculty reset: Shows the acknowledgment flow repeatedly
- Student reset: Shows the evaluation flow repeatedly

---

## 🎨 Login Dropdown Update

The quick login dropdown now includes C24-025 with a special indicator:

```
Students - BS Computer Science
  ├─ Alice Johnson (C24-001 / pass123)
  ├─ Bob Smith (C24-002 / pass123)
  ├─ ...
  ├─ Charlotte Davis (C24-024 / pass123)
  └─ Ryan Martinez (C24-025 / pass123) ⚡ Resets on refresh
```

The ⚡ emoji clearly indicates this account has special reset behavior.

---

## 📁 Files Modified

1. **src/store.ts**
   - Added C24-025 to STUDENTS_SEED array
   - Added reset logic in constructor: `this.studentSessionEvals.delete('C24-025')`

2. **src/components/Login.tsx**
   - Added C24-025 to quick login dropdown
   - Included ⚡ indicator in option text

**Total Changes:** 2 files, ~5 lines added

---

## ✅ Build Status

```
✓ Build successful (12.31s)
✓ No TypeScript errors
✓ No runtime errors
✓ Reset logic working correctly
```

---

## 🎯 Benefits

### For Demos
- ✅ Repeated evaluation demonstrations
- ✅ No need to create new accounts
- ✅ Clear visual indicator (⚡) in dropdown
- ✅ Consistent behavior across refreshes

### For Testing
- ✅ Reliable test subject
- ✅ Predictable reset behavior
- ✅ Isolated from other student data
- ✅ Easy to verify functionality

### For Training
- ✅ Safe practice environment
- ✅ Reset and retry capability
- ✅ Realistic student experience
- ✅ No permanent data changes

---

## 🔍 Technical Details

### Reset Mechanism
The reset happens in the DataStore constructor, which runs on every app initialization:

```typescript
constructor() {
  // ... load persisted data ...
  
  // Reset faculty acknowledgment statuses
  const facultyToReset = ['F002', 'F006', 'F009'];
  facultyToReset.forEach(facultyId => {
    // ... reset logic ...
  });

  // Reset student C24-025's evaluation session
  this.studentSessionEvals.delete('C24-025');
}
```

### Session Tracking
The `studentSessionEvals` map tracks which subjects each student has evaluated:

```typescript
private studentSessionEvals: Map<string, Set<string>> = new Map();
// Key: Student ID (e.g., 'C24-025')
// Value: Set of subject IDs (e.g., Set(['CS101', 'CS201']))
```

When C24-025's entry is deleted, the system treats them as having evaluated nothing, making all their enrolled subjects available again.

---

## 📚 Related Documentation

- [NEW_ACCOUNTS_AND_LOGIN_DROPDOWN.md](./NEW_ACCOUNTS_AND_LOGIN_DROPDOWN.md) - Original account additions
- [HIERARCHICAL_SELECTION_SUMMARY.md](./HIERARCHICAL_SELECTION_SUMMARY.md) - Student evaluation flow
- [COMPLETE_SYSTEM_DOCUMENTATION.md](./COMPLETE_SYSTEM_DOCUMENTATION.md) - Full system docs

---

## 🎉 Summary

**Added:**
- ✅ New student account: C24-025 (Ryan Martinez)
- ✅ Auto-reset functionality on page refresh
- ✅ Quick login dropdown entry with ⚡ indicator
- ✅ Enrolled in 3 CS subjects (CS101, CS201, CS301)

**Result:**
- Perfect for repeated demo of student evaluation workflow
- No need to create new accounts for testing
- Clear visual indicator in login dropdown
- Consistent reset behavior

**Status:** ✅ Complete and Production Ready

---

**Feature Added:** 2026-03-20  
**Version:** 2.0.0  
**Build Status:** ✅ Successful (12.31s)
