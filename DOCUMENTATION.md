# TalentPath — Comprehensive Technical Architecture & Feature Specification Document

> **Document Version:** 1.0.0  
> **Platform Name:** TalentPath  
> **Target Audience:** Developers, System Architects, Technical Evaluators, and Engineering Leads  
> **Tagline:** Practice. Compete. Evaluate. Get Hired.

---

## Table of Contents

1. [Executive Summary & Platform Overview](#1-executive-summary--platform-overview)
2. [High-Level System Architecture](#2-high-level-system-architecture)
3. [Technology Stack & Third-Party Services](#3-technology-stack--third-party-services)
4. [In-Depth Feature Analysis & Behind-The-Scenes Logic](#4-in-depth-feature-analysis--behind-the-scenes-logic)
   - [4.1 Online Compiler & Code Execution Engine (`/compiler`)](#41-online-compiler--code-execution-engine-compiler)
   - [4.2 DSA Problem Sheet & Pattern-Based Learning (`/dsasheet`, `/topics`, `/companies`)](#42-dsa-problem-sheet--pattern-based-learning-dsasheet-topics-companies)
   - [4.3 Live Coding Contests & Competitive Engine (`/contest`)](#43-live-coding-contests--competitive-engine-contest)
   - [4.4 AI Mock Interview System (`/interview`)](#44-ai-mock-interview-system-interview)
   - [4.5 Smart ATS Resume Scanner & Job Matcher (`/ats`)](#45-smart-ats-resume-scanner--job-matcher-ats)
   - [4.6 Aptitude & Assessment Engine (`/aptitude`)](#46-aptitude--assessment-engine-aptitude)
   - [4.7 Developer Career Roadmaps (`/roadmap`)](#47-developer-career-roadmaps-roadmap)
   - [4.8 Job Board & Application Portal (`/jobs`)](#48-job-board--application-portal-jobs)
   - [4.9 User Dashboard, Daily Streak & Gamification (`/dashboard`)](#49-user-dashboard-daily-streak--gamification-dashboard)
   - [4.10 Global AI Chatbot & Floating Scratchpad / Whiteboard](#410-global-ai-chatbot--floating-scratchpad--whiteboard)
   - [4.11 Admin Control Center & Content Management (`/admin`)](#411-admin-control-center--content-management-admin)
5. [Database Schema & Data Models](#5-database-schema--data-models)
6. [Authentication, Authorization & Security Architecture](#6-authentication-authorization--security-architecture)
7. [Caching, Asynchronous Queues & Rate Limiting](#7-caching-asynchronous-queues--rate-limiting)
8. [API Route Directory & Specifications](#8-api-route-directory--specifications)
9. [Deployment & Environment Configuration](#9-deployment--environment-configuration)

---

## 1. Executive Summary & Platform Overview

**TalentPath** is an enterprise-grade developer readiness and recruitment acceleration platform. It provides candidates with an end-to-end ecosystem to learn data structures and algorithms, compete in timed contests, simulate realistic AI technical and behavioral interviews, evaluate resumes against Applicant Tracking Systems (ATS), practice aptitude assessments, follow guided career roadmaps, and apply to curated tech jobs.

### Core Value Pillars
1. **Practice:** Multi-language online IDE, curated DSA problem sheets (Striver, Love Babbar, Blind 75, NeetCode), and pattern-based problem categorization.
2. **Compete:** Real-time contest arena with automated sandboxed evaluation, hidden test case verification, and dynamic penalty-based leaderboards.
3. **Simulate & Assess:** LLM-powered mock interview system (Groq/GPT-OSS) with real-time feedback, and comprehensive aptitude test suites.
4. **Optimize:** High-precision dual-pass ATS resume parser (deterministic geometry + LLM semantic analysis) matching candidates to relevant jobs.
5. **Track:** Personalized gamified dashboard with UTC-synced daily challenges, streak monitoring, mastery radar charts, and topic progress.

---

## 2. High-Level System Architecture

TalentPath is built on a modern Next.js App Router full-stack architecture running React 19 and Node.js. It integrates edge middleware, serverless API routes, asynchronous background workers, distributed Redis caching, and isolated code execution sandboxes.

```mermaid
graph TD
    User([Client Browser / Mobile]) --> |HTTPS / Next.js Client Components| EdgeMW[Next.js Edge Middleware]
    EdgeMW --> |Auth / RBAC Check| AppRouter[Next.js 15 App Router]
    
    subgraph Frontend Layer
        AppRouter --> UI[Radix UI + Tailwind CSS v4 + Framer Motion]
        AppRouter --> Monaco[Monaco Code Editor]
        AppRouter --> Canvas[HTML5 Canvas Drawing Board]
    end

    subgraph Backend / API Routes
        AppRouter --> AuthAPI[/api/auth - NextAuth.js v5/]
        AppRouter --> CompileAPI[/api/compile - Execution API/]
        AppRouter --> AIAPI[/api/ai-chat & /api/mock-interview/]
        AppRouter --> ATSAPI[/api/ats & /api/resume/]
        AppRouter --> ContestAPI[/api/contest-stats & submissions/]
        AppRouter --> DSAAPI[/api/problems & /api/dsa-stats/]
    end

    subgraph Data & Caching Layer
        AuthAPI --> Drizzle[Drizzle ORM]
        DSAAPI --> Drizzle
        ContestAPI --> Drizzle
        Drizzle --> Postgres[(Neon / PostgreSQL Database)]
        
        DSAAPI --> UpstashRedis[(Upstash Redis Cache)]
        AppRouter --> UpstashRedis
    end

    subgraph Asynchronous & Rate Limiting Layer
        CompileAPI --> RateLimiter[Upstash Sliding Window Rate Limiter]
        AuthAPI --> BullMQ[BullMQ Email Queue + Redis]
        BullMQ --> Worker[Email Background Worker]
        Worker --> MailService[Nodemailer SMTP]
    end

    subgraph External Sandboxes & AI Services
        CompileAPI --> Judge0[Judge0 CE Code Execution Sandbox]
        AIAPI --> Groq[Groq Cloud LLM - GPT-OSS-120B]
        ATSAPI --> Groq
    end
```

---

## 3. Technology Stack & Third-Party Services

| Layer | Technologies / Services | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 (App Router, Turbopack) | Hybrid SSR, Server Components, API routes, Edge Middleware |
| **Language & Runtime** | TypeScript 5, React 19, Node.js 20+ | Type safety, concurrent rendering, modern runtime |
| **Styling & Animation** | Tailwind CSS v4, Radix UI Primitives, Framer Motion, Lucide Icons | Responsive styling, accessible components, micro-interactions |
| **Code Editor** | `@monaco-editor/react`, Monaco Editor | VS Code-grade in-browser code editing with custom IntelliSense |
| **Database & ORM** | PostgreSQL, Drizzle ORM (`drizzle-kit`), Prisma (migration compatibility) | Relational persistence, strict type schemas, zero-overhead ORM |
| **Authentication** | NextAuth.js (Auth.js v5 beta), Google OAuth 2.0, Drizzle Adapter | JWT session tokens, 7-day token refresh rotation, RBAC |
| **Code Execution** | Judge0 CE (RapidAPI / Dedicated Instance) | Multi-language sandboxed compilation & test case runner |
| **AI / LLM Engine** | Groq Cloud API (`openai/gpt-oss-120b`) | Ultra-fast JSON reasoning for mock interviews, ATS & chatbot |
| **Caching & Rate Limiting** | Upstash Redis, `@upstash/ratelimit` | Sliding window compile rate limiter, dashboard & pattern cache |
| **Background Processing** | BullMQ, IORedis, Nodemailer | Async welcome emails, contest alerts, worker queues |
| **Document Processing** | `pdf2json`, `mammoth` | Resume PDF geometric parsing & DOCX raw text extraction |

---

## 4. In-Depth Feature Analysis & Behind-The-Scenes Logic

---

### 4.1 Online Compiler & Code Execution Engine (`/compiler`)

The Online Compiler is an interactive, multi-language IDE allowing developers to write, run, debug, and test code in real-time.

```mermaid
sequenceDiagram
    autonumber
    actor User as Developer (Client)
    participant Monaco as Monaco Editor / Hook
    participant Route as /api/compile
    participant Limiter as Upstash Rate Limiter
    participant Judge0 as Judge0 CE API
    
    User->>Monaco: Types code & Clicks "Run" (Ctrl+Enter)
    Monaco->>Monaco: extractPrompts() scans code for input() / cin / Scanner
    opt Interactive Prompts Found
        Monaco->>User: Prompts User for Stdin Values via Modal
        User->>Monaco: Submits Stdin data
    end
    Monaco->>Route: POST /api/compile (language, code, stdin)
    Route->>Limiter: Check 5 req / 30s sliding window
    alt Rate Limit Exceeded
        Limiter-->>Route: Reject (429 Too Many Requests)
        Route-->>User: Display Retry Warning Toast with countdown
    else Allowed
        Route->>Route: formatCode() sanitizes prompt strings from source
        Route->>Judge0: POST /submissions (code, language_id, stdin, limits)
        Judge0-->>Route: Return token
        loop Polling (Max 30 attempts, 500ms delay)
            Route->>Judge0: GET /submissions/{token}
            Judge0-->>Route: status_id (1: Queue, 2: Running, 3: Accepted, etc.)
        end
        Route-->>Monaco: Output JSON (stdout, stderr, exitCode, executionTime)
        Monaco->>User: Renders Terminal Output & Execution Stats
    end
```

#### What We Use
- **Frontend Editor:** `@monaco-editor/react` configured with custom themes (VS Code Dark, GitHub Dark, Monokai, Dracula, Light), custom syntax highlighting, and custom autocomplete completion providers (`intellisense.ts`).
- **Code Execution Sandbox:** **Judge0 CE API** (v1.13.0+) via RapidAPI with language mapping:
  - Python 3.8.1 (ID: `71`)
  - JavaScript Node.js 12.14.0 (ID: `63`)
  - Java OpenJDK 13.0.1 (ID: `62`)
  - C++ GCC 9.2.0 (ID: `54`)
  - C GCC 9.2.0 (ID: `50`)
  - Go 1.13.5 (ID: `60`)
- **Rate Limiter:** Upstash Redis Sliding Window Limiter (5 requests per 30-second window per user/IP).

#### Behind-The-Scenes Logic
1. **Dynamic Interactive Input Detection (`extractPrompts`):**
   - The client hook `useCodeEditor.ts` runs regex scanners across the active code buffer prior to execution:
     - Python: scans for `\binput\s*\(\s*(?:["']([^"']*)["'])?\s*\)` while ignoring commented lines.
     - Java: scans for `sc.next...()` and preceding `System.out.print` statements.
     - C/C++: scans for `cin >>` / `scanf` and preceding `cout` / `printf` statements.
     - Go: scans for `fmt.Scan`.
   - If inputs are detected, the editor pauses submission and renders a sleek dialog asking the user for parameter values, automatically piping them into `stdin`.
2. **Source Code Normalization (`formatCode` in `route.ts`):**
   - In standard competitive programming, interactive prompt strings (e.g. `input("Enter n: ")`) pollute raw `stdout`. The backend cleans code on the fly:
     - Replaces tabs with 4 spaces in Python.
     - Strips prompt strings inside `input(...)` to `input()`.
     - Automatically replaces public class names with `public class Main` in Java.
     - Strips prompt-printing statements directly preceding input scanners in C++, C, Java, and Go.
3. **Asynchronous Execution & Polling Lifecycle:**
   - Code is submitted to Judge0 with resource limits: `cpu_time_limit: 10s`, `wall_time_limit: 15s`, `memory_limit: 256MB`.
   - The backend polls `/submissions/{token}` every 500ms for up to 15 seconds.
   - Status codes handled:
     - `3`: Accepted (Success) — formatted and output capped to 2,000 lines.
     - `5`: Time Limit Exceeded (TLE) — formatted with optimization suggestions.
     - `6`: Compilation Error — returns compiler logs.
     - `11-14`: Runtime Errors (SIGSEGV, SIGFPE, SIGABRT, SIGXFSZ).
4. **Developer Quality-of-Life Tools:**
   - Pre-loaded snippet library (`snippets.ts`) for common algorithms (Binary Search, DFS, BFS, Kadane's, Dijkstra).
   - Custom keybindings (Ctrl+Enter / Cmd+Enter to execute).
   - Execution timer, clear terminal, download source file, and localStorage state persistence.

---

### 4.2 DSA Problem Sheet & Pattern-Based Learning (`/dsasheet`, `/topics`, `/companies`)

This module organizes thousands of coding problems across multiple views: Top SDE Sheets, Topic Categorization, Company-Wise tags, and Algorithmic Patterns.

#### What We Use
- **Database:** PostgreSQL tables `problems`, `visible_problems`, `dsa_patterns`, `pattern_problems`, `user_progress`, `dsa_topic_stats`.
- **Caching Layer:** `LimitedQueueCache` (custom Redis FIFO/LRU structure caching pattern lists).
- **ORM:** Drizzle ORM with indexed queries on slug, difficulty, platform, and company tags.

#### Behind-The-Scenes Logic
1. **Dual-Table Performance Architecture:**
   - To achieve sub-10ms response times across large problem catalogs, TalentPath uses two tables:
     - `problems`: Master raw repository.
     - `visible_problems`: Denormalized, index-optimized table with pre-parsed JSONB arrays for `topic_tags`, `company_tags`, `main_topics`, and `similar_questions`.
2. **Algorithmic Pattern Grouping (`/dsasheet/patterns`):**
   - Problems are mapped into foundational patterns (Two Pointers, Sliding Window, Fast & Slow Pointers, Merge Intervals, Monotonic Stack, Top K Elements).
   - Solved status is dynamically joined with `user_progress` for the authenticated user ID.
3. **User Progress State Machine:**
   - Tracks problem state: `solved`, `attempted`, or `bookmarked`.
   - Stores the user's latest submitted code and programming language.
   - Automatically invalidates the user's cached dashboard statistics upon solving a problem.

---

### 4.3 Live Coding Contests & Competitive Engine (`/contest`)

A competitive programming environment supporting scheduled live contests, time windows, real-time submission evaluation, and dynamic leaderboards.

```mermaid
graph TD
    Admin[Admin] --> |Creates Contest & Sets Hidden Test Cases| DBContest[(Contests DB)]
    Candidate[Candidate User] --> |Registers & Enters Contest| LiveArena[Live Contest Arena]
    LiveArena --> |Submits Solution| SubHandler[/api/contest/submit/]
    SubHandler --> Runner[Sandboxed Test Case Runner]
    
    subgraph Test Case Evaluation
        Runner --> |Run Sample Cases| TC1[Sample Test Cases]
        Runner --> |Run Hidden Cases| TC2[Hidden Test Cases]
        TC1 & TC2 --> Judge[Score & Verdict Aggregator]
    end
    
    Judge --> |Update Submission Verdict| DBSub[(Contest Submissions)]
    Judge --> |Recalculate Rank & Penalty Time| DBLead[(Contest Leaderboard)]
    DBLead --> |Live Updates| LeaderboardUI[Contest Leaderboard UI]
```

#### What We Use
- **Database:** `contests`, `contest_questions`, `contest_test_cases`, `contest_participants`, `contest_submissions`, `contest_leaderboard`.
- **Execution Sandbox:** Multi-testcase runner evaluating code against both sample and hidden test cases.

#### Behind-The-Scenes Logic
1. **Contest Lifecycle Management:**
   - States: `draft` -> `upcoming` -> `live` -> `ended`.
   - Access control: `public` contests open to all; `private` contests guarded by hashed `access_code`.
2. **Automated Submission Verdicts:**
   - Submissions are evaluated against all test cases. Points are awarded per passing test case.
   - Verdict assigned: `accepted`, `wrong_answer`, `time_limit_exceeded`, `runtime_error`, `compilation_error`.
3. **Leaderboard Ranking Algorithm:**
   - Ranked primarily by **Total Score** (descending).
   - Tie-breaking: **Total Time (Minutes) + Penalty Time** (ascending). Each wrong submission adds a configurable penalty (default: 20 minutes) if the problem is eventually solved.

---

### 4.4 AI Mock Interview System (`/interview`)

A simulated technical and behavioral interviewer providing real-time question adaptation, automated scoring, and detailed actionable feedback.

#### What We Use
- **AI Model:** **Groq Cloud API** running `openai/gpt-oss-120b` (low latency, high reasoning fidelity).
- **Backend Communication:** `src/lib/ai/groq.ts` enforcing clean JSON output schemas.
- **Database:** `mock_interviews`, `interview_questions`, `interview_transcripts`.

#### Behind-The-Scenes Logic
1. **Interview Tracks:**
   - **DSA Coding:** Live algorithm problems, edge cases, time/space complexity probing.
   - **System Design:** Scalability, database choices, load balancing, caching, and microservices architecture.
   - **Behavioral:** STAR method evaluation (Situation, Task, Action, Result) measuring leadership and communication.
   - **Company-Specific:** Tailored question banks modeled on Amazon Leadership Principles, Google Engineering Standards, Meta System Design, etc.
2. **Turn-by-Turn Adaptive Flow:**
   - The system passes the conversation transcript history to Groq.
   - The model analyzes candidate responses and dynamically decides whether to ask a follow-up question (e.g. "How would your solution handle 10 million concurrent users?") or progress to the next interview question.
3. **Post-Interview Rubric Scoring:**
   - Generates overall score (0-100), key strengths, prioritized areas of improvement, and question-by-question breakdown.

---

### 4.5 Smart ATS Resume Scanner & Job Matcher (`/ats`)

The ATS Scanner evaluates resumes using a hybrid deterministic and semantic AI architecture, comparing resumes against real job postings.

```mermaid
graph TD
    Upload[Resume Upload: PDF, DOCX, TXT] --> Extractor[Text Extractor: extract-text.ts]
    
    subgraph Extraction Pipeline
        Extractor --> |DOCX| Mammoth[Mammoth Raw Text]
        Extractor --> |PDF| PDF2JSON[pdf2json Parser]
        PDF2JSON --> |Raw Empty?| Geometric[Geometric Run Alignment Engine]
    end
    
    Extractor --> Text[Clean Normalized Text]
    
    subgraph Hybrid Evaluation
        Text --> Mech[Deterministic Mechanical Analyzer]
        Text --> Semantic[Groq AI Semantic Analyzer]
        
        Mech --> |Regex Contact Checks, Section Headings, Word Count, Action Verbs| MechScore[Deterministic Score - Max 50]
        Semantic --> |Relevance, Skill Match, Role Alignment, JD Matching| AIScore[Semantic Score - Max 50]
    end
    
    MechScore & AIScore --> Aggregator[ATS Score Calculator 0-100]
    Aggregator --> Output[Category Breakdown + Severity-Tagged Improvements]
    Output --> JobMatcher[Job Matcher: Match with Active DB Jobs]
```

#### What We Use
- **File Parsers:** `pdf2json` (pure JS PDF parsing), `mammoth` (DOCX extraction).
- **LLM Engine:** Groq API (`groqJson` utility).
- **Matching Algorithm:** Keyword vector and semantic job match scoring (`match-jobs.ts`).

#### Behind-The-Scenes Logic
1. **Geometric PDF Text Reconstruction (`textFromGeometry` in `extract-text.ts`):**
   - Standard PDF text extraction fails on multi-column resumes or complex Canva exports.
   - TalentPath inspects PDF text runs, groups them by Y-coordinates with sub-pixel tolerance (`Math.round(run.y * 4) / 4`), calculates median character advance per line, and reconstructs natural line flow and spacing.
2. **Deterministic Mechanical Pass (Stable & Explainable):**
   - **Contact Details (15 pts):** Regex validation for Email (`EMAIL`), Phone (`PHONE`), and LinkedIn/GitHub profile URLs (`LINK`).
   - **Structural Headings (15 pts):** Verifies presence of standard sections: Experience, Education, Skills, and Projects.
   - **Bullet Points & Action Verbs (10 pts):** Measures quantified bullet points and active verbs (`built`, `architected`, `optimized`, `scaled`, `delivered`).
   - **Length & Readability (10 pts):** Flags under-length (<250 words) or over-length (>1200 words) resumes.
3. **Semantic AI Pass (Context & Relevance):**
   - Evaluates relevance against user-selected job descriptions or target roles.
   - Generates actionable suggestions grouped by severity: `high`, `medium`, and `low`.
4. **Intelligent Job Matching:**
   - Cross-references parsed skills and experience with active database job listings (`jobs` table), returning percentage match scores and missing requirement highlights.

---

### 4.6 Aptitude & Assessment Engine (`/aptitude`)

A test preparation platform for quantitative aptitude, logical reasoning, verbal ability, and core computer science fundamentals.

#### What We Use
- **Database:** `questions` (Question bank with options, answers, explanations) and `aptitude_results` (User test histories).
- **Features:** Practice mode (instant answer reveal & explanations) vs. Timed Exam mode (strict timer, randomized questions, final score report).

#### Behind-The-Scenes Logic
1. **Category & Topic Filtering:**
   - Filters questions across Quantitative, Logical, Verbal, and Technical domains (OS, DBMS, Networks, OOP).
2. **Result Analytics & Persisted Scores:**
   - User answers, correct vs incorrect counts, percentage scores, and time taken (in seconds) are stored in `aptitude_results` as JSONB payloads, feeding directly into the user dashboard performance graphs.

---

### 4.7 Developer Career Roadmaps (`/roadmap`)

Guided, step-by-step career path roadmaps across Frontend, Backend, Full Stack, DevOps, AI/ML, Data Science, and Cybersecurity.

#### What We Use
- **Database:** `roadmaps`, `roadmap_steps`, `user_roadmap_progress`.
- **Logic:** Interactive checklist and milestone system tracking completed nodes via JSON array serialization in PostgreSQL, rendering real-time progress bars.

---

### 4.8 Job Board & Application Portal (`/jobs`)

A curated recruitment portal connecting candidates with internships, entry-level, and experienced software engineering positions.

#### What We Use
- **Database:** `jobs` table with indexed filters on `is_active`, `location_type` (remote, onsite, hybrid), `job_type` (full-time, part-time, internship, contract), and `company`.
- **Recruiter & Admin Workflow:** Admin review and posting controls allowing instant job creation, edit, and deactivation.

---

### 4.9 User Dashboard, Daily Streak & Gamification (`/dashboard`)

The central command center visualizing a developer's journey, daily streaks, contest ratings, and DSA mastery.

```mermaid
graph LR
    UserVisit[User Visits /dashboard] --> CacheCheck{Check Upstash Redis Cache}
    CacheCheck -- Cache Hit (TTL 1h) --> ReturnCache[Serve Cached Dashboard JSON]
    CacheCheck -- Cache Miss --> QueryDB[Execute Parallel Drizzle DB Queries]
    
    subgraph Database Queries
        QueryDB --> Q1[Fetch Daily Challenge Problem]
        QueryDB --> Q2[Fetch User Progress & Solved Stats]
        QueryDB --> Q3[Calculate Current & Max Streak]
        QueryDB --> Q4[Fetch Aptitude & Contest Records]
    end
    
    Q1 & Q2 & Q3 & Q4 --> Aggregate[Aggregate Metrics & Badges]
    Aggregate --> SaveCache[Write to Upstash Redis: dashboard:user:{id}]
    SaveCache --> RenderUI[Render Dashboard Charts & Badges]
```

#### What We Use
- **Redis Caching:** Upstash Redis with `DASHBOARD_CACHE_TTL = 3600` (1-hour cache).
- **Daily Challenge Engine:** Lazy UTC calendar calculation (`src/lib/daily-challenge.ts`).
- **Database:** `daily_challenges`, `daily_challenge_completions`, `user_progress`, `aptitude_results`.

#### Behind-The-Scenes Logic
1. **Lazy Daily Challenge Generation:**
   - Instead of running a scheduled cron job at midnight UTC, the first request on any calendar day lazily assigns a challenge problem deterministically and caches it in `daily_challenges`.
2. **Streak Computation:**
   - Compares sequential completion dates in `daily_challenge_completions` against UTC today and yesterday to maintain active streaks without timezone drift.
3. **Cached Aggregation & Auto-Invalidation:**
   - Solved problem counts, difficulty breakdown (Easy/Medium/Hard), topic mastery radar metrics, and recent activity are cached in Redis. When a user solves a problem or completes a challenge, `invalidateDashboardCache(userId)` is triggered immediately.

---

### 4.10 Global AI Chatbot & Floating Scratchpad / Whiteboard

- **AI Chatbot (`ai-chatbot.tsx`):** Persistent floating AI assistant available across all pages. Conversations are stored in `chat_conversations` and `chat_messages` tables, supporting multi-turn memory, markdown code rendering, and error debugging.
- **Notes Pad & Whiteboard (`notes-pad.tsx`):** A slide-out drawer featuring a Markdown notes editor with categorization (Code, Math, General, Ideas) and an interactive HTML5 Canvas drawing whiteboard with pen, eraser, brush, color selection, undo/redo, and full localStorage persistence.

---

### 4.11 Admin Control Center & Content Management (`/admin`)

A protected control panel accessible only by users with `role: 'admin'`.

#### Modules Included
1. **DSA Problem Manager (`/admin/dsa-management`, `/admin/dsa-questions`):** Create, update, toggle visibility, and configure topic/company tags.
2. **Contest Management (`/admin/contests`):** Create scheduled contests, configure duration, set access codes, and create questions with sample/hidden test cases.
3. **Aptitude Question Bank (`/admin/aptitude-questions`):** Add questions, options, explanations, and bulk import.
4. **Roadmap Builder (`/admin/roadmap`):** Create and sequence roadmap steps and learning resources.
5. **Job Postings (`/admin/jobs`):** Add job openings, set application URLs, and toggle listing availability.
6. **User Auditor (`/admin/viewuser`):** View registered users, roles, email verification status, and last active timestamps.

---

## 5. Database Schema & Data Models

TalentPath uses PostgreSQL managed via **Drizzle ORM** (`src/lib/db/schema.ts`). Below is the complete relational architecture:

```mermaid
erDiagram
    users ||--o{ accounts : "has"
    users ||--o{ sessions : "has"
    users ||--o{ user_progress : "tracks"
    users ||--o{ user_roadmap_progress : "tracks"
    users ||--o{ contest_participants : "joins"
    users ||--o{ contest_submissions : "submits"
    users ||--o{ aptitude_results : "completes"
    users ||--o{ mock_interviews : "takes"
    users ||--o{ chat_conversations : "creates"
    users ||--o{ daily_challenge_completions : "completes"

    problems ||--o{ user_progress : "recorded_in"
    problems ||--o{ pattern_problems : "categorized_in"
    dsa_patterns ||--o{ pattern_problems : "contains"

    contests ||--o{ contest_questions : "contains"
    contests ||--o{ contest_participants : "registers"
    contests ||--o{ contest_submissions : "receives"
    contests ||--o{ contest_leaderboard : "ranks"
    contest_questions ||--o{ contest_test_cases : "has"

    roadmaps ||--o{ roadmap_steps : "contains"
    roadmaps ||--o{ user_roadmap_progress : "tracked_by"

    mock_interviews ||--o{ interview_questions : "contains"
    mock_interviews ||--o{ interview_transcripts : "logs"

    chat_conversations ||--o{ chat_messages : "contains"
```

### Table Summary
| Table Name | Purpose & Key Columns |
| :--- | :--- |
| `user` | Stores ID, email, name, image, role (`user`\|`admin`), `last_login_at`, `last_active_at`. |
| `account` / `session` | NextAuth OAuth accounts, tokens, and active sessions. |
| `problems` | Master DSA problems with slug, difficulty, platform, topic tags, company tags, acceptance rate. |
| `visible_problems` | Optimized user-facing problem views with pre-indexed JSONB arrays for fast querying. |
| `user_progress` | User problem state (`solved`, `attempted`, `bookmarked`), submitted code, language, timestamps. |
| `dsa_patterns` / `pattern_problems` | Curated DSA patterns (Sliding Window, Two Pointers, etc.) and problem associations. |
| `contests` | Contest definitions, time windows, duration, status (`draft`, `upcoming`, `live`, `ended`), access code. |
| `contest_questions` | Questions bound to contests with points, time limits, memory limits. |
| `contest_test_cases` | Inputs, expected outputs, `is_sample`, `is_hidden`, and point weights. |
| `contest_submissions` | Submissions, user code, execution time, memory used, passed test cases, verdict. |
| `contest_leaderboard` | Live ranks, total scores, problem counts, penalty times. |
| `questions` / `aptitude_results` | Aptitude question bank and user test outcome logs with stored JSON answers. |
| `mock_interviews` | Mock interview sessions, type (DSA, System Design, Behavioral), score (0-100), feedback. |
| `interview_questions` / `interview_transcripts` | Question history and turn-by-turn interviewer/candidate dialogues. |
| `roadmaps` / `roadmap_steps` | Career tracks, ordered milestones, description, and external learning resources. |
| `jobs` | Job board postings, salary, company, requirements, location type, apply URL. |
| `daily_challenges` / `daily_challenge_completions` | UTC calendar-synced daily challenges and user completion logs. |

---

## 6. Authentication, Authorization & Security Architecture

### Authentication Mechanism
- **Provider:** NextAuth.js (Auth.js v5 beta) with Google OAuth 2.0.
- **Session Strategy:** JSON Web Tokens (JWT) with custom claims (`id`, `role`, `emailVerified`).
- **Optimization:** User data and role are cached inside the JWT on initial sign-in; tokens are refreshed on a 7-day rotation cycle to prevent database bottlenecks.

### Role-Based Access Control (RBAC) & Edge Middleware
Edge middleware (`src/middleware.ts`) secures administrative routes (`/admin/:path*`):

```typescript
// Edge Token Inspection
const token = await getToken({ 
  req: request, 
  secret: process.env.NEXTAUTH_SECRET,
  cookieName: process.env.NODE_ENV === 'production' 
    ? '__Secure-next-auth.session-token' 
    : 'next-auth.session-token'
});

// Non-admin redirect
if (String(token?.role).toLowerCase() !== 'admin') {
  return NextResponse.redirect(new URL('/', request.url));
}
```

---

## 7. Caching, Asynchronous Queues & Rate Limiting

### 1. Multi-Tier Redis Caching (`src/lib/redis.ts`)
- **Dashboard Cache (`dashboard:user:{id}`):** Stores aggregated user metrics for 1 hour (`DASHBOARD_CACHE_TTL = 3600`), invalidating automatically on code submissions.
- **Universal LimitedQueueCache:** Implements a strict FIFO/LRU eviction queue in Redis (e.g. limiting pattern cache keys to 10 entries) preventing memory bloat.

### 2. Compiler Rate Limiter (`src/lib/ratelimit.ts`)
- Utilizes `@upstash/ratelimit` with a sliding window algorithm:
  - **Limit:** 5 compilations per 30 seconds per user or IP address.
  - **Status 429:** Returns `Retry-After` headers and time remaining countdown.

### 3. Asynchronous Email Queue (`src/lib/email-queue.ts` & `src/lib/email-worker.ts`)
- **Queue Engine:** **BullMQ** backed by Redis.
- **Workers:** Asynchronously processes welcome emails, contest invitations, and reminder dispatches without blocking HTTP response cycles.
- **Serverless Fallback:** In serverless production environments, dispatches email jobs directly via Nodemailer SMTP.

---

## 8. API Route Directory & Specifications

| Endpoint | Method | Purpose & Payload |
| :--- | :--- | :--- |
| `/api/compile` | `POST` | Executes code via Judge0. Payload: `{ language, code, stdin }`. |
| `/api/ai-chat` | `POST` | Streams / returns multi-turn AI responses for the global chatbot. |
| `/api/mock-interview` | `POST` | Drives turn-by-turn mock interview dialogues and final scoring. |
| `/api/ats` | `POST` | Dual-pass ATS evaluation. Payload: `{ resumeText, jobDescription }`. |
| `/api/resume` | `POST` | Extracts text from uploaded files (PDF, DOCX, TXT). |
| `/api/problems` | `GET`, `POST` | Problem querying, filtering by difficulty/topic/company, and submission logging. |
| `/api/visible-problems` | `GET` | High-speed paginated problem retrieval from optimized table. |
| `/api/dsa-stats` | `GET` | Fetches aggregated counts and difficulty distributions. |
| `/api/patterns` | `GET` | Fetches categorized algorithmic patterns and linked problems. |
| `/api/contest-stats` | `GET` | Fetches active contest statistics and participant totals. |
| `/api/aptitude` | `GET`, `POST` | Fetches aptitude question sets and saves completed test scores. |
| `/api/jobs` | `GET`, `POST` | Job board queries and recruitment posting actions. |
| `/api/admin/*` | `GET`, `POST`, `PUT`, `DELETE` | Administrative CRUD operations for questions, contests, users, and roadmaps. |

---

## 9. Deployment & Environment Configuration

### Required Environment Variables
```env
# Database Connection
DATABASE_URL=postgresql://user:password@host:5432/talentpath?sslmode=require

# Authentication (NextAuth.js v5)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secure-nextauth-secret
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# AI Engine (Groq Cloud)
GROQ_API_KEY=your-groq-api-key

# Code Execution (Judge0 CE via RapidAPI)
RAPID_API_KEY=your-rapidapi-key

# Redis Caching & Rate Limiting (Upstash)
UPSTASH_REDIS_REST_URL1=https://your-cache-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN1=your-cache-redis-token
UPSTASH_REDIS_REST_URL2=https://your-ratelimit-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN2=your-ratelimit-redis-token

# Email & Queue (BullMQ / Nodemailer)
REDIS_URL=redis://localhost:6379
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-email-app-password
EMAIL_FROM=TalentPath <no-reply@talentpath.com>
```

---

*Document compiled and maintained by the TalentPath Core Engineering Team.*
