# Production stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod

# Copy pre-built dist folder
COPY dist ./dist

# Copy environment template (will be overridden by docker-compose)
COPY .env.example .env.example

# Copy entrypoint script
COPY entrypoint.sh entrypoint.sh
RUN chmod +x entrypoint.sh

# Expose port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Start application using entrypoint script
ENTRYPOINT ["./entrypoint.sh"]
