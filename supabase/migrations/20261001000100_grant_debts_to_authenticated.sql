-- Newer Supabase projects no longer auto-grant new tables to the API roles, so signed-in
-- users got "permission denied for table debts". Grant table access explicitly;
-- the RLS policies from the previous migration still decide which rows each user can touch.
-- anon stays without any grant.

grant select, insert, update, delete on public.debts to authenticated;
