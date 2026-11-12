import Image from "next/image";
import { images } from "@/content/images";
import type { ImageKey } from "@/content/types";

type Props = {
  image: ImageKey;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Cover the parent box (parent must be positioned and sized). */
  fill?: boolean;
  /** Subtle scroll-linked drift (CSS scroll timeline; desktop, motion-safe only). */
  drift?: boolean;
  /** Hide the visible "Illustrative" tag when a nearby caption already says it. */
  hideTag?: boolean;
};

export function SiteImage({ image, sizes, priority, className, fill, drift, hideTag }: Props) {
  const img = images[image];
  return (
    <>
      <Image
        src={img.src}
        alt={img.alt}
        sizes={sizes}
        priority={priority}
        className={className}
        data-drift={drift ? "" : undefined}
        data-tone={img.credit?.source === "Unsplash" ? "stock" : undefined}
        {...(fill
          ? { fill: true, style: { objectFit: "cover" as const } }
          : { width: img.width, height: img.height })}
      />
      {img.illustrative && !hideTag ? <span className="illustrative-tag">Illustrative</span> : null}
    </>
  );
}
