# Roles and permissions

## Current enforcement

- All active users must authenticate to access patient, schedule, session, and clinical endpoints.
- Administrators can list, create, update, activate, and deactivate users.
- The web client hides unit statistics from nurses and adjusts editing affordances by role where implemented.
- Passwordless guest visitors can browse demo records, while all backend mutation routes reject the guest role.

Frontend visibility is not a security boundary. Most clinical API routes currently accept any authenticated role.

## Deployment requirement

Before real-world adaptation, define a local authorization matrix for read, create, update, delete, sign, export, audit, and administration operations. Enforce it server-side, test denied paths, and define emergency access and review processes. Do not rely on the demonstration role model for clinical use.
