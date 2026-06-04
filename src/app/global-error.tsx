"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global:error]", error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
          <h2 className="text-xl font-semibold">Erreur applicative</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Une erreur inattendue est survenue. Recharge la page pour réessayer.
          </p>
          <button
            onClick={() => reset()}
            className="rounded-md border border-foreground/20 px-4 py-2 text-sm font-medium hover:bg-foreground/5"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
