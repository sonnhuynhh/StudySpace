import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TabProps } from '../navigation/types';
import { useBookings, useCancelBooking, useDeleteCancelledBooking } from '../hooks/useBookings';
import { BookingCard } from '../components/BookingCard';
import { Button, Chip, EmptyState, Loading } from '../components/UI';
import { s } from '../theme';

export function MyBookingsScreen({ navigation }: TabProps<'MyBookings'>) {
  const bookingsQuery = useBookings();
  const cancelMutation = useCancelBooking();
  const deleteMutation = useDeleteCancelledBooking();
  const [pending, setPending] = useState<string | null>(null);
  const [history, setHistory] = useState(false);
  const visible = useMemo(() => {
    const now = Date.now();
    return (bookingsQuery.data ?? []).filter(
      (booking) =>
        history ||
        (booking.status === 'confirmed' &&
          new Date(`${booking.date}T${String(booking.end).padStart(2, '0')}:00:00`).getTime() >
            now),
    );
  }, [bookingsQuery.data, history]);
  const openBooking = useCallback(
    (bookingId: string) => navigation.navigate('BookingConfirmation', { bookingId }),
    [navigation],
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={s.screen}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.content}
        refreshing={bookingsQuery.isRefetching}
        onRefresh={() => {
          void bookingsQuery.refetch();
        }}
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 8 }}>
            <Text style={s.eyebrow}>STUDYSPACE / LỊCH CỦA BẠN</Text>
            <Text style={s.title}>Dành thời gian để học.</Text>
            <Text style={s.muted}>
              Lịch đặt được đồng bộ với tài khoản của bạn trên mọi thiết bị.
            </Text>
            <View style={s.row}>
              <Chip title="Sắp tới" selected={!history} onPress={() => setHistory(false)} />
              <Chip title="Tất cả & đã hủy" selected={history} onPress={() => setHistory(true)} />
            </View>
            {bookingsQuery.isError && (
              <View style={s.card}>
                <Text accessibilityRole="alert" style={s.error}>
                  {bookingsQuery.error.message}
                </Text>
                <Button
                  title="Thử đồng bộ lại"
                  secondary
                  onPress={() => {
                    void bookingsQuery.refetch();
                  }}
                />
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            onCancel={setPending}
            onOpen={openBooking}
            canDelete={history && item.status === 'cancelled'}
            onDelete={(id) =>
              Alert.alert('Xóa lịch sử?', 'Lịch đã hủy sẽ bị xóa vĩnh viễn khỏi tài khoản.', [
                { text: 'Giữ lại', style: 'cancel' },
                {
                  text: deleteMutation.isPending ? 'Đang xóa…' : 'Xóa',
                  style: 'destructive',
                  onPress: () => deleteMutation.mutate(id),
                },
              ])
            }
          />
        )}
        ListEmptyComponent={
          bookingsQuery.isPending ? (
            <Loading />
          ) : !bookingsQuery.isError ? (
            <View>
              <EmptyState
                title="Chưa có lịch đặt"
                detail="Chọn một không gian phù hợp và lên lịch cho buổi học của bạn."
              />
              <Button title="Khám phá phòng" onPress={() => navigation.navigate('BrowseRooms')} />
            </View>
          ) : null
        }
      />
      <Modal
        visible={pending !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPending(null)}
        statusBarTranslucent
        accessibilityViewIsModal
      >
        <View
          style={{ flex: 1, backgroundColor: '#00000088', justifyContent: 'center', padding: 24 }}
        >
          <View style={[s.card, { maxWidth: 480, width: '100%', alignSelf: 'center' }]}>
            <Text style={s.heading}>Hủy lịch đặt này?</Text>
            <Text style={s.body}>
              Khung giờ sẽ được mở lại. Bạn vẫn có thể xem lịch này trong lịch sử.
            </Text>
            {!!cancelMutation.error && (
              <Text accessibilityRole="alert" style={s.error}>
                {cancelMutation.error.message}
              </Text>
            )}
            <Button
              title="Giữ lịch đặt"
              onPress={() => {
                cancelMutation.reset();
                setPending(null);
              }}
              secondary
            />
            <Button
              title={cancelMutation.isPending ? 'Đang hủy…' : 'Đồng ý hủy'}
              disabled={cancelMutation.isPending}
              danger
              onPress={() => {
                if (!pending) return;
                cancelMutation.mutate(pending, {
                  onSuccess: () => setPending(null),
                });
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
