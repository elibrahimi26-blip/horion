"use client";

import Link from "next/link";
import { useTransition } from "react";
import type { Role, UserStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  reactivateUserAction,
  suspendUserAction,
  unlockUsernameAction,
  validateUserAction,
} from "@/features/admin/actions";

export type AdminUserRow = {
  id: string;
  email: string;
  username: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  lastLoginAt: Date | null;
  usernameLocked: boolean;
  usernameChangesCount: number;
};

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function UserRow({ user }: { user: AdminUserRow }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border p-4">
      <Link
        href={`/admin/users/${user.id}`}
        className="space-y-1 hover:underline"
      >
        <p className="font-medium">
          {user.username}
          {user.role === "ADMIN" ? (
            <span className="ml-2 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
              admin
            </span>
          ) : null}
          {user.usernameLocked || user.usernameChangesCount >= 2 ? (
            <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              pseudo verrouillé ({user.usernameChangesCount}/2)
            </span>
          ) : null}
        </p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
        <p className="text-xs text-muted-foreground">
          Inscrit le {dateFmt.format(user.createdAt)}
          {user.lastLoginAt
            ? ` · Dernière connexion ${dateFmt.format(user.lastLoginAt)}`
            : " · Jamais connecté"}
        </p>
      </Link>

      <div className="flex flex-wrap gap-2">
        {user.status === "PENDING" ? (
          <Button
            size="sm"
            disabled={pending}
            onClick={() => startTransition(() => validateUserAction(user.id))}
          >
            Valider
          </Button>
        ) : null}
        {user.status === "ACTIVE" && user.role !== "ADMIN" ? (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => startTransition(() => suspendUserAction(user.id))}
          >
            Suspendre
          </Button>
        ) : null}
        {user.status === "SUSPENDED" ? (
          <Button
            size="sm"
            disabled={pending}
            onClick={() => startTransition(() => reactivateUserAction(user.id))}
          >
            Réactiver
          </Button>
        ) : null}
        {user.usernameChangesCount >= 2 || user.usernameLocked ? (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => startTransition(() => unlockUsernameAction(user.id))}
          >
            Débloquer pseudo
          </Button>
        ) : null}
      </div>
    </div>
  );
}
