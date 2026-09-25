import { useQuery } from '@tanstack/react-query';
import { fetchAvailability, fetchRoom, fetchRooms } from '../services/roomService';

export function useRooms(date: string) {
  return useQuery({ queryKey: ['rooms', date], queryFn: () => fetchRooms(date) });
}

export function useRoom(roomId: string) {
  return useQuery({ queryKey: ['room', roomId], queryFn: () => fetchRoom(roomId) });
}

export function useRoomAvailability(roomId: string, date: string, duration: number) {
  return useQuery({
    queryKey: ['availability', roomId, date, duration],
    queryFn: () => fetchAvailability(roomId, date, duration),
  });
}
