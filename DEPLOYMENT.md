# Guide de déploiement Horion

Mise en ligne d'Horion sur un VPS AzurHost TITAN 4 (Ubuntu) avec SSL automatique
via Caddy + sslip.io, et déploiement continu via GitHub Actions.

> **Pré-requis** : tu as commandé un VPS TITAN 4 chez AzurHost et reçu par email
> son IP publique + un mot de passe root (ou un accès SSH).

---

## Vue d'ensemble

Le déploiement se fait en **3 phases** :

1. **Setup initial du VPS** (~15 min) — Installation Docker, firewall, clone du repo
2. **Premier déploiement** (~10 min) — Configuration des secrets + lancement
3. **CI/CD GitHub Actions** (~5 min) — Auto-déploiement à chaque push sur `main`

À la fin tu accèdes à Horion via `https://horion.<TON-IP>.sslip.io` avec un vrai
certificat SSL gratuit.

---

## Phase 1 — Setup initial du VPS

### 1.1 Se connecter au VPS en SSH

Sur ton ordi, ouvre un terminal (Terminal sur Mac, PowerShell sur Windows, ou
n'importe quel shell Linux) :

```bash
ssh root@TON-IP
```

Remplace `TON-IP` par l'IP du VPS reçue par AzurHost (ex : `91.234.5.6`).
Tape le mot de passe quand demandé. Il ne s'affiche pas (normal).

À la première connexion, accepte la clé du serveur en tapant `yes`.

### 1.2 Cloner le dépôt Horion

```bash
git clone https://github.com/elibrahimi26-blip/horion.git /opt/horion
cd /opt/horion
```

> Si la branche par défaut n'est pas encore `main`, demande-moi de merger.

### 1.3 Lancer le script de setup

```bash
bash docker/scripts/setup-vps.sh
```

Ça prend 1-2 minutes. Le script installe Docker, configure le firewall UFW
(autorise SSH, HTTP, HTTPS uniquement) et désactive les services qui
pourraient squatter les ports 80/443.

---

## Phase 2 — Premier déploiement

### 2.1 Préparer le fichier `.env`

> ⚠️ Le fichier doit s'appeler `.env` (pas `.env.production`) : c'est le seul
> nom que Docker Compose lit automatiquement pour résoudre les variables
> `${DB_PASSWORD}`, `${DOMAIN}` etc. présentes dans `compose.yaml`.

```bash
cp .env.production.example .env
nano .env
```

L'éditeur `nano` s'ouvre. Voici les valeurs à remplir (les autres champs
peuvent rester vides pour l'instant) :

| Variable | Quoi y mettre | Comment l'obtenir |
|---|---|---|
| `DOMAIN` | `horion.91-234-5-6.sslip.io` | Remplace les `.` de ton IP par des `-` |
| `NEXTAUTH_URL` | `https://horion.91-234-5-6.sslip.io` | Idem mais en URL https |
| `DB_PASSWORD` | un mot de passe aléatoire 32 caractères | Voir commande ci-dessous |
| `DATABASE_URL` | `postgresql://horion:LE-MEME-MOT-DE-PASSE@db:5432/horion?schema=public` | Le mot de passe doit être **identique** à `DB_PASSWORD` |
| `NEXTAUTH_SECRET` | un secret aléatoire base64 | Voir commande ci-dessous |
| `ADMIN_EMAIL` | ton email personnel | Sert pour Let's Encrypt + notifications admin |

Pour générer le mot de passe DB :
```bash
openssl rand -hex 16
```

Pour générer le secret Auth.js :
```bash
openssl rand -base64 32
```

Lance chacune dans un autre onglet SSH (ou note les valeurs), puis colle-les
dans nano. Pour sauver dans nano : `Ctrl+O` puis `Entrée` puis `Ctrl+X`.

### 2.2 Lancer la stack Docker

```bash
docker compose up -d
```

Première exécution = build de l'image, ça prend **2-5 minutes** (téléchargement
+ install des dépendances + compile Next.js).

### 2.3 Vérifier que tout tourne

```bash
docker compose ps
```

Tu dois voir 3 conteneurs en `running` ou `healthy` :
- `horion-db`
- `horion-app`
- `horion-caddy`

Si l'un est en `restarting`, regarde ses logs :
```bash
docker compose logs app   # ou db, ou caddy
```

### 2.4 Ouvrir le site

Dans ton navigateur, va sur :
```
https://horion.91-234-5-6.sslip.io
```
(avec tes vraies valeurs)

Caddy va générer un certificat SSL **automatiquement** au premier accès (10-30
secondes). Tu devrais voir la page d'accueil Horion avec le cadenas vert.

### 2.5 Te promouvoir admin

Ouvre `/register` sur le site et inscris-toi avec l'email qui est dans
`ADMIN_EMAIL`. Tu seras en `PENDING` (en attente de validation).

Reviens sur le VPS et exécute :
```bash
docker compose exec db psql -U horion -d horion -c \
  "UPDATE \"User\" SET role='ADMIN', status='ACTIVE' WHERE email='ton.email@gmail.com';"
```

Recharge la page et connecte-toi : tu es admin actif. Tu peux maintenant
valider les inscriptions de tes amis depuis `/admin/users`.

---

## Phase 3 — Auto-déploiement via GitHub Actions

Configure ceci pour que chaque mise à jour du code se déploie toute seule
sur le VPS.

### 3.1 Générer une paire de clés SSH dédiée

Sur le VPS (toujours en SSH) :

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/horion_deploy -N ""
cat ~/.ssh/horion_deploy.pub >> ~/.ssh/authorized_keys
```

### 3.2 Récupérer la clé privée

```bash
cat ~/.ssh/horion_deploy
```

Copie **tout** ce qui s'affiche (de `-----BEGIN OPENSSH PRIVATE KEY-----` jusqu'à
`-----END OPENSSH PRIVATE KEY-----` inclus).

### 3.3 Ajouter les secrets sur GitHub

Va sur https://github.com/elibrahimi26-blip/horion/settings/secrets/actions

Crée 3 secrets :

| Nom du secret | Valeur |
|---|---|
| `VPS_HOST` | l'IP de ton VPS (ex : `91.234.5.6`) |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY` | colle ici la clé privée copiée à l'étape 3.2 |

### 3.4 Tester

À ta prochaine modification du code (poussée sur `main`), le workflow
s'exécute automatiquement. Tu peux suivre dans l'onglet **Actions** du repo.

---

## Référence : commandes de maintenance

À exécuter en SSH sur le VPS depuis `/opt/horion`.

| Action | Commande |
|---|---|
| Voir les logs en direct | `docker compose logs -f` |
| Logs de l'app seulement | `docker compose logs -f app` |
| Redémarrer tout | `docker compose restart` |
| Redémarrer juste l'app | `docker compose restart app` |
| Arrêter tout | `docker compose down` |
| Démarrer | `docker compose up -d` |
| Pull + rebuild + restart (mise à jour manuelle) | `git pull && docker compose up -d --build` |
| Backup manuel de la base | `docker compose exec -T db pg_dump -U horion horion > backup-$(date +%Y%m%d).sql` |
| Restore d'un backup | `cat backup.sql \| docker compose exec -T db psql -U horion horion` |
| Console Prisma (Studio) | Pas utilisable en prod, faire un dump + Studio en local |
| Console psql | `docker compose exec db psql -U horion -d horion` |
| Voir la conso CPU/RAM | `docker stats` |

---

## Référence : troubleshooting

### Caddy n'arrive pas à obtenir le certificat SSL

**Symptômes** : `https://...` ne fonctionne pas, ou le navigateur dit "Not secure".

Causes possibles :
- DNS pas encore propagé (rare avec sslip.io qui est instantané)
- Ports 80/443 bloqués par le firewall AzurHost (vérifier l'espace client)
- `DOMAIN` mal formé dans `.env`

Vérification :
```bash
docker compose logs caddy | grep -i "error\|certificate"
```

### L'app ne démarre pas

```bash
docker compose logs app
```

Causes fréquentes :
- `DATABASE_URL` ne pointe pas sur `db` (le nom du service) — doit contenir `@db:5432`
- `NEXTAUTH_SECRET` trop court (min 32 caractères)
- Migration Prisma échoue → regarde les logs pour le message exact

### La base de données est corrompue

Restore depuis le backup AzurHost (7 jours glissants) via leur espace client.

Ou si tu as des backups locaux :
```bash
docker compose down
docker volume rm horion_postgres_data
docker compose up -d db
sleep 10
cat dernier-backup.sql | docker compose exec -T db psql -U horion -d horion
docker compose up -d app caddy
```

### Le déploiement GitHub Actions échoue

Regarde les logs dans l'onglet Actions du repo GitHub. Causes classiques :
- Secret `VPS_SSH_KEY` mal formaté (vérifier qu'il commence par `-----BEGIN` et finit par `-----END` avec un newline final)
- Le VPS a redémarré son adresse IP (rare avec AzurHost)
- Disque plein côté VPS — `df -h` pour vérifier, `docker system prune -a` pour nettoyer

---

## Récap : ce qui est gratuit / payant

| Service | Coût | Pour quoi faire |
|---|---|---|
| VPS AzurHost TITAN 4 | 4,99 €/mois | Faire tourner Horion |
| Domaine sslip.io | 0 € | URL temporaire |
| Domaine `.fr` (plus tard) | ~10 €/an | URL définitive |
| Cloudflare R2 (plus tard) | 0 €/mois jusqu'à 10 Go | Stockage avatars/GIF |
| Resend (plus tard) | 0 €/mois jusqu'à 3000 emails | Emails transactionnels |
| Upstash Redis (plus tard) | 0 €/mois jusqu'à 10k req/jour | Rate limiting auth |
| **Total démarrage** | **5 €/mois** | |
| **Total avec domaine** | **6 €/mois** | |

---

## Étapes suivantes après le déploiement

- [ ] Tester l'inscription depuis un autre navigateur / mode incognito
- [ ] Tester la création d'une séance + son exécution + le mode offline
- [ ] (optionnel) Acheter un vrai domaine + mettre à jour `DOMAIN` dans `.env`
- [ ] (optionnel) Configurer Resend pour les emails transactionnels
- [ ] (optionnel) Configurer Cloudflare R2 pour les uploads d'avatar
- [ ] Inviter les premiers membres du groupe

---

*En cas de blocage, reviens vers moi avec les logs (`docker compose logs`) ou
le message d'erreur exact.*
