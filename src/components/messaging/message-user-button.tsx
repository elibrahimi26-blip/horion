"use client";

import { useTransition } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startThreadWithUserAction } from "@/features/messaging/actions";

type Props = {
  userId: string;
  label?: string;
  size?: "sm" | "default";
  variant?: "default" | "outline" | "ghost";
  iconOnly?: boolean;
};

export function MessageUserButton({
  userId,
  label = "Envoyer un message",
  size = "sm",
  variant = "outline",
  iconOnly = false,
}: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      disabled={pending}
      onClick={() => startTransition(() => startThreadWithUserAction(userId))}
      aria-label={label}
      title={label}
    >
      <MessageSquare className={iconOnly ? "h-4 w-4" : "mr-2 h-4 w-4"} />
      {iconOnly ? null : pending ? "…" : label}
    </Button>
  );
}
