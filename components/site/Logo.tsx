import styles from "./Logo.module.css";

/**
 * The official logo, exactly as supplied (black lettering with gold edges),
 * on a small plate of its own ivory stone. The artwork is never recoloured
 * for the dark site: the stone comes with it.
 */
export function Logo({ className, lazy }: { className?: string; lazy?: boolean }) {
  return (
    <span className={`${styles.plate} ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed brand asset */}
      <img
        src="/brand/logo-560.webp"
        width={560}
        height={127}
        alt="Plumbers on Call CORP"
        decoding="async"
        loading={lazy ? "lazy" : undefined}
      />
    </span>
  );
}
