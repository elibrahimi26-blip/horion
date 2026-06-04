"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  initialPath?: string | null;
  name?: string; // nom du hidden input pour le submit
};

export function ExerciseImageUploader({
  initialPath = null,
  name = "imagePath",
}: Props) {
  const [imagePath, setImagePath] = useState<string | null>(initialPath);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/exercises/upload", {
        method: "POST",
        body: fd,
      });
      const json = (await res.json()) as { imagePath?: string; error?: string };
      if (!res.ok || !json.imagePath) {
        throw new Error(json.error ?? "Échec de l'upload");
      }
      setImagePath(json.imagePath);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur d'upload");
    } finally {
      setUploading(false);
    }
  }

  function onPick() {
    inputRef.current?.click();
  }

  function onClear() {
    setImagePath(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={imagePath ?? ""} />
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {imagePath ? (
        <div className="flex items-center gap-3 rounded-md border bg-card p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/exercise-images/${imagePath}`}
            alt="Aperçu de l'exercice"
            className="h-20 w-20 rounded-md object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{imagePath}</p>
            <p className="text-[10px] text-muted-foreground">
              Image enregistrée — sera liée à l&apos;exercice à la sauvegarde.
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onPick}
              disabled={uploading}
            >
              Remplacer
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onClear}
              disabled={uploading}
              aria-label="Retirer l'image"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onPick}
          disabled={uploading}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              Upload en cours…
            </>
          ) : (
            <>
              <ImagePlus className="h-6 w-6" />
              Choisir une image (JPG, PNG, WEBP, GIF · max 5 MB)
            </>
          )}
        </button>
      )}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
