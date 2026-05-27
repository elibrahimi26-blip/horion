"use client";

import { useFormState } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/auth/submit-button";
import {
  updateBioAction,
  updateUsernameAction,
} from "@/features/profile/actions";
import { initialProfileState } from "@/features/profile/state";
import { MAX_USERNAME_CHANGES } from "@/features/auth/constants";

type Props = {
  user: {
    username: string;
    bio: string | null;
    usernameChangesCount: number;
    usernameLocked: boolean;
  };
};

export function ProfileSettingsForm({ user }: Props) {
  const [usernameState, usernameAction] = useFormState(
    updateUsernameAction,
    initialProfileState,
  );
  const [bioState, bioAction] = useFormState(
    updateBioAction,
    initialProfileState,
  );

  const usernameDisabled =
    user.usernameLocked || user.usernameChangesCount >= MAX_USERNAME_CHANGES;
  const remaining = MAX_USERNAME_CHANGES - user.usernameChangesCount;

  return (
    <div className="space-y-8">
      <form
        action={usernameAction}
        className="space-y-4 rounded-md border p-6"
      >
        <div>
          <h3 className="text-base font-semibold">Pseudo</h3>
          <p className="text-xs text-muted-foreground">
            {usernameDisabled
              ? "Tu as atteint la limite de modifications. Contacte un admin pour le débloquer."
              : `Modifications restantes : ${remaining}/${MAX_USERNAME_CHANGES}.`}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Pseudo</Label>
          <Input
            id="username"
            name="username"
            type="text"
            defaultValue={user.username}
            autoComplete="username"
            required
            disabled={usernameDisabled}
          />
          {usernameState.fieldErrors?.username?.[0] ? (
            <p className="text-xs text-destructive">
              {usernameState.fieldErrors.username[0]}
            </p>
          ) : null}
        </div>

        {usernameState.status === "success" ? (
          <p className="text-sm text-green-700">Pseudo mis à jour.</p>
        ) : null}
        {usernameState.status === "error" && usernameState.error ? (
          <p className="text-sm text-destructive">{usernameState.error}</p>
        ) : null}

        <SubmitButton className="" pendingText="Mise à jour…">
          {usernameDisabled ? "Verrouillé" : "Modifier le pseudo"}
        </SubmitButton>
      </form>

      <form action={bioAction} className="space-y-4 rounded-md border p-6">
        <div>
          <h3 className="text-base font-semibold">Bio</h3>
          <p className="text-xs text-muted-foreground">
            Quelques mots à propos de toi (500 caractères max).
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            rows={5}
            defaultValue={user.bio ?? ""}
            maxLength={500}
          />
        </div>

        {bioState.status === "success" ? (
          <p className="text-sm text-green-700">Bio mise à jour.</p>
        ) : null}
        {bioState.status === "error" && bioState.error ? (
          <p className="text-sm text-destructive">{bioState.error}</p>
        ) : null}

        <SubmitButton className="" pendingText="Mise à jour…">
          Mettre à jour la bio
        </SubmitButton>
      </form>
    </div>
  );
}
