"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteMyAccountAction } from "@/features/profile/actions";

function DeleteButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="destructive"
      disabled={pending || disabled}
    >
      {pending ? "Suppression…" : "Supprimer définitivement"}
    </Button>
  );
}

export function RgpdSection({ username }: { username: string }) {
  const [confirmation, setConfirmation] = useState("");
  const canDelete = confirmation === username;

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-md border p-6">
        <div>
          <h3 className="text-base font-semibold">Exporter mes données</h3>
          <p className="text-xs text-muted-foreground">
            Télécharge un fichier JSON contenant toutes les données associées
            à ton compte (séances, sessions, mesures, messages, etc.). Article
            20 RGPD — portabilité des données.
          </p>
        </div>
        <Button asChild variant="outline">
          <a href="/api/profile/export" download>
            Télécharger l&apos;export
          </a>
        </Button>
      </div>

      <div className="space-y-3 rounded-md border border-destructive/40 bg-destructive/5 p-6">
        <div>
          <h3 className="text-base font-semibold text-destructive">
            Supprimer mon compte
          </h3>
          <p className="text-xs text-muted-foreground">
            Action <strong>irréversible</strong>. Toutes tes données seront
            effacées : séances, sessions, messages, notifications, etc.
            Article 17 RGPD — droit à l&apos;effacement.
          </p>
        </div>

        <form action={deleteMyAccountAction} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="confirmUsername" className="text-xs">
              Tape ton pseudo (« {username} ») pour confirmer
            </Label>
            <Input
              id="confirmUsername"
              name="confirmUsername"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={username}
              autoComplete="off"
            />
          </div>
          <DeleteButton disabled={!canDelete} />
          {!canDelete && confirmation.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              La confirmation ne correspond pas à ton pseudo.
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
