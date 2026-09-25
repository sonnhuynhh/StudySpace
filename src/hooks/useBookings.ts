import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelBooking,
  createBooking,
  fetchBooking,
  fetchBookings,
  deleteCancelledBooking,
} from '../services/bookingService';

export function useBookings() {
  return useQuery({ queryKey: ['bookings'], queryFn: fetchBookings });
}

export function useBooking(bookingId: string) {
  return useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => fetchBooking(bookingId),
  });
}

function useRefreshBookingData() {
  const client = useQueryClient();
  return async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['bookings'] }),
      client.invalidateQueries({ queryKey: ['rooms'] }),
      client.invalidateQueries({ queryKey: ['availability'] }),
    ]);
  };
}

export function useCreateBooking() {
  const refresh = useRefreshBookingData();
  return useMutation({ mutationFn: createBooking, onSuccess: refresh });
}

export function useCancelBooking() {
  const refresh = useRefreshBookingData();
  return useMutation({ mutationFn: cancelBooking, onSuccess: refresh });
}
export function useDeleteCancelledBooking() {
  const refresh = useRefreshBookingData();
  return useMutation({ mutationFn: deleteCancelledBooking, onSuccess: refresh });
}
