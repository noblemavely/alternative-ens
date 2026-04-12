# Deployment Testing Guide

Complete this guide to verify that your deployment pipeline is working correctly.

---

## Pre-Testing Checklist

Before running tests, verify:

- [ ] All GitHub secrets are configured
- [ ] SSH key is added to Hostinger `~/.ssh/authorized_keys`
- [ ] Application is deployed on Hostinger
- [ ] Database is initialized
- [ ] PM2 is running the application
- [ ] You can SSH into Hostinger without password

---

## Test 1: GitHub Actions Workflow Trigger

### Objective
Verify that GitHub Actions workflow runs when code is pushed.

### Steps

1. **Make a test change:**
   ```bash
   cd /Users/noblemavely/Downloads/alternative-ens
   
   # Add a test file
   echo "# Deployment Test $(date)" > TEST_DEPLOYMENT.md
   git add TEST_DEPLOYMENT.md
   ```

2. **Commit and push:**
   ```bash
   git commit -m "[Claude AI] test: trigger deployment workflow for verification"
   git push origin main
   ```

3. **Monitor GitHub Actions:**
   - Go to: https://github.com/noblemavely/alternative-ens/actions
   - Click: Latest workflow run "Deploy to Hostinger Production"
   - Watch for: ✅ All green checkmarks

4. **Expected Timeline:**
   - 0-10 seconds: Build starts
   - 30-60 seconds: Tests run
   - 60-90 seconds: Files uploaded via FTP
   - 90-120 seconds: SSH deployment starts
   - 120-150 seconds: Database backups and migrations
   - 150-180 seconds: Application restarts

### Success Criteria
- ✅ Workflow shows "✅ Success" badge
- ✅ All steps completed without errors
- ✅ Deployment duration: 2-5 minutes

### Troubleshooting
```bash
# If workflow fails:
# 1. Check GitHub Actions logs for error message
# 2. Verify GitHub secrets are set correctly
# 3. Check Hostinger connectivity:
ssh -p 65002 u263459454@82.112.229.19 "echo 'SSH works!'"
```

---

## Test 2: File Deployment Verification

### Objective
Verify that files are correctly uploaded to Hostinger.

### Steps

1. **SSH into Hostinger:**
   ```bash
   ssh -p 65002 u263459454@82.112.229.19
   ```

2. **Check FTP Upload Directory:**
   ```bash
   # List files in public_html/alternative/
   ls -lah ~/public_html/alternative/ | head -20
   
   # Check file sizes
   du -sh ~/public_html/alternative/
   
   # Look for dist files
   ls ~/public_html/alternative/dist/ 2>/dev/null | wc -l
   ```

3. **Verify Key Files Exist:**
   ```bash
   # Check these files/directories
   [ -f ~/public_html/alternative/package.json ] && echo "✅ package.json found"
   [ -d ~/public_html/alternative/dist ] && echo "✅ dist directory found"
   [ -d ~/public_html/alternative/drizzle ] && echo "✅ drizzle directory found"
   [ -f ~/public_html/alternative/seed-db.mjs ] && echo "✅ seed-db.mjs found"
   ```

4. **Check Application Directory:**
   ```bash
   # Go to app directory
   cd ~/alternative-ens
   
   # List files
   ls -la
   
   # Check node_modules
   [ -d node_modules ] && echo "✅ node_modules installed" || echo "❌ node_modules missing"
   ```

### Success Criteria
- ✅ dist/ directory exists with compiled files
- ✅ package.json is present
- ✅ node_modules directory exists
- ✅ drizzle/ directory exists

### Troubleshooting
```bash
# If files are missing:

# 1. Check FTP upload status
cd ~/public_html/alternative
find . -type f -newer /tmp -ls 2>/dev/null | head -10

# 2. Check if Git pull worked
cd ~/alternative-ens
git log --oneline | head -3

# 3. Check if dependencies were installed
npm list --depth=0 | head -5
```

---

