-- Supabase Auth, private account profiles, and user-scoped booking operations.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Detach old demo identities and orphan UUIDs before enforcing the Auth FK.
alter table public.bookings alter column user_id drop not null;
update public.bookings b set user_id = null
where case
  when b.user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then not exists (select 1 from auth.users u where u.id = b.user_id::uuid)
  else true
end;
alter table public.bookings alter column user_id type uuid using
  case when user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then user_id::uuid else null end;
-- Detached legacy rows remain for audit but are invisible and no longer reserve slots.
alter table public.bookings drop constraint if exists bookings_user_id_auth_fkey;
alter table public.bookings add constraint bookings_user_id_auth_fkey
  foreign key (user_id) references auth.users(id) on delete set null;
create index if not exists bookings_user_time_idx
  on public.bookings (user_id, booking_date, status, start_hour, end_hour);

grant select on public.rooms, public.blocked_slots to authenticated;
drop policy if exists rooms_read_active on public.rooms;
drop policy if exists blocked_slots_read on public.blocked_slots;
drop policy if exists bookings_select_own on public.bookings;
create policy rooms_read_active on public.rooms for select to authenticated using (active = true);
create policy blocked_slots_read on public.blocked_slots for select to authenticated using (true);
create policy bookings_select_own on public.bookings for select to authenticated using (user_id = (select auth.uid()));
revoke insert, update, delete on public.rooms, public.blocked_slots, public.bookings from anon, authenticated;
grant select on public.bookings to authenticated;

drop function if exists public.get_day_conflicts(date);
create function public.get_day_conflicts(p_booking_date date)
returns table(source text, room_id text, start_hour integer, end_hour integer, is_mine boolean)
language sql stable security definer set search_path = public
as $$
  select 'blocked'::text, b.room_id, b.start_hour, b.end_hour, false
  from public.blocked_slots b where b.booking_date = p_booking_date
  union all
  select 'booking'::text, b.room_id, b.start_hour, b.end_hour, b.user_id = (select auth.uid())
  from public.bookings b where b.booking_date = p_booking_date and b.status = 'confirmed' and b.user_id is not null
$$;

create or replace function public.create_my_booking(
  p_room_id text, p_booking_date date, p_start_hour integer, p_end_hour integer
)
returns setof public.bookings language plpgsql security definer set search_path = public
as $$
declare v_room public.rooms%rowtype; v_today date := (now() at time zone 'Asia/Bangkok')::date;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_booking_date < v_today or p_booking_date > v_today + 6 then raise exception 'INVALID_DATE'; end if;
  if p_start_hour < 8 or p_end_hour > 20 or p_end_hour <= p_start_hour or p_end_hour - p_start_hour > 3 then raise exception 'INVALID_TIME'; end if;
  if p_booking_date = v_today and p_start_hour <= extract(hour from now() at time zone 'Asia/Bangkok') then raise exception 'PAST_TIME'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_booking_date::text || ':' || p_room_id, 0));
  perform public.refresh_blocked_slots(v_today);
  select * into v_room from public.rooms where id = p_room_id and active;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if exists (select 1 from public.blocked_slots b where b.room_id = p_room_id and b.booking_date = p_booking_date and b.start_hour < p_end_hour and p_start_hour < b.end_hour)
    or exists (select 1 from public.bookings b where b.status = 'confirmed' and b.user_id is not null and b.booking_date = p_booking_date and b.start_hour < p_end_hour and p_start_hour < b.end_hour and (b.room_id = p_room_id or b.user_id = auth.uid())) then
    raise exception 'BOOKING_CONFLICT';
  end if;
  return query insert into public.bookings(id,user_id,room_id,room_name,booking_date,start_hour,end_hour)
    values ('SS-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),auth.uid(),p_room_id,v_room.name,p_booking_date,p_start_hour,p_end_hour)
    returning *;
end;
$$;

create or replace function public.cancel_my_booking(p_booking_id text)
returns setof public.bookings language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  return query update public.bookings set status='cancelled', cancelled_at=coalesce(cancelled_at,now())
    where id=p_booking_id and user_id=auth.uid() and status='confirmed' returning *;
  if not found then raise exception 'BOOKING_NOT_FOUND'; end if;
end;
$$;

create or replace function public.delete_my_cancelled_booking(p_booking_id text)
returns boolean language plpgsql security definer set search_path = public
as $$
declare n integer;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  delete from public.bookings where id=p_booking_id and user_id=auth.uid() and status='cancelled';
  get diagnostics n = row_count;
  return n = 1;
end;
$$;

revoke all on function public.studyspace_health() from public, anon, authenticated;
revoke all on function public.get_active_rooms() from public, anon, authenticated;
revoke all on function public.get_active_room(text) from public, anon, authenticated;
revoke all on function public.get_day_conflicts(date) from public, anon, authenticated;
revoke all on function public.get_user_bookings(text) from public, anon, authenticated;
revoke all on function public.get_user_booking(text,text) from public, anon, authenticated;
revoke all on function public.refresh_blocked_slots(date) from public, anon, authenticated;
revoke all on function public.create_my_booking(text,date,integer,integer) from public, anon, authenticated;
revoke all on function public.cancel_my_booking(text) from public, anon, authenticated;
revoke all on function public.delete_my_cancelled_booking(text) from public, anon, authenticated;
revoke all on function public.create_booking(text,text,text,date,integer,integer) from public, anon, authenticated;
revoke all on function public.cancel_booking(text,text) from public, anon, authenticated;
grant execute on function public.get_active_rooms() to authenticated;
grant execute on function public.get_active_room(text) to authenticated;
grant execute on function public.get_day_conflicts(date) to authenticated;
grant execute on function public.create_my_booking(text,date,integer,integer) to authenticated;
grant execute on function public.cancel_my_booking(text) to authenticated;
grant execute on function public.delete_my_cancelled_booking(text) to authenticated;
grant execute on function public.refresh_blocked_slots(date) to service_role;

-- Retire legacy RPCs that accepted caller-supplied user IDs.
drop function if exists public.get_user_bookings(text);
drop function if exists public.get_user_booking(text,text);
drop function if exists public.create_booking(text,text,text,date,integer,integer);
drop function if exists public.cancel_booking(text,text);
