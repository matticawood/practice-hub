#!/usr/bin/env python3
"""
Circle → Supabase member migration script
==========================================
Reads the Circle CSV export, downloads avatar images from Circle CDN,
uploads them to the Supabase 'avatars' storage bucket, then writes a SQL
file to upsert all members into the allowed_emails table.

Usage:
  pip install requests
  python3 migrate_circle_members.py

You will be prompted for your Supabase project URL and service-role key.
Nothing is sent anywhere except your own Supabase project.
"""

import csv
import os
import re
import sys
import time
import getpass
import hashlib
import urllib.parse
from pathlib import Path

try:
    import requests
except ImportError:
    print("❌  Please install requests first:  pip install requests")
    sys.exit(1)

# ── Config ────────────────────────────────────────────────────────────────────

CSV_PATH   = Path(__file__).parent.parent / "Downloads" / \
             "community_the_practice_room_511603_1779032184_audience_list.csv"
OUTPUT_SQL = Path(__file__).parent / "circle_members_import.sql"
AVATARS_DIR = Path(__file__).parent / "_circle_avatars_cache"

BUCKET = "avatars"

# ── Helpers ───────────────────────────────────────────────────────────────────

def prompt(label: str, secret: bool = False) -> str:
    """Prompt the user for input, hiding keystrokes for secrets."""
    if secret:
        return getpass.getpass(f"{label}: ").strip()
    value = input(f"{label}: ").strip()
    return value


def slug_from_email(email: str) -> str:
    """Deterministic storage path: avatars/<md5-of-email>.jpg"""
    h = hashlib.md5(email.lower().encode()).hexdigest()
    return f"{h}.jpg"


def extract_handle(url: str, platform: str) -> str:
    """Pull the username/handle from a social URL, or return empty string."""
    if not url:
        return ""
    url = url.strip().rstrip("/")
    try:
        path = urllib.parse.urlparse(url).path.lstrip("/")
        # Remove trailing segments we don't want
        parts = [p for p in path.split("/") if p]
        if parts:
            handle = parts[-1]
            # Strip leading @ if present
            return handle.lstrip("@")
    except Exception:
        pass
    return ""


def sql_str(value) -> str:
    """Escape a Python string for SQL, returning NULL for empty/None."""
    if value is None or str(value).strip() == "":
        return "NULL"
    escaped = str(value).replace("'", "''")
    return f"'{escaped}'"


def download_avatar(url: str, dest: Path) -> bool:
    """Download a URL to dest. Returns True on success."""
    if not url or url.strip() == "":
        return False
    try:
        r = requests.get(url, timeout=30, allow_redirects=True,
                         headers={"User-Agent": "Mozilla/5.0"})
        if r.status_code == 200 and len(r.content) > 500:
            dest.write_bytes(r.content)
            return True
        print(f"     ↳ HTTP {r.status_code}, skipping avatar")
    except Exception as e:
        print(f"     ↳ Download error: {e}")
    return False


