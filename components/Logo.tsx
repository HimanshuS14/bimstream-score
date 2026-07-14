import Link from "next/link";

// Shared brand mark, used consistently across every header in the app:
// `variant="full"` (icon + "BIMstream" wordmark) for most header contexts,
// `variant="mark"` (icon only) where space is tight (e.g. compact nav bars).
//
// Both variants render the studio's actual transparent brand PNGs directly
// (public/bimstream-full.png / bimstream-mark.png, or the white variants
// on dark surfaces) rather than a hand-reconstructed SVG approximation -
// this is the real logo file supplied by BIMstream, used as-is.
//
// `onDark` switches to the pre-generated white-recolored PNGs (same line art,
// alpha-preserved, RGB forced to white) for use on the dark navy hero
// surfaces (homepage hero, admin login left panel) - the source PNGs are
// black-only raster art, so `currentColor` doesn't apply to them the way it
// does to the (real HTML/CSS) wordmark text in some earlier iterations of
// this component; swapping the whole asset is the reliable approach.
const FULL_ASPECT = 4.96875; // bimstream-full.png: 1113x224
const MARK_ASPECT = 1; // bimstream-mark.png: square (512x512)

export default function Logo({
  variant = "full",
  href = "/",
  className = "",
  height = 28,
  onDark = false,
}: {
  variant?: "full" | "mark";
  href?: string | null;
  className?: string;
  height?: number;
  onDark?: boolean;
}) {
  if (variant === "mark") {
    const width = Math.round(height * MARK_ASPECT);
    const mark = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={onDark ? "/bimstream-mark-white.png" : "/bimstream-mark.png"}
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
      src={onDark ? "/bimstream-full-white.png" : "/bimstream-full.png"}
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
