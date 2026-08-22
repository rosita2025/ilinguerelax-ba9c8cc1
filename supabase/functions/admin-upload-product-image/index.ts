// Admin-only image upload for the `product-images` bucket.
//
// The bucket is read-only for the public (SELECT policy only); writes go
// through this function, gated by the shared admin guard (origin allowlist +
// x-admin-csrf + HMAC 2FA session) and executed with the service role.
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  assertAdminCsrf,
  adminCorsHeaders,
  withAdminLogging,
} from "../_shared/adminCsrf.ts";

const BUCKET = "product-images";
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB decoded
const PATH_RE = /^[a-z0-9-]{1,80}\/[a-z0-9-]{1,80}\.(webp|jpg|jpeg|png|gif|avif)$/;

function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

Deno.serve(withAdminLogging("admin-upload-product-image", async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: adminCorsHeaders });

  const blocked = await assertAdminCsrf(req);
  if (blocked) return blocked;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
    });
  }

  let path = "";
  let contentType = "image/webp";
  let dataBase64 = "";
  try {
    const body = await req.json();
    path = String(body.path || "");
    contentType = String(body.contentType || "image/webp");
    dataBase64 = String(body.dataBase64 || "");
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
    });
  }

  // Path allowlist: <slug>/<file>.<ext>, no traversal, images only.
  if (!PATH_RE.test(path)) {
    return new Response(JSON.stringify({ error: "Invalid path" }), {
      status: 400,
      headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!contentType.startsWith("image/")) {
    return new Response(JSON.stringify({ error: "Invalid content type" }), {
      status: 400,
      headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
    });
  }
  // Base64 inflates ~4/3 — reject early on encoded length.
  if (!dataBase64 || dataBase64.length > Math.ceil(MAX_BYTES / 3) * 4 + 8) {
    return new Response(JSON.stringify({ error: "File too large" }), {
      status: 400,
      headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
    });
  }

  let bytes: Uint8Array;
  try {
    bytes = decodeBase64(dataBase64);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid base64" }), {
      status: 400,
      headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
    });
  }
  if (bytes.length > MAX_BYTES) {
    return new Response(JSON.stringify({ error: "File too large" }), {
      status: 400,
      headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { error } = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType,
    upsert: false,
  });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return new Response(JSON.stringify({ publicUrl: data.publicUrl, path }), {
    headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
  });
}));
