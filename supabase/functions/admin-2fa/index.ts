// Admin 2FA (email OTP) — stateless. Two actions:
//   POST { action: "request", adminKey }
//     → Validates the admin key, emails a 6-digit code to the operator's inbox,
//       returns an opaque HMAC-signed `challengeId` that carries the code hash
//       and expiry (5 minutes). Nothing is stored in the DB.
//   POST { action: "verify", challengeId, code }
//     → Recomputes the hash from the submitted code and constant-time compares
//       to the challenge. On match, returns a 12h HMAC-signed session token
//       that the client must send as `x-admin-2fa` on every admin call.
//   POST { action: "validate", adminKey }
//     → Confirms a stored admin key + 2FA token without sending another OTP.
//
// The HMAC secret is derived from ADMIN_REVIEW_KEY so rotating the admin key
// automatically invalidates every outstanding 2FA session.

import {
  adminCorsHeaders,
  assertAdminCsrf,
  signAdmin2FAToken,
  verifyAdmin2FAToken,
} from "../_shared/adminCsrf.ts";

const JSON_HEADERS = { ...adminCorsHeaders, "Content-Type": "application/json" };

// ---------- Helpers ----------

function b64urlEncode(bytes: Uint8Array): string {
  let s = btoa(String.fromCharCode(...bytes));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function b64urlDecode(s: string): Uint8Array {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
async function sha256(data: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return b64urlEncode(new Uint8Array(buf));
}
function random6DigitCode(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(100000 + (buf[0] % 900000));
}
function newNonce(): string {
  const b = new Uint8Array(12);
  crypto.getRandomValues(b);
  return b64urlEncode(b);
}

const OTP_TO = Deno.env.get("ADMIN_2FA_EMAIL") || "hola@ilinguerelax.com";
const OTP_FROM = "iLingue Relax Security <hola@ilinguerelax.com>";

async function sendOtpEmail(code: string): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY missing");
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 8px;color:#0f172a;">Código de acceso admin</h2>
      <p style="color:#475569;margin:0 0 16px;">Ingresa este código para verificar tu inicio de sesión en el panel privado. Vence en 5 minutos.</p>
      <div style="font-size:36px;font-weight:700;letter-spacing:8px;text-align:center;padding:16px;background:#f1f5f9;border-radius:8px;color:#0f172a;">${code}</div>
      <p style="color:#94a3b8;font-size:12px;margin-top:16px;">Si no fuiste tú, ignora este correo y cambia inmediatamente la clave admin.</p>
    </div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: OTP_FROM,
      to: [OTP_TO],
      subject: `Código admin: ${code}`,
      html,
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`resend_failed: ${res.status} ${t.slice(0, 200)}`);
  }
}

function maskEmail(addr: string): string {
  const [user, domain] = addr.split("@");
  if (!domain) return addr;
  const shown = user.slice(0, 2);
  return `${shown}${"*".repeat(Math.max(1, user.length - 2))}@${domain}`;
}

// ---------- Handler ----------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: adminCorsHeaders });

  // Origin + CSRF header still required — but 2FA itself is not (would be circular).
  const block = await assertAdminCsrf(req, { require2fa: false });
  if (block) return block;

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "");
    const expectedKey = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expectedKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), { status: 500, headers: JSON_HEADERS });
    }

    if (action === "validate") {
      const adminKey = String(body?.adminKey || "");
      const tokenCheck = await verifyAdmin2FAToken(req.headers.get("x-admin-2fa"));
      const valid = adminKey === expectedKey && tokenCheck.ok && tokenCheck.payload.kind === "session";
      // Return a normal response for an invalid stored session so the client can
      // distinguish it from temporary iOS/network failures and avoid erasing a
      // trusted-device login during app resume.
      return new Response(JSON.stringify({ valid }), { headers: JSON_HEADERS });
    }

    if (action === "request") {
      const adminKey = String(body?.adminKey || "");
      if (adminKey !== expectedKey) {
        const supabase = admin();
        await supabase.from("admin_audit_logs").insert({
          action: "admin_login_failed",
          details: { reason: "invalid_key" },
          ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip"),
          user_agent: req.headers.get("user-agent"),
        });
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: JSON_HEADERS });
      }
      const code = random6DigitCode();
      const nonce = newNonce();
      const codeHash = await sha256(`${nonce}:${code}`);
      const exp = Math.floor(Date.now() / 1000) + 5 * 60; // 5 minutes
      const challengeId = await signAdmin2FAToken({ kind: "otp", codeHash, nonce, exp });
      try {
        await sendOtpEmail(code);
      } catch (e) {
        console.error("[admin-2fa] email failed", e);
        return new Response(JSON.stringify({ error: "email_failed" }), { status: 502, headers: JSON_HEADERS });
      }
      return new Response(
        JSON.stringify({ challengeId, expiresIn: 300, sentTo: maskEmail(OTP_TO) }),
        { headers: JSON_HEADERS },
      );
    }

    if (action === "verify") {
      const challengeId = String(body?.challengeId || "");
      const code = String(body?.code || "").trim();
      if (!/^[0-9]{6}$/.test(code)) {
        return new Response(JSON.stringify({ error: "invalid_code_format" }), { status: 400, headers: JSON_HEADERS });
      }
      const check = await verifyAdmin2FAToken(challengeId);
      if (!check.ok || check.payload.kind !== "otp") {
        return new Response(JSON.stringify({ error: "challenge_expired" }), { status: 401, headers: JSON_HEADERS });
      }
      const nonce = String(check.payload.nonce || "");
      const codeHash = String(check.payload.codeHash || "");
      const provided = await sha256(`${nonce}:${code}`);
      if (!timingSafeEqual(new TextEncoder().encode(provided), new TextEncoder().encode(codeHash))) {
        return new Response(JSON.stringify({ error: "invalid_code" }), { status: 401, headers: JSON_HEADERS });
      }
      const remember = body?.remember === true;
      const ttlSeconds = remember ? 7 * 24 * 60 * 60 : 12 * 60 * 60; // 7d trusted / 12h
      const sessionExp = Math.floor(Date.now() / 1000) + ttlSeconds;
      const token = await signAdmin2FAToken({ kind: "session", iat: Math.floor(Date.now() / 1000), exp: sessionExp });
      
      const supabase = admin();
      await supabase.from("admin_audit_logs").insert({
        action: "admin_login_success",
        details: { remember },
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip"),
        user_agent: req.headers.get("user-agent"),
      });

      return new Response(
        JSON.stringify({ token, expiresAt: sessionExp * 1000, remembered: remember }),
        { headers: JSON_HEADERS },
      );
    }

    return new Response(JSON.stringify({ error: "unknown_action" }), { status: 400, headers: JSON_HEADERS });
  } catch (e) {
    console.error("[admin-2fa] error", e);
    return new Response(JSON.stringify({ error: "internal_error" }), { status: 500, headers: JSON_HEADERS });
  }
});
