import { company } from "@/content/company";
import { getService } from "@/content/services";
import { ContactActions } from "@/components/contact/ContactActions";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { PhoneIcon } from "@/components/ui/Icon";
import { JsonLd } from "@/components/ui/JsonLd";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import styles from "./page.module.css";

export const metadata = pageMetadata({
  title: "Contact & Request Service | Plumbers on Call CORP",
  description: `Contact ${company.name} for plumbing, heating and emergency service in ${company.region}. Call ${company.phone.display}, available ${company.availability}, or email us.`,
  path: "/contact",
});

/* The steps of a request. The order is real, so they are numbered (DESIGN.md rule 6). */
const NEXT_STEPS = {
  /** After the request form has been sent. */
  form: [
    "We review your request.",
    "We contact you by your preferred method to talk it through and, where needed, arrange a visit.",
    "You get a clear scope before any work begins.",
  ],
  /** Without the form, a request starts with a call, a text or an email. */
  direct: [
    `Call${company.sms ? ", text" : ""} or email us with a few details about the job.`,
    "We talk it through with you and, where needed, arrange a visit.",
    "You get a clear scope before any work begins.",
  ],
};

const STATUS_NOTICES: Record<string, { tone: "ok" | "warn"; text: string }> = {
  sent: { tone: "ok", text: "Request received. We’ll be in touch. For anything urgent, please call." },
  invalid: { tone: "warn", text: "Some details were missing or didn’t look right. Please check the form, or call us." },
  error: { tone: "warn", text: "We couldn’t send your request just now. Please call us instead." },
  unavailable: { tone: "warn", text: "Online requests aren’t available right now. Please call or email us." },
  limited: { tone: "warn", text: "Too many requests from this connection. Please call us instead." },
};

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ContactPage({ searchParams }: Props) {
  const { service, status } = await searchParams;
  const defaultService = typeof service === "string" ? getService(service)?.slug : undefined;
  // Set by /api/inquiry after a no-JavaScript form post.
  const notice = typeof status === "string" ? STATUS_NOTICES[status] : undefined;

  // The form is only rendered when /api/inquiry can actually deliver it: the route
  // returns 503 unless both RESEND_API_KEY and INQUIRY_TO_EMAIL are set. Without them
  // visitors get phone, text and email instead of a form that cannot send. Read per
  // request (this page is dynamic because of searchParams), so setting the variables in
  // the host's environment turns the form on without a code change.
  const canSendInquiries = Boolean(process.env.RESEND_API_KEY && process.env.INQUIRY_TO_EMAIL);

  const steps = (
    <ol className={styles.next}>
      {NEXT_STEPS[canSendInquiries ? "form" : "direct"].map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  );

  return (
    // One wrapper for both sections: the words keep to the left of the frame all the way
    // down, and the slot of light and the valve stay clear beside them.
    <div className={styles.page}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />

      {/* The Valve: the four ways in on the left, the slot of light and the valve to their right. */}
      <section className={styles.hero} aria-labelledby="contact-title">
        <div className={`container ${styles.heroInner}`}>
          <h1 id="contact-title" className={styles.title}>
            Open <em>the line.</em>
          </h1>
          <p className={styles.lede}>
            For anything urgent, call: we are available {company.availability}. For planned work, a few details
            about the job help us give you a clear next step.
          </p>
          <ContactActions formAvailable={canSendInquiries} />
        </div>
      </section>

      <section id="request" className={styles.request} aria-labelledby="request-title">
        <div className={`container ${styles.requestInner}`}>
          {notice ? (
            <p role="status" className={notice.tone === "ok" ? styles.noticeOk : styles.noticeWarn}>
              {notice.text} <a href={company.phone.href}>{company.phone.display}</a>
            </p>
          ) : null}

          {canSendInquiries ? (
            <>
              <h2 id="request-title" className={`display-m ${styles.heading}`}>
                Tell us about <em>the job.</em>
              </h2>
              <div className={`panel ${styles.formPanel}`}>
                <p className={styles.formIntro}>Email is optional unless you&rsquo;d like us to reply by email.</p>
                <InquiryForm defaultService={defaultService} />
              </div>
              <h3 className={`display-s ${styles.nextTitle}`}>What happens next</h3>
              {steps}
            </>
          ) : (
            <>
              <h2 id="request-title" className={`display-m ${styles.heading}`}>
                What happens <em>next.</em>
              </h2>
              {steps}
              <div className={styles.reach}>
                <TrackedLink href={company.phone.href} event="phone_click" placement="contact-next" className="btn btn--gold">
                  <PhoneIcon /> Call {company.phone.display}
                </TrackedLink>
                {company.sms ? (
                  <TrackedLink href={company.sms} event="phone_click" placement="contact-next-text" className="btn">
                    Text us
                  </TrackedLink>
                ) : null}
                <a href={`mailto:${company.email}`} className="btn">
                  Email us
                </a>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
