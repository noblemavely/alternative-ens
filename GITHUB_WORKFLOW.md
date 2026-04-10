# GitHub Issue Management Workflow

**Version**: 1.0.0  
**Last Updated**: April 10, 2026  
**Status**: Active

## Overview

This document outlines the automated GitHub issue management workflow for the Alternative ENS platform. All bugs, issues, and feature requests are tracked through GitHub Issues with automated lifecycle management.

## Issue Lifecycle

### 1. Issue Creation

Issues are created automatically when:
- **New bugs are discovered** during development or testing
- **User reports issues** via support channels
- **Recurring problems** are identified

**Issue Template**:
```markdown
## Title
[Clear, concise description of the issue]

## Description
[Detailed explanation of the problem]

## Steps to Reproduce
1. [First step]
2. [Second step]
3. [Expected vs actual result]

## Environment
- Node version: 
- Database: 
- Browser: 
- Platform: 

## Labels
- Type: bug/enhancement/documentation
- Priority: critical/high/medium/low
- Status: open/in-progress/blocked
```

### 2. Issue Triage

Upon creation, issues are:
- **Labeled** with appropriate categories
- **Assigned** to responsible developer
- **Prioritized** based on severity
- **Linked** to related issues

**Standard Labels**:
| Label | Purpose |
|-------|---------|
| `bug` | Defects in functionality |
| `enhancement` | New features or improvements |
| `documentation` | README, API docs, architecture |
| `critical` | Blocks deployment or core functionality |
| `high` | Significant impact on users |
| `medium` | Standard priority features |
| `low` | Nice-to-have improvements |
| `in-progress` | Currently being worked on |
| `blocked` | Waiting for external dependency |
| `testing` | Needs QA verification |

### 3. Issue Investigation

Developer:
1. **Reads issue description** and understands the problem
2. **Reproduces the issue** locally if possible
3. **Investigates root cause** in codebase
4. **Documents findings** in issue comments
5. **Creates GitHub branch** from issue (if applicable)

**Branch Naming**:
```
feature/issue-#123-description
bugfix/issue-#456-description
docs/issue-#789-description
```

### 4. Issue Resolution

### 4a. Bug Fix

```
Issue Created
    ↓
Reproduce Bug
    ↓
Identify Root Cause
    ↓
Implement Fix
    ↓
Write/Update Tests
    ↓
Run Full Test Suite (pnpm test)
    ↓
Commit with Reference: "Fix #123: description"
    ↓
Push to GitHub
    ↓
Create Pull Request
    ↓
Code Review
    ↓
Merge to main
    ↓
Verify in Production
    ↓
Close Issue (Auto via commit message)
```

### 4b. Feature Implementation

```
Enhancement Issue Created
    ↓
Design Feature
    ↓
Implement Feature
    ↓
Write Tests
    ↓
Update Documentation
    ↓
Commit with Reference: "Implement #123: description"
    ↓
Push to GitHub
    ↓
Create Pull Request
    ↓
Code Review
    ↓
Merge to main
    ↓
Deploy to Production
    ↓
Close Issue (Auto via commit message)
```

### 5. Issue Closure

Issues are closed when:
- **Fix is implemented and tested**
- **Feature is complete and deployed**
- **Documentation is updated**
- **All tests pass**

**Automatic Closure**:
```bash
# Commit message that closes issue
git commit -m "Fix #123: description of fix"
# or
git commit -m "Closes #456: description"
# or
git commit -m "Resolves #789: description"
```

**Manual Closure**:
- Click "Close issue" button on GitHub
- Add comment explaining resolution
- Link to related PR or commit

### 6. Issue Reopening

Issues are reopened if:
- **Problem recurs** in later commits
- **Fix was incomplete**
- **Related issue discovered**
- **Regression detected**

**Reopening Process**:
1. Click "Reopen issue" button
2. Add comment explaining recurrence
3. Update labels if needed
4. Assign to developer
5. Create new branch for fix

---

## Issue Categories & Workflows

### Bug Issues

**Severity Levels**:
- **Critical**: Application crash, data loss, security breach
- **High**: Feature broken, significant user impact
- **Medium**: Feature partially broken, workaround available
- **Low**: Minor UI issue, cosmetic problem

**Bug Workflow**:
```
Report Bug
    ↓
Verify Reproducibility
    ↓
Identify Affected Versions
    ↓
Determine Root Cause
    ↓
Implement Fix
    ↓
Test Fix
    ↓
Deploy Fix
    ↓
Verify in Production
    ↓
Close Issue
```

