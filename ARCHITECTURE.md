# Horion — Architecture Technique

> Plateforme communautaire de suivi musculation pour groupes d'utilisateurs (~10 membres).
> Version document : 1.0 — 2026-05-26

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack technique](#2-stack-technique)
3. [Arborescence du projet](#3-arborescence-du-projet)
4. [Modèle de données](#4-modèle-de-données)
5. [Système d'authentification](#5-système-dauthentification)
6. [Système XP & niveaux](#6-système-xp--niveaux)
7. [Modules fonctionnels](#7-modules-fonctionnels)
8. [PWA & expérience mobile](#8-pwa--expérience-mobile)
9. [Stockage médias](#9-stockage-médias)
10. [Notifications](#10-notifications)
11. [Déploiement & infrastructure](#11-déploiement--infrastructure)
12. [CI/CD](#12-cicd)
13. [Sécurité](#13-sécurité)
14. [Performance & scalabilité](#14-performance--scalabilité)
15. [Roadmap de développement](#15-roadmap-de-développement)
16. [Points ouverts](#16-points-ouverts)

---

## 1. Vue d'ensemble

Horion est une application web installable (PWA) destinée à un petit groupe de membres (~10) pour planifier, exécuter et partager leurs séances de musculation.

### Personas

- **Membre** : crée et exécute des séances, partage avec le groupe, consulte ses stats
- **Admin** : valide les inscriptions, gère la bibliothèque d'exercices, modère les contenus, communique en privé avec les membres

### Principes directeurs

- **Mobile first** : utilisation principale en salle, en mobilité
- **Offline capable** : la saisie en séance ne doit jamais être bloquée par une coupure réseau
- **Simplicité** : pas de surcharge fonctionnelle, focus sur le suivi des séances et l'aspect communautaire
- **Données fiables** : l'historique des sessions reste intègre même après modification des templates

---

## 2. Stack technique

| Couche | Technologie | Justification |
|---|---|---|
| Framework | **Next.js 14** (App Router) | RSC, server actions, routing fichier, ecosystem mature |
| Langage | **TypeScript 5** (strict) | Type-safety bout en bout |
| UI Library | **React 18** | RSC, Suspense, useOptimistic |
| Styling | **TailwindCSS 3** + **shadcn/ui** | Composants accessibles personnalisables, design system cohérent |
| ORM | **Prisma 5** | Schéma déclaratif, migrations, type-safety |
| Database | **PostgreSQL 16** | Relations complexes, JSON, robustesse |
| Auth | **Auth.js v5** (NextAuth) | Sessions DB, Credentials provider, intégration native |
| Validation | **Zod** | Validation runtime + inférence TS, partagée client/serveur |
| Email | **Resend** | API moderne, templates React, fallback Brevo si FR strict |
| Storage objet | **Cloudflare R2** | S3-compatible, gratuit jusqu'à 10 Go, bande passante illimitée |
| PWA | **Serwist** (next-pwa successeur) | Service worker maintenu, intégration App Router |
| State client | **Zustand** (uniquement pour le chrono séance) | Léger, pas overkill |
| Tests | **Vitest** + **Playwright** | Unit + E2E sur flows critiques |
| Conteneurisation | **Docker** + **Docker Compose** | Reproductibilité, déploiement VPS simple |
| Reverse proxy | **Nginx** + **Certbot** | SSL Let's Encrypt auto-renew |
| Hébergement | **VPS Azurhost ou Hostinger** | Coût maîtrisé, contrôle total |
| CI/CD | **GitHub Actions** | Build, tests, déploiement SSH |
| Registry images | **GHCR** (GitHub Container Registry) | Inclus dans le plan GitHub |

### Versions cibles

- Node.js : `20 LTS`
- pnpm : `9.x` (manager recommandé)
- PostgreSQL : `16`
- Docker : `26+`

---

## 3. Arborescence du projet

```
horion/
├── prisma/
│   ├── schema.prisma                 # source de vérité du modèle de données
│   ├── migrations/                   # historique des migrations
│   └── seed.ts                       # seed initial (exercices, muscles, catégories)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                # root layout (providers globaux)
│   │   ├── page.tsx                  # landing publique
│   │   │
│   │   ├── (auth)/                   # routes publiques d'auth
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── verify-email/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   │
│   │   ├── (app)/                    # routes protégées membre
│   │   │   ├── layout.tsx            # vérifie session + status ACTIVE
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── library/              # bibliothèque exercices (lecture)
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── workouts/             # mes séances
│   │   │   │   ├── page.tsx          # liste : mes / enregistrées
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # détail / édition
│   │   │   │       └── run/page.tsx  # mode exécution (chrono)
│   │   │   ├── calendar/page.tsx     # planning + historique
│   │   │   ├── social/               # séances partagées
│   │   │   │   ├── page.tsx          # flux + likes + bookmark
│   │   │   │   └── [id]/page.tsx     # détail séance publique
│   │   │   ├── messages/             # conversations privées avec admin
│   │   │   │   ├── page.tsx
│   │   │   │   └── [threadId]/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   ├── profile/
│   │   │   │   ├── page.tsx          # profil public
│   │   │   │   └── settings/page.tsx # paramètres compte
│   │   │   └── support/page.tsx      # contact admin
│   │   │
│   │   ├── (admin)/admin/            # routes admin (middleware vérifie role)
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── users/
│   │   │   │   ├── page.tsx          # liste avec filtres
│   │   │   │   └── [id]/page.tsx     # fiche user (status, débloquer pseudo)
│   │   │   ├── exercises/            # CRUD bibliothèque
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── support/              # threads support
│   │   │   │   ├── page.tsx
│   │   │   │   └── [threadId]/page.tsx
│   │   │   └── messages/             # initier conversation privée
│   │   │       ├── page.tsx
│   │   │       └── [memberId]/page.tsx
│   │   │
│   │   ├── api/                      # routes API (webhooks, uploads)
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── upload/route.ts       # signed URL R2
│   │   │   └── health/route.ts
│   │   │
│   │   ├── manifest.ts               # PWA manifest
│   │   └── icon.tsx                  # favicon
│   │
│   ├── components/
│   │   ├── ui/                       # primitives shadcn (button, input, dialog…)
│   │   ├── layout/                   # sidebar, bottom-nav, header
│   │   ├── auth/                     # forms auth
│   │   ├── workout/
│   │   │   ├── exercise-picker.tsx
│   │   │   ├── set-input.tsx
│   │   │   ├── timer.tsx
│   │   │   ├── rest-timer.tsx
│   │   │   └── workout-card.tsx
│   │   ├── dashboard/
│   │   │   ├── body-map.tsx          # carte muscles (à valider)
│   │   │   ├── weight-chart.tsx
│   │   │   ├── volume-chart.tsx
│   │   │   ├── calendar.tsx
│   │   │   └── stats-card.tsx
│   │   ├── social/
│   │   │   ├── workout-feed.tsx
│   │   │   └── like-button.tsx
│   │   ├── messaging/
│   │   │   ├── thread-list.tsx
│   │   │   └── message-composer.tsx
│   │   └── shared/
│   │       ├── avatar.tsx
│   │       ├── level-badge.tsx
│   │       └── empty-state.tsx
│   │
│   ├── features/                     # logique métier par domaine
│   │   ├── auth/
│   │   │   ├── actions.ts            # server actions (login, register…)
│   │   │   ├── schemas.ts            # Zod schemas
│   │   │   └── service.ts            # logique pure
│   │   ├── workouts/
│   │   │   ├── actions.ts
│   │   │   ├── queries.ts            # data fetching server
│   │   │   ├── versioning.ts         # création des versions
│   │   │   └── schemas.ts
│   │   ├── xp/
│   │   │   ├── levels.ts             # table des paliers
│   │   │   ├── service.ts            # awardXp, computeLevel
│   │   │   └── events.ts             # types d'événements
│   │   ├── social/
│   │   ├── messaging/
│   │   ├── notifications/
│   │   │   ├── service.ts            # createNotification
│   │   │   └── dispatcher.ts         # in-app vs email
│   │   └── admin/
│   │
│   ├── lib/
│   │   ├── db.ts                     # singleton Prisma
│   │   ├── auth.ts                   # config Auth.js
│   │   ├── r2.ts                     # client S3 vers R2
│   │   ├── email.ts                  # client Resend
│   │   ├── rate-limit.ts             # upstash rate limiter
│   │   ├── env.ts                    # validation env vars (Zod)
│   │   └── utils.ts
│   │
│   ├── hooks/
│   │   ├── use-wake-lock.ts          # garder écran allumé pendant séance
│   │   ├── use-offline-queue.ts      # queue IndexedDB
│   │   ├── use-timer.ts
│   │   └── use-online-status.ts
│   │
│   ├── types/                        # types globaux + augmentations
│   │   ├── auth.d.ts
│   │   └── next-auth.d.ts
│   │
│   └── middleware.ts                 # protection routes + role check
│
├── public/
│   ├── icons/                        # icônes PWA (192, 256, 384, 512)
│   ├── splash/                       # splash screens iOS
│   └── images/
│
├── docker/
│   ├── Dockerfile                    # build multi-stage de l'app
│   ├── docker-compose.yml            # app + postgres + nginx + certbot
│   ├── docker-compose.dev.yml        # version dev (postgres only)
│   ├── nginx/
│   │   ├── default.conf
│   │   └── ssl.conf
│   └── scripts/
│       ├── backup-db.sh              # backup quotidien → R2
│       └── restore-db.sh
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # lint, typecheck, tests
│       └── deploy.yml                # build + push image + SSH deploy
│
├── tests/
│   ├── unit/                         # Vitest
│   └── e2e/                          # Playwright
│
├── .env.example
├── .gitignore
├── docker-compose.yml                # symlink vers docker/
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── pnpm-lock.yaml
├── README.md
└── ARCHITECTURE.md                   # ce document
```

---

## 4. Modèle de données

### 4.1 Diagramme d'entités (vue logique)

```
┌──────────┐       ┌─────────────────┐       ┌──────────────────┐
│   User   │──┬──► │   Workout       │──────►│ WorkoutVersion   │
│          │  │    │ (template)      │       │ (immutable)      │
│ role     │  │    │ author, name    │       │ version N        │
│ status   │  │    │ currentVersion  │       └────────┬─────────┘
│ xp cumul │  │    └─────────────────┘                │
└────┬─────┘  │              ▲                        │
     │        │              │                        ▼
     │        │     ┌────────┴────────┐    ┌─────────────────────┐
     │        ├────►│ WorkoutLike     │    │ WorkoutVersionExercise │
     │        ├────►│ WorkoutSave     │    │ exerciseId, sets, reps │
     │        │     └─────────────────┘    └─────────────────────┘
     │        │                                       │
     │        │     ┌─────────────────┐              │
     │        └────►│ WorkoutCategory │              ▼
     │              └────────┬────────┘    ┌─────────────────┐
     │                       │             │    Exercise     │◄──┐
     │                       ▼             │ (admin-managed) │   │
     │              ┌─────────────────┐    └────────┬────────┘   │
     │              │ PlannedSession  │             │            │
     │              │ scheduledFor    │             ▼            │
     │              │ categoryId      │    ┌─────────────────┐   │
     │              └────────┬────────┘    │  MuscleGroup    │   │
     │                       │             └─────────────────┘   │
     │                       ▼                                   │
     │              ┌─────────────────┐                          │
     ├─────────────►│ WorkoutSession  │                          │
     │              │ + version snap  │                          │
     │              └────────┬────────┘                          │
     │                       │                                   │
     │                       ▼                                   │
     │              ┌─────────────────┐                          │
     │              │ SessionSet      │──────────────────────────┘
     │              │ weight, reps    │
     │              └─────────────────┘
     │
     ├────► BodyWeightEntry
     ├────► XpEvent
     ├────► SupportThread / SupportMessage
     ├────► PrivateThread / PrivateMessage
     └────► Notification
```

### 4.2 Schéma Prisma complet

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ────── ENUMS ──────
enum Role            { MEMBER ADMIN }
enum UserStatus      { PENDING ACTIVE SUSPENDED }
enum WorkoutVisibility { PRIVATE PUBLIC }
enum PlannedStatus   { SCHEDULED COMPLETED MISSED CANCELLED }
enum ThreadStatus    { OPEN CLOSED }

enum XpEventType {
  THREE_WORKOUTS_CREATED
  EMAIL_VERIFIED
  AVATAR_SET
  WORKOUT_COMPLETED       // futur : XP par session terminée
  LIKE_RECEIVED           // futur
  STREAK_BONUS            // futur
}

enum NotificationType {
  ACCOUNT_VALIDATED
  NEW_PRIVATE_MESSAGE
  NEW_SUPPORT_REPLY
  WORKOUT_LIKED
  WORKOUT_SAVED
  LEVEL_UP
  ADMIN_BROADCAST
}

// ────── USER & AUTH ──────
model User {
  id                    String     @id @default(cuid())
  email                 String     @unique
  username              String     @unique
  passwordHash          String
  role                  Role       @default(MEMBER)
  status                UserStatus @default(PENDING)
  emailVerifiedAt       DateTime?
  usernameChangesCount  Int        @default(0)
  usernameLocked        Boolean    @default(false)
  avatarUrl             String?
  bio                   String?    @db.Text
  createdAt             DateTime   @default(now())
  updatedAt             DateTime   @updatedAt
  lastLoginAt           DateTime?

  sessions               AuthSession[]
  workouts               Workout[]            @relation("WorkoutAuthor")
  workoutLikes           WorkoutLike[]
  workoutSaves           WorkoutSave[]
  workoutCategories      WorkoutCategory[]
  plannedSessions        PlannedSession[]
  workoutSessions        WorkoutSession[]
  bodyWeights            BodyWeightEntry[]
  xpEvents               XpEvent[]
  supportThreads         SupportThread[]
  supportMessages        SupportMessage[]     @relation("SupportSender")
  privateThreadsAsMember PrivateThread[]      @relation("MemberThreads")
  privateThreadsAsAdmin  PrivateThread[]      @relation("AdminThreads")
  privateMessages        PrivateMessage[]     @relation("PrivateSender")
  notifications          Notification[]

  @@index([status])
  @@index([role])
}

model AuthSession {
  id        String   @id
  userId    String
  expires   DateTime
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  id        String   @id @default(cuid())
  email     String
  token     String   @unique
  type      String   // "email_verify" | "password_reset"
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([email])
}

// ────── EXERCISES (admin) ──────
model MuscleGroup {
  id        String           @id @default(cuid())
  slug      String           @unique  // "chest", "back", "quads"…
  name      String                    // "Pectoraux"
  bodyPart  String                    // "upper" | "lower" | "core"
  exercises ExerciseMuscle[]
}

model Exercise {
  id               String                @id @default(cuid())
  name             String
  description      String?               @db.Text
  mediaUrl         String?               // GIF / image hébergé sur R2
  estimatedSeconds Int?
  isCardio         Boolean               @default(false)
  archivedAt       DateTime?             // soft delete pour préserver versions
  createdAt        DateTime              @default(now())

  muscles                 ExerciseMuscle[]
  workoutVersionExercises WorkoutVersionExercise[]
  sessionSets             SessionSet[]

  @@index([name])
  @@index([archivedAt])
}

model ExerciseMuscle {
  exerciseId    String
  muscleGroupId String
  isPrimary     Boolean @default(true)

  exercise    Exercise    @relation(fields: [exerciseId], references: [id], onDelete: Cascade)
  muscleGroup MuscleGroup @relation(fields: [muscleGroupId], references: [id], onDelete: Cascade)

  @@id([exerciseId, muscleGroupId])
}

// ────── WORKOUTS (versioned) ──────
model Workout {
  id             String            @id @default(cuid())
  authorId       String
  name           String
  description    String?           @db.Text
  visibility     WorkoutVisibility @default(PRIVATE)
  currentVersion Int               @default(1)
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt
  deletedAt      DateTime?

  author          User             @relation("WorkoutAuthor", fields: [authorId], references: [id], onDelete: Cascade)
  versions        WorkoutVersion[]
  likes           WorkoutLike[]
  saves           WorkoutSave[]
  sessions        WorkoutSession[]
  plannedSessions PlannedSession[]

  @@index([authorId])
  @@index([visibility, deletedAt])
}

model WorkoutVersion {
  id        String   @id @default(cuid())
  workoutId String
  version   Int
  name      String   // snapshot pour conserver l'identité historique
  createdAt DateTime @default(now())

  workout   Workout                  @relation(fields: [workoutId], references: [id], onDelete: Cascade)
  exercises WorkoutVersionExercise[]
  sessions  WorkoutSession[]

  @@unique([workoutId, version])
}

model WorkoutVersionExercise {
  id               String  @id @default(cuid())
  workoutVersionId String
  exerciseId       String
  orderIndex       Int
  targetSets       Int
  targetReps       String? // "8-12", "10", "AMRAP"
  targetWeightKg   Float?
  restSeconds      Int?
  notes            String?

  workoutVersion WorkoutVersion @relation(fields: [workoutVersionId], references: [id], onDelete: Cascade)
  exercise       Exercise       @relation(fields: [exerciseId], references: [id])

  @@index([workoutVersionId, orderIndex])
}

// ────── SOCIAL ──────
model WorkoutLike {
  workoutId String
  userId    String
  createdAt DateTime @default(now())

  workout Workout @relation(fields: [workoutId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([workoutId, userId])
  @@index([userId])
}

model WorkoutSave {
  workoutId String
  userId    String
  createdAt DateTime @default(now())

  workout Workout @relation(fields: [workoutId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([workoutId, userId])
  @@index([userId])
}

// ────── CALENDAR ──────
model WorkoutCategory {
  id        String   @id @default(cuid())
  userId    String
  name      String
  color     String   // hex code (#RRGGBB)
  isDefault Boolean  @default(false)
  createdAt DateTime @default(now())

  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  plannedSessions PlannedSession[]

  @@unique([userId, name])
}

model PlannedSession {
  id           String         @id @default(cuid())
  userId       String
  workoutId    String
  scheduledFor DateTime
  categoryId   String?
  notes        String?
  status       PlannedStatus  @default(SCHEDULED)
  sessionId    String?        @unique
  createdAt    DateTime       @default(now())

  user     User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  workout  Workout          @relation(fields: [workoutId], references: [id])
  category WorkoutCategory? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  session  WorkoutSession?  @relation(fields: [sessionId], references: [id])

  @@index([userId, scheduledFor])
  @@index([userId, status])
}

// ────── EXECUTION ──────
model WorkoutSession {
  id               String   @id @default(cuid())
  userId           String
  workoutId        String
  workoutVersionId String
  startedAt        DateTime @default(now())
  endedAt          DateTime?
  durationSec      Int?
  notes            String?

  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  workout        Workout         @relation(fields: [workoutId], references: [id])
  workoutVersion WorkoutVersion  @relation(fields: [workoutVersionId], references: [id])
  sets           SessionSet[]
  planned        PlannedSession?

  @@index([userId, startedAt])
  @@index([workoutId])
}

model SessionSet {
  id          String  @id @default(cuid())
  sessionId   String
  exerciseId  String
  setNumber   Int
  weightKg    Float?
  reps        Int?
  durationSec Int?    // pour cardio
  restSec     Int?
  completed   Boolean @default(true)

  session  WorkoutSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  exercise Exercise       @relation(fields: [exerciseId], references: [id])

  @@index([sessionId])
}

// ────── BODY METRICS ──────
model BodyWeightEntry {
  id         String   @id @default(cuid())
  userId     String
  weightKg   Float
  recordedAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, recordedAt])
}

// ────── XP ──────
model XpEvent {
  id        String      @id @default(cuid())
  userId    String
  type      XpEventType
  amount    Int
  metadata  Json?
  createdAt DateTime    @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@unique([userId, type], name: "uq_oneshot_per_type")
  // ↑ pour les events "one-shot" comme THREE_WORKOUTS_CREATED.
  //   Pour les events répétables (WORKOUT_COMPLETED), on retire la contrainte
  //   ou on l'applique conditionnellement via la logique applicative.
}

// ────── SUPPORT (membre → admin) ──────
model SupportThread {
  id            String       @id @default(cuid())
  userId        String
  subject       String
  status        ThreadStatus @default(OPEN)
  lastMessageAt DateTime     @default(now())
  createdAt     DateTime     @default(now())

  user     User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages SupportMessage[]

  @@index([userId])
  @@index([status, lastMessageAt])
}

model SupportMessage {
  id        String    @id @default(cuid())
  threadId  String
  senderId  String
  body      String    @db.Text
  readAt    DateTime?
  createdAt DateTime  @default(now())

  thread SupportThread @relation(fields: [threadId], references: [id], onDelete: Cascade)
  sender User          @relation("SupportSender", fields: [senderId], references: [id], onDelete: Cascade)

  @@index([threadId, createdAt])
}

// ────── PRIVATE MESSAGING (admin ↔ membre) ──────
model PrivateThread {
  id            String   @id @default(cuid())
  memberId      String
  adminId       String
  lastMessageAt DateTime @default(now())
  createdAt     DateTime @default(now())

  member   User             @relation("MemberThreads", fields: [memberId], references: [id], onDelete: Cascade)
  admin    User             @relation("AdminThreads", fields: [adminId], references: [id], onDelete: Cascade)
  messages PrivateMessage[]

  @@unique([memberId, adminId])
  @@index([memberId])
  @@index([adminId])
}

model PrivateMessage {
  id        String    @id @default(cuid())
  threadId  String
  senderId  String
  body      String    @db.Text
  readAt    DateTime?
  createdAt DateTime  @default(now())

  thread PrivateThread @relation(fields: [threadId], references: [id], onDelete: Cascade)
  sender User          @relation("PrivateSender", fields: [senderId], references: [id], onDelete: Cascade)

  @@index([threadId, createdAt])
}

// ────── NOTIFICATIONS ──────
model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  title     String
  body      String?
  url       String?
  readAt    DateTime?
  createdAt DateTime         @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, readAt])
}
```

### 4.3 Décisions de modélisation clés

| Décision | Raison |
|---|---|
| **Workouts versionnés** (`WorkoutVersion`) | Chaque édition crée une nouvelle version. Une `WorkoutSession` référence la version utilisée → stats historiques fiables, même si on modifie le template. |
| **`XpEvent` = audit trail** | XP cumulé calculé par `SUM(amount)`. Pas de désync possible. Une contrainte `@@unique([userId, type])` rend les events one-shot idempotents. |
| **Hard delete avec CASCADE** | Suppression compte = suppression totale des données associées. Conforme RGPD. |
| **Soft delete sur `Workout` et `Exercise`** | Préserve l'intégrité référentielle des sessions historiques tout en cachant le contenu. |
| **`status` séparé de `role`** | Un admin peut suspendre un compte sans toucher au rôle, et inversement. |
| **`WorkoutCategory` par user** | Catégories couleur perso. Seed quelques défauts (Push/Pull/Legs/Cardio/Full Body). |
| **`PrivateThread` unique par paire** | Une seule conversation persistante entre un membre et un admin. |
| **Index `(userId, createdAt)` partout** | Requêtes dashboard rapides. |

---

## 5. Système d'authentification

### 5.1 Stack

- **Auth.js v5** avec adapter Prisma personnalisé (pour les champs `status`, `usernameChangesCount`, etc.)
- **Credentials Provider** uniquement (pas de SSO)
- Sessions stockées en BDD (`AuthSession`), pas de JWT

### 5.2 Flux d'inscription

```
┌──────────┐    1. POST /register      ┌──────────────┐
│  Membre  │ ────────────────────────► │  Server      │
└──────────┘   email, username, pwd    │  Action      │
                                       └──────┬───────┘
                                              │ 2. validate Zod
                                              │ 3. hash bcrypt
                                              │ 4. createUser status=PENDING
                                              ▼
                                       ┌──────────────┐
                                       │  PostgreSQL  │
                                       └──────┬───────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │  Resend      │ ──► email admin
                                       │              │     "nouvelle inscription"
                                       └──────────────┘
                                       
┌──────────┐                           ┌──────────────┐
│  Admin   │ ── valide /admin/users ──►│ status=ACTIVE │
└──────────┘                           └──────┬───────┘
                                              ▼
                                       ┌──────────────┐
                                       │  Resend      │ ──► email membre
                                       │              │     "compte activé"
                                       └──────────────┘
                                              +
                                       create Notification
```

### 5.3 Règles métier

| Règle | Implémentation |
|---|---|
| Mot de passe : 10+ caractères, 1 maj, 1 chiffre | Zod `.refine()` + bcrypt cost 12 |
| Username : 3-20 chars, alphanumeric + `_-` | Zod regex |
| Modification username : 2 max par compte | `usernameChangesCount` incrémenté, bloqué si ≥ 2 ou `usernameLocked` |
| Admin peut débloquer pseudo | Toggle `usernameLocked = false` + reset compteur si voulu |
| Compte PENDING ne peut pas se login | `signIn` callback rejette si `status !== ACTIVE` |
| Email verification | Optionnelle, juste un bonus +50 XP. Token 24h via `VerificationToken` |
| Password reset | Token 1h, invalidation au usage. Email obligatoire avant reset. |

### 5.4 Middleware

```typescript
// src/middleware.ts (pseudo)
- Routes /admin/* : require session.user.role === 'ADMIN'
- Routes /(app)/* : require session && status === 'ACTIVE'
- Routes /(auth)/* : redirect si déjà loggé
```

---

## 6. Système XP & niveaux

### 6.1 Sources d'XP validées

| Événement | XP | Type | Idempotent |
|---|---|---|---|
| Avoir créé 3 séances | +50 | `THREE_WORKOUTS_CREATED` | Oui (one-shot) |
| Avoir vérifié son email | +50 | `EMAIL_VERIFIED` | Oui (one-shot) |
| Avoir uploadé un avatar | +25 | `AVATAR_SET` | Oui (one-shot) |

### 6.2 Sources d'XP à ajouter (proposition)

Sans XP récurrente, impossible d'atteindre les niveaux élevés. Proposition à valider :

| Événement | XP | Type |
|---|---|---|
| Terminer une séance | +20 | `WORKOUT_COMPLETED` |
| Recevoir un like sur une séance partagée | +5 | `LIKE_RECEIVED` |
| Série de 7 jours consécutifs avec ≥ 1 séance | +50 | `STREAK_BONUS` |

### 6.3 Calcul des niveaux

**Spécification** : 100 niveaux, palier 1 = 100 XP, palier 2 = 120 XP, croissance plus douce après le niveau 20.

**Formule proposée** (à calibrer avec usage réel) :

```typescript
// src/features/xp/levels.ts

export function getXpThreshold(level: number): number {
  if (level === 1) return 100;
  if (level === 2) return 120;
  
  // L3 → L20 : croissance progressive (+15 XP par niveau)
  if (level <= 20) {
    return 120 + (level - 2) * 15;
  }
  
  // L21 → L100 : croissance accélérée mais linéaire (+50 XP par niveau)
  const xpAtL20 = 120 + 18 * 15; // = 390
  return xpAtL20 + (level - 20) * 50;
}

export function getCumulativeXp(level: number): number {
  let total = 0;
  for (let i = 1; i <= level; i++) total += getXpThreshold(i);
  return total;
}

export function getLevelFromXp(totalXp: number): number {
  let level = 0;
  let cumul = 0;
  while (level < 100 && cumul + getXpThreshold(level + 1) <= totalXp) {
    cumul += getXpThreshold(level + 1);
    level++;
  }
  return level;
}
```

**Aperçu de la progression** :

| Niveau | XP palier | XP cumulé |
|---|---|---|
| 1 | 100 | 100 |
| 2 | 120 | 220 |
| 5 | 165 | 685 |
| 10 | 240 | 1 690 |
| 20 | 390 | 5 815 |
| 30 | 890 | 12 415 |
| 50 | 1 890 | 40 215 |
| 100 | 4 390 | 196 215 |

> ⚠️ Cette courbe est volontairement étirée pour faire du niveau 100 un objectif de plusieurs années d'utilisation régulière. À ajuster selon les premières observations d'usage.

### 6.4 Attribution

```typescript
// src/features/xp/service.ts (pseudo)

async function awardXp(userId, type, amount, metadata?) {
  // Tente d'insérer. Si one-shot déjà attribué, ignore.
  await prisma.xpEvent.upsert({
    where: { userId_type: { userId, type } },  // contrainte unique
    create: { userId, type, amount, metadata },
    update: {} // no-op
  });
  
  // Si level up, créer Notification LEVEL_UP
  const oldXp = ...; const newXp = ...;
  if (getLevelFromXp(newXp) > getLevelFromXp(oldXp)) {
    await createNotification(userId, 'LEVEL_UP', ...);
  }
}
```

Pour les events répétables (`WORKOUT_COMPLETED`), on retire la contrainte unique et on crée toujours un nouveau record.

### 6.5 Affichage

- Badge niveau visible sur l'avatar dans le profil
- Barre de progression XP sur le dashboard (`current XP / next threshold`)
- Page profil dédiée avec historique des XP gagnés

---

## 7. Modules fonctionnels

### 7.1 Bibliothèque d'exercices (admin-managed)

**Membre** : consulte la liste, recherche par nom/muscle, voit le GIF démonstratif.
**Admin** : CRUD complet via `/admin/exercises`.

Schéma : `Exercise` + `MuscleGroup` + `ExerciseMuscle` (n-n avec flag `isPrimary`).

Seed initial : ~50 exercices de base, 12 groupes musculaires.

### 7.2 Création / édition de séances

Workflow :
1. Choisir un nom + description
2. Ajouter des exercices depuis la bibliothèque
3. Définir séries / répétitions / repos cibles par exercice
4. Sauvegarder → crée une `WorkoutVersion` v1 + ses `WorkoutVersionExercise`

Édition d'une séance existante :
- Incrémente `currentVersion`
- Crée une nouvelle `WorkoutVersion` avec les nouveaux exercices
- Les `WorkoutSession` existantes pointent toujours vers l'ancienne version → stats préservées
- Les futures sessions utiliseront la version courante

### 7.3 Lancement d'une séance

```
/workouts/[id]/run

├── Wake Lock API activé (écran reste allumé)
├── Service worker prend les requêtes en queue si offline
├── Pour chaque exercice :
│   ├── Affichage série en cours
│   ├── Inputs : poids (kg), reps, ressenti optionnel
│   ├── Bouton "Série terminée" → démarre timer repos
│   └── Bouton "Exercice suivant"
└── Bouton "Terminer la séance" → POST endSession
    └── awardXp(WORKOUT_COMPLETED)
    └── update PlannedSession.status = COMPLETED si lien
```

### 7.4 Calendrier / planning

Vue mensuelle :
- Cases avec pastilles colorées (catégories) pour les jours planifiés
- Cases avec checkmark vert pour les jours exécutés
- Click sur un jour : détails + bouton "lancer maintenant"

Schéma :
- `PlannedSession` pour le futur
- `WorkoutSession` pour le passé
- Les deux peuvent être liés via `PlannedSession.sessionId`

### 7.5 Catégories couleur

Seed à l'inscription d'un nouveau membre :
- Push (#EF4444)
- Pull (#3B82F6)
- Legs (#10B981)
- Cardio (#F59E0B)
- Full Body (#8B5CF6)

L'user peut les modifier, supprimer, ou en ajouter dans ses paramètres.

### 7.6 Section Social

Flux des séances marquées `PUBLIC` par leurs auteurs.
- Card par séance : auteur, nom, nb exercices, durée moyenne, ♥ likes, 📌 saves
- Click → page détail (lecture seule)
- Boutons :
  - **♥ Like** : signale appréciation
  - **📌 Enregistrer** : ajoute à ma liste avec filtre "séances enregistrées"

Filtre sur `/workouts` : `Toutes` / `Mes séances` / `Séances enregistrées`.

Si l'auteur supprime sa séance ou la passe en `PRIVATE`, les saves restent en BDD mais affichent "Séance retirée" → on propose au user de supprimer son save.

### 7.7 Dashboard

Composants prévus :
- **Carte muscles** (BodyMap SVG) — couleurs selon volume travaillé (décision finale plus tard)
- **Graphique poids corporel** — chart line des `BodyWeightEntry`
- **Graphique volume hebdo** — sets × reps × poids agrégés par semaine
- **Compteur séances** — total + cette semaine
- **Streak** — jours consécutifs avec ≥ 1 séance
- **Mini-calendrier** — vue 30 derniers jours

### 7.8 Messagerie privée

Threads admin ↔ membre :
- Membre va dans `/messages` → liste threads, dernier message
- Click → vue conversation, composer un message
- Admin pareil dans `/admin/messages`
- Notification in-app à chaque nouveau message
- `readAt` mis à jour quand le destinataire ouvre le thread

### 7.9 Support / Contact

Différent des messages privés :
- Membre va dans `/support` → "Nouveau ticket" avec sujet + body
- Crée `SupportThread` + premier `SupportMessage`
- Admin voit tous les tickets ouverts dans `/admin/support`
- Réponses échangées dans le thread
- Admin peut fermer le ticket (`status = CLOSED`)

### 7.10 Espace admin

| Page | Fonctionnalités |
|---|---|
| `/admin/dashboard` | Stats globales : membres total/actifs/en attente, séances créées, etc. |
| `/admin/users` | Liste avec filtre status. Actions : valider, suspendre, débloquer pseudo, supprimer |
| `/admin/users/[id]` | Fiche complète + historique XP + liens vers ses séances |
| `/admin/exercises` | CRUD bibliothèque |
| `/admin/support` | Liste tickets, filtre OPEN/CLOSED |
| `/admin/messages` | Liste membres + bouton "Démarrer conversation" |

---

## 8. PWA & expérience mobile

### 8.1 Configuration

- **Serwist** comme service worker (next-pwa successor)
- `manifest.ts` : nom, theme color, icons (192/256/384/512), display `standalone`, orientation portrait
- Splash screens iOS via meta tags

### 8.2 Stratégies de cache

| Type de ressource | Stratégie |
|---|---|
| HTML pages | NetworkFirst (fallback cache offline) |
| JS/CSS Next chunks | CacheFirst (immutable) |
| Images / GIF exercices | CacheFirst (revalidate après 7j) |
| API routes | NetworkOnly (sauf bibliothèque exercices : SWR) |

### 8.3 Mode séance offline

Le scénario critique : un user lance sa séance en salle, le réseau coupe.

```
hook useOfflineQueue
├── POST sets / endSession :
│   ├── si online : envoi direct
│   └── si offline :
│       ├── push dans IndexedDB queue
│       └── BackgroundSync register
└── au retour online :
    └── flush queue dans l'ordre
```

### 8.4 Wake Lock

`useWakeLock()` actif pendant `/run` :
- Empêche l'écran de s'éteindre
- Released quand on quitte la page ou termine la séance

---

## 9. Stockage médias

### 9.1 Architecture

**Cloudflare R2** (S3-compatible) hébergé séparément du serveur app.

```
Buckets :
├── horion-avatars/        (avatars users, public read)
├── horion-exercises/      (GIF/images exercices, public read)
└── horion-backups/        (dumps DB, privé)
```

### 9.2 Upload flow

```
Client                Server                  R2
  │                     │                      │
  │ 1. POST /api/upload │                      │
  │    {filename,type}  │                      │
  │ ──────────────────► │                      │
  │                     │ 2. validate          │
  │                     │ 3. createPresignedPut │
  │                     │ ───────────────────► │
  │                     │ ◄─── signed URL ──── │
  │ ◄── signed URL ──── │                      │
  │                                            │
  │ 4. PUT signed URL ─────────────────────►   │
  │                                            │
  │ 5. POST /api/upload/complete               │
  │    {key, url}                              │
  │ ──────────────────► │                      │
  │                     │ 6. update User.avatarUrl
```

Validation côté serveur :
- MIME whitelist (`image/jpeg`, `image/png`, `image/webp`, `image/gif`)
- Taille max 2 Mo (avatars) / 5 Mo (GIF exercices)
- Dimensions max contrôlées via lib `sharp` au moment du resize

---

## 10. Notifications

### 10.1 Décision

**In-app uniquement** + emails pour événements critiques.

### 10.2 Événements

| Événement | In-app | Email |
|---|---|---|
| Compte validé par admin | ✓ | ✓ |
| Reset password demandé | — | ✓ |
| Email verify lien | — | ✓ |
| Nouvelle inscription (vers admin) | ✓ | ✓ |
| Nouveau message privé | ✓ | — |
| Nouvelle réponse support | ✓ | — |
| Séance likée | ✓ | — |
| Séance enregistrée | ✓ | — |
| Level up | ✓ | — |

### 10.3 UI in-app

- Cloche dans header avec badge count des unread
- Click → dropdown "5 dernières notifications" + lien "voir tout"
- Page `/notifications` : liste complète avec filtre lu/non-lu
- Click sur une notif → `markAsRead` + redirect vers `url`

### 10.4 Implémentation

```typescript
// src/features/notifications/service.ts

async function createNotification(userId, type, params) {
  await prisma.notification.create({ ... });
  
  if (isCriticalEmail(type)) {
    await sendEmail({
      to: user.email,
      template: emailTemplates[type],
      ...
    });
  }
}
```

Future amélioration : push notifications PWA (web-push) — pas dans le scope v1.

---

## 11. Déploiement & infrastructure

### 11.1 Architecture cible

```
┌─────────────────────────────────────────────────────┐
│  VPS Azurhost / Hostinger (Ubuntu 22.04 LTS)        │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ Docker Compose                                │   │
│  │                                                │   │
│  │  ┌────────────┐    ┌───────────────────────┐ │   │
│  │  │  nginx     │───►│  horion-app:latest    │ │   │
│  │  │  :80 :443  │    │  (Next.js, port 3000) │ │   │
│  │  └────────────┘    └───────────────────────┘ │   │
│  │       │                       │              │   │
│  │       │                       ▼              │   │
│  │       │              ┌──────────────┐        │   │
│  │       │              │  postgres:16 │        │   │
│  │       │              │  (volume)    │        │   │
│  │       │              └──────────────┘        │   │
│  │       │                                       │   │
│  │  ┌────▼─────┐                                 │   │
│  │  │ certbot  │ (renew Let's Encrypt)           │   │
│  │  └──────────┘                                 │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  cron: backup-db.sh → Cloudflare R2 (quotidien 4h)  │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌────────────────────┐
              │  Cloudflare R2     │
              │  ├─ avatars        │
              │  ├─ exercises      │
              │  └─ backups        │
              └────────────────────┘
```

### 11.2 docker-compose.yml (extrait)

```yaml
services:
  app:
    image: ghcr.io/<user>/horion:${IMAGE_TAG:-latest}
    restart: unless-stopped
    env_file: .env.production
    depends_on:
      db:
        condition: service_healthy
    networks: [internal]
    command: >
      sh -c "pnpm prisma migrate deploy && node server.js"

  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: horion
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: horion
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U horion"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks: [internal]

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports: ["80:80", "443:443"]
    volumes:
      - ./docker/nginx:/etc/nginx/conf.d:ro
      - certbot_certs:/etc/letsencrypt:ro
    depends_on: [app]
    networks: [internal, external]

  certbot:
    image: certbot/certbot
    volumes:
      - certbot_certs:/etc/letsencrypt
    command: >
      sh -c "trap exit TERM; while :; do
        certbot renew --quiet;
        sleep 12h;
      done"

volumes:
  postgres_data:
  certbot_certs:

networks:
  internal:
  external:
```

### 11.3 Dockerfile (multi-stage)

```dockerfile
# 1. Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# 2. Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm prisma generate && pnpm build

# 3. Runtime (standalone Next.js)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

### 11.4 Backups

- Cron quotidien (4h du matin)
- `pg_dump` → compression gzip → upload R2 dans `horion-backups/`
- Rétention : 30 jours, rotation auto
- Restore : script `restore-db.sh` qui télécharge un dump et le réinjecte

### 11.5 Variables d'environnement (`.env.production`)

```env
# Database
DATABASE_URL=postgresql://horion:***@db:5432/horion
DB_PASSWORD=***

# Auth
NEXTAUTH_URL=https://horion.example.com
NEXTAUTH_SECRET=***

# R2 Storage
R2_ACCOUNT_ID=***
R2_ACCESS_KEY_ID=***
R2_SECRET_ACCESS_KEY=***
R2_BUCKET_AVATARS=horion-avatars
R2_BUCKET_EXERCISES=horion-exercises
R2_BUCKET_BACKUPS=horion-backups
R2_PUBLIC_URL=https://cdn.horion.example.com

# Email
RESEND_API_KEY=***
EMAIL_FROM=Horion <noreply@horion.example.com>
ADMIN_EMAIL=elibrahimi.26@gmail.com

# Rate limit
UPSTASH_REDIS_REST_URL=***
UPSTASH_REDIS_REST_TOKEN=***
```

---

## 12. CI/CD

### 12.1 Pipeline GitHub Actions

**`.github/workflows/ci.yml`** (sur chaque push) :
- Install pnpm
- Lint (ESLint)
- Typecheck (`tsc --noEmit`)
- Tests unitaires (Vitest)
- Build Next.js (vérifie pas de breaking)

**`.github/workflows/deploy.yml`** (sur push main, après CI vert) :
1. Build image Docker
2. Push vers GHCR avec tag `latest` + `sha-<short>`
3. SSH dans le VPS :
   ```bash
   cd /opt/horion
   export IMAGE_TAG=sha-abc1234
   docker compose pull app
   docker compose up -d --no-deps app
   docker image prune -f
   ```
4. Healthcheck post-deploy via `/api/health`

### 12.2 Stratégie de branches

- `main` : production (auto-deploy)
- `dev` : intégration continue, déploiement vers env staging (futur)
- `feature/<nom>` : développement, PR vers `dev`

### 12.3 Rollback

```bash
docker compose pull app:<previous-tag>
docker compose up -d --no-deps app
```

Migrations Prisma : préférer les migrations **additives** (ajouter colonnes, pas en supprimer brutalement) pour faciliter rollback.

---

## 13. Sécurité

### 13.1 Couverture OWASP Top 10

| Risque | Mitigation |
|---|---|
| Injection SQL | Prisma (queries paramétrées) |
| Broken Authentication | Auth.js + bcrypt cost 12 + sessions DB |
| Sensitive Data Exposure | HTTPS partout, secrets en env vars, pas de logs PII |
| XML/XXE | N/A (pas de XML) |
| Broken Access Control | Middleware + checks role/owner sur chaque server action |
| Security Misconfiguration | Headers sécu via `next.config.mjs`, CSP stricte |
| XSS | React échappe par défaut, pas de `dangerouslySetInnerHTML` sans `DOMPurify` |
| Insecure Deserialization | Zod valide tout en entrée |
| Vulnerable Dependencies | Dependabot + `pnpm audit` en CI |
| Insufficient Logging | Logs structurés (pino) + alerting basique |

### 13.2 Headers sécurité (next.config.mjs)

```javascript
headers: [
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Content-Security-Policy', value: "default-src 'self'; img-src 'self' https://cdn.horion.example.com data:; ..." },
]
```

### 13.3 Rate limiting

Via `@upstash/ratelimit` (Redis serverless gratuit jusqu'à 10k req/jour) :

| Endpoint | Limite |
|---|---|
| `/api/auth/login` | 5 / 15 min / IP |
| `/api/auth/register` | 3 / heure / IP |
| `/api/upload` | 10 / minute / userId |
| `/support` create | 5 / heure / userId |

### 13.4 RGPD

- Page `/profile/settings` :
  - Bouton "Exporter mes données" → ZIP JSON de toutes les tables liées
  - Bouton "Supprimer mon compte" → confirmation + hard delete CASCADE
- Privacy policy + ToS accessibles publiquement
- Aucun tracker externe (pas de GA), métriques internes uniquement

---

## 14. Performance & scalabilité

### 14.1 Cible

10 utilisateurs actifs. Pas de scaling horizontal nécessaire à court terme.

### 14.2 Optimisations natives Next.js

- React Server Components partout où possible
- Streaming SSR avec Suspense
- Images optimisées via `next/image` + R2
- Code splitting par route automatique

### 14.3 Base de données

- Connection pooling via PgBouncer (futur si besoin)
- Index sur toutes les FK + colonnes filtrées
- Pas d'ORM N+1 (Prisma `include` + `select` explicites)

### 14.4 Monitoring (v1 minimal)

- `/api/health` endpoint pour les checks
- Logs applicatifs vers stdout (Docker logs)
- Sentry optionnel pour erreurs front/back (futur)

---

## 15. Roadmap de développement

### Sprint 0 — Setup (1-2j)
- [ ] Init repo `horion`
- [ ] Boilerplate Next.js 14 + TS + Tailwind + shadcn/ui
- [ ] Setup Prisma + PostgreSQL local
- [ ] Setup Auth.js v5 + Credentials provider
- [ ] Dockerfile + docker-compose.dev.yml
- [ ] GitHub Actions CI (lint, typecheck, build)
- [ ] Validation env vars (Zod)

### Sprint 1 — Auth & utilisateurs (3-5j)
- [ ] Pages login / register / forgot / reset
- [ ] Server actions auth + validation Zod
- [ ] Workflow validation admin (status PENDING → ACTIVE)
- [ ] Emails transactionnels (Resend)
- [ ] Middleware protection routes
- [ ] Pages /profile + /profile/settings de base
- [ ] Username modif 2 fois max

### Sprint 2 — Bibliothèque & séances (5-7j)
- [ ] Seed initial (50 exercices, 12 muscles)
- [ ] Admin CRUD exercices
- [ ] Pages /library (membre, lecture seule)
- [ ] Page /workouts (liste avec filtre mes/enregistrées)
- [ ] Création séance + versioning
- [ ] Édition séance (crée nouvelle version)

### Sprint 3 — Exécution & PWA (5-7j)
- [ ] Page /workouts/[id]/run
- [ ] Timer, rest timer, set inputs
- [ ] Service worker (Serwist)
- [ ] Manifest PWA + icons
- [ ] Wake Lock
- [ ] Offline queue (IndexedDB)

### Sprint 4 — Calendrier & XP (3-5j)
- [ ] Catégories couleur (seed defaults)
- [ ] Page /calendar (vue mois)
- [ ] PlannedSession (planifier)
- [ ] Système XP (one-shot events)
- [ ] LevelBadge + barre progression
- [ ] Notification LEVEL_UP

### Sprint 5 — Social (3-4j)
- [ ] Page /social (flux séances PUBLIC)
- [ ] Like / Save
- [ ] Filtres /workouts (mes/enregistrées)
- [ ] Notifications WORKOUT_LIKED / SAVED

### Sprint 6 — Dashboard (4-5j)
- [ ] Composants charts (Recharts ou similaire)
- [ ] BodyMap SVG (à designer)
- [ ] Stats hebdo
- [ ] Streak
- [ ] Body weight entries + chart

### Sprint 7 — Messagerie & support (3-4j)
- [ ] Private threads admin ↔ membre
- [ ] Support tickets
- [ ] UI conversations
- [ ] Notifications NEW_PRIVATE_MESSAGE / NEW_SUPPORT_REPLY

### Sprint 8 — Admin & finitions (3-4j)
- [ ] /admin/dashboard
- [ ] /admin/users avec actions
- [ ] /admin/messages
- [ ] /admin/support
- [ ] Page export données RGPD
- [ ] Suppression compte

### Sprint 9 — Déploiement prod (2-3j)
- [ ] Provisioning VPS
- [ ] docker-compose.prod.yml
- [ ] Nginx + Certbot
- [ ] Cron backups
- [ ] GitHub Actions deploy
- [ ] DNS + domaine
- [ ] Premier déploiement

**Total estimé : 32-46 jours de dev** (peut être lissé selon disponibilités).

---

## 16. Points ouverts

À trancher au moment opportun :

| # | Sujet | Échéance |
|---|---|---|
| 1 | Carte muscles : SVG custom ou lib externe ? Niveau de détail ? | Sprint 6 |
| 2 | Calibration finale de la courbe XP (basée sur usage réel) | Post-launch |
| 3 | Push notifications PWA (web-push) | v2 |
| 4 | Mode sombre/clair switch user | v1 ou v2 |
| 5 | Export historique séances en CSV | v2 |
| 6 | Stats moyennes : par séance ou par exercice global ? | Sprint 6 |
| 7 | Domaine final (horion.fr ? .app ?) | Sprint 9 |
| 8 | Logo / identité visuelle | Sprint 0-1 |
| 9 | Liste détaillée des likers visible par l'auteur seulement ? | Sprint 5 |
| 10 | Mode "coach" : admin assigne séances à un membre ? | v2 |

---

## Annexes

### A. Commandes utiles dev

```bash
# Setup local
pnpm install
docker compose -f docker/docker-compose.dev.yml up -d
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev

# Migrations
pnpm prisma migrate dev --name <feature_name>
pnpm prisma studio  # GUI base de données

# Tests
pnpm test           # unit
pnpm test:e2e       # Playwright

# Build & check
pnpm lint
pnpm typecheck
pnpm build
```

### B. Conventions de code

- **Naming** : `camelCase` variables, `PascalCase` composants, `SCREAMING_SNAKE` constantes
- **Imports** : absolus via `@/` (configuré dans tsconfig)
- **Server actions** : suffixe `Action`, ex: `createWorkoutAction`
- **Server components par défaut**, `'use client'` uniquement si nécessaire
- **Pas de barrel files** (`index.ts` qui re-export tout) — imports directs
- **Pas de classes** sauf nécessité (préfère fonctions pures)

### C. Stratégie de tests

- **Unit (Vitest)** : services, utils, formules XP, validateurs Zod
- **E2E (Playwright)** : 
  - Flow inscription → validation admin → login
  - Création séance → exécution → consultation historique
  - Partage social → like / save par autre user

Pas d'obsession sur la couverture, focus sur les flows critiques.

---

*Document vivant — à mettre à jour au fil des décisions et de l'évolution du projet.*