## Test 3: Database Connection Verification

### Objective
Verify that the database is accessible and migrations are applied.

### Steps

1. **SSH into Hostinger:**
   ```bash
   ssh -p 65002 u263459454@82.112.229.19
   ```

2. **Test Database Connection:**
   ```bash
   # Connect to MySQL
   mysql -h 82.112.229.19 -u u263459454_alternative -p u263459454_alternative -e "SELECT VERSION();"
   
   # When prompted, enter your database password
   ```

3. **Verify Database Structure:**
   ```bash
   # List tables
   mysql -h 82.112.229.19 -u u263459454_alternative -p u263459454_alternative -e "SHOW TABLES;"
   
   # Expected tables:
   # - clients
   # - clientContacts
   # - experts
   # - projects
   # - shortlists
   # (and others)
   ```

4. **Verify Data Was Seeded:**
   ```bash
   # Check project count
   mysql -h 82.112.229.19 -u u263459454_alternative -p u263459454_alternative -e "SELECT COUNT(*) as 'Projects' FROM projects;"
   
   # Check expert count
   mysql -h 82.112.229.19 -u u263459454_alternative -p u263459454_alternative -e "SELECT COUNT(*) as 'Experts' FROM experts;"
   
   # Expected:
   # Projects: 6+
   # Experts: 5+
   ```

5. **Check Database User Permissions:**
   ```bash
   # Verify user can perform basic operations
   mysql -h 82.112.229.19 -u u263459454_alternative -p u263459454_alternative -e "SELECT USER();"
   ```

### Success Criteria
- ✅ MySQL connection successful
- ✅ All required tables exist
- ✅ Seed data is present (6+ projects, 5+ experts)
- ✅ User has SELECT, INSERT, UPDATE, DELETE permissions

### Troubleshooting
```bash
# If database connection fails:

# 1. Check DATABASE_URL format
echo $DATABASE_URL

# 2. Verify credentials
mysql -h 82.112.229.19 -u u263459454_alternative -p

# 3. Check if MySQL service is running on Hostinger
# (This is usually Hostinger managed, so contact support if down)

# 4. Verify IP whitelist if needed
# (Hostinger may have IP restrictions)
```

---

## Test 4: Application Health Check

### Objective
Verify that the application is running and responding to requests.

### Steps

1. **SSH into Hostinger:**
   ```bash
   ssh -p 65002 u263459454@82.112.229.19
   ```

2. **Check PM2 Status:**
   ```bash
   # List all PM2 apps
   pm2 list
   
   # Check alternative-ens specifically
   pm2 describe alternative-ens
   
   # Expected status: online ✓
   ```

3. **Check Application Logs:**
   ```bash
   # View last 30 lines
   pm2 logs alternative-ens --lines 30 --nostream
   
   # Look for errors or warnings
   ```

4. **Test Local Connection:**
   ```bash
   # Test HTTP endpoint
   curl -s http://localhost:3000/ | head -20
   
   # Should return HTML content
   ```

5. **Test Application Endpoints:**
   ```bash
   # Test API health
   curl -s http://localhost:3000/api/trpc/auth.me | jq .
   
   # Should return JSON response
   ```

### Success Criteria
- ✅ PM2 shows "online" status
- ✅ No errors in PM2 logs
- ✅ HTTP/200 response from localhost:3000
- ✅ API endpoints return valid JSON

### Troubleshooting
```bash
# If application is not running:

# 1. Check process status
ps aux | grep pnpm

# 2. Check PM2 logs for errors
pm2 logs alternative-ens --follow

# 3. Restart application
pm2 restart alternative-ens
sleep 5
pm2 logs alternative-ens --lines 20 --nostream

# 4. Check port availability
netstat -tlnp | grep 3000

# 5. Check environment variables
cd ~/alternative-ens
cat .env | grep DATABASE_URL
```

---

## Test 5: Production Website Accessibility

### Objective
Verify that the website is accessible at the production domain.

