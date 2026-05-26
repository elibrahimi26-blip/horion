import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">Lien invalide</h1>
        <p className="text-sm text-muted-foreground">
          Le lien de réinitialisation est incomplet.
        </p>
        <p className="text-sm">
          <Link href="/forgot-password" className="text-primary hover:underline">
            Demander un nouveau lien
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Nouveau mot de passe</h1>
        <p className="text-sm text-muted-foreground">
          Choisis un nouveau mot de passe pour ton compte.
        </p>
      </div>

      <ResetPasswordForm token={token} />
    </div>
  );
}
