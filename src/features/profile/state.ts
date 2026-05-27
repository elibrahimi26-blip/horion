export type ProfileFormState = {
  status: "idle" | "success" | "error";
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialProfileState: ProfileFormState = { status: "idle" };
