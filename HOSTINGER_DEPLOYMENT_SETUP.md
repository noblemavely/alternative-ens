# Hostinger Deployment Setup Guide

**Subdomain:** `alternatives.nativeworld.com`  
**Platform:** Hostinger Shared/VPS Hosting  
**CI/CD:** GitHub Actions → Hostinger SSH/FTP

---

## Step 1: Gather Your Hostinger Credentials

### From Hostinger Dashboard:

1. **SSH/SFTP Access:**
   - Go to: **Hosting** → **Manage** → **SSH/SFTP**
   - Copy:
     - Hostname
     - Username
     - Port (usually 22)
     - Choose: **Key-based** or **Password** authentication

2. **FTP Access:**
   - Go to: **Hosting** → **Manage** → **FTP Accounts**
   - Copy:
     - Hostname
     - Username
     - Password
     - Port (usually 21 for FTP, 22 for SFTP)

3. **Database:**
   - Go to: **Databases** → **MySQL**
   - Your database should already exist: `alternative_ens`
   - Copy:
     - Hostname (usually `localhost` for shared hosting)
     - Username
     - Password
     - Database name

4. **Node.js Application:**
   - Go to: **Hosting** → **Node.js Applications**
   - Check if already created for `alternatives.nativeworld.com`
   - If not, create one:
     - **Application Name:** `alternative-ens`
     - **Node.js Version:** 20 LTS
     - **Application Root:** `/public_html/alternative/`
     - **Entry File:** `dist/server.js`

---

## Step 2: Add GitHub Secrets

In your GitHub repository:

1. Go to: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

2. Add these secrets (replace with YOUR values):

### SSH Credentials
```
SSH_HOST = your-hostinger-server.hostinger.com
SSH_USERNAME = your_username
SSH_PASSWORD = your_password
SSH_PORT = 22
```

Or if using SSH key (recommended):
```
SSH_HOST = your-hostinger-server.hostinger.com
SSH_USERNAME = your_username
SSH_PRIVATE_KEY = -----BEGIN RSA PRIVATE KEY-----
                  (entire key content)
                  -----END RSA PRIVATE KEY-----
SSH_PORT = 22
```

### FTP Credentials (if using FTP deployment)
```
FTP_SERVER = your-hostinger-server.hostinger.com
FTP_USERNAME = your_username
FTP_PASSWORD = your_password
FTP_PORT = 21
```

### Database Credentials
```
DB_HOST = localhost (or your database host)
DB_USER = your_db_username
DB_PASSWORD = your_db_password
DB_NAME = alternative_ens
```

### Application Configuration
```
VITE_APP_ID = alternative-ens
```

### Optional: Slack Notifications
```
SLACK_WEBHOOK = https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## Step 3: SSH Key Setup (Recommended)

### If you want to use SSH key instead of password:

**On your local machine:**
```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/hostinger_key -N ""

# Copy public key
cat ~/.ssh/hostinger_key.pub
```

**On Hostinger (via SSH or cPanel):**
```bash
# Connect to Hostinger
ssh username@your-hostinger-server.hostinger.com

# Add your public key
mkdir -p ~/.ssh
echo "your_public_key_content_here" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

**In GitHub Secrets:**
```
SSH_PRIVATE_KEY = (paste entire private key)
```

---

## Step 4: Environment Variables

Create `.env.production` on Hostinger server:

```bash
# SSH into Hostinger
ssh username@your-hostinger-server.hostinger.com

# Navigate to app directory
cd ~/alternative-ens

# Create .env file
cat > .env << 'EOF'
DATABASE_URL=mysql://db_user:db_password@localhost:3306/alternative_ens
JWT_SECRET=your-random-32-char-secret-key
NODE_ENV=production
VITE_APP_ID=alternative-ens
OAUTH_SERVER_URL=https://oauth-provider.com
OWNER_OPEN_ID=your-owner-id
PORT=3000
CLAUDE_API_KEY=your-api-key
APOLLO_API_KEY=your-api-key
EOF

chmod 600 .env
```

---

## Step 5: Hostinger Server Setup

### Connect via SSH:

```bash
ssh username@your-hostinger-server.hostinger.com
```

### Clone repository:

```bash
cd ~
git clone https://github.com/noblemavely/alternative-ens.git
cd alternative-ens
```

### Install dependencies:

```bash
# Install pnpm
npm install -g pnpm

# Install project dependencies
pnpm install --frozen-lockfile
```

### Setup database:

