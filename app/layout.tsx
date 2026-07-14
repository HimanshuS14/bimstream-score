import type { Metadata } from "next";
import "./globals.css";

// Typography: this project ships with a carefully tuned system font stack
// (see --font-sans in globals.css) rather than next/font/google by default,
// because next/font/google performs a network fetch to Google Fonts *at
// build time* and hard-fails the entire `next build` if that fetch can't
// complete (as opposed to degrading gracefully) - which breaks builds in
// network-isolated CI/sandbox environments. On Vercel (which has outbound
// internet access during builds) you can safely switch to real Inter by
// uncommenting the two lines below and adding `inter.variable` to the <html>
// className - see README "Design system" section for the exact snippet.
//
// import { Inter } from "next/font/google";
// const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

// Same story for the "BIMstream" wordmark's brand font: the real logo uses a
// clean geometric sans (bold "BIM" + regular/medium "stream"), and Poppins is
// the closest widely-available Google Font match (rounded terminals, single-
// story lowercase "a", geometric proportions). `components/Logo.tsx` renders
// the wordmark as real HTML/CSS text (not baked into the SVG, so it can take
// `color: currentColor` and adapt to light/dark backgrounds) styled via the
// `--font-brand` custom property in globals.css, which falls back to a
// geometric-sans system stack ("Century Gothic", "Futura", ...) when Poppins
// isn't available - exactly the same fetch-at-build-time tradeoff as Inter
// above. On Vercel, uncomment the two lines below and add `poppins.variable`
// to the <html> className to activate real self-hosted Poppins.
//
// import { Poppins } from "next/font/google";
// const poppins = Poppins({
//   subsets: ["latin"],
//   weight: ["500", "700"],
//   variable: "--font-brand",
//   display: "swap",
// });

export const metadata: Metadata = {
  title: "BIMstream SCORE — Situational Competency & Organizational Readiness Evaluation",
  description:
    "BIMstream SCORE: situational-judgment recruitment assessments for BIM coordination roles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
