"use client";

import { useFormState } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/auth/submit-button";
import { createTicketAction } from "@/features/support/actions";
import { initialTicketState } from "@/features/support/state";

export function CreateTicketForm() {
  const [state, formAction] = useFormState(
    createTicketAction,
    initialTicketState,
  );

  return (
    <form action={formAction} className="space-y-3 rounded-md border p-4">
      <h3 className="text-sm font-semibold">Nouveau ticket</h3>

      <div className="space-y-1">
        <Label htmlFor="subject">Sujet *</Label>
        <Input
          id="subject"
          name="subject"
          required
          maxLength={100}
          placeholder="Ex : Bug sur la sauvegarde des séries"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="body">Message *</Label>
        <Textarea
          id="body"
          name="body"
          rows={4}
          maxLength={2000}
          required
          placeholder="Décris ton problème ou ta question en détail…"
        />
      </div>

      {state.error ? (
        <p className="text-xs text-destructive">{state.error}</p>
      ) : null}

      <SubmitButton className="" pendingText="Envoi…">
        Créer le ticket
      </SubmitButton>
    </form>
  );
}
