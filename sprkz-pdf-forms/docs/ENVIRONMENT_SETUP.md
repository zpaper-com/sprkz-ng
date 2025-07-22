# Environment Setup Guide - Sprkz PDF Forms

## Overview

This document provides comprehensive instructions for setting up development, staging, and production environments for the Sprkz PDF Forms platform.

## Prerequisites

### System Requirements

#### Development Environment
- **Node.js**: v18.x or higher (LTS recommended)
- **npm**: v9.x or higher (comes with Node.js)
- **Git**: v2.30 or higher
- **Docker**: v20.10 or higher (for containerized development)
- **Docker Compose**: v2.0 or higher

#### Operating System Support
- **macOS**: 10.15 (Catalina) or higher
- **Windows**: 10 (build 1909) or higher with WSL2
- **Linux**: Ubuntu 20.04+, CentOS 8+, or equivalent

#### Hardware Requirements
- **CPU**: 2+ cores (4+ recommended for optimal development experience)
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 10GB free space (SSD recommended)
- **Network**: Broadband internet connection for package downloads

### Development Tools

#### Required
- **Code Editor**: VS Code (recommended) or equivalent
- **Browser**: Chrome 90+, Firefox 88+, or Safari 14+ for testing

#### Recommended Extensions (VS Code)
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml"
  ]
}
```

---

## Environment Variables

### Development Environment

Create a `.env.local` file in the project root:

```bash
# Application Configuration
PORT=7779
NODE_ENV=development
REACT_APP_VERSION=dev
GENERATE_SOURCEMAP=true

# Feature Flags (Unleash)
REACT_APP_UNLEASH_PROXY_URL=http://localhost:4242/api/proxy
REACT_APP_UNLEASH_CLIENT_KEY=development-key
REACT_APP_UNLEASH_APP_NAME=sprkz-pdf-forms
REACT_APP_UNLEASH_ENVIRONMENT=development

# Error Tracking (Sentry)
REACT_APP_SENTRY_DSN=your-development-sentry-dsn
REACT_APP_SENTRY_ENVIRONMENT=development
REACT_APP_SENTRY_RELEASE=$npm_package_version

# API Configuration
REACT_APP_API_BASE_URL=http://localhost:3001/api

# Development Debugging
REACT_APP_DEBUG_MODE=true
REACT_APP_LOG_LEVEL=debug

# Performance Monitoring
REACT_APP_PERFORMANCE_MONITORING=true
REACT_APP_WEB_VITALS_TRACKING=true

# Testing
REACT_APP_TEST_MODE=false
```

### Staging Environment

Create a `.env.staging` file:

```bash
# Application Configuration
NODE_ENV=production
REACT_APP_VERSION=$BUILD_VERSION
GENERATE_SOURCEMAP=false

# Feature Flags
REACT_APP_UNLEASH_PROXY_URL=https://unleash-staging.company.com/api/proxy
REACT_APP_UNLEASH_CLIENT_KEY=staging-client-key
REACT_APP_UNLEASH_APP_NAME=sprkz-pdf-forms
REACT_APP_UNLEASH_ENVIRONMENT=staging

# Error Tracking
REACT_APP_SENTRY_DSN=your-staging-sentry-dsn
REACT_APP_SENTRY_ENVIRONMENT=staging
REACT_APP_SENTRY_RELEASE=$BUILD_VERSION

# API Configuration
REACT_APP_API_BASE_URL=https://api-staging.sprkz.com/api

# Performance Monitoring
REACT_APP_PERFORMANCE_MONITORING=true
REACT_APP_WEB_VITALS_TRACKING=true

# Security
REACT_APP_CSP_REPORT_URI=https://csp-reports-staging.sprkz.com/report
```

### Production Environment

Create a `.env.production` file:

```bash
# Application Configuration
NODE_ENV=production
REACT_APP_VERSION=$BUILD_VERSION
GENERATE_SOURCEMAP=false

# Feature Flags
REACT_APP_UNLEASH_PROXY_URL=https://unleash.company.com/api/proxy
REACT_APP_UNLEASH_CLIENT_KEY=production-client-key
REACT_APP_UNLEASH_APP_NAME=sprkz-pdf-forms
REACT_APP_UNLEASH_ENVIRONMENT=production

# Error Tracking
REACT_APP_SENTRY_DSN=your-production-sentry-dsn
REACT_APP_SENTRY_ENVIRONMENT=production
REACT_APP_SENTRY_RELEASE=$BUILD_VERSION

# API Configuration
REACT_APP_API_BASE_URL=https://api.sprkz.com/api

# Performance Monitoring
REACT_APP_PERFORMANCE_MONITORING=true
REACT_APP_WEB_VITALS_TRACKING=true

# Security
REACT_APP_CSP_REPORT_URI=https://csp-reports.sprkz.com/report

