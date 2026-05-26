"use client";

import { useFormState } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";
import {
  initialBodyWeightState,
  logBodyWeightAction,
} from "@/features/body-weight/actions";

export function WeightInput({ latestKg }: { latestKg: number | null }) {
  const [state, formAction] = useFormState(
    logBodyWeightAction,
    initialBodyWeightState,
  );

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-2"
    >
      <div className="min-w-[140px] flex-1 space-y-1">
        <Label htmlFor="weightKg" className="text-xs">
          Mesure du jour (kg)
        </Label>
        <Input
          id="weightKg"
          name="weightKg"
          type="number"
          step="0.1"
          min="20"
          max="500"
          required
          inputMode="decimal"
          placeholder={latestKg !== null ? String(latestKg) : "ex : 75.5"}
        />
      </div>
      <SubmitButton className="" pendingText="…">
        Enregistrer
      </SubmitButton>
      {state.status === "success" ? (
        <p className="basis-full text-xs text-green-700">Mesure enregistrée.</p>
      ) : null}
      {state.status === "error" && state.error ? (
        <p className="basis-full text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
