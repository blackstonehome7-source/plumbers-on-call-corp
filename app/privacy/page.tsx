import type { CSSProperties } from "react";
import Link from "next/link";
import { company } from "@/content/company";
import { PageHero } from "@/components/ui/PageHero";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy | Plumbers on Call CORP",
  description: `How ${company.name} handles the details you share through this website: what we collect, why, how long we keep it, and who to contact with questions.`,
  path: "/privacy",
});

/*
 * Plain-language policy drafted for a small Massachusetts business website.
 * It is not legal advice: the owner should have it reviewed before launch, and it
 * must be updated (with a new "Last updated" date) before adding analytics,
 * advertising tags, cookies or any new way of collecting personal information.
 */

const LAST_UPDATED = "November 12, 2026";

/** Extra space above each topic; `.prose` only spaces siblings evenly. */
const topic: CSSProperties = { marginTop: "2.5rem" };

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        variant="plain"
        eyebrow="Privacy"
        title="Privacy policy"
        lede={<p>How we handle the details you share with us through this website.</p>}
        crumbs={[{ name: "Privacy", path: "/privacy" }]}
      />

      <section className="section section--paper">
        <div className="container">
          <div className="prose">
            <p className="caption">Last updated: {LAST_UPDATED}</p>

            <p>
              This website is operated by {company.name}, a plumbing company serving {company.region},{" "}
              {company.state}. This page explains, in plain language, what information we collect through the
              site and what we do with it.
            </p>

            <h2 className="display-s" style={topic}>
              What we collect
            </h2>
            <p>
              We only collect what you choose to send us. If you use the service request form on our{" "}
              <Link href="/contact">contact page</Link>, it asks for:
            </p>
            <ul>
              <li>your name;</li>
              <li>your phone number;</li>
              <li>your email address (optional unless you ask us to reply by email);</li>
              <li>the type of service you need;</li>
              <li>your message describing the work; and</li>
              <li>how you would like us to contact you (phone, email or text).</li>
            </ul>
            <p>
              If you call, text or email us directly, we receive the details you share in that conversation, in
              the same way any business does.
            </p>

            <h2 className="display-s" style={topic}>
              Why we collect it
            </h2>
            <p>
              We use your details to respond to your request: to contact you, discuss the work and, where needed,
              arrange a visit. We do not use them for marketing lists or send you unrelated messages.
            </p>

            <h2 className="display-s" style={topic}>
              How your request reaches us
            </h2>
            <p>
              When you submit the form, your request is delivered to us by email through a transactional email
              provider, a service that sends messages on our behalf. The provider handles your request only to
              deliver it to us.
            </p>

            <h2 className="display-s" style={topic}>
              How long we keep it
            </h2>
            <p>
              We keep your information only as long as we need it to respond to you and, if we do work for you,
              as part of our ordinary business records (for example, estimates and invoices).
            </p>

            <h2 className="display-s" style={topic}>
              What we don&rsquo;t do
            </h2>
            <ul>
              <li>We do not sell your personal information.</li>
              <li>We do not share it with others for their own marketing.</li>
              <li>We do not use advertising trackers on this website at this time.</li>
            </ul>

            <h2 className="display-s" style={topic}>
              Analytics and cookies
            </h2>
            <p>
              This website does not set cookies at this time, and it does not currently run analytics. If we add
              website analytics in the future, we will update this page before doing so to explain what is
              collected and why.
            </p>

            <h2 className="display-s" style={topic}>
              Questions or requests
            </h2>
            <p>
              If you have a question about your information, or would like us to correct or delete the details
              you sent us, email <a href={`mailto:${company.email}`}>{company.email}</a> or call{" "}
              <a href={company.phone.href}>{company.phone.display}</a>.
            </p>

            <h2 className="display-s" style={topic}>
              Changes to this policy
            </h2>
            <p>
              If we change how we handle your information, we will update this page and the date at the top.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
