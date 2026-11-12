import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatInquiryEmail, isLikelySpam, validateInquiry, type Inquiry } from "./inquiry.ts";

const valid = {
  name: "  Jane   Doe ",
  phone: "1 (781) 555-0123",
  email: " Jane@Example.com ",
  service: "water-heaters",
  message: "  Our water heater is leaking from the bottom.\r\nPlease call.  ",
  contactMethod: "phone",
};

function errorsFor(overrides: Record<string, unknown>) {
  const result = validateInquiry({ ...valid, ...overrides });
  assert.equal(result.ok, false);
  return result.ok ? {} : result.errors;
}

describe("validateInquiry", () => {
  it("accepts valid input and normalizes it", () => {
    const result = validateInquiry(valid);
    assert.deepEqual(result, {
      ok: true,
      data: {
        name: "Jane Doe",
        phone: "(781) 555-0123",
        email: "jane@example.com",
        service: "water-heaters",
        message: "Our water heater is leaking from the bottom.\nPlease call.",
        contactMethod: "phone",
      },
    });
  });

  it("defaults contactMethod to phone and allows a missing email", () => {
    const result = validateInquiry({ ...valid, email: "", contactMethod: undefined });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.contactMethod, "phone");
      assert.equal(result.data.email, "");
    }
  });

  it("strips control characters, keeping newlines only in the message", () => {
    const result = validateInquiry({ ...valid, name: "Jane\u0000\nDoe", message: "Leak\u0007 under\nthe sink\tnow" });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.name, "Jane Doe");
      assert.equal(result.data.message, "Leak under\nthe sinknow");
    }
  });

  it("rejects a non-object payload with every required field flagged", () => {
    const result = validateInquiry(null);
    assert.equal(result.ok, false);
    if (!result.ok) assert.deepEqual(Object.keys(result.errors).sort(), ["message", "name", "phone", "service"]);
  });

  it("rejects a name that is too short or too long", () => {
    assert.ok(errorsFor({ name: " J " }).name);
    assert.ok(errorsFor({ name: "x".repeat(81) }).name);
    assert.equal(validateInquiry({ ...valid, name: "x".repeat(80) }).ok, true);
  });

  it("requires a phone number", () => {
    assert.equal(errorsFor({ phone: "  " }).phone, "Please enter a phone number we can reach you on.");
  });

  it("rejects phone numbers without 10 US digits", () => {
    assert.ok(errorsFor({ phone: "555-0123" }).phone);
    assert.ok(errorsFor({ phone: "2 781 555 0123" }).phone, "11 digits must start with 1");
    assert.ok(errorsFor({ phone: "781555012345" }).phone);
    assert.equal(validateInquiry({ ...valid, phone: "781.555.0123" }).ok, true);
  });

  it("rejects an invalid or overlong email", () => {
    assert.ok(errorsFor({ email: "jane@" }).email);
    assert.ok(errorsFor({ email: "jane@example" }).email);
    assert.ok(errorsFor({ email: "not an email" }).email);
    assert.ok(errorsFor({ email: `${"a".repeat(250)}@example.com` }).email);
  });

  it("requires an email when contactMethod is email", () => {
    assert.ok(errorsFor({ email: "", contactMethod: "email" }).email);
    assert.equal(validateInquiry({ ...valid, contactMethod: "email" }).ok, true);
  });

  it("rejects an unknown service and accepts 'other'", () => {
    assert.ok(errorsFor({ service: "roofing" }).service);
    assert.ok(errorsFor({ service: undefined }).service);
    assert.equal(validateInquiry({ ...valid, service: "other" }).ok, true);
  });

  it("rejects a message that is too short or too long", () => {
    assert.ok(errorsFor({ message: "help" }).message);
    assert.ok(errorsFor({ message: "x".repeat(2001) }).message);
  });

  it("rejects an unknown contactMethod", () => {
    assert.ok(errorsFor({ contactMethod: "fax" }).contactMethod);
  });
});

describe("isLikelySpam", () => {
  const human = { elapsedMs: 20_000, company_website: "" };

  it("passes a human submission", () => {
    assert.equal(isLikelySpam(human), false);
    assert.equal(isLikelySpam({ elapsedMs: 3000 }), false);
    assert.equal(isLikelySpam({ elapsedMs: 3000.5 }), false);
  });

  it("flags a filled honeypot", () => {
    assert.equal(isLikelySpam({ ...human, company_website: "https://spam.example" }), true);
  });

  it("flags a form submitted too fast", () => {
    assert.equal(isLikelySpam({ elapsedMs: 2999 }), true);
    assert.equal(isLikelySpam({ elapsedMs: 0 }), true);
  });

  it("flags a missing, non-numeric, non-finite or negative elapsedMs", () => {
    assert.equal(isLikelySpam({ company_website: "" }), true);
    assert.equal(isLikelySpam({ elapsedMs: "20000" }), true);
    assert.equal(isLikelySpam({ elapsedMs: null }), true);
    assert.equal(isLikelySpam({ elapsedMs: Number.NaN }), true);
    assert.equal(isLikelySpam({ elapsedMs: Number.POSITIVE_INFINITY }), true);
    assert.equal(isLikelySpam({ elapsedMs: -5000 }), true);
    assert.equal(isLikelySpam(undefined), true);
  });

  it("ignores the old client epoch timestamp", () => {
    assert.equal(isLikelySpam({ startedAt: Date.now() - 60_000 }), true);
  });
});

describe("formatInquiryEmail", () => {
  const data: Inquiry = {
    name: "Jane Doe",
    phone: "(781) 555-0123",
    email: "",
    service: "water-heaters",
    message: "<script>alert(1)</script> leaking tank",
    contactMethod: "text",
  };

  it("builds a subject with the service label and short name", () => {
    assert.equal(formatInquiryEmail(data).subject, "Website inquiry — Water Heaters — Jane D.");
  });

  it("produces plain text that includes the phone and no HTML markup", () => {
    const { text } = formatInquiryEmail(data);
    assert.ok(text.includes("Phone: (781) 555-0123"));
    assert.ok(text.includes("Email: (not provided)"));
    assert.ok(text.includes("Preferred contact: Text message"));
    assert.doesNotMatch(text, /<(html|body|p|br|div)\b/i);
    // Customer text is passed through verbatim, never wrapped in HTML.
    assert.ok(text.endsWith("Message:\n<script>alert(1)</script> leaking tank"));
  });
});
