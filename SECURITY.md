# Security and privacy policy

## Reporting a vulnerability

Use GitHub private vulnerability reporting for this repository. Do not publish
exploit details, credentials, or sensitive findings in an issue.

## Never submit healthcare data

Real patient information and other sensitive healthcare data must never be submitted through issues, pull requests, discussions, fixtures, screenshots, databases, spreadsheets, logs, archives, or example datasets. This prohibition includes direct identifiers, quasi-identifiers, clinical free text, staff identities, authentication data, and row-level information described as anonymized or de-identified.

If an accidental disclosure occurs, stop sharing it, notify the owner privately, and follow applicable organizational incident-response requirements. Do not copy the disclosed values into another report.

## Deployment responsibility

The repository ships development defaults and obvious demo credentials. Before any deployment, replace secrets and accounts; restrict CORS; use TLS; establish access control, backups, migrations, logging, monitoring, retention, and incident response; and complete local privacy, security, clinical, and regulatory reviews.

Passwordless guest access is intended only for a synthetic public demonstration and is read-only at the API. Set `ENABLE_DEMO_GUEST=false` for staff-only environments, and never expose real records through a guest-enabled instance.

For a public synthetic demonstration, also set `PUBLIC_DEMO_MODE=true`. This
disables staff password login, administrator access, mutations, and public guest
audit writes at the API layer. It is not a substitute for a complete production
security review.

DialyCore is not a certified medical device and makes no compliance or production-readiness claim.
