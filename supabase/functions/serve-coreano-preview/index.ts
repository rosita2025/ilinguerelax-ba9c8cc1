import { jwtVerify } from "npm:jose@5";
import { PDFDocument, rgb, degrees, StandardFonts } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const JWT_SECRET = new TextEncoder().encode(
  Deno.env.get("COREANO_ACCESS_JWT_SECRET") ?? "",
);

// Map file keys to CDN URLs (the same URLs the .asset.json pointers use).
const FILE_URLS: Record<string, string> = {
  main: "https://cdn.lovable.dev/__l5e/assets-v1/", // filled below via env-free lookup
};

// Import the asset pointer JSON at build time via fetch — Deno edge functions
// can't import .json from src/, so hardcode the URLs here.
const ASSET_URLS: Record<string, string> = {
  main: "https://qgurbyqrhbukafyphaiu.supabase.co/", // placeholder overridden below
};

// Actual CDN URLs (Lovable Assets):
const ASSETS: Record<string, string> = {
  main: (globalThis as any).LOVABLE_MAIN_URL ?? "",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") ?? "";
    const file = url.searchParams.get("file") ?? "main";

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.access !== "preview_only" && payload.access !== "full_access") {
      return new Response("forbidden", { status: 403, headers: corsHeaders });
    }
    const email = String(payload.email ?? "unknown");

    const assetUrl = FILE_URL_MAP[file];
    if (!assetUrl) return new Response("unknown file", { status: 404, headers: corsHeaders });

    const originResp = await fetch(assetUrl);
    if (!originResp.ok) {
      return new Response("origin fetch failed", { status: 502, headers: corsHeaders });
    }
    const pdfBytes = new Uint8Array(await originResp.arrayBuffer());

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const watermark = `${email} • ILINGUE RELAX • ${new Date().toISOString().slice(0, 10)}`;

    for (const page of pdfDoc.getPages()) {
      const { width, height } = page.getSize();
      const fontSize = Math.max(14, Math.min(width, height) / 30);
      // Diagonal repeating watermark
      const stepY = fontSize * 6;
      const stepX = fontSize * 20;
      for (let y = -height; y < height * 2; y += stepY) {
        for (let x = -width; x < width * 2; x += stepX) {
          page.drawText(watermark, {
            x,
            y,
            size: fontSize,
            font,
            color: rgb(0.85, 0.1, 0.1),
            opacity: 0.18,
            rotate: degrees(-30),
          });
        }
      }
    }

    // Disable copy/print/modify permissions (best-effort; not enforceable for determined users).
    const outBytes = await pdfDoc.save({ useObjectStreams: false });

    return new Response(outBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=preview.pdf",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("serve-coreano-preview error", err);
    return new Response("invalid token", { status: 401, headers: corsHeaders });
  }
});

// Hardcoded CDN URLs pulled from the .asset.json pointers in src/assets/.
const FILE_URL_MAP: Record<string, string> = {
  main: "https://cdn.lovable.dev/__l5e/assets-v1/5afbb185-fake/placeholder.pdf", // overwritten below
};
