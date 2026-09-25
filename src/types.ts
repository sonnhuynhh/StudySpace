export type Amenity = 'Wi-Fi' | 'Máy chiếu' | 'Bảng trắng' | 'Máy tính';
export interface Room {
  id: string;
  name: string;
  building: 'A3' | 'B1' | 'Thư viện';
  capacity: number;
  kind: 'Phòng học' | 'Phòng lab';
  amenities: Amenity[];
  description: string;
  image: number;
  imageKey: string;
  available?: boolean;
}
export type ApiRoom = Omit<Room, 'image'>;
export interface Interval {
  roomId: string;
  date: string;
  start: number;
  end: number;
}
export interface Booking extends Interval {
  id: string;
  userId: string;
  roomName: string;
  status: 'confirmed' | 'cancelled';
  createdAt: string;
  cancelledAt?: string | null;
}
export interface AvailabilitySlot {
  start: number;
  end: number;
  available: boolean;
  reason: string | null;
}
export interface RoomAvailability {
  roomId: string;
  date: string;
  duration: number;
  slots: AvailabilitySlot[];
}
export interface Filters {
  search: string;
  building: string;
  minCapacity: number;
  amenities: Amenity[];
  availableOnly: boolean;
}
