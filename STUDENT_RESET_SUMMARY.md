# Student Reset Account - Quick Summary

**Date:** 2026-03-20  
**Status:** ✅ Complete

---

## 🎯 What Was Added

New student account **C24-025 (Ryan Martinez)** that automatically resets on web app refresh.

---

## 👤 Account Credentials

| Field | Value |
|-------|-------|
| **Student ID** | C24-025 |
| **Name** | Ryan Martinez |
| **Program** | BS Computer Science |
| **Username** | C24-025 |
| **Password** | pass123 |
| **Subjects** | CS101, CS201, CS301 |
| **Special** | ⚡ Resets on refresh |

---

## 🔄 How It Works

**On Page Refresh:**
1. Student's evaluation session is cleared
2. All enrolled subjects become available again
3. Can re-evaluate CS101, CS201, CS301
4. No need to create new accounts for demos

---

## 🧪 Quick Test

1. Login as **C24-025** / **pass123**
2. Evaluate all 3 subjects (CS101, CS201, CS301)
3. **Refresh the page** (F5)
4. Login again as **C24-025**
5. ✅ All subjects available again!

---

## 📁 Files Modified

- `src/store.ts` - Added student + reset logic
- `src/components/Login.tsx` - Added to dropdown with ⚡ indicator

**Build:** ✅ Successful (12.31s)

---

## 📚 Documentation

- **STUDENT_RESET_ACCOUNT.md** - Complete technical docs
- **STUDENT_RESET_SUMMARY.md** - This quick reference

---

**Status:** ✅ Ready for testing and demos
