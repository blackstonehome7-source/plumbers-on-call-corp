import { company } from "@/content/company";
import { formatInquiryEmail, isLikelySpam, validateInquiry } from "@/lib/inquiry";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 10 * 1024;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RESEND_TIMEOUT_MS = 10_000;

const UNAVAILABLE = `Online requests are not available right now. Please call ${company.phone.display}.`;
const SEND_FAILED = `We couldn't send your request. Please call ${company.phone.display}.`;

/**
 * Best-effort rate limit, kept in this server instance's memory only. Serverless
 * deployments run many short-lived instances, so this slows a single abuser
 * down but is not a guarantee.
 */
const hits = new Map<string, number[]>();

function rateLimited(ip: string, now: number): boolean {
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times[times.length - 1] <= now - RATE_WINDOW_MS) hits.delete(key);
    }
  }
  const recent = (hits.get(ip) ?? []).filter((t) => t > now - RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

function json(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

type Outcome = "sent" | "invalid" | "error" | "unavailable" | "limited";

/** No-JS form posts get a redirect back to /contact with a status, never raw JSON. */
function redirectBack(request: Request, outcome: Outcome): Response {
  const url = new URL(`/contact?status=${outcome}#request`, request.url);
  return Response.redirect(url, 303);
}

/** Reads the body as text, giving up (null) once it exceeds `limit` bytes. */
async function readCapped(request: Request, limit: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function POST(request: Request): Promise<Response> {
  const contentType = (request.headers.get("content-type") ?? "").trim();
  // The form posts JSON via fetch; without JavaScript the browser posts urlencoded.
  const isFormPost = /^application\/x-www-form-urlencoded\b/i.test(contentType);
  const fail = (status: number, outcome: Outcome, body: Record<string, unknown>) =>
    isFormPost ? redirectBack(request, outcome) : json(status, body);

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.INQUIRY_TO_EMAIL;
  if (!apiKey || !to) return fail(503, "unavailable", { ok: false, error: UNAVAILABLE });

  if (rateLimited(clientIp(request), Date.now())) {
    return fail(429, "limited", {
      ok: false,
      error: `Too many requests. Please try again later or call ${company.phone.display}.`,
    });
  }

  if (!isFormPost && !/^application\/json\b/i.test(contentType)) {
    return json(415, { ok: false, error: "Requests must be sent as JSON." });
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return fail(413, "invalid", { ok: false, error: "Your request is too large." });
  }
  const bodyText = await readCapped(request, MAX_BODY_BYTES);
  if (bodyText === null) return fail(413, "invalid", { ok: false, error: "Your request is too large." });

  let raw: unknown;
  if (isFormPost) {
    // A no-JS visitor can't report how long the form was open, so this path
    // relies on the honeypot alone for spam filtering.
    raw = { ...Object.fromEntries(new URLSearchParams(bodyText)), elapsedMs: 3000 };
  } else {
    try {
      raw = JSON.parse(bodyText);
    } catch {
      return json(400, { ok: false, error: "We couldn't read your request." });
    }
  }

  // Don't tip off bots: pretend success, send nothing.
  if (isLikelySpam(raw)) return isFormPost ? redirectBack(request, "sent") : json(200, { ok: true });

  const result = validateInquiry(raw);
  if (!result.ok) return fail(400, "invalid", { ok: false, errors: result.errors });

  const { subject, text } = formatInquiryEmail(result.data);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        // `||`, not `??`: an empty INQUIRY_FROM_EMAIL= copied from .env.example must fall back too.
        from: process.env.INQUIRY_FROM_EMAIL || "Plumbers on Call Website <onboarding@resend.dev>",
        to: [to],
        ...(result.data.email ? { reply_to: result.data.email } : {}),
        subject,
        text,
      }),
      signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
    });
    if (!response.ok) {
      // Status only: never log the customer's details or the API key.
      console.error(`[inquiry] Resend responded with status ${response.status}`);
      return fail(502, "error", { ok: false, error: SEND_FAILED });
    }
  } catch (error) {
    const reason = error instanceof Error ? error.name : "UnknownError";
    console.error(`[inquiry] Resend request failed: ${reason}`);
    return fail(502, "error", { ok: false, error: SEND_FAILED });
  }

  return isFormPost ? redirectBack(request, "sent") : json(200, { ok: true });
}
