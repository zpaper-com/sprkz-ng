module.exports = {
  apps: [{
    name: 'sprkz-dev',
    script: 'npm',
    args: 'start',
    cwd: '/home/shawnstorie/sprkz-ng/sprkz',
    instances: 1,
    exec_mode: 'fork',
    env: {
      PORT: 7779,
      NODE_ENV: 'development',
      HOST: '0.0.0.0',
      BROWSER: 'none',
      DANGEROUSLY_DISABLE_HOST_CHECK: 'true'
    },
    watch: false,
    max_memory_restart: '512M',
    restart_delay: 2000,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000,
    listen_timeout: 8000,
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};