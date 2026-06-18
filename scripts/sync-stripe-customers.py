#!/usr/bin/env python3
# One-time script: sync Stripe customer IDs into allowed_emails
# Run with:
#   python3 scripts/sync-stripe-customers.py

import urllib.request
import urllib.parse
import json
import os

STRIPE_SECRET_KEY        = os.environ.get("STRIPE_SECRET_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_URL             = "https://gyskfutmncprqxazgatv.supabase.co"

if not STRIPE_SECRET_KEY:        raise SystemExit("Missing STRIPE_SECRET_KEY")
if not SUPABASE_SERVICE_ROLE_KEY: raise SystemExit("Missing SUPABASE_SERVICE_ROLE_KEY")

def stripe_get(path):
    req = urllib.request.Request(
        f"https://api.stripe.com{path}",
        headers={"Authorization": f"Bearer {STRIPE_SECRET_KEY}"}
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def supabase_get(path):
    req = urllib.request.Request(
        f"{SUPABASE_URL}{path}",
        headers={
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        }
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def supabase_patch(path, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(
        f"{SUPABASE_URL}{path}",
        data=body,
        method="PATCH",
        headers={
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }
    )
    with urllib.request.urlopen(req) as r:
        return r.status

# ── Fetch all Stripe customers (paginated) ───────────────────────────────────
print("Fetching Stripe customers...")
customers = []
starting_after = None
while True:
    params = "limit=100"
    if starting_after:
        params += f"&starting_after={starting_after}"
    data = stripe_get(f"/v1/customers?{params}")
    customers.extend(data["data"])
    if not data["has_more"]:
        break
    starting_after = data["data"][-1]["id"]

print(f"Found {len(customers)} Stripe customers")

# Build email → most-recent customer map
stripe_by_email = {}
for c in customers:
    if not c.get("email"):
        continue
    key = c["email"].lower()
    if key not in stripe_by_email or c["created"] > stripe_by_email[key]["created"]:
        stripe_by_email[key] = c

# ── Fetch allowed_emails ─────────────────────────────────────────────────────
print("Fetching allowed_emails...")
rows = supabase_get("/rest/v1/allowed_emails?select=email,stripe_customer_id")
print(f"Found {len(rows)} allowed emails\n")

updated = skipped = not_found = 0

for row in rows:
    email = row["email"].lower()
    existing = row.get("stripe_customer_id")
    customer = stripe_by_email.get(email)

    if not customer:
        print(f"  No Stripe customer: {email}")
        not_found += 1
        continue

    if existing == customer["id"]:
        skipped += 1
        continue

    print(f"  Updating {email} → {customer['id']}")
    encoded = urllib.parse.quote(email)
    supabase_patch(f"/rest/v1/allowed_emails?email=eq.{encoded}", {"stripe_customer_id": customer["id"]})
    updated += 1

print(f"\nDone. Updated: {updated}, Already set: {skipped}, No Stripe match: {not_found}")
