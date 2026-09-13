# API contract overview

The live OpenAPI contract is available at `/docs` and `/openapi.json` while the backend runs. All `/api` resources require a bearer token except login.

## Authentication and users

- `POST /api/auth/login`, `POST /api/auth/guest`, `GET /api/auth/me`, `POST /api/auth/change-password`
- Admin only: `GET|POST /api/auth/users`, `PATCH /api/auth/users/{user_id}`

## Patients

- `GET|POST /api/patients`, `GET /api/patients/count`
- `GET|PATCH|DELETE /api/patients/{patient_id}`

## Dialysis sessions

- `GET|POST /api/patients/{patient_id}/dialysis-sessions`
- `GET|PATCH|DELETE /api/dialysis-sessions/{session_id}`
- `GET|POST /api/dialysis-sessions/{session_id}/medications`
- `GET|POST /api/dialysis-sessions/{session_id}/signatures`

## Patient clinical resources

Nested patient endpoints cover medication orders, labs, analyses, cultures, dry weights, schedules, doctor orders (`hd-sessions`), viral serology, anticoagulation, and vascular access. Supported methods are visible in OpenAPI and generally include list/create plus resource-specific update/delete operations.

Schedule aggregation is available at `GET /api/schedules/by-day-with-patients?day=Mon`. Analytics sessions are available at `GET /api/dialysis-sessions/all`.

The API is versioned as `1.0.0`, but a URL version prefix is not currently implemented.

Guest tokens can use authenticated read endpoints. All patient, session, clinical, signature, and password mutations reject the guest role with HTTP 403.
