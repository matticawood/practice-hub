# Security work, 23 September 2026

These record the database changes made while closing the address exposure a
member reported. They were applied to the live database first and written down
afterwards, so they are a record of what ran, in the order it ran.

Two things to know before replaying them anywhere else.

**Rename and wrap.** Several functions were too long or too branchy to edit
safely, so instead of rewriting them the original was renamed untouched and a
thin wrapper was created under the original name. The renamed function carries
the original's object id in its name, for example
`_sec_activity_feed_v2_29541`. Those ids belong to this database. On a fresh
database the ids will differ, so the rename lines need adjusting; the wrapper
bodies do not.

**Order matters.** `12_member_identities` creates the directory every later file
depends on, and `21_key_game_scores_and_sessions` must run before
`22_leaderboards_return_member_key`.

`member_keys_for` (file 20) is a deliberately temporary bridge. It lets a page
that still holds an address exclude someone from a notification while the rest
of the conversion happens. It should be deleted once no caller needs it.
