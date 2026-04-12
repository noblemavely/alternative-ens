# Complete Hostinger Deployment Setup Guide

**Domain:** alternatives.nativeworld.com  
**Hosting:** Hostinger Business Plan  
**Server IP:** 82.112.229.19  
**Database:** u263459454_alternative  

---

## 📋 Table of Contents

1. [GitHub Secrets Setup](#github-secrets-setup)
2. [SSH Key Setup on Hostinger](#ssh-key-setup-on-hostinger)
3. [Initial Hostinger Server Setup](#initial-hostinger-server-setup)
4. [Testing the Deployment](#testing-the-deployment)
5. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## GitHub Secrets Setup

### Step 1: Go to GitHub Repository Settings

1. Open: https://github.com/noblemavely/alternative-ens
2. Click: **Settings** (top-right menu)
3. Click: **Secrets and variables** (left sidebar)
4. Click: **Actions**

### Step 2: Create SSH Private Key Secret

1. Click: **New repository secret**
2. **Name:** `SSH_PRIVATE_KEY`
3. **Value:** Copy the entire private key from below:

```
-----BEGIN OPENSSH PRIVATE KEY-----
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
JsZC5jb20BAgME
-----END OPENSSH PRIVATE KEY-----
```

4. Click: **Add secret**

### Step 3: Create FTP Password Secret

1. Click: **New repository secret**
2. **Name:** `HOSTINGER_FTP_PASSWORD`
3. **Value:** [Share your FTP password securely]
4. Click: **Add secret**

### Step 4: Create SSH Password Secret

1. Click: **New repository secret**
2. **Name:** `HOSTINGER_SSH_PASSWORD`
3. **Value:** [Share your SSH password securely]
4. Click: **Add secret**

### Step 5: Create Database Password Secret

1. Click: **New repository secret**
2. **Name:** `HOSTINGER_DB_PASSWORD`
3. **Value:** [Share your database password securely]
4. Click: **Add secret**

### Step 6: Create Application ID Secret

1. Click: **New repository secret**
2. **Name:** `VITE_APP_ID`
3. **Value:** `alternative-ens`
4. Click: **Add secret**

### Step 7: Optional - Create Slack Webhook Secret

1. Click: **New repository secret**
2. **Name:** `SLACK_WEBHOOK_URL`
3. **Value:** [Your Slack webhook URL - optional]
4. Click: **Add secret**

---

## SSH Key Setup on Hostinger

### Step 1: SSH into Hostinger Server

```bash
# Connect using password authentication
ssh -p 65002 u263459454@82.112.229.19

# Enter your SSH password when prompted
```

### Step 2: Create SSH Directory

```bash
# Create .ssh directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Verify
ls -la ~/ | grep ssh
```

### Step 3: Add Public Key to authorized_keys

```bash
# Add the public key below to authorized_keys
cat >> ~/.ssh/authorized_keys << 'EOF'
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDIjCHZL5xKm8ae1/be6lInpDjBytD5amancSt8lrgX7KYfoKBnbK/f6FmjCpQDyTmQrMBiLoTCpnSnUUPUH4EidcjN9UoxEIIagQpRiMqQZ50uQ5HJsWoLqekEgs8QMhz6v+fJC1wztUBdWxnQvWsczNhNC8v5q8PpmsRDcN9lDsY0QaD4Av+HSweekgRF7C7xwoNW4HLddS1q3G2IAEJPlTj9oClA2TD3zi1x64+RHLMguX7cx9sQhmGQGop35aP/+4olyQ/RAgnEynLIhPXotEg+CAMQuSEaShU5hiJpvP9uzsk/aWC3O9SZjuRlUtHtmgJYZZH485VCAa8QU1FfbA6d+4HNVW9RWABYOdj/c8E75lDjSXf8GCQ005aiCYmdikzceGAyNLbdDEMGiztJtYhXhRoCUHazmnB07200inHuQRXl2xp96K/4K1aYYix0MORD7Z+ThqOWB5YMTJIrEsp+Uy743/eP3Fq3hzAOHh6bOkXlkdRnW9vaYfhKPS8YtqWOYE8uT1VsBiQQv4vC6xKA27iew8TpomgWU35VjbCKAK8e0A6ZBQzCTtzNzDo0TlRd228O7lsoCOYaUCZKUwddjJF780nW6vVPcdV67Z82ShxspR0VQqq7dwl8qltJL2NwHddotBY59mMRq0AbZuF/dySvqcxUETJcU804Rw== github-actions-alternative-ens@nativeworld.com
EOF

# Set permissions
chmod 600 ~/.ssh/authorized_keys

# Verify
cat ~/.ssh/authorized_keys
```

### Step 4: Verify SSH Key Authentication

Test that key-based auth works:
```bash
# From your local machine
ssh -i /tmp/hostinger_deploy_key -p 65002 u263459454@82.112.229.19 "echo 'SSH Key Auth Successful!'"
```

---

## Initial Hostinger Server Setup

### Step 1: SSH into Server

```bash
ssh -p 65002 u263459454@82.112.229.19
```

### Step 2: Create Application Directory

```bash
# Create directory
mkdir -p ~/alternative-ens
cd ~/alternative-ens

# Verify
pwd
ls -la
```

### Step 3: Initialize Git Repository

```bash
# Initialize git
git init
git remote add origin https://github.com/noblemavely/alternative-ens.git

# Pull main branch
git fetch origin main
git reset --hard origin/main

# Verify
git log --oneline | head -5
```

### Step 4: Install Node.js Dependencies

```bash
# Install pnpm globally
npm install -g pnpm@10

# Verify
pnpm --version

# Install project dependencies
cd ~/alternative-ens
pnpm install --frozen-lockfile

# Check installation
ls -la node_modules | head -5
```

### Step 5: Create Production Environment File

```bash
# Create .env file with production values
cat > ~/.env << 'EOF'
DATABASE_URL=mysql://u263459454_alternative:YOUR_DB_PASSWORD@82.112.229.19:3306/u263459454_alternative
DB_HOST=82.112.229.19
DB_USER=u263459454_alternative
DB_PASSWORD=YOUR_DB_PASSWORD
DB_NAME=u263459454_alternative
NODE_ENV=production
VITE_APP_ID=alternative-ens
JWT_SECRET=generate-a-random-32-character-hex-string-here-min-32-chars
PORT=3000
EOF

# Set permissions
chmod 600 ~/.env

# Link to app directory
cp ~/.env ~/alternative-ens/.env
```

**⚠️ IMPORTANT:** Replace `YOUR_DB_PASSWORD` with your actual database password.

### Step 6: Initialize Database

```bash
cd ~/alternative-ens

# Run migrations
pnpm db:push

# Check if successful
echo "Migrations completed"
```

### Step 7: Seed Database (First Time Only)

```bash
cd ~/alternative-ens

# Seed initial data
node seed-db.mjs

# Verify data
mysql -h 82.112.229.19 -u u263459454_alternative -p u263459454_alternative -e "SELECT COUNT(*) as 'Total Projects' FROM projects;"
```

### Step 8: Install PM2 Process Manager

```bash
# Install PM2 globally
npm install -g pm2

# Verify
pm2 --version

# Start application
cd ~/alternative-ens
pm2 start "pnpm start" --name "alternative-ens" --max-memory-restart 500M

# Save PM2 configuration
pm2 save

# Enable PM2 startup on reboot
pm2 startup systemd -u u263459454 --hp $HOME > /dev/null 2>&1 || true

# Verify app is running
pm2 list
```

### Step 9: Verify Application

```bash
# Check PM2 status
pm2 status

# View application logs
pm2 logs alternative-ens --lines 20 --nostream

# Test localhost connection
curl http://localhost:3000/ | head -20
```

---

## Testing the Deployment

### Test 1: Manual Push Deployment

```bash
# On your local machine
cd /Users/noblemavely/Downloads/alternative-ens

# Make a test commit
echo "# Test deployment" >> README.md
git add README.md

# Use the deployment script
bash .claude/deploy-to-hostinger.sh "test" "Testing deployment workflow" "patch"
```

**What to expect:**
- ✅ Commit created with version bump
- ✅ GitHub Actions workflow triggered
- ✅ Deployment starts automatically

### Test 2: Monitor GitHub Actions

1. Go to: https://github.com/noblemavely/alternative-ens/actions
2. Click: **Deploy to Hostinger Production** workflow
3. Watch the deployment progress:
   - ✅ Build & Test
   - ✅ Deploy Files
   - ✅ Database Backup
   - ✅ Database Migrations
   - ✅ Application Restart
   - ✅ Health Check

### Test 3: Verify Production Deployment

```bash
# Option 1: Check from local machine
curl -I https://alternatives.nativeworld.com/

# Option 2: SSH into Hostinger and check
ssh -p 65002 u263459454@82.112.229.19

# Once logged in:
pm2 status
pm2 logs alternative-ens --lines 30

# Check if API is responding
curl http://localhost:3000/api/trpc/auth.me
```

**Expected Response:**
```
HTTP/2 200
Content-Type: application/json
```

---

## Monitoring & Troubleshooting

### View Application Logs

```bash
# SSH into server
ssh -p 65002 u263459454@82.112.229.19

# View PM2 logs
pm2 logs alternative-ens --follow  # Real-time logs
pm2 logs alternative-ens --lines 50  # Last 50 lines

# View PM2 monit
pm2 monit
```

### Check Application Status

```bash
# SSH into server
ssh -p 65002 u263459454@82.112.229.19

# Check PM2 list
pm2 list

# Check specific app
pm2 describe alternative-ens

# Check if port 3000 is listening
netstat -tlnp | grep 3000
```

### Restart Application

```bash
# SSH into server
ssh -p 65002 u263459454@82.112.229.19

# Restart app
pm2 restart alternative-ens

# Or kill and restart
pm2 kill
pm2 start "pnpm start" --name "alternative-ens" --cwd ~/alternative-ens
```

### Common Issues

**Issue: Application not responding**
```bash
# SSH in and check
pm2 logs alternative-ens

# Restart if needed
pm2 restart alternative-ens

# Check database connection
mysql -h 82.112.229.19 -u u263459454_alternative -p -e "SELECT 1"
```

**Issue: FTP upload failed**
- Verify FTP credentials in GitHub secrets
- Check Hostinger FTP access in control panel
- Ensure `public_html/alternative/` directory exists

**Issue: Database connection error**
- Verify `DATABASE_URL` format
- Check database credentials
- Ensure database user has correct permissions
- Test connection: `mysql -h 82.112.229.19 -u u263459454_alternative -p u263459454_alternative`

---

## 🚀 You're Ready!

Once you've completed all steps:

1. ✅ GitHub secrets configured
2. ✅ SSH key added to Hostinger
3. ✅ Application deployed
4. ✅ Database initialized
5. ✅ Application running with PM2

You can now:
- Push code to GitHub main branch
- GitHub Actions automatically deploys
- Application updates within 2-5 minutes
- Monitor via PM2 logs

---

## Summary of Hostinger Credentials

```
FTP Server: 82.112.229.19
FTP Username: u263459454.alternatives.nativeworld.com
FTP Port: 21

SSH Server: 82.112.229.19
SSH Username: u263459454
SSH Port: 65002

Database Host: 82.112.229.19
Database Name: u263459454_alternative
Database Username: u263459454_alternative

Production URL: https://alternatives.nativeworld.com
```

---

**Next Step:** Share your passwords securely (see instructions below), and deployment will be fully automated!
