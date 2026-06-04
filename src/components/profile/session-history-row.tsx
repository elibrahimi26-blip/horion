"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDurationLabel, toLocalInput } from "@/lib/format";
import {
  updateSessionDateAction,
  deleteSessionAction,
} from "@/features/sessions/actions";

const fmt = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function SessionHistoryRow({
  session,
}: {
  session: {
    id: string;
    startedAt: Date;
    endedAt: Date | null;
    durationSec: number | null;
    setsCount: number;
    workoutName: string;
  };
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <form
        action={(fd) => {
          startTransition(async () => {
            await updateSessionDateAction(fd);
            setEditing(false);
          });
        }}
        className="flex flex-wrap items-end gap-2 rounded-md border p-3"
      >
        <input type="hidden" name="sessionId" value={session.id} />
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor={`s-${session.id}`}>
            Date de début
          </label>
          <Input
            id={`s-${session.id}`}
            name="startedAt"
            type="datetime-local"
            defaultValue={toLocalInput(session.startedAt)}
            max={new Date().toISOString().slice(0, 16)}
            required
          />
        </div>
        <div className="flex gap-1">
          <Button type="submit" size="sm" disabled={pending}>
            <Check className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setEditing(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{session.workoutName}</p>
        <p className="text-xs text-muted-foreground">
          {fmt.format(new Date(session.startedAt))} ·{" "}
          {formatDurationLabel(session.durationSec)} · {session.setsCount} séries
          {session.endedAt === null ? " · en cours" : ""}
        </p>
      </div>
      <div className="flex gap-1">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setEditing(true)}
          aria-label="Modifier la date"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => {
            if (!confirm("Supprimer cette séance et toutes ses séries ?")) return;
            startTransition(() => deleteSessionAction(session.id));
          }}
          aria-label="Supprimer"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
