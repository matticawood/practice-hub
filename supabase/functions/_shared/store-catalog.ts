// Canonical store catalog for the edge functions (pricing, type, title).
// Prices are GBP minor units (pence); 0 = free. The brand-site generator holds
// the DISPLAY copy/covers; this holds the money-and-type truth that checkout,
// delivery and access all agree on. Keep slugs in sync with the generator.
export type StoreType = "pdf" | "course";
export interface StoreItem { title: string; type: StoreType; price: number }

export const STORE: Record<string, StoreItem> = {
  "the-art-of-understanding-music":     { title: "The Art of Understanding Music",        type: "course", price: 4999 },
  "beginner-sight-reading-book":        { title: "Beginner Sight Reading Exercises Book",  type: "pdf",    price: 1499 },
  "beginners-guide-reading-sheet-music":{ title: "Beginners Guide to Reading Sheet Music", type: "pdf",    price: 1499 },
  "playing-by-ear-theory":              { title: "Playing by Ear: Theory Exercises",       type: "pdf",    price: 799  },
  "30-ways-to-play-a-chord":            { title: "30 Ways to Play a Chord",                type: "pdf",    price: 799  },
  "4-fun-techniques":                   { title: "4 Fun Techniques to Transform Your Playing", type: "pdf", price: 0  },
  "technical-exercises":                { title: "Technical Exercises to Transform Your Playing", type: "pdf", price: 0 },
  "4-levels-chord-patterns":            { title: "4 Levels of Chord Patterns",             type: "pdf",    price: 0    },
  "how-to-reharmonise":                 { title: "How to Reharmonise Any Song",            type: "pdf",    price: 0    },
  "practice-planner":                   { title: "Practice Planner Template",              type: "pdf",    price: 0    },
};

// ── Multi-currency (mirrors the booking engine's approach) ───────────────────
// GBP is the base; other currencies derive from market multipliers tuned to the
// same fair levels as the lesson prices, then rounded to a tidy local ending.
const MULT: Record<string, number> = {
  GBP: 1, USD: 1.33, EUR: 1.16, CAD: 1.84, AUD: 1.94, NZD: 2.35, SEK: 12.8, NOK: 12.7, DKK: 8.7, SGD: 1.74,
};
export const SYMBOLS: Record<string, string> = {
  GBP: "£", USD: "$", EUR: "€", CAD: "$", AUD: "$", NZD: "$", SEK: "kr", NOK: "kr", DKK: "kr", SGD: "$",
};
// Whole-krone currencies round to nearest 10; the rest use a .99 ending.
const KR = new Set(["SEK", "NOK", "DKK"]);

export function currencies(): string[] { return Object.keys(MULT); }

// Convert a GBP-pence base into the target currency's minor units, tidily rounded.
export function priceIn(gbpMinor: number, cur: string): number {
  if (gbpMinor === 0) return 0;
  const mult = MULT[cur] ?? 1;
  const major = (gbpMinor / 100) * mult;
  if (KR.has(cur)) {
    const v = Math.max(10, Math.round(major / 10) * 10);
    return v * 100;
  }
  const whole = Math.max(1, Math.round(major));
  return Math.round((whole - 0.01) * 100); // .99 ending, in minor units
}
