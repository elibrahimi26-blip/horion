import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const EXERCISES_DIR = process.env.EXERCISES_DIR ?? "/app/exercises";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (
    !session?.user ||
    session.user.role !== "ADMIN" ||
    session.user.status !== "ACTIVE"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
  }

  const ext = EXT_BY_TYPE[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: `Type non supporté (${file.type}). Utilise JPG, PNG, WEBP ou GIF.` },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Fichier trop lourd (${Math.round(file.size / 1024)} KB > 5 MB).` },
      { status: 400 },
    );
  }

  // Identifiant unique pour le dossier — préfixé "upload-" pour distinguer
  // des imports yuhonas et garantir l'absence de collision.
  const folderName = `upload-${randomBytes(12).toString("hex")}`;
  const filename = `0.${ext}`;
  const folderPath = path.join(EXERCISES_DIR, folderName);
  const filePath = path.join(folderPath, filename);

  try {
    await mkdir(folderPath, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
  } catch (err) {
    console.error("[exercises/upload]", err);
    return NextResponse.json(
      { error: "Échec de l'enregistrement sur le serveur." },
      { status: 500 },
    );
  }

  const imagePath = `${folderName}/${filename}`;
  return NextResponse.json({ imagePath });
}
