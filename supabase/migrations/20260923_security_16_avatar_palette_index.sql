-- The avatar colour of a member who has no photo.
--
-- Two colour schemes exist in the app. shared-comments.js hashes the address
-- into an HSL hue; community.html and profile.html hash it into an index over
-- a fixed palette of eight. avatar_hue ports the first. This ports the second,
-- so a page that no longer receives the address can still show the exact
-- colour it has always shown, by indexing its own palette array.
--
-- The JS is:
--   let h = 0;
--   for (const c of (email||"")) h = (h*31 + c.charCodeAt(0)) & 0xffffffff;
--   return P[Math.abs(h) % P.length];        // P.length === 8
--
-- `& 0xffffffff` in JS is ToInt32: a SIGNED 32-bit wrap, which is what the
-- arithmetic below reproduces.
create or replace function public.avatar_palette_index(p_email text)
returns integer
language plpgsql
immutable
as $fn$
declare
  s text := coalesce(p_email, '');
  h bigint := 0;
  i int;
begin
  for i in 1..length(s) loop
    h := h * 31 + ascii(substr(s, i, 1));
    h := ((h + 2147483648) % 4294967296 + 4294967296) % 4294967296 - 2147483648;
  end loop;
  return (abs(h) % 8)::int;
end;
$fn$;
