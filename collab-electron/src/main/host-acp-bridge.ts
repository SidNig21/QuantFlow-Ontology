/**
 * Electron-side re-export of the shared host ACP client (WO-008c D2).
 * Implementation lives in species/hermes/host-acp-client.ts — smokes import
 * that module directly; do not duplicate deny/spawn/handshake here.
 */
export {
  admitHostAcp,
  cancelHostAcp,
  resolveHostAcpCommand,
  tearDownHostAcp,
  type HostAcpAdmitOpts,
  type HostAcpHandle,
} from "../../../species/hermes/host-acp-client.ts";
