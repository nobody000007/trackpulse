# TrackPulse — AI-Powered Employee Training Platform

> Assign training plans, track real engagement, and keep your team on pace — all in one place.

---

## What is TrackPulse?

TrackPulse is a **SaaS training management platform** built for managers who want more than a checkbox. Instead of just marking tasks "complete", TrackPulse measures *real* engagement — how long employees spend reading documents, which resources they open, and where they fall behind.

Managers create structured training plans with phases and tasks, assign them to employees via a shareable link, and get live visibility into progress, reading time, and risk signals — without chasing people down.

---

## Key Features

### For Managers
- **AI Plan Builder** — describe a role or paste a job description; Groq AI generates a full phased training plan in seconds
- **Live Dashboard** — see every employee's progress, last activity, completion rate, and risk level at a glance
- **Engagement Analytics** — track opens, link clicks, document reading time, and scroll depth per task
- **Help Request Inbox** — employees can flag tasks they're stuck on; managers get an email + in-app notification and can reply directly
- **Work Submissions** — employees submit proof of completion (URL or description) per task; visible in manager view
- **Learning Velocity Chart** — tasks/day vs. team average over 21 days
- **Due Dates & Overdue Alerts** — per-task deadlines with countdown badges for employees

### For Employees
- **Clean Training Portal** — accessible via a unique link, no account required
- **Progress Tracking** — mark tasks in-progress or complete; progress saves automatically
- **Document Reader** — inline document content with reading time tracking
- **Link Timer** — external resources open in a tracked overlay; reading time is recorded
- **Manager Replies** — receive replies to help requests directly on the task
- **Submit Work** — attach a link or note as proof of completion

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Neon / Azure Flexible Server) |
| ORM | Prisma |
| Auth | NextAuth.js (Auth.js v5) |
| AI | Groq API (Llama 3) |
| Email | Nodemailer + Gmail SMTP |
| File Storage | Azure Blob Storage |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Runtime | Node.js via Next.js |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A PostgreSQL database (free tier on [Neon](https://neon.tech) works great)
- A [Groq](https://console.groq.com) API key (free, no credit card)
- A Gmail account for email notifications

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/trackpulse.git
cd trackpulse
npm install
```

### 2. Configure environment

Copy the example file and fill in your values:

```bash
cp .env.local.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random 32-byte base64 string |
| `NEXTAUTH_URL` | `http://localhost:3000` in dev |
| `GROQ_API_KEY` | From [console.groq.com](https://console.groq.com) |
| `GMAIL_USER` | Your Gmail address |
| `GMAIL_APP_PASSWORD` | Gmail App Password (not your login password) |
| `EMAIL_FROM` | Display name + address for outgoing emails |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Blob or local Azurite for dev |
| `AZURE_STORAGE_CONTAINER` | Blob container name |

Generate a `NEXTAUTH_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Set up the database

```bash
npx prisma db push
```

> **Note (Windows dev):** If the dev server is running, use `npx prisma db push --skip-generate` to avoid a DLL lock on the Prisma query engine binary.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the sign-up / login page.

---

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Manager dashboard (auth-protected)
│   │   ├── dashboard/        # Main overview page
│   │   ├── employees/        # Employee list + detail pages
│   │   └── plans/            # Plan list + builder + stats
│   ├── api/                  # API routes (Next.js route handlers)
│   │   ├── assignments/      # Assignment CRUD + replies
│   │   ├── notifications/    # In-app notification bell
│   │   ├── plans/            # Plan CRUD + AI generation
│   │   ├── stats/            # Dashboard stats + velocity
│   │   └── track/            # Employee-facing tracking APIs
│   └── track/[token]/        # Public employee training portal
├── backend/
│   ├── lib/                  # Prisma client, auth config, mailer
│   ├── repositories/         # Data access layer
│   └── services/             # Business logic
├── frontend/
│   ├── components/           # React components
│   └── hooks/                # Client-side data hooks
└── shared/
    └── types/                # Shared TypeScript types
prisma/
└── schema.prisma             # Database schema
```

---

## Database Schema (key models)

```
Manager ──< Plan ──< Phase ──< Task
Manager ──< Employee ──< Assignment ──< TaskProgress
Assignment ──< TrackingEvent
Assignment ──< ManagerReply
Manager ──< Notification
```

---

## Deployment

The app is a standard Next.js application and deploys to any Node.js host.

**Vercel (recommended)**
```bash
npx vercel --prod
```
Set all environment variables in the Vercel project dashboard.

**Self-hosted**
```bash
npm run build
npm start
```

---

## License

MIT — free to use, modify, and deploy.
