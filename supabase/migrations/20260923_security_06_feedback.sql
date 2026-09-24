-- Feedback: the board is shared, the tampering is not.
--
-- Reading stays open, because the board is meant to be visible to everyone and
-- Konrad's own message referred to it as public. What was also open:
--
--   feedback DELETE / UPDATE   USING true, so any member could delete or
--                              rewrite anybody's report. Both controls are
--                              owner-only in the UI, in both copies of the page.
--   feedback INSERT            a blanket policy sat beside the correct
--                              own-email one, so the correct one was decoration.
--   delete_feedback_reply()    a definer function with no check at all: any
--                              member could delete any reply on any report. The
--                              button is owner-only in feedback.html and in
--                              practice-log.html.
--   toggle_feedback_upvote()   guarded, but with the usual gap: a null email
--                              passes, and a logged-out caller has a null email.

-- a reply may only be removed by the owner, which is who the UI offers it to
create or replace function public.delete_feedback_reply(p_feedback_id uuid, p_reply_id text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare
  v_claims json;
  v_role   text;
begin
  v_claims := nullif(current_setting('request.jwt.claims', true), '')::json;
  v_role   := coalesce(v_claims ->> 'role', '');
  if v_role in ('authenticated', 'anon')
     and lower(coalesce(v_claims ->> 'email', '')) <> 'matthew@matthewcawood.com' then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  UPDATE feedback
  SET replies = (
    SELECT COALESCE(jsonb_agg(r ORDER BY (r->>'created_at')), '[]'::jsonb)
    FROM jsonb_array_elements(COALESCE(replies,'[]'::jsonb)) r
    WHERE r->>'id' != p_reply_id
  )
  WHERE id = p_feedback_id;
end;
$fn$;

-- same body, but the shared guard, which refuses a logged-out caller
create or replace function public.toggle_feedback_upvote(p_id uuid, p_email text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare v_upvoted_by jsonb; v_already boolean; v_out jsonb;
begin
  perform public.assert_self_or_owner(p_email);
  select upvoted_by into v_upvoted_by from feedback where id = p_id;
  v_already := v_upvoted_by ? p_email;
  if v_already then
    update feedback set upvoted_by = upvoted_by - p_email, upvotes = greatest(upvotes - 1, 0), updated_at = now()
      where id = p_id returning jsonb_build_object('upvotes', upvotes, 'upvoted', false) into v_out;
  else
    update feedback set upvoted_by = coalesce(upvoted_by, '[]'::jsonb) || to_jsonb(p_email), upvotes = coalesce(upvotes, 0) + 1, updated_at = now()
      where id = p_id returning jsonb_build_object('upvotes', upvotes, 'upvoted', true) into v_out;
  end if;
  return v_out;
end;
$fn$;

-- the table's own rules
drop policy if exists "feedback_delete" on public.feedback;
drop policy if exists "feedback_update" on public.feedback;
drop policy if exists "feedback_insert" on public.feedback;

create policy "feedback_owner_delete" on public.feedback for delete to authenticated
  using (lower((select auth.jwt() ->> 'email')) = 'matthew@matthewcawood.com');

create policy "feedback_owner_update" on public.feedback for update to authenticated
  using (lower((select auth.jwt() ->> 'email')) = 'matthew@matthewcawood.com')
  with check (lower((select auth.jwt() ->> 'email')) = 'matthew@matthewcawood.com');

-- feedback_insert_own already exists and is the correct one, so nothing replaces
-- the blanket insert policy.

-- feedback_replies: the replies actually live in feedback.replies as jsonb and
-- the client never touches this table, so the open write policies protect
-- nothing and are removed.
drop policy if exists "feedback_replies_delete" on public.feedback_replies;
drop policy if exists "feedback_replies_insert" on public.feedback_replies;
