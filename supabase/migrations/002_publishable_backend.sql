create or replace function public.studyspace_health()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.rooms limit 1) $$;

create or replace function public.get_active_rooms()
returns setof public.rooms language sql stable security definer set search_path = public
as $$ select * from public.rooms where active = true order by sort_order $$;

create or replace function public.get_active_room(p_room_id text)
returns setof public.rooms language sql stable security definer set search_path = public
as $$ select * from public.rooms where id = p_room_id and active = true limit 1 $$;

create or replace function public.get_day_conflicts(p_booking_date date)
returns table(source text, room_id text, user_id text, start_hour integer, end_hour integer)
language sql stable security definer set search_path = public
as $$
  select 'blocked'::text, b.room_id, null::text, b.start_hour, b.end_hour
  from public.blocked_slots b where b.booking_date = p_booking_date
  union all
  select 'booking'::text, b.room_id, b.user_id, b.start_hour, b.end_hour
  from public.bookings b where b.booking_date = p_booking_date and b.status = 'confirmed'
$$;

create or replace function public.get_user_bookings(p_user_id text)
returns setof public.bookings language sql stable security definer set search_path = public
as $$ select * from public.bookings where user_id = p_user_id order by booking_date, start_hour, created_at desc $$;

create or replace function public.get_user_booking(p_booking_id text, p_user_id text)
returns setof public.bookings language sql stable security definer set search_path = public
as $$ select * from public.bookings where id = p_booking_id and user_id = p_user_id limit 1 $$;

revoke all on function public.studyspace_health() from public;
revoke all on function public.get_active_rooms() from public;
revoke all on function public.get_active_room(text) from public;
revoke all on function public.get_day_conflicts(date) from public;
revoke all on function public.get_user_bookings(text) from public;
revoke all on function public.get_user_booking(text,text) from public;

grant execute on function public.studyspace_health() to anon, service_role;
grant execute on function public.get_active_rooms() to anon, service_role;
grant execute on function public.get_active_room(text) to anon, service_role;
grant execute on function public.get_day_conflicts(date) to anon, service_role;
grant execute on function public.get_user_bookings(text) to anon, service_role;
grant execute on function public.get_user_booking(text,text) to anon, service_role;
grant execute on function public.refresh_blocked_slots(date) to anon, service_role;
grant execute on function public.create_booking(text,text,text,date,integer,integer) to anon, service_role;
grant execute on function public.cancel_booking(text,text) to anon, service_role;
