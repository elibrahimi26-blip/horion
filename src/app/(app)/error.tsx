"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app:error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-md border border-destructive/40 bg-destructive/5 p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Une erreur est survenue</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          On n&apos;a pas réussi à charger cette page. Réessaie, ou reviens à
          l&apos;accueil. Si ça persiste, contacte le support.
        </p>
        {error.digest ? (
          <p className="text-[10px] text-muted-foreground/70">
            Référence : {error.digest}
          </p>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => reset()}>Réessayer</Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    </div>
  );
}
