"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  toggleLikeAction,
  toggleSaveAction,
} from "@/features/social/actions";

type Workout = {
  id: string;
  name: string;
  description: string | null;
  author: { id: string; username: string };
  _count: { likes: number; saves: number; sessions: number };
  versions: { _count: { exercises: number } }[];
  likedByMe: boolean;
  savedByMe: boolean;
};

export function SocialCard({
  workout,
  currentUserId,
}: {
  workout: Workout;
  currentUserId: string;
}) {
  const [pending, startTransition] = useTransition();
  const isAuthor = workout.author.id === currentUserId;
  const exerciseCount = workout.versions[0]?._count.exercises ?? 0;

  function onLike() {
    startTransition(() => toggleLikeAction(workout.id));
  }
  function onSave() {
    startTransition(() => toggleSaveAction(workout.id));
  }

  return (
    <div className="rounded-md border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link
            href={`/workouts/${workout.id}`}
            className="text-lg font-semibold hover:underline"
          >
            {workout.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            par{" "}
            <Link
              href={`/workouts/${workout.id}`}
              className="hover:underline"
            >
              {workout.author.username}
            </Link>
            {isAuthor ? " (toi)" : ""}
          </p>
        </div>
      </div>

      {workout.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {workout.description}
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>
          {exerciseCount} exercice{exerciseCount > 1 ? "s" : ""}
        </span>
        {workout._count.sessions > 0 ? (
          <span>
            {workout._count.sessions} session
            {workout._count.sessions > 1 ? "s" : ""}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-2 border-t pt-3">
        <Button
          size="sm"
          variant={workout.likedByMe ? "default" : "outline"}
          disabled={pending || isAuthor}
          onClick={onLike}
          title={isAuthor ? "Tu ne peux pas liker ta propre séance" : undefined}
        >
          ♥ {workout._count.likes}
        </Button>
        <Button
          size="sm"
          variant={workout.savedByMe ? "default" : "outline"}
          disabled={pending}
          onClick={onSave}
        >
          📌 {workout._count.saves}
        </Button>
        <Button asChild size="sm" variant="ghost" className="ml-auto">
          <Link href={`/workouts/${workout.id}`}>Détail →</Link>
        </Button>
      </div>
    </div>
  );
}
