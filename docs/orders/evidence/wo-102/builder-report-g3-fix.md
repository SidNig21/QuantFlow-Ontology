Updated `qf-kernel-schema/src/define.test.ts` in the existing G3 fixture test to make “zero new object types” falsifiable.

- Added `import { schema } from "./schema.ts";`
- Added `fixtureObjectTypeNames` for the fixture’s used object types (`venue`, `market_event`, `instrument`, `quote`, `ticket`)
- Added:
  - `expect(schemaObjectTypeNames).toHaveLength(23);`
  - `expect(schemaObjectTypeNames).toEqual(expect.arrayContaining(fixtureObjectTypeNames));`

Why this form:
- The exact count assertion is the falsifiable guard against introducing any new object type.
- The `arrayContaining` subset assertion proves every object type used by the fixture is already declared in `schema.objects`.

```396:650:qf-kernel-schema/src/define.test.ts
test("real-slip representability fixture builds a single and a five-leg parlay with a void leg", () => {
  const fixtureObjectTypeNames = [
    venue.name,
    market_event.name,
    instrument.name,
    quote.name,
    ticket.name,
  ];
  const schemaObjectTypeNames = schema.objects.map((objectType) => objectType.name);

  // ... existing fixture rows/parsing ...

  expect(schemaObjectTypeNames).toHaveLength(23);
  expect(schemaObjectTypeNames).toEqual(expect.arrayContaining(fixtureObjectTypeNames));
});
```

### G3 falsification transcripts (full, unedited)

**RED transcript** (after temporarily adding throwaway type `throwaway_object_type_for_g3_falsification` to `schema.objects` in `qf-kernel-schema/src/schema.ts`):

```text
$ bun test src/define.test.ts --test-name-pattern "real-slip representability fixture builds a single and a five-leg parlay with a void leg"
bun test v1.3.14 (0d9b296a)

qf-kernel-schema/src/define.test.ts:
644 |     expect(parlayTicket.kind).toBe("parlay");
645 |     expect(parlayTicket.grade).toBe("loss");
646 |     expect(
647 |       parlayTicket.legs.map((leg) => (leg as Record<string, unknown>).outcome),
648 |     ).toEqual(["won", "lost", "won", "won", "void"]);
649 |     expect(schemaObjectTypeNames).toHaveLength(23);
                                        ^
error: expect(received).toHaveLength(expected)

Expected length: 23
Received length: 24

      at <anonymous> (/home/sidnig21/qf-worktrees/wo-102/qf-kernel-schema/src/define.test.ts:649:35)
(fail) schema lint > real-slip representability fixture builds a single and a five-leg parlay with a void leg [5.96ms]

 0 pass
 18 filtered out
 1 fail
 9 expect() calls
Ran 1 test across 1 file. [74.00ms]
```

**GREEN transcript** (after removing the throwaway type):

```text
$ cd qf-kernel-schema && bun test src/define.test.ts --test-name-pattern "real-slip representability fixture builds a single and a five-leg parlay with a void leg"
bun test v1.3.14 (0d9b296a)

 1 pass
 18 filtered out
 0 fail
 10 expect() calls
Ran 1 test across 1 file. [53.00ms]
```

### Verify command and final suite count

Command run exactly as requested:

```text
$ cd qf-kernel-schema && bun test
bun test v1.3.14 (0d9b296a)

 147 pass
 0 fail
 394 expect() calls
Ran 147 tests across 3 files. [84.00ms]
```

Final suite count: **147 pass, 0 fail**.
