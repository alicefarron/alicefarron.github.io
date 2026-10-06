---
name: spec-driven
description: The spec, plan, tasks, implement, verify workflow for this repo. Use before writing or changing a spec, planning a feature, breaking work into tasks, or implementing anything that adds or alters behavior.
---

# Spec-driven workflow

Bug fixes that restore specified behavior skip to step 5 but still need a test.

1. Specify. Write or update `specs/NNN-slug/spec.md` from the template below. What and why only, no implementation.
2. Clarify. Mark every unknown as `[NEEDS CLARIFICATION: question]`. Do not guess. Stop and ask Alina.
3. Plan. Write `plan.md`: approach, files to add or touch, data shapes, which stack pieces and why, risks. Check it against the principles in CLAUDE.md and name any conflict.
4. Tasks. Write `tasks.md`: ordered checklist, `T01`, `T02`... Each task names its files and its verification. Mark parallel tasks with `[P]`.
5. Implement one task at a time. Test first where behavior is testable. Tick the box when its verification passes. One commit per task.
6. Verify. Run `pnpm check` and `pnpm test:e2e`. Walk every acceptance criterion at 390, 820 and 1280 px and report each as pass or fail.

Gates: wait for Alina's approval after step 2, and again after steps 3 and 4 together. Set `Status: approved` only when she says so.

If implementation shows the spec is wrong, stop, edit the spec, say what changed and why, and get approval again.

Numbering: three digits, increasing, never renumbered (`001-site-v1`, `002-search`).

## spec.md template

```
# NNN: Title

Status: draft | approved | implemented
Owner: Alina

## Why
## Users and goals
## Scope
## Out of scope
## Requirements
R1. ...
## Acceptance criteria
AC1 (R1). Given ..., when ..., then ...
## Open questions
- [NEEDS CLARIFICATION: ...]
```

Every requirement has at least one acceptance criterion. Every acceptance criterion is checkable by a test or a named manual step.

## tasks.md format

```
# NNN: Tasks

- [ ] T01 Short imperative title
  Files: src/...
  Verify: test name or manual step
- [ ] T02 [P] ...
```
