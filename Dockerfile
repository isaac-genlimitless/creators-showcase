# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund && npm cache clean --force

FROM deps AS build
ENV NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--max-old-space-size=1536
COPY . .
RUN npx prisma generate && npm run build

# Standalone prisma CLI (with its own deps) just for `migrate deploy` at start-up.
FROM base AS prismacli
WORKDIR /prisma-cli
RUN npm init -y >/dev/null && npm install --no-audit --no-fund prisma@6.19.3 && npm cache clean --force

FROM base AS run
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 UPLOAD_DIR=/data/uploads
RUN addgroup -S app && adduser -S app -G app && mkdir -p /data/uploads && chown -R app:app /data
COPY --from=prismacli /prisma-cli /prisma-cli
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
COPY --from=build --chown=app:app /app/prisma ./prisma
COPY --chown=app:app docker/entrypoint.sh ./entrypoint.sh
USER app
EXPOSE 3000
CMD ["sh", "./entrypoint.sh"]
