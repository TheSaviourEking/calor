// PM2 Ecosystem Config — CALŌR Mini-Services
// Handles both Clustered Production and Isolated Staging on the 4-core VPS.
//
// Environment configs are loaded from:
//   Production: /opt/calor/prod/.env
//   Staging:    /opt/calor/staging/.env
//
// Redis provides pub/sub clustering across instances.
// Both staging and prod use Redis with isolated key prefixes:
//   Prod:    calor:prod:chat / calor:prod:stream
//   Staging: calor:staging:chat / calor:staging:stream

const fs = require('fs')
const dotenv = require('dotenv')

function loadEnv(filePath) {
  if (fs.existsSync(filePath)) {
    return dotenv.parse(fs.readFileSync(filePath))
  }
  return {}
}

const prodEnv = loadEnv('/opt/calor/prod/.env')
const stagingEnv = loadEnv('/opt/calor/staging/.env')

module.exports = {
  apps: [
    // ==========================================
    // PRODUCTION APPS (Clustered across cores)
    // ==========================================
    {
      name: 'prod-support-chat-1',
      script: './dist/bin/support-chat',
      cwd: '/opt/calor/prod',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: '3031',
        DATABASE_URL: prodEnv.DATABASE_URL,
        SOCKET_IO_ORIGINS: prodEnv.SOCKET_IO_ORIGINS,
        REDIS_URL: prodEnv.REDIS_URL || 'redis://127.0.0.1:6379',
        REDIS_KEY_PREFIX: 'calor:prod:chat',
      },
      error_file: '/var/log/calor/prod-support-chat-1-error.log',
      out_file: '/var/log/calor/prod-support-chat-1-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'prod-support-chat-2',
      script: './dist/bin/support-chat',
      cwd: '/opt/calor/prod',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: '3033',
        DATABASE_URL: prodEnv.DATABASE_URL,
        SOCKET_IO_ORIGINS: prodEnv.SOCKET_IO_ORIGINS,
        REDIS_URL: prodEnv.REDIS_URL || 'redis://127.0.0.1:6379',
        REDIS_KEY_PREFIX: 'calor:prod:chat',
      },
      error_file: '/var/log/calor/prod-support-chat-2-error.log',
      out_file: '/var/log/calor/prod-support-chat-2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'prod-live-stream-1',
      script: './dist/bin/live-stream',
      cwd: '/opt/calor/prod',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: '3032',
        DATABASE_URL: prodEnv.DATABASE_URL,
        SOCKET_IO_ORIGINS: prodEnv.SOCKET_IO_ORIGINS,
        REDIS_URL: prodEnv.REDIS_URL || 'redis://127.0.0.1:6379',
        REDIS_KEY_PREFIX: 'calor:prod:stream',
      },
      error_file: '/var/log/calor/prod-live-stream-1-error.log',
      out_file: '/var/log/calor/prod-live-stream-1-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'prod-live-stream-2',
      script: './dist/bin/live-stream',
      cwd: '/opt/calor/prod',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: '3034',
        DATABASE_URL: prodEnv.DATABASE_URL,
        SOCKET_IO_ORIGINS: prodEnv.SOCKET_IO_ORIGINS,
        REDIS_URL: prodEnv.REDIS_URL || 'redis://127.0.0.1:6379',
        REDIS_KEY_PREFIX: 'calor:prod:stream',
      },
      error_file: '/var/log/calor/prod-live-stream-2-error.log',
      out_file: '/var/log/calor/prod-live-stream-2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },

    // ==========================================
    // STAGING APPS (Isolated Staging Environment)
    // ==========================================
    {
      name: 'staging-support-chat',
      script: './dist/bin/support-chat',
      cwd: '/opt/calor/staging',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'staging',
        PORT: '3041',
        DATABASE_URL: stagingEnv.DATABASE_URL,
        SOCKET_IO_ORIGINS: stagingEnv.SOCKET_IO_ORIGINS,
        REDIS_URL: stagingEnv.REDIS_URL || 'redis://127.0.0.1:6379',
        REDIS_KEY_PREFIX: 'calor:staging:chat',
      },
      error_file: '/var/log/calor/staging-support-chat-error.log',
      out_file: '/var/log/calor/staging-support-chat-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'staging-live-stream',
      script: './dist/bin/live-stream',
      cwd: '/opt/calor/staging',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'staging',
        PORT: '3042',
        DATABASE_URL: stagingEnv.DATABASE_URL,
        SOCKET_IO_ORIGINS: stagingEnv.SOCKET_IO_ORIGINS,
        REDIS_URL: stagingEnv.REDIS_URL || 'redis://127.0.0.1:6379',
        REDIS_KEY_PREFIX: 'calor:staging:stream',
      },
      error_file: '/var/log/calor/staging-live-stream-error.log',
      out_file: '/var/log/calor/staging-live-stream-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
