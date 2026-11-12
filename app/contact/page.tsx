import { company } from "@/content/company";
import { getService } from "@/content/services";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { ClockIcon, MailIcon, PhoneIcon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { pageMetadata } from "@/lib/seo";
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

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ContactPage({ searchParams }: Props) {
  const { service } = await searchParams;
  const defaultService = typeof service === "string" ? getService(service)?.slug : undefined;

  // The form is only rendered when /api/inquiry can actually deliver it: the route
  // returns 503 unless both RESEND_API_KEY and INQUIRY_TO_EMAIL are set. Without them
  // visitors get phone + email instead of a form that cannot send. Read per request
  // (this page is dynamic because of searchParams), so setting the variables in the
  // host's environment turns the form on without a code change.
  const canSendInquiries = Boolean(process.env.RESEND_API_KEY && process.env.INQUIRY_TO_EMAIL);

  return (
    <>
      <PageHero
        variant="plain"
        eyebrow="Contact"
        title="Tell us what you need."
        lede={
          <p>
            For an urgent problem, call &mdash; we&rsquo;re available {company.availability}. For planned work, a few
            details about the job help us give you a clear next step.
          </p>
        }
        crumbs={[{ name: "Contact", path: "/contact" }]}
      />

      <section className={`section section--paper ${styles.section}`}>
        <div className={`container ${styles.layout}`}>
          <section className={styles.urgent} aria-labelledby="contact-urgent">
            <h2 id="contact-urgent" className="display-s">
              Urgent? Call now.
            </h2>
            <TrackedLink
              href={company.phone.href}
              event="phone_click"
              placement="contact-page"
              className={styles.bigPhone}
            >
              <PhoneIcon className={styles.bigPhoneIcon} />
              {company.phone.display}
            </TrackedLink>
            <p className={styles.meta}>
              <ClockIcon className={styles.metaIcon} /> Available {company.availability}
            </p>
          </section>

          <section className={styles.formCol} aria-labelledby="contact-form-title">
            {canSendInquiries ? (
              <>
                <h2 id="contact-form-title" className="display-m">
                  Request service
                </h2>
                <p className={styles.formIntro}>
                  A few details about the job help us prepare. Email is optional unless you&rsquo;d like us to
                  reply by email.
                </p>
                <InquiryForm defaultService={defaultService} />
              </>
            ) : (
              <div className={styles.unavailable}>
                <h2 id="contact-form-title" className="display-m">
                  Online requests are coming soon
                </h2>
                <p className={styles.formIntro}>
                  In the meantime, call or email and we&rsquo;ll take it from there.
                </p>
                <div className={styles.actions}>
                  <TrackedLink
                    href={company.phone.href}
                    event="phone_click"
                    placement="contact-page-panel"
                    className="btn btn--dark"
                  >
                    <PhoneIcon /> Call {company.phone.display}
                  </TrackedLink>
                  <a href={`mailto:${company.email}`} className="btn">
                    <MailIcon /> Email us
                  </a>
                </div>
              </div>
            )}
          </section>

          <div className={styles.details}>
            <section aria-labelledby="contact-email">
              <h2 id="contact-email" className={styles.smallHeading}>
                Email
              </h2>
              <a href={`mailto:${company.email}`} className={styles.email}>
                {company.email}
              </a>
            </section>

            {company.bookingUrl ? (
              <section aria-labelledby="contact-booking">
                <h2 id="contact-booking" className={styles.smallHeading}>
                  Online booking
                </h2>
                <TrackedLink
                  href={company.bookingUrl}
                  event="booking_click"
                  placement="contact-page"
                  className="text-link"
                  target="_blank"
                  rel="noopener"
                >
                  Book a visit online <span className="text-link__rule" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </TrackedLink>
              </section>
            ) : null}

            <section aria-labelledby="contact-next">
              <h2 id="contact-next" className={styles.smallHeading}>
                What happens next
              </h2>
              <ol className={styles.steps}>
                {NEXT_STEPS.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
