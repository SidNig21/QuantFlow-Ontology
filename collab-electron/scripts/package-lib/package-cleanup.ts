import { rmSync } from "node:fs";

export type PackageVerificationOutputs = {
  packageRoot: string;
  stagingRoot: string;
  verifyDir: string;
};

/** Remove only the outputs owned by one package-verification run. */
export function cleanPackageVerificationOutputs({
  packageRoot,
  stagingRoot,
  verifyDir,
}: PackageVerificationOutputs): void {
  rmSync(packageRoot, { recursive: true, force: true });
  rmSync(stagingRoot, { recursive: true, force: true });
  rmSync(verifyDir, { recursive: true, force: true });
}
