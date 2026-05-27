"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Role, UserStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  deleteUserAction,
  reactivateUserAction,
  suspendUserAction,
  unlockUsernameAction,
  validateUserAction,
} from "@/features/admin/actions";

type Props = {
  userId: string;
  username: string;
  status: UserStatus;
  role: Role;
  usernameLocked: boolean;
};

export function UserAdminActions({
  userId,
  username,
  status,
  role,
  usernameLocked,
}: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onDelete() {
    if (
      !confirm(
        `Supprimer DÉFINITIVEMENT le compte de "${username}" ? Toutes ses données (séances, sessions, messages, etc.) seront effacées. Cette action est irréversible.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      await deleteUserAction(userId);
      router.push("/admin/users");
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "PENDING" ? (
        <Button
          size="sm"
          disabled={pending}
          onClick={() => startTransition(() => validateUserAction(userId))}
        >
          Valider
        </Button>
      ) : null}
      {status === "ACTIVE" && role !== "ADMIN" ? (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => startTransition(() => suspendUserAction(userId))}
        >
          Suspendre
        </Button>
      ) : null}
      {status === "SUSPENDED" ? (
        <Button
          size="sm"
          disabled={pending}
          onClick={() => startTransition(() => reactivateUserAction(userId))}
        >
          Réactiver
        </Button>
      ) : null}
      {usernameLocked ? (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => startTransition(() => unlockUsernameAction(userId))}
        >
          Débloquer pseudo
        </Button>
      ) : null}
      {role !== "ADMIN" ? (
        <Button
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={onDelete}
        >
          Supprimer
        </Button>
      ) : null}
    </div>
  );
}
