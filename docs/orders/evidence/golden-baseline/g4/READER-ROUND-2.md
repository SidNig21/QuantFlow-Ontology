# G4 semantic Reader — Round 2

- Task: `01a03f1a-b4d5-7b82-a58a-0e90965d8873`
- Candidate SHA: `03d97a89dc0d127a575c988f1c12cf25793194f0`
- Verdict: `NO/NO`
- Mutation: none

The focused Reader found two remaining defects:

1. the exact matrix named `runtime-kernel-admission`, which is a source module rather than a registered `qa/run.ts` selector; and
2. `qa/gates/windows-cold-boot.ts` still required qf-toolloop even though G4 removes that identity, while the order had assigned the broader gate to G12 without owning this exact fixture correction.

The Round 2 amendment removes only the nonexistent invocation, binds generic admission proof to `dock-definition-launch`'s direct execution of `completeRuntimeKernelAdmission`, and assigns only the stale required-ID retarget to G4. Full Windows cold-boot execution and operations remain G12-owned. No product behavior or acceptance criterion changed.