### Steps

1. **Check Domain Accessibility:**
   ```bash
   # From your local machine
   curl -I https://alternative.nativeworld.com/
   
   # Should show HTTP/2 200 or 301
   ```

2. **Check SSL Certificate:**
   ```bash
   # Verify SSL is valid
   curl -v https://alternative.nativeworld.com/ 2>&1 | grep "SSL\|certificate"
   
   # Should show: "SSL certificate verify ok"
   ```

3. **Load Website in Browser:**
   - Open: https://alternative.nativeworld.com/
   - Should see: Alternative ENS homepage
   - Check: No SSL warnings

4. **Test API Endpoints:**
   ```bash
   # Test from local machine
   curl -s https://alternative.nativeworld.com/api/trpc/auth.me | jq .
   
   # Should return JSON response
   ```

5. **Check DNS Resolution:**
   ```bash
   # Verify DNS points to Hostinger
   nslookup alternative.nativeworld.com
   
   # Should show: 82.112.229.19 (Hostinger IP)
   ```

### Success Criteria
- ✅ HTTPS connection successful
- ✅ SSL certificate is valid
- ✅ Homepage loads without errors
- ✅ API responds with JSON
- ✅ DNS resolves to Hostinger IP

### Troubleshooting
```bash
# If website is not accessible:

# 1. Check if DNS has propagated
nslookup alternative.nativeworld.com
# Wait 5-60 minutes for DNS propagation

# 2. Check Hostinger subdomain configuration
# Go to: Hostinger → Domains → Your Domain → DNS
# Verify A record points to server IP

# 3. Check SSL certificate
# Go to: Hostinger → Domains → SSL/TLS
# Verify certificate is installed and valid

# 4. Check application is responding
# SSH into server and test:
curl http://localhost:3000/

# 5. Check Hostinger support
# If still not working, contact Hostinger support
```

---

## Test 6: Automated Deployment Update

### Objective
Verify that pushing code automatically deploys the latest version.

### Steps

1. **Make a Code Change:**
   ```bash
   cd /Users/noblemavely/Downloads/alternative-ens
   
   # Make a meaningful change (e.g., update version in CURRENT_WORK.md)
   echo "Updated: $(date)" >> CURRENT_WORK.md
   ```

2. **Use Deployment Script:**
   ```bash
   # Commit with automatic versioning and changelog
   bash .claude/deploy-to-hostinger.sh "improvement" "Testing automated deployment" "patch"
   ```

3. **Monitor Deployment:**
   - Go to: https://github.com/noblemavely/alternative-ens/actions
   - Watch workflow execution
   - Wait for completion (2-5 minutes)

4. **Verify on Hostinger:**
   ```bash
   # SSH into server
   ssh -p 65002 u263459454@82.112.229.19
   
   # Check latest commit
   cd ~/alternative-ens
   git log -1 --oneline
   
   # Check if app restarted
   pm2 describe alternative-ens | grep "restart"
   
   # View logs
   pm2 logs alternative-ens --lines 10 --nostream
   ```

5. **Verify Changes are Live:**
   ```bash
   # Fetch the updated page
   curl https://alternative.nativeworld.com/ | grep "new-content-you-added"
   ```

### Success Criteria
- ✅ Commit created with conventional message
- ✅ Version bumped automatically
- ✅ CHANGELOG updated
- ✅ GitHub Actions triggered
- ✅ Deployment completed in 2-5 minutes
- ✅ Application restarted
- ✅ Changes are live on production

---

## Test 7: Database Backup Verification

### Objective
Verify that database backups are created before deployments.

### Steps

1. **SSH into Hostinger:**
   ```bash
   ssh -p 65002 u263459454@82.112.229.19
   ```

2. **Check Backup Directory:**
   ```bash
   # List backups
   ls -lh ~/alternative-ens/backups/
   
   # Count backups
   ls ~/alternative-ens/backups/backup_*.sql | wc -l
   ```

3. **Verify Backup Content:**
   ```bash
   # Check latest backup size
   ls -lh ~/alternative-ens/backups/ | tail -1
   
   # Should be > 1MB for complete database
   
   # Verify backup contains tables
   head -100 ~/alternative-ens/backups/$(ls -t ~/alternative-ens/backups/ | head -1) | grep "CREATE TABLE"
   ```

4. **Test Backup Restoration (Optional):**
   ```bash
   # Create a test database
   mysql -h 82.112.229.19 -u u263459454_alternative -p -e "CREATE DATABASE test_restore;"
   
   # Restore from backup
   LATEST_BACKUP=$(ls -t ~/alternative-ens/backups/backup_*.sql | head -1)
   mysql -h 82.112.229.19 -u u263459454_alternative -p test_restore < $LATEST_BACKUP
   
   # Verify restore
   mysql -h 82.112.229.19 -u u263459454_alternative -p -e "SELECT COUNT(*) FROM test_restore.projects;"
   
   # Clean up
   mysql -h 82.112.229.19 -u u263459454_alternative -p -e "DROP DATABASE test_restore;"
   ```

### Success Criteria
- ✅ Backups directory exists and has files
- ✅ Backup files are > 1MB
- ✅ Backups created before each deployment
- ✅ Backup files contain CREATE TABLE statements
- ✅ Can successfully restore from backup

---

## Test 8: Slack Notifications (Optional)

### Objective
Verify that Slack notifications are sent for deployments.

### Steps

1. **Trigger a Deployment:**
   ```bash
   # Make a change and push
   echo "Slack notification test" >> README.md
   git add README.md
   bash .claude/deploy-to-hostinger.sh "test" "Testing Slack notifications" "patch"
   ```

2. **Check Slack Channel:**
   - Go to your Slack workspace
   - Look for notifications from GitHub Actions
   - Should see: Deployment status, version, timestamp

3. **Verify Notification Content:**
   - ✅ Status (Success/Failure)
   - ✅ Version number
   - ✅ Deployment timestamp
   - ✅ Production URL link

### Success Criteria
- ✅ Slack notification received for deployment
- ✅ Contains correct version information
- ✅ Shows deployment status
- ✅ Includes production URL

---

## Test Summary Checklist

After completing all tests, mark them off:

- [ ] Test 1: GitHub Actions Workflow Trigger - ✅ PASS
- [ ] Test 2: File Deployment Verification - ✅ PASS
- [ ] Test 3: Database Connection Verification - ✅ PASS
- [ ] Test 4: Application Health Check - ✅ PASS
- [ ] Test 5: Production Website Accessibility - ✅ PASS
- [ ] Test 6: Automated Deployment Update - ✅ PASS
- [ ] Test 7: Database Backup Verification - ✅ PASS
- [ ] Test 8: Slack Notifications - ✅ PASS (if configured)

---

## Deployment Ready! 🚀

Once all tests pass, your deployment pipeline is fully functional and ready for continuous improvements!

### Next Steps

1. **Make improvements** to the code
2. **Test locally** to ensure functionality
3. **Use deployment script:**
   ```bash
   bash .claude/deploy-to-hostinger.sh "feature" "Description" "patch"
   ```
4. **Monitor GitHub Actions**
5. **Verify on production** at https://alternative.nativeworld.com

---

## Getting Help

If any test fails:

1. **Check GitHub Actions logs:**
   - https://github.com/noblemavely/alternative-ens/actions
   - Click failed workflow
   - Expand failed step for error details

2. **SSH into Hostinger for debugging:**
   ```bash
   ssh -p 65002 u263459454@82.112.229.19
   cd ~/alternative-ens
   pm2 logs alternative-ens --follow
   ```

3. **Common Issues:**
   - See COMPLETE_HOSTINGER_SETUP_GUIDE.md
   - Check GitHub secrets are configured
   - Verify SSH key is in authorized_keys
   - Ensure database credentials are correct
