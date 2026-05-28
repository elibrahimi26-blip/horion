# syntax=docker/dockerfile:1.7

# ────── 1. Dependencies ──────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
# pnpm-lock.yaml* (avec étoile) rend la copie tolérante si le lockfile
# n'existe pas encore. pnpm install (sans --frozen-lockfile) régénère
# le lockfile si manquant. Une fois le lockfile commit, les builds sont
# reproductibles.
COPY package.json pnpm-lock.yaml* .npmrc* ./
RUN corepack enable && pnpm install --prefer-frozen-lockfile

# ────── 2. Build ──────
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm prisma generate && pnpm build && \
    # Bundle le script d'import yuhonas en JS pur pour qu'il puisse tourner
    # dans l'image runtime sans tsx ni TypeScript. @prisma/client est externe
    # car déjà installé dans le runtime via les copies plus bas.
    ./node_modules/.bin/esbuild scripts/import-yuhonas.ts \
      --bundle --platform=node --format=esm --target=node20 \
      --external:@prisma/client \
      --outfile=scripts/import-yuhonas.mjs

# ────── 3. Runtime (standalone) ──────
FROM node:20-alpine AS runner
# postgresql16-client = pg_dump + psql, requis par /admin/backups pour générer
# et restaurer les dumps directement depuis l'app.
# git = requis par scripts/import-yuhonas.ts pour cloner free-exercise-db.
RUN apk add --no-cache openssl postgresql16-client git
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Dossier des sauvegardes (monté en volume via compose, partagé avec backup-cron)
RUN mkdir -p /app/backups && chown nextjs:nodejs /app/backups

# Dossier des images d'exercices (monté en volume via compose, peuplé par
# scripts/import-yuhonas.ts puis servi par /api/exercise-images/[...path])
RUN mkdir -p /app/exercises && chown nextjs:nodejs /app/exercises

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Embed prisma CLI + engines so the container can run `migrate deploy` on boot.
# On appelle prisma via son entry point réel (node_modules/prisma/build/index.js)
# au lieu du wrapper .bin/prisma — sinon Docker COPY casse les chemins relatifs
# vers les fichiers WASM (prisma_schema_build_bg.wasm).
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Script d'import yuhonas (one-shot, exécuté manuellement par l'admin).
# Lancer via : docker compose exec app node scripts/import-yuhonas.mjs
# Le bundle ESM est compilé dans le builder stage via esbuild — il ne dépend
# plus que de @prisma/client (déjà présent) et des binaires git + node natifs.
COPY --from=builder --chown=nextjs:nodejs /app/scripts/import-yuhonas.mjs ./scripts/import-yuhonas.mjs

USER nextjs
EXPOSE 3000

CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node server.js"]
