# Bounded implementation and experiment protocol

This adapts the narrow-scope, fixed-evaluation, keep/discard loop documented in
[Karpathy's autoresearch](https://github.com/karpathy/autoresearch). It is a UI
engineering adaptation, not a claim that Karpathy wrote these product rules.
We do not copy its GPU setup, permission bypass, endless loop, or git-reset policy.

## Before a meaningful change

1. Read AGENTS.md, PRODUCT.md, DESIGN.md, and the active decision register.
   Read the relevant code/tests and one relevant plan; avoid loading the archive.
2. State the user outcome and current evidence. Separate known behavior from a
   hypothesis. For a bug, establish the cause or reproduce it before widening scope.
3. Identify the smallest useful change and allowed files. List protected invariants.
4. Choose a relevant success measure and checks before editing. A UI experiment
   needs task behavior, failure recovery, and identity/accessibility guardrails;
   a single conversion metric cannot excuse breaking protected typography.

## Run the experiment

Use one falsifiable hypothesis, one coherent change, and a bounded verification
plan. Reuse code, native platform features, and installed dependencies first.
Do not mix a font refresh, library migration, new feature, and bug fix in one trial.
Write the complete version of the authorized change, including its error paths.

Hold the test corpus/evaluation constant for a comparison. Do not alter assertions,
timeouts, fixtures or thresholds merely to make a failing experiment pass. A real
requirement change needs a recorded reason and appropriate user authorization.

## Evaluate and retain

- Record baseline → change → observed result → guardrails → keep/revise/discard.
- Keep an improvement only when the promised behavior and required constraints
  hold. Equal behavior with substantially less complexity can also be a win.
- On failure, inspect the actual error before another change. Fix the cause and
  rerun the affected check. Stop widening scope if repeated failures are unrelated.
- Revert only this experiment's edits; preserve user/other work. No blanket reset,
  destructive cleanup, force push, automatic deployment, or unbounded background loop.
- Reuse passing evidence while inputs remain unchanged. Repeat checks when new
  changes or failures justify them; do not rerun everything indefinitely.

## Minimal result record

For meaningful experiments, append a row to the task's evidence record:

| Hypothesis | Baseline / revision | Change | Check / actual result | Guardrails | Disposition |
| --- | --- | --- | --- | --- | --- |

Actual results may be unavailable or inconclusive; say so. Screenshots show
appearance, API success shows an API fact, and receiving-app validation needs a
receiving app. Report the distinction. Never claim a review, test or metric ran
because a plan lists it.

## Finish

Summarize outcome, scope, checks, remaining uncertainty, and next useful step.
Update docs/WORKSTATE.md for active work and the decision register only when a
durable decision changed. Keep instructions short enough that future agents read
them. Use gstack review/QA as appropriate to scope; the user remains the authority.
