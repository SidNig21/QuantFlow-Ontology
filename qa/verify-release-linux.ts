/**
 * Compatibility-only Linux release verifier.
 *
 * This preserves the former Linux package route for secondary diagnostics. It
 * is not a Windows acceptance proof and is not invoked by CI.
 */
import {
  LINUX_RELEASE_STAGES,
  runReleaseVerification,
} from "./verify-release.ts";

if (import.meta.main) {
  process.exit(await runReleaseVerification(LINUX_RELEASE_STAGES));
}
