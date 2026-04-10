# Alternative - Expert Network Service (ENS) Aggregator Platform

A comprehensive Expert Network Service platform enabling Admins to manage Clients, Experts, and Projects with advanced search and matching capabilities. Experts can build profiles via email verification and LinkedIn integration.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation & Setup](#installation--setup)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Platform Architecture](#platform-architecture)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Overview

**Alternative** is an Expert Network Service aggregator platform designed for organizations to:

- **Manage Clients**: Maintain client information with multi-contact support
- **Manage Experts**: Build and maintain expert profiles with employment/education history
- **Manage Projects**: Create and track projects with expert shortlisting and screening
- **Search & Match**: Advanced search and filtering to find the right experts for projects
- **Expert Portal**: Public-facing portal for experts to register and build profiles

## Features

### Admin Dashboard
- **Client Management**: Create, edit, delete clients with multi-contact support
- **Expert Management**: Create, edit, delete experts with sector/function categorization
- **Project Management**: Create projects, manage screening questions, shortlist experts
- **Advanced Search**: Filter experts by sector, function, skills, and keywords
- **Master Lists**: Configurable sector and function master lists
- **Sample Data**: One-click seeding of 60+ sample records for testing
- **Settings**: Admin settings page for master list configuration

### Expert Portal (Public)
- **Self-Registration**: Email verification-based registration
- **Profile Building**: Employment history, education, CV upload, LinkedIn integration
- **LinkedIn Integration**: Simulated LinkedIn profile parsing for quick profile population
- **Profile Submission**: Complete profile submission workflow

### Database Features
- **Multi-Contact Support**: Multiple contacts per client organization
- **Client-Contact Relationship**: Projects linked to specific client contacts
- **Expert Shortlisting**: Track expert status in projects (Shortlisted, Contacted, Engaged, etc.)
- **Employment/Education History**: Track expert career progression
- **CV Storage**: S3-based CV document storage with presigned URLs

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **shadcn/ui** component library
- **Wouter** for routing
- **tRPC** for type-safe API calls

### Backend
- **Express 4** web server
- **tRPC 11** for RPC procedures
- **Drizzle ORM** for database abstraction
- **MySQL/TiDB** database
- **Node.js** runtime

### Infrastructure
- **Manus WebDev Platform** for hosting
- **S3** for file storage (CV documents)
- **Docker/ECR** for containerization

### Testing & Quality
- **Vitest** for unit testing
- **63 tests** covering all core features

## Installation & Setup

### Prerequisites

- **Node.js**: v22.13.0 or higher
- **pnpm**: v9.0.0 or higher (package manager)
- **MySQL/TiDB**: Database instance
- **Git**: For version control

### Step 1: Clone the Repository

```bash
git clone https://github.com/noblemavely/alternative-ens.git
cd alternative-ens
```

### Step 2: Install Dependencies

```bash
pnpm install
```

### Step 3: Set Up Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Database
DATABASE_URL=mysql://user:password@host:port/database_name

# Authentication
JWT_SECRET=your-secret-key-for-jwt-signing

# OAuth (Manus)
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im

# Owner Information
OWNER_NAME=Your Name
OWNER_OPEN_ID=your-open-id

# Built-in APIs (Manus)
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-api-key

# Analytics (Optional)
VITE_ANALYTICS_ENDPOINT=https://analytics.endpoint
VITE_ANALYTICS_WEBSITE_ID=your-website-id

# App Configuration
VITE_APP_TITLE=Alternative
VITE_APP_LOGO=https://your-logo-url.png
```

### Step 4: Database Setup

See [Database Setup](#database-setup) section below.

### Step 5: Run Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Database Setup

### Creating the Database

```bash
# Connect to your MySQL/TiDB instance
mysql -u root -p

# Create database
CREATE DATABASE alternative_ens;
USE alternative_ens;
```

### Running Migrations

The application uses Drizzle ORM for database management.

```bash
# Generate migration files (if schema changes)
pnpm drizzle-kit generate

# Apply migrations
# (Migrations are automatically applied on first run, or use the Manus UI)
```

### Database Schema

The database includes the following tables:

| Table | Purpose |
|-------|---------|
| `users` | Admin users with role-based access |
| `clients` | Client organizations with sector information |
| `clientContacts` | Individual contacts within client organizations |
| `experts` | Expert profiles with sector/function categorization |
| `expertEducation` | Expert education history |
| `expertEmployment` | Expert employment history |
| `expertVerification` | Email verification tokens and status |
| `sectors` | Master list of industry sectors |
| `functions` | Master list of job functions |
| `projects` | Projects linked to client contacts |
| `screeningQuestions` | Questions for project screening |
| `shortlists` | Expert shortlists for projects |
| `expertClientMapping` | Relationship tracking between experts and clients |

### Seeding Sample Data

The application includes a seed script to populate sample data:

```bash
# Via CLI
node seed-db.mjs

# Via UI
# Click "Seed Sample Data" button in Admin Dashboard
```

This creates:
- 5 Sectors, 6 Functions
- 3 Clients with 6 Contacts
- 5 Experts with employment & education history
- 6 Projects with 10 screening questions
- 9 Shortlist records & 7 Expert-Client mappings

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@localhost:3306/db` |
| `JWT_SECRET` | Secret for JWT signing | `your-secret-key` |
| `VITE_APP_ID` | OAuth application ID | `app-id-123` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_TITLE` | Application title | `Alternative` |
| `VITE_APP_LOGO` | Logo URL | (CDN URL) |
| `VITE_ANALYTICS_ENDPOINT` | Analytics endpoint | (Optional) |

## Running the Application

### Development Mode

```bash
pnpm dev
```

Starts the development server with hot module reloading (HMR).

### Production Build

```bash
pnpm build
```

Creates optimized production bundles in the `dist/` directory.

### Running Tests

```bash
pnpm test
```

Runs all vitest test suites (63 tests covering all core features).

### Linting & Type Checking

```bash
pnpm lint
pnpm type-check
```

## Platform Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React 19)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Admin Pages  │  │ Expert Portal│  │ Shared Components│  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ tRPC
┌─────────────────────────────────────────────────────────────┐
│              Backend (Express + tRPC)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Routers      │  │ Procedures   │  │ Database Helpers │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ SQL
┌─────────────────────────────────────────────────────────────┐
│           Database (MySQL/TiDB + Drizzle ORM)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Clients      │  │ Experts      │  │ Projects         │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              External Services                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ S3 Storage   │  │ OAuth (Manus)│  │ Email Service    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
alternative-ens/
├── client/                      # Frontend React application
│   ├── src/
│   │   ├── pages/              # Page components (Admin, Expert Portal)
│   │   ├── components/         # Reusable UI components
│   │   ├── contexts/           # React contexts (Auth, Theme)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/
│   │   │   └── trpc.ts         # tRPC client configuration
│   │   ├── App.tsx             # Main app with routing
│   │   ├── main.tsx            # Entry point
│   │   └── index.css           # Global styles
│   └── public/                 # Static assets
├── server/                      # Backend Express application
│   ├── _core/                  # Framework plumbing (OAuth, context, LLM)
│   ├── db.ts                   # Database query helpers
│   ├── routers.ts              # tRPC procedure definitions
│   ├── storage.ts              # S3 storage helpers
│   ├── *.test.ts               # Test files (63 tests)
│   └── index.ts                # Server entry point
├── drizzle/                    # Database schema & migrations
│   ├── schema.ts               # Drizzle ORM schema definitions
│   └── migrations/             # SQL migration files
├── shared/                     # Shared constants & types
├── storage/                    # S3 storage configuration
├── seed-db.mjs                 # Database seeding script
├── package.json                # Dependencies & scripts
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
├── README.md                   # This file
└── ARCHITECTURE.md             # Detailed architecture documentation
```

### Data Flow

#### 1. Client Management Flow

```
Admin Dashboard
    ↓
AddClient.tsx (Create)
    ↓
trpc.clients.create (tRPC Procedure)
    ↓
server/db.ts → createClient()
    ↓
Database (clients table)
    ↓
AdminClients.tsx (List & Display)
```

#### 2. Expert Shortlisting Flow

```
AdminProjectDetail.tsx
    ↓
Search & Select Expert
    ↓
trpc.shortlists.add (tRPC Procedure)
    ↓
server/db.ts → addToShortlist()
    ↓
Database (shortlists table)
    ↓
getShortlistsByProject() → joins with experts table
    ↓
Display Expert Details in Table
```

#### 3. Expert Profile Submission Flow

```
ExpertPortal.tsx (Public)
    ↓
Email Verification
    ↓
Profile Form (Employment, Education, CV)
    ↓
trpc.experts.submitProfile (tRPC Procedure)
    ↓
server/db.ts → createExpert() or updateExpert()
    ↓
Database (experts, expertEducation, expertEmployment tables)
    ↓
CV Upload to S3 (storagePut)
    ↓
Profile Verification Status Updated
```

### Authentication Flow

1. **Admin Login**: OAuth via Manus platform
2. **Session Management**: JWT cookies
3. **Role-Based Access**: Admin-only procedures with `protectedProcedure`
4. **Expert Registration**: Email verification with token validation

### API Endpoints (tRPC Procedures)

All API calls use tRPC, which generates type-safe endpoints automatically.

**Router Structure**:
```
trpc.clients.*          # Client CRUD operations
trpc.experts.*          # Expert CRUD operations
trpc.projects.*         # Project CRUD operations
trpc.shortlists.*       # Shortlist operations
trpc.sectors.*          # Sector master list
trpc.functions.*        # Function master list
trpc.auth.*             # Authentication
trpc.system.*           # System operations (seed, clear data)
```

### Database Relationships

```
Clients (1) ──→ (Many) ClientContacts
                           ↓
                      Projects
                           ↓
                      Shortlists ──→ Experts
                           
Experts (1) ──→ (Many) ExpertEmployment
Experts (1) ──→ (Many) ExpertEducation
Experts (Many) ──→ (Many) ExpertClientMapping ──→ Clients
```

### Key Design Decisions

1. **ClientContactId Relationship**: Projects are linked to specific client contacts, not just clients, enabling better tracking of which contact shared the project.

2. **Master Lists**: Sector and Function are configurable master lists stored in the database, allowing admins to customize categorization.

3. **Shortlist Status Tracking**: Shortlists include status field to track engagement level (Shortlisted, Contacted, Engaged, Qualified, etc.).

4. **S3 Storage**: CV documents are stored in S3 with presigned URLs, keeping the database lean.

5. **tRPC for Type Safety**: All API calls are type-safe with automatic TypeScript inference from backend procedures.

## API Documentation

### Client Operations

```typescript
// Create client
trpc.clients.create.useMutation({
  name: string,
  sector: string,
  email: string,
  phone: string
})

// List clients with filters
trpc.clients.list.useQuery({
  sector?: string,
  search?: string
})

// Get client details
trpc.clients.getById.useQuery(clientId)

// Update client
trpc.clients.update.useMutation({
  id: number,
  name: string,
  sector: string,
  email: string,
  phone: string
})

// Delete client
trpc.clients.delete.useMutation(clientId)
```

### Expert Operations

```typescript
// Create expert
trpc.experts.create.useMutation({
  firstName: string,
  lastName: string,
  email: string,
  sector: string,
  function: string,
  biography?: string
})

// Search experts with filters
trpc.experts.search.useQuery({
  sector?: string,
  function?: string,
  keyword?: string
})

// Get expert details
trpc.experts.getById.useQuery(expertId)

// Update expert
trpc.experts.update.useMutation({
  id: number,
  firstName: string,
  lastName: string,
  sector: string,
  function: string,
  biography?: string
})
```

### Project Operations

```typescript
// Create project
trpc.projects.create.useMutation({
  name: string,
  description: string,
  type: 'Call' | 'Advisory' | 'ID',
  clientContactId: number,
  hourlyRate?: number,
  targetCompanies?: string
})

// List projects with filters
trpc.projects.list.useQuery({
  clientContactId?: number,
  type?: string
})

// Get project details
trpc.projects.getById.useQuery(projectId)

// Update project
trpc.projects.update.useMutation({
  id: number,
  name: string,
  description: string,
  type: string,
  clientContactId: number
})
```

### Shortlist Operations

```typescript
// Add expert to shortlist
trpc.shortlists.add.useMutation({
  projectId: number,
  expertId: number,
  status: string
})

// Get shortlisted experts for project
trpc.shortlists.getByProject.useQuery(projectId)

// Update shortlist status
trpc.shortlists.updateStatus.useMutation({
  id: number,
  status: string
})

// Remove from shortlist
trpc.shortlists.remove.useMutation({
  projectId: number,
  expertId: number
})
```

## Testing

### Running Tests

```bash
pnpm test
```

### Test Coverage

- **63 Total Tests** covering:
  - Client CRUD operations
  - Expert CRUD operations
  - Project management
  - Expert shortlisting
  - LinkedIn profile parsing
  - Data validation
  - Authentication

### Test Files

- `server/auth.logout.test.ts` - Authentication tests
- `server/linkedinParser.test.ts` - LinkedIn parsing tests (20 tests)
- `server/routers.test.ts` - tRPC router tests (22 tests)
- `server/features.test.ts` - Feature integration tests (20 tests)

### Writing New Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something', async () => {
    const result = await someFunction();
    expect(result).toBe(expectedValue);
  });
});
```

## Deployment

### Prerequisites for Deployment

- All tests passing (`pnpm test`)
- Production build successful (`pnpm build`)
- Environment variables configured
- Database migrations applied

### Deploying to Manus Platform

1. **Create a Checkpoint**:
   ```bash
   # Via Manus UI or CLI
   # Checkpoint captures current project state
   ```

2. **Click Publish Button**:
   - Navigate to Management UI
   - Click "Publish" button (enabled after checkpoint)
   - Select deployment options

3. **Monitor Deployment**:
   - Check deployment logs in Dashboard
   - Verify application is running at deployed URL

### Environment-Specific Configuration

**Development**:
```env
NODE_ENV=development
DEBUG=true
```

**Production**:
```env
NODE_ENV=production
DEBUG=false
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Error

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:3306`

**Solution**:
- Verify MySQL/TiDB is running
- Check DATABASE_URL is correct
- Ensure database exists and user has permissions

#### 2. OAuth Redirect URI Mismatch

**Error**: `Invalid redirect_uri parameter`

**Solution**:
- Verify OAUTH_SERVER_URL matches registered URI
- Check APP_ORIGIN environment variable
- Ensure redirect URI is whitelisted in OAuth provider

#### 3. S3 Upload Fails

**Error**: `AccessDenied: User is not authorized to perform: s3:PutObject`

**Solution**:
- Check S3 credentials in environment
- Verify IAM permissions for bucket
- Ensure bucket exists and is accessible

#### 4. Tests Failing

**Error**: `Test failed: expected X but got Y`

**Solution**:
- Run `pnpm test` to see full error output
- Check database state (may need to clear and reseed)
- Review test file for setup/teardown issues

### Debug Mode

Enable debug logging:

```bash
DEBUG=* pnpm dev
```

### Checking Logs

**Development Server Logs**:
```bash
# View in .manus-logs/devserver.log
tail -f .manus-logs/devserver.log
```

**Browser Console Logs**:
```bash
# View in .manus-logs/browserConsole.log
tail -f .manus-logs/browserConsole.log
```

**Network Requests**:
```bash
# View in .manus-logs/networkRequests.log
tail -f .manus-logs/networkRequests.log
```

## Contributing

### Development Workflow

1. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**:
   - Update code in `client/src/` or `server/`
   - Update database schema in `drizzle/schema.ts` if needed
   - Write tests for new features

3. **Run Tests**:
   ```bash
   pnpm test
   ```

4. **Commit Changes**:
   ```bash
   git add .
   git commit -m "feat: description of changes"
   ```

5. **Push and Create Pull Request**:
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Style

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Use shadcn/ui components for UI
- Write tests for all new features
- Update documentation as needed

### Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat: add expert search by sector

- Implement sector filter in expert search
- Add master list configuration for sectors
- Update AdminExperts page with sector dropdown
- All 63 tests passing
```

## License

Proprietary - All rights reserved

## Support

For issues, questions, or feature requests:
1. Check existing GitHub issues
2. Create a new GitHub issue with detailed description
3. Contact the development team

---

**Last Updated**: April 10, 2026
**Version**: 1.0.0 (Checkpoint: e5e4d107)
**Status**: Production Ready ✅
