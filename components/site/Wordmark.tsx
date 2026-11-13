/* The approved Plumbers on Call CORP wordmark — pixels from the owner-approved
   v6 artwork, never redrawn. Two renditions (see scripts/prepare-brand-assets.mjs):
   - "ui": transparent (colour-to-alpha against the original stone), 600px, for any light surface.
   - "native": the unaltered 1130px crop with feathered edges, only on the hero stone it came from. */
import styles from "./Wordmark.module.css";

type Props = {
  className?: string;
  /** Hero LCP image: fetch with high priority. */
  priority?: boolean;
  /** Off-screen copies (footer, closed menu) should not compete with the page. */
  lazy?: boolean;
  surface?: "ui" | "native";
};

export function Wordmark({ className, priority, lazy, surface = "ui" }: Props) {
  const native = surface === "native";
  return (
    // eslint-disable-next-line @next/next/no-img-element -- fixed brand asset; masks need a plain img
    <img
      src={native ? "/brand/wordmark.webp" : "/brand/wordmark-alpha.webp"}
      width={native ? 1130 : 600}
      height={native ? 285 : 151}
      alt="Plumbers on Call CORP"
      className={`${styles.wordmark} ${native ? styles.native : ""} ${className ?? ""}`}
      decoding="async"
      loading={lazy ? "lazy" : undefined}
      fetchPriority={priority ? "high" : undefined}
    />
  );
}
