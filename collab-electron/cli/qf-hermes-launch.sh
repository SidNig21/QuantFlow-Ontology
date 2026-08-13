#!/bin/bash
set -euo pipefail

bridge_path="${1:?QuantFlow MCP bridge path is required}"
shift

ontology_bridge_path="${1:?QuantFlow ontology MCP bridge path is required}"
shift

hermes_command="${1:?Hermes command is required}"
shift

# Product seats need QuantFlow, not Hermes's broad workstation catalog. The
# invocation-level allowlist keeps the native TUI while exposing only the two
# app-owned MCP surfaces configured below.
quantflow_toolsets="mcp-quantflow-collaboration,mcp-quantflow-ontology"

mission_oneshot=0
if [[ "${1:-}" == "--quantflow-mission-oneshot" ]]; then
  mission_oneshot=1
  shift
fi

task_oneshot=0
if [[ "${1:-}" == "--quantflow-task-oneshot" ]]; then
  task_oneshot=1
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
# These product seats use explicit QuantFlow MCP workflows. Do not seed the
# unrelated bundled skill catalog into their disposable prompt context.
: > "$profile_home/.no-bundled-skills"
empty_bundled_skills="$profile_home/.quantflow-empty-bundled-skills"
mkdir -p "$empty_bundled_skills"
export HERMES_BUNDLED_SKILLS="$empty_bundled_skills"
config_tmp="$profile_home/config.yaml.tmp"
reasoning_effort="none"
if [[ "${QF_PEER_ROLE:-}" == "critic" ]]; then
  reasoning_effort="low"
fi

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
agent:
  reasoning_effort: $reasoning_effort
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
  export HERMES_EPHEMERAL_SYSTEM_PROMPT="You are the QuantFlow research orchestrator. Treat QUANTFLOW_MISSION as an immediate workflow command. Use only the QuantFlow ontology and collaboration MCP tools; never use Terminal, browser, file, or code-execution tools. Do not broadly explore workspaces, tasks, sessions, or tool catalogs. Query the hermes-worker agent definition, create one worker session, start that exact session, then call the collaboration send_task tool with the founder mission. Do not retry a start call that is still pending. After delegation, wait for the worker's QuantFlow result and return a concise research-only answer with its durable receipt. Never place bets or trades."
  exec "$hermes_command" --toolsets "$quantflow_toolsets" "$@"
fi

if [[ "$task_oneshot" == "1" ]]; then
  if [[ "${QF_PEER_ROLE:-}" == "critic" ]]; then
    export HERMES_EPHEMERAL_SYSTEM_PROMPT="You are the independent QuantFlow research critic. Use only QuantFlow ontology MCP tools; never use Terminal, browser, file, or code-execution tools. Read the exact completed Run, result Artifact, metrics, and Hypothesis named in the QuantFlow activation, then call qf_record_evaluation exactly once with those exact ids, numeric confidence, a non-empty rationale, non-empty plain-text findings, and a supports, rejects, or inconclusive verdict. Do not explore unrelated ontology objects. Never place bets or trades."
    exec "$hermes_command" --toolsets "$quantflow_toolsets" "$@"
  fi

  export HERMES_EPHEMERAL_SYSTEM_PROMPT="You are the QuantFlow research worker. Use only QuantFlow ontology and collaboration MCP tools; never use Terminal, browser, file, or code-execution tools. When the delegated QuantFlow task arrives, immediately perform one relevant market.read ontology query, then call collaboration send_result exactly once. Cite only market ids actually returned by that read. If the read is empty, send a truthful no-evidence result with empty cited_market_ids and the actual empty read trajectory artifact id. Do not explore unrelated ontology objects. Never place bets or trades."
  exec "$hermes_command" --toolsets "$quantflow_toolsets" "$@"
fi

exec "$hermes_command" --toolsets "$quantflow_toolsets" "$@"
