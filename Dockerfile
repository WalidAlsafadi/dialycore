FROM node:20-slim AS frontend-build

WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --silent --no-progress
COPY frontend/ ./
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_ENV=production \
    PUBLIC_DEMO_MODE=true \
    ENABLE_DEMO_GUEST=true \
    DATABASE_URL=sqlite:////app/data/dialycore_demo.db \
    FRONTEND_DIST_DIR=/app/frontend-dist \
    DEMO_PATIENT_COUNT=300 \
    DEMO_SEED=2026

WORKDIR /app
COPY backend/pyproject.toml ./pyproject.toml
COPY backend/app ./app
COPY backend/generate_demo_data.py ./generate_demo_data.py
RUN pip install --no-cache-dir .
COPY --from=frontend-build /build/frontend/dist ./frontend-dist

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:' + __import__('os').getenv('PORT', '8000') + '/health', timeout=3)"

CMD ["sh", "-c", "python generate_demo_data.py --output /app/data/dialycore_demo.db --patients ${DEMO_PATIENT_COUNT:-300} --seed ${DEMO_SEED:-2026} && exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
