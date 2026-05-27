export type AuthFormState = {
  status: "idle" | "success" | "error";
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialAuthState: AuthFormState = { status: "idle" };
