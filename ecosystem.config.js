module.exports = {
  apps: [{
    name: 'sprkz-ng',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 7779
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 7779
    },
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    
    // Process management
    min_uptime: '10s',
    max_restarts: 10,
    
    // Health monitoring
    health_check_url: 'http://localhost:7779/health',
    health_check_grace_period: 3000
  }]
};