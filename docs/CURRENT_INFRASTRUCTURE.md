# Current Infrastructure Documentation

## Overview

This document describes the **existing placeholder infrastructure** for the sprkz-ng project. This infrastructure is currently running and **MUST BE MAINTAINED** during development to ensure continuous deployment pipeline functionality.

**⚠️ CRITICAL**: The current `server.js` is used for ALB target group health checks and **cannot be removed** until the new React application implements the required health endpoint.

## Server Details

### Basic Information
- **Service Name**: sprkz-ng
- **Port**: 7779 (spells "SPRZ" on phone keypad)
- **Domain**: sprkz-ng.zpaper.com
- **Bind Address**: 0.0.0.0 (all interfaces)
- **Process Manager**: PM2 (managed service)
- **Purpose**: Placeholder server for ALB target group and health checks

### Critical Endpoints
- **`GET /`**: Returns "sprkz-ng" (plain text) - Basic response endpoint
- **`GET /health`**: Returns JSON health check - **REQUIRED FOR ALB TARGET GROUP**

#### Health Endpoint Details
The `/health` endpoint is **CRITICAL** for AWS Application Load Balancer (ALB) target group health checks:

```json
{
  "status": "healthy",
  "service": "sprkz-ng", 
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": "2h 15m 30s"
}
```

**⚠️ IMPORTANT**: This endpoint must return a 200 HTTP status code or the ALB will mark the target as unhealthy and remove it from rotation.

## Current PM2 Configuration

### Service Status
The placeholder server is currently managed by PM2 and should remain running during development:

```bash
# Check current PM2 status
pm2 status

# Expected output should show sprkz-ng running on port 7779
# ┌─────┬──────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
# │ id  │ name     │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
# ├─────┼──────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
# │ 9   │ sprkz-ng │ default     │ N/A     │ fork    │ 1234567  │ 2h     │ 0    │ online    │ 0%       │ 25.2mb   │ user     │ disabled │
# └─────┴──────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

### Prerequisites (Already Configured)
```bash
# Node.js is installed and configured
node --version

# PM2 is installed and managing the service
pm2 --version
```

## Transition Plan for React Development

### Current State
- ✅ **server.js is running** on port 7779 via PM2
- ✅ **ALB target group** is configured and healthy 
- ✅ **Health checks** are passing at `sprkz-ng.zpaper.com/health`
- ✅ **Domain routing** is functional

### Development Phase Guidelines

#### During React Development (Phases 1-8)
1. **Keep server.js running** - Do not stop or remove the PM2 service
2. **Develop React app** on a different port (e.g., 3000) initially
3. **Test React app** independently without affecting production
4. **Preserve /health endpoint** functionality

#### Before Production Deployment (Phase 11)
1. **Implement /health endpoint** in React application build
2. **Test health endpoint** returns proper JSON response with 200 status
3. **Configure React build** to serve on port 7779
4. **Ensure PDF files are served** from `/pdfs/` directory (makana2025.pdf, tremfya.pdf)
5. **Verify ALB compatibility** with new React server

#### Server Removal Process (ONLY after React /health is working)

**⚠️ CRITICAL**: server.js **MUST be stopped** before React can bind to port 7779.

```bash
# 1. Test new React /health endpoint on different port first (e.g., port 3000)
curl http://localhost:3000/health

# 2. Verify React health endpoint returns proper JSON with 200 status
# Expected response:
# {
#   "status": "healthy",
#   "service": "sprkz-pdf-forms",
#   "timestamp": "2024-01-15T10:30:00.000Z",
#   "version": "1.0.0"
# }

# 3. STOP server.js to free port 7779 (REQUIRED - React cannot bind to occupied port)
pm2 stop sprkz-ng

# 4. IMMEDIATELY start React application on port 7779 
# (Minimize downtime - ALB health checks will fail during transition)
PORT=7779 npm run start:prod
# OR
serve -s build -l 7779

# 5. Verify ALB health checks pass with new React server
curl http://localhost:7779/health
curl https://sprkz-ng.zpaper.com/health

# 6. Monitor ALB target health in AWS console for 2-3 minutes
# Ensure target shows as "healthy" before proceeding

# 7. Only after ALB confirms healthy status, remove old PM2 service
pm2 delete sprkz-ng
rm server.js
```

**⚠️ IMPORTANT NOTES**:
- **Port conflict**: Only ONE process can bind to port 7779 at a time
- **Downtime window**: There will be brief downtime while switching servers
- **ALB grace period**: ALB may mark target unhealthy during transition (~30-60 seconds)
- **Rollback plan**: Keep server.js backup until ALB stability is confirmed

### Emergency Rollback Procedure

If the React server fails or ALB health checks fail:

```bash
# 1. IMMEDIATELY stop React server to free port 7779
# (Use Ctrl+C if running in foreground, or kill process)
pkill -f "node.*7779"  # or specific process kill

# 2. IMMEDIATELY restart server.js via PM2
pm2 restart sprkz-ng

# 3. Verify server.js is responding
curl http://localhost:7779/health

# 4. Monitor ALB target health recovery
curl https://sprkz-ng.zpaper.com/health

