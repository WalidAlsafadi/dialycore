# Public demo deployment

DialyCore includes a deliberately constrained deployment profile for publishing
the independently generated synthetic dataset. It is not a production clinical
deployment profile.

## Security model

Set all three values for an internet-facing demonstration:

```text
APP_ENV=production
PUBLIC_DEMO_MODE=true
ENABLE_DEMO_GUEST=true
```

In this mode the API:

- disables password-based staff sign-in;
- disables every mutation guarded by staff or administrator authorization;
- allows the existing synthetic guest user to obtain a read-only token; and
- avoids writing a new audit event for each public guest session.

`PUBLIC_DEMO_MODE` is enforced by the API, not only by hidden frontend controls.
The normal local defaults leave staff sign-in and staff mutations available.

## Single-container image

The root `Dockerfile` builds the React client and serves it from FastAPI at the
same origin. On every container start it replaces only
`/app/data/dialycore_demo.db` with a deterministic synthetic database. Pass a
unique `JWT_SECRET` of at least 32 characters at runtime.

Example local smoke test:

```powershell
docker build -t dialycore-public-demo .
docker run --rm -p 8000:8000 `
  -e JWT_SECRET="replace-this-with-at-least-32-random-characters" `
  dialycore-public-demo
```

Open `http://localhost:8000` and use **Explore the Demo**. The staff credentials
documented for local development must receive `403` from this image.

## Render Blueprint

The root `render.yaml` describes one free Docker web service in Render's
Frankfurt region, with a `/health` health check and a generated JWT secret.
Connect the GitHub repository in the Render dashboard and create a Blueprint
from the repository. Automatic deploys wait for the linked commit's GitHub
checks to pass.

The database is intentionally ephemeral: it is regenerated from source-owned
synthetic fixtures whenever the service starts. Do not attach a real database,
upload records, or use this profile with patient or staff information.

After deployment, verify:

1. `/health` returns `{"status":"ok"}`.
2. **Explore the Demo** opens dashboards and record pages.
3. Staff password login returns a disabled-public-demo error.
4. Direct authenticated mutation requests return `403`.
5. Browser developer tools show no console errors or failed API requests during browsing.

Free hosting can sleep when idle, so the first request after inactivity may take
longer. This profile treats every restart as a clean reset of the demo.
