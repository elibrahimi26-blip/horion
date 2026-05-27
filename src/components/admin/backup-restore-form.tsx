"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { restoreFromUploadAction } from "@/features/backups/actions";
import { initialBackupState } from "@/features/backups/state";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? "Restauration en cours…" : "Restaurer ce fichier"}
    </Button>
  );
}

export function BackupRestoreForm() {
  const [state, formAction] = useFormState(
    restoreFromUploadAction,
    initialBackupState,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-md border p-4">
      <div className="space-y-1">
        <h3 className="font-semibold">Restaurer depuis un fichier</h3>
        <p className="text-xs text-muted-foreground">
          Upload un dump <code>.sql.gz</code> généré par Horion (le fichier sera
          d&apos;abord copié dans le dossier des sauvegardes, puis appliqué).
        </p>
      </div>

      <input
        type="file"
        name="file"
        accept=".sql.gz,application/gzip"
        required
        className="block w-full text-sm"
      />

      <input
        type="text"
        name="confirmation"
        placeholder='Tape "RESTORE" pour confirmer'
        required
        className="block w-full rounded-md border px-3 py-2 text-sm"
      />

      {state.status === "error" ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}
      {state.status === "success" ? (
        <p className="text-sm text-emerald-600">{state.message}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