# 5. Investigate React server issues before retrying transition
```

**⚠️ CRITICAL**: Have this rollback procedure ready before attempting the transition. The ALB will mark the target unhealthy if `/health` endpoint is unreachable for more than the configured threshold (typically 2-3 failed checks).

**⚠️ WARNING**: Never remove server.js until the React application successfully serves the /health endpoint and ALB health checks are passing.

## Current PM2 Management Commands

### Essential Commands (For Maintenance)
```bash
# Check service status
pm2 status sprkz-ng

# View real-time logs
pm2 logs sprkz-ng

# Restart service (if needed)
pm2 restart sprkz-ng

# Reload service (zero-downtime)
pm2 reload sprkz-ng
```

### Advanced PM2 Commands (Use with Caution)
```bash
# Stop the server
pm2 stop sprkz-ng

# Restart the server
pm2 restart sprkz-ng

# Delete the server
pm2 delete sprkz-ng

# Monitor
pm2 monit

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## Target Group Configuration

### AWS Application Load Balancer Setup

#### Target Group Settings
- **Target Type**: Instance
- **Protocol**: HTTP
- **Port**: 7779
- **VPC**: (Your VPC)
- **Health Check Path**: `/health`
- **Health Check Protocol**: HTTP
- **Health Check Port**: 7779

#### Health Check Configuration
```
Health Check Path: /health
Healthy Threshold: 2
Unhealthy Threshold: 3
Timeout: 5 seconds
Interval: 30 seconds
Success Codes: 200
```

#### Expected Health Check Response
```json
{
  "status": "ok",
  "service": "sprkz-ng",
  "timestamp": "2025-07-22T03:48:00.000Z",
  "uptime": 1234.567
}
```

## Domain Configuration

### DNS Setup
- **Domain**: sprkz-ng.zpaper.com
- **Type**: A Record or CNAME
- **Target**: Load Balancer DNS name or EC2 instance IP
- **TTL**: 300 seconds (recommended)

### SSL/TLS
Configure SSL certificate for HTTPS:
- Use AWS Certificate Manager (ACM) for managed certificates
- Apply certificate to the Application Load Balancer
- Redirect HTTP to HTTPS at load balancer level

## Firewall Configuration

### Security Group Rules
```
Inbound Rules:
- Type: HTTP
- Protocol: TCP  
- Port: 7779
- Source: Load Balancer Security Group

- Type: HTTPS (if direct HTTPS)
- Protocol: TCP
- Port: 443
- Source: 0.0.0.0/0

- Type: SSH (for management)
- Protocol: TCP
- Port: 22
- Source: Your IP/Management IPs
```

### OS-level Firewall (if applicable)
```bash
# Allow port 7779
sudo ufw allow 7779/tcp

# Or using iptables
sudo iptables -A INPUT -p tcp --dport 7779 -j ACCEPT
```

## Monitoring

### PM2 Monitoring
```bash
# Real-time monitoring
pm2 monit

# CPU and memory usage
pm2 list

# Detailed info
pm2 describe sprkz-ng
```

### Log Management
```bash
# View logs
pm2 logs sprkz-ng

# Rotate logs
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### Health Check Testing
```bash
# Test root endpoint
curl http://localhost:7779/
# Expected: sprkz-ng

# Test health endpoint
curl http://localhost:7779/health
# Expected: JSON with status "ok"

# Test external access
curl http://sprkz-ng.zpaper.com/
curl http://sprkz-ng.zpaper.com/health
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using port 7779
sudo lsof -i :7779
sudo netstat -tulpn | grep 7779

# Kill process if needed
sudo kill -9 <PID>
```

#### PM2 Not Starting
```bash
# Check PM2 status
pm2 status

# Restart PM2 daemon
pm2 kill
pm2 start ecosystem.config.js
```

#### Health Check Failing
```bash
# Check server logs
pm2 logs sprkz-ng

# Test health endpoint locally
curl http://localhost:7779/health

# Check network connectivity
telnet localhost 7779
```

#### Domain Not Resolving
```bash
# Check DNS resolution
nslookup sprkz-ng.zpaper.com
dig sprkz-ng.zpaper.com

# Check load balancer configuration
# Verify target group health in AWS console
```

## Production Deployment Checklist

- [ ] Node.js installed and updated
- [ ] PM2 installed globally
- [ ] Server files deployed (server.js, ecosystem.config.js)
- [ ] Log directory created
- [ ] PM2 application started
- [ ] PM2 configured for auto-start on boot
- [ ] Security groups configured
- [ ] Target group created with health checks
- [ ] Load balancer configured
- [ ] Domain DNS configured
- [ ] SSL certificate applied
- [ ] Health checks passing
- [ ] External connectivity verified

## File Structure

```
/home/shawnstorie/sprkz-tng/
├── server.js              # Main server file
├── ecosystem.config.js    # PM2 configuration
├── logs/                  # Log directory (created at runtime)
│   ├── combined.log
│   ├── out.log
│   └── error.log
└── docs/
    └── SERVER_DEPLOYMENT.md  # This file
```

## Support

For issues with the deployment:
1. Check PM2 logs: `pm2 logs sprkz-ng`
2. Verify health endpoint: `curl http://localhost:7779/health`
3. Check AWS target group health in console
4. Verify DNS resolution: `nslookup sprkz-ng.zpaper.com`