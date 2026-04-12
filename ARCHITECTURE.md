# Alternative ENS Platform - Architecture Documentation

**Last Updated**: April 12, 2026 (Client Data Architecture & Expert Resume PDFs)  
**Version**: 1.0.2 (Data Architecture Improvements)  
**Status**: Production Ready ✅  
**Latest Updates**:
- ✅ Email data moved from clients to clientContacts table
- ✅ All 5 experts have static resume PDF files
- ✅ PDF Viewer: Implemented with iframe-based browser native viewer

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [API Layer (tRPC)](#api-layer-trpc)
5. [Frontend Architecture](#frontend-architecture)
6. [Backend Architecture](#backend-architecture)
7. [Data Flow Diagrams](#data-flow-diagrams)
8. [Security Architecture](#security-architecture)
9. [Scalability & Performance](#scalability--performance)
10. [Deployment Architecture](#deployment-architecture)

---

## System Architecture

### High-Level Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                        Client Layer (React)                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │  Admin Dashboard │  │  Expert Portal   │  │  Shared Layout │  │
│  │  - Clients       │  │  - Registration  │  │  - Navigation  │  │
│  │  - Experts       │  │  - Profile Build │  │  - Auth        │  │
│  │  - Projects      │  │  - LinkedIn      │  │  - Theme       │  │
│  │  - Search        │  │  - Submission    │  │                │  │
│  └──────────────────┘  └──────────────────┘  └────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/tRPC
┌────────────────────────────────────────────────────────────────────┐
│                    API Gateway (Express)                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  /api/trpc/* - tRPC Endpoints (Type-Safe RPC)              │  │
│  │  /api/oauth/callback - OAuth Redirect Handler              │  │
│  │  /api/linkedin/callback - LinkedIn OAuth Redirect          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
                              ↓ SQL
┌────────────────────────────────────────────────────────────────────┐
│              Business Logic Layer (tRPC Routers)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ Auth Router  │  │ Clients      │  │ Experts Router           │ │
│  │ - Login      │  │ - CRUD       │  │ - CRUD                   │ │
│  │ - Logout     │  │ - Search     │  │ - Search & Filter        │ │
│  │ - Me         │  │ - Contacts   │  │ - LinkedIn Parse         │ │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘ │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ Projects     │  │ Shortlists   │  │ System Router            │ │
│  │ - CRUD       │  │ - Add Expert │  │ - Seed Data              │ │
│  │ - Questions  │  │ - Status     │  │ - Clear Data             │ │
│  │ - Screening  │  │ - Remove     │  │ - Master Lists           │ │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
                              ↓ SQL
┌────────────────────────────────────────────────────────────────────┐
│           Data Access Layer (Drizzle ORM + Helpers)                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Database Query Builders & Type-Safe Queries               │  │
│  │  - createClient, updateClient, deleteClient, etc.          │  │
│  │  - createExpert, searchExperts, getExpertById, etc.        │  │
│  │  - createProject, getProjectsByClientContact, etc.         │  │
│  │  - addToShortlist, getShortlistsByProject, etc.            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
                              ↓ MySQL Protocol
┌────────────────────────────────────────────────────────────────────┐
│                  Database Layer (MySQL/TiDB)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ Clients      │  │ Experts      │  │ Projects                 │ │
│  │ ClientContacts│  │ Employment   │  │ ScreeningQuestions       │ │
│  │ Sectors      │  │ Education    │  │ Shortlists               │ │
│  │ Functions    │  │ Verification │  │ ExpertClientMapping      │ │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────────┐
│                    External Services                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ S3 Storage   │  │ OAuth (Manus)│  │ Email Service            │ │
│  │ - CV Upload  │  │ - Admin Auth │  │ - Verification Emails    │ │
│  │ - Presigned  │  │ - Tokens     │  │ - Notifications          │ │
│  │   URLs       │  │              │  │                          │ │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 19 | UI component library |
| **Language** | TypeScript | Type safety |
| **Styling** | Tailwind CSS 4 | Utility-first CSS |
| **Components** | shadcn/ui | Pre-built UI components |
| **Routing** | Wouter | Lightweight router |
| **API Client** | tRPC | Type-safe RPC calls |
| **State** | React Context | Global state management |
| **Build Tool** | Vite | Fast build & HMR |

### Backend Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js 22 | JavaScript runtime |
| **Framework** | Express 4 | Web server |
| **RPC** | tRPC 11 | Type-safe API procedures |
| **ORM** | Drizzle | Database abstraction |
| **Language** | TypeScript | Type safety |
| **Database** | MySQL/TiDB | Relational database |
| **Testing** | Vitest | Unit testing framework |

### Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Hosting** | Manus WebDev | Platform-as-a-Service |
| **Containerization** | Docker/ECR | Container registry |
| **File Storage** | AWS S3 | Document storage |
| **Authentication** | Manus OAuth | Identity provider |
| **Database** | MySQL/TiDB | Data persistence |

---

## Database Schema

### Entity-Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ id (PK)                                                 │   │
│  │ name                                                    │   │
│  │ sector (FK → sectors.id)                               │   │
│  │ email                                                   │   │
│  │ phone                                                   │   │
│  │ createdAt, updatedAt                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                         │                                       │
│                         │ 1:Many                                │
│                         ↓                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   CLIENT CONTACTS                       │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ id (PK)                                         │   │   │
│  │  │ clientId (FK → clients.id)                      │   │   │
│  │  │ name                                            │   │   │
│  │  │ email                                           │   │   │
│  │  │ phone                                           │   │   │
│  │  │ role                                            │   │   │
│  │  │ createdAt, updatedAt                            │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                         │                                       │
│                         │ 1:Many                                │
│                         ↓                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      PROJECTS                           │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ id (PK)                                         │   │   │
│  │  │ name                                            │   │   │
│  │  │ description                                     │   │   │
│  │  │ type (Call, Advisory, ID)                       │   │   │
│  │  │ clientContactId (FK → clientContacts.id)        │   │   │
│  │  │ hourlyRate                                      │   │   │
│  │  │ targetCompanies                                 │   │   │
│  │  │ createdAt, updatedAt                            │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                         │                                       │
│                         │ 1:Many                                │
│                         ↓                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              SCREENING QUESTIONS                        │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ id (PK)                                         │   │   │
│  │  │ projectId (FK → projects.id)                    │   │   │
│  │  │ question                                        │   │   │
│  │  │ order                                           │   │   │
│  │  │ createdAt, updatedAt                            │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                         │                                       │
│                         │ 1:Many                                │
│                         ↓                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    SHORTLISTS                           │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ id (PK)                                         │   │   │
│  │  │ projectId (FK → projects.id)                    │   │   │
│  │  │ expertId (FK → experts.id)                      │   │   │
│  │  │ status (Shortlisted, Contacted, Engaged, etc.) │   │   │
│  │  │ createdAt, updatedAt                            │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         EXPERTS                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ id (PK)                                                 │   │
│  │ firstName, lastName                                     │   │
│  │ email                                                   │   │
│  │ phone                                                   │   │
│  │ sector (FK → sectors.id)                               │   │
│  │ function (FK → functions.id)                           │   │
│  │ biography                                               │   │
│  │ linkedinUrl                                             │   │
│  │ cvUrl (S3 URL)                                          │   │
│  │ verified                                                │   │
│  │ createdAt, updatedAt                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                         │                                       │
│        ┌────────────────┼────────────────┐                      │
│        │                │                │                      │
│   1:Many           1:Many            1:Many                     │
│        │                │                │                      │
│        ↓                ↓                ↓                      │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐          │
│  │EMPLOYMENT│  │  EDUCATION   │  │EXPERT-CLIENT MAP │          │
│  │HISTORY   │  │  HISTORY     │  │                  │          │
│  └──────────┘  └──────────────┘  └──────────────────┘          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              EXPERT VERIFICATION                         │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ id (PK)                                            │  │  │
│  │  │ expertId (FK → experts.id)                         │  │  │
│  │  │ token                                              │  │  │
│  │  │ verified                                           │  │  │
│  │  │ verifiedAt                                         │  │  │
│  │  │ createdAt, updatedAt                               │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      MASTER LISTS                               │
│  ┌──────────────┐              ┌──────────────┐                 │
│  │   SECTORS    │              │  FUNCTIONS   │                 │
│  │ - Technology │              │ - CEO        │                 │
│  │ - Finance    │              │ - CFO        │                 │
│  │ - Healthcare │              │ - CTO        │                 │
│  │ - etc.       │              │ - VP         │                 │
│  └──────────────┘              └──────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

### Table Definitions

#### Core Tables

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `users` | Admin users | 1:Many with sessions |
| `clients` | Client organizations | 1:Many with clientContacts |
| `clientContacts` | Individual contacts | 1:Many with projects |
| `sectors` | Industry sectors (master list) | Referenced by clients, experts |
| `functions` | Job functions (master list) | Referenced by experts |
| `experts` | Expert profiles | 1:Many with employment, education, verification |
| `expertEmployment` | Career history | Many:1 with experts |
| `expertEducation` | Education history | Many:1 with experts |
| `expertVerification` | Email verification | 1:1 with experts |
| `projects` | Projects | 1:Many with screeningQuestions, shortlists |
| `screeningQuestions` | Project screening | Many:1 with projects |
| `shortlists` | Expert shortlisting | Many:1 with projects, Many:1 with experts |
| `expertClientMapping` | Expert-Client relationships | Many:Many |

---

## API Layer (tRPC)

### tRPC Architecture

```
┌─────────────────────────────────────────────────────┐
│         Frontend (React Components)                 │
│  trpc.clients.list.useQuery()                       │
│  trpc.experts.search.useQuery()                     │
│  trpc.projects.create.useMutation()                 │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│       tRPC Client (client/src/lib/trpc.ts)          │
│  - Configures tRPC client                           │
│  - Handles HTTP transport                           │
│  - Manages type inference                           │
└─────────────────────────────────────────────────────┘
                        ↓ HTTP POST /api/trpc/*
┌─────────────────────────────────────────────────────┐
│     Express Router (server/_core/trpc.ts)           │
│  - Routes tRPC calls to procedures                  │
│  - Handles context creation                         │
│  - Manages authentication                           │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│      tRPC Routers (server/routers.ts)               │
│  - Defines procedures                               │
│  - Implements business logic                        │
│  - Validates inputs                                 │
│  - Returns typed responses                          │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│    Database Helpers (server/db.ts)                  │
│  - Query builders                                   │
│  - Data transformations                             │
│  - Relationship joins                               │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│      Drizzle ORM (drizzle/schema.ts)                │
│  - Type-safe queries                                │
│  - SQL generation                                   │
│  - Schema definitions                               │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│         MySQL Database                              │
└─────────────────────────────────────────────────────┘
```

### Router Structure

```typescript
// server/routers.ts

export const appRouter = router({
  // Authentication
  auth: router({
    login: publicProcedure.mutation(...),
    logout: protectedProcedure.mutation(...),
    me: protectedProcedure.query(...)
  }),
  
  // Clients
  clients: router({
    create: adminProcedure.mutation(...),
    list: protectedProcedure.query(...),
    getById: protectedProcedure.query(...),
    update: adminProcedure.mutation(...),
    delete: adminProcedure.mutation(...)
  }),
  
  // Experts
  experts: router({
    create: adminProcedure.mutation(...),
    list: protectedProcedure.query(...),
    search: publicProcedure.query(...),
    getById: protectedProcedure.query(...),
    update: adminProcedure.mutation(...),
    delete: adminProcedure.mutation(...)
  }),
  
  // Projects
  projects: router({
    create: adminProcedure.mutation(...),
    list: protectedProcedure.query(...),
    getById: protectedProcedure.query(...),
    update: adminProcedure.mutation(...),
    delete: adminProcedure.mutation(...)
  }),
  
  // Shortlists
  shortlists: router({
    add: adminProcedure.mutation(...),
    getByProject: protectedProcedure.query(...),
    updateStatus: adminProcedure.mutation(...),
    remove: adminProcedure.mutation(...)
  }),
  
  // System
  system: router({
    seedDatabase: adminProcedure.mutation(...),
    clearAllData: adminProcedure.mutation(...)
  })
});
```

### Procedure Types

```typescript
// Public - No authentication required
publicProcedure
  .input(z.object({ ... }))
  .query(async ({ input, ctx }) => { ... })

// Protected - Admin authentication required
protectedProcedure
  .input(z.object({ ... }))
  .mutation(async ({ input, ctx }) => { ... })

// Admin-only - Admin role required
adminProcedure
  .input(z.object({ ... }))
  .mutation(async ({ input, ctx }) => { ... })
```

---

## Frontend Architecture

### Component Hierarchy

```
App.tsx (Main Router)
├── DashboardLayout (Admin)
│   ├── Sidebar Navigation
│   ├── AdminDashboard
│   │   ├── Stats Cards
│   │   ├── Recent Clients
│   │   └── Recent Experts
│   ├── AdminClients
│   │   ├── Search & Filter
│   │   ├── Clients Table
│   │   └── Add/Edit/Delete Actions
│   ├── AdminClientDetail
│   │   ├── Client Info
│   │   ├── Contacts Section
│   │   └── Projects Linked
│   ├── AddClient
│   │   └── Client Form
│   ├── AdminExperts
│   │   ├── Search & Filter
│   │   ├── Experts Table
│   │   └── Add/Edit/Delete Actions
│   ├── AdminExpertDetail
│   │   ├── Expert Info
│   │   ├── Employment History
│   │   ├── Education History
│   │   ├── CV Viewer (DocumentViewer component)
│   │   └── Projects Carousel
│   ├── AddExpert
│   │   └── Expert Form
│   ├── AdminProjects
│   │   ├── Search & Filter
│   │   ├── Projects Table
│   │   └── Add/Edit/Delete Actions
│   ├── AdminProjectDetail
│   │   ├── Project Info
│   │   ├── Screening Questions
│   │   └── Shortlisted Experts Table
│   ├── AddProject
│   │   └── Project Form
│   ├── AdminSearch
│   │   ├── Search Filters
│   │   └── Results
│   └── AdminSettings
│       ├── Sector Master List
│       └── Function Master List
│
├── Home (Public Landing)
│   ├── Hero Section
│   ├── Features
│   ├── CTA Buttons
│   └── Footer
│
└── ExpertPortal (Public)
    ├── Registration Form
    ├── Email Verification
    ├── Profile Builder
    │   ├── Basic Info
    │   ├── Employment History
    │   ├── Education History
    │   ├── CV Upload
    │   └── LinkedIn Integration
    └── Profile Preview
```

### Shared Components

**DocumentViewer Component:**
- **Location**: `client/src/components/DocumentViewer.tsx`
- **Purpose**: Display PDF documents in a modal dialog with browser's native PDF viewer
- **Implementation**: 
  - Uses `<iframe>` element with HTML5 PDF viewer
  - Supports absolute and relative URLs automatically
  - Browser's native toolbar provides zoom, search, print, page navigation
- **Props**:
  ```typescript
  interface DocumentViewerProps {
    open: boolean;              // Modal visibility
    onOpenChange: (open: boolean) => void;  // Modal state handler
    documentUrl: string;        // PDF URL (absolute or relative)
    documentTitle?: string;     // Modal title & download filename
  }
  ```
- **Usage**: 
  ```typescript
  <DocumentViewer 
    open={isOpen}
    onOpenChange={setIsOpen}
    documentUrl="/uploads/cv-uploads/resume.pdf"
    documentTitle="Expert Resume"
  />
  ```
- **Features**:
  - Native browser PDF rendering (no external dependencies)
  - Responsive modal layout (max-width: 4xl, height: 90vh)
  - Download button in header
  - Automatic URL conversion (relative → absolute)
  - Error handling for invalid URLs
- **Performance**:
  - No react-pdf or pdfjs-dist dependencies
  - Eliminates complex worker configuration
  - Uses browser's optimized PDF rendering engine

### State Management

**Global State** (React Context):
- `AuthContext`: Current user, login status, role
- `ThemeContext`: Dark/light theme preference

**Local State** (Component useState):
- Form inputs
- UI states (loading, errors, modals)
- Temporary data

**Server State** (tRPC):
- Clients, Experts, Projects data
- Query caching & invalidation
- Optimistic updates

### Routing

```typescript
// client/src/App.tsx

<Router>
  {/* Public Routes */}
  <Route path="/" component={Home} />
  <Route path="/expert/register" component={ExpertPortal} />
  
  {/* Admin Routes */}
  <Route path="/admin" component={AdminDashboard} />
  <Route path="/admin/clients" component={AdminClients} />
  <Route path="/admin/clients/:id" component={AdminClientDetail} />
  <Route path="/admin/add-client" component={AddClient} />
  <Route path="/admin/experts" component={AdminExperts} />
  <Route path="/admin/experts/:id" component={AdminExpertDetail} />
  <Route path="/admin/add-expert" component={AddExpert} />
  <Route path="/admin/projects" component={AdminProjects} />
  <Route path="/admin/projects/:id" component={AdminProjectDetail} />
  <Route path="/admin/add-project" component={AddProject} />
  <Route path="/admin/search" component={AdminSearch} />
  <Route path="/admin/settings" component={AdminSettings} />
</Router>
```

---

## Backend Architecture

### Server Structure

```
server/
├── _core/
│   ├── index.ts              # Server entry point
│   ├── context.ts            # tRPC context creation
│   ├── auth.ts               # Authentication helpers
│   ├── oauth.ts              # OAuth integration
│   ├── trpc.ts               # tRPC setup
│   ├── llm.ts                # LLM integration
│   ├── voiceTranscription.ts # Voice-to-text
│   ├── imageGeneration.ts    # Image generation
│   ├── notification.ts       # Owner notifications
│   ├── map.ts                # Maps integration
│   └── env.ts                # Environment variables
├── db.ts                     # Database query helpers
├── routers.ts                # tRPC procedure definitions
├── storage.ts                # S3 storage helpers
├── auth.logout.test.ts       # Authentication tests
├── linkedinParser.test.ts    # LinkedIn parsing tests
├── routers.test.ts           # Router tests
└── features.test.ts          # Feature integration tests
```

### Request Flow

```
HTTP Request
    ↓
Express Middleware
    ├── CORS
    ├── JSON Parser
    └── Session Handler
    ↓
tRPC Router (/api/trpc/*)
    ↓
Context Creation
    ├── Extract user from session
    ├── Determine admin status
    └── Build ctx object
    ↓
Procedure Execution
    ├── Input validation (Zod)
    ├── Authorization check
    ├── Business logic
    └── Database query
    ↓
Response Serialization
    ├── SuperJSON (handles Dates, etc.)
    └── HTTP Response
    ↓
Client Receives Response
```

### Database Query Helpers

```typescript
// server/db.ts - Example structure

// Clients
export async function createClient(data: ClientInput) { ... }
export async function listClients(filters?: ClientFilters) { ... }
export async function getClientById(id: number) { ... }
export async function updateClient(id: number, data: ClientInput) { ... }
export async function deleteClient(id: number) { ... }

// Experts
export async function createExpert(data: ExpertInput) { ... }
export async function searchExperts(filters: ExpertFilters) { ... }
export async function getExpertById(id: number) { ... }
export async function updateExpert(id: number, data: ExpertInput) { ... }

// Projects
export async function createProject(data: ProjectInput) { ... }
export async function getProjectsByClientContact(clientContactId: number) { ... }
export async function getProjectById(id: number) { ... }

// Shortlists
export async function addToShortlist(projectId: number, expertId: number) { ... }
export async function getShortlistsByProject(projectId: number) { ... }
export async function removeFromShortlist(projectId: number, expertId: number) { ... }
```

---

## Data Flow Diagrams

### 1. Client Creation Flow

```
Admin Dashboard (AddClient.tsx)
    ↓ (Form Submit)
trpc.clients.create.useMutation()
    ↓ (HTTP POST /api/trpc/clients.create)
Express Router
    ↓
tRPC Procedure (adminProcedure)
    ├─ Validate input (Zod schema)
    ├─ Check admin authorization
    └─ Call db.createClient()
    ↓
Database Query (Drizzle ORM)
    INSERT INTO clients (name, sector, email, phone) VALUES (...)
    ↓
Database Response
    ↓
Return to Frontend
    ↓
AdminClients.tsx (Refresh List)
    ↓ (Query Invalidation)
trpc.clients.list.useQuery()
    ↓
Display Updated List
```

### 2. Expert Search Flow

```
AdminExperts.tsx (Search Form)
    ↓ (Filter Selection)
URL Parameters Updated
    ?sector=Technology&function=CEO&search=keyword
    ↓
trpc.experts.search.useQuery({ sector, function, keyword })
    ↓ (HTTP GET /api/trpc/experts.search?input=...)
Express Router
    ↓
tRPC Procedure (publicProcedure)
    ├─ Validate filters
    └─ Call db.searchExperts()
    ↓
Database Query
    SELECT * FROM experts 
    WHERE sector = ? AND function = ? AND (firstName LIKE ? OR biography LIKE ?)
    ↓
Database Response (Expert List)
    ↓
Return to Frontend
    ↓
AdminExperts.tsx (Display Results)
    ├─ Render table
    ├─ Show filter badges
    └─ Enable pagination
```

### 3. Expert Shortlisting Flow

```
AdminProjectDetail.tsx
    ↓ (Search & Select Expert)
Expert Selected
    ↓
trpc.shortlists.add.useMutation()
    ↓ (HTTP POST /api/trpc/shortlists.add)
Express Router
    ↓
tRPC Procedure (adminProcedure)
    ├─ Validate projectId & expertId
    ├─ Check authorization
    └─ Call db.addToShortlist()
    ↓
Database Query
    INSERT INTO shortlists (projectId, expertId, status) VALUES (?, ?, 'Shortlisted')
    ↓
Database Response
    ↓
Return to Frontend
    ↓
Optimistic Update (onMutate)
    ├─ Update local cache
    └─ Show success toast
    ↓
Query Invalidation (onSuccess)
    trpc.shortlists.getByProject.invalidate()
    ↓
Refetch Shortlisted Experts
    ↓
Display Updated Table
```

### 4. Expert Profile Submission Flow

```
ExpertPortal.tsx (Profile Form)
    ↓ (Fill Form & Submit)
Email Verification
    ↓
trpc.experts.submitProfile.useMutation()
    ↓ (HTTP POST /api/trpc/experts.submitProfile)
Express Router
    ↓
tRPC Procedure (publicProcedure)
    ├─ Validate email token
    ├─ Create/Update expert
    ├─ Create employment records
    ├─ Create education records
    └─ Upload CV to S3
    ↓
Database Transactions
    ├─ INSERT/UPDATE experts
    ├─ INSERT expertEmployment
    ├─ INSERT expertEducation
    └─ UPDATE expertVerification
    ↓
S3 Upload (storagePut)
    ├─ Upload CV file
    └─ Get presigned URL
    ↓
Database Response
    ↓
Return to Frontend
    ↓
ExpertPortal.tsx (Profile Preview)
    ├─ Show success message
    ├─ Display profile preview
    └─ Offer "Back to Home" button
```

---

## Security Architecture

### Authentication & Authorization

```
┌─────────────────────────────────────────────────────┐
│         Admin Login (OAuth via Manus)               │
│  1. User clicks "Admin Sign In"                     │
│  2. Redirected to Manus OAuth portal                │
│  3. User authenticates with Manus account           │
│  4. OAuth callback to /api/oauth/callback           │
│  5. Session cookie created (JWT)                    │
│  6. Redirected to /admin dashboard                  │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│         Session Management                          │
│  - JWT stored in secure HTTP-only cookie            │
│  - Signed with JWT_SECRET                           │
│  - Verified on every tRPC request                   │
│  - Includes user ID, role, and expiration           │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│         Role-Based Access Control                   │
│  - User role: 'admin' or 'user'                     │
│  - publicProcedure: No auth required                │
│  - protectedProcedure: Auth required                │
│  - adminProcedure: Admin role required              │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│         Expert Email Verification                   │
│  1. Expert registers with email                     │
│  2. Verification token generated                    │
│  3. Token sent via email (or displayed in dev)      │
│  4. Expert enters token to verify                   │
│  5. Profile submission allowed after verification   │
└─────────────────────────────────────────────────────┘
```

### Data Protection

| Layer | Protection |
|-------|-----------|
| **Transport** | HTTPS (TLS 1.2+) |
| **Authentication** | JWT with secure cookies |
| **Authorization** | Role-based access control |
| **Input Validation** | Zod schema validation |
| **Database** | SQL injection prevention via ORM |
| **Sensitive Data** | S3 presigned URLs for CV access |
| **Passwords** | OAuth (no password storage) |

### CORS & CSRF Protection

```typescript
// Express CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// CSRF tokens via cookies
// Session cookies are HTTP-only and Secure
```

---

## Scalability & Performance

### Performance Optimizations

1. **Database Indexing**
   - Primary keys on all tables
   - Foreign key indexes
   - Search field indexes (email, name)

2. **Query Optimization**
   - Lazy loading relationships
   - Pagination for large datasets
   - Efficient joins in database helpers

3. **Frontend Caching**
   - tRPC query caching
   - Optimistic updates
   - Stale-while-revalidate pattern

4. **Build Optimization**
   - Code splitting with Vite
   - Tree-shaking unused code
   - Minification & compression

### Scalability Considerations

1. **Database Scaling**
   - Use TiDB for horizontal scaling
   - Connection pooling
   - Read replicas for reporting

2. **API Scaling**
   - Stateless Express servers
   - Load balancing
   - Horizontal pod autoscaling

3. **File Storage**
   - S3 for unlimited storage
   - CDN for CV downloads
   - Presigned URLs for security

4. **Monitoring**
   - Application logs
   - Database query performance
   - API response times
   - Error tracking

---

## Deployment Architecture

### Deployment Pipeline

```
┌──────────────────────────────────────────────────────┐
│         Development (Local)                          │
│  pnpm dev → http://localhost:3000                    │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│         Version Control (GitHub)                     │
│  git push → noblemavely/alternative-ens              │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│         Checkpoint (Manus)                           │
│  webdev_save_checkpoint → Snapshot project state     │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│         Build (Docker/ECR)                           │
│  pnpm build → Docker image → ECR registry            │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│         Deployment (Manus Platform)                  │
│  Click Publish → Deploy to production                │
│  Domain: expert-net-ggrdr6ye.manus.space             │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│         Production (Live)                            │
│  https://expert-net-ggrdr6ye.manus.space             │
└──────────────────────────────────────────────────────┘
```

### Environment Configuration

**Development**:
```env
NODE_ENV=development
DEBUG=true
DATABASE_URL=local_mysql_connection
```

**Production**:
```env
NODE_ENV=production
DEBUG=false
DATABASE_URL=managed_mysql_connection
```

### Monitoring & Logging

| Component | Log Location | Purpose |
|-----------|--------------|---------|
| Dev Server | `.manus-logs/devserver.log` | Server startup, HMR |
| Browser Console | `.manus-logs/browserConsole.log` | Client-side errors |
| Network | `.manus-logs/networkRequests.log` | API requests |
| Session | `.manus-logs/sessionReplay.log` | User interactions |

---

## Key Architectural Decisions

### 1. ClientContactId Relationship

**Decision**: Projects are linked to `clientContactId` instead of `clientId`

**Rationale**:
- Better tracking of which contact shared the project
- Enables multi-contact support per client
- More granular relationship management

**Impact**:
- Database migration required
- All project queries use clientContactId
- Cascading contact selection in UI

### 2. Master Lists for Categorization

**Decision**: Sector and Function are stored in database master lists

**Rationale**:
- Admins can customize categories
- Consistent categorization across platform
- Easy to add new sectors/functions

**Impact**:
- Configurable via AdminSettings page
- All dropdowns pull from database
- Validation against master list values

### 3. S3 for File Storage

**Decision**: CV documents stored in S3, not database

**Rationale**:
- Database remains lean
- Scalable file storage
- Presigned URLs for secure access
- CDN integration for downloads

**Impact**:
- File metadata stored in database
- S3 credentials required
- Presigned URL generation needed

### 4. tRPC for API

**Decision**: Use tRPC instead of REST API

**Rationale**:
- Type-safe end-to-end
- Automatic TypeScript inference
- Reduced boilerplate
- Better developer experience

**Impact**:
- Frontend and backend types synchronized
- Easier refactoring
- Smaller bundle size

---

## Future Enhancements

### Planned Features

1. **Advanced Analytics**
   - Expert utilization rates
   - Project completion tracking
   - Client engagement metrics

2. **Expert Matching Algorithm**
   - AI-powered expert recommendations
   - Skill-based matching
   - Availability-based matching

3. **Communication Platform**
   - In-app messaging
   - Video call integration
   - Document sharing

4. **Payment Integration**
   - Stripe payment processing
   - Invoice generation
   - Expense tracking

5. **Mobile App**
   - React Native implementation
   - Offline support
   - Push notifications

---

## Maintenance & Operations

### Regular Maintenance Tasks

1. **Database Maintenance**
   - Backup verification
   - Index optimization
   - Query performance monitoring

2. **Security Updates**
   - Dependency updates
   - Security patches
   - Penetration testing

3. **Performance Monitoring**
   - API response times
   - Database query times
   - Error rates

4. **Documentation Updates**
   - Keep README current
   - Update architecture docs
   - Maintain API documentation

---

**Document Version**: 1.0.0  
**Last Updated**: April 10, 2026  
**Next Review**: April 17, 2026  
**Maintained By**: Development Team
