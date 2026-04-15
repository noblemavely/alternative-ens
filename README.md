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
  - [Docker Deployment on Digital Ocean](#docker-deployment-architecture)
  - [Quick Deployment Steps](#quick-deployment-steps)
  - [Manual Deployment](#manual-deployment-to-digital-ocean)
  - [CI/CD with GitHub Actions](#cicd-with-github-actions)
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
- **Expert Management**: Create, edit, delete experts with sector/function categorization, CV uploads
- **Project Management**: Create projects, manage screening questions, shortlist experts
- **Expert Engagement**: Inline status editing for expert-project assignments with 13 status stages
- **Activity Timeline**: Track all expert activities including status changes with timestamps
- **CV Management**: Upload and view expert CVs directly from admin interface
- **Advanced Search**: Filter experts by sector, function, skills, and keywords
- **Master Lists**: Configurable sector and function master lists
- **Sample Data**: One-click seeding of 60+ sample records for testing
- **Settings**: Admin settings page for master list configuration

### Expert Portal (Public)
- **Self-Registration**: Email verification-based registration
- **Profile Building**: Employment history, education, CV upload, LinkedIn integration
- **CV Upload**: Direct PDF upload during registration with file validation
- **LinkedIn Integration**: Simulated LinkedIn profile parsing for quick profile population
- **Profile Submission**: Complete profile submission workflow with CV verification

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
- **Digital Ocean** (Docker containers) for hosting
- **Brevo SMTP** for email service
- **S3** for file storage (CV documents)
- **Docker/Docker Compose** for containerization
- **GitHub Actions** for CI/CD deployment

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

# OAuth Configuration
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://your-oauth-server.com
VITE_OAUTH_PORTAL_URL=https://your-login-portal.com

# Owner Information
OWNER_NAME=Your Name
OWNER_OPEN_ID=your-open-id

# API Configuration
BUILT_IN_FORGE_API_URL=https://your-api-endpoint.com
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_URL=https://your-api-endpoint.com
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
# (Migrations are automatically applied on first run)
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

The application includes a seed script to populate comprehensive sample data:

```bash
# Via CLI
node seed-db.mjs

# Via UI (when available)
# Click "Seed Sample Data" button in Admin Dashboard
```

**Sample Data Includes:**
- **5 Sectors** & **6 Functions** - Master lists for categorization
- **3 Clients** with **6 Contacts** - Multi-contact client organizations (email removed from clients table, stored in clientContacts)
- **5 Experts** with:
  - Static resume PDF files (all 5 experts have CV attachments)
  - Employment history (6 records)
  - Education history (6 records)
  - LinkedIn URLs and complete profiles
- **6 Projects** with:
  - **10 screening questions** across all projects
  - Status tracking and notes
- **9 Shortlist records** with:
  - Various status stages (pending, engaged, qualified, etc.)
  - Timestamps for activity tracking
- **7 Expert-Client mappings** for relationship tracking
- **Activity timeline records** showing expert engagement history

### Clearing All Data

To reset the database and clear all data:

```bash
# Via CLI
node clear-db.mjs

# This will delete all data while preserving table structure
# The script will ask for confirmation before proceeding
```

**Safety Features:**
- Confirmation prompt before deletion
- Preserves database schema
- Clears all tables in correct dependency order
- Ready for fresh seeding after clearing

**Warning:** This operation is irreversible and will remove all data from all tables.

### Database Management Workflow

**Full Reset Workflow:**
```bash
# Step 1: Clear all existing data
node clear-db.mjs
# When prompted, type "yes" to confirm

# Step 2: Seed fresh sample data
node seed-db.mjs

# Step 3: Verify in admin dashboard
# Navigate to http://localhost:3000/admin/experts
```

**Partial Updates:**
- Update individual experts/projects through the admin interface
- Use tRPC endpoints for API-based updates
- Activity timeline automatically tracks all changes

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

## Key Features Guide

### CV Management

**Admin Interface:**
- Upload CV files directly from the expert detail page (Edit mode)
- Supported formats: PDF, DOC, DOCX
- Automatic file storage in `/uploads` (development) or S3 (production)
- View uploaded CVs via DocumentViewer modal with native browser PDF viewer
- Browser's native PDF toolbar provides zoom, search, print, and page navigation
- CVs are stored alongside expert profile data

**PDF Viewer:**
- **Implementation**: Simple iframe-based viewer using browser's native PDF support
- **Features**:
  - Native browser PDF toolbar (zoom, search, print, download)
  - Full-page PDF display in responsive dialog modal
  - Download button in dialog header for easy saving
  - Handles both relative and absolute URLs automatically
  - No external worker configuration required
- **Performance**: 
  - Eliminates complex pdfjs-dist worker initialization
  - Works immediately without Vite module resolution issues
  - Leverages browser's optimized PDF rendering

**Expert Portal:**
- Upload CV during profile registration
- Email verification before profile activation
- CV visibility in admin dashboard after submission

**Storage:**
- **Development**: Local filesystem (`/uploads` directory) via Express static middleware
- **Production**: S3-compatible storage with configured API credentials
- Automatic URL generation for retrieval

### Expert Status Management

**Inline Status Editing:**
- Edit expert-project assignment status directly from expert profile
- **13 Status Options**: Pending, New, Contacted, Attempting Contact, Engaged, Qualified, Proposal Sent, Negotiation, Verbal Agreement, Closed Won, Closed Lost, Interested, Rejected
- Edit/Save/Cancel workflow for status changes
- Real-time updates without page reload

**Activity Timeline:**
- Track all expert activities with timestamps
- Color-coded status badges for visual clarity
- Event types: Expert Created, Added to Project, Status Changed
- Project-specific activity view for detailed engagement tracking
- Automatic recording of status changes with actor and timestamp

### Database Features for New Capabilities

**CV Storage:**
- `experts.cvUrl` - Stores the URL path to uploaded CV file
- `experts.cvKey` - S3 key for production storage
- File validation and storage abstraction through `storage.ts`

**Activity Tracking:**
- `auditLog` table records all changes
- Supports expert creation, updates, and deletion tracking
- Tracks expert-project engagement history

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
│  │ S3 Storage   │  │ OAuth Server │  │ Brevo SMTP       │  │
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

1. **Admin Login**: OAuth via configured OAuth provider
2. **Session Management**: JWT cookies
3. **Role-Based Access**: Admin-only procedures with `protectedProcedure`
4. **Expert Registration**: Email verification with token validation
5. **Email Service**: Brevo SMTP for sending verification emails

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
  phone?: string,
  companyName?: string,
  companyWebsite?: string,
  contactPerson?: string
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
  name?: string,
  sector?: string,
  phone?: string,
  companyName?: string,
  companyWebsite?: string,
  contactPerson?: string
})

// Delete client
trpc.clients.delete.useMutation(clientId)

// Note: Email information is now stored in clientContacts table
// See Client Contact Operations below
```

### Client Contact Operations

```typescript
// Create client contact
trpc.clientContacts.create.useMutation({
  clientId: number,
  contactName: string,
  email: string,
  phone?: string,
  role?: string,
  workType?: string
})

// List contacts for a specific client
trpc.clientContacts.listByClient.useQuery(clientId)

// Get contact details
trpc.clientContacts.getById.useQuery(contactId)

// Update contact
trpc.clientContacts.update.useMutation({
  id: number,
  contactName?: string,
  email?: string,
  phone?: string,
  role?: string,
  workType?: string
})

// Delete contact
trpc.clientContacts.delete.useMutation(contactId)
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

### Current Deployment: Digital Ocean with Docker

The application is deployed on Digital Ocean using Docker containers managed by Docker Compose.

**Server Details**:
- **Host**: 68.183.86.134
- **Domain**: alternatives.nativeworld.com
- **Database**: MySQL 8.0 (containerized)
- **Email**: Brevo SMTP relay

### Prerequisites for Deployment

- All tests passing (`pnpm test`)
- Production build successful (`pnpm build`)
- Environment variables configured
- Docker and Docker Compose installed on server
- SSH access to Digital Ocean droplet

### Docker Deployment Architecture

The application uses Docker Compose with two services:

1. **App Service** (Node.js):
   - Base Image: `node:20-alpine`
   - Package Manager: `pnpm`
   - Port: 3000
   - Environment: Production

2. **Database Service** (MySQL 8.0):
   - Container: `mysql:8.0`
   - Port: 3306 (internal only)
   - Volume: Persistent data storage
   - Auto-restart on failure

### Quick Deployment Steps

1. **Build the Application Locally**:
   ```bash
   pnpm build
   ```

2. **Push Changes to GitHub**:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin main
   ```

3. **Automatic Deployment**:
   - GitHub Actions workflow is triggered on push to `main` branch
   - Workflow builds the application and deploys to Digital Ocean
   - **Note**: Set `DO_PASSWORD` GitHub secret with your root password for CI/CD

### Manual Deployment to Digital Ocean

If you need to deploy manually:

```bash
# 1. SSH to the server
ssh root@68.183.86.134

# 2. Navigate to app directory
cd /app

# 3. Pull latest changes
git pull origin main

# 4. Rebuild Docker containers
docker-compose build --no-cache

# 5. Restart services
docker-compose up -d

# 6. Verify deployment
docker-compose logs -f app
```

### Environment Variables (Production)

Create `.env` file on the server:

```env
NODE_ENV=production
DEBUG=false
DATABASE_URL=mysql://root:alternative_ens@db:3306/alternative_ens
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=noblemavely@gmail.com
SMTP_PASSWORD=bskv4wGcai9yWss
BREVO_API_KEY=xkeysib-7f8e923e90ea4a5f78ae6ef7e9bcf71c38b5e66c44a41e2e8e6a7f8b9c0d1e2f
APP_URL=http://68.183.86.134
```

### Docker Files

- **Dockerfile**: Node.js application containerization
- **docker-compose.yml**: Multi-container orchestration
- **.github/workflows/deploy-docker.yml**: GitHub Actions CI/CD pipeline

### Database Migrations

Migrations are automatically applied when the app container starts. To manually run migrations:

```bash
# SSH to server
ssh root@68.183.86.134
cd /app

# Run migrations in database container
docker-compose exec db mysql -u root -palternative_ens alternative_ens < drizzle/migrations/[migration_file].sql
```

### Monitoring and Logs

```bash
# View application logs
docker-compose logs -f app

# View database logs
docker-compose logs -f db

# Check container status
docker-compose ps

# View process stats
docker stats
```

### Scaling and Updates

1. **Update Application Code**:
   - Commit changes to GitHub
   - GitHub Actions automatically deploys to Digital Ocean

2. **Update Dependencies**:
   ```bash
   pnpm install
   pnpm build
   git commit -am "chore: update dependencies"
   git push origin main
   ```

3. **Database Schema Changes**:
   - Generate migrations: `pnpm drizzle-kit generate`
   - Add migration files to repository
   - Migrations run automatically on next deployment

### Health Checks

- **Application**: `http://68.183.86.134` should return HTML
- **Database**: Verify connectivity from app container
- **Email**: Test verification email sends during expert registration
- **Logs**: Check `docker-compose logs app` for errors

See **DOCKER_DEPLOYMENT.md** for detailed Docker setup and **DEPLOYMENT_TESTING_GUIDE.md** for testing procedures.

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
# Check npm/pnpm output in terminal
# For PM2-managed processes:
pm2 logs alternative-ens
```

**Browser Console Logs**:
```bash
# Open browser developer tools (F12)
# Check Console tab for client-side errors
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

**Last Updated**: April 15, 2026 (Docker Deployment & GitHub Actions CI/CD)
**Version**: 1.1.0 (Docker Infrastructure Release)
**Status**: Production Ready ✅
**Latest Features**: 
- ✅ Docker containerization with docker-compose
- ✅ Deployed to Digital Ocean (68.183.86.134)
- ✅ GitHub Actions CI/CD pipeline for automated deployment
- ✅ MySQL 8.0 containerized database
- ✅ Domain: alternatives.nativeworld.com
- ✅ Brevo SMTP email integration
