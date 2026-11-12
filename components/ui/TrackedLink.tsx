"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { track } from "@/lib/analytics";

type TrackEvent = Parameters<typeof track>[0];

type Props = ComponentProps<"a"> & {
  event: TrackEvent;
  /** Where on the page the click happened, e.g. "header", "hero". */
  placement: string;
};

/** Anchor (tel:, mailto:, external) or internal link that reports a conversion event. */
export function TrackedLink({ event, placement, href = "#", onClick, ...rest }: Props) {
  const handle: Props["onClick"] = (e) => {
    track(event, { placement });
    onClick?.(e);
  };
  if (href.startsWith("/")) {
    return <Link href={href} onClick={handle} {...rest} />;
  }
  return <a href={href} onClick={handle} {...rest} />;
}
