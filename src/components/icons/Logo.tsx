import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50"
      width="120"
      height="30"
      aria-label="RxFlow Assist Logo"
      {...props}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect width="50" height="50" rx="8" fill="url(#logoGradient)" />
      <path d="M15 15 L25 25 L15 35 M35 15 L25 25 L35 35" stroke="hsl(var(--primary-foreground))" strokeWidth="3" fill="none" />
      <text
        x="60"
        y="33"
        fontFamily="Inter, sans-serif"
        fontSize="28"
        fontWeight="bold"
        fill="hsl(var(--foreground))"
        className="font-headline"
      >
        RxFlow Assist
      </text>
    </svg>
  );
}
