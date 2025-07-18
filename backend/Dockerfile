# Use official Node.js LTS runtime as base image (v18 for compatibility)
FROM node:18-alpine

# Install bash for startup script
RUN apk add --no-cache bash

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Copy package files first for better layer caching
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm ci --only=production --no-audit --no-fund

# Switch back to app directory
WORKDIR /app

# Copy application files
COPY backend/ ./backend/
COPY *.html ./frontend/
COPY *.css ./frontend/
COPY *.js ./frontend/
COPY images/ ./frontend/images/
COPY start.sh ./
COPY .env.production ./

# Make startup script executable
RUN chmod +x start.sh

# List files for debugging
RUN echo "📁 Backend files:" && ls -la ./backend/
RUN echo "📁 Frontend files:" && ls -la ./frontend/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8080

# Health check with better error handling
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "const http = require('http'); \
    const options = { host: '0.0.0.0', port: 8080, path: '/health', timeout: 5000 }; \
    const req = http.request(options, (res) => { \
      if (res.statusCode === 200) process.exit(0); else process.exit(1); \
    }); \
    req.on('error', () => process.exit(1)); \
    req.on('timeout', () => process.exit(1)); \
    req.end();"

# Start the application using our startup script
CMD ["./start.sh"]
