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

## Deployment architecture

The public demo uses two services:

- Vercel serves the compiled React frontend from its CDN.
- Render runs the read-only FastAPI API and recreates the synthetic SQLite
  database on every container start.

This keeps the public landing and Login pages immediately available even when
the free backend is asleep. If the API takes longer than two seconds, the Login
page explains that the demo is waking up and might take up to a minute.

## 1. Deploy the API on Render

The root `Dockerfile` and `render.yaml` describe one free Docker web service in Render's
Frankfurt region, with a `/health` health check and a generated JWT secret.
Connect the GitHub repository in the Render dashboard and create a Blueprint
from the repository. Automatic deploys wait for the linked commit's GitHub
checks to pass.

The database is intentionally ephemeral: it is regenerated from source-owned
synthetic fixtures whenever the service starts. Do not attach a real database,
upload records, or use this profile with patient or staff information.

Free hosting can sleep when idle, so the first request after inactivity may take
longer. This profile treats every restart as a clean reset of the demo.

Copy the resulting API origin, for example
`https://dialycore-api.onrender.com`, and confirm its `/health` endpoint
returns `{"status":"ok"}`.

## 2. Deploy the frontend on Vercel

Import the same GitHub repository into Vercel with these settings:

- Project name: `dialycore`
- Framework preset: Vite
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://your-api.onrender.com`

Set the environment variable for Production and Preview, then deploy.
`frontend/vercel.json` rewrites direct requests to the SPA entry point, so
browser URLs remain clean paths such as `/dashboard`, `/patients/42`, and
`/schedule`.

The Render Blueprint initially permits HTTPS origins whose Vercel hostname
starts with `dialycore`. After Vercel assigns the stable production domain,
replace `CORS_ORIGIN_REGEX` on Render with an empty value and set
`CORS_ORIGINS` to that exact origin.

## 3. Verify the public deployment

1. Open the Vercel URL and confirm the Login page appears immediately.
2. Select **Explore the Demo** and allow up to one minute for the first backend wake-up.
3. Refresh `/dashboard` directly and confirm the route still renders.
4. Confirm staff password login and direct mutation requests return `403`.
5. Confirm browser developer tools show no unexpected console or network errors.
