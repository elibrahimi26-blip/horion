"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  deleteBackupAction,
  restoreFromExistingAction,
} from "@/features/backups/actions";
import type { BackupInfo } from "@/features/backups/state";

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function BackupRow({ backup }: { backup: BackupInfo }) {
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!confirm(`Supprimer ${backup.name} ? Cette action est irréversible.`)) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteBackupAction(backup.name);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Erreur");
      }
    });
  }

  function onRestore() {
    const token = prompt(
      `Restaurer depuis ${backup.name} ?\n\n` +
        "⚠ Toutes les données actuelles seront REMPLACÉES par celles du dump.\n" +
        "Si ton compte admin n'existe pas dans cette sauvegarde, tu seras " +
        "déconnecté et il faudra te re-promouvoir via SSH.\n\n" +
        'Pour confirmer, tape "RESTORE" exactement :',
    );
    if (token == null) return;
    startTransition(async () => {
      try {
        await restoreFromExistingAction(backup.name, token);
        alert("Restauration terminée. Recharge la page.");
      } catch (err) {
        alert(err instanceof Error ? err.message : "Erreur");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border p-4">
      <div className="space-y-1">
        <p className="font-mono text-sm">
          {backup.name}
          {backup.trigger === "auto" ? (
            <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              auto
            </span>
          ) : (
            <span className="ml-2 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
              manuelle
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {dateFmt.format(backup.createdAt)} · {formatBytes(backup.size)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline" disabled={pending}>
          <a href={`/api/admin/backups/${encodeURIComponent(backup.name)}`}>
            Télécharger
          </a>
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={onRestore}
        >
          Restaurer
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={onDelete}
        >
          Supprimer
        </Button>
      </div>
    </div>
  );
}
