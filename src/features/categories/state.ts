export type CategoryFormState = {
  status: "idle" | "success" | "error";
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialCategoryState: CategoryFormState = { status: "idle" };
