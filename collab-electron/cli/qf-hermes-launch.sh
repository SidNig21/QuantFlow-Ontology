#!/bin/bash
set -euo pipefail

bridge_path="${1:?QuantFlow MCP bridge path is required}"
shift

case "$bridge_path" in
  *"'"*) echo "QuantFlow bridge path cannot contain an apostrophe" >&2; exit 2 ;;
esac

# One app-owned launch home per live seat. It shares the founder's root OAuth
# store through Hermes' normal profile resolution, but never reads or rewrites
# the founder's global MCP catalog.
seat_id="${QF_AGENT_SESSION_ID//[^a-zA-Z0-9_-]/_}"
profile_home="$HOME/.hermes/profiles/quantflow-runtime-$seat_id"
mkdir -p "$profile_home"
config_tmp="$profile_home/config.yaml.tmp"

: > "$config_tmp"
if [[ -f "$HOME/.hermes/config.yaml" ]]; then
  awk '
    /^model:[[:space:]]*$/ { in_model=1 }
    in_model && /^[^[:space:]#]/ && !/^model:/ { exit }
    in_model { print }
  ' "$HOME/.hermes/config.yaml" >> "$config_tmp"
fi
cat >> "$config_tmp" <<EOF
mcp_servers:
  quantflow-collaboration:
    command: node.exe
    args:
      - '$bridge_path'
    enabled: true
EOF
mv "$config_tmp" "$profile_home/config.yaml"
export HERMES_HOME="$profile_home"

exec "$@"