def upload_to_supabase(local_path: Path, storage_path: str,
                        project_url: str, service_key: str):
    """
    Upload a file to Supabase storage. Returns the public URL or None.
    Uses upsert so re-running is safe.
    """
    upload_url = f"{project_url}/storage/v1/object/{BUCKET}/{storage_path}"
    headers = {
        "Authorization": f"Bearer {service_key}",
        "Content-Type":  "image/jpeg",
        "x-upsert":      "true",
    }
    try:
        with open(local_path, "rb") as f:
            r = requests.post(upload_url, headers=headers, data=f, timeout=60)
        if r.status_code in (200, 201):
            public_url = (f"{project_url}/storage/v1/object/public/"
                          f"{BUCKET}/{storage_path}")
            return public_url
        print(f"     ↳ Upload failed: {r.status_code} {r.text[:120]}")
    except Exception as e:
        print(f"     ↳ Upload error: {e}")
    return None


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("\n🎹  Circle → Supabase Member Migration")
    print("=" * 42)

    # Credentials — read from migrate_config.txt
    config_path = Path(__file__).parent / "migrate_config.txt"
    config = {}
    if config_path.exists():
        for line in config_path.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                config[k.strip()] = v.strip()

    project_url = config.get("SUPABASE_URL", "").rstrip("/")
    service_key = config.get("SUPABASE_KEY", "")

    if not project_url or "your-project-id" in project_url:
        project_url = prompt("Supabase project URL (e.g. https://xxxx.supabase.co)")
        project_url = project_url.rstrip("/")
    if not service_key or "your-service-role" in service_key:
        service_key = os.environ.get("SUPABASE_KEY") or prompt("Service-role secret key", secret=True)

    print(f"  URL: {project_url}")

    if not project_url.startswith("https://"):
        print("❌  Project URL must start with https://")
        sys.exit(1)
    if len(service_key) < 20:
        print("❌  That key looks too short — please paste the full service-role key")
        sys.exit(1)

    # Test connection
    print("\n🔍  Testing Supabase connection…")
    test_r = requests.get(
        f"{project_url}/storage/v1/bucket/{BUCKET}",
        headers={"Authorization": f"Bearer {service_key}"},
        timeout=10,
    )
    if test_r.status_code == 200:
        print("✅  Connected — avatars bucket found")
    elif test_r.status_code == 400:
        print(f"⚠️   Bucket check returned 400 — proceeding anyway (bucket may still exist)")
    else:
        print(f"⚠️   Bucket check: {test_r.status_code} — make sure the 'avatars' bucket exists in Supabase Storage")
        cont = input("Continue anyway? (y/n): ").strip().lower()
        if cont != "y":
            sys.exit(1)

    # Read CSV
    if not CSV_PATH.exists():
        print(f"\n❌  CSV not found at:\n    {CSV_PATH}")
        sys.exit(1)

    with open(CSV_PATH, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    print(f"\n📋  Found {len(rows)} members in CSV")

    # Create local cache dir
    AVATARS_DIR.mkdir(exist_ok=True)

    sql_inserts = []
    ok = skipped = failed_avatar = 0

    for i, row in enumerate(rows, 1):
        email      = (row.get("Email") or "").strip().lower()
        first      = (row.get("First Name") or "").strip()
        last       = (row.get("Last Name") or "").strip()
        name       = f"{first} {last}".strip()
        location   = (row.get("Location") or "").strip()
        headline   = (row.get("Headline") or "").strip()
        bio        = (row.get("Bio") or "").strip()
        website    = (row.get("Website") or "").strip()
        avatar_url = (row.get("Avatar URL") or "").strip()
        tags_raw   = (row.get("Tags") or "").strip()

        twitter_url   = (row.get("Twitter URL") or "").strip()
        instagram_url = (row.get("Instagram URL") or "").strip()

        twitter   = extract_handle(twitter_url,   "twitter")
        instagram = extract_handle(instagram_url, "instagram")

        # Badge: ⭐ Founding Member if tagged
        badge = "⭐ Founding Member" if "Founding Member" in tags_raw else ""

        if not email:
            print(f"  [{i:02d}] Skipping row with no email")
            skipped += 1
            continue

        print(f"\n  [{i:02d}] {name} <{email}>")

        # Download + upload avatar
        supabase_avatar_url = ""
        if avatar_url:
            storage_path = slug_from_email(email)
            local_path   = AVATARS_DIR / storage_path

            # Use cached file if already downloaded
            if local_path.exists() and local_path.stat().st_size > 500:
                print(f"       avatar: using cached file")
            else:
                print(f"       avatar: downloading from Circle…")
                downloaded = download_avatar(avatar_url, local_path)
                if not downloaded:
                    failed_avatar += 1
                    local_path = None

            if local_path and local_path.exists():
                print(f"       avatar: uploading to Supabase storage…")
                pub_url = upload_to_supabase(
                    local_path, storage_path, project_url, service_key
                )
                if pub_url:
                    supabase_avatar_url = pub_url
                    print(f"       avatar: ✅  {pub_url}")
                else:
                    failed_avatar += 1

            time.sleep(0.3)   # be polite to Circle CDN
        else:
            print(f"       avatar: none in CSV")

        # Build SQL upsert row
        sql_inserts.append(
            f"  ({sql_str(email)}, {sql_str(name)}, {sql_str(headline)}, "
            f"{sql_str(location)}, {sql_str(bio)}, {sql_str(website)}, "
            f"{sql_str(instagram)}, {sql_str(twitter)}, "
            f"{sql_str(supabase_avatar_url or None)}, {sql_str(badge)})"
        )
        ok += 1

    # Write SQL
    print(f"\n✍️   Writing SQL to {OUTPUT_SQL.name}…")

    values_block = ",\n".join(sql_inserts)

    sql_body = f"""\
-- ── Circle → Supabase member import ─────────────────────────────────────────
-- Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}
-- Members:   {ok}
--
-- Run this in the Supabase SQL editor (Dashboard → SQL editor → New query).
-- It uses INSERT … ON CONFLICT DO UPDATE so it is safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO allowed_emails
  (email, name, headline, location, bio, website, instagram, twitter, avatar_url, badge)
VALUES
{values_block}
ON CONFLICT (email) DO UPDATE SET
  name       = EXCLUDED.name,
  headline   = EXCLUDED.headline,
  location   = EXCLUDED.location,
  bio        = EXCLUDED.bio,
  website    = EXCLUDED.website,
  instagram  = EXCLUDED.instagram,
  twitter    = EXCLUDED.twitter,
  avatar_url = CASE
                 WHEN EXCLUDED.avatar_url IS NOT NULL AND EXCLUDED.avatar_url <> ''
                 THEN EXCLUDED.avatar_url
                 ELSE allowed_emails.avatar_url
               END,
  badge      = EXCLUDED.badge,
  -- Mark everyone as active + onboarded so they can log straight in
  subscription_status = 'active',
  onboarded           = true;
"""

    OUTPUT_SQL.write_text(sql_body, encoding="utf-8")

    print(f"""
🎉  Done!
    ✅  Members processed : {ok}
    ⏭️   Skipped (no email): {skipped}
    ⚠️   Avatar failures   : {failed_avatar}

📄  SQL file written to:
    {OUTPUT_SQL}

Next step:
  1. Open Supabase dashboard → SQL editor → New query
  2. Paste / upload the contents of circle_members_import.sql
  3. Click Run
""")


if __name__ == "__main__":
    main()
