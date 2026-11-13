import { company } from "@/content/company";
import { getService } from "@/content/services";
import { ContactActions } from "@/components/contact/ContactActions";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { JsonLd } from "@/components/ui/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import styles from "./page.module.css";

export const metadata = pageMetadata({
  title: "Contact & Request Service | Plumbers on Call CORP",
  description: `Contact ${company.name} for plumbing, heating and emergency service in ${company.region}. Call ${company.phone.display}, available ${company.availability}, or email us.`,
  path: "/contact",
});

const NEXT_STEPS = [
  "We review your request.",
  "We contact you by your preferred method to talk it through and, where needed, arrange a visit.",
  "You get a clear scope before any work begins.",
];

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

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />

      {/* The Valve: the slot of light stands to the right; the four ways in are on the left. */}
      <section className={styles.hero} aria-labelledby="contact-title">
        <div className={`container ${styles.heroInner}`}>
          <p className="eyebrow">Contact</p>
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

      <section id="request" className={`section ${styles.request}`} aria-labelledby="request-title">
        <div className={`container ${styles.requestGrid}`}>
          <div className={styles.aside}>
            <p className="eyebrow">Request service</p>
            <h2 id="request-title" className="display-m">
              {canSendInquiries ? "Tell us about the job." : "Online requests are coming soon."}
            </h2>
            <h3 className={styles.nextTitle}>What happens next</h3>
            <ol className={styles.next}>
              {NEXT_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>

          <div className={styles.formCol}>
            {notice ? (
              <p role="status" className={notice.tone === "ok" ? styles.noticeOk : styles.noticeWarn}>
                {notice.text} <a href={company.phone.href}>{company.phone.display}</a>
              </p>
            ) : null}
            {canSendInquiries ? (
              <>
                <p className={styles.formIntro}>
                  Email is optional unless you&rsquo;d like us to reply by email.
                </p>
                <InquiryForm defaultService={defaultService} />
              </>
            ) : (
              <div className={styles.soon}>
                <p>
                  The request form is being connected. In the meantime, call{company.sms ? ", text" : ""} or email
                  and we&rsquo;ll take it from there.
                </p>
                <div className={styles.soonActions}>
                  <a href={company.phone.href} className="btn btn--gold">
                    Call {company.phone.display}
                  </a>
                  <a href={`mailto:${company.email}`} className="btn">
                    Email us
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
