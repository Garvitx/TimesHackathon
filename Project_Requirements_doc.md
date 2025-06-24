## Project Requirements Document

**SnapNews** – AI-Powered News Summarizer

---

### 1. Project Overview

SnapNews is a web application that allows authenticated users (Editors and Admins) to generate, review, and manage AI-powered summaries of news articles. It comprises:

* **Frontend Admin/Editor UI**: A React-based dashboard where Editors submit article URLs or text for summarization, view past summaries, and, if an Admin, monitor system usage.
* **Backend API**: An Express.js server that handles authentication, short-lived token issuance, request validation, article fetching, AI summarization (via OpenAI), caching (Redis), persistence (Prisma), and an optional background queue.

---

### 2. Goals & Objectives

* **Accurate Summaries**

  * Provide concise, bullet-point summaries in HTML format.
* **Role-Based Access**

  * **Editors** can submit articles, view and edit summaries.
  * **Admins** can manage users and view system analytics.
* **Security & Abuse Prevention**

  * HMAC-signed tokens for summarization requests.
  * JWT-based login for user management.
  * Rate-limiting and SSRF protections.
* **Performance & Scalability**

  * Redis caching of summaries (24 hour TTL).
  * Optional BullMQ background processing for heavy workloads.

---

### 3. Scope

* **In Scope**

  * User authentication (signup, login, password reset).
  * HMAC handshake for summarization endpoint.
  * Article fetch + HTML parsing.
  * OpenAI integration for summary generation.
  * Redis caching.
  * JWT-protected Editor/Admin routes.
  * Admin dashboard with usage metrics.
  * React dashboard for Editors and Admins.

* **Out of Scope (Phase 1)**

  * Public registration.
  * Monetization/subscription flows.
  * Multi-language UI localization.
  * Offline PWA capabilities.

---

### 4. Stakeholders

* **Product Owner**: Times Group
* **Developers**: Frontend (Vite), Backend (Node.js/Express)
* **Users**:

  * **Editors**: Submit articles & manage summaries
  * **Admins**: Oversee system usage & user management

---

### 5. User Stories

1. **Editor**

   * As an Editor, I want to log in so that I can access my dashboard.
   * As an Editor, I want to submit a news article URL or paste text so that I can get an AI-generated summary.
   * As an Editor, I want to view a list of my past summaries, so I can revisit or update them.
   * As an Editor, I want to edit the title or status of a summary to mark it reviewed.

2. **Admin**

   * As an Admin, I want to log in so that I can manage editor accounts.
   * As an Admin, I want to invite or deactivate Editor accounts.
   * As an Admin, I want to view usage analytics (total summaries, token costs, daily activity, top languages) to monitor system health.

---

### 6. Functional Requirements

#### 6.1 Authentication & Authorization

* **Signup** (`POST /api/auth/signup`) – Admin-only, create Editor accounts.
* **Login** (`POST /api/auth/login`) – Returns JWT.
* **Password Reset**

  * Request (`POST /api/auth/forgot-password`) sends email with reset link.
  * Reset (`POST /api/auth/reset-password`) validates JWT token and updates password.
* **JWT Middleware** – Protects `/api/editor/*` and `/api/admin/*` routes based on roles.

#### 6.2 Summarization Flow

* **Handshake Token** (`GET /api/key`) – Rate-limited HMAC token issuance (10/min).
* **Summarize** (`POST /api/summarize`) – Requires valid `X-Access-Token`.

  * Validate token signature & TTL.
  * Rate-limit (100/hr per token).
  * Validate URL (no private IPs).
  * Check Redis cache; if hit, return cached summary.
  * Fetch & parse article via Axios + HTML parser.
  * Detect language.
  * Call OpenAI Chat Completion for summary HTML.
  * Upsert summary record (Prisma).
  * Cache result in Redis (24 hr).
  * Return `summary_html`, metadata, and `cached` flag.

#### 6.3 Editor Dashboard (Frontend)

* **Summary List View** – Paginated table of summaries with status, timestamps.
* **Submit Summary** – Form to input URL or text, submit, and view pending progress.
* **Summary Detail & Edit** – Display HTML summary, allow editing of title/status.

#### 6.4 Admin Dashboard (Frontend)

* **User Management** – List, add, deactivate Editor accounts.
* **Analytics Overview**

  * Total summaries generated.
  * Total OpenAI tokens & estimated cost.
  * Summaries per day chart (last 7 days).
  * Top 5 languages breakdown.

---

### 7. Non-Functional Requirements

* **Performance**

  * Summaries served from cache within <100 ms when cached.
  * Average summarization end-to-end <3 s (excluding extremely long articles).
