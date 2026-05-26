"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  toggleLikeAction,
  toggleSaveAction,
} from "@/features/social/actions";

type Props = {
  workoutId: string;
  likeCount: number;
  saveCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  isAuthor: boolean;
};

export function WorkoutSocialActions({
  workoutId,
  likeCount,
  saveCount,
  likedByMe,
  savedByMe,
  isAuthor,
}: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant={likedByMe ? "default" : "outline"}
        disabled={pending || isAuthor}
        onClick={() => startTransition(() => toggleLikeAction(workoutId))}
        title={
          isAuthor ? "Tu ne peux pas liker ta propre séance" : undefined
        }
      >
        ♥ {likeCount}
      </Button>
      <Button
        size="sm"
        variant={savedByMe ? "default" : "outline"}
        disabled={pending}
        onClick={() => startTransition(() => toggleSaveAction(workoutId))}
      >
        📌 {saveCount}
      </Button>
    </div>
  );
}
