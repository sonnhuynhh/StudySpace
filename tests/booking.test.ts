import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dateKey,
  nextDays,
  overlaps,
  validateBooking,
  filterRooms,
  normalize,
} from '../src/domain/booking';
import type { Booking, Filters, Interval, Room } from '../src/types';
const now = new Date(2026, 8, 17, 7, 0);
const slot: Interval = { roomId: 'a', date: '2026-09-18', start: 10, end: 12 };
const booking: Booking = {
  ...slot,
  id: 'b',
  userId: 'student-demo',
  roomName: 'A',
  status: 'confirmed',
  createdAt: now.toISOString(),
};
test('valid future reservation succeeds', () =>
  assert.equal(validateBooking(slot, [], [], now), null));
test('overlap detects containment and partial overlap', () => {
  assert.ok(overlaps(slot, { ...slot, start: 9, end: 13 }));
  assert.ok(overlaps(slot, { ...slot, start: 11, end: 13 }));
});
test('adjacent intervals do not overlap', () =>
  assert.equal(overlaps(slot, { ...slot, start: 12, end: 13 }), false));
test('other date/room does not overlap', () => {
  assert.equal(overlaps(slot, { ...slot, roomId: 'b' }), false);
  assert.equal(overlaps(slot, { ...slot, date: '2026-09-19' }), false);
});
test('existing personal booking blocks duplicates', () =>
  assert.match(validateBooking(slot, [booking], [], now)!, /trùng/));
test('external occupancy blocks booking', () =>
  assert.match(validateBooking(slot, [], [slot], now)!, /lịch sử dụng/));
test('personal collision across rooms is blocked', () =>
  assert.match(validateBooking({ ...slot, roomId: 'b' }, [booking], [], now)!, /phòng khác/));
test('cancelled booking releases slot', () =>
  assert.equal(validateBooking(slot, [{ ...booking, status: 'cancelled' }], [], now), null));
test('past time is rejected including current hour', () =>
  assert.match(
    validateBooking(
      { ...slot, date: '2026-09-17', start: 8, end: 9 },
      [],
      [],
      new Date(2026, 8, 17, 8, 0),
    )!,
    /đã qua/,
  ));
test('outside opening hours is rejected', () => {
  for (const [start, end] of [
    [7, 9],
    [19, 21],
    [12, 12],
    [10, 14],
    [10.5, 12],
  ])
    assert.ok(validateBooking({ ...slot, start, end }, [], [], now));
});
test('seven day booking window rejects out-of-range and invalid dates', () => {
  for (const date of ['2026-09-16', '2026-09-24', '2026-02-30', 'invalid'])
    assert.ok(validateBooking({ ...slot, date }, [], [], now));
});
test('last permitted day and closing boundary accepted', () =>
  assert.equal(
    validateBooking({ ...slot, date: '2026-09-23', start: 19, end: 20 }, [], [], now),
    null,
  ));
test('date helpers handle year rollover in local time', () => {
  assert.equal(dateKey(new Date(2026, 0, 1)), '2026-01-01');
  assert.equal(nextDays(new Date(2026, 11, 30))[2], '2027-01-01');
});
test('Vietnamese normalization supports unsigned search', () =>
  assert.equal(normalize('  Thư viện Đà Nẵng '), 'thu vien da nang'));
const room: Room = {
  id: 'a',
  name: 'Thư viện A',
  building: 'Thư viện',
  capacity: 30,
  kind: 'Phòng học',
  amenities: ['Wi-Fi', 'Bảng trắng'],
  description: '',
  image: 1,
  imageKey: 'study',
};
const filters: Filters = {
  search: 'thu vien',
  building: 'Thư viện',
  minCapacity: 20,
  amenities: ['Wi-Fi', 'Bảng trắng'],
  availableOnly: true,
};
test('combined filters use AND semantics', () => {
  assert.equal(filterRooms([room], filters, () => true).length, 1);
  assert.equal(filterRooms([room], { ...filters, minCapacity: 50 }, () => true).length, 0);
  assert.equal(filterRooms([room], { ...filters, amenities: ['Máy tính'] }, () => true).length, 0);
  assert.equal(filterRooms([room], filters, () => false).length, 0);
});
