#!/bin/bash
set -euo pipefail

bridge_path="${1:?QuantFlow collaboration MCP path is required}"
ontology_path="${2:?QuantFlow ontology MCP path is required}"
codex_command="${3:?Codex command is required}"
shift 3

if ! command -v "$codex_command" >/dev/null 2>&1; then
  echo "QuantFlow Codex unavailable: install Codex in the selected Ubuntu/WSL2 distro, then retry." >&2
  exit 127
fi
if [[ -z "${QF_AGENT_SESSION_ID:-}" || -z "${QF_LAUNCH_READY_NONCE:-}" ]]; then
  echo "QuantFlow Codex unavailable: governed session or readiness identity is missing." >&2
  exit 2
fi

if [[ "$bridge_path" == /mnt/* ]]; then bridge_path="$(wslpath -w "$bridge_path")"; fi
if [[ "$ontology_path" == /mnt/* ]]; then ontology_path="$(wslpath -w "$ontology_path")"; fi
case "$bridge_path$ontology_path" in
  *"'"*) echo "QuantFlow Codex bridge path cannot contain an apostrophe." >&2; exit 2 ;;
esac

# Codex merges CLI table overrides with the operator's config. Define QuantFlow's
# required servers, then disable the ambient servers observed in the supported
# Codex installation without reading or changing the operator's config.
mcp_config="mcp_servers={quantflow-collaboration={command='node.exe',args=['$bridge_path'],required=true},quantflow-ontology={command='node.exe',args=['$ontology_path'],required=true}}"

printf '\nQF_LAUNCH_READY %s\n\nQF_LAUNCH_COMMIT %s\n' \
  "$QF_LAUNCH_READY_NONCE" "$QF_LAUNCH_READY_NONCE"
unset QF_LAUNCH_READY_NONCE

exec "$codex_command" \
  --ask-for-approval never \
  --sandbox read-only \
  -c "$mcp_config" \
  -c "mcp_servers.node_repl.enabled=false" \
  -c "mcp_servers.codex_apps.enabled=false" \
  -c "features.shell_tool=false" \
  -c "web_search='disabled'" \
  -c "apps._default.enabled=false" \
  -c "features.plugins=false" \
  -c "features.browser_use=false" \
  -c "features.browser_use_external=false" \
  -c "features.browser_use_full_cdp_access=false" \
  -c "features.in_app_browser=false" \
  -c "features.computer_use=false" \
  -c "features.image_generation=false" \
  -c "features.multi_agent=false" \
  -c "features.hooks=false" \
  -c "features.workspace_dependencies=false" \
  -c "features.tool_suggest=false" \
  -c "history.persistence='none'" \
  -c "memories.use_memories=false" \
  -c "memories.generate_memories=false" \
  "$@"
