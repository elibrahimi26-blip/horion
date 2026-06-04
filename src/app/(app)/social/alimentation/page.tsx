import { Apple } from "lucide-react";

export default function AlimentationPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Apple className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold">Espace alimentation</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        Recettes, plans nutrition et échanges autour de l&apos;alimentation
        sportive. Section en préparation.
      </p>
      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
        Bientôt
      </span>
    </div>
  );
}
