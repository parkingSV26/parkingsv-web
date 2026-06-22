import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const LEGACY_UPLOADS_ROOT = path.join(process.cwd(), "crud-php2", "public", "uploads");

const mimeTypes: Record<string, string> = {
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ assetPath: string[] }> },
) {
  const { assetPath } = await context.params;
  const joinedPath = path.join(LEGACY_UPLOADS_ROOT, ...assetPath);
  const normalizedRoot = path.normalize(LEGACY_UPLOADS_ROOT);
  const normalizedPath = path.normalize(joinedPath);
  const rootWithSeparator = normalizedRoot.endsWith(path.sep)
    ? normalizedRoot
    : `${normalizedRoot}${path.sep}`;

  // This check prevents path traversal outside the legacy uploads folder.
  if (normalizedPath !== normalizedRoot && !normalizedPath.startsWith(rootWithSeparator)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    // Serve the original file with a reasonable content type so old images keep working.
    const fileBuffer = await readFile(normalizedPath);
    const extension = path.extname(normalizedPath).toLowerCase();

    return new NextResponse(fileBuffer, {
      headers: {
        "Cache-Control": "public, max-age=3600",
        "Content-Type": mimeTypes[extension] ?? "application/octet-stream",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