**Example Bug Issue**:
```markdown
## Title
Admin dashboard crashes when seeding data with 0 records

## Description
When clicking "Seed Sample Data" button with an empty database, 
the admin dashboard crashes with a TypeError.

## Steps to Reproduce
1. Clear all data using "Clear All Data" button
2. Click "Seed Sample Data" button
3. Observe crash

## Expected Behavior
Dashboard should seed 60+ sample records without crashing

## Actual Behavior
TypeError: Cannot read property 'id' of undefined

## Error Log
[Stack trace from browser console]

## Environment
- Node: v22.13.0
- Database: MySQL
- Browser: Chrome 124
- Platform: Manus WebDev
```

### Enhancement Issues

**Enhancement Workflow**:
```
Feature Request
    ↓
Define Requirements
    ↓
Design Solution
    ↓
Implement Feature
    ↓
Write Tests
    ↓
Update Documentation
    ↓
Deploy Feature
    ↓
Gather User Feedback
    ↓
Close Issue
```

**Example Enhancement Issue**:
```markdown
## Title
Add CV document viewer to expert profile page

## Description
Currently, CV documents are only accessible via download. 
Add an in-browser viewer for PDFs and other document formats.

## Requirements
- Display CV in modal or side panel
- Support PDF, DOC, DOCX formats
- Allow download from viewer
- Show document metadata (upload date, size)

## Acceptance Criteria
- [ ] CV viewer component created
- [ ] Integrated into AdminExpertDetail page
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Works on desktop and mobile

## Related Issues
#45 - CV upload functionality
#67 - Document management system
```

### Documentation Issues

**Documentation Workflow**:
```
Documentation Gap Identified
    ↓
Create Issue
    ↓
Write/Update Documentation
    ↓
Review Documentation
    ↓
Merge Changes
    ↓
Close Issue
```

**Example Documentation Issue**:
```markdown
## Title
Update README with database setup instructions

## Description
README is missing detailed database setup steps.
Users report difficulty setting up MySQL connection.

## Required Sections
- [ ] MySQL installation
- [ ] Database creation
- [ ] User permissions
- [ ] Connection string format
- [ ] Troubleshooting

## Files to Update
- README.md
- ARCHITECTURE.md
- docs/setup-guide.md
```

---

## Current Issues (April 10, 2026)

### Open Issues (16 Total)

#### Critical/High Priority
None currently

#### Medium Priority
1. **#33**: Redirect /admin to admin login page if not logged in
2. **#34**: Implement admin login page with email/password authentication

#### Low Priority / Enhancements
3. **#4**: Fix expert profile: show only tagged projects, merge with shortlist section
4. **#20**: Add CV document viewer to expert profile page
5. **#21**: Remove Search Experts from main navigation
6. **#22**: Fix shortlisted experts table in projects page
7. **#23**: Add client name column to projects listing page
8. **#24**: Add client name filter to projects listing page
9. **#25**: Refactor client profile page to remove Mapped Experts section
10. **#26**: Remove Name and Email fields from client profile display
11. **#27**: Add client contact listing section in client profile page
12. **#28**: Implement multi-contact support UI in client profile
13. **#29**: Implement contact selection in project creation form
14. **#30**: Wire Sector dropdown in Expert edit to use master list
15. **#31**: Wire Function dropdown in Expert edit to use master list
16. **#32**: Wire Sector dropdown in Client edit to use master list

### Closed Issues (0 Total)

---

## Issue Management Best Practices

### For Developers

1. **Check Existing Issues Before Creating New Ones**
   ```bash
   gh issue list --state open
   gh issue view #123
   ```

2. **Link Related Issues**
   - Use "Linked issues" section
   - Reference in comments: "Related to #456"
   - Use "Blocks" relationship for dependencies

3. **Keep Issues Updated**
   - Add comments on progress
   - Update labels as status changes
   - Link to PRs and commits

4. **Close Issues Properly**
   - Use commit message references
   - Add closing comment explaining solution
   - Verify fix in production

5. **Reopen Issues When Needed**
   - Don't create duplicate issues
   - Add comment explaining recurrence
   - Update reproduction steps if changed

### For Code Reviews

1. **Reference Issues in PRs**
   ```markdown
   ## Fixes
   - Closes #123
   - Closes #456
   
   ## Related
   - Related to #789
   ```

2. **Verify Issue Requirements**
   - Check acceptance criteria
   - Verify all tests pass
   - Review documentation updates

