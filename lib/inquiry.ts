/**
 * Service-request ("inquiry") rules shared by the contact form and the
 * /api/inquiry route. Framework-free on purpose: no next/react imports, so it
 * runs in the browser, on the server and under `node --test`.
 * Keep to erasable TypeScript syntax (Node strips the types natively).
 */
import type { ServiceSlug } from "../content/types";

export const SERVICE_OPTIONS: readonly { value: ServiceSlug | "other"; label: string }[] = [
  { value: "boilers-heating", label: "Boilers & Heating" },
  { value: "water-heaters", label: "Water Heaters" },
  { value: "bathroom-plumbing", label: "Bathroom Plumbing & Remodels" },
  { value: "residential-plumbing", label: "Residential Plumbing" },
  { value: "commercial-plumbing", label: "Commercial Plumbing" },
  { value: "emergency-plumbing", label: "Emergency Plumbing" },
  { value: "other", label: "Something else" },
];

export const CONTACT_METHODS = ["phone", "email", "text"] as const;

export type ContactMethod = (typeof CONTACT_METHODS)[number];
export type InquiryService = ServiceSlug | "other";

/** Raw, untrusted payload as it arrives from the form / request body. */
export type InquiryInput = Record<string, unknown>;

export type Inquiry = {
  name: string;
  /** Normalized to "(XXX) XXX-XXXX". */
  phone: string;
  /** Empty string when not provided. */
  email: string;
  service: InquiryService;
  message: string;
  contactMethod: ContactMethod;
};

export type InquiryErrors = Partial<Record<keyof Inquiry, string>>;

export type InquiryResult = { ok: true; data: Inquiry } | { ok: false; errors: InquiryErrors };

const NAME_MIN = 2;
const NAME_MAX = 80;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 2000;
const EMAIL_MAX = 254;
const MIN_FILL_MS = 3000;

/** Matches C0 controls, DEL and C1 controls. */
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/g;
/** Same, but keeps "\n". */
const CONTROL_CHARS_EXCEPT_NEWLINE = /[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/g;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/;

function asRecord(raw: unknown): InquiryInput {
  return raw !== null && typeof raw === "object" && !Array.isArray(raw) ? (raw as InquiryInput) : {};
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Single-line field: control chars become spaces, whitespace collapses. */
function cleanLine(value: unknown): string {
  return str(value).replace(CONTROL_CHARS, " ").replace(/\s+/g, " ").trim();
}

/** Multi-line field: normalize line endings, keep "\n", drop other controls. */
function cleanMultiline(value: unknown): string {
  return str(value)
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_CHARS_EXCEPT_NEWLINE, "")
    .trim();
}

function normalizePhone(value: string): string | null {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (digits.length !== 10) return null;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function isServiceValue(value: string): value is InquiryService {
  return SERVICE_OPTIONS.some((option) => option.value === value);
}

function isContactMethod(value: string): value is ContactMethod {
  return (CONTACT_METHODS as readonly string[]).includes(value);
}

export function validateInquiry(raw: unknown): InquiryResult {
  const input = asRecord(raw);
  const errors: InquiryErrors = {};

  const name = cleanLine(input.name);
  if (name.length < NAME_MIN) errors.name = "Please tell us your name.";
  else if (name.length > NAME_MAX) errors.name = `Please keep your name under ${NAME_MAX} characters.`;

  const phoneRaw = cleanLine(input.phone);
  const phone = normalizePhone(phoneRaw);
  if (!phoneRaw) errors.phone = "Please enter a phone number we can reach you on.";
  else if (!phone) errors.phone = "Please enter a 10-digit US phone number.";

  const contactRaw = cleanLine(input.contactMethod).toLowerCase();
  const contactMethod: ContactMethod | null = contactRaw === "" ? "phone" : isContactMethod(contactRaw) ? contactRaw : null;
  if (!contactMethod) errors.contactMethod = "Please choose how you'd like us to contact you.";

  const email = cleanLine(input.email).replace(/\s/g, "").toLowerCase();
  if (email) {
    if (email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email)) errors.email = "Please enter a valid email address.";
  } else if (contactMethod === "email") {
    errors.email = "Please enter your email so we can reply.";
  }

  const service = cleanLine(input.service);
  if (!isServiceValue(service)) errors.service = "Please choose the type of work you need.";

  const message = cleanMultiline(input.message);
  if (message.length < MESSAGE_MIN) errors.message = "Please add a few words about what's going on.";
  else if (message.length > MESSAGE_MAX) errors.message = `Please keep your message under ${MESSAGE_MAX} characters.`;

  if (Object.keys(errors).length > 0 || !phone || !contactMethod || !isServiceValue(service)) {
    return { ok: false, errors };
  }

  return { ok: true, data: { name, phone, email, service, message, contactMethod } };
}

/**
 * Cheap bot filter. The form sends a hidden honeypot field `company_website`
 * (humans leave it empty) and `elapsedMs`, how long the form was open, measured
 * on the client with `performance.now()`. A duration, not an epoch timestamp,
 * so a skewed client clock can't flag a real person.
 */
export function isLikelySpam(raw: unknown): boolean {
  const input = asRecord(raw);

  const honeypot = input.company_website;
  if (typeof honeypot === "string" ? honeypot.trim() !== "" : honeypot != null) return true;

  const elapsedMs = input.elapsedMs;
  if (typeof elapsedMs !== "number" || !Number.isFinite(elapsedMs) || elapsedMs < 0) return true;
  return elapsedMs < MIN_FILL_MS;
}

export function serviceLabel(value: InquiryService): string {
  return SERVICE_OPTIONS.find((option) => option.value === value)?.label ?? "Something else";
}

/** "Jane Doe" -> "Jane D.", "Jane" -> "Jane". */
function shortName(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length < 2) return parts[0] ?? "";
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

const CONTACT_LABELS: Record<ContactMethod, string> = {
  phone: "Phone call",
  email: "Email",
  text: "Text message",
};

/** Plain-text email only: no HTML is ever produced, so nothing can be injected. */
export function formatInquiryEmail(data: Inquiry): { subject: string; text: string } {
  const label = serviceLabel(data.service);
  const subject = `Website inquiry — ${label} — ${shortName(data.name)}`;
  const text = [
    "New service request from the website.",
    "",
    `Name: ${data.name}`,
    `Phone: ${data.phone}`,
    `Email: ${data.email || "(not provided)"}`,
    `Preferred contact: ${CONTACT_LABELS[data.contactMethod]}`,
    `Service: ${label}`,
    "",
    "Message:",
    data.message,
  ].join("\n");
  return { subject, text };
}
