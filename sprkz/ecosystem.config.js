module.exports = {
  apps: [{
    name: 'sprkz-dev',
    script: 'npm',
    args: 'start',
    cwd: '/home/shawnstorie/sprkz-ng/sprkz',
    env: {
      PORT: 7779,
      NODE_ENV: 'development',
      HOST: '0.0.0.0',
      BROWSER: 'none'
    },
    watch: false,
    max_memory_restart: '1G',
    restart_delay: 2000,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};