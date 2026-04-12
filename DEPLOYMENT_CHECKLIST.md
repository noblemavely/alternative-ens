# Hostinger Deployment Checklist

**Domain:** alternative.nativeworld.com  
**Status:** Setup in Progress  
**Last Updated:** $(date)

---

## ✅ Pre-Deployment Checklist

### Hostinger Account Setup
- [ ] Have Hostinger account with subdomain `alternative.nativeworld.com` created
- [ ] SSH access configured (or password available)
- [ ] FTP/SFTP access configured
- [ ] MySQL database `alternative_ens` created
- [ ] Node.js application setup in Hostinger panel (or plan to create it)
- [ ] SSL certificate installed for subdomain

### GitHub Repository
- [ ] Repository pushed to: `https://github.com/noblemavely/alternative-ens`
- [ ] `.github/workflows/deploy-hostinger.yml` file exists
- [ ] `.claude/deploy-to-hostinger.sh` script exists
- [ ] `HOSTINGER_DEPLOYMENT_SETUP.md` file exists

### GitHub Secrets Configured
- [ ] `SSH_HOST` - Hostinger server hostname
- [ ] `SSH_USERNAME` - SSH username
- [ ] `SSH_PASSWORD` or `SSH_PRIVATE_KEY` - SSH authentication
- [ ] `SSH_PORT` - SSH port number
- [ ] `DB_HOST` - Database hostname
- [ ] `DB_USER` - Database username
- [ ] `DB_PASSWORD` - Database password
- [ ] `DB_NAME` - Database name (alternative_ens)
- [ ] `FTP_SERVER` - FTP hostname (if using FTP)
- [ ] `FTP_USERNAME` - FTP username (if using FTP)
- [ ] `FTP_PASSWORD` - FTP password (if using FTP)
- [ ] `VITE_APP_ID` - Application ID
- [ ] `SLACK_WEBHOOK` - Slack webhook URL (optional)

### Local Environment
- [ ] `pnpm install` completed successfully
- [ ] `pnpm build` builds without errors
- [ ] `pnpm test` passes all tests
- [ ] `.env.example` file created with all required variables
- [ ] `.gitignore` prevents `.env` files from being committed

---

## 🚀 Deployment Process

### Initial Server Setup (One-time)

1. **SSH into Hostinger:**
   ```bash
   ssh your_username@your-hostinger-server.hostinger.com
   ```
   - [ ] SSH connection successful

2. **Clone Repository:**
   ```bash
   git clone https://github.com/noblemavely/alternative-ens.git
   cd alternative-ens
   ```
   - [ ] Repository cloned successfully

3. **Install Dependencies:**
   ```bash
   npm install -g pnpm pm2
   pnpm install --frozen-lockfile
   ```
   - [ ] Dependencies installed successfully

4. **Setup Environment:**
   ```bash
   # Create .env with your secrets
   cat > .env << 'EOF'
   DATABASE_URL=mysql://user:pass@localhost:3306/alternative_ens
   JWT_SECRET=your-secret-key
   NODE_ENV=production
   VITE_APP_ID=alternative-ens
   PORT=3000
   EOF
   ```
   - [ ] .env file created with correct values

5. **Initialize Database:**
   ```bash
   pnpm db:push
   node seed-db.mjs
   ```
   - [ ] Database migrations completed
   - [ ] Seed data inserted

6. **Start Application:**
   ```bash
   pnpm build
   pm2 start "pnpm start" --name "alternative-ens"
   pm2 save
   pm2 startup
   ```
   - [ ] Application started with PM2
   - [ ] PM2 startup configured

7. **Verify Deployment:**
   ```bash
   curl http://localhost:3000/
   pm2 logs alternative-ens
   ```
   - [ ] Application responding on port 3000
   - [ ] No errors in PM2 logs

---

### Automatic Deployments (Every push to main)

1. **Make code changes locally**
   - [ ] Changes tested locally
   - [ ] All tests passing

2. **Commit and push to GitHub:**
   ```bash
   bash .claude/deploy-to-hostinger.sh "feature" "Your description" "patch"
   ```
   - [ ] Commit created with conventional message
   - [ ] Version bumped
   - [ ] CHANGELOG updated
   - [ ] Pushed to main branch

3. **GitHub Actions automatically:**
   - [ ] Tests run and pass
   - [ ] Application builds successfully
   - [ ] Deployment package created
   - [ ] Files uploaded to Hostinger
   - [ ] Database migrations run
   - [ ] Application restarted

4. **Monitor deployment:**
   - Go to: https://github.com/noblemavely/alternative-ens/actions
   - [ ] Workflow shows "✅ Success"
   - [ ] Check Slack notification (if enabled)

5. **Verify in production:**
   ```bash
   curl https://alternative.nativeworld.com/
   curl https://alternative.nativeworld.com/api/trpc/auth.me
   ```
   - [ ] Application loads
   - [ ] API responding

---

## 📋 Daily Operations

### Monitor Application
```bash
# SSH into server
ssh username@hostinger-server.com
cd ~/alternative-ens

# Check status
pm2 status
pm2 logs alternative-ens --lines 50

# Monitor in real-time
pm2 logs alternative-ens --follow
```

### Database Backups
```bash
# Automatic backup before each deployment
# Manual backup:
mkdir -p backups
mysqldump -u user -p database_name > backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

### Rollback Procedure
```bash
# If something goes wrong:
git checkout tags/v1.0.2  # previous version
pnpm install --frozen-lockfile
pnpm build
pm2 restart alternative-ens

# Restore database from backup:
mysql alternative_ens < backups/backup_20260412_100000.sql
```

---

## 🔍 Troubleshooting

### GitHub Actions Failing?
- [ ] Check GitHub Actions logs: https://github.com/noblemavely/alternative-ens/actions
- [ ] Verify all GitHub secrets are configured correctly
- [ ] SSH credentials are valid
- [ ] Database credentials are correct

### Application Not Loading?
```bash
# SSH into server
pm2 logs alternative-ens
pm2 status
pm2 restart alternative-ens
```
- [ ] Check for errors in logs
- [ ] Verify database connection
- [ ] Check port availability

### Deployment Stuck?
- [ ] Kill stuck process: `pm2 kill && pm2 start "pnpm start" --name "alternative-ens"`
- [ ] Clear build cache: `rm -rf dist node_modules/.vite`
- [ ] Rerun deployment from GitHub Actions

### Cannot SSH?
- [ ] Verify SSH credentials in GitHub secrets
- [ ] Test SSH locally: `ssh -p 22 user@host`
- [ ] Check if SSH key (if using key-based auth) is correct
- [ ] Verify firewall settings in Hostinger panel

---

## 📊 Version Management

Current Version: `1.0.3`  
Last Deployment: `2026-04-12T22:10:00Z`  
Production URL: `https://alternative.nativeworld.com`

### Version Bump Strategy
- **patch** (1.0.3 → 1.0.4): Bug fixes, small improvements
- **minor** (1.0.3 → 1.1.0): New features
- **major** (1.0.3 → 2.0.0): Breaking changes

### Release History
- [ ] v1.0.3 - Currency support and project enhancements
- [ ] v1.0.2 - Email field refactoring
- [ ] v1.0.1 - PDF viewer implementation
- [ ] v1.0.0 - Initial release

---

## 📞 Support Resources

### Documentation
- `HOSTINGER_DEPLOYMENT_SETUP.md` - Detailed setup guide
- `.github/workflows/deploy-hostinger.yml` - GitHub Actions workflow
- `.claude/deploy-to-hostinger.sh` - Deployment script

### Monitoring & Logs
- **GitHub Actions:** https://github.com/noblemavely/alternative-ens/actions
- **Live Logs:** SSH → `pm2 logs alternative-ens`
- **Slack Notifications** (if enabled): Check Slack channel

### Hostinger Resources
- **Control Panel:** https://www.hostinger.com
- **Hosting Support:** Via Hostinger ticket system
- **Documentation:** Hostinger Knowledge Base

---

## ✨ Next Steps

1. **Gather Hostinger Credentials**
   - [ ] Collect all SSH/FTP/Database details
   - [ ] Store in secure location

2. **Add GitHub Secrets**
   - [ ] Go to GitHub Repo Settings
   - [ ] Add all required secrets
   - [ ] Test one secret with a test deployment

3. **Initial Deployment**
   - [ ] SSH into Hostinger server
   - [ ] Follow "Initial Server Setup" section
   - [ ] Test application loads at https://alternative.nativeworld.com

4. **Enable Monitoring**
   - [ ] Set up Slack webhook (optional)
   - [ ] Configure GitHub notifications
   - [ ] Set up uptime monitoring

5. **Start Continuous Improvements**
   - [ ] Use `bash .claude/deploy-to-hostinger.sh` for deployments
   - [ ] Monitor deployments in GitHub Actions
   - [ ] Track versions in CHANGELOG.md

---

**Status:** Ready for initial deployment  
**Last Checked:** $(date)  
**Next Action:** Gather Hostinger credentials and add GitHub secrets
