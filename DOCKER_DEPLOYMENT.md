# Docker Deployment Guide

This document explains how to deploy the Alternative ENS application using Docker on the Oracle Cloud instance.

## Prerequisites

- Docker installed on the Oracle instance
- Docker Compose installed on the Oracle instance
- Git installed for cloning the repository

## Installation Steps

### 1. Connect to the Oracle Instance

```bash
ssh -i ~/.ssh/oracle_instance_key ubuntu@80.225.242.228
```

### 2. Install Docker and Docker Compose

```bash
# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# Add ubuntu user to docker group (so you don't need sudo)
sudo usermod -aG docker ubuntu
# Log out and back in for this to take effect
```

### 3. Clone the Repository

```bash
cd /home/ubuntu
git clone <repository-url> alternative-ens
cd alternative-ens
```

### 4. Configure Environment Variables

Create a `.env` file with your configuration:

```bash
cp .env.example .env
nano .env
```

Update the following variables:
- `VITE_APP_ID`: Your application ID
- `JWT_SECRET`: A strong random secret for JWT tokens
- `APP_ORIGIN`: The public URL of your application (e.g., http://80.225.242.228:3000)
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`: Email service credentials (e.g., Brevo)
- `CLAUDE_API_KEY`: If using Claude AI features
- `APOLLO_API_KEY`: If using LinkedIn enrichment
- `AWS_*`: AWS S3 credentials if using file uploads

### 5. Build and Start the Application

```bash
# Build the Docker images and start the containers
docker-compose up -d

# View logs
docker-compose logs -f

# Check container status
docker-compose ps
```

### 6. Verify the Application is Running

```bash
# Wait a few seconds for the application to start
sleep 10

# Test the application
curl http://localhost:3000/

# Check database connection
docker-compose exec db mysql -u app_user -pAppPassword123! -e "USE alternative_ens; SHOW TABLES;"
```

## Common Docker Commands

### View Logs

```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View logs for a specific service
docker-compose logs -f app
docker-compose logs -f db
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart a specific service
docker-compose restart app
docker-compose restart db
```

### Stop Services

```bash
# Stop all services (containers still exist)
docker-compose stop

# Remove all services (containers are deleted)
docker-compose down

# Remove everything including volumes (database data will be deleted!)
docker-compose down -v
```

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build
```

## Database Management

### Backup Database

```bash
# Backup the database
docker-compose exec db mysqldump -u app_user -pAppPassword123! alternative_ens > backup.sql

# Backup with root access
docker-compose exec db mysqldump -u root -pRootPassword123! alternative_ens > backup.sql
```

### Restore Database

```bash
# Restore from backup
docker-compose exec -T db mysql -u app_user -pAppPassword123! alternative_ens < backup.sql
```

### Access Database Shell

```bash
# Access MySQL shell as app_user
docker-compose exec db mysql -u app_user -pAppPassword123! alternative_ens

# Access MySQL shell as root
docker-compose exec db mysql -u root -pRootPassword123!
```

## Troubleshooting

### Application won't start
```bash
# Check the logs
docker-compose logs app

# Verify database is running
docker-compose logs db

# Check if port 3000 is available
lsof -i :3000
```

### Database connection errors
```bash
# Verify database is healthy
docker-compose ps

# Check database credentials in .env
grep DATABASE_URL .env

# Test connection manually
docker-compose exec db mysql -u app_user -pAppPassword123! -e "SELECT 1;"
```

### Port already in use
If port 3000 or 3306 is already in use, modify `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Change 3000 to an available port
  - "3307:3306"  # Change 3306 to an available port
```

## Production Recommendations

1. **Use a reverse proxy**: Set up Nginx in front of the application
2. **SSL/TLS**: Use Let's Encrypt for HTTPS
3. **Database backup**: Set up automated backups
4. **Monitoring**: Set up container monitoring and logging
5. **Secrets management**: Use proper secret management instead of .env files
6. **Resource limits**: Set memory and CPU limits in docker-compose.yml

Example with resource limits:

```yaml
services:
  app:
    # ... other config ...
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Stopping and Removing Containers

When you need to take the application offline:

```bash
# Stop containers without deleting them
docker-compose stop

# Remove stopped containers
docker-compose rm

# Stop and remove everything
docker-compose down
```

## Getting Help

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify services are running: `docker-compose ps`
3. Test database connection: `docker-compose exec db mysql -u app_user -pAppPassword123! -e "SELECT 1;"`
4. Check Docker and Docker Compose versions: `docker --version && docker-compose --version`
