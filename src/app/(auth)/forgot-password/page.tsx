import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Mot de passe oublié</h1>
        <p className="text-sm text-muted-foreground">
          Entre ton email, on t&apos;enverra un lien pour réinitialiser ton mot de passe.
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
