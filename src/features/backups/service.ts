import { spawn } from "node:child_process";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createGunzip, createGzip } from "node:zlib";
import { pipeline } from "node:stream/promises";
import { BACKUP_DIR, BACKUP_PREFIX, BACKUP_RETENTION } from "./constants";
import type { BackupInfo } from "./state";

// On lit DATABASE_URL via process.env directement (pas via @/lib/env) pour
// éviter de déclencher la validation Zod au moment où Next.js bundle ce
// module pendant la phase "Collecting page data" du build (où les vars
// d'env ne sont pas dispo).
function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquante");
  return url;
}

const FILE_RE = new RegExp(`^${BACKUP_PREFIX}-(manual|auto)-[0-9TZ-]+\\.sql\\.gz$`);

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-").replace(/-\d+Z$/, "Z");
}

function pgEnv(): NodeJS.ProcessEnv {
  return { ...process.env, PGCONNECT_TIMEOUT: "10" };
}

export function assertSafeBackupName(name: string): void {
  if (!FILE_RE.test(name)) {
    throw new Error("Nom de sauvegarde invalide");
  }
}

async function ensureDir(): Promise<void> {
  await mkdir(BACKUP_DIR, { recursive: true });
}

export async function listBackups(): Promise<BackupInfo[]> {
  await ensureDir();
  const entries = await readdir(BACKUP_DIR);
  const files = await Promise.all(
    entries
      .filter((n) => FILE_RE.test(n))
      .map(async (name) => {
        const s = await stat(path.join(BACKUP_DIR, name));
        const trigger = name.includes("-auto-") ? "auto" : "manual";
        return {
          name,
          size: s.size,
          createdAt: s.mtime,
          trigger: trigger as BackupInfo["trigger"],
        };
      }),
  );
  return files.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getBackupPath(name: string): Promise<string> {
  assertSafeBackupName(name);
  const full = path.join(BACKUP_DIR, name);
  await stat(full);
  return full;
}

export async function deleteBackup(name: string): Promise<void> {
  const full = await getBackupPath(name);
  await unlink(full);
}

export async function createBackup(
  trigger: "manual" | "auto" = "manual",
): Promise<BackupInfo> {
  await ensureDir();
  const name = `${BACKUP_PREFIX}-${trigger}-${timestamp()}.sql.gz`;
  const partial = path.join(BACKUP_DIR, `.${name}.tmp`);
  const final = path.join(BACKUP_DIR, name);

  // pg_dump --clean --if-exists ajoute DROP TABLE IF EXISTS avant chaque
  // CREATE, ce qui rend les dumps rejouables sans wipe préalable.
  const dump = spawn(
    "pg_dump",
    [
      "--no-owner",
      "--no-privileges",
      "--clean",
      "--if-exists",
      databaseUrl(),
    ],
    { env: pgEnv() },
  );

  let stderr = "";
  dump.stderr.on("data", (chunk: Buffer) => {
    stderr += chunk.toString();
  });

  try {
    await pipeline(dump.stdout, createGzip(), createWriteStream(partial));
    const code: number = await new Promise((resolve) => dump.on("close", resolve));
    if (code !== 0) {
      throw new Error(`pg_dump a échoué (code ${code}): ${stderr.slice(0, 500)}`);
    }
    await rename(partial, final);
  } catch (err) {
    await unlink(partial).catch(() => {});
    throw err;
  }

  const stats = await stat(final);
  return {
    name,
    size: stats.size,
    createdAt: stats.mtime,
    trigger,
  };
}

export async function applyRetention(
  keep: number = BACKUP_RETENTION,
): Promise<number> {
  if (!Number.isFinite(keep) || keep < 1) return 0;
  const backups = await listBackups();
  const autos = backups.filter((b) => b.trigger === "auto");
  const stale = autos.slice(keep);
  await Promise.all(
    stale.map((b) => unlink(path.join(BACKUP_DIR, b.name)).catch(() => {})),
  );
  return stale.length;
}

// Restore : wipe schéma + applique le dump compressé. L'app peut continuer
// à pointer sur la même connexion Prisma — les nouvelles requêtes verront
// l'état restauré. La session admin reste valide tant que l'utilisateur
// existe encore après restore (sinon il sera kické au prochain refresh).
export async function restoreBackup(absolutePath: string): Promise<void> {
  await wipeSchema();
  await applyDump(absolutePath);
}

async function wipeSchema(): Promise<void> {
  await runPsql(
    "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO PUBLIC;",
  );
}

function runPsql(sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const psql = spawn(
      "psql",
      ["--quiet", "--no-psqlrc", "-v", "ON_ERROR_STOP=1", "-c", sql, databaseUrl()],
      { env: pgEnv() },
    );
    let stderr = "";
    psql.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    psql.on("error", reject);
    psql.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`psql a échoué (code ${code}): ${stderr.slice(0, 500)}`));
      } else {
        resolve();
      }
    });
  });
}

async function applyDump(absolutePath: string): Promise<void> {
  const psql = spawn(
    "psql",
    ["--quiet", "--no-psqlrc", "-v", "ON_ERROR_STOP=1", databaseUrl()],
    { env: pgEnv() },
  );

  let stderr = "";
  psql.stderr.on("data", (chunk: Buffer) => {
    stderr += chunk.toString();
  });

  await pipeline(createReadStream(absolutePath), createGunzip(), psql.stdin);
  const code: number = await new Promise((resolve) => psql.on("close", resolve));
  if (code !== 0) {
    throw new Error(`psql restore a échoué (code ${code}): ${stderr.slice(0, 500)}`);
  }
}

// Écrit un Buffer (upload utilisateur) dans BACKUP_DIR avec un nom safe.
// Retourne le chemin absolu.
export async function persistUpload(
  data: Uint8Array,
  originalName: string,
): Promise<string> {
  await ensureDir();
  // Si l'utilisateur ré-upload un fichier qui suit notre convention, on
  // garde le nom original. Sinon on en génère un.
  const safeName = FILE_RE.test(originalName)
    ? originalName
    : `${BACKUP_PREFIX}-manual-${timestamp()}.sql.gz`;
  const full = path.join(BACKUP_DIR, safeName);
  await writeFile(full, data);
  return full;
}
