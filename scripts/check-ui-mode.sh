#!/usr/bin/env bash
# Quick diagnostic: did the most recent listCustomers call return ui:// or text-only?
LOG="$HOME/Library/Logs/Claude/mcp-server-zenskar-local.log"
if [ ! -f "$LOG" ]; then
  echo "log not found: $LOG"
  exit 1
fi
echo "=== last 100 lines of mcp-server-zenskar-local.log ==="
tail -100 "$LOG"
echo
echo "=== ui-wrap markers (most recent first) ==="
grep -n '\[ui-wrap\]' "$LOG" | tail -20 || echo "(no [ui-wrap] markers — debug flag not picked up yet)"
echo
echo "=== ZENSKAR_MCP_UI_ENABLED in process env? (look for it in startup) ==="
grep -E "ZENSKAR_MCP_UI_(ENABLED|DEBUG)" "$LOG" | head -5 || echo "(not logged — that's normal; check the [ui-wrap] markers above)"
