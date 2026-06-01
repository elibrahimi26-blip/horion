import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { Readable } from "node:stream";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const EXERCISES_DIR = process.env.EXERCISES_DIR ?? "/app/exercises";

// Format attendu : <externalId>/<index>.<ext>
// - externalId : a-z, A-Z, 0-9, _, -, . (slugs yuhonas)
// - index      : un ou plusieurs chiffres
// - ext        : jpg, jpeg, png, webp
const SEGMENT_RE = /^[A-Za-z0-9_.-]+$/;
const FILENAME_RE = /^[0-9]+\.(jpg|jpeg|png|webp)$/i;

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // On attend exactement 2 segments : [externalId, filename]
  if (params.path.length !== 2) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const [externalId, filename] = params.path;
  if (
    !externalId ||
    !filename ||
    !SEGMENT_RE.test(externalId) ||
    !FILENAME_RE.test(filename)
  ) {
    return new NextResponse("Bad request", { status: 400 });
  }

  // Guard contre les traversals (defense in depth — la regex devrait déjà bloquer)
  const fullPath = path.join(EXERCISES_DIR, externalId, filename);
  const normalized = path.normalize(fullPath);
  if (!normalized.startsWith(EXERCISES_DIR + path.sep)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let stats;
  try {
    stats = await stat(normalized);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

  const nodeStream = createReadStream(normalized);
  return new NextResponse(Readable.toWeb(nodeStream) as ReadableStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(stats.size),
      // Cache aggressive : les images yuhonas ne changent jamais une fois importées
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
