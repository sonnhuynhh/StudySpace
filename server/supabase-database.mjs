import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export class ApiError extends Error {
  constructor(status, message, code = 'REQUEST_FAILED') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function bookingWindow(now = new Date()) {
  return Array.from({ length: 7 }, (_, index) =>
    dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + index)),
  );
}

function required(name, value) {
  if (!value) {
    throw new Error(
      `Thiếu ${name}. Sao chép .env.example thành .env rồi điền thông tin từ Supabase Connect.`,
    );
  }
  return value;
}

const retryableRpcNames = [
  'studyspace_health',
  'get_active_rooms',
  'get_active_room',
  'get_day_conflicts',
  'get_user_bookings',
  'get_user_booking',
  'refresh_blocked_slots',
];

async function fetchWithReadRetry(input, init) {
  const url = String(input);
  const retryable = retryableRpcNames.some((name) => url.includes(`/rpc/${name}`));
  const attempts = retryable ? 3 : 1;
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(input, init);
      if (attempt + 1 < attempts && (response.status === 429 || response.status >= 500)) {
        await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt + 1 === attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
    }
  }
  throw lastError;
}

export function openDatabase({ url, key }) {
  return createClient(required('SUPABASE_URL', url), required('SUPABASE_PUBLISHABLE_KEY', key), {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: fetchWithReadRetry,
      headers: { 'X-Application-Name': 'studyspace-api' },
    },
  });
}

function throwSupabase(error, fallback = 'Không thể truy cập Supabase.') {
  if (!error) return;
  console.error('Supabase:', error.code, error.message);
  throw new ApiError(502, fallback, 'SUPABASE_ERROR');
}

function mapRoom(row, available) {
  return {
    id: row.id,
    name: row.name,
    building: row.building,
    capacity: row.capacity,
    kind: row.kind,
    amenities: row.amenities ?? [],
    description: row.description,
    imageKey: row.image_key,
    ...(available === undefined ? {} : { available }),
  };
}

function mapBooking(row) {
  return {
    id: row.id,
    userId: row.user_id,
    roomId: row.room_id,
    roomName: row.room_name,
    date: row.booking_date,
    start: row.start_hour,
    end: row.end_hour,
    status: row.status,
    createdAt: row.created_at,
    cancelledAt: row.cancelled_at,
  };
}

function validateDate(date, now = new Date()) {
  if (!bookingWindow(now).includes(date)) {
    throw new ApiError(400, 'Chỉ đặt phòng trong 7 ngày tới.', 'INVALID_DATE');
  }
}

function validateHours(start, end) {
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 8 ||
    end > 20 ||
    end <= start ||
    end - start > 3
  ) {
    throw new ApiError(400, 'Chọn thời lượng từ 1 đến 3 giờ, trong 08:00–20:00.', 'INVALID_TIME');
  }
}

function isPast(date, start, now = new Date()) {
  return new Date(`${date}T${String(start).padStart(2, '0')}:00:00`).getTime() <= now.getTime();
}

async function loadConflicts(db, { date }) {
  const { data, error } = await db.rpc('get_day_conflicts', { p_booking_date: date });
  throwSupabase(error);
  return {
    blocked: (data ?? []).filter((slot) => slot.source === 'blocked'),
    bookings: (data ?? []).filter((slot) => slot.source === 'booking'),
  };
}

function conflictReason(conflicts, { userId, roomId, start, end }) {
  const overlaps = (slot) => slot.start_hour < end && start < slot.end_hour;
  if (conflicts.blocked.some((slot) => slot.room_id === roomId && overlaps(slot))) {
    return 'Phòng đã có lịch sử dụng trong khung giờ này.';
  }
  if (conflicts.bookings.some((slot) => slot.room_id === roomId && overlaps(slot))) {
    return 'Phòng vừa được người khác đặt trong khung giờ này.';
  }
  if (conflicts.bookings.some((slot) => slot.user_id === userId && overlaps(slot))) {
    return 'Bạn đã có lịch ở phòng khác vào giờ này.';
  }
  return null;
}

export async function healthCheck(db) {
  const { data, error } = await db.rpc('studyspace_health');
  throwSupabase(error, 'Không thể kết nối database Supabase.');
  if (!data) throw new ApiError(503, 'Supabase chưa có dữ liệu phòng.', 'DATABASE_EMPTY');
}

