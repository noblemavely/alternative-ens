# Contributing to Alternative ENS

Thank you for your interest in contributing to Alternative - Expert Network Service! This document provides guidelines and workflows for contributing code, documentation, and improvements.

## Table of Contents

- [Development Workflow](#development-workflow)
- [Setting Up Your Environment](#setting-up-your-environment)
- [Git Workflow](#git-workflow)
- [GitHub Issues](#github-issues)
- [Pull Requests](#pull-requests)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## Development Workflow

### 1. Create a GitHub Issue

Before starting any significant work, create an issue to describe:
- **What needs to be done** (feature, bug fix, improvement)
- **Why it's needed** (context and motivation)
- **Acceptance criteria** (how you'll know it's complete)
- **Related issues** (if any)

### 2. Create a Feature Branch

```bash
# Update main branch
git fetch origin
git checkout main
git pull origin main

# Create feature branch (use descriptive name)
git checkout -b feature/cv-upload-capability
# or for bug fixes:
git checkout -b fix/shortlist-status-update
```

**Branch naming conventions:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/improvements
- `chore/` - Maintenance tasks

### 3. Make Your Changes

#### Write Code
- Follow existing code patterns and style
- Keep commits atomic and focused
- Reference the issue number in commit messages

#### Write Tests
- Add tests for new functionality
- Ensure existing tests pass
- Aim for >80% code coverage on new code

#### Update Documentation
- Update README if adding features
- Document new API endpoints
- Add comments for complex logic
- Update ARCHITECTURE.md if structure changes

### 4. Commit Your Changes

```bash
# Stage your changes
git add file1.ts file2.tsx

# Commit with descriptive message
git commit -m "feat: Add CV upload capability to admin page

- Add file input field to Professional Information card
- Support PDF, DOC, DOCX formats
- Display selected filename with checkmark
- Implement CV upload handler using tRPC endpoint
- Auto-update expert profile with cvUrl

Closes #1"
```

**Commit message format:**
```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions
- `chore:` - Build, dependencies, etc.

**Body:**
- Explain what and why, not how
- Use bullet points for multiple changes
- Keep lines under 72 characters

**Footer:**
- `Closes #123` - Close an issue
- `Fixes #123` - Fix a bug
- `Relates to #123` - Reference related issues
- `Co-Authored-By: Name <email>` - Credit co-authors

### 5. Push and Create Pull Request

```bash
# Push to remote
git push origin feature/cv-upload-capability

# Create PR (either via gh CLI or GitHub UI)
gh pr create \
  --title "Add CV upload capability to admin expert detail page" \
  --body "$(cat <<'EOF'
## Summary
- Implemented file upload for expert CVs in admin interface
- Support for PDF, DOC, DOCX formats
- Local filesystem storage for development

## Changes
- Modified AdminExpertDetail.tsx with file input and upload handler
- Updated Express middleware to serve uploads directory
- Added CV viewer section with DocumentViewer integration

## Testing
- ✅ Upload file through admin interface
- ✅ Verify CV appears in viewer
- ✅ Test with different file formats

Closes #1
EOF
)"
```

## Setting Up Your Environment

### Prerequisites
- Node.js v22.13.0+
- pnpm v9.0.0+
- MySQL/TiDB instance
- Git

### Initial Setup

```bash
# Clone repository
git clone https://github.com/noblemavely/alternative-ens.git
cd alternative-ens

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your database credentials

# Setup database
mysql -u root -e "CREATE DATABASE alternative_ens;"
pnpm db:push

# Seed sample data
node seed-db.mjs

# Start development server
pnpm dev
```

## Git Workflow

### Before Starting Work

```bash
# Ensure you're on main and up to date
git checkout main
git fetch origin
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name
```

### While Working

```bash
# Check status regularly
git status

# Commit frequently with clear messages
git commit -m "feat: implement specific functionality"

# Push to GitHub
git push origin feature/your-feature-name
```

### After Completing Work

```bash
# Ensure your branch is up to date
git fetch origin
git rebase origin/main

# Resolve any conflicts if they exist
git add resolved-files
git rebase --continue

# Push rebased changes
git push --force-with-lease origin feature/your-feature-name
```

## GitHub Issues

### Creating an Issue

Use the following template:

```markdown
## Description
Clear description of the issue or feature.

## Current Behavior
What currently happens (for bug reports).

## Expected Behavior
What should happen.

## Steps to Reproduce
1. Step 1
2. Step 2
3. ...

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Additional Context
Links, screenshots, or other relevant information.
```

### Issue Labels

- `bug` - Something isn't working
- `feature` - New feature request
- `enhancement` - Improvement to existing feature
- `documentation` - Documentation updates needed
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `wontfix` - This will not be worked on

## Pull Requests

### Before Creating a PR

- [ ] Branch created from latest main
- [ ] Code follows project style
- [ ] Tests added and passing
- [ ] Documentation updated
- [ ] No unrelated changes
- [ ] Commits are atomic and well-described

### PR Template

```markdown
## Description
Brief description of changes and why they're needed.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Added/updated tests
- [ ] All tests passing
- [ ] Tested manually

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Ready for review
```

### PR Review Process

1. **Automated Checks**
   - Tests must pass
   - Code coverage maintained
   - Linting must pass

2. **Code Review**
   - At least one approval required
   - Constructive feedback on changes
   - Discussion of implementation approach

3. **Merge**
   - Squash commits if needed
   - Use "Squash and merge" for feature branches
   - Use "Create a merge commit" for release branches
   - Delete branch after merge

## Code Standards

### TypeScript

- Use strict mode
- Avoid `any` types
- Use interfaces over types (for exported APIs)
- Export types from files

### React Components

- Use functional components with hooks
- Destructure props in function signature
- Use const for components and functions
- Prefer composition over inheritance

### Database

- Use Drizzle ORM patterns
- Validate user input
- Use parameterized queries
- Handle errors gracefully

### API Routes

- Use tRPC procedures
- Implement proper error handling
- Add input validation
- Document with JSDoc comments

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Writing Tests

- Test behavior, not implementation
- Use descriptive test names
- Setup and teardown properly
- Mock external dependencies
- Aim for >80% coverage on new code

## Documentation

### README.md

Update when:
- Adding new features
- Changing setup process
- Updating architecture

### ARCHITECTURE.md

Update when:
- Significant architectural changes
- New component patterns
- Modified data flow

### Code Comments

Add comments for:
- Complex algorithms
- Non-obvious implementations
- Edge cases and workarounds
- TODO items with context

### GITHUB_WORKFLOW.md

Update when:
- CI/CD process changes
- Deployment procedure changes
- Required tools or services change

## Questions?

- Check existing issues and discussions
- Review documentation in README.md
- Look at similar implementations in the codebase
- Ask in GitHub discussions

## Code of Conduct

- Be respectful and constructive
- Welcome feedback and different perspectives
- Focus on the code, not the person
- Help others learn and grow

Thank you for contributing to Alternative ENS!
