"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  closeTicketAction,
  reopenTicketAction,
} from "@/features/support/actions";

type Props = {
  threadId: string;
  status: "OPEN" | "CLOSED";
};

export function TicketAdminActions({ threadId, status }: Props) {
  const [pending, startTransition] = useTransition();

  if (status === "OPEN") {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => {
          if (!confirm("Fermer ce ticket ?")) return;
          startTransition(() => closeTicketAction(threadId));
        }}
      >
        Fermer le ticket
      </Button>
    );
  }
  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => reopenTicketAction(threadId))}
    >
      Rouvrir le ticket
    </Button>
  );
}