# Analytics
REACT_APP_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
```

---

## Development Setup

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/sprkz-pdf-forms.git
cd sprkz-pdf-forms

# Install dependencies
npm install
```

### 2. Environment Configuration

```bash
# Copy example environment file
cp .env.example .env.local

# Edit environment variables
nano .env.local
```

### 3. Start Development Server

```bash
# Start on custom port (7779)
npm start

# Or start with explicit port
PORT=7779 npm start
```

The development server will be available at: `http://localhost:7779`

### 4. Run Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:performance

# Run tests with coverage
npm run test:coverage
```

### 5. Development with Docker

```bash
# Start development environment
docker-compose --profile development up

# Start with hot reload
docker-compose --profile dev up

# View logs
docker-compose logs -f app-dev
```

---

## Docker Setup

### Development Docker Setup

```bash
# Build development image
docker build --target development -t sprkz-pdf-forms:dev .

# Run development container
docker run -p 7779:7779 -v $(pwd):/app sprkz-pdf-forms:dev
```

### Production Docker Setup

```bash
# Build production image
docker build --target production -t sprkz-pdf-forms:prod .

# Run production container
docker run -p 8080:8080 sprkz-pdf-forms:prod

# Health check
curl http://localhost:8080/health
```

### Docker Compose Profiles

```bash
# Development
docker-compose --profile development up

# Production
docker-compose --profile production up

# Testing
docker-compose --profile testing up

# With feature flags (Unleash)
docker-compose --profile unleash up
```

---

## CI/CD Setup

### GitHub Actions Secrets

Configure the following secrets in your GitHub repository:

#### Required Secrets
```bash
# Container Registry
GITHUB_TOKEN                 # Automatically provided by GitHub

# Cloud Provider (AWS)
AWS_ACCESS_KEY_ID           # AWS access key for deployments
AWS_SECRET_ACCESS_KEY       # AWS secret key for deployments

# External Services
CODECOV_TOKEN              # Code coverage reporting
SENTRY_AUTH_TOKEN          # Error tracking integration
UNLEASH_API_TOKEN          # Feature flag management

# Monitoring & Notifications
SLACK_WEBHOOK_URL          # Deployment notifications
DISCORD_WEBHOOK            # Release notifications
WEBPAGETEST_API_KEY       # Performance monitoring
```

#### Optional Secrets
```bash
# Security Scanning
SNYK_TOKEN                 # Security vulnerability scanning

# Performance Monitoring
LIGHTHOUSE_SERVER_URL      # Performance audit server
```

### Environment Variables for CI/CD

```yaml
# .github/workflows/ci.yml environment variables
env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}
  CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}
```

---

## Kubernetes Deployment

### Prerequisites

- **Kubernetes Cluster**: v1.24+
- **kubectl**: v1.24+
- **Helm**: v3.8+ (optional, for package management)
- **Ingress Controller**: NGINX Ingress Controller
- **Cert Manager**: For TLS certificate management

### Namespace Setup

```bash
# Create namespace
kubectl create namespace sprkz-pdf-forms

# Apply RBAC (if required)
kubectl apply -f deployment/rbac.yaml
```

### ConfigMaps and Secrets

```bash
# Create ConfigMap
kubectl create configmap sprkz-pdf-forms-config \
  --from-literal=NODE_ENV=production \
  --from-literal=REACT_APP_VERSION=1.0.0 \
  -n sprkz-pdf-forms

# Create Secrets
kubectl create secret generic sprkz-pdf-forms-secrets \
  --from-literal=REACT_APP_UNLEASH_CLIENT_KEY=your-client-key \
  --from-literal=REACT_APP_SENTRY_DSN=your-sentry-dsn \
  -n sprkz-pdf-forms
```

### Deploy Application

```bash
# Apply Kubernetes manifests
kubectl apply -f deployment/kubernetes.yaml

# Check deployment status
kubectl rollout status deployment/sprkz-pdf-forms-app -n sprkz-pdf-forms

# View pods
kubectl get pods -n sprkz-pdf-forms
```

### Ingress Configuration

```yaml
# Update ingress host in kubernetes.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: sprkz-pdf-forms-ingress
  namespace: sprkz-pdf-forms
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - pdf.your-domain.com  # Update this
    secretName: sprkz-pdf-forms-tls
  rules:
  - host: pdf.your-domain.com  # Update this
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: sprkz-pdf-forms-service
            port:
              number: 80
```

---

## Monitoring Setup

### Prometheus Configuration

Create `monitoring/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'sprkz-pdf-forms'
    static_configs:
      - targets: ['sprkz-pdf-forms-service:80']
    metrics_path: '/nginx_status'
    scrape_interval: 30s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

### Grafana Dashboard

```bash
# Start monitoring stack
docker-compose --profile monitoring up

# Access Grafana
open http://localhost:3000
# Default credentials: admin/admin123
```

