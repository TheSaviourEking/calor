// PM2 Ecosystem Config — CALŌR Mini-Services
// Used on Hetzner VPS to manage support-chat and live-stream processes.
//
// First-time setup:
//   pm2 start ecosystem.config.js
//   pm2 save
//   pm2 startup  (follow the printed command to enable auto-start on reboot)
//
// Subsequent deploys (handled by GitHub Actions):
//   pm2 startOrRestart ecosystem.config.js --update-env

module.exports = {
  apps: [
    {
      name: 'support-chat',
      script: 'index.ts',
      interpreter: 'bun',
      cwd: '/opt/calor/mini-services/support-chat',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: '3031',
        DATABASE_URL: process.env.DATABASE_URL,
        SOCKET_IO_ORIGINS: process.env.SOCKET_IO_ORIGINS,
      },
      error_file: '/var/log/calor/support-chat-error.log',
      out_file: '/var/log/calor/support-chat-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'live-stream',
      script: 'index.ts',
      interpreter: 'bun',
      cwd: '/opt/calor/mini-services/live-stream',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: '3032',
        DATABASE_URL: process.env.DATABASE_URL,
        SOCKET_IO_ORIGINS: process.env.SOCKET_IO_ORIGINS,
      },
      error_file: '/var/log/calor/live-stream-error.log',
      out_file: '/var/log/calor/live-stream-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
