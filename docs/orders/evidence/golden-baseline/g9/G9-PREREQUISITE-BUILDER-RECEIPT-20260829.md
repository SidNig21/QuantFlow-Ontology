# G9 prerequisite Builder receipt — 2026-08-29

This receipt freezes the narrow G9 report-publication finalization prerequisite for one fresh independent Verifier; it is not the independent verification decision.

## Authority and scope

- Authority HEAD at start and before candidate freeze: `7b8dce55515e02e64135a13fb8077356e3f96d3d`.
- The only G9 product change is the existing Kernel publication-finalization repair in `packages/qf-kernel/src/governed-review.ts`: a supported closure promotes its own non-current publication only when the exact authority partition has no current row; a valid historical row is not revived when a successor is current.
- The only G9 gate change is the existing first-transition proof in `qa/gates/report-authority.ts` (F15), with the existing F05 first-current assertion retained.
- No G10 file was staged or changed by this freeze. No G10 packaged gate, G10 matrix, or G11 work was run.

## Focused proof receipts

Commands already completed before this freeze:

```text
bun test packages/qf-kernel/src/g9-report-authority.test.ts
7 pass
0 fail
38 expect() calls

bun test collab-electron/src/main/research-world.test.ts
4 pass
0 fail
79 expect() calls

bun test collab-electron/src/main/ontology-gateway.test.ts
6 pass
0 fail
102 expect() calls

bun test collab-electron/src/main/dock-profiles.test.ts
11 pass
0 fail
28 expect() calls
```

The exact first/second authority falsifiers from the registered G9 run were:

```text
F15 first-publication-transition RED exit=1 first publication current transition was removed
F15 first-publication-transition GREEN exit=0 restored runtime invariant passed
F06 supersession-loss RED exit=1 prior publication is not explicit history
F06 supersession-loss GREEN exit=0 restored runtime invariant passed
```

These preserve the required first supported current row and explicit second same-context predecessor/successor history, with one current row and durable reports.

## F10 boundary disposition

- Unchanged F10 source hash: `qa/gates/hermes-research.ts` = `0C7AD489E94EA94A1CE5D3752A6D8E9891819DAE17BE868679D353CFDE8FA0D8`.
- Original sandbox receipt: `G9-PUBLICATION-FINALIZATION-DIRECT-20260829.txt`, SHA-256 `2CE244E41A40D17802E9658C41528A2CC5B4A19836628A212ED8F7A0AAE18222`.
- Native-access receipt: `G9-PUBLICATION-FINALIZATION-ELEVATED-20260829.txt`, SHA-256 `CEA5BD371BACFFB4F638FBC4AF9905BAB33F34015A8EFE95566FF5487FA06BE0`.
- Native access removed the sandbox-only Electron build `Access is denied` red. F10 then reached the real packaged RPC and proved the intentional stale-profile red (`unknown agent_definition_id: hermes-orchestrator`) and restoration to `hermes-research-director`.
- The registered command remained red only at the inherited packaged shutdown boundary: `hermes-f10: FAIL application did not exit within 20000ms`. The accepted G9 matrix records the same real packaged-process survivor and assigns this red to G12; no shutdown or acceptance repair was made.

## Cleanup and untouched external state

- Registered receipt: `report-authority: cleanup pid=29484 exit=0 roots_remaining=0 paths=[]`.
- The current F10 temporary root was removed by the gate. Two pre-existing historical roots were not touched: `C:\Users\rybow\AppData\Local\Temp\qf-hermes-f10-9jJDjB` and `C:\Users\rybow\AppData\Local\Temp\qf-hermes-f10-Bnq9U7`.
- Unrelated long-lived repo Electron PID `11348` was not touched: executable `C:\Users\rybow\QuantFlow-Ontology\collab-electron\node_modules\.bun\electron@40.6.0+759ce506b1ed1a42\node_modules\electron\dist\electron.exe`, started `2026-08-29 05:17:52`; ownership was not established.

## Independent verification boundary

The Builder is freezing this narrow prerequisite for one fresh independent Verifier. No G10 continuation is authorized by this receipt until that Verifier accepts the G9 prerequisite.
