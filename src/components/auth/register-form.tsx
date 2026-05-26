"use client";

import { useFormState } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialAuthState, registerAction } from "@/features/auth/actions";
import { SubmitButton } from "./submit-button";

export function RegisterForm() {
  const [state, formAction] = useFormState(registerAction, initialAuthState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        {state.fieldErrors?.email?.[0] ? (
          <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Pseudo</Label>
        <Input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
        />
        <p className="text-xs text-muted-foreground">
          3-20 caractères, lettres / chiffres / _ / -
        </p>
        {state.fieldErrors?.username?.[0] ? (
          <p className="text-xs text-destructive">{state.fieldErrors.username[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
        <p className="text-xs text-muted-foreground">
          10+ caractères, au moins 1 majuscule et 1 chiffre
        </p>
        {state.fieldErrors?.password?.[0] ? (
          <p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p>
        ) : null}
      </div>

      {state.status === "error" && state.error && !state.fieldErrors ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <SubmitButton pendingText="Création…">Créer mon compte</SubmitButton>
    </form>
  );
}
