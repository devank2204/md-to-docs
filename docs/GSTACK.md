# gstack in md-to-docs

Upstream: https://github.com/garrytan/gstack (MIT).
Pinned source: `.agents/skills/gstack`, version 1.97.0.0 at
`6cf00aee9c0fdedc722f35c1f0032c3db9404104`.
Codex support is upstream's experimental tier.

## Setup

Use the project's Node 24 runtime and install Bun 1.4.2 or a compatible newer
version per upstream's requirements. Bun is developer tooling, not an app dependency.

```bash
git submodule update --init .agents/skills/gstack
bash scripts/setup-gstack.sh
GSTACK_HOME="$PWD/.gstack/state" .agents/skills/gstack/setup --status
```

For planning without Chromium downloads:

```bash
GSTACK_SETUP_SKIP_CSO_BUILD=1 bash scripts/setup-gstack.sh --no-browser
```

This installs project-local `gstack-*` Codex skills in `.agents/skills`.
Restart/reopen the agent session if new skills are not discovered automatically.
State lives in ignored `.gstack/state`; generated adapters are ignored too.
The setup helper works from any current directory and updates only the pinned
submodule revision, never upstream HEAD. The app's pnpm build does not run gstack.

To update, explicitly review an upstream revision, update the submodule pointer,
rerun setup, and commit the new pointer. Do not auto-update it during app builds.

## Mobile workflow

1. `gstack-office-hours` / `gstack-plan-ceo-review`: challenge the user job and scope.
2. `gstack-plan-design-review`: review mobile hierarchy, interaction states,
   accessibility, and visual designs.
3. `gstack-autoplan`: run the formal review pipeline when the required review
   providers and agent capabilities are available; engineering review comes last.
4. After implementation: `gstack-review`, then `gstack-qa` or `gstack-qa-only`
   against a preview, followed by explicit physical-device handoff tests.
5. Shipping remains a separate user-directed action.

The initial mobile plan is **gstack-informed**, based on the upstream digest and
design principles plus this repository's source. It is not represented as a
completed `/autoplan`, outside-model review, browser QA, or physical-device test.

## Current environment verification

Official `setup --host codex --no-browser` completed successfully using Bun 1.4.2.
The documented helper was also rerun successfully; all 74 checked router section
links resolve. Upstream `--status` currently prints a runtime-root relocation
advisory for this project-local source layout, despite setup recognizing the
local layout and completing both runs. Do not move the pinned submodule in
response to that advisory; use the project helper for reinstalls.
The unrelated native CSO helper was explicitly skipped. Chromium was not installed
by this setup; browser-dependent skills need browser setup before use. No external
model review was run. Upstream telemetry is opt-in; this integration does not opt in.
