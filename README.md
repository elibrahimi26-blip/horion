# Horion

Plateforme communautaire de suivi musculation. PWA installable, mobile first, destinée à un petit groupe d'utilisateurs (~10 membres).

## Stack

Next.js 14 (App Router) · TypeScript strict · TailwindCSS + shadcn/ui · Prisma + PostgreSQL 16 · Auth.js v5 · Cloudflare R2 · Docker

Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour les détails techniques complets.

## Démarrage local

Pré-requis : Node.js 20+, pnpm 9+, Docker.

```bash
# 1. Installer les dépendances (génère pnpm-lock.yaml au premier run)
pnpm install

# 2. Configurer l'environnement
cp .env.example .env
# Générer NEXTAUTH_SECRET avec : openssl rand -base64 32

# 3. Démarrer PostgreSQL en local
docker compose -f docker/docker-compose.dev.yml up -d

# 4. Appliquer les migrations + seed
pnpm prisma migrate dev
pnpm db:seed

# 5. Lancer le dev server
pnpm dev
```

L'app est disponible sur http://localhost:3000.

## Commandes utiles

| Commande | Effet |
|---|---|
| `pnpm dev` | Dev server avec HMR |
| `pnpm build` | Build de production |
| `pnpm start` | Lance le build de production |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript `--noEmit` |
| `pnpm prisma:migrate` | Crée + applique une migration de dev |
| `pnpm prisma:studio` | GUI base de données |
| `pnpm db:seed` | Lance le seed |

## Structure

```
src/
├── app/            # routes Next.js (App Router)
├── components/     # composants UI (shadcn/ui + custom)
├── features/       # logique métier par domaine (à venir)
├── lib/            # utilitaires (db, auth, env, utils)
└── types/          # déclarations TypeScript globales
prisma/             # schéma + migrations + seed
docker/             # Dockerfile + compose dev
```

## Licence

Privé.