export async function refreshBlockedSlots(db, today = new Date()) {
  const { error } = await db.rpc('refresh_blocked_slots', { p_today: dateKey(today) });
  throwSupabase(error, 'Không thể đồng bộ lịch phòng. Hãy chạy migration Supabase trước.');
}

export async function getRoom(db, roomId) {
  const { data, error } = await db.rpc('get_active_room', { p_room_id: roomId });
  throwSupabase(error);
  if (!data?.[0]) throw new ApiError(404, 'Phòng không tồn tại.', 'ROOM_NOT_FOUND');
  return mapRoom(data[0]);
}

export async function getAvailability(
  db,
  { userId, roomId, date, duration = 1 },
  now = new Date(),
) {
  validateDate(date, now);
  validateHours(8, 8 + duration);
  await Promise.all([getRoom(db, roomId), refreshBlockedSlots(db, now)]);
  const conflicts = await loadConflicts(db, { userId, date });
  const slots = Array.from({ length: 12 }, (_, index) => index + 8)
    .filter((start) => start + duration <= 20)
    .map((start) => {
      const reason = isPast(date, start, now)
        ? 'Khung giờ này đã qua.'
        : conflictReason(conflicts, { userId, roomId, start, end: start + duration });
      return { start, end: start + duration, available: !reason, reason };
    });
  return { roomId, date, duration, slots };
}

export async function listRooms(db, { date, userId }, now = new Date()) {
  validateDate(date, now);
  await refreshBlockedSlots(db, now);
  const [{ data, error }, conflicts] = await Promise.all([
    db.rpc('get_active_rooms'),
    loadConflicts(db, { userId, date }),
  ]);
  throwSupabase(error);
  return (data ?? []).map((row) => {
    const available = Array.from({ length: 12 }, (_, index) => index + 8).some(
      (start) =>
        !isPast(date, start, now) &&
        !conflictReason(conflicts, { userId, roomId: row.id, start, end: start + 1 }),
    );
    return mapRoom(row, available);
  });
}

export async function listBookings(db, userId) {
  const { data, error } = await db.rpc('get_user_bookings', { p_user_id: userId });
  throwSupabase(error);
  return (data ?? []).map(mapBooking);
}

export async function findBooking(db, bookingId, userId) {
  const { data, error } = await db.rpc('get_user_booking', {
    p_booking_id: bookingId,
    p_user_id: userId,
  });
  throwSupabase(error);
  if (!data?.[0]) throw new ApiError(404, 'Không tìm thấy lịch đặt.', 'BOOKING_NOT_FOUND');
  return mapBooking(data[0]);
}

export async function createBooking(db, input, now = new Date()) {
  const { userId, roomId, date, start, end } = input;
  if (!userId || typeof userId !== 'string' || userId.length > 64) {
    throw new ApiError(400, 'Người dùng không hợp lệ.', 'INVALID_USER');
  }
  validateDate(date, now);
  validateHours(start, end);
  if (isPast(date, start, now)) {
    throw new ApiError(409, 'Khung giờ này đã qua. Vui lòng chọn giờ khác.', 'PAST_SLOT');
  }
  const { data, error } = await db.rpc('create_booking', {
    p_id: `SS-${randomUUID().split('-')[0].toUpperCase()}`,
    p_user_id: userId,
    p_room_id: roomId,
    p_booking_date: date,
    p_start_hour: start,
    p_end_hour: end,
  });
  if (error) {
    if (error.message.includes('BOOKING_CONFLICT')) {
      throw new ApiError(409, 'Phòng hoặc lịch cá nhân vừa bị trùng.', 'BOOKING_CONFLICT');
    }
    if (error.message.includes('ROOM_NOT_FOUND')) {
      throw new ApiError(404, 'Phòng không tồn tại.', 'ROOM_NOT_FOUND');
    }
    throwSupabase(error, 'Không thể tạo lịch đặt trên Supabase.');
  }
  return mapBooking(Array.isArray(data) ? data[0] : data);
}

export async function cancelBooking(db, bookingId, userId) {
  const { data, error } = await db.rpc('cancel_booking', {
    p_booking_id: bookingId,
    p_user_id: userId,
  });
  if (error?.message.includes('BOOKING_NOT_FOUND')) {
    throw new ApiError(404, 'Không tìm thấy lịch đặt.', 'BOOKING_NOT_FOUND');
  }
  throwSupabase(error, 'Không thể hủy lịch đặt trên Supabase.');
  return mapBooking(Array.isArray(data) ? data[0] : data);
}
