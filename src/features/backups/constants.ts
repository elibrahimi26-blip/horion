export const BACKUP_DIR = process.env.BACKUP_DIR ?? "/app/backups";
export const BACKUP_RETENTION = Number(process.env.BACKUP_RETENTION ?? 7);
export const BACKUP_PREFIX = "horion";

// pg_dump --clean --if-exists émet des DROP/CREATE idempotents qui suffisent
// pour la plupart des restores. On ajoute en plus un DROP SCHEMA explicite
// avant pour repartir d'une base totalement vierge.
export const RESTORE_CONFIRM_TOKEN = "RESTORE";
