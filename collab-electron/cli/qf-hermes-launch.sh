#!/bin/bash
set -euo pipefail

bridge_path="${1:?QuantFlow MCP bridge path is required}"
shift

hermes_command="${1:?Hermes command is required}"
shift

if ! command -v "$hermes_command" >/dev/null 2>&1; then
  echo "QuantFlow Hermes unavailable: install Hermes in the selected Ubuntu/WSL2 distro, then retry." >&2
  exit 127
fi

case "$bridge_path" in
  *"'"*) echo "QuantFlow bridge path cannot contain an apostrophe" >&2; exit 2 ;;
esac

profile_root="${QF_HERMES_PROFILE_ROOT:-}"
if [[ -z "$profile_root" ]]; then
  echo "QuantFlow Hermes unavailable: an isolated Hermes profile root is not configured." >&2
  exit 2
fi

# One app-owned launch home per live seat. Never fall back to the WSL user's
# home: that would mutate founder Hermes state.
seat_id="${QF_AGENT_SESSION_ID//[^a-zA-Z0-9_-]/_}"
profile_home="$profile_root/profiles/quantflow-runtime-$seat_id"
mkdir -p "$profile_home"
config_tmp="$profile_home/config.yaml.tmp"

# Hermes resolves auth.json from the custom root when HERMES_HOME has the
# <root>/profiles/<seat> shape. Reference the founder token read-only through
# a symlink; never copy, rewrite, or inspect its contents.
auth_source="$HOME/.hermes/auth.json"
auth_link="$profile_root/auth.json"
if [[ -L "$auth_link" ]]; then
  :
elif [[ -e "$auth_link" ]]; then
  echo "QuantFlow Hermes unavailable: isolated auth.json path is not a symlink." >&2
  exit 2
elif [[ -e "$auth_source" ]]; then
  ln -s "$auth_source" "$auth_link"
fi

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

exec "$hermes_command" "$@"
