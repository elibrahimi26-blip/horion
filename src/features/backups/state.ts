export type BackupInfo = {
  name: string;
  size: number;
  createdAt: Date;
  trigger: "auto" | "manual";
};

export type BackupFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const initialBackupState: BackupFormState = { status: "idle" };
