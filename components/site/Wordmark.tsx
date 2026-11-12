/* The approved Plumbers on Call CORP wordmark — pixels from the owner-approved
   v6 artwork, never redrawn. Two renditions (see scripts/prepare-brand-assets.mjs):
   - "ui": transparent (colour-to-alpha against the original stone), for any light surface.
   - "native": the unaltered crop with feathered edges, only on the hero stone it came from. */
import styles from "./Wordmark.module.css";

type Props = {
  className?: string;
  priority?: boolean;
  surface?: "ui" | "native";
};

export function Wordmark({ className, priority, surface = "ui" }: Props) {
  const native = surface === "native";
  return (
    // eslint-disable-next-line @next/next/no-img-element -- fixed brand asset; masks need a plain img
    <img
      src={native ? "/brand/wordmark.webp" : "/brand/wordmark-alpha.webp"}
      width={1130}
      height={285}
      alt="Plumbers on Call CORP"
      className={`${styles.wordmark} ${native ? styles.native : ""} ${className ?? ""}`}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
    />
  );
}
