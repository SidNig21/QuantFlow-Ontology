# G11 verifier-defect repair transcripts — 2026-08-29

Each block records the measured duration, exit code, SHA256 of the complete captured UTF-8 output, and the unedited output. M03 is necessarily frozen externally after the amend because a commit cannot include evidence of its own clean post-commit checkout; the external Verifier receipt named in the Builder receipt owns that literal result and candidate identity.

## Complete focused matrix

```text
M01 duration_ms=111 exit=0 sha256=AA617DBB3EFFD971FBA916586F63AC27445B38EFCC244C032E9B34925FB94B89
b1720c086bb2d93942448a3fdd352b7d58af9483
M02 duration_ms=58 exit=0 sha256=86BFFB1F4EDE988C5659FE2F324291C3A89DCE626E209FBB4F8F816AEAD41252
97b2768e3bc79d45c321336e73ec30167c6c8959
M04 duration_ms=82 exit=0 sha256=84AD1A0BFB3080C569253AEE43468BDE40752A2E428B31D3A209DC5390E3B6EE

Count             : 1421
Average           :
Sum               :
Maximum           :
Minimum           :
StandardDeviation :
Property          :
M05 duration_ms=185 exit=0 sha256=2975992CA066446A9E86C35FA25AD9A569740E759C814AB912C40B9C2F7D788D
PASS  repo-shape
M06 duration_ms=275 exit=0 sha256=58D9F4EEDF3DCEB688376201543CD1006806B2482EB925A380EFB6FEB70225C3
doc-links: PASS (82 live documents, every pointer resolves)
PASS  doc-links
M07 duration_ms=109 exit=0 sha256=A1D3EE713C9057F8813C4FA91496C25D26F37537D21DD949946E0D27A3F31336
rung-ladder: PASS (27 rungs; active=R18; complete=19)
PASS  rung-ladder
M08 duration_ms=558 exit=0 sha256=2214D26211E956F0702BA4DB5CB2D2702F470913A2276C29550293E32399287D
G12 package/process status: RED — inherited; not exercised or repaired by G11
G10 owned-run final: processes=0 roots_remaining=0 leaked=[]
golden-g11-authority: PASS
PASS  golden-g11-authority
M09 duration_ms=582 exit=0 sha256=431689B3109133D32CD91F7AFDBF0EDA9E4280E0B9C600CB47A1286E6FC636FF
AGENTS.md → START_HERE.md → NEXT.md → WO-GOLDEN-G11.md
current_authority_paths=1
false_current_claims=0
G12 package/process status: RED — inherited; not exercised or repaired by G11
G10 owned-run final: processes=0 roots_remaining=0 leaked=[]
golden-g11-authority: PASS
PASS  golden-g11-authority
M10 duration_ms=87 exit=0 sha256=FD123C886B3A193B2E4C339CBE6786E7C50A70B58EB0E27805D758A80DDD6797
warning: unable to access 'C:\Users\rybow/.config/git/ignore': Permission denied
```

## F01–F10 bait and restored output

Every GREEN block has SHA256 `2214D26211E956F0702BA4DB5CB2D2702F470913A2276C29550293E32399287D` and the exact output shown after the table.

| ID | RED duration ms | exit | RED output SHA256 | exact RED output | GREEN duration ms | exit |
|---|---:|---:|---|---|---:|---:|
| F01 | 102 | 1 | `C8FFE03993029C0E67A8504A70B46E70C183871C8DF5CD30FE4C616F14F2CE58` | `F01 multiple_current_routes` then `FAIL  golden-g11-authority` | 557 | 0 |
| F02 | 99 | 1 | `419DC16EB579135A504D5A0021FC0BA8A4C8E10431F0262E50C65A85DABC80CB` | `FAIL  golden-g11-authority` then `F02 false_current_claim` | 555 | 0 |
| F03 | 110 | 1 | `549CF46D1291D11D27AEB3DD34AD09DA79C9A4C8E2A42E80498093C4AF2A5A0A` | `F03 historical_active_noise` then `FAIL  golden-g11-authority` | 548 | 0 |
| F04 | 102 | 1 | `F96A910E7DF3BAF7FA73141476C5691D114A1FECA9CB1693F0EAF02645D39806` | `FAIL  golden-g11-authority` then `F04 immutable_hash_mismatch` | 564 | 0 |
| F05 | 569 | 1 | `E5552662B19C66A42FC5624C8206A945554E961428B1056535254A389A2C13F8` | `F05 archive_byte_mismatch` then `FAIL  golden-g11-authority` | 555 | 0 |
| F06 | 543 | 1 | `4518F10C1809E444224F36DED5B6E9891CB444BD6D95F8F20CD32FB9E11CA94E` | `F06 retained_workflow_removed` then `FAIL  golden-g11-authority` | 552 | 0 |
| F07 | 540 | 1 | `5C3A6F1889EFE65171D99AFBB4E20220889ED67DACB9F83CE1DDD60EC2B09750` | `F07 atlas_receipt_or_scope` then `FAIL  golden-g11-authority` | 549 | 0 |
| F08 | 553 | 1 | `F852D9F7DD39874D8C6BAF718870248638504E68A418C8F244B3532A160D0457` | `F08 instrument_claims_authority` then `FAIL  golden-g11-authority` | 538 | 0 |
| F09 | 543 | 1 | `9FABB6940D50DC827AB41E8A0E9E657BC8EAEFF944C78DF8AB2CDD284C59C097` | `F09 protected_path_changed` then `FAIL  golden-g11-authority` | 547 | 0 |
| F10 | 555 | 1 | `7F1D05547405D27ABFDC1A78E9F41651532EC11B1D017986B63D2EB385EF31AB` | `F10 g12_scope_or_receipt` then `FAIL  golden-g11-authority` | 545 | 0 |

Exact restored GREEN output for every selector:

```text
G12 package/process status: RED — inherited; not exercised or repaired by G11
G10 owned-run final: processes=0 roots_remaining=0 leaked=[]
golden-g11-authority: PASS
PASS  golden-g11-authority
```

Selectors mutate only in-memory verifier copies. No product, package lifecycle, process-root, shutdown, relaunch, R18, or G12 command ran.
