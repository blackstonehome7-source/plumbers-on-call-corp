"use client";

import { useEffect, useState } from "react";
import styles from "./FloorRail.module.css";

type Props = { floors: { id: string; label: string }[] };

/**
 * The brass line as the page's progress indicator: one mark per floor of the
 * building, the floor in view lit. Each mark links to its floor.
 */
export function FloorRail({ floors }: Props) {
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const els = floors.map((f) => document.getElementById(f.id)).filter((el) => el !== null);
    // A floor is "in view" while it covers the middle of the viewport.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = els.indexOf(e.target as HTMLElement);
          if (e.isIntersecting) setActive(i);
          else setActive((cur) => (cur === i ? -1 : cur));
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [floors]);

  return (
    <nav className={styles.rail} aria-label="Floors of the building" data-visible={active >= 0 ? "" : undefined}>
      <ol>
        {floors.map((f, i) => (
          <li key={f.id}>
            <a href={`#${f.id}`} aria-current={i === active ? "step" : undefined}>
              <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
              <span className="sr-only">{f.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
