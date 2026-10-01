# Journal IQ API — production image (npm workspaces monorepo)
# Build from repository root. Do not set Railway Root Directory to apps/backend.
FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Workspace manifests (lockfile expects all workspace package.json files)
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/mobile/package.json ./apps/mobile/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci

# Backend + shared sources only (mobile source excluded via .dockerignore)
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

RUN npm run build:backend \
  && test -f apps/backend/dist/index.js \
  && test -f packages/shared/dist/index.js

ENV NODE_ENV=production
EXPOSE 5000

CMD ["npm", "run", "start:backend"]
