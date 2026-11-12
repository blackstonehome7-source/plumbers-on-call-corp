import type { CSSProperties } from "react";
import styles from "./WhyPoc.module.css";

const principles = [
  {
    title: "Planned before it is built",
    body: "Larger jobs start with a look at the existing system and a clear scope, so the plan accounts for what is behind the wall before anything is opened.",
  },
  {
    title: "Workmanship you can inspect",
    body: "Straight runs, accessible valves, supported pipe and a clean work area. The parts of the job no one sees are done to the same standard as the parts everyone does.",
  },
  {
    title: "Residential and commercial",
    body: "Homes, multi-family buildings and businesses each have their own constraints. We plan the work around occupants, operating hours and the people who share the space.",
  },
  {
    title: "Answered around the clock",
    body: "Plumbing problems do not keep office hours, so neither do we. Service is available 24/7 — call (781) 299-5011 whenever something cannot wait.",
  },
];

export function WhyPoc() {
  return (
    <section className={`section section--dark ${styles.why}`} aria-labelledby="why-title">
      <div className={`container ${styles.layout}`}>
        <header className={styles.head}>
          <p className="eyebrow" data-reveal>
            Why Plumbers on Call
          </p>
          <h2 id="why-title" className="display-l" data-reveal style={{ "--reveal-i": 1 } as CSSProperties}>
            Professional plumbing, held to a standard.
          </h2>
          <p className="lede" data-reveal style={{ "--reveal-i": 2 } as CSSProperties}>
            No slogans about being the best. Just the way we approach every job, from a replaced valve
            to a new heating system.
          </p>
        </header>

        <ol className={styles.list}>
          {principles.map((p, i) => (
            <li key={p.title} className={styles.item} data-reveal style={{ "--reveal-i": i } as CSSProperties}>
              <span className={styles.num} aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className={styles.title}>{p.title}</h3>
              <p className={styles.body}>{p.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
