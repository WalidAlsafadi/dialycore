# DialyCore web client

React, TypeScript, Vite, and build-time Tailwind CSS client for DialyCore. The shared brand component lives in `components/auth/BrandPanel.tsx`; the product mark lives in `public/logo.png`.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Set `VITE_API_BASE_URL` to the FastAPI origin. See the root README for the complete demo workflow and privacy rules.

Run `npm run typecheck` and `npm run build` before submitting frontend changes.
