"use client";

import { useFormState } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction, initialAuthState } from "@/features/auth/actions";
import { SubmitButton } from "./submit-button";

export function ForgotPasswordForm() {
  const [state, formAction] = useFormState(forgotPasswordAction, initialAuthState);

  if (state.status === "success") {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900">
        Si un compte existe avec cet email, tu vas recevoir un lien pour réinitialiser ton mot de passe.
      </div>
    );
  }

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
      </div>

      {state.status === "error" && state.error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <SubmitButton pendingText="Envoi…">Envoyer le lien</SubmitButton>
    </form>
  );
}
