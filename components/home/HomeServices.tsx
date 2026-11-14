"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "@/components/ui/Icon";
import styles from "./HomeServices.module.css";

type Item = { slug: string; name: string; floor: string; summary: string };

/**
 * The six services, top floor to basement. As the page scrolls, the camera
 * descends the building beside this list and the floor it is level with is the
 * row that opens. `markerPrefix` names the invisible scroll markers (one per
 * floor) that the page lays out; they also drive the camera (data-world-step).
 */
export function HomeServices({ items, markerPrefix }: { items: Item[]; markerPrefix: string }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const els = items.map((_, i) => document.getElementById(`${markerPrefix}${i}`)).filter((el) => el !== null);
    if (els.length === 0) return;
    // The floor whose marker last crossed the middle of the viewport is the one in view.
    const onScroll = () => {
      const mid = window.innerHeight / 2;
      let current = 0;
      els.forEach((el, i) => {
        if (el.getBoundingClientRect().top <= mid) current = i;
      });
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [items, markerPrefix]);

  return (
    <ol className={styles.list}>
      {items.map((s, i) => (
        <li key={s.slug} data-active={i === active ? "" : undefined}>
          <Link href={`/services/${s.slug}`} className={styles.row}>
            <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
            <span className={styles.text}>
              <span className={styles.name}>{s.name}</span>
              <span className={styles.floor}>{s.floor}</span>
              <span className={styles.summary}>{s.summary}</span>
            </span>
            <ArrowUpRight className={styles.arrow} />
          </Link>
        </li>
      ))}
    </ol>
  );
}
