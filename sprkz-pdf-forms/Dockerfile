# Multi-stage Docker build for Sprkz PDF Forms
# Stage 1: Build the application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --include=dev

# Copy source code
COPY . .

# Set production environment variables for build
ENV NODE_ENV=production
ENV REACT_APP_VERSION=$BUILD_VERSION
ENV GENERATE_SOURCEMAP=false

# Build the application
RUN npm run build

# Run tests in production build (optional - can be disabled for faster builds)
# RUN npm run test:ci

# Stage 2: Serve the application
FROM nginx:alpine AS production

# Install additional tools for health checks and monitoring
RUN apk add --no-cache curl ca-certificates

# Copy custom nginx configuration
COPY deployment/nginx.conf /etc/nginx/nginx.conf
COPY deployment/default.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy health check script
COPY deployment/health-check.sh /usr/local/bin/health-check.sh
RUN chmod +x /usr/local/bin/health-check.sh

# Create nginx user and set permissions
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD /usr/local/bin/health-check.sh

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Development stage for local development with hot reload
FROM node:18-alpine AS development

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies including dev dependencies
RUN npm ci

# Copy source code
COPY . .

# Set development environment
ENV NODE_ENV=development
ENV PORT=7779
ENV WATCHPACK_POLLING=true

# Expose development port
EXPOSE 7779

# Start development server
CMD ["npm", "start"]

# Testing stage for CI/CD pipeline
FROM node:18-alpine AS testing

# Install system dependencies and testing tools
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Set testing environment variables
ENV NODE_ENV=test
ENV CI=true
ENV CHROMIUM_PATH=/usr/bin/chromium-browser

# Install global testing tools
RUN npm install -g wait-on

# Set up test user for security
RUN addgroup -g 1001 testgroup && \
    adduser -D -u 1001 -G testgroup testuser && \
    chown -R testuser:testgroup /app

USER testuser

# Default command runs all tests
CMD ["npm", "run", "test:ci"]