# G2 preservation integration — immutable recovery/loss receipt

Created before any restore or source mutation: 2026-08-26T01:49:26.6185823Z

## Binding

| field | value |
|---|---|
| branch | wo-golden-g2 |
| clean authority/build base | d1d549af1b4ceb9c163673a6300b188d1bfc07a2 |
| origin/wo-golden-g2 | d1d549af1b4ceb9c163673a6300b188d1bfc07a2 |
| protected main | 5882ab2febf00f2c15a94c868c191420ed561bb4 |
| protected origin/main | 5882ab2febf00f2c15a94c868c191420ed561bb4 |
| retained stash | 4e4dac24187f54a7187e5e61ab0459acbe7cd3ed |
| patch parent | 615b347d6a8f9c7a5a1beca1f36ca87bcddc266a |
| untracked parent | c5186873abd4d83f9ca035c336698464840eff5e |
| recovery root | C:\tmp\qf-g2-untracked-recovery |
| patch | C:\tmp\qf-g2-preserve-615b347\g2-paused.patch |
| patch SHA-256 | 5BFE74B5664C9C0C098DB0DA0224E3E05AE5F612754490C5DB1486BC106AD3BF |
| frozen path manifest SHA-256 | 55757E1F568EBAC4A17907A9233152D341EC17162D738C31627D181338FEA0BC |
| recovery.tsv SHA-256 | 96D8482729F749D0E647086A7CDF6A9474F2146E723DEADDEDA83DE6B29A755C |
| recovery-final.tsv SHA-256 | 91A46D62699A301881842443EAC3FE2E54D46D215028D946422B599FAA3A8D4A |
| untracked archive SHA-256 | A61801F0A00B8C7C55D42C56529BBA9C8D3C16DE4B0A3DE73D247AAAD3A0D758 |
| frozen stash.txt SHA-256 | F1638644A353F575345A853859D4D03CB906376C812B468335F7D4AB9EEF9763 |
| frozen receipt.json SHA-256 | A9BFE1AB60C718959E7D95E7AEB25ABE822EDAC90D2F4B8F78199CE245DFDDD4 |

Starting status was clean. The stash remains retained and is not applied, popped, dropped, or rewritten.

## Frozen recovery/loss rows

The recovery-final manifest has exactly 13 recoverable evidence paths and exactly 12 stale command logs. Recoverable rows are restored from the recovery root with the recorded final hash. Lost rows are regenerated at their named paths by the current matrix; their historical bytes are never claimed restored.

