#!/bin/sh
# Load environment variables from .env file (but don't override NODE_ENV)
if [ -f /app/.env ]; then
  # Export all variables except NODE_ENV (which should be set by docker-compose)
  export $(grep -v '^#' /app/.env | grep -v '^$' | grep -v 'NODE_ENV' | xargs)
fi
# Start the application
exec node dist/index.js
