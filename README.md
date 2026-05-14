# AlterNatives — Expert Network Service Platform

A full-stack Expert Network Service (ENS) platform for managing Clients, Experts, and Projects. Admins manage the full workflow; Experts self-register via a guided multi-step onboarding portal.

**Production**: [https://alternatives.nativeworld.com](https://alternatives.nativeworld.com)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [CI/CD & Deployment](#cicd--deployment)
- [Contributing — Issue & Commit Workflow](#contributing--issue--commit-workflow)
- [Troubleshooting](#troubleshooting)

---

## Overview

**AlterNatives** connects organisations with subject-matter experts. It has two surfaces:

| Surface | Path | Who uses it |
|---------|------|-------------|
| Admin Dashboard | `/admin/*` | Internal team — manage clients, experts, projects |
| Expert Portal | `/expert/register` | Experts — self-register and build their profile |

---

## Features

### Admin Dashboard
- **Client Management** — CRUD with multi-contact support; project count per client
- **Expert Management** — Search/filter by sector & function; CV upload & preview; LinkedIn URL
- **Project Management** — Link projects to client contacts; manage screening questions
- **Expert Shortlisting** — 13-stage status pipeline per expert-project pair
- **Activity Timeline** — Timestamped history of status changes
- **Add Expert to Project** — Client-first dropdown; projects filtered to that client's contacts
- **Master Lists** — Configurable Sector and Function lists
- **Seed / Clear Data** — One-click sample data for testing

### Expert Onboarding Portal
- **Multi-step form** with per-step URL (`?step=verification`, `?step=linkedin`, …)
- **Email verification** — 6-digit OTP (no broken link button)
- **Personal Info** — First name, last name, phone
- **LinkedIn enrichment** — LinkFinderAI API called directly from the browser; auto-populates Employment & Education
- **Work Experience & Education** — Plain-text fields (no autocomplete dropdowns); Field of Study removed
- **Resume Upload (optional)** — Parse or skip; CV saved to server and linked to expert record
- **Preview & Submit**

### Storage
- CV files saved to `/app/uploads/` on the server (local filesystem)
- Served as static files via Express at `/uploads/*`
- Falls back gracefully — no S3/Forge credentials required

---

## Tech Stack

### Frontend
- **React 19** + TypeScript
- **Tailwind CSS 4** + **shadcn/ui**
- **Wouter** for routing
- **tRPC** client for type-safe API calls
- **React Hook Form** + **Zod** validation

### Backend
- **Node.js** + **Express 4**
- **tRPC 11** — all API calls are type-safe RPC procedures
- **Drizzle ORM** — MySQL schema, migrations, query helpers
- **MySQL 8** database

### Infrastructure
| Component | Details |
|-----------|---------|
| Server | DigitalOcean Ubuntu droplet — `143.244.143.71` |
| Domain | `alternatives.nativeworld.com` (SSL via Let's Encrypt / Certbot) |
| Process manager | **PM2** (`ecosystem.config.cjs`) |
| Reverse proxy | **Nginx** → `http://127.0.0.1:3000` |
| Email | **Brevo SMTP** (`smtp-relay.brevo.com:587`) |
| File storage | Local filesystem — `/app/uploads/` |
| CI/CD | **GitHub Actions** — `deploy-production.yml` |

### External Integrations
- **LinkFinderAI** — LinkedIn profile enrichment (`https://api.linkfinderai.com`)
- **Brevo** — Transactional email (verification OTPs)

---

## Architecture

```
Browser
  │
  ├── /admin/*        → React SPA (Admin Dashboard)
  └── /expert/*       → React SPA (Expert Portal)
           │
           │  HTTPS  (Nginx → PM2 → Express)
           ▼
     Express Server  (dist/index.js, port 3000)
           │
           ├── /api/trpc/*    → tRPC Router
           │       ├── clients.*
           │       ├── experts.*
           │       ├── projects.*
           │       ├── shortlists.*
           │       ├── upload.*          (CV upload, resume parse, LinkedIn enrich)
           │       ├── expertVerification.*
           │       ├── adminAuth.*
           │       └── system.*          (seed / clear data)
           │
           ├── /uploads/*     → static files (uploaded CVs)
           └── /*             → serves dist/public/index.html (SPA fallback)
                    │
                    ▼
              MySQL 8  (localhost:3306 → alternatives_db)
```

### Key Data Relationships

```
Clients (1) ──→ (Many) ClientContacts
                              │
                              └──→ Projects
                                       │
                                       └──→ Shortlists ──→ Experts

Experts (1) ──→ (Many) ExpertEmployment
Experts (1) ──→ (Many) ExpertEducation
Experts      ──→ cvUrl / cvKey  (local file path + key)
```

### Expert Onboarding Flow

```
/expert/register?step=email
  → ?step=verification   (OTP sent via Brevo)
  → ?step=profile        (first name, last name, phone)
  → ?step=linkedin       (LinkedIn URL → LinkFinderAI → auto-fill employment/education)
  → ?step=experience     (manual add/edit employment & education)
  → ?step=resume         (PDF upload → parse → optional fill; file saved to /app/uploads)
  → ?step=preview        (review → submit → expert record created in DB)
```

### Directory Structure

```
alternative-ens/
├── client/src/
│   ├── pages/                   # Admin pages + ExpertPortal
│   ├── components/              # Reusable UI (EmploymentHistoryForm, EducationHistoryForm, …)
│   └── App.tsx                  # Routes
├── server/
│   ├── _core/                   # Express setup, static serving, env
│   ├── routers.ts               # All tRPC procedures
│   ├── db.ts                    # Drizzle queries + seed data
│   ├── storage.ts               # File storage (local FS; S3 optional)
│   ├── linkedin-enrichment.ts   # LinkFinderAI integration
│   └── email.ts                 # Brevo SMTP (OTP emails)
├── drizzle/
│   ├── schema.ts                # Database schema
│   └── migrations/              # SQL migration files
├── .github/workflows/
│   └── deploy-production.yml    # CI/CD — build → SCP → PM2 restart → close issues
└── ecosystem.config.cjs         # PM2 config (on server at /app/)
```

---

## Local Development

### Prerequisites
- Node.js v22+
- pnpm v10+ (`npm i -g pnpm`)
- MySQL 8 running locally

### Setup

```bash
git clone https://github.com/noblemavely/alternative-ens.git
cd alternative-ens
pnpm install
```

Create `.env` in the project root:

```env
DATABASE_URL=mysql://root:password@localhost:3306/alternatives_db
JWT_SECRET=any-random-secret
APP_ORIGIN=http://localhost:3000
BREVO_API_KEY=your-brevo-key
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=Alternatives Team
```

```bash
pnpm dev        # starts dev server at http://localhost:3000
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | `mysql://user:pass@host:3306/db` |
| `JWT_SECRET` | ✅ | Secret for admin JWT signing |
| `APP_ORIGIN` | ✅ | Public base URL (`https://alternatives.nativeworld.com`) |
| `BREVO_API_KEY` | ✅ | Brevo API key for email sending |
| `SMTP_FROM_EMAIL` | ✅ | Sender email address |
| `SMTP_FROM_NAME` | ✅ | Sender display name |
| `LINKEDIN_CLIENT_ID` | Optional | LinkedIn OAuth (future) |
| `LINKEDIN_CLIENT_SECRET` | Optional | LinkedIn OAuth (future) |
| `NODE_ENV` | Auto | Set to `production` by PM2 |

> **Note**: LinkFinderAI API key is embedded client-side in `ExpertPortal.tsx` (called directly from the browser to avoid server IP blocks).

---

## Database

### Schema Tables

| Table | Purpose |
|-------|---------|
| `users` | Admin accounts (bcrypt password) |
| `clients` | Client organisations |
| `clientContacts` | Contacts within each client |
| `experts` | Expert profiles + `cvUrl` / `cvKey` |
| `expertEmployment` | Employment history |
| `expertEducation` | Education history |
| `expertVerification` | OTP tokens for email verification |
| `projects` | Projects linked to `clientContactId` |
| `screeningQuestions` | Per-project screening questions |
| `shortlists` | Expert↔Project with 13-stage status |
| `sectors` | Master sector list |
| `functions` | Master function list |

### Migrations

Migrations in `drizzle/migrations/` are applied automatically on startup. The app calls `initializeSchema()` which creates tables and the default admin user if they don't exist.

### Seed Data

From the Admin Dashboard → click **"Seed Sample Data"**, or via tRPC:

```bash
curl -X POST https://alternatives.nativeworld.com/api/trpc/system.seedDatabase \
  -H "Content-Type: application/json" -d '{"json":{}}'
```

Seeds: 3 company clients, contacts, 5 experts with employment/education, 6 projects, shortlists.

---

## CI/CD & Deployment

### How it works

Every push to `main`:

1. **Build** — `pnpm install && pnpm build`
2. **Upload** — `scp dist/ root@143.244.143.71:/app/`
3. **Config** — Regenerate `/app/ecosystem.config.cjs` from GitHub secrets
4. **Restart** — `pm2 restart ecosystem.config.cjs --update-env`
5. **Verify** — `curl http://localhost:3000`
6. **Close issues** — Any commit with `Closes #N` / `Fixes #N` → issue gets a deployment comment + closed with `deployed` label

### GitHub Secrets (managed in repo Settings → Secrets)

| Secret | Value |
|--------|-------|
| `DO_SSH_KEY_B64` | Base64-encoded SSH private key for `143.244.143.71` |
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | Admin JWT secret |
| `APP_ORIGIN` | `https://alternatives.nativeworld.com` |
| `BREVO_API_KEY` | Brevo API key |
| `SMTP_FROM_EMAIL` | `noreply@alternatives.nativeworld.com` |
| `SMTP_FROM_NAME` | `Alternatives Team` |
| `LINKEDIN_CLIENT_ID` | LinkedIn OAuth client ID |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth client secret |

### GitHub Variables

| Variable | Value |
|----------|-------|
| `SERVER_IP` | `143.244.143.71` |
| `SERVER_USER` | `root` |
| `APP_PATH` | `/app` |
| `DOMAIN` | `alternatives.nativeworld.com` |

### Manual deploy (emergency)

```bash
# Build locally
pnpm build

# Upload
scp -i ~/.ssh/oracle_instance_key -r dist root@143.244.143.71:/app/

# Restart
ssh -i ~/.ssh/oracle_instance_key root@143.244.143.71 "cd /app && pm2 restart ecosystem.config.cjs --update-env"
```

### Server management

```bash
# SSH in
ssh -i ~/.ssh/oracle_instance_key root@143.244.143.71

# PM2 commands
pm2 status
pm2 logs alternative-ens --lines 50
pm2 restart alternative-ens

# Nginx
systemctl status nginx
nginx -t && systemctl reload nginx
```

---

## Contributing — Issue & Commit Workflow

Every change — bug fix, feature, or infrastructure update — follows this lifecycle:

### 1. Create a GitHub Issue first

```
Title:  Short, imperative description  (e.g. "Fix client project count always 0")
Labels: bug | enhancement | deployment | ui
Body:   Describe the problem / requirement
```

### 2. Commit referencing the issue

Use `Closes #N` or `Fixes #N` in the commit message body:

```
fix: client project count via two-hop contacts lookup

The project count was always 0 because projects link to
clientContactId, not clientId directly.

Fixes #81

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

### 3. Push to main → auto-deploy

GitHub Actions (`deploy-production.yml`) will:
- Build and deploy the app
- Post a "🚀 Deployed to production" comment on the issue
- Close the issue with the `deployed` label

---

## Troubleshooting

### App not responding after deploy

```bash
ssh -i ~/.ssh/oracle_instance_key root@143.244.143.71
pm2 logs alternative-ens --lines 30
pm2 restart alternative-ens
```

### Database connection error

```bash
# Check MySQL is running
systemctl status mysql

# Test connection
mysql -ualternatives -pAlternatives2024!! alternatives_db -e "SELECT 1;"
```

### CV uploads not saving

Ensure `/app/uploads/` exists and is writable:

```bash
mkdir -p /app/uploads/cv-uploads
chmod 755 /app/uploads
```

### Email not sending

Check Brevo key in ecosystem config and verify via:

```bash
pm2 env 1 | grep BREVO
```

### LinkedIn enrichment fails

The API call is made client-side from the user's browser. If it fails:
- Check browser console for CORS or 4xx errors
- Verify LinkFinderAI account has credits at [linkfinderai.com](https://linkfinderai.com)
- Profile must be publicly indexed by LinkFinderAI

---

**Last Updated**: May 2026
**Version**: 2.0.0
**Server**: `143.244.143.71` → `https://alternatives.nativeworld.com`
**Status**: Production ✅
