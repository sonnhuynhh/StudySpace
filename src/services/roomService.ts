import { roomImage } from '../data/roomImages';
import type { Room, RoomAvailability } from '../types';
import { supabase } from './supabase';

type RoomRow = Omit<Room, 'image' | 'imageKey'> & { image_key: string; sort_order: number };
type Conflict = {
  source: 'blocked' | 'booking';
  room_id: string;
  start_hour: number;
  end_hour: number;
  is_mine: boolean;
};
function hydrateRoom(row: RoomRow): Room {
  const { image_key, ...room } = row;
  return { ...room, imageKey: image_key, image: roomImage(image_key) };
}

async function getRooms(): Promise<Room[]> {
  const { data, error } = await supabase.rpc('get_active_rooms');
  if (error) throw error;
  return ((data ?? []) as RoomRow[]).map(hydrateRoom);
}
export async function fetchRooms(date: string): Promise<Room[]> {
  const [rooms, conflicts] = await Promise.all([getRooms(), fetchConflicts(date)]);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return rooms.map((room) => ({
    ...room,
    available: Array.from({ length: 11 }, (_, i) => 8 + i).some((start) =>
      date > today || (date === today && start > now.getHours())
        ? !conflicts.some(
            (c) => c.room_id === room.id && c.start_hour < start + 1 && start < c.end_hour,
          )
        : false,
    ),
  }));
}
export async function fetchRoom(roomId: string): Promise<Room> {
  const { data, error } = await supabase.rpc('get_active_room', { p_room_id: roomId });
  if (error) throw error;
  const row = (data as RoomRow[] | null)?.[0];
  if (!row) throw new Error('Không tìm thấy phòng hoặc phòng đã ngừng hoạt động.');
  return hydrateRoom(row);
}
async function fetchConflicts(date: string): Promise<Conflict[]> {
  const { data, error } = await supabase.rpc('get_day_conflicts', { p_booking_date: date });
  if (error) throw error;
  return (data ?? []) as Conflict[];
}
export async function fetchAvailability(
  roomId: string,
  date: string,
  duration: number,
): Promise<RoomAvailability> {
  const conflicts = await fetchConflicts(date);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentHour = now.getHours();
  const slots = Array.from({ length: 12 - duration }, (_, index) => 8 + index).map((start) => {
    const blocking = conflicts.find(
      (c) =>
        (c.room_id === roomId || (c.source === 'booking' && c.is_mine)) &&
        c.start_hour < start + duration &&
        start < c.end_hour,
    );
    const past = date < today || (date === today && start <= currentHour);
    return {
      start,
      end: start + duration,
      available: !blocking && !past,
      reason: past
        ? 'Đã qua'
        : blocking?.source === 'blocked'
          ? 'Đã có lịch'
          : blocking?.is_mine
            ? 'Trùng lịch của bạn'
            : blocking
              ? 'Đã được đặt'
              : null,
    };
  });
  return { roomId, date, duration, slots };
}