```bash
# Run migrations
pnpm db:push

# Seed database (first time only)
node seed-db.mjs
```

### Install & Start PM2:

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start "pnpm start" --name "alternative-ens" --cwd ~/alternative-ens

# Save PM2 config
pm2 save

# Enable PM2 startup
pm2 startup
```

### Verify deployment:

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs alternative-ens

# Check if app is responding
curl http://localhost:3000/health || curl http://localhost:3000/
```

---

## Step 6: Configure Subdomain (if not already done)

### In Hostinger:

1. **Go to:** Domains → Your Domain → DNS/Nameservers
2. **Create A Record:**
   - **Subdomain:** `alternative`
   - **Points to:** Your Hostinger server IP address
   - **TTL:** 3600

3. **Wait for DNS propagation** (usually 5-30 minutes)

4. **Verify:**
   ```bash
   nslookup alternatives.nativeworld.com
   ```

---

## Step 7: SSL Certificate

### In Hostinger Panel:

1. **Go to:** Domains → Your Domain → SSL/TLS
2. **Install Free SSL Certificate** for `alternatives.nativeworld.com`
3. Hostinger auto-configures HTTPS

### Verify SSL:

```bash
curl -I https://alternatives.nativeworld.com
# Should show: HTTP/2 200
```

---

## Step 8: Test Deployment

### Push to main branch:

```bash
cd /Users/noblemavely/Downloads/alternative-ens

# Make some changes or just trigger deployment
git push origin main
```

### Monitor GitHub Actions:

1. Go to: **GitHub Repo** → **Actions** → **Deploy to Hostinger**
2. Watch the deployment progress
3. Check for success/failure notifications

### Verify Production:

```bash
# Should load your app
curl https://alternatives.nativeworld.com

# Check API
curl https://alternatives.nativeworld.com/api/trpc/auth.me
```

---

## Step 9: Automated Commits from Claude

When I make improvements to the code, I'll:

1. **Make the changes** in the local environment
2. **Test thoroughly** to ensure everything works
3. **Commit automatically** with a conventional commit message
4. **Push to GitHub** main branch
5. **GitHub Actions automatically:**
   - Runs tests
   - Builds the app
   - Backs up the database
   - Deploys to Hostinger
   - Restarts the application

---

## Troubleshooting

### Deployment Failed?

1. **Check GitHub Actions logs:**
   - Go to: **Actions** → **Deploy to Hostinger** → See error message

2. **Common issues:**
   - ❌ **SSH authentication failed:** Verify `SSH_PRIVATE_KEY` or `SSH_PASSWORD` in GitHub secrets
   - ❌ **Database connection error:** Verify `DB_HOST`, `DB_USER`, `DB_PASSWORD`
   - ❌ **Build failed:** Check if all dependencies are correctly listed in `package.json`
   - ❌ **Port 3000 already in use:** Change port in Hostinger Node.js app settings

3. **SSH directly to check status:**
   ```bash
   ssh username@your-hostinger-server.hostinger.com
   pm2 logs alternative-ens
   pm2 status
   ```

### App Not Loading?

1. **Check if PM2 app is running:**
   ```bash
   pm2 status
   ```

2. **Restart manually:**
   ```bash
   pm2 restart alternative-ens
   ```

3. **Check application logs:**
   ```bash
   pm2 logs alternative-ens --lines 50
   ```

4. **Check if database migrations ran:**
   ```bash
   pnpm db:push
   ```

---

## Rollback to Previous Version

If deployment breaks something:

```bash
# SSH into server
ssh username@your-hostinger-server.hostinger.com
cd ~/alternative-ens

# Restore database from backup
mysql alternative_ens < backups/backup_20260412_100000.sql

# Checkout previous version
git checkout tags/v1.0.2

# Rebuild
pnpm install --frozen-lockfile
pnpm build

# Restart
pm2 restart alternative-ens
```

---

## Monitoring

### Check logs in real-time:
```bash
pm2 logs alternative-ens --follow
```

### View all PM2 processes:
```bash
pm2 list
```

### Monitor CPU/Memory:
```bash
pm2 monit
```

---

## Next Steps

1. ✅ Provide your Hostinger credentials above
2. ✅ Add GitHub secrets
3. ✅ SSH setup on Hostinger server
4. ✅ Initial deployment
5. ✅ Monitor and verify
6. ✅ Enable Slack notifications (optional)

---

**Questions?** Check your Hostinger account details and GitHub Actions logs for detailed error messages.
