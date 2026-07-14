import Link from "next/link";

// Shared brand mark, used consistently across every header in the app:
// `variant="full"` (icon + "BIMstream" wordmark) for most header contexts,
// `variant="mark"` (icon only) where space is tight (e.g. compact nav bars).
//
// The icon is `public/logo-mark.svg` (a hexagon construction matching the
// real BIMstream mark). The "BIMstream" wordmark is *not* baked into that
// SVG - it's rendered as real HTML/CSS text below, styled with the
// `--font-brand` custom property (Poppins, falling back to a geometric-sans
// system stack - see globals.css / README "Design system") and
// `color: currentColor`, so it renders crisply at any size, adapts to
// light *and* dark backgrounds, and never depends on a font being embedded
// in an SVG.
const MARK_ASPECT = 600 / 520; // matches public/logo-mark.svg's viewBox

export default function Logo({
  variant = "full",
  href = "/",
  className = "",
  height = 28,
}: {
  variant?: "full" | "mark";
  href?: string | null;
  className?: string;
  height?: number;
}) {
  const markWidth = Math.round(height * MARK_ASPECT);

  if (variant === "mark") {
    const mark = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/logo-mark.svg"
        alt="BIMstream"
        height={height}
        width={markWidth}
        style={{ height, width: "auto" }}
        className={className}
      />
    );

    if (!href) return mark;

    return (
      <Link href={href} className="inline-flex items-center" aria-label="BIMstream home">
        {mark}
      </Link>
    );
  }

  const content = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-mark.svg"
        alt=""
        aria-hidden="true"
        height={height}
        width={markWidth}
        style={{ height, width: "auto" }}
        className="flex-none"
      />
      <span
        className="leading-none tracking-tight whitespace-nowrap"
        style={{
          fontFamily: "var(--font-brand)",
          fontSize: Math.round(height * 0.62),
          color: "currentColor",
        }}
      >
        <span className="font-bold">BIM</span>
        <span className="font-medium">stream</span>
      </span>
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex items-center" aria-label="BIMstream home">
      {content}
    </Link>
  );
}
