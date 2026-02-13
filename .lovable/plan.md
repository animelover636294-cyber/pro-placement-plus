

# AI-Driven Smart Placement & Skill Development Platform — MVP Plan

## Overview
A modern SaaS-style placement platform (Notion/Linear aesthetic) with two roles — **Students** and **Admins** — built with React + Vite, Tailwind CSS, Shadcn UI, Supabase (Auth + DB + Storage), Lovable AI for feedback, and Recharts for analytics.

---

## Phase 1: Foundation & Auth

### Authentication System
- Two login flows: **Student** and **Admin**, both using Supabase Auth with email/password + OTP verification
- Role-based redirects after login (students → student dashboard, admins → admin panel)
- Forgot password flow and profile management page
- Roles stored in a dedicated `user_roles` table (not on profiles) for security

### Database Schema (Supabase)
- `profiles` — name, email, cgpa, year_of_passing, resume_url, profile_completion_percentage
- `user_roles` — user_id, role (admin/student)
- `companies` — name, eligibility criteria (JSON), skills priority, contact info
- `tests` — title, scheduled_date, duration, max_participants, question_bank (JSON), created_by
- `test_attempts` — student_id, test_id, answers, scores (JSON), passed, attempt_number, feedback
- `schedules` — test_id, student_id, status (registered/completed/missed)
- Storage bucket for resume uploads
- RLS policies on all tables for proper access control

---

## Phase 2: Admin Panel

### Admin Dashboard
- Overview cards: total students, tests scheduled, pass/fail ratio, upcoming tests
- Sidebar navigation (Shadcn Sidebar) with sections: Dashboard, Companies, Tests, Students, Analytics, Reports

### Company Management
- Add/edit/delete companies with name, eligibility criteria (min CGPA, skills cutoff, year of passing), test date, skills priority
- Company listing with search and filter

### Test Management
- Create tests: set title, date/time, duration, max participants
- Question bank editor: add questions (MCQ + coding), tag by subject/topic
- Random question selection config (e.g., 25 out of 50 using Fisher-Yates shuffle)
- Auto-evaluation setup: define correct answers, partial credit rules, pass criteria
- View test results: pass/fail breakdown, individual student scores

### Report Generation
- Generate PDF/Excel reports of passed students with names, scores, and resume links
- Downloadable directly from the admin panel

---

## Phase 3: Student Experience

### Student Dashboard
- Profile completion tracker (80% mandatory before taking tests)
- Resume upload (stored in Supabase Storage)
- View upcoming scheduled tests with countdown timers
- Past test results with score breakdowns

### Test-Taking Interface
- Fullscreen test mode with countdown timer
- Questions rendered from randomized selection
- Auto-submit on time expiry
- Maximum 2 attempts per test
- Instant results display after submission

### AI-Powered Feedback (for failed students)
- Uses Lovable AI (via edge function) to generate personalized improvement plans
- Subject-wise weakness analysis with specific resource recommendations (YouTube links, practice platforms)
- Week-by-week improvement roadmap
- Improvement score tracking across retakes

---

## Phase 4: Company Module & Analytics

### Company Portal (Admin-Managed)
- View filtered passer lists by eligibility criteria
- Comparison dashboard across students
- Bulk resume download
- Shortlisting formula: Test Score (40%) + CGPA (30%) + Improvement (30%)

### College Analytics Dashboard (Admin)
- Pass rate trends over time (line chart)
- Subject-wise weakness heatmap
- Company-wise selection stats (bar chart)
- Batch performance comparison
- All charts built with Recharts, exportable

---

## Phase 5: Notifications

### Email Notifications (via Resend)
- Test scheduled notification to eligible students
- Results available notification
- Shortlisting notification
- Implemented via Supabase Edge Functions

---

## UI/UX Design
- **Modern SaaS aesthetic** — clean layouts inspired by Notion/Linear with lots of whitespace
- **Dark/Light mode** toggle
- **Sidebar navigation** for both admin and student dashboards
- **Responsive design** — mobile-first approach, tested for iPhone viewports
- **Loading skeletons**, error handling, and **Sonner toasts** throughout
- **Progress circles** for scores and profile completion
- **Card-based layouts** for dashboard metrics

