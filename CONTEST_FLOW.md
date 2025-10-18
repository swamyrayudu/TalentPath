# 🏆 Contest System - Complete User Flow

## 📋 Table of Contents
1. [Contest Creator Flow (Admin)](#contest-creator-flow-admin)
2. [Contest Participant Flow (User)](#contest-participant-flow-user)
3. [Technical Implementation](#technical-implementation)

---

## 👨‍💼 Contest Creator Flow (Admin)

### Step 1: Create Contest
**URL:** `localhost:3000/contest`

1. Click **"Create Contest"** button
2. Fill in the form:
   - ✅ Contest Title
   - ✅ Description
   - ✅ Start Time & Duration
   - ✅ Visibility (Public/Private)
   - ✅ Access Code (if Private)
3. Click **"Create Contest"**

**Result:** Contest is created and you're redirected to the contest detail page

---

### Step 2: View Contest
**URL:** `/contest/{slug}`

- See contest header with title, description, timing
- See contest timer (upcoming/live/ended status)
- See leaderboard (empty initially)
- **🎯 Key Action:** Click **"Manage Contest"** button (visible only to creator)

---

### Step 3: Manage Contest
**URL:** `/contest/{slug}/manage`

You'll see 3 tabs:

#### Tab 1️⃣: Questions
- View all questions you've added
- Click **"Test Cases"** button on any question to manage test cases
- Click **"Delete"** to remove a question

#### Tab 2️⃣: Add Question
Fill the form:
- **Question Title** (e.g., "Two Sum Problem")
- **Problem Description** (full problem statement with examples)
- **Difficulty**: EASY / MEDIUM / HARD
- **Points**: 100-1000
- **Time Limit**: 1-10 seconds
- **Memory Limit**: 128-512 MB

Click **"Add Question"**

#### Tab 3️⃣: Settings
- Share contest link
- Copy access code (for private contests)
- Delete contest

---

### Step 4: Add Test Cases
**URL:** `/contest/{slug}/manage/question/{questionId}/test-cases`

**How to get here:**
1. Go to "Questions" tab in Manage Contest
2. Click **"Test Cases"** button on any question

**Add Test Case Form:**

```
Input:
[1, 2, 3, 4]
4

Expected Output:
[0, 3]

Points: 10
✅ Sample (visible to users)
□  Hidden (for final submission only)
```

**Test Case Types:**
- **Sample Test Cases** (visible): Users see these examples
- **Hidden Test Cases**: Only used during final submission for scoring

**Best Practice:** Add 3-5 test cases:
- 2 sample (visible)
- 3-8 hidden (for actual scoring)

---

## 👥 Contest Participant Flow (User)

### Step 1: Browse Contests
**URL:** `/contest`

- See all public contests
- Each card shows:
  - Contest title & description
  - Start time & duration
  - Status (Live/Upcoming/Ended)
  - Creator name
- Click on any contest card

---

### Step 2: Join Contest
**URL:** `/contest/{slug}`

**What you see:**
- Contest header (title, timing, visibility)
- Timer showing time remaining
- Join Contest button

**Actions:**
1. Click **"Join Contest"** button
2. For private contests: Enter access code
3. You're now a participant!

---

### Step 3: View Problems
After joining, you see:
- **Problems Tab**: List of all questions
- **Leaderboard Tab**: Real-time rankings
- **My Submissions Tab**: Your submission history

Each problem shows:
- Question title
- Difficulty badge (EASY/MEDIUM/HARD)
- Points available
- Time limit
- **"SOLVE"** button

Click **"SOLVE"** on any problem

---

### Step 4: ✨ Coding Interface (Compiler Page)
**URL:** `/contest/{slug}/problem/{questionId}`

#### Left Panel (Problem Description):
```
┌─────────────────────────────────┐
│ Problem Statement               │
│                                 │
│ [Full problem description]      │
│                                 │
│ Sample Test Cases               │
│ ┌─ Example 1 ─────────────────┐ │
│ │ Input: [1,2,3,4]            │ │
│ │ Output: [0,3]               │ │
│ └─────────────────────────────┘ │
│                                 │
│ Constraints                     │
│ • Time Limit: 2s               │
│ • Memory Limit: 256MB          │
└─────────────────────────────────┘
```

#### Right Panel (Code Editor):
```
┌─────────────────────────────────┐
│ Language: [Python ▾]            │
│                                 │
│  1  def solution():             │
│  2      # Write your code here  │
│  3      pass                    │
│  4                              │
│                                 │
│ [RUN TESTS]  [SUBMIT]          │
└─────────────────────────────────┘
```

**Features:**
- Monaco Editor (VS Code editor)
- Syntax highlighting
- Language selector (Python, JavaScript, Java, C++)
- Auto-completion

---

### Step 5: Test Your Solution

#### Option 1: Run Tests (Sample Only)
1. Write your code
2. Click **"RUN TESTS"** button
3. See results:
   ```
   Test Results (2/2 Passed)
   ✅ Test Case 1: Passed
   ✅ Test Case 2: Passed
   ```

**What it does:**
- Runs ONLY sample test cases
- Shows which tests passed/failed
- Shows expected vs actual output
- **No scoring** - just for testing

Keep testing until all samples pass!

---

#### Option 2: Submit (Full Evaluation)
1. Click **"SUBMIT"** button
2. Confirmation dialog appears
3. Your code runs against ALL test cases:
   - Sample test cases (visible)
   - Hidden test cases (secret)

**Results:**
```
┌─────────────────────────────────┐
│ 🎉 Accepted!                    │
│                                 │
│ Score: 80/100                   │
│ Test Cases: 8/10 passed         │
│ Execution Time: 0.42s           │
└─────────────────────────────────┘
```

**Possible Verdicts:**
- ✅ **Accepted**: All test cases passed
- ❌ **Wrong Answer**: Logic error
- ⏱️ **Time Limit Exceeded**: Too slow
- 💥 **Runtime Error**: Crash/exception
- 🔧 **Compilation Error**: Syntax error

---

### Step 6: View Leaderboard
**URL:** Back to `/contest/{slug}` → Leaderboard tab

```
┌─────────────────────────────────────────────┐
│  Rank  User        Score  Solved  Time      │
├─────────────────────────────────────────────┤
│  🥇 1  Alice       850    5/5     45m        │
│  🥈 2  Bob         720    4/5     67m        │
│  🥉 3  Charlie     680    4/5     82m        │
│     4  You         540    3/5     95m        │
└─────────────────────────────────────────────┘
```

**Ranking based on:**
1. Total score (primary)
2. Number of problems solved
3. Total time taken (tiebreaker)

**Updates in real-time** as people submit solutions!

---

## 🛠️ Technical Implementation

### File Structure
```
src/
├── app/
│   └── contest/
│       ├── page.tsx                    # Contest listing
│       └── [slug]/
│           ├── page.tsx                # Contest detail (with Manage button)
│           ├── manage/
│           │   ├── page.tsx           # Contest management
│           │   └── question/
│           │       └── [questionId]/
│           │           └── test-cases/
│           │               └── page.tsx  # Test case manager
│           └── problem/
│               └── [questionId]/
│                   └── page.tsx        # Coding interface
│
├── components/
│   └── contest/
│       ├── contest-card.tsx           # Contest card in listing
│       ├── contest-header.tsx         # Contest header info
│       ├── contest-timer.tsx          # Live countdown timer
│       ├── join-contest-button.tsx    # Join contest functionality
│       ├── questions-list.tsx         # Problems list for participants
│       ├── leaderboard.tsx            # Real-time leaderboard
│       ├── problem-solver.tsx         # Code editor + test runner
│       │
│       ├── contest-management-tabs.tsx      # 3 tabs: Questions/Add/Settings
│       ├── add-question-form.tsx            # Add new question
│       ├── question-management-list.tsx     # Manage questions
│       ├── test-case-manager.tsx            # Add/delete test cases
│       └── contest-settings.tsx             # Share/delete contest
│
└── actions/
    └── contest.actions.ts             # All server actions
```

### Key Features

✅ **User Authentication**
- Only creators can manage contests
- Users must join to participate
- Session-based access control

✅ **Real-time Updates**
- Live countdown timer
- Dynamic leaderboard
- Contest status (upcoming/live/ended)

✅ **Code Execution**
- Sample test runs (visible test cases)
- Full submission (all test cases)
- Multiple language support
- Time/memory limit enforcement

✅ **Scoring System**
- Points per problem
- Partial scoring (based on passed test cases)
- Leaderboard ranking
- Time-based tiebreakers

✅ **Security**
- Private contests with access codes
- Creator-only management access
- Hidden test cases
- Server-side validation

---

## 🎯 Quick Reference

### For Contest Creators:
1. `/contest` → Create Contest
2. `/contest/{slug}` → Click "Manage Contest"
3. `/contest/{slug}/manage` → Add Questions & Test Cases
4. Share contest link with participants

### For Participants:
1. `/contest` → Browse contests
2. `/contest/{slug}` → Join contest
3. `/contest/{slug}/problem/{id}` → Solve problems
4. Check leaderboard for rankings

---

## 🚀 Getting Started

1. **Run the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   ```
   http://localhost:3000/contest
   ```

3. **Create your first contest!**

---

Made with ❤️ for competitive programming enthusiasts
