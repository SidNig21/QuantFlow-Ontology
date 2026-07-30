/**
 * Live peer-role ownership for native-TUI delivery.
 *
 * This is process-local projection state: the Kernel owns profile/session truth,
 * while this registry only answers which currently-live PTY may receive a push.
 */
export class PeerRoleRegistry {
  readonly #ptyByRole = new Map<string, string>();

  assertAvailable(role: string): void {
    const normalized = role.trim();
    if (!normalized) {
      throw new Error("peer-delivery: peer role must be non-empty");
    }
    const existing = this.#ptyByRole.get(normalized);
    if (existing) {
      throw new Error(
        `peer-delivery: role ${normalized} already bound to live pty=${existing}`,
      );
    }
  }

  register(role: string, ptySessionId: string): void {
    const normalized = role.trim();
    if (!normalized || !ptySessionId) {
      throw new Error("peer-delivery: role and PTY session id must be non-empty");
    }
    const existing = this.#ptyByRole.get(normalized);
    if (existing && existing !== ptySessionId) {
      throw new Error(
        `peer-delivery: role ${normalized} already bound to live pty=${existing}`,
      );
    }
    this.#ptyByRole.set(normalized, ptySessionId);
  }

  unregister(role: string, ptySessionId: string): boolean {
    const normalized = role.trim();
    if (this.#ptyByRole.get(normalized) !== ptySessionId) return false;
    this.#ptyByRole.delete(normalized);
    return true;
  }

  unregisterPty(ptySessionId: string): void {
    for (const [role, id] of this.#ptyByRole) {
      if (id === ptySessionId) this.unregister(role, ptySessionId);
    }
  }

  get(role: string): string | undefined {
    return this.#ptyByRole.get(role.trim());
  }
}
