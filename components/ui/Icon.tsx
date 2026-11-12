import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7.4 3.2 9.6 7a1.6 1.6 0 0 1-.3 1.9L8 10.2a13 13 0 0 0 5.8 5.8l1.3-1.3a1.6 1.6 0 0 1 1.9-.3l3.8 2.2a1.6 1.6 0 0 1 .8 1.5v1.8a1.6 1.6 0 0 1-1.6 1.6C10.6 21.5 2.5 13.4 2.5 4.1A1.6 1.6 0 0 1 4.1 2.5h1.8a1.6 1.6 0 0 1 1.5.7Z" />
    </svg>
  );
}

export function ArrowUpRight(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

export function ArrowRight(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12h16m-6-6 6 6-6 6" />
    </svg>
  );
}

export function ArrowDown(props: IconProps) {
  return (
    <svg {...base} viewBox="0 0 24 40" {...props}>
      <path d="M12 2v35m-8-8 8 8 8-8" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 8h18M3 16h18" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m5 5 14 14M19 5 5 19" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="m3.5 6 8.5 7 8.5-7" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