* **Scalability**

  * Stateless API instances behind load balancer.
  * Shared Redis for cache & rate-limiting.
  * Background worker scaled separately.
* **Reliability**

  * Health check endpoint (`GET /health`) for DB and Redis.
  * Error handling middleware catches and logs server errors.
* **Security**

  * HMAC tokens for public summarization.
  * JWT secrets must be configured; process exits if missing.
  * CORS restricted to known origins.
  * SSRF prevention via URL validation.
  * Rate-limiting on handshake and summarization.
* **Maintainability**

  * Modular code (controllers, services, middleware).
  * Clear API documentation.
  * Seed scripts for initial Admin user.

---


### 8. Technical Stack

* **Frontend**: React, React Router, Context/API or Redux, TailwindCSS or similar.
* **Backend**: Node.js, Express.js, Prisma ORM, Redis, BullMQ, OpenAI SDK, Axios, Nodemailer.
* **DB**: PostgreSQL (production) / SQLite (development).
* **CI/CD**: GitHub Actions (lint, test, deploy).
* **Hosting**: Vercel/Netlify (frontend), Heroku/DigitalOcean/AWS ECS (backend), Managed Redis & Postgres.

---

### 9. API Endpoints Summary

| Method | Path                        | Auth         | Description                            |
| ------ | --------------------------- | ------------ | -------------------------------------- |
| GET    | `/api/key`                  | Public       | Issue short-lived HMAC token           |
| POST   | `/api/auth/login`           | Public       | User login, returns JWT                |
| POST   | `/api/auth/signup`          | Admin only   | Create Editor account                  |
| POST   | `/api/auth/forgot-password` | Public       | Send password reset email              |
| POST   | `/api/auth/reset-password`  | Public       | Reset password using JWT token         |
| POST   | `/api/summarize`            | HMAC token   | Generate or retrieve cached summary    |
| GET    | `/api/editor/summaries`     | Editor/Admin | List all summaries                     |
| GET    | `/api/editor/summaries/:id` | Editor/Admin | Get summary by ID                      |
| PUT    | `/api/editor/summaries/:id` | Editor/Admin | Update title/status                    |
| GET    | `/api/admin/dashboard`      | Admin only   | Fetch usage analytics                  |
| GET    | `/health`                   | Public       | Health check (DB & Redis connectivity) |

---

### 11. UI Requirements

#### 11.1 Editor Dashboard

* **Login Page**: Email/password fields, validation errors.
* **Summary Submission Form**:

  * URL input or direct text area.
  * “Generate Summary” button with spinner.
  * Display error messages (invalid URL, token expired, rate-limit).
* **Summary List**:

  * Table with columns: ID, Title, Language, Status, Created At, Actions.
  * Action: “View/Edit”.
* **Summary Detail**:

  * Render HTML `<ul>` summary.
  * Editable title field, status dropdown (`pending`, `completed`, `failed`).
  * “Save” button.

#### 11.2 Admin Dashboard

* **User Management**:

  * List of Editors with Email, Created At, Active toggle.
  * “Invite Editor” form.
* **Analytics Panels**:

  * Total Summaries (big number).
  * Total Tokens & Cost.
  * Line chart: Summaries per Day (last 7 days).
  * Pie chart: Top 5 Languages.
* **Health Status**:

  * Indicator dots for API, Redis, DB.

---

### 12. Timeline & Milestones

| Phase             | Duration  | Deliverables                                     |
| ----------------- | --------- | ------------------------------------------------ |
| **Setup & Auth**  | 1 week    | User auth (JWT), password reset, admin seed      |
| **Summarization** | 2 weeks   | HMAC token flow, summarization endpoint, caching |
| **Frontend MVP**  | 2 weeks   | Editor UI, summary view/edit                     |
| **Admin UI**      | 1.5 weeks | User management & analytics dashboards           |
| **Testing & QA**  | 1 week    | Unit & integration tests, security review        |
| **Deployment**    | 0.5 week  | CI/CD pipelines, staging & production roll-out   |

---

### 13. Acceptance Criteria

* All functional requirements implemented and passing tests.
* Security: no SSRF, rate-limits enforced, secrets validated on startup.
* Performance: cached hits <100 ms, average cold summary <3 s.
* UI: responsive, intuitive, matches design mockups.
* Documentation: README and API docs up to date.
* Deployment: staging and production environments live.

---

> **Next Steps**:
>
> 1. Review & sign-off on requirements.
> 2. Break down into individual tasks & user stories in your project tracker.
> 3. Assign owners & begin development sprints.
