export type BodyWeightFormState = {
  status: "idle" | "success" | "error";
  error?: string;
};

export const initialBodyWeightState: BodyWeightFormState = { status: "idle" };
