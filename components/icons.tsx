type IconProps = {
  className?: string;
};

const base = {
  fill: "none",
  viewBox: "0 0 24 24",
  strokeWidth: 1.8,
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function IconHome({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10.5V20h13v-9.5" />
      <path d="M9.5 20v-5h5v5" />
    </svg>
  );
}

export function IconList({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </svg>
  );
}

export function IconChart({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-5" />
      <path d="M12 16V8" />
      <path d="M16 16v-7" />
    </svg>
  );
}

export function IconDollar({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3v18" />
      <path d="M16.5 7.5C15.8 6.4 14.3 6 12.4 6 10 6 8.5 7 8.5 8.6c0 3.2 8 1.7 8 5.6 0 1.7-1.5 2.8-4.1 2.8-2.1 0-3.8-.7-4.8-2" />
    </svg>
  );
}

export function IconSettings({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 3.1-.2-.1a1.7 1.7 0 0 0-2 .2 1.8 1.8 0 0 0-.8 1.5V22H9v-.3a1.8 1.8 0 0 0-.8-1.5 1.7 1.7 0 0 0-2-.2l-.2.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.8 1.8 0 0 0-1.3-1.1H3v-3.8h.3A1.8 1.8 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.9L4.2 7l1.8-3.1.2.1a1.7 1.7 0 0 0 2-.2A1.8 1.8 0 0 0 9 2.3V2h6v.3a1.8 1.8 0 0 0 .8 1.5 1.7 1.7 0 0 0 2 .2l.2-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.8 1.8 0 0 0 1.3 1.1h.3v3.8h-.3a1.8 1.8 0 0 0-1.3 1.1Z" />
    </svg>
  );
}

export function IconPlus({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconClose({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}
