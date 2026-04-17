# Production Deployment Guide

## Current Status
✅ **Code Committed & Pushed**: All fixes and features are committed to GitHub main branch
✅ **Build Complete**: Production build ready in `/dist` directory (1.6MB)
✅ **Docker Configured**: Docker and docker-compose files configured for deployment
✅ **Environment Prepared**: `.env.production` file created with all required variables

## Deployment Architecture
- **Server**: Digital Ocean at 68.183.86.134
- **Method**: GitHub Actions CI/CD + Docker Compose
- **Database**: MySQL 8.0 (containerized)
- **Application**: Node.js 20 Alpine (containerized)
- **Port**: 3000 (application), 3306 (database)

## Critical GitHub Actions Secrets Required

To enable automatic deployment, configure these secrets in GitHub repository settings:

1. **DO_PASSWORD** (CRITICAL - Required for deployment)
   - Root SSH password for Digital Ocean server (68.183.86.134)
   - Go to: GitHub Repo → Settings → Secrets and Variables → Actions
   - Create new secret: `DO_PASSWORD` = your-digitalocean-root-password

2. **Database & Application Secrets** (Set in GitHub Secrets)
   - DATABASE_URL: [MySQL connection string for production database]
   - JWT_SECRET: [Generate a random 32-character hex string]
   - APP_ORIGIN: https://alternatives.nativeworld.com
   - BREVO_API_KEY: [Your Sendinblue API key]
   - SMTP_FROM_EMAIL: noreply@alternatives.nativeworld.com
   - SMTP_FROM_NAME: Alternatives Team
   - CLAUDE_API_KEY: [Your Anthropic Claude API key]
   - APOLLO_API_KEY: [Your Apollo data API key]
   - LINKEDIN_CLIENT_ID: [Optional - LinkedIn OAuth client ID]
   - LINKEDIN_CLIENT_SECRET: [Optional - LinkedIn OAuth secret]

## Deployment Steps

### Step 1: Configure GitHub Secret
```bash
# Visit: https://github.com/noblemavely/alternative-ens/settings/secrets/actions
# Click "New repository secret"
# Name: DO_PASSWORD
# Value: [your-root-password-for-68.183.86.134]
# Click "Add secret"
```

### Step 2: Trigger Deployment (Automatic or Manual)
**Automatic**: Any push to `main` branch will trigger the workflow
**Manual**: 
- Go to: GitHub Repo → Actions → "Deploy to Digital Ocean"
- Click "Run workflow" → Select `main` branch → Click "Run workflow"

### Step 3: Monitor Deployment
- Watch GitHub Actions: https://github.com/noblemavely/alternative-ens/actions
- Deployment should complete in ~5-10 minutes
- Check Digital Ocean application: https://alternatives.nativeworld.com

## Post-Deployment Verification

After deployment completes, verify:

1. **Application Running**
   ```bash
   ssh root@68.183.86.134 "docker-compose ps"
   ```
   Both `alternative-ens-app` and `alternative-ens-db` should show `Up`

2. **Test Features**
   - Visit https://alternatives.nativeworld.com
   - Admin login: admin@alternative.com / admin123
   - Create new expert via /expert/register
   - View experts in admin panel

3. **Database Connected**
   ```bash
   ssh root@68.183.86.134 "docker-compose logs db | grep 'ready for connections'"
   ```

4. **Application Logs**
   ```bash
   ssh root@68.183.86.134 "docker-compose logs app | tail -50"
   ```

## Troubleshooting

### Deployment Fails: "DO_PASSWORD not found"
- Ensure `DO_PASSWORD` secret is configured in GitHub repository settings
- Secret must be exact name (case-sensitive)

### Docker-Compose Fails on Server
```bash
# SSH into server
ssh root@68.183.86.134

# Check logs
docker-compose logs

# Restart if needed
cd /app
docker-compose down
docker-compose up -d
```

### Database Connection Issues
```bash
# Check MySQL is running
docker ps | grep mysql

# Check database logs
docker-compose logs db

# Verify connection
docker exec alternative-ens-db mysqladmin -u root -palternative_ens ping
```

### Port 3000 Already in Use
```bash
# Kill existing process
ssh root@68.183.86.134 "lsof -ti:3000 | xargs kill -9"

# Restart containers
ssh root@68.183.86.134 "cd /app && docker-compose restart app"
```

## Production Environment

- **Database Host**: db (Docker internal)
- **Database Credentials**: root / alternative_ens
- **JWT Secret**: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
- **Brevo Email Service**: Configured for production
- **HTTPS**: Handled by proxy/load balancer (configure at Hostinger)

## Features Verified on Localhost (Ready for Production)

✅ Admin login system working
✅ Expert management system operational  
✅ Seed data (sectors and functions) populated
✅ Database protected by authentication
✅ All routes properly secured

## GitHub Actions Workflow

The deployment workflow automatically:
1. Checks out code from GitHub
2. Sets up Node.js 20 environment
3. Installs dependencies with pnpm
4. Runs type checking (`pnpm check`)
5. Builds application (`pnpm build`)
6. Creates .env file from GitHub secrets
7. Deploys to Digital Ocean via SCP
8. Runs `docker-compose up -d`
9. Verifies containers are running

## Notes

- First deployment may take longer due to Docker image builds
- Subsequent deployments are faster (Docker caches layers)
- Database is preserved across deployments (persistent volume)
- Logs are available via `docker-compose logs`
- All environment variables are injected from GitHub secrets at build time

## Support

For deployment issues, check:
1. GitHub Actions logs: https://github.com/noblemavely/alternative-ens/actions
2. Application logs: SSH to server and run `docker-compose logs`
3. Ensure all GitHub secrets are configured correctly
4. Verify Digital Ocean server is accessible (IP: 68.183.86.134)
