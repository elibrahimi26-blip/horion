export type WorkoutFormState = {
  status: "idle" | "success" | "error";
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialWorkoutState: WorkoutFormState = { status: "idle" };
