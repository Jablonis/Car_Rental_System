import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "media";

let cachedClient: SupabaseClient | null = null;
let bucketEnsured = false;

function getClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  if (!cachedClient) {
    cachedClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return cachedClient;
}

async function ensureBucket(): Promise<void> {
  if (bucketEnsured) return;

  const client = getClient();
  const { data: buckets, error: listError } = await client.storage.listBuckets();
  if (listError) {
    throw new Error(`Unable to access Supabase Storage: ${listError.message}`);
  }

  if (!buckets?.some((bucket) => bucket.name === SUPABASE_STORAGE_BUCKET)) {
    const { error: createError } = await client.storage.createBucket(SUPABASE_STORAGE_BUCKET, {
      public: true,
      fileSizeLimit: "8MB",
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    });

    if (createError && !/already exists/i.test(createError.message)) {
      throw new Error(`Unable to create Supabase bucket: ${createError.message}`);
    }
  }

  bucketEnsured = true;
}

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "") || "image";
}

export async function uploadImageToStorage(file: Express.Multer.File, folder: string): Promise<string> {
  await ensureBucket();
  const client = getClient();

  const ext = file.originalname.includes(".") ? file.originalname.split('.').pop() : undefined;
  const cleanName = sanitizeFileName(file.originalname.replace(/\.[^.]+$/, ""));
  const fileName = `${Date.now()}-${crypto.randomUUID()}-${cleanName}${ext ? `.${ext}` : ""}`;
  const path = `${folder}/${fileName}`;

  const { error } = await client.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(path, file.buffer, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.mimetype,
    });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data } = client.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
