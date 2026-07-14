// Deterministic, per-session seeded shuffling helpers.
//
// Used purely for *display order* (question order + option order within a
// question) so that a given candidate sees a stable-but-unique ordering for
// the lifetime of their session (reloading mid-test shows the same order
// again), while two different sessions get different orders. This is an
// anti-cheating measure only - it never changes question content, option
// content, trait_deltas, or scoring, and scoring never runs off display
// order (see lib/scoring.ts / lib/actions/session.ts, which always index
// into the *original* schema order fetched fresh server-side).
//
// No crypto-grade randomness is needed here - this just needs to be
// deterministic per seed and reasonably well distributed.

/**
 * Hashes an arbitrary string (e.g. a session UUID) down to a 32-bit unsigned
 * integer, for use as a PRNG seed. This is a standard FNV-1a style hash -
 * not cryptographic, just a stable, fast string -> uint32 mapping.
 */
export function hashStringToSeed(input: string): number {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // FNV prime multiplication, done with Math.imul to stay in 32-bit range.
    hash = Math.imul(hash, 0x01000193);
  }
  // Ensure unsigned 32-bit output.
  return hash >>> 0;
}

/**
 * mulberry32: a small, fast, deterministic PRNG. Given the same 32-bit seed
 * it always produces the same sequence of numbers in [0, 1). Good enough for
 * shuffling display order; not suitable for anything security-sensitive.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Returns a new array containing a Fisher-Yates shuffle of `items`, driven
 * by `rng` (expected to return numbers in [0, 1), e.g. from mulberry32).
 * Does not mutate the input array. Calling this repeatedly against the same
 * rng instance consumes further values from its sequence, which is exactly
 * what lets one seeded rng drive several independent shuffles (question
 * order, then each question's option order) deterministically as long as
 * they're always requested in the same order.
 */
export function seededShuffle<T>(items: T[], rng: () => number): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Builds a fresh mulberry32 PRNG seeded deterministically from a session id
 * (typically the session's UUID). Same sessionId -> same PRNG sequence every
 * time this is called, which is what makes shuffled order stable across
 * page reloads for a given candidate/session while differing across
 * sessions.
 */
export function rngForSession(sessionId: string): () => number {
  return mulberry32(hashStringToSeed(sessionId));
}
