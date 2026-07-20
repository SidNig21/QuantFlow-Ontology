/**
 * Electron-side re-export of the shared host ACP client (WO-008c D2 / WO-008a).
 * Implementation lives in species/hermes/host-acp-client.ts — smokes import
 * that module directly; do not duplicate deny/spawn/handshake here.
 */
export {
  admitHostAcp,
  cancelHostAcp,
  denyPermissionResponse,
  extractToolKey,
  gateToolPermission,
  isToolAllowed,
  permissionResponseForDecision,
  promptHostAcp,
  resolveHostAcpCommand,
  tearDownHostAcp,
  type HostAcpAdmitOpts,
  type HostAcpHandle,
  type HostAcpHooks,
  type PermissionDecision,
} from "../../../species/hermes/host-acp-client.ts";
