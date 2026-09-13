# DialyCore repository structure

The repository separates the API, web client, technical documentation, infrastructure helpers, and release tooling.

```text
backend/
  app/api/                 FastAPI routers
  app/core/                Authentication and security helpers
  app/db/models.py         SQLAlchemy relational source of truth
  app/schemas/             Request/response models
  generate_demo_data.py    Independent deterministic demo generator
  tests/                   Generator and clinical-invariant tests
frontend/
  components/              Shared UI and brand components
  pages/                   Workflow pages
  public/logo.png          Public product mark
  services/api.ts          Typed API client
  index.css                Build-time Tailwind layers and theme tokens
docs/
  api/                     API notes
  architecture/            System overview and ERD
  db/                      Schema ownership guidance
  requirements/            Workflows and role model
infra/
  docker/                  Local Compose setup
  scripts/                 Demo generation helpers
scripts/
  public_release_check.py  Candidate-file privacy/release scan
.github/
  workflows/ci.yml         Backend, type, build, and release checks
  ISSUE_TEMPLATE/          Privacy-aware contribution forms
```

Runtime databases, environment files, data exports, build output, dependency directories, caches, and report artifacts are excluded. Public demo data is always regenerated from source.
