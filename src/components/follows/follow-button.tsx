"use client";

import { useOptimistic, useTransition } from "react";
import { UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  followUserAction,
  unfollowUserAction,
} from "@/features/follows/actions";

type Props = {
  targetUserId: string;
  isFollowing: boolean;
  size?: "sm" | "default";
};

export function FollowButton({
  targetUserId,
  isFollowing,
  size = "sm",
}: Props) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(isFollowing);

  function toggle() {
    const next = !optimistic;
    startTransition(async () => {
      setOptimistic(next);
      if (next) {
        await followUserAction(targetUserId);
      } else {
        await unfollowUserAction(targetUserId);
      }
    });
  }

  return (
    <Button
      type="button"
      size={size}
      variant={optimistic ? "outline" : "default"}
      disabled={pending}
      onClick={toggle}
      aria-pressed={optimistic}
    >
      {optimistic ? (
        <>
          <UserMinus className="mr-1.5 h-4 w-4" />
          Suivi
        </>
      ) : (
        <>
          <UserPlus className="mr-1.5 h-4 w-4" />
          Suivre
        </>
      )}
    </Button>
  );
}
