"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resetAllSessionsAction } from "@/features/sessions/actions";

export function ResetSessionsButton({ count }: { count: number }) {
  const [pending, startTransition] = useTransition();
  const [confirmText, setConfirmText] = useState("");

  if (count === 0) return null;

  return (
    <details className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-destructive">
        Zone dangereuse — réinitialiser toutes les séances
      </summary>
      <div className="mt-3 space-y-3 text-sm">
        <p>
          Cette action supprime <strong>{count} séance(s)</strong> et toutes
          leurs séries enregistrées. Les séances planifiées seront re-marquées
          comme "à faire". Cette action est irréversible.
        </p>
        <p className="text-xs text-muted-foreground">
          Tape <code className="font-mono">RESET</code> pour confirmer.
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="w-32 rounded-md border bg-background px-2 py-1 text-sm"
          placeholder="RESET"
        />
        <div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={confirmText !== "RESET" || pending}
            onClick={() => {
              startTransition(async () => {
                await resetAllSessionsAction();
                setConfirmText("");
              });
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {pending ? "Suppression…" : "Tout supprimer"}
          </Button>
        </div>
      </div>
    </details>
  );
}
