begin;

-- The thing Konrad found.
--
-- One policy on this table said that any signed-in member may read every row.
-- Combined with the column grants, that meant a member could ask for
-- allowed_emails?select=email and receive all 119 addresses in one request,
-- and subscription_status alongside them.
--
-- Nothing in the app needs that any more. Names, pictures, badges, headlines
-- and the members list are served by member_directory, member_list,
-- member_profile and the member_card_* functions, none of which return an
-- address. Somebody already in front of you is resolved by member_cards_for,
-- which answers only for addresses the caller supplies. Starting a chat goes
-- through chat_create.
--
-- So the row is yours, or the owner's. The self-read policy and the owner
-- policy already exist and are left exactly as they are.
drop policy if exists "Members can read others name and avatar" on public.allowed_emails;

commit;
