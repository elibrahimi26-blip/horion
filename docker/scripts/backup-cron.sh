#!/bin/sh
# ─────────────────────────────────────────────────────────────
# Sauvegarde automatique de la base Horion + rétention.
# Lancé chaque jour à 03:00 par crond (cf. backup-cron.Dockerfile).
#
# Variables attendues (depuis compose.yaml) :
#   PGHOST, PGUSER, PGPASSWORD, PGDATABASE
#   BACKUP_RETENTION  (défaut 7)
# ─────────────────────────────────────────────────────────────
set -eu

BACKUP_DIR="/backups"
RETENTION="${BACKUP_RETENTION:-7}"
TS=$(date -u +%Y-%m-%dT%H-%M-%SZ)
NAME="horion-auto-${TS}.sql.gz"
TMP="${BACKUP_DIR}/.${NAME}.tmp"
FINAL="${BACKUP_DIR}/${NAME}"

mkdir -p "${BACKUP_DIR}"

echo "[$(date -Iseconds)] Starting backup → ${NAME}"

if pg_dump --no-owner --no-privileges --clean --if-exists | gzip -9 > "${TMP}"; then
  mv "${TMP}" "${FINAL}"
  SIZE=$(stat -c%s "${FINAL}")
  echo "[$(date -Iseconds)] Backup OK (${SIZE} bytes)"
else
  rm -f "${TMP}"
  echo "[$(date -Iseconds)] Backup FAILED" >&2
  exit 1
fi

# Rétention : on ne touche qu'aux backups "auto", jamais aux "manual".
# Les plus anciens au-delà de RETENTION sont supprimés.
echo "[$(date -Iseconds)] Applying retention (keep ${RETENTION} auto backups)"
ls -1t "${BACKUP_DIR}"/horion-auto-*.sql.gz 2>/dev/null | tail -n "+$((RETENTION + 1))" | while IFS= read -r old; do
  echo "  rm ${old}"
  rm -f "${old}"
done

echo "[$(date -Iseconds)] Done"
