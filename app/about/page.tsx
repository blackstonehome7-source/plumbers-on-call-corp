import type { CSSProperties } from "react";
import { company } from "@/content/company";
import { PageHero } from "@/components/ui/PageHero";
import { CtaBand } from "@/components/ui/CtaBand";
import { SiteImage } from "@/components/ui/SiteImage";
import { pageMetadata } from "@/lib/seo";
import styles from "./page.module.css";

export const metadata = pageMetadata({
  title: "About | Plumbers on Call CORP",
  description:
    "Plumbers on Call CORP is an owner-led residential and commercial plumbing company serving Greater Boston and Massachusetts, available 24/7.",
  path: "/about",
});

const values = [
  {
    title: "Say what the job needs",
    body: "Not the most expensive option, and not the quickest patch. A clear explanation of what is wrong, what the choices are, and what we would do in your position.",
  },
  {
    title: "Build it to be lived with",
    body: "Valves where they can be reached, piping that is supported and labeled, equipment that can be serviced. Workmanship is judged years later, by whoever opens the wall next.",
  },
  {
    title: "Respect the building and the people in it",
    body: "Homes are lived in and businesses have to keep operating. We protect finished surfaces, keep the work area orderly and plan around the people affected.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About the company"
        title="Professional plumbing. Exceptional workmanship. Built on trust."
        lede={
          <p>
            {company.name} is a residential and commercial plumbing company serving {company.region} and{" "}
            {company.state}, led by {company.owner.name}, {company.owner.title}.
          </p>
        }
        crumbs={[{ name: "About", path: "/about" }]}
        image="brandWall"
      />

      <section className="section section--paper">
        <div className={`container ${styles.story}`}>
          <p className="eyebrow" data-reveal>
            Our approach
          </p>
          <div className={styles.storyText}>
            <p data-reveal>
              Plumbing is one of the few trades where most of the work disappears behind walls and floors once
              it&apos;s done. That is exactly why it has to be done right. The difference between a
              system that works for decades and one that causes problems is usually decided by details nobody
              sees on the day.
            </p>
            <p data-reveal style={{ "--reveal-i": 1 } as CSSProperties}>
              We built {company.shortName} around that idea: take on substantial work — heating systems,
              water heaters, remodels and commercial installations — and do it carefully, with the same
              attention on the parts that will be covered up as on the parts that will be on display. And
              because plumbing problems do not keep office hours, we are available {company.availability}.
            </p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="values-title">
        <div className="container">
          <h2 id="values-title" className={`display-m ${styles.valuesTitle}`} data-reveal>
            How we work.
          </h2>
          <ol className={styles.values}>
            {values.map((v, i) => (
              <li key={v.title} data-reveal style={{ "--reveal-i": i } as CSSProperties}>
                <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
                <h3>{v.title}</h3>
                <p>{v.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--dark" aria-labelledby="leader-title">
        <div className={`container ${styles.leader}`}>
          <div className={styles.leaderMedia} data-reveal="mask">
            <SiteImage image="fixtureDetail" fill sizes="(max-width: 860px) 100vw, 45vw" />
          </div>
          <div className={styles.leaderText}>
            <p className="eyebrow" data-reveal>
              Leadership
            </p>
            <h2 id="leader-title" className="display-m" data-reveal>
              {company.owner.name}
            </h2>
            <p className={styles.role} data-reveal>
              {company.owner.title}
            </p>
            <p className={styles.bio} data-reveal>
              {company.shortName} is owner-led. The person whose name is on the company is the person
              accountable for the work, and you can reach the company directly at{" "}
              <a href={company.phone.href}>{company.phone.display}</a> or{" "}
              <a href={`mailto:${company.email}`}>{company.email}</a>.
            </p>
          </div>
        </div>
      </section>

      <CtaBand placement="about" />
    </>
  );
}
