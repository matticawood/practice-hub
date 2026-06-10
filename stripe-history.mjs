// Reusable Stripe-history helper.
//
// Returns the set of lowercased emails that have EVER had a subscription — any
// status, including 'canceled'. That's everyone who is, or has ever been, a
// member of The Practice Room. Used to keep marketing-list emails (e.g. the
// waiting list) away from current and past members.
//
// Pages /v1/subscriptions with status=all, expanding the customer for its email.

export async function everSubscriberEmails(stripeKey) {
  return new Set((await everSubscriberJoinDates(stripeKey)).keys());
}

// Map of email → EARLIEST subscription-created date (the true "became a member"
// date), as an ISO timestamp. Any status, including cancelled. Pages all subs.
export async function everSubscriberJoinDates(stripeKey) {
  if (!stripeKey) throw new Error("missing Stripe key");
  const earliest = new Map();  // email → unix seconds (min)
  let startingAfter = null, guard = 0;
  do {
    const qs = new URLSearchParams({ limit: "100", status: "all" });
    qs.append("expand[]", "data.customer");
    if (startingAfter) qs.set("starting_after", startingAfter);
    const res = await fetch(`https://api.stripe.com/v1/subscriptions?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${stripeKey}` },
    });
    const page = await res.json();
    if (!res.ok) throw new Error(page.error?.message || "Stripe error");
    for (const sub of (page.data || [])) {
      const c = sub.customer;
      const email = c && typeof c === "object" && c.email ? c.email.toLowerCase() : null;
      if (!email || !sub.created) continue;
      const prev = earliest.get(email);
      if (prev == null || sub.created < prev) earliest.set(email, sub.created);
    }
    startingAfter = (page.has_more && page.data.length) ? page.data[page.data.length - 1].id : null;
  } while (startingAfter && ++guard < 100);
  const out = new Map();
  for (const [email, secs] of earliest) out.set(email, new Date(secs * 1000).toISOString());
  return out;
}
