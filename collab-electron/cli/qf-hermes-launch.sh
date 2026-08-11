#!/bin/bash
set -euo pipefail

bridge_path="${1:?QuantFlow MCP bridge path is required}"
shift

ontology_bridge_path="${1:?QuantFlow ontology MCP bridge path is required}"
shift

hermes_command="${1:?Hermes command is required}"
shift

mission_oneshot=0
if [[ "${1:-}" == "--quantflow-mission-oneshot" ]]; then
  mission_oneshot=1
  shift
fi

if ! command -v "$hermes_command" >/dev/null 2>&1; then
  echo "QuantFlow Hermes unavailable: install Hermes in the selected Ubuntu/WSL2 distro, then retry." >&2
  exit 127
fi

case "$bridge_path" in
  *"'"*) echo "QuantFlow bridge path cannot contain an apostrophe" >&2; exit 2 ;;
esac
case "$ontology_bridge_path" in
  *"'"*) echo "QuantFlow ontology bridge path cannot contain an apostrophe" >&2; exit 2 ;;
esac

profile_root="${QF_QUANTFLOW_HERMES_PROFILE_ROOT:-}"
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
  quantflow-ontology:
    command: node.exe
    args:
      - '$ontology_bridge_path'
    enabled: true
EOF
mv "$config_tmp" "$profile_home/config.yaml"
export HERMES_HOME="$profile_home"

if [[ -z "${QF_LAUNCH_READY_NONCE:-}" ]]; then
  echo "QuantFlow launcher readiness nonce is missing." >&2
  exit 2
fi
printf '\nQF_LAUNCH_READY %s\n\nQF_LAUNCH_COMMIT %s\n' \
  "$QF_LAUNCH_READY_NONCE" "$QF_LAUNCH_READY_NONCE"
unset QF_LAUNCH_READY_NONCE

if [[ "$mission_oneshot" == "1" ]]; then
  if ! IFS= read -r activation; then
    echo "QuantFlow Hermes mission was not delivered." >&2
    exit 2
  fi
  activation="${activation%$'\r'}"
  if [[ "$activation" != QUANTFLOW_MISSION\ * ]]; then
    echo "QuantFlow Hermes received an invalid mission envelope." >&2
    exit 2
  fi
  if (( ${#activation} > 6144 )); then
    echo "QuantFlow Hermes mission exceeds the supported size." >&2
    exit 2
  fi

  exec "$hermes_command" -z \
    "You are the QuantFlow research orchestrator. Use the available QuantFlow ontology and collaboration tools to inspect Kernel-held evidence before answering. Delegate to a worker when useful. Return a concise research-only answer and never place bets or trades. Founder mission: $activation"
fi

exec "$hermes_command" "$@"
