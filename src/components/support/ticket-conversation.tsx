"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/auth/submit-button";
import { replyTicketAction } from "@/features/support/actions";
import { initialTicketState } from "@/features/support/state";
import { formatRelative, formatShortTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  body: string;
  createdAt: Date;
  sender: { id: string; username: string; role: "MEMBER" | "ADMIN" };
};

type Props = {
  threadId: string;
  messages: Message[];
  currentUserId: string;
  status: "OPEN" | "CLOSED";
};

export function TicketConversation({
  threadId,
  messages,
  currentUserId,
  status,
}: Props) {
  const boundReply = replyTicketAction.bind(null, threadId);
  const [state, formAction] = useFormState(boundReply, initialTicketState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error === null) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const showDate =
            !prev ||
            prev.createdAt.toDateString() !== m.createdAt.toDateString();
          return (
            <div key={m.id} className="space-y-2">
              {showDate ? (
                <p className="text-center text-[10px] uppercase tracking-wide text-muted-foreground">
                  {formatRelative(m.createdAt)}
                </p>
              ) : null}
              <SupportBubble
                message={m}
                isMine={m.sender.id === currentUserId}
              />
            </div>
          );
        })}
      </div>

      {status === "OPEN" ? (
        <form
          ref={formRef}
          action={formAction}
          className="space-y-2 rounded-md border bg-muted/30 p-3"
        >
          <Textarea
            name="body"
            rows={3}
            maxLength={2000}
            required
            placeholder="Ta réponse…"
          />
          {state.error ? (
            <p className="text-xs text-destructive">{state.error}</p>
          ) : null}
          <SubmitButton className="" pendingText="Envoi…">
            Envoyer
          </SubmitButton>
        </form>
      ) : (
        <p className="rounded-md border bg-muted p-3 text-center text-sm text-muted-foreground">
          Ce ticket est fermé. Pour une nouvelle demande, ouvre un autre
          ticket depuis la page Support.
        </p>
      )}
    </div>
  );
}

function SupportBubble({
  message,
  isMine,
}: {
  message: Message;
  isMine: boolean;
}) {
  const isAdminMsg = message.sender.role === "ADMIN";
  return (
    <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-3 py-2",
          isMine ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        <p
          className={cn(
            "mb-1 text-[10px] font-semibold",
            isMine
              ? "text-primary-foreground/80"
              : "text-muted-foreground",
          )}
        >
          {message.sender.username}
          {isAdminMsg ? (
            <span
              className={cn(
                "ml-1 rounded px-1 text-[9px]",
                isMine
                  ? "bg-primary-foreground/20"
                  : "bg-primary/10 text-primary",
              )}
            >
              admin
            </span>
          ) : null}
        </p>
        <p className="whitespace-pre-wrap text-sm">{message.body}</p>
        <p
          className={cn(
            "mt-1 text-[10px]",
            isMine
              ? "text-primary-foreground/70"
              : "text-muted-foreground",
          )}
        >
          {formatShortTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
