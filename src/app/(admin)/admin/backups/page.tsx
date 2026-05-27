import { BackupCreateButton } from "@/components/admin/backup-create-button";
import { BackupRestoreForm } from "@/components/admin/backup-restore-form";
import { BackupRow } from "@/components/admin/backup-row";
import { BACKUP_DIR, BACKUP_RETENTION } from "@/features/backups/constants";
import { listBackups } from "@/features/backups/service";

export const dynamic = "force-dynamic";

export default async function AdminBackupsPage() {
  const backups = await listBackups();
  const autos = backups.filter((b) => b.trigger === "auto");
  const manuals = backups.filter((b) => b.trigger === "manual");
  const totalSize = backups.reduce((acc, b) => acc + b.size, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Sauvegardes</h2>
          <p className="text-sm text-muted-foreground">
            Dossier : <code>{BACKUP_DIR}</code> · Rétention auto :{" "}
            {BACKUP_RETENTION} dernières · Cron : tous les jours à 03:00
          </p>
        </div>
        <BackupCreateButton />
      </div>

      <section className="rounded-md border p-4">
        <h3 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">
          Stats
        </h3>
        <ul className="text-sm">
          <li>
            Total : <strong>{backups.length}</strong> fichier(s) ·{" "}
            {(totalSize / (1024 * 1024)).toFixed(1)} MB cumulés
          </li>
          <li>
            Automatiques : <strong>{autos.length}</strong> · Manuelles :{" "}
            <strong>{manuals.length}</strong>
          </li>
        </ul>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
          Manuelles ({manuals.length})
        </h3>
        {manuals.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune sauvegarde manuelle. Clique sur « Sauvegarder maintenant ».
          </p>
        ) : (
          <div className="space-y-2">
            {manuals.map((b) => (
              <BackupRow key={b.name} backup={b} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
          Automatiques ({autos.length})
        </h3>
        {autos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune sauvegarde automatique encore. La première sera générée à
            03:00 par le service <code>backup-cron</code>.
          </p>
        ) : (
          <div className="space-y-2">
            {autos.map((b) => (
              <BackupRow key={b.name} backup={b} />
            ))}
          </div>
        )}
      </section>

      <section>
        <BackupRestoreForm />
      </section>
    </div>
  );
}
