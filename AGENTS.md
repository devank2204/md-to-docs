# Repository workflow

Follow `.agents/rules/git.md`. Push only when explicitly requested for the current work.

## gstack

Upstream gstack is pinned as a submodule at `.agents/skills/gstack`.
Read its `agents-digest/gstack-AGENTS.md` for the reuse ladder and review principles.
Install Codex adapters with `bash scripts/setup-gstack.sh`; see `docs/GSTACK.md`.
Generated adapters and local state are not source files and must not be committed.

For the mobile project, use `docs/MOBILE_IMPLEMENTATION_PLAN.md` as the scope and
acceptance contract. Product, design, engineering, and QA findings must distinguish
source inspection, automated browser evidence, and real-device evidence. Do not
claim a gstack command, independent review, or device test ran unless it actually did.
Existing user authorization takes precedence over workflow approval prompts.
