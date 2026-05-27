export type ExerciseFormState = {
  status: "idle" | "success" | "error";
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialExerciseState: ExerciseFormState = { status: "idle" };
