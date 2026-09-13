# Architecture overview

DialyCore is a small three-layer application:

1. A React/TypeScript browser client renders role-aware patient, schedule, session, and analytics workflows.
2. A FastAPI service provides JWT-authenticated JSON endpoints and Pydantic validation.
3. SQLAlchemy maps the current model to SQLite for development and demonstration.

`backend/app/db/models.py` is the relational source of truth. Tables are created from SQLAlchemy metadata when the API starts or the demo generator runs. The generated SQLite file is local runtime state and must never be committed.

The default stack is suitable for development, research, and adaptation. A clinical deployment requires locally designed migrations, persistence, concurrency controls, backup/recovery, observability, and privacy/security governance.
