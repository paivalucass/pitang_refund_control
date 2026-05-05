import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env.ts";
import { AppError } from "./AppError.ts";

let client: SupabaseClient | undefined;

export function ensureSupabaseConfigured() {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new AppError("Supabase Storage não configurado", 500);
  }
}

export function getSupabase() {
  ensureSupabaseConfigured();
  client ??= createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
    },
  });
  return client;
}

export function getStoragePathFromPublicUrl(fileUrl: string) {
  const marker = `/storage/v1/object/public/${env.SUPABASE_ATTACHMENTS_BUCKET}/`;
  const markerIndex = fileUrl.indexOf(marker);
  if (markerIndex === -1) return undefined;
  return decodeURIComponent(fileUrl.slice(markerIndex + marker.length));
}