3. **Link to Issues in Comments**
   - "This addresses #123"
   - "Partially fixes #456"
   - "Blocked by #789"

### For Testing

1. **Create Test Issues**
   - "Test: Create a client" (#331)
   - "Test: Search experts by sector" (#332)
   - "Test: Shortlist expert to project" (#333)

2. **Report Test Results**
   - Add comment with test results
   - Include environment details
   - Attach screenshots if relevant

3. **Verify Fixes**
   - Test in development
   - Test in staging
   - Test in production

---

## Automated Issue Management

### GitHub Actions (Future)

```yaml
# .github/workflows/issue-management.yml
name: Issue Management

on:
  issues:
    types: [opened, labeled, unlabeled]
  pull_request:
    types: [opened, closed]

jobs:
  auto-close-on-merge:
    runs-on: ubuntu-latest
    steps:
      - name: Close issue on PR merge
        uses: actions/github-script@v6
        with:
          script: |
            // Auto-close linked issues when PR merges
```

### Commit Message Conventions

**Close Issues**:
```bash
git commit -m "Fix #123: description of fix"
git commit -m "Closes #456: description"
git commit -m "Resolves #789: description"
```

**Reference Issues**:
```bash
git commit -m "feat: description (see #123)"
git commit -m "docs: update README (related to #456)"
```

---

## Issue Templates

### Bug Report Template

```markdown
## Describe the bug
A clear and concise description of what the bug is.

## Steps to reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected behavior
What you expected to happen.

## Actual behavior
What actually happened.

## Screenshots
If applicable, add screenshots to help explain your problem.

## Environment
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Node version: [e.g. 22.13.0]
- Database: [e.g. MySQL 8.0]

## Additional context
Add any other context about the problem here.
```

### Feature Request Template

```markdown
## Is your feature request related to a problem?
A clear and concise description of what the problem is.

## Describe the solution you'd like
A clear and concise description of what you want to happen.

## Describe alternatives you've considered
A clear and concise description of any alternative solutions or features you've considered.

## Additional context
Add any other context or screenshots about the feature request here.

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
```

---

## Monitoring & Reporting

### Weekly Issue Review

Every Monday:
1. Review all open issues
2. Update priorities based on business needs
3. Identify blocked issues
4. Assign new issues to developers
5. Close completed issues

### Monthly Issue Report

End of each month:
1. Count issues created vs closed
2. Identify trends in issue types
3. Review average resolution time
4. Plan for next month

### Issue Metrics

Track:
- **Total open issues**: Target < 30
- **Average resolution time**: Target < 3 days
- **Bug resolution rate**: Target > 95%
- **Critical issues**: Target = 0

---

## Integration with Development

### Local Development

```bash
# Create branch from issue
gh issue develop #123

# View issue details
gh issue view #123

# Add comment to issue
gh issue comment #123 -b "Working on this fix"

# Close issue
gh issue close #123 -r "Fixed in commit abc123"
```

### Pull Request Integration

```bash
# Link PR to issue
# In PR description:
Closes #123
Closes #456

# Auto-close on merge
# GitHub automatically closes linked issues
```

### Deployment Integration

After deployment:
1. Verify fixes in production
2. Add deployment comment to issue
3. Close issue if verified
4. Reopen if problem persists

---

## Communication

### Issue Notifications

- **Assigned**: Developer receives notification
- **Mentioned**: User receives notification
- **Commented**: All watchers receive notification
- **Closed**: Creator receives notification

### Escalation Path

```
Issue Created
    ↓ (No response in 24 hours)
Assign to Team Lead
    ↓ (No response in 48 hours)
Escalate to Project Manager
    ↓ (No response in 72 hours)
Escalate to CTO
```

### Status Updates

For long-running issues:
- Add comment every 2-3 days
- Update progress percentage
- Mention any blockers
- Request help if needed

---

## Archive & Historical Records

### Closed Issues Archive

Closed issues are archived after:
- 30 days of inactivity
- Moved to GitHub Discussions if needed
- Exported to historical records

### Issue History

Access historical issues:
```bash
gh issue list --state closed --limit 100
gh issue view #123 --json body,comments
```

---

## References

- [GitHub Issues Documentation](https://docs.github.com/en/issues)
- [GitHub Issue Templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests)
- [GitHub Actions for Issue Management](https://github.com/marketplace?type=actions&query=issue)

---

**Document Version**: 1.0.0  
**Last Updated**: April 10, 2026  
**Next Review**: April 17, 2026  
**Maintained By**: Development Team
