import Link from "next/link";

// Shared brand mark, used consistently across every header in the app:
// `variant="full"` (icon + "BIMstream" wordmark) for most header contexts,
// `variant="mark"` (icon only) where space is tight (e.g. compact nav bars).
//
// Both variants render the studio's actual transparent brand PNGs directly
// (public/bimstream-full.png and public/bimstream-mark.png) rather than a
// hand-reconstructed SVG approximation - this is the real logo file supplied
// by BIMstream, used as-is.
const FULL_ASPECT = 4.96875; // bimstream-full.png: 1113x224
const MARK_ASPECT = 1; // bimstream-mark.png: square (512x512)

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
  if (variant === "mark") {
    const width = Math.round(height * MARK_ASPECT);
    const mark = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/bimstream-mark.png"
        alt="BIMstream"
        height={height}
        width={width}
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

  const width = Math.round(height * FULL_ASPECT);
  const content = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/bimstream-full.png"
      alt="BIMstream"
      height={height}
      width={width}
      style={{ height, width: "auto" }}
      className={className}
    />
  );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex items-center" aria-label="BIMstream home">
      {content}
    </Link>
  );
}
