import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { Readable } from "node:stream";
import { auth } from "@/lib/auth";
import { getBackupPath } from "@/features/backups/service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { name: string } },
) {
  const session = await auth();
  if (
    !session?.user ||
    session.user.role !== "ADMIN" ||
    session.user.status !== "ACTIVE"
  ) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const name = decodeURIComponent(params.name);

  let fullPath: string;
  try {
    fullPath = await getBackupPath(name);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const stats = await stat(fullPath);
  const nodeStream = createReadStream(fullPath);

  return new NextResponse(Readable.toWeb(nodeStream) as ReadableStream, {
    headers: {
      "Content-Type": "application/gzip",
      "Content-Length": String(stats.size),
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
