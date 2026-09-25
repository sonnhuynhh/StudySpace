import type { Booking, Interval } from '../types';
import { supabase } from './supabase';

type BookingRow = {
  id: string;
  user_id: string;
  room_id: string;
  room_name: string;
  booking_date: string;
  start_hour: number;
  end_hour: number;
  status: Booking['status'];
  created_at: string;
  cancelled_at: string | null;
};
function mapBooking(row: BookingRow): Booking {
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
export async function fetchBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('booking_date')
    .order('start_hour')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as BookingRow[]).map(mapBooking);
}
export async function fetchBooking(bookingId: string): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Không tìm thấy lịch đặt trong tài khoản này.');
  return mapBooking(data as BookingRow);
}
export async function createBooking(candidate: Interval): Promise<Booking> {
  const { data, error } = await supabase.rpc('create_my_booking', {
    p_room_id: candidate.roomId,
    p_booking_date: candidate.date,
    p_start_hour: candidate.start,
    p_end_hour: candidate.end,
  });
  if (error) throw new Error(translateError(error.message));
  const row = (data as BookingRow[] | null)?.[0];
  if (!row) throw new Error('Supabase chưa trả về lịch đặt vừa tạo.');
  return mapBooking(row);
}
export async function cancelBooking(bookingId: string): Promise<Booking> {
  const { data, error } = await supabase.rpc('cancel_my_booking', { p_booking_id: bookingId });
  if (error) throw new Error(translateError(error.message));
  const row = (data as BookingRow[] | null)?.[0];
  if (!row) throw new Error('Không thể hủy lịch này.');
  return mapBooking(row);
}
export async function deleteCancelledBooking(bookingId: string): Promise<void> {
  const { data, error } = await supabase.rpc('delete_my_cancelled_booking', {
    p_booking_id: bookingId,
  });
  if (error) throw new Error(translateError(error.message));
  if (data !== true) throw new Error('Chỉ có thể xóa lịch đã hủy của tài khoản hiện tại.');
}
function translateError(message: string): string {
  if (message.includes('BOOKING_CONFLICT'))
    return 'Khung giờ này vừa có người đặt hoặc trùng với lịch khác của bạn. Hãy chọn giờ khác.';
  if (message.includes('AUTH_REQUIRED')) return 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.';
  if (message.includes('ROOM_NOT_FOUND')) return 'Phòng đã ngừng hoạt động hoặc không còn tồn tại.';
  if (
    message.includes('INVALID_DATE') ||
    message.includes('INVALID_TIME') ||
    message.includes('PAST_TIME')
  )
    return 'Ngày hoặc giờ đặt không còn hợp lệ. Hãy tải lại lịch trống.';
  return message;
}
