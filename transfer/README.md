# Temporary Obsidian vault transfer

This folder is a **one-shot copy** of the Linux `Personal` Obsidian vault so it can be opened on Windows. It is not QuantFlow product code. Delete this folder (and this branch) after the vault is copied off the machine.

## On Windows

1. Clone or pull `SidNig21/QuantFlow-Ontology`, then check out branch `temp/obsidian-personal-vault-transfer`.
2. Copy `transfer/obsidian-personal-vault/` somewhere permanent (for example `Documents\Obsidian\Personal`).
3. In Obsidian: **Open folder as vault** and select that copied folder — not the repo root. Obsidian treats a vault as one folder; nested vaults break internal links.
4. After the copy works, delete `transfer/` from this repo and drop the branch.

The `.obsidian` folder is included (settings, plugins, workspace). Global Obsidian settings live outside the vault (`%APPDATA%\Obsidian\` on Windows) and are not in this snapshot.

Copied from `/home/sidnig21/Vaults/Personal` on 2026-08-12.
