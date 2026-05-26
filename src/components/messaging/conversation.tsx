"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/auth/submit-button";
import {
  initialMessageState,
  sendPrivateMessageAction,
} from "@/features/messaging/actions";
import { formatShortTime, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  senderId: string;
  body: string;
  createdAt: Date;
  readAt: Date | null;
};

type Props = {
  threadId: string;
  messages: Message[];
  currentUserId: string;
  otherPersonName: string;
};

export function Conversation({
  threadId,
  messages,
  currentUserId,
  otherPersonName,
}: Props) {
  const boundAction = sendPrivateMessageAction.bind(null, threadId);
  const [state, formAction] = useFormState(boundAction, initialMessageState);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset le textarea après envoi réussi
  useEffect(() => {
    if (state.error === null) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {messages.length === 0 ? (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Aucun message. Commence la conversation.
          </p>
        ) : (
          messages.map((m, i) => {
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
                <MessageBubble
                  message={m}
                  isMine={m.senderId === currentUserId}
                />
              </div>
            );
          })
        )}
      </div>

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
          placeholder={`Écrire à ${otherPersonName}…`}
        />
        {state.error ? (
          <p className="text-xs text-destructive">{state.error}</p>
        ) : null}
        <SubmitButton className="" pendingText="Envoi…">
          Envoyer
        </SubmitButton>
      </form>
    </div>
  );
}

function MessageBubble({
  message,
  isMine,
}: {
  message: Message;
  isMine: boolean;
}) {
  return (
    <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-3 py-2",
          isMine ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
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
          {isMine && message.readAt ? " · lu" : ""}
        </p>
      </div>
    </div>
  );
}
