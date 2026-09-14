# DialyCore

Expert-informed, open-source hemodialysis unit records and workflow management.

DialyCore is a full-stack reference application that turns complex dialysis-unit documentation needs into a clear, role-aware web workflow. It covers patient records, recurring schedules, treatment sessions, doctor orders, medications, investigations, vascular access, serology, and unit-level analytics.

The product requirements and workflow model were shaped with input from professionals familiar with hemodialysis-unit operations. They are not arbitrary software assumptions. DialyCore still remains a reference implementation—not a certified clinical system—and every real-world adaptation requires local clinical, regulatory, privacy, and security validation.

> [!IMPORTANT]
> The bundled generator creates entirely fictional demonstration data. It does not anonymize, transform, or sample real records. All identities and clinical records are synthetic; any resemblance to real people is coincidental.

## What the project demonstrates

- Domain discovery translated into documented workflows and a relational data model
- Role-aware administrator, doctor, nurse, and read-only guest experiences
- Typed React UI backed by a JWT-authenticated FastAPI service
- Deterministic generation of a connected 300-patient demonstration environment
- Privacy-by-design release safeguards that prohibit real or derived healthcare data
- Responsive interfaces for patient, schedule, session, and unit-statistics workflows
- Containerized local setup and automated backend, type, build, and release checks

## Capabilities

- Arabic patient-name and locality support
- Recurring schedules by day, room, and period
- Pre/post dialysis observations, weights, timing, machine parameters, and notes
- Doctor orders, long-term medication lists, and in-session administrations
- Laboratory history, viral serology, analyses, cultures, anticoagulation, and access history
- Session signatures, audit activity, dashboards, trends, and unit statistics
- Visibly fictional identifiers and a reproducible synthetic dataset

## Architecture and stack

The React browser client calls a FastAPI JSON API. SQLAlchemy maps the domain model to SQLite for local development and demonstration. The generated database is runtime state and is never committed.

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Recharts
- Backend: Python 3.11+, FastAPI, Pydantic, SQLAlchemy
- Authentication: JWT with bcrypt password hashes
- Development database: SQLite
- Containers: Docker Compose with a named volume for generated demo data

See the [architecture overview](docs/architecture/overview.md), [expert-informed requirements](docs/requirements/README.md), [workflow](docs/requirements/workflow.md), [roles](docs/requirements/roles-permissions.md), and [API contract](docs/api/contract.md).

## Quick start

### Prerequisites

- Python 3.11 or newer
- Node.js 20 or newer and npm
- Optional: Docker with Compose

### Backend

From the repository root on PowerShell:

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
Copy-Item .env.example .env
python generate_demo_data.py --patients 300 --seed 2026
uvicorn app.main:app --reload
```

On macOS/Linux, activate with `source .venv/bin/activate` and copy the environment example with `cp .env.example .env`.

The API is available at `http://localhost:8000`; interactive documentation is at `http://localhost:8000/docs`.

### Frontend

In another terminal:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

### Docker

```powershell
docker compose -f infra/docker/docker-compose.yml up --build
```

Compose generates the demo database on its named volume the first time it starts.

## Explore the demo

The Login page provides **Explore the Demo** with no username or password. It creates a read-only guest session so visitors can browse dashboards, patients, schedules, sessions, and clinical history without changing data. Set `ENABLE_DEMO_GUEST=false` to disable passwordless access.

For local testing, the generator also creates three staff accounts. All use the local-only password `DialyCoreDemo!2026`.

| Role | Email |
| --- | --- |
| Administrator | `admin@demo.dialycore.local` |
| Doctor | `doctor@demo.dialycore.local` |
| Nurse | `nurse@demo.dialycore.local` |

These credentials are intentionally obvious demonstration fixtures. Never reuse them for an internet-facing deployment.

For an internet-facing synthetic demonstration, enable `PUBLIC_DEMO_MODE=true`.
That server-side mode disables staff password login, administrator access, and
all mutations while retaining the read-only guest flow.

## Synthetic demo dataset

```powershell
cd backend
python generate_demo_data.py --patients 300 --seed 2026
```

The command safely recreates only `backend/dialycore_demo.db`. The default anchor date is `2026-09-01`, so a given seed produces repeatable records; pass `--anchor-date YYYY-MM-DD` to choose another deterministic reference date.

The generator independently authors patients, schedules, sessions, observations, doctor orders, medications, administrations, signatures, labs, analyses, cultures, dry-weight histories, serology, anticoagulation, access histories, users, and audit events. Values are software demonstration fixtures, not a clinical simulation or decision-support dataset.

## Roles and current limits

- Administrator: application access plus user-administration APIs
- Doctor: clinical workflows and unit statistics
- Nurse: patient, schedule, and dialysis-session workflows; unit statistics are hidden
- Guest visitor: passwordless read-only access to demonstration records

This is a demonstration authorization model. Frontend visibility is not a security boundary, and fine-grained staff permissions remain deployment work. See the documented [role model](docs/requirements/roles-permissions.md).

## Quality checks

Run the complete local verification from the repository root:

```powershell
npm run check
```

This runs backend tests, the TypeScript check, the production frontend build, and the public-release candidate scanner.

## Privacy and public-release policy

Real patient or staff data is prohibited in this repository. Do not submit databases, spreadsheets, exports, environment files, clinical notes, logs, screenshots, identifiers, credentials, or metadata sourced from a healthcare environment. Do not contribute row-level data described as anonymized or de-identified. Use independently authored synthetic fixtures only.

Before every release, run:

```powershell
python scripts/public_release_check.py
```

The scanner reports safe path/reason labels without printing matched file contents. See [SECURITY.md](SECURITY.md) for private reporting guidance.

To publish without inherited private history, follow [Creating the clean public repository](docs/public-release.md). Do not change the visibility of a repository whose history may contain private files.

## Contributing

Issues and pull requests are welcome. Good first areas include test coverage, accessibility, documentation, localization, UI consistency, and safe deployment tooling. Clinical-workflow changes should explain their domain basis and must never include real records.

Read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## Security and deployment

- Configure a long random `JWT_SECRET`; startup fails without one when `APP_ENV=production`.
- Restrict `CORS_ORIGINS` to exact trusted frontend origins.
- Replace demo accounts and disable guest access unless the deployment contains synthetic public-demo data only.
- Add reviewed migrations, production persistence, backups, monitoring, audit retention, and disaster recovery.
- Complete local clinical, privacy, security, regulatory, and accessibility reviews.

For the constrained public synthetic-demo container and Render Blueprint, see
[Public demo deployment](docs/deployment/public-demo.md). This profile rebuilds
the fictional SQLite dataset on every start and is intentionally separate from
the requirements of a real clinical deployment.

DialyCore is not a certified medical device, is not medical advice, and makes no compliance or production-readiness claim.

## License

DialyCore is free to use, copy, modify, and distribute under the [MIT License](LICENSE). Attribution and the license notice must be retained as described in the license.
