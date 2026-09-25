import type { Booking, Filters, Interval, Room } from '../types';

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function nextDays(now = new Date()): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    return dateKey(date);
  });
}
export const timeLabel = (hour: number) => `${String(hour).padStart(2, '0')}:00`;
export function dateLabel(key: string): string {
  const [year, month, day] = key.split('-');
  return `${day}/${month}/${year}`;
}
export function overlaps(a: Interval, b: Interval): boolean {
  return a.roomId === b.roomId && a.date === b.date && a.start < b.end && b.start < a.end;
}
export function validateBooking(
  candidate: Interval,
  bookings: Booking[],
  occupied: Interval[],
  now = new Date(),
): string | null {
  if (!nextDays(now).includes(candidate.date)) return 'Chỉ đặt phòng trong 7 ngày tới.';
  if (
    !Number.isInteger(candidate.start) ||
    !Number.isInteger(candidate.end) ||
    candidate.start < 8 ||
    candidate.end > 20 ||
    candidate.end <= candidate.start ||
    candidate.end - candidate.start > 3
  )
    return 'Chọn thời lượng từ 1 đến 3 giờ, trong 08:00–20:00.';
  const startsAt = new Date(`${candidate.date}T${String(candidate.start).padStart(2, '0')}:00:00`);
  if (startsAt.getTime() <= now.getTime()) return 'Khung giờ này đã qua. Vui lòng chọn giờ khác.';
  if (occupied.some((item) => overlaps(candidate, item)))
    return 'Phòng đã có lịch sử dụng trong khung giờ này.';
  if (bookings.some((item) => item.status === 'confirmed' && overlaps(candidate, item)))
    return 'Bạn đã đặt phòng này trong khung giờ trùng nhau.';
  if (
    bookings.some(
      (item) =>
        item.status === 'confirmed' &&
        item.date === candidate.date &&
        candidate.start < item.end &&
        item.start < candidate.end,
    )
  )
    return 'Bạn đã có lịch ở phòng khác vào giờ này.';
  return null;
}
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}
export function filterRooms(
  rooms: Room[],
  filters: Filters,
  available: (room: Room) => boolean,
): Room[] {
  const search = normalize(filters.search);
  return rooms.filter(
    (room) =>
      normalize(`${room.name} ${room.building} ${room.kind}`).includes(search) &&
      (!filters.building || room.building === filters.building) &&
      room.capacity >= filters.minCapacity &&
      filters.amenities.every((amenity) => room.amenities.includes(amenity)) &&
      (!filters.availableOnly || available(room)),
  );
}
