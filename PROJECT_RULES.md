# SentinMail Automated Development Rules

## 1. Automatic GitHub Sync Policy
- **MANDATORY**: After every file edit, feature addition, refactoring, or bug fix, the assistant must automatically:
  1. Stage all changes: `git add .`
  2. Commit with a clear descriptive message: `git commit -m "<Description of changes>"`
  3. Push to GitHub: `git push origin main`
- Never ask the user for permission to commit or push progress. Treat continuous version control synchronization as a core project requirement.

## 2. Integrity & Quality Safeguards
- Always preserve `.gitignore` rules so virtual environments (`.venv`), `node_modules`, database files (`.sentinmail.db`), and caches are never committed to the remote repository.
- Ensure the React production bundle is rebuilt via `npm run build` whenever frontend components in `frontend/src/` are modified, so the FastAPI single-port deployment remains in sync.
- Run unit tests (`pytest backend/tests/test_services.py`) to confirm zero regressions before committing.
