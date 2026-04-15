# Docker Deployment Guide - Digital Ocean

This document explains how to deploy and manage the Alternative ENS application using Docker on Digital Ocean.

## Current Deployment Status

- **Host**: Digital Ocean Droplet (68.183.86.134)
- **Domain**: alternatives.nativeworld.com
- **Application**: Running on port 3000
- **Database**: MySQL 8.0 (containerized)
- **Status**: Production Ready ✅

## Architecture Overview

The application runs using Docker Compose with two services:

1. **app**: Node.js application (node:20-alpine)
2. **db**: MySQL 8.0 database

Services communicate via an internal Docker network (`app-network`).

## Quick Start

### SSH to Digital Ocean Server

```bash
ssh root@68.183.86.134
cd /app
```

### Check Application Status

```bash
# View all containers
docker-compose ps

# View application logs
docker-compose logs -f app

# View database logs
docker-compose logs -f db
```

### Restart Application

```bash
# Restart all services
docker-compose restart

# Restart just the app
docker-compose restart app

# Restart just the database
docker-compose restart db
```

## Common Docker Commands

### View Logs

```bash
# All logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f db

# Last 100 lines
docker-compose logs --tail=100
```

### Service Management

```bash
# Check service status
docker-compose ps

# Stop all services (containers remain)
docker-compose stop

# Start all services
docker-compose start

# Restart all services
docker-compose restart

# Stop and remove containers (data persists)
docker-compose down

# Remove everything including volumes (DATA LOSS!)
docker-compose down -v
```

### Update Application

```bash
# Pull latest code from GitHub
git pull origin main

# Rebuild Docker images without cache
docker-compose build --no-cache

# Restart with new images
docker-compose up -d

# View startup logs
docker-compose logs -f app
```

## Database Management

### Access MySQL Shell

```bash
# Connect as root user
docker-compose exec db mysql -u root -palternative_ens alternative_ens

# View all tables
SHOW TABLES;

# Exit MySQL
exit
```

### Backup Database

```bash
# Create a backup
docker-compose exec db mysqldump -u root -palternative_ens alternative_ens > backup_$(date +%Y%m%d_%H%M%S).sql

# List backups
ls -lh backup_*.sql
```

### Restore Database

```bash
# Restore from backup
docker-compose exec -T db mysql -u root -palternative_ens alternative_ens < backup_YYYYMMDD_HHMMSS.sql
```

## Deployment via GitHub Actions

The application automatically deploys when you push to the `main` branch.

### Setup CI/CD

1. **Add GitHub Secret**:
   - Go to GitHub repository → Settings → Secrets and variables → Actions
   - Create secret: `DO_PASSWORD` = `D_gVKLjk!7Ja2aA`

2. **Workflow File**: `.github/workflows/deploy-docker.yml`
   - Triggers on push to `main` branch
   - Builds application
   - Deploys to Digital Ocean

### How It Works

```
Your Code → Push to GitHub
              ↓
GitHub Actions Workflow
              ↓
1. Build application (pnpm build)
2. Transfer dist/ to Digital Ocean
3. Rebuild Docker containers
4. Restart services
              ↓
Live on Digital Ocean (68.183.86.134)
```

## Environment Variables

Located at `/app/.env` on the server:

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

**To update environment variables**:

```bash
# SSH to server
ssh root@68.183.86.134
cd /app

# Edit .env
nano .env

# Restart application
docker-compose restart app

# View logs to confirm
docker-compose logs -f app
```

## Database Migrations

Migrations are in `/app/drizzle/migrations/` and are automatically applied on app startup.

### Manual Migration Execution

```bash
ssh root@68.183.86.134
cd /app

# List migration files
ls drizzle/migrations/

# Execute a specific migration
docker-compose exec db mysql -u root -palternative_ens alternative_ens < drizzle/migrations/0000_FILENAME.sql

# Check migration status
docker-compose exec db mysql -u root -palternative_ens alternative_ens -e "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'alternative_ens';"
```

## Troubleshooting

### Application won't start

```bash
# Check app logs
docker-compose logs app

# Verify database is running
docker-compose logs db

# Check if services are healthy
docker-compose ps
```

### Database connection errors

```bash
# Verify database is running
docker-compose ps

# Test database connectivity
docker-compose exec db mysql -u root -palternative_ens -e "SELECT 1;"

# Check DATABASE_URL in .env
grep DATABASE_URL .env
```

### Port conflicts

If port 3000 is already in use:

```bash
# Find what's using port 3000
lsof -i :3000

# Change port in docker-compose.yml
# Change "3000:3000" to "3001:3000" (external:internal)

# Rebuild and restart
docker-compose up -d
```

### Memory issues

```bash
# Check Docker resource usage
docker stats

# View container memory limits
docker-compose config | grep -A 5 "resources:"

# Increase limits if needed (edit docker-compose.yml)
```

## Monitoring

### Check Application Health

```bash
# Test from server
curl http://localhost:3000/

# Test from local machine
curl http://68.183.86.134/
# OR
curl http://alternatives.nativeworld.com/
```

### Monitor Container Stats

```bash
# Real-time resource usage
docker stats

# Check container size
docker images

# Check disk usage
df -h
```

### View Event Logs

```bash
# Docker daemon events
docker events

# Container restart logs
docker-compose logs --tail=50
```

## Backup Strategy

### Automated Backup (Recommended)

Set up a cron job to backup the database daily:

```bash
# Create backup script
cat > /app/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/app/backups"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

cd /app
docker-compose exec -T db mysqldump -u root -palternative_ens alternative_ens > $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
EOF

chmod +x /app/backup.sh

# Add to crontab (runs daily at 2 AM)
crontab -e
# Add line: 0 2 * * * /app/backup.sh
```

### Manual Backup

```bash
docker-compose exec db mysqldump -u root -palternative_ens alternative_ens > backup.sql
scp root@68.183.86.134:/app/backup.sql ~/backups/
```

## Advanced Operations

### Create Non-Root User (Recommended)

```bash
ssh root@68.183.86.134

# Create appuser
useradd -m -s /bin/bash appuser

# Add to docker group
usermod -aG docker appuser

# Test new user
su - appuser
cd /app
docker-compose ps
```

### SSL/TLS with Let's Encrypt

Coming soon - setup Nginx reverse proxy with Let's Encrypt certificates.

### Horizontal Scaling

For multiple app instances behind a load balancer:

```yaml
# In docker-compose.yml
services:
  app:
    deploy:
      replicas: 3
```

## Performance Optimization

### Resource Limits

```yaml
# In docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Database Optimization

```bash
# Connect to database
docker-compose exec db mysql -u root -palternative_ens alternative_ens

# Check indexes
SHOW INDEX FROM [table_name];

# Optimize tables
OPTIMIZE TABLE [table_name];
```

## Support

For issues or questions:

1. Check logs: `docker-compose logs -f`
2. Verify services: `docker-compose ps`
3. Test connectivity: `curl http://68.183.86.134/`
4. Review this guide: DOCKER_DEPLOYMENT.md
