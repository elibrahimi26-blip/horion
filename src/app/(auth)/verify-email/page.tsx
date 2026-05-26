import Link from "next/link";

// TODO Sprint 4 : implémentation complète (XP +50 EMAIL_VERIFIED)
export default function VerifyEmailPage() {
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-2xl font-bold">Vérification d&apos;email</h1>
      <p className="text-sm text-muted-foreground">
        Cette fonctionnalité sera disponible prochainement.
      </p>
      <p className="text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