### Sentry Configuration

```javascript
// src/config/sentry.ts
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

if (process.env.REACT_APP_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.REACT_APP_SENTRY_ENVIRONMENT,
    release: process.env.REACT_APP_SENTRY_RELEASE,
    integrations: [
      new BrowserTracing({
        tracingOrigins: [window.location.hostname],
      }),
    ],
    tracesSampleRate: 0.1,
  });
}
```

---

## Feature Flags Setup (Unleash)

### Local Unleash Server

```bash
# Start Unleash with Docker Compose
docker-compose --profile unleash up

# Access Unleash UI
open http://localhost:4242
# Default credentials: admin/unleash4all
```

### Configure Feature Flags

1. **Access Unleash Admin**: `http://localhost:4242`
2. **Create Project**: "sprkz-pdf-forms"
3. **Create API Token**: For client access
4. **Configure Strategies**: Based on user attributes

### Example Feature Flags

```javascript
// Feature flags to create in Unleash
const featureFlags = [
  'ENHANCED_WIZARD_MODE',
  'PROGRESSIVE_FORM_FILLING', 
  'SMART_FIELD_DETECTION',
  'SIGNATURE_DRAWING_MODE',
  'SIGNATURE_TYPED_MODE',
  'REAL_TIME_VALIDATION'
];
```

---

## Database Setup (Optional)

### PostgreSQL for Unleash

```bash
# Using Docker
docker run -d \
  --name unleash-postgres \
  -e POSTGRES_DB=unleash \
  -e POSTGRES_USER=unleash_user \
  -e POSTGRES_PASSWORD=password123 \
  -p 5432:5432 \
  postgres:15-alpine
```

### Redis for Caching

```bash
# Using Docker
docker run -d \
  --name redis-cache \
  -p 6379:6379 \
  redis:7-alpine
```

---

## SSL/TLS Configuration

### Development (Self-Signed)

```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Move to ssl directory
mkdir ssl
mv cert.pem key.pem ssl/
```

### Production (Let's Encrypt)

```bash
# Install cert-manager in Kubernetes
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.11.0/cert-manager.yaml

# Create ClusterIssuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@your-domain.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

---

## Performance Optimization

### Build Optimization

```bash
# Analyze bundle size
npm run build
npx webpack-bundle-analyzer build/static/js/*.js

# Build with source maps for debugging
GENERATE_SOURCEMAP=true npm run build
```

### Runtime Performance

```javascript
// Performance monitoring configuration
const config = {
  // Lazy loading
  LAZY_LOADING_ENABLED: true,
  
  // Caching
  CACHE_STATIC_ASSETS: true,
  CACHE_API_RESPONSES: true,
  
  // Code splitting
  DYNAMIC_IMPORTS: true,
  
  // Service worker
  SERVICE_WORKER_ENABLED: true
};
```

---

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -ti:7779
# Kill process
kill -9 $(lsof -ti:7779)
```

#### Node.js Version Issues
```bash
# Check Node.js version
node --version

# Use nvm to switch versions
nvm install 18
nvm use 18
```

#### Docker Issues
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t sprkz-pdf-forms .
```

#### Memory Issues
```bash
# Increase Node.js memory limit
NODE_OPTIONS=--max-old-space-size=8192 npm start
```

### Debugging

#### Debug Mode
```bash
# Enable debug mode
REACT_APP_DEBUG_MODE=true npm start

# Enable verbose logging
REACT_APP_LOG_LEVEL=debug npm start
```

#### Browser DevTools
- **React DevTools**: Install React Developer Tools extension
- **Performance Tab**: Monitor rendering performance
- **Network Tab**: Check asset loading and API calls
- **Console**: Monitor errors and warnings

### Health Checks

```bash
# Application health
curl http://localhost:7779/
curl http://localhost:8080/health

# Docker health
docker ps
docker logs container-name

# Kubernetes health
kubectl get pods -n sprkz-pdf-forms
kubectl describe pod pod-name -n sprkz-pdf-forms
```

---

## Security Considerations

### Environment Security
- **Never commit**: `.env` files to version control
- **Use secrets management**: For production credentials
- **Rotate keys**: Regularly rotate API keys and certificates
- **Audit dependencies**: Run `npm audit` regularly

### Production Security
- **HTTPS only**: Never serve over HTTP in production
- **Security headers**: Implemented in Nginx configuration
- **CSP policy**: Content Security Policy configured
- **Rate limiting**: API and static asset rate limiting

### Development Security
- **Local HTTPS**: Use HTTPS even in development when testing integrations
- **Dependency scanning**: Use Snyk or similar tools
- **Code analysis**: ESLint security rules enabled

---

This environment setup guide provides comprehensive instructions for all deployment scenarios. For specific deployment questions, refer to the troubleshooting section or consult the team's deployment documentation.