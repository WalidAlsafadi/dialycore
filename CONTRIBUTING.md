# Contributing to DialyCore

Thank you for helping improve DialyCore. Contributions should preserve its institution-neutral, privacy-first demonstration model and its focused hemodialysis workflow.

The current requirements were shaped with dialysis-domain input. Clinical-workflow changes should describe their source or rationale and distinguish local practice from broadly applicable behavior. Domain expertise informs the project; it does not turn the software into validated clinical guidance.

## Before opening an issue or pull request

Never include real or linkable patient, staff, clinician, institution, credential, infrastructure, or operational data. This includes screenshots, logs, database files, spreadsheets, exported rows, exact dates, identifiers, free-text notes, and “anonymized” records derived row-by-row from real data.

Use only independently authored synthetic examples. Redact locally before uploading; maintainers cannot make an already published disclosure private.

Run:

```text
python scripts/public_release_check.py
```

## Development setup

Follow the root README to install backend and frontend dependencies and generate the deterministic demo database. Never point tests or development tools at a clinical database.

## Change workflow

1. Create a focused branch from the current default branch.
2. Add or update tests for behavioral changes.
3. Run the complete local check with `npm run check`.
4. Explain the user-facing and privacy impact in the pull request.
5. Keep generated databases, build output, environments, and source-data exports untracked.

## Code expectations

- Reuse the shared brand mark in `frontend/components/auth/BrandPanel.tsx`.
- Treat `backend/app/db/models.py` as the relational source of truth.
- Keep demo generation deterministic for a supplied seed and anchor date.
- Make synthetic identifiers visibly fake and preserve foreign-key integrity.
- Keep clinical demo values plausible, while clearly labeling them non-clinical.
- Avoid unrelated architectural rewrites and dependencies.

## Tests

```powershell
npm run check
```

## Documentation and screenshots

Use institution-neutral language. Screenshots must come from a freshly generated demo database and must be checked for metadata, credentials, hostnames, and background-window disclosures. Do not claim certification, regulatory approval, compliance, or fitness for clinical use.

## Security reports

Do not open a public issue for a vulnerability or accidental sensitive-data disclosure. Follow [SECURITY.md](SECURITY.md).
