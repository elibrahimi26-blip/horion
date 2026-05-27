import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { auth } from "@/lib/auth";

type SearchParams = {
  registered?: string;
  reset?: string;
  deleted?: string;
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Connexion</h1>
        <p className="text-sm text-muted-foreground">
          Accède à ton espace Horion.
        </p>
      </div>

      {searchParams.registered ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900">
          Inscription enregistrée. Tu recevras un email quand l&apos;admin aura validé ton compte.
        </div>
      ) : null}

      {searchParams.reset ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900">
          Mot de passe réinitialisé. Tu peux te connecter.
        </div>
      ) : null}

      {searchParams.deleted ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Ton compte a été supprimé. Toutes tes données ont été effacées.
        </div>
      ) : null}

      <LoginForm />

      <div className="space-y-2 text-center text-sm">
        <p>
          <Link href="/forgot-password" className="text-primary hover:underline">
            Mot de passe oublié ?
          </Link>
        </p>
        <p className="text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link href="/register" className="text-primary hover:underline">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
