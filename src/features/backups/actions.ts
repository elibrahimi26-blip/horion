"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { RESTORE_CONFIRM_TOKEN } from "./constants";
import {
  applyRetention,
  createBackup,
  deleteBackup,
  getBackupPath,
  persistUpload,
  restoreBackup,
} from "./service";
import type { BackupFormState } from "./state";

async function requireAdmin() {
  const session = await auth();
  if (
    !session?.user ||
    session.user.role !== "ADMIN" ||
    session.user.status !== "ACTIVE"
  ) {
    throw new Error("Forbidden");
  }
  return session;
}

export async function createBackupAction(): Promise<void> {
  await requireAdmin();
  await createBackup("manual");
  revalidatePath("/admin/backups");
}

export async function deleteBackupAction(name: string): Promise<void> {
  await requireAdmin();
  await deleteBackup(name);
  revalidatePath("/admin/backups");
}

export async function applyRetentionAction(): Promise<void> {
  await requireAdmin();
  await applyRetention();
  revalidatePath("/admin/backups");
}

export async function restoreFromExistingAction(
  name: string,
  confirmation: string,
): Promise<void> {
  await requireAdmin();
  if (confirmation !== RESTORE_CONFIRM_TOKEN) {
    throw new Error(`Confirmation manquante (tape "${RESTORE_CONFIRM_TOKEN}")`);
  }
  const fullPath = await getBackupPath(name);
  await restoreBackup(fullPath);
  revalidatePath("/admin/backups");
  revalidatePath("/admin", "layout");
}

export async function restoreFromUploadAction(
  _prev: BackupFormState,
  formData: FormData,
): Promise<BackupFormState> {
  try {
    await requireAdmin();

    const confirmation = String(formData.get("confirmation") ?? "");
    if (confirmation !== RESTORE_CONFIRM_TOKEN) {
      return {
        status: "error",
        message: `Tape exactement "${RESTORE_CONFIRM_TOKEN}" pour confirmer.`,
      };
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { status: "error", message: "Aucun fichier sélectionné." };
    }
    if (!file.name.endsWith(".sql.gz")) {
      return {
        status: "error",
        message: "Le fichier doit être un dump .sql.gz généré par Horion.",
      };
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const fullPath = await persistUpload(buffer, file.name);
    await restoreBackup(fullPath);

    revalidatePath("/admin/backups");
    revalidatePath("/admin", "layout");
    return { status: "success", message: "Restauration terminée." };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Erreur inconnue.",
    };
  }
}
