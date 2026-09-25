import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
test('Auth schema ties profiles and bookings to Supabase Auth', () => {
  const sql = readFileSync(new URL('../supabase/migrations/003_supabase_auth.sql', import.meta.url), 'utf8');
  assert.match(sql, /references auth\.users\(id\) on delete cascade/i);
  assert.match(sql, /foreign key \(user_id\) references auth\.users\(id\) on delete set null/i);
  assert.match(sql, /create trigger on_auth_user_created/i);
  assert.match(sql, /using \(user_id = \(select auth\.uid\(\)\)\)/i);
});

test('booking mutations derive identity from JWT and use transaction locking', () => {
  const sql = readFileSync(new URL('../supabase/migrations/003_supabase_auth.sql', import.meta.url), 'utf8');
  assert.match(sql, /create or replace function public\.create_my_booking/i);
  assert.match(sql, /auth\.uid\(\)/i);
  assert.match(sql, /pg_advisory_xact_lock/i);
  assert.match(sql, /grant execute on function public\.create_my_booking[\s\S]+to authenticated/i);
  assert.match(sql, /revoke all on function public\.refresh_blocked_slots\(date\) from public, anon, authenticated/i);
  assert.match(sql, /delete_my_cancelled_booking/i);
});
