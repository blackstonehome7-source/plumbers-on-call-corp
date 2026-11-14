import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { company } from "@/content/company";
import { getService, services } from "@/content/services";
import { PageHero } from "@/components/ui/PageHero";
import { CtaBand } from "@/components/ui/CtaBand";
import { SiteImage } from "@/components/ui/SiteImage";
import { JsonLd } from "@/components/ui/JsonLd";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { ArrowUpRight, PhoneIcon, PlusIcon } from "@/components/ui/Icon";
import { pageMetadata, serviceJsonLd } from "@/lib/seo";
import styles from "./page.module.css";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const s = getService(slug);
  if (!s) return {};
  return pageMetadata({ title: s.seo.title, description: s.seo.description, path: `/services/${s.slug}` });
}

const process = [
  { title: "You get in touch", body: "Call, or send a request with a few details about the job." },
  { title: "We look at it properly", body: "For larger work we see the space and the existing system before quoting." },
  { title: "A clear scope", body: "You know what will be done and what it involves before work begins." },
  { title: "The work, then a walkthrough", body: "Installed and tested, then explained so you know what was done and how to use it." },
];

export default async function ServicePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const isEmergency = service.slug === "emergency-plumbing";
  const [lead, ...rest] = service.intro;
  const related = service.related.map((r) => getService(r)).filter((s) => s !== undefined);

  const primary = isEmergency ? (
    <TrackedLink href={company.phone.href} event="phone_click" placement={`service-${service.slug}`} className="btn btn--dark">
      <PhoneIcon /> Call {company.phone.display}
    </TrackedLink>
  ) : (
    <TrackedLink
      href={`/contact?service=${service.slug}`}
      event="request_service_click"
      placement={`service-${service.slug}`}
      className="btn btn--dark"
    >
      {service.cta} <ArrowUpRight />
    </TrackedLink>
  );

  const secondary = isEmergency ? (
    <Link href="/contact?service=emergency-plumbing" className="btn">
      Send a non-urgent request
    </Link>
  ) : (
    <TrackedLink href={company.phone.href} event="phone_click" placement={`service-${service.slug}`} className="btn">
      <PhoneIcon /> {company.phone.display}
    </TrackedLink>
  );

  return (
    <>
      <JsonLd
        data={serviceJsonLd({ name: service.name, description: service.summary, path: `/services/${service.slug}` })}
      />
      <PageHero
        eyebrow={service.eyebrow}
        title={service.title}
        lede={<p>{lead}</p>}
        crumbs={[
          { name: "Services", path: "/services" },
          { name: service.name, path: `/services/${service.slug}` },
        ]}
        image={service.image}
        worldBacked
        actions={
          <>
            {primary}
            {secondary}
          </>
        }
      />

      {isEmergency ? (
        <section className={styles.urgent} aria-label="Call now">
          <div className={`container ${styles.urgentInner}`}>
            <p>
              <strong>If you smell gas,</strong> leave the building and call your gas utility or 911 from
              outside. For water, shut off the main valve if you can — then call us.
            </p>
            <TrackedLink href={company.phone.href} event="phone_click" placement="emergency-banner" className="btn btn--gold">
              <PhoneIcon /> {company.phone.display} · {company.availability}
            </TrackedLink>
          </div>
        </section>
      ) : null}

      {/* The reading column: on glass, beside the room's fixture (DESIGN.md, Services). */}
      <div className={styles.reading}>
      {rest.length > 0 && (
        <section className="section section--paper">
          <div className={`container ${styles.overview}`}>
            <div className={styles.overviewText}>
              {rest.map((p, i) => (
                <p key={i} data-reveal style={{ "--reveal-i": i } as CSSProperties}>
                  {p}
                </p>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section" aria-labelledby="types-title">
        <div className="container">
          <div className={styles.sectionHead}>
            <h2 id="types-title" className="display-m" data-reveal>
              {isEmergency ? "Problems that should not wait." : `What ${service.name.toLowerCase()} work usually involves.`}
            </h2>
          </div>
          <ol className={styles.types}>
            {service.projectTypes.map((t, i) => (
              <li key={t.title} data-reveal style={{ "--reveal-i": i % 3 } as CSSProperties}>
                <h3 className={styles.typeTitle}>{t.title}</h3>
                <p>{t.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--dark" aria-labelledby="consider-title">
        <div className={`container ${styles.consider}`}>
          <div className={styles.considerHead}>
            <h2 id="consider-title" className="display-m" data-reveal>
              {isEmergency ? "What to do while you wait." : "Worth weighing first."}
            </h2>
          </div>
          <dl className={styles.considerList}>
            {service.considerations.map((c, i) => (
              <div key={c.title} data-reveal style={{ "--reveal-i": i % 2 } as CSSProperties}>
                <dt>{c.title}</dt>
                <dd>{c.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {!isEmergency && (
        <section className="section section--paper" aria-labelledby="process-title">
          <div className={`container ${styles.processWrap}`}>
            <div className={styles.processMedia} data-reveal="mask">
              <SiteImage image="fixtureDetail" fill sizes="(max-width: 860px) 100vw, 40vw" />
            </div>
            <div>
              <h2 id="process-title" className="display-m" data-reveal>
                From first call to finished work.
              </h2>
              <ol className={styles.process}>
                {process.map((p, i) => (
                  <li key={p.title} data-reveal style={{ "--reveal-i": i } as CSSProperties}>
                    <h3>{p.title}</h3>
                    <p>{p.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}

      <section className="section" aria-labelledby="faq-title">
        <div className={`container ${styles.faqWrap}`}>
          <div>
            <h2 id="faq-title" className="display-m" data-reveal>
              Asked before most {isEmergency ? "calls" : "projects"}.
            </h2>
          </div>
          <div className={styles.faqs}>
            {service.faqs.map((f) => (
              <details key={f.q} className={styles.faq}>
                <summary>
                  <span>{f.q}</span>
                  <PlusIcon />
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section section--tight section--paper" aria-labelledby="related-title">
          <div className="container">
            <h2 id="related-title" className={`display-s ${styles.relatedTitle}`}>
              Related services
            </h2>
            <ul className={styles.related}>
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/services/${r.slug}`} className={styles.relatedCard}>
                    <div className={styles.relatedMedia}>
                      <SiteImage image={r.image} fill decorative sizes="(max-width: 860px) 100vw, 33vw" />
                    </div>
                    <h3>{r.name}</h3>
                    <p>{r.summary}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      </div>

      <CtaBand
        placement={service.slug}
        eyebrow={service.name}
        title={isEmergency ? "One call. Day or night." : "Let’s talk about your project."}
        text={
          isEmergency
            ? `Plumbers on Call CORP is available ${company.availability}. Call ${company.phone.display} and tell us what is happening.`
            : "Tell us what you have in mind. We’ll explain the options plainly and give you a clear next step."
        }
      />
    </>
  );
}
