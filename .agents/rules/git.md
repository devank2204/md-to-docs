# Git Execution Policy

- The agent is permitted to stage files (`git add`) and make local commits (`git commit`) autonomously.
- The agent must NEVER run `git push` or push code to remote repositories unless explicitly commanded by the user in that prompt.
