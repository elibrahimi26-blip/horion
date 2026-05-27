#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# Setup initial du VPS pour Horion.
# À exécuter UNE SEULE FOIS, en root, juste après s'être connecté
# au VPS fraîchement provisionné.
#
# Usage :
#   bash setup-vps.sh
#
# Ce script installe Docker, configure le firewall UFW, et prépare
# le VPS à recevoir Horion. Il ne touche pas au code de l'app — le
# clone du repo se fait dans une étape suivante.
# ─────────────────────────────────────────────────────────────────

set -e

if [ "$(id -u)" -ne 0 ]; then
  echo "❌ Ce script doit être exécuté en root (ou avec sudo)."
  exit 1
fi

echo ""
echo "🔧 Setup VPS Horion"
echo "═══════════════════"

# 1. Mise à jour système
echo ""
echo "→ Mise à jour du système (peut prendre 1-2 min)…"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq

# 2. Outils de base
echo ""
echo "→ Installation des outils de base (git, curl, ufw)…"
apt-get install -y -qq git curl ca-certificates ufw

# 3. Docker via le script officiel
if ! command -v docker &>/dev/null; then
  echo ""
  echo "→ Installation de Docker…"
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
else
  echo ""
  echo "→ Docker déjà installé ($(docker --version))"
fi

# 4. Firewall : SSH, HTTP, HTTPS uniquement
echo ""
echo "→ Configuration du firewall…"
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw allow OpenSSH >/dev/null
ufw allow 80/tcp comment 'HTTP (Caddy)' >/dev/null
ufw allow 443/tcp comment 'HTTPS (Caddy)' >/dev/null
ufw allow 443/udp comment 'HTTP/3 (Caddy)' >/dev/null
ufw --force enable

# 5. Désactive Apache/Nginx s'ils tournent (libère ports 80/443)
for svc in apache2 nginx; do
  if systemctl is-active --quiet $svc 2>/dev/null; then
    echo "→ Désactivation de $svc…"
    systemctl stop $svc
    systemctl disable $svc
  fi
done

echo ""
echo "✅ Setup VPS terminé"
echo ""
echo "Prochaines étapes :"
echo "  1.  git clone https://github.com/elibrahimi26-blip/horion.git /opt/horion"
echo "  2.  cd /opt/horion"
echo "  3.  cp .env.production.example .env.production"
echo "  4.  nano .env.production  (remplir les valeurs — voir DEPLOYMENT.md)"
echo "  5.  docker compose up -d"
echo "  6.  Attendre 30s puis ouvrir https://<ton DOMAIN>"
echo ""
