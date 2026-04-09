# Alternative ENS Platform - TODO

## Database & Schema
- [x] Design and implement database schema (Clients, Experts, Projects, ScreeningQuestions, Shortlists, ExpertEducation, ExpertEmployment, ExpertVerification)
- [x] Run Drizzle migrations and verify database tables
- [x] Create database helper functions in server/db.ts

## Backend API (tRPC Procedures)
- [x] Create clients router: create, list, update, delete, getById
- [x] Create experts router: create, list, update, delete, getById, search (with filters)
- [x] Create projects router: create, list, update, delete, getById
- [x] Create screening questions router: add, update, delete
- [x] Create shortlist router: add expert to project, remove, list by project
- [x] Create expert employment history router: add, update, delete
- [x] Create expert education history router: add, update, delete
- [x] Create expert verification router: send verification email, verify email token
- [x] Create file upload router: upload CV to S3
- [x] Create LinkedIn parsing router: simulate LinkedIn profile parsing

## Admin Dashboard
- [x] Build Admin Dashboard layout with sidebar navigation
- [x] Implement role-based access control (admin-only routes)
- [x] Create navigation menu with links to Clients, Experts, Projects, Search
- [x] Add user profile dropdown and logout functionality
- [x] Create dashboard home/overview page

## Admin Client Management
- [x] Build Clients list page with table view
- [x] Create Client creation form (name, contact details, company info)
- [x] Create Client edit form
- [x] Implement Client delete functionality
- [x] Add search/filter for clients list

## Admin Expert Management
- [x] Build Experts list page with table view
- [x] Create Expert creation form (email, phone, sector, function, biography)
- [x] Create Expert edit form
- [ ] Implement CV upload functionality (S3 integration)
- [x] Add LinkedIn URL input field
- [x] Create Expert delete functionality
- [x] Add search/filter for experts list

## Admin Project Management
- [x] Build Projects list page with table view
- [x] Create Project creation form with all fields
- [ ] Implement rich text editor for Project Description/Scope
- [x] Create screening questions management (add/remove multiple questions)
- [x] Implement Project Type dropdown (Call, Advisory, ID)
- [x] Add Target Companies comma-separated input
- [x] Add hourly rate input field
- [x] Create Project edit form
- [x] Implement Project delete functionality

## Expert Search & Shortlisting
- [x] Build Advanced Expert Search page
- [x] Implement filter by sector
- [x] Implement filter by function
- [ ] Implement filter by skillsets
- [x] Implement keyword search
- [x] Create expert search results display
- [x] Build shortlist modal/form to add expert to project
- [ ] Create shortlist management view (view experts shortlisted for a project)
- [ ] Implement remove from shortlist functionality

## Public Expert Profile Portal
- [x] Build public expert registration page
- [x] Implement email verification flow with code display
- [x] Create expert profile form (basic info, employment, education, CV, sector, function, biography)
- [x] Build employment history form (add/edit/delete entries)
- [x] Build education history form (add/edit/delete entries)
- [ ] Implement CV upload functionality
- [x] Create expert profile completion/submission flow
- [ ] Build expert profile view page (for verified experts)

## LinkedIn Profile Simulation & Parsing
- [x] Build LinkedIn URL input component
- [x] Create LinkedIn profile parser (simulate API call)
- [x] Implement auto-population of profile fields from parsed data
- [x] Add validation for LinkedIn URLs
- [ ] Test parsing with sample LinkedIn profiles

## UI/UX & Branding
- [x] Define elegant color palette and typography
- [x] Update global styles in index.css
- [x] Create consistent component styling with Tailwind
- [x] Add "Alternative" branding (logo, favicon, app title)
- [x] Implement responsive design for all pages
- [x] Add loading states and error handling UI
- [x] Create empty states for lists
- [x] Implement toast notifications for success/error messages
- [x] Add smooth transitions and micro-interactions
- [x] Polish form validation and error messages

## Testing & Quality Assurance
- [x] Write vitest tests for backend procedures
- [x] Write vitest tests for database helpers
- [x] Test all CRUD operations for Clients, Experts, Projects
- [x] Test expert search with various filters
- [x] Test email verification flow (with code display)
- [ ] Test CV upload functionality
- [x] Test LinkedIn parsing functionality
- [ ] Manual testing of admin workflows
- [ ] Manual testing of expert portal
- [ ] Cross-browser testing

## Deployment & Final Steps
- [ ] Verify all environment variables are set
- [ ] Run full test suite
- [ ] Check for console errors and warnings
- [ ] Create final checkpoint
- [ ] Prepare deployment documentation
