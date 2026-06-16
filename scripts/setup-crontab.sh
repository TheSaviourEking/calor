#!/bin/bash
# CALŌR — VPS Cron Job Setup Script
# Run this once on the Hetzner VPS to install all cron jobs.
#
# Prerequisites:
#   - /opt/calor/.env must contain APP_URL and CRON_SECRET
#   - curl must be installed (apt install -y curl)
#
# Usage:
#   bash /opt/calor/scripts/setup-crontab.sh
#
# To view installed crons:   crontab -l
# To remove all crons:       crontab -r

set -e

ENV_FILE="/opt/calor/.env"
LOG_FILE="/var/log/calor/cron.log"

# Load .env
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found."
  echo "Create it first with APP_URL and CRON_SECRET:"
  echo "  APP_URL=https://yourdomain.com"
  echo "  CRON_SECRET=your_cron_secret_here"
  exit 1
fi

# Source the .env file
export $(grep -v '^#' "$ENV_FILE" | grep -E 'APP_URL|CRON_SECRET' | xargs)

if [ -z "$APP_URL" ]; then
  echo "ERROR: APP_URL not set in $ENV_FILE"
  exit 1
fi

if [ -z "$CRON_SECRET" ]; then
  echo "ERROR: CRON_SECRET not set in $ENV_FILE"
  exit 1
fi

# Ensure log directory exists
mkdir -p /var/log/calor

echo "==> Installing cron jobs for $APP_URL ..."

# Build crontab contents
CRON_JOBS="# CALŌR cron jobs — installed by setup-crontab.sh
# Triggers Vercel API endpoints from Hetzner VPS.
# Logs to $LOG_FILE
# To reinstall: bash /opt/calor/scripts/setup-crontab.sh

# Abandoned cart recovery — every 6 hours
0 */6 * * * curl -s -X POST $APP_URL/api/cron/abandoned-cart -H \"Authorization: Bearer $CRON_SECRET\" >> $LOG_FILE 2>&1

# Price drop alerts — daily at 9am
0 9 * * * curl -s -X POST $APP_URL/api/cron/price-alerts -H \"Authorization: Bearer $CRON_SECRET\" >> $LOG_FILE 2>&1

# Stock back-in-stock alerts — every 4 hours
0 */4 * * * curl -s -X POST $APP_URL/api/cron/stock-alerts -H \"Authorization: Bearer $CRON_SECRET\" >> $LOG_FILE 2>&1

# Scheduled gift card delivery — daily at midnight
0 0 * * * curl -s -X POST $APP_URL/api/cron/gift-cards -H \"Authorization: Bearer $CRON_SECRET\" >> $LOG_FILE 2>&1

# Log rotation — weekly on Sunday at 3am (keep log under control)
0 3 * * 0 truncate -s 0 $LOG_FILE
"

# Install crontab (preserves any existing non-CALŌR cron jobs)
# First, get existing crontab minus any previous CALŌR entries
EXISTING=$(crontab -l 2>/dev/null | grep -v 'CALŌR\|calor\|/api/cron/' || true)

# Write new crontab
echo "$EXISTING
$CRON_JOBS" | crontab -

echo "==> Cron jobs installed successfully!"
echo ""
echo "Installed schedule:"
crontab -l | grep -A1 'CALŌR\|/api/cron'
echo ""
echo "Logs will be written to: $LOG_FILE"
echo "View logs: tail -f $LOG_FILE"
