#!/bin/bash
# Production Deployment Script
# Usage: ./deploy.sh <server_ip> <server_user> <server_password>

set -e

if [ $# -lt 3 ]; then
    echo "Usage: $0 <server_ip> <server_user> <server_password>"
    echo "Example: $0 68.183.86.134 root mypassword"
    exit 1
fi

SERVER_IP=$1
SERVER_USER=$2
SERVER_PASSWORD=$3
APP_PATH="/app"

echo "🚀 Starting deployment to $SERVER_IP"

# Build locally
echo "📦 Building application..."
npm run build || pnpm build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "✓ Build successful"

# Install sshpass if not available
if ! command -v sshpass &> /dev/null; then
    echo "📥 Installing sshpass..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install sshpass
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y sshpass
    fi
fi

echo "📤 Uploading files to server..."

# Create backup on server
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'SSH_CMD'
    if [ -d /app/dist ]; then
        cp -r /app/dist /app/dist.backup.$(date +%s)
        echo "✓ Backup created"
    fi
SSH_CMD

# Upload dist folder
sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no -r dist $SERVER_USER@$SERVER_IP:$APP_PATH/
if [ $? -ne 0 ]; then
    echo "❌ SCP failed"
    exit 1
fi
echo "✓ Files uploaded"

# Upload latest files and restart containers
echo "🔄 Restarting application..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'RESTART_CMD'
    cd /app

    # Pull latest code to ensure all files are current
    if [ -d .git ]; then
        git pull origin main 2>/dev/null || true
    fi

    # Stop and remove containers
    docker-compose down 2>/dev/null || true

    # Start containers
    docker-compose up -d

    # Wait for services to be healthy
    echo "⏳ Waiting for services to start..."
    sleep 15

    # Verify application is running
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✓ Application is running"
    else
        echo "⚠ Application may not be running correctly"
        docker-compose logs app | tail -20
    fi
RESTART_CMD

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ DEPLOYMENT COMPLETE"
    echo "📍 Access your application at: https://alternatives.nativeworld.com"
    echo ""
    echo "To verify the fix:"
    echo "1. Go to https://alternatives.nativeworld.com/expert/register"
    echo "2. Enter an email and click 'Send Verification Code'"
    echo "3. Check if verification email is received"
else
    echo "❌ Deployment had issues"
    exit 1
fi
