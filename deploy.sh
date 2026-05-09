#!/bin/bash

# Alternative ENS - Production Deployment Script
# Deploys application to Oracle instance at 80.225.242.228

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ORACLE_IP="80.225.242.228"
ORACLE_USER="opc"
SSH_KEY="$HOME/.ssh/oracle_instance_key"
APP_DIR="/home/app/alternative-ens"
DEPLOYMENT_METHOD="${1:-pm2}"  # pm2 or docker

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if [ ! -d "dist" ]; then
    echo -e "${RED}ERROR: dist/ directory not found. Run 'npm run build' first.${NC}"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo -e "${RED}ERROR: .env file not found.${NC}"
    exit 1
fi

if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}ERROR: SSH key not found at $SSH_KEY${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites found${NC}"

# Test SSH connection
echo -e "${YELLOW}Testing SSH connection to Oracle instance...${NC}"

if ! ssh -i "$SSH_KEY" -o ConnectTimeout=5 "${ORACLE_USER}@${ORACLE_IP}" "echo 'Connection successful'" > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Cannot connect to Oracle instance at ${ORACLE_IP}${NC}"
    echo "Please verify:"
    echo "  1. Oracle instance is running"
    echo "  2. SSH key is correct: $SSH_KEY"
    echo "  3. Network connectivity to ${ORACLE_IP}"
    exit 1
fi

echo -e "${GREEN}✓ SSH connection successful${NC}"

# Create app directory on remote
echo -e "${YELLOW}Creating app directory...${NC}"
ssh -i "$SSH_KEY" "${ORACLE_USER}@${ORACLE_IP}" "mkdir -p ${APP_DIR}"

# Upload files
echo -e "${YELLOW}Uploading files to Oracle instance...${NC}"

if [ "$DEPLOYMENT_METHOD" == "docker" ]; then
    echo "  - Uploading Docker files..."
    scp -i "$SSH_KEY" docker-compose.yml "${ORACLE_USER}@${ORACLE_IP}:${APP_DIR}/"
    scp -i "$SSH_KEY" Dockerfile "${ORACLE_USER}@${ORACLE_IP}:${APP_DIR}/"
    scp -i "$SSH_KEY" db-init.sql "${ORACLE_USER}@${ORACLE_IP}:${APP_DIR}/"
fi

echo "  - Uploading dist folder..."
scp -i "$SSH_KEY" -r dist "${ORACLE_USER}@${ORACLE_IP}:${APP_DIR}/"

echo "  - Uploading environment and config files..."
scp -i "$SSH_KEY" .env "${ORACLE_USER}@${ORACLE_IP}:${APP_DIR}/"
scp -i "$SSH_KEY" package.json "${ORACLE_USER}@${ORACLE_IP}:${APP_DIR}/" 2>/dev/null || true
scp -i "$SSH_KEY" package-lock.json "${ORACLE_USER}@${ORACLE_IP}:${APP_DIR}/" 2>/dev/null || true

echo -e "${GREEN}✓ Files uploaded successfully${NC}"

# Start application
echo -e "${YELLOW}Starting application using ${DEPLOYMENT_METHOD}...${NC}"

if [ "$DEPLOYMENT_METHOD" == "docker" ]; then
    ssh -i "$SSH_KEY" "${ORACLE_USER}@${ORACLE_IP}" "cd ${APP_DIR} && docker-compose up -d"
    echo -e "${GREEN}✓ Application started with Docker Compose${NC}"
    echo -e "${YELLOW}Waiting for containers to be ready...${NC}"
    sleep 10
    ssh -i "$SSH_KEY" "${ORACLE_USER}@${ORACLE_IP}" "cd ${APP_DIR} && docker-compose ps"
else
    # PM2 deployment
    ssh -i "$SSH_KEY" "${ORACLE_USER}@${ORACLE_IP}" "cd ${APP_DIR} && npm install --production 2>&1 | tail -5"
    ssh -i "$SSH_KEY" "${ORACLE_USER}@${ORACLE_IP}" "cd ${APP_DIR} && pm2 stop alternative-ens 2>/dev/null || true"
    ssh -i "$SSH_KEY" "${ORACLE_USER}@${ORACLE_IP}" "cd ${APP_DIR} && pm2 start dist/index.js --name alternative-ens && pm2 save"
    echo -e "${GREEN}✓ Application started with PM2${NC}"
    ssh -i "$SSH_KEY" "${ORACLE_USER}@${ORACLE_IP}" "pm2 status"
fi

# Verify deployment
echo -e "${YELLOW}Verifying deployment...${NC}"

sleep 5

if curl -s -o /dev/null -w "%{http_code}" "http://${ORACLE_IP}:3000/" | grep -q "200"; then
    echo -e "${GREEN}✓ Application is running and responding${NC}"
else
    echo -e "${YELLOW}⚠ Application may still be starting. Check logs:${NC}"
    if [ "$DEPLOYMENT_METHOD" == "docker" ]; then
        ssh -i "$SSH_KEY" "${ORACLE_USER}@${ORACLE_IP}" "cd ${APP_DIR} && docker-compose logs app | tail -20"
    else
        ssh -i "$SSH_KEY" "${ORACLE_USER}@${ORACLE_IP}" "pm2 logs alternative-ens | tail -20"
    fi
fi

echo -e "${GREEN}Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Open http://${ORACLE_IP}:3000/ in your browser"
echo "  2. Login to admin: http://${ORACLE_IP}:3000/admin"
echo "  3. Default credentials: admin@alternative.com / admin123"
echo ""
echo "Logs and monitoring:"
if [ "$DEPLOYMENT_METHOD" == "docker" ]; then
    echo "  View logs: ssh -i $SSH_KEY ${ORACLE_USER}@${ORACLE_IP} 'cd ${APP_DIR} && docker-compose logs app -f'"
    echo "  Stop app: ssh -i $SSH_KEY ${ORACLE_USER}@${ORACLE_IP} 'cd ${APP_DIR} && docker-compose down'"
else
    echo "  View logs: ssh -i $SSH_KEY ${ORACLE_USER}@${ORACLE_IP} 'pm2 logs alternative-ens'"
    echo "  Stop app: ssh -i $SSH_KEY ${ORACLE_USER}@${ORACLE_IP} 'pm2 stop alternative-ens'"
fi
