# Active documentation

Baseline date: 2026-09-05. Status: documentation stage; application rebuild pending.

## Reading order

| Document | Purpose |
| --- | --- |
| [01 — Rebuild brief](01-rebuild-brief.md) | Scope, source of truth, hard requirements, definition of completion |
| [02 — Content contract](02-content-contract.md) | Extraction evidence, completeness, editorial discrepancies, publication boundary |
| [Content corpus](content/README.md) | Four complete public Markdown documents plus interface inventory |
| [03 — Routing contract](03-routing-contract.md) | All legacy 301 patterns, precedence, new public routes, regression cases |
| [04 — Résumé design](04-resume-design.md) | Formal reading experience; language, themes, responsive and print behavior |
| [05 — Landing design](05-landing-design.md) | Handheld object, screen, controls, imagery, typography, animation states |
| [06 — Architecture](06-architecture.md) | Verified technology versions, modules, content/build/runtime boundaries |
| [07 — Quality and TDD](07-quality-and-tdd.md) | nmem-backed 6DQ, tests designed before code, Husky and CI gates |
| [08 — Delivery plan](08-delivery-plan.md) | Atomic main commits, acceptance checkpoints, cutover and rollback |
| [09 — Documentation verification](09-documentation-verification.md) | Evidence for this stage and implementation items still pending |

## Authority and status

The user's current requirements take precedence. Public facts come from the content corpus; current design and engineering decisions come from these numbered documents. New design labels, proposed asset treatments, and target budgets are specifications, not extracted historical facts.

This index must be updated when active documents are added, renamed, superseded, or implemented. Do not mark a planned gate, test, visual review, or deployment as passed without evidence.

The previous docs/design tree has been moved intact to docs/archive/2026-09-05-pre-rebuild/design. It is expired and outside the active reading/search corpus. Do not follow or inspect archived material unless the user explicitly requests it.
