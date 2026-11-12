"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { company } from "@/content/company";
import type { ServiceSlug } from "@/content/types";
import { track } from "@/lib/analytics";
import {
  CONTACT_METHODS,
  SERVICE_OPTIONS,
  validateInquiry,
  type ContactMethod,
  type Inquiry,
  type InquiryErrors,
} from "@/lib/inquiry";
import styles from "./InquiryForm.module.css";

type Field = keyof Inquiry;
type Status = "idle" | "submitting" | "success" | "error";

/** Summary order = visual order of the fields. */
const FIELDS: readonly Field[] = ["name", "phone", "email", "service", "contactMethod", "message"];

const FIELD_LABELS: Record<Field, string> = {
  name: "Name",
  phone: "Phone",
  email: "Email",
  service: "Service",
  contactMethod: "Preferred contact",
  message: "Message",
};

const METHOD_OPTIONS: { value: ContactMethod; label: string }[] = [
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "text", label: "Text" },
];

const METHOD_PHRASE: Record<ContactMethod, string> = {
  phone: "phone",
  email: "email",
  text: "text message",
};

const fieldId = (field: Field) => `inquiry-${field}`;
const errorId = (field: Field) => `inquiry-${field}-error`;

function isField(value: string): value is Field {
  return (FIELDS as readonly string[]).includes(value);
}

function asContactMethod(value: string): ContactMethod | undefined {
  return CONTACT_METHODS.find((method) => method === value);
}

/** Keeps only known field names with string messages from a 400 response. */
function toFieldErrors(raw: unknown): InquiryErrors {
  const errors: InquiryErrors = {};
  if (raw === null || typeof raw !== "object") return errors;
  for (const [key, value] of Object.entries(raw)) {
    if (isField(key) && typeof value === "string") errors[key] = value;
  }
  return errors;
}

type Props = {
  /** Preselects the service, e.g. from `/contact?service=water-heaters`. */
  defaultService?: ServiceSlug;
};

