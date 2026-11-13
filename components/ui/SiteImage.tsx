import Image from "next/image";
import { images } from "@/content/images";
import type { ImageKey } from "@/content/types";

type Props = {
  image: ImageKey;
  sizes: string;
  /** Above-the-fold image: preload it (Next 16 replacement for `priority`). */
  preload?: boolean;
  className?: string;
  /** Cover the parent box (parent must be positioned and sized). */
  fill?: boolean;
  /** Subtle scroll-linked drift (CSS scroll timeline; desktop, motion-safe only). */
  drift?: boolean;
  /** Hide the visible "Illustrative" tag when a nearby caption already says it. */
  hideTag?: boolean;
  /**
   * Inside a link or card that already has a text title, the image adds nothing
   * for screen readers; render it with empty alt so the link name stays short.
   */
  decorative?: boolean;
};

export function SiteImage({ image, sizes, preload, className, fill, drift, hideTag, decorative }: Props) {
  const img = images[image];
  return (
    <>
      <Image
        src={img.src}
        alt={decorative ? "" : img.alt}
        sizes={sizes}
        preload={preload}
        className={className}
        data-drift={drift ? "" : undefined}
        data-tone={img.credit?.source === "Unsplash" ? "stock" : undefined}
        {...(fill
          ? { fill: true, style: { objectFit: "cover" as const } }
          : { width: img.width, height: img.height })}
      />
      {img.illustrative && !hideTag ? (
        <span className="illustrative-tag" aria-hidden={decorative ? true : undefined}>
          Illustrative
        </span>
      ) : null}
    </>
  );
}
