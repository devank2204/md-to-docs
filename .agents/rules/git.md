# Git Execution Policy

- The agent is permitted to stage files (`git add`) and make local commits (`git commit`) autonomously.
- Standing user authorization (2026-11-14): push completed, verified changes to the current working branch automatically; do not ask the user to repeat the push instruction.
- Never force-push, merge, or deploy without separate authorization. Preserve unrelated uncommitted changes.
