"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startThreadWithMemberAction } from "@/features/messaging/actions";

type Member = { id: string; username: string; email: string };

export function StartThreadList({ members }: { members: Member[] }) {
  const [pending, startTransition] = useTransition();

  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Tu as déjà une conversation avec tous les membres actifs.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((m) => (
        <div
          key={m.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
        >
          <div>
            <p className="text-sm font-medium">{m.username}</p>
            <p className="text-xs text-muted-foreground">{m.email}</p>
          </div>
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(() => startThreadWithMemberAction(m.id))
            }
          >
            Démarrer
          </Button>
        </div>
      ))}
    </div>
  );
}