| path | disposition | mode | frozen expected SHA-256 |
|---|---|---|---|
| docs/orders/evidence/golden-baseline/g2/ATLAS-RETIRED-DECISIONS.md | RECOVERABLE — restore exact final bytes | crlf-to-lf | 9ED2D4C7C96B795FC9B8CC6DE9733938C3077EE3E20531543E2E7D162F89493F |
| docs/orders/evidence/golden-baseline/g2/BEFORE.md | RECOVERABLE — restore exact final bytes | crlf-to-lf | 840211C73E32EC06466A9725F5E291B9CEAEDC782FC6D8566F1FE5949A0A103A |
| docs/orders/evidence/golden-baseline/g2/logs/01-shared-paths-test.txt | RECOVERABLE — restore exact final bytes | already-exact | FD78333EC31F27E1DB10C78B9C58094029338576E700443C81746BD0E8E3C599 |
| docs/orders/evidence/golden-baseline/g2/logs/02-research-director-front-door-cleanup-receipt.txt | RECOVERABLE — restore exact final bytes | already-exact | 597B6A0F1D7608A274869C09117B571F84DD790D256870BC02763E0F113CFA67 |
| docs/orders/evidence/golden-baseline/g2/logs/02-research-director-front-door-mechanical.txt | RECOVERABLE — restore exact final bytes | already-exact | 898DE01B676AF360A2F95E8AD7342D30A66DE1BEB4A60DDAF4D7FE5721AC39A9 |
| docs/orders/evidence/golden-baseline/g2/logs/02-research-director-front-door-mission-tile.txt | RECOVERABLE — restore exact final bytes | already-exact | 41A7576FACB3301BF93D1AF294344B9F128C231AF6243AF6A75B36CB90C1B660 |
| docs/orders/evidence/golden-baseline/g2/logs/02-research-director-front-door-rewrite-2.txt | RECOVERABLE — restore exact final bytes | already-exact | 4632D76EBE5E1A32724B683D93B8AD8F11CC3B8F576E4E51304A9E1292DC67C7 |
| docs/orders/evidence/golden-baseline/g2/logs/02-research-director-front-door-session-link-receipt.txt | RECOVERABLE — restore exact final bytes | already-exact | F9664C1FC30F1951E7B958C560629E0DB8CA674EA7AAE1E2CACDA69CFEED86F0 |
| docs/orders/evidence/golden-baseline/g2/logs/02-research-director-front-door-session-rows.txt | RECOVERABLE — restore exact final bytes | already-exact | F4E691D6DEE707037357085C2121E187DACA2C99166232C798456C25D666E2DA |
| docs/orders/evidence/golden-baseline/g2/logs/02-research-director-front-door.txt | RECOVERABLE — restore exact final bytes | already-exact | 7E6970105EAC94B0E87CEC5019831739F4A6139D9B2EBC5164FE2A4BE5DD882A |
| docs/orders/evidence/golden-baseline/g2/logs/21-matrix-01-shared-paths.txt | LOST / UNRECOVERED / SUPERSEDED — regenerate current receipt | unrecovered | 1CED7AA0AE7ADA5D770CC70BB69F3A01FFF1FC5E93BDC571E986D59DAA226FE0 |
| docs/orders/evidence/golden-baseline/g2/logs/21-matrix-02-research-director.txt | LOST / UNRECOVERED / SUPERSEDED — regenerate current receipt | unrecovered | 857B0BF19498E582317F9A1D0440721FF70C4DB8ECA36CBB09A9095376B8683B |
| docs/orders/evidence/golden-baseline/g2/logs/21-matrix-03-kernel-market-lineage.txt | LOST / UNRECOVERED / SUPERSEDED — regenerate current receipt | unrecovered | A0F354EF168BABEA467A740789B8ADE86F02ACED867A2C9ADC7AFE6FA9BA76F0 |
| docs/orders/evidence/golden-baseline/g2/logs/21-matrix-04-governed-review.txt | LOST / UNRECOVERED / SUPERSEDED — regenerate current receipt | unrecovered | B8A20BFF006BAFA5EB716BCC5EC8CC23FA95CD0C923C95A171E1C2890102EEF8 |
| docs/orders/evidence/golden-baseline/g2/logs/21-matrix-05-research-world-visible.txt | LOST / UNRECOVERED / SUPERSEDED — regenerate current receipt | unrecovered | B43BFA44CA65BA7CA5BA41B9E75D55601C57F24DE8BA75AD4698BF19121DFE93 |
| docs/orders/evidence/golden-baseline/g2/logs/21-matrix-06-artifact-root-retry.txt | LOST / UNRECOVERED / SUPERSEDED — regenerate current receipt | unrecovered | 54212AD149F169D9A92C82790DCB5CE3D714CC7B873E9730D9A65AD6F6BF0918 |
| docs/orders/evidence/golden-baseline/g2/logs/21-matrix-06-artifact-root.txt | LOST / UNRECOVERED / SUPERSEDED — regenerate current receipt | unrecovered | D2794B0EA397EF54F174798CB377281ABC69E7E3020A0A889E5BE383127AE3B3 |
| docs/orders/evidence/golden-baseline/g2/logs/direct-artifact-root-semantic-copyfile-final.txt | LOST / UNRECOVERED / SUPERSEDED — regenerate current receipt | unrecovered | CE9D19907B03813341F1F476A77F777E2850852EA8CD70868E366BFFB2A88D38 |
| docs/orders/evidence/golden-baseline/g2/logs/direct-artifact-root-semantic-correct-cwd.txt | LOST / UNRECOVERED / SUPERSEDED — regenerate current receipt | unrecovered | FC6030F7559275A36B68C6E81DEBF90F066B540A48B96B68626528BA5F73D7C3 |
| docs/orders/evidence/golden-baseline/g2/logs/direct-artifact-root-semantic-junction.txt | LOST / UNRECOVERED / SUPERSEDED — regenerate current receipt | unrecovered | 2F8EF07FB8E68944DDBC4ABC7DC9C95CB26618F088F00B049F3277C98B84F9BC |
| docs/orders/evidence/golden-baseline/g2/logs/direct-artifact-root-semantic-symlink-final.txt | LOST / UNRECOVERED / SUPERSEDED — regenerate current receipt | unrecovered | DB3D1B1C27E2CD07867556A496B6DBA92A09E75B235658F059E707F62BE83ACC |
| docs/orders/evidence/golden-baseline/g2/logs/direct-artifact-root-semantic.txt | LOST / UNRECOVERED / SUPERSEDED — regenerate current receipt | unrecovered | 644C62EA83D26FC3717D2BAC2A7FD3AF15AD9D166C3569E0F08697C64A048B74 |
| docs/orders/evidence/golden-baseline/g2/reach-after.tsv | RECOVERABLE — restore exact final bytes | crlf-to-lf | 9811A60C4E820AC86C3B80B66682E645CE9E86AA4BDD4F446A6F5CEE23BA7135 |
| docs/orders/evidence/golden-baseline/g2/reach-before.tsv | RECOVERABLE — restore exact final bytes | crlf-to-lf | AF32D520832482ED2B38AEC4448EAB67F130CDDA52D65421CA10C411E0308B4F |
| docs/orders/evidence/golden-baseline/g2/VAULT-ARCHIVE-RECEIPT.md | RECOVERABLE — restore exact final bytes | crlf-to-lf | D4FF5DD06A15CFA65DB13C26D45F208909C00A23B99C9CB4B5C1785EDEBCD701 |

Recovery counts: recoverable=13; stale logs lost/unrecovered/superseded=12.

Current qa/gates/artifact-root.ts is retained as the accepted authority overlap. The five overlap paths are not restored from the paused patch wholesale; artifact-root/run.ts receives only the ordered A2A retirement merge, and Atlas projections are regenerated from combined source.

This receipt is written before restoration and is immutable for this integration pass.