export function InquiryForm({ defaultService }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [contactMethod, setContactMethod] = useState<ContactMethod>("phone");
  const [sentMethod, setSentMethod] = useState<ContactMethod>("phone");
  /** Bumped on every failed submit so the notice is re-focused even if it was already showing. */
  const [failedAttempt, setFailedAttempt] = useState(0);

  const openedAt = useRef<number | null>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Measured on the client only, as a duration: see isLikelySpam.
    openedAt.current = performance.now();
  }, []);

  useEffect(() => {
    if (failedAttempt > 0) noticeRef.current?.focus();
  }, [failedAttempt]);

  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  const fail = (fieldErrors: InquiryErrors, message: string | null) => {
    setErrors(fieldErrors);
    setServerMessage(message);
    setStatus("error");
    setFailedAttempt((n) => n + 1);
  };

  const handleChange = (event: FormEvent<HTMLFormElement>) => {
    const target = event.target;
    if (
      !(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)
    ) {
      return;
    }
    const method = target.name === "contactMethod" ? asContactMethod(target.value) : undefined;
    const field = target.name;
    if (!isField(field)) return;
    setErrors((prev) => {
      if (!prev[field] && !(method && prev.email)) return prev;
      const next = { ...prev };
      delete next[field];
      // Whether email is required depends on the contact method.
      if (method) delete next.email;
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return;

    const form = new FormData(event.currentTarget);
    const read = (name: string) => {
      const value = form.get(name);
      return typeof value === "string" ? value : "";
    };
    const payload = {
      name: read("name"),
      phone: read("phone"),
      email: read("email"),
      service: read("service"),
      message: read("message"),
      contactMethod: read("contactMethod"),
      company_website: read("company_website"),
    };

    const result = validateInquiry(payload);
    if (!result.ok) {
      fail(result.errors, null);
      return;
    }

    const started = openedAt.current ?? performance.now();
    setStatus("submitting");
    setServerMessage(null);
    setErrors({});

    let response: Response;
    try {
      response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, elapsedMs: Math.round(performance.now() - started) }),
      });
    } catch {
      track("inquiry_failed", { status: "network" });
      fail({}, "We couldn't reach our server. Please check your connection and try again.");
      return;
    }

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      // Non-JSON response: handled as a generic failure below.
    }
    const data = body !== null && typeof body === "object" ? (body as Record<string, unknown>) : {};

    if (response.ok && data.ok === true) {
      track("inquiry_submitted");
      setSentMethod(result.data.contactMethod);
      setStatus("success");
      return;
    }

    track("inquiry_failed", { status: String(response.status) });
    const fieldErrors = response.status === 400 ? toFieldErrors(data.errors) : {};
    if (Object.keys(fieldErrors).length > 0) {
      fail(fieldErrors, null);
    } else {
      fail({}, typeof data.error === "string" ? data.error : "We couldn't send your request.");
    }
  };

  if (status === "success") {
    return (
      <div ref={successRef} tabIndex={-1} className={styles.success} aria-labelledby="inquiry-success-title">
        <p className="eyebrow">Thank you</p>
        <h3 id="inquiry-success-title" className={`display-m ${styles.successTitle}`}>
          Request received
        </h3>
        <p className={styles.successText}>
          We&rsquo;ll be in touch by {METHOD_PHRASE[sentMethod]}. For anything urgent, call{" "}
          <a href={company.phone.href} className={styles.phoneLink}>
            {company.phone.display}
          </a>
          .
        </p>
      </div>
    );
  }

  const submitting = status === "submitting";
  const errorFields = FIELDS.filter((field) => errors[field]);
  const showNotice = status === "error" && (errorFields.length > 0 || serverMessage !== null);
  const emailRequired = contactMethod === "email";

  const describedBy = (field: Field, ...extra: string[]) =>
    [...extra, errors[field] ? errorId(field) : null].filter(Boolean).join(" ") || undefined;

  const fieldError = (field: Field) =>
    errors[field] ? (
      <p id={errorId(field)} className={styles.error}>
        {errors[field]}
      </p>
    ) : null;

  return (
    // method/action are a no-JS fallback only: they keep personal details out of the URL.
    <form
      className={styles.form}
      method="post"
      action="/api/inquiry"
      noValidate
      onSubmit={handleSubmit}
      onChange={handleChange}
      aria-busy={submitting}
    >
      {showNotice ? (
        <div ref={noticeRef} tabIndex={-1} className={styles.notice} aria-labelledby="inquiry-notice-title">
          {errorFields.length > 0 ? (
            <>
              <h3 id="inquiry-notice-title" className={styles.noticeTitle}>
                Please check {errorFields.length === 1 ? "one detail" : `${errorFields.length} details`}
              </h3>
              <ul className={styles.noticeList}>
                {errorFields.map((field) => (
                  <li key={field}>
                    <a href={`#${field === "contactMethod" ? "inquiry-contactMethod-phone" : fieldId(field)}`}>
                      {FIELD_LABELS[field]}: {errors[field]}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h3 id="inquiry-notice-title" className={styles.noticeTitle}>
                Your request wasn&rsquo;t sent
              </h3>
              <p>{serverMessage}</p>
            </>
          )}
          <p className={styles.noticeCall}>
            You can always call us:{" "}
            <a href={company.phone.href} className={styles.phoneLink}>
              {company.phone.display}
            </a>
          </p>
        </div>
      ) : null}

      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor={fieldId("name")} className={styles.label}>
            Name
          </label>
          <input
            id={fieldId("name")}
            name="name"
            type="text"
            autoComplete="name"
            aria-required="true"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy("name")}
            className={styles.input}
          />
          {fieldError("name")}
        </div>

        <div className={styles.field}>
          <label htmlFor={fieldId("phone")} className={styles.label}>
            Phone
          </label>
          <input
            id={fieldId("phone")}
            name="phone"
            type="tel"
            autoComplete="tel"
            aria-required="true"
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={describedBy("phone")}
            className={styles.input}
          />
          {fieldError("phone")}
        </div>

        <div className={styles.field}>
          <label htmlFor={fieldId("email")} className={styles.label}>
            Email{" "}
            <span className={styles.optional}>{emailRequired ? "(required for email replies)" : "(optional)"}</span>
          </label>
          <input
            id={fieldId("email")}
            name="email"
            type="email"
            autoComplete="email"
            aria-required={emailRequired}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy("email")}
            className={styles.input}
          />
          {fieldError("email")}
        </div>

        <div className={styles.field}>
          <label htmlFor={fieldId("service")} className={styles.label}>
            Service
          </label>
          <div className={styles.selectWrap}>
            <select
              id={fieldId("service")}
              name="service"
              defaultValue={defaultService ?? ""}
              aria-required="true"
              aria-invalid={errors.service ? true : undefined}
              aria-describedby={describedBy("service")}
              className={`${styles.input} ${styles.select}`}
            >
              <option value="">Choose a service</option>
              {SERVICE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {fieldError("service")}
        </div>
      </div>

      <fieldset className={styles.fieldset} aria-describedby={describedBy("contactMethod")}>
        <legend className={styles.label}>Preferred contact</legend>
        <div className={styles.radios}>
          {METHOD_OPTIONS.map((option) => (
            <label key={option.value} className={styles.radio}>
              <input
                id={`inquiry-contactMethod-${option.value}`}
                type="radio"
                name="contactMethod"
                value={option.value}
                checked={contactMethod === option.value}
                onChange={() => setContactMethod(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {fieldError("contactMethod")}
      </fieldset>

      <div className={styles.field}>
        <label htmlFor={fieldId("message")} className={styles.label}>
          How can we help?
        </label>
        <textarea
          id={fieldId("message")}
          name="message"
          rows={5}
          aria-required="true"
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={describedBy("message", "inquiry-message-hint")}
          className={`${styles.input} ${styles.textarea}`}
        />
        <p id="inquiry-message-hint" className={styles.hint}>
          A few words about the problem or project, and the town you&rsquo;re in.
        </p>
        {fieldError("message")}
      </div>

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
      <div className={styles.trap} aria-hidden="true">
        <label htmlFor="inquiry-company-website">Company website</label>
        <input id="inquiry-company-website" type="text" name="company_website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={styles.footer}>
        <button type="submit" className={`btn btn--dark ${styles.submit}`} disabled={submitting} aria-busy={submitting}>
          {submitting ? "Sending…" : "Send request"}
        </button>
        <p className={styles.note}>
          We use your details only to respond to this request. <Link href="/privacy">Privacy policy</Link>
        </p>
      </div>
    </form>
  );
}
