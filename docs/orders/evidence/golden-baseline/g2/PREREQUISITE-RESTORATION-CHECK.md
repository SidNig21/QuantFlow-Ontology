# G2 restoration check after accepted minimum G9 prerequisite

Date: 2026-08-25

## Frozen inputs

- accepted prerequisite branch closure: `45c395f`
- accepted prerequisite product/proof candidate: `4a12b948746c108bae3143d5982decd50a6957e9`
- paused G2 stash: `4e4dac24187f54a7187e5e61ab0459acbe7cd3ed`
- paused G2 patch parent: `615b347d6a8f9c7a5a1beca1f36ca87bcddc266a`
- patch: `C:\tmp\qf-g2-preserve-615b347\g2-paused.patch`
- patch SHA-256: `5BFE74B5664C9C0C098DB0DA0224E3E05AE5F612754490C5DB1486BC106AD3BF`
- path manifest SHA-256: `55757E1F568EBAC4A17907A9233152D341EC17162D738C31627D181338FEA0BC`

## Non-mutating result

Command:

```text
git apply --check --binary -- C:\tmp\qf-g2-preserve-615b347\g2-paused.patch
```

Exit: `1`.

The check rejected exactly five paths:

```text
qa/gates/artifact-root.ts
qa/gates/artifact-root/run.ts
qf-atlas/ATLAS.md
qf-atlas/atlas.html
qf-atlas/atlas.json
```

The accepted prerequisite intentionally changed the same artifact-root proof and
regenerated the same Atlas projections. The patch was not applied. The stash
was not applied, popped, dropped, or modified. The worktree remained clean.

Manual merging is not authorized by the prerequisite order. A fresh semantic
Reader task `01a0380f-defb-76a0-a367-1e9564847225` owns the bounded overlap
adjudication before any Builder resumes G2.
