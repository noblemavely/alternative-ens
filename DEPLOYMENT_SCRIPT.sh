#!/bin/bash

# Alternative ENS Deployment Script
# Run this script on the server to deploy the latest changes
# Usage: bash DEPLOYMENT_SCRIPT.sh

set -e

echo "=== Alternative ENS Deployment Script ==="
echo ""

# Navigate to project directory
cd /root/alternative-ens || {
  echo "Error: Could not navigate to /root/alternative-ens"
  exit 1
}

echo "📦 Pulling latest changes from GitHub..."
git pull origin main

echo ""
echo "🔨 Building application locally..."
npm run build

echo ""
echo "🐳 Rebuilding Docker image..."
docker-compose build --no-cache

echo ""
echo "🔄 Stopping and removing old containers..."
docker-compose down

echo ""
echo "🚀 Starting new containers..."
docker-compose up -d

echo ""
echo "✅ Deployment completed!"
echo ""
echo "📋 Verifying application status..."
sleep 5

# Test application
if curl -s http://localhost:3000/ > /dev/null; then
  echo "✓ Application is running and responding"
else
  echo "⚠️  Application may not be responding yet, check logs with: docker-compose logs app"
fi

echo ""
echo "📖 Application logs:"
docker-compose logs app | tail -20

echo ""
echo "🎉 Deployment successful!"
echo "Admin login page: https://alternatives.nativeworld.com/admin"
echo "Email: admin@alternatives.nativeworld.com"
echo "Password: admin123"
