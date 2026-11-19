#!/usr/bin/env bash
# Posts a short "done" message to a Discord webhook. The URL comes from the
# DISCORD_WEBHOOK_URL environment variable (set in .claude/settings.local.json,
# which is gitignored), so no secret lives in the repo.
# Usage: discord-notify.sh [message]
msg="${1:-Claude Code finished its task and is waiting for you.}"
[ -z "$DISCORD_WEBHOOK_URL" ] && exit 0
code=$(curl --silent --max-time 10 --output /dev/null --write-out "%{http_code}" \
  -H "Content-Type: application/json" \
  -d "{\"content\":\"$msg\"}" \
  "$DISCORD_WEBHOOK_URL")
case "$code" in
  2*) ;;
  *) echo "discord-notify: webhook returned HTTP $code" >&2 ;;
esac
exit 0
