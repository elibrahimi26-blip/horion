"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  applyRetentionAction,
  createBackupAction,
} from "@/features/backups/actions";

export function BackupCreateButton() {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await createBackupAction();
            } catch (err) {
              alert(err instanceof Error ? err.message : "Erreur");
            }
          })
        }
      >
        {pending ? "Sauvegarde en cours…" : "Sauvegarder maintenant"}
      </Button>
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await applyRetentionAction();
            } catch (err) {
              alert(err instanceof Error ? err.message : "Erreur");
            }
          })
        }
      >
        Appliquer la rétention
      </Button>
    </div>
  );
}
