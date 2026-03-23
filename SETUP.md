# TrackPulse — Setup & Deployment Guide

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [What is Azure Blob Storage and Why We Use It](#3-what-is-azure-blob-storage-and-why-we-use-it)
4. [Local Development Setup](#4-local-development-setup)
5. [Azure Production Deployment](#5-azure-production-deployment)
6. [Environment Variables Reference](#6-environment-variables-reference)
7. [CI/CD with GitHub Actions](#7-cicd-with-github-actions)

---

## 1. Project Overview

TrackPulse is an AI-powered employee progress tracking platform. Managers create structured training plans (onboarding, compliance, etc.), assign them to employees via a unique shareable link, and track real engagement — document opens, read time, scroll depth, and task completion — all surfaced through AI-generated insights.

**Key concept:** Employees never log in. They receive a unique link by email and access their plan directly. Only managers have accounts.

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack React framework |
| Language | TypeScript (strict) | Type safety across the entire codebase |
| Styling | Tailwind CSS | Utility-first CSS |
| Database ORM | Prisma | Type-safe database access |
| Auth | NextAuth.js | Manager authentication (email + password) |
| AI | Groq (Llama 3) | Plan generation, pulse reports, nudge emails |
| Email | Gmail SMTP via Nodemailer | Employee invite emails |
| File Storage | Azure Blob Storage | Document and attachment uploads |
| Hosting | Azure App Service | Hosts the Next.js application |
| Database | Azure Database for PostgreSQL | Production database |
| CI/CD | GitHub Actions | Auto-deploy on push to main |

---

## 3. What is Azure Blob Storage and Why We Use It

### What is Blob Storage?

**Azure Blob Storage** is a cloud file storage service — think of it as a hard drive in the cloud that your application can read from and write to over the internet.

"Blob" stands for **Binary Large Object** — it's any file: a PDF, an image, a video, a Word document. Instead of storing files on your server's local disk (which disappears when the server restarts or scales), you store them in Blob Storage permanently.

### How it works

```
User uploads a file
        ↓
Next.js API route (/api/upload)
        ↓
UploadService reads the file bytes
        ↓
Uploads to Azure Blob Storage → gets back a public URL
        ↓
Saves the URL + metadata to PostgreSQL (Attachment table)
        ↓
Employee can access the file via the URL at any time
```

### Why TrackPulse needs it

In TrackPulse, managers can attach documents to tasks — for example:

- A PDF handbook attached to an onboarding task
- A compliance policy document attached to a training task
- A slide deck attached to a learning module

These files need to be:

1. **Stored permanently** — not lost when the server restarts
2. **Accessible by employees** — via a direct URL in their task view
3. **Separate from the database** — PostgreSQL stores metadata (filename, size, type), not the raw file bytes
4. **Scalable** — Azure Blob handles files of any size without impacting app performance

### Local vs Production

| Environment | Storage |
|---|---|
| Local development | Azurite (Microsoft's local Blob emulator) |
| Production (Azure) | Real Azure Blob Storage account |

The connection string format is identical — your code does not change between environments. You just swap the connection string in your environment variables.

---

## 4. Local Development Setup

### Prerequisites

- Node.js 20+
- Git
- A PostgreSQL database (Neon free tier recommended for local dev)
- A Google account (for Gmail SMTP)
- A Groq account (free AI API)

### Step 1 — Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/trackpulse.git
cd trackpulse
npm install
```

### Step 2 — Set up environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in each value (see [Section 6](#6-environment-variables-reference) for details).

### Step 3 — Set up the database (Neon — free)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project called `trackpulse`
3. Copy the connection string from the dashboard
4. Paste it as `DATABASE_URL` in `.env.local`
   - Remove `&channel_binding=require` if present — Prisma does not support it
   - Keep `?sslmode=require`

Run the database migration:

```bash
npx prisma generate
npx prisma db push
```

This creates all tables in your Neon database automatically from `prisma/schema.prisma`.

### Step 4 — Set up Groq AI (free)

1. Go to [console.groq.com](https://console.groq.com) and create a free account (no credit card)
2. Navigate to **API Keys** → **Create API Key**
3. Copy the key and paste it as `GROQ_API_KEY` in `.env.local`

Free tier: 14,400 requests/day — more than enough for development and demos.

### Step 5 — Set up Gmail SMTP (free)

Used to send invite emails to employees.

1. Make sure your Google account has **2-Step Verification** enabled
   - [myaccount.google.com](https://myaccount.google.com) → Security → 2-Step Verification
2. Generate an **App Password**
   - [myaccount.google.com](https://myaccount.google.com) → Security → App Passwords
   - App: `Mail` | Device: `Other` → type `TrackPulse` → Generate
3. Copy the 16-character password
4. In `.env.local`:
   ```env
   GMAIL_USER="yourgmail@gmail.com"
   GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
   EMAIL_FROM="TrackPulse <yourgmail@gmail.com>"
   ```

> **Why Gmail?** It sends to any email address (no domain required), is completely free, and allows 500 emails/day — sufficient for demos and early production.

### Step 6 — Set up local file storage (Azurite)

Azurite is Microsoft's official local emulator for Azure Blob Storage. Your code uses the exact same API — only the connection string differs.

Install and run Azurite in a separate terminal:

```bash
npx azurite --silent
```

The connection string below is the standard Azurite dev credential (same for everyone, not a secret):

```env
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OtSwDzUgJBH7oOF0ORJDK2m+mIklJjV1fW04PJH9YsBk5Pkr/zLJQ==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;"
AZURE_STORAGE_CONTAINER="dev"
```

### Step 7 — Generate a NextAuth secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and paste it as `NEXTAUTH_SECRET` in `.env.local`.

### Step 8 — Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 5. Azure Production Deployment

All production infrastructure runs on Azure. Three services are required.

### Architecture

```
GitHub (your code)
        │
        │  push to main
        ▼
GitHub Actions (CI/CD)
        │
        │  build + deploy
        ▼
Azure App Service          ←── hosts the Next.js app
        │
        ├── Azure Database for PostgreSQL   ←── stores all data
        └── Azure Blob Storage              ←── stores uploaded files
```

---

### Step 1 — Create Azure Database for PostgreSQL

1. [portal.azure.com](https://portal.azure.com) → **Create a resource** → search **Azure Database for PostgreSQL Flexible Server**
2. Fill in:
   - **Resource group:** create new → `trackpulse-rg`
   - **Server name:** `trackpulse-db`
   - **PostgreSQL version:** `16`
   - **Workload type:** Development (lowest cost)
   - **Admin username:** `trackpulse_admin`
   - **Password:** create a strong password and save it
3. **Networking tab:**
   - Connectivity method: Public access
   - Tick **Allow public access from any Azure service**
   - Add your local IP address (for running `prisma db push` from your machine)
4. Click **Review + Create** → **Create**
5. Once created → go to the resource → **Connect** → copy the connection string

Your production `DATABASE_URL`:
```
postgresql://trackpulse_admin:PASSWORD@trackpulse-db.postgres.database.azure.com/postgres?sslmode=require
```

Push the schema to production:
```bash
DATABASE_URL="your-azure-db-url" npx prisma db push
```

---

### Step 2 — Create Azure Blob Storage

1. Portal → **Create a resource** → **Storage account**
2. Fill in:
   - **Resource group:** `trackpulse-rg` (same as above)
   - **Storage account name:** `trackpulsestorage` (must be globally unique, lowercase only)
   - **Region:** same region as your App Service
   - **Performance:** Standard
   - **Redundancy:** LRS (Locally Redundant — cheapest)
3. Click **Review + Create** → **Create**
4. Once created → go to the resource → **Containers** → **+ Container**
   - Name: `prod`
   - Access level: Private
5. Go to **Access keys** → copy **Connection string** (either key1 or key2)

Your `AZURE_STORAGE_CONNECTION_STRING` is that connection string.

---

### Step 3 — Create Azure App Service

1. Portal → **Create a resource** → **Web App**
2. Fill in:
   - **Resource group:** `trackpulse-rg`
   - **Name:** `trackpulse` (becomes `trackpulse.azurewebsites.net`)
   - **Runtime stack:** Node 20 LTS
   - **Operating System:** Linux
   - **Region:** same as your other services
   - **Pricing plan:** Free F1 (for demo) or B1 (for always-on, ~$13/mo)
3. **Deployment tab:**
   - Enable **Basic Authentication**
4. Click **Review + Create** → **Create**

---

### Step 4 — Add environment variables to App Service

1. Go to your App Service → **Configuration** → **Application settings**
2. Add each variable using **+ New application setting**:

| Name | Value |
|---|---|
| `DATABASE_URL` | Your Azure PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Your generated secret |
| `NEXTAUTH_URL` | `https://trackpulse.azurewebsites.net` |
| `NEXT_PUBLIC_APP_URL` | `https://trackpulse.azurewebsites.net` |
| `GROQ_API_KEY` | Your Groq key |
| `GMAIL_USER` | Your Gmail address |
| `GMAIL_APP_PASSWORD` | Your Gmail App Password |
| `EMAIL_FROM` | `TrackPulse <yourgmail@gmail.com>` |
| `AZURE_STORAGE_CONNECTION_STRING` | Your Azure Blob connection string |
| `AZURE_STORAGE_CONTAINER` | `prod` |

3. Click **Save** at the top

---

### Step 5 — Connect GitHub to App Service (CI/CD)

1. App Service → **Deployment Center**
2. Source: **GitHub**
3. Authorize Azure to access your GitHub account
4. Select your repository and branch: `main`
5. Azure will create a GitHub Actions workflow file automatically in your repo

Then add your secrets to GitHub:

1. Your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** for each variable (same list as above)
3. Also add `AZURE_WEBAPP_PUBLISH_PROFILE`:
   - App Service → **Overview** → **Download publish profile**
   - Open the downloaded file → copy all contents
   - Paste as the value of `AZURE_WEBAPP_PUBLISH_PROFILE`

---

### Step 6 — Deploy

```bash
git add .
git commit -m "deploy: initial production deployment"
git push origin main
```

GitHub Actions will automatically:
1. Install dependencies
2. Build the Next.js app
3. Deploy to Azure App Service

Monitor progress in your GitHub repo → **Actions** tab.

Your app will be live at: `https://trackpulse.azurewebsites.net`

---

## 6. Environment Variables Reference

| Variable | Description | Where to get it |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Neon (local) / Azure PostgreSQL (prod) |
| `NEXTAUTH_SECRET` | Random secret for JWT signing | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `NEXTAUTH_URL` | Full URL of your app | `http://localhost:3000` (local) / your Azure URL (prod) |
| `NEXT_PUBLIC_APP_URL` | Public URL used in emails | Same as `NEXTAUTH_URL` |
| `GROQ_API_KEY` | Groq AI API key | [console.groq.com](https://console.groq.com) → API Keys |
| `GMAIL_USER` | Your Gmail address | Your Google account |
| `GMAIL_APP_PASSWORD` | Gmail App Password (not your real password) | Google Account → Security → App Passwords |
| `EMAIL_FROM` | Display name in emails | e.g. `TrackPulse <you@gmail.com>` |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Blob Storage connection | Azure Portal → Storage Account → Access keys |
| `AZURE_STORAGE_CONTAINER` | Blob container name | `dev` (local) / `prod` (production) |

---

## 7. CI/CD with GitHub Actions

The file `.github/workflows/azure-deploy.yml` runs on every push to `main`:

```
Push to main
     ↓
Checkout code
     ↓
Install dependencies (npm ci)
     ↓
Build Next.js (npm run build)
     ↓
Deploy to Azure App Service
```

Prisma client is generated automatically via the `postinstall` script in `package.json` — no manual step needed in CI.

To trigger a manual deployment without pushing code:
- GitHub → **Actions** → **Deploy to Azure App Service** → **Run workflow**

---

## Quick Reference Commands

```bash
# Local development
npm run dev                    # start dev server
npx azurite --silent           # start local blob storage (separate terminal)

# Database
npx prisma db push             # apply schema changes to database
npx prisma studio              # open visual database browser
npx prisma generate            # regenerate Prisma client after schema changes

# Production
git push origin main           # triggers auto-deployment via GitHub Actions
```
