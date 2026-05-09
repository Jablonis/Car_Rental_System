import path from "path";
import fs from "fs";

const LEGACY_EXTENSIONS = [".jpg", ".jpeg", ".png", ".svg"];

function assetExists(publicPath: string): boolean {
  const clean = publicPath.replace(/^\//, "");
  const absolute = path.join(process.cwd(), "public", clean);
  return fs.existsSync(absolute);
}

export function normalizeAssetPath(value?: string | null): string | null | undefined {
  if (!value) return value;
  if (!value.startsWith("/assets/")) return value;
  if (assetExists(value)) return value;

  const extension = path.extname(value).toLowerCase();
  if (!LEGACY_EXTENSIONS.includes(extension)) return value;

  const candidate = value.replace(/\.(jpg|jpeg|png|svg)$/i, ".webp");
  if (assetExists(candidate)) return candidate;

  return value;
}

export function normalizeAssetList(values: string[] = []): string[] {
  return values.map((value) => normalizeAssetPath(value) || value);
}
