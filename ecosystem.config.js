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
const path = require('path')

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const content = fs.readFileSync(filePath, 'utf8')
  const env = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim()
      let val = trimmed.slice(idx + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      env[key] = val
    }
  }
  return env
}

function findQueryEngine(dir) {
  const candidates = [
    path.join(dir, 'dist/bin'),
    path.join(dir, 'node_modules/.prisma/client'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      const files = fs.readdirSync(c)
      const engine = files.find((f) => f.startsWith('libquery_engine') && f.endsWith('.node'))
      if (engine) return path.join(c, engine)
    }
  }
  return undefined
}

const prodEnv = loadEnv('/opt/calor/prod/.env')
const stagingEnv = loadEnv('/opt/calor/staging/.env')

const prodEngine = findQueryEngine('/opt/calor/prod')
const stagingEngine = findQueryEngine('/opt/calor/staging')

module.exports = {
  apps: [
    // ==========================================
    // PRODUCTION APPS (Clustered across cores)
    // ==========================================
    {
      name: 'prod-support-chat-1',
      namespace: 'production',
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
        REALTIME_TOKEN_SECRET: prodEnv.REALTIME_TOKEN_SECRET,
        PRISMA_QUERY_ENGINE_LIBRARY: prodEngine,
      },
      error_file: '/var/log/calor/prod-support-chat-1-error.log',
      out_file: '/var/log/calor/prod-support-chat-1-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'prod-support-chat-2',
      namespace: 'production',
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
        REALTIME_TOKEN_SECRET: prodEnv.REALTIME_TOKEN_SECRET,
        PRISMA_QUERY_ENGINE_LIBRARY: prodEngine,
      },
      error_file: '/var/log/calor/prod-support-chat-2-error.log',
      out_file: '/var/log/calor/prod-support-chat-2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'prod-live-stream-1',
      namespace: 'production',
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
        REALTIME_TOKEN_SECRET: prodEnv.REALTIME_TOKEN_SECRET,
        PRISMA_QUERY_ENGINE_LIBRARY: prodEngine,
      },
      error_file: '/var/log/calor/prod-live-stream-1-error.log',
      out_file: '/var/log/calor/prod-live-stream-1-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'prod-live-stream-2',
      namespace: 'production',
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
        REALTIME_TOKEN_SECRET: prodEnv.REALTIME_TOKEN_SECRET,
        PRISMA_QUERY_ENGINE_LIBRARY: prodEngine,
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
      namespace: 'staging',
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
        REALTIME_TOKEN_SECRET: stagingEnv.REALTIME_TOKEN_SECRET,
        PRISMA_QUERY_ENGINE_LIBRARY: stagingEngine,
      },
      error_file: '/var/log/calor/staging-support-chat-error.log',
      out_file: '/var/log/calor/staging-support-chat-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'staging-live-stream',
      namespace: 'staging',
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
        REALTIME_TOKEN_SECRET: stagingEnv.REALTIME_TOKEN_SECRET,
        PRISMA_QUERY_ENGINE_LIBRARY: stagingEngine,
      },
      error_file: '/var/log/calor/staging-live-stream-error.log',
      out_file: '/var/log/calor/staging-live-stream-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
