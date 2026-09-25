import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useRoom, useRoomAvailability } from '../hooks/useRooms';
import { useCreateBooking } from '../hooks/useBookings';
import { dateLabel, nextDays, timeLabel } from '../domain/booking';
import { Button, Chip, EmptyState, Loading, Section } from '../components/UI';
import { s } from '../theme';

export function RoomDetailsScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'RoomDetails'>) {
  const roomQuery = useRoom(route.params.roomId);
  const days = useMemo(nextDays, []);
  const reduce = useReducedMotion();
  const [date, setDate] = useState(days.includes(route.params.date) ? route.params.date : days[0]);
  const [duration, setDuration] = useState(1);
  const [start, setStart] = useState<number | null>(null);
  const [error, setError] = useState('');
  const availability = useRoomAvailability(route.params.roomId, date, duration);
  const createBooking = useCreateBooking();
  const room = roomQuery.data;

  const submit = async () => {
    if (!room || start === null) return;
    setError('');
    try {
      const booking = await createBooking.mutateAsync({
        roomId: room.id,
        date,
        start,
        end: start + duration,
      });
      navigation.replace('BookingConfirmation', { bookingId: booking.id });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể tạo lịch đặt.');
      setStart(null);
      void availability.refetch();
    }
  };

  if (roomQuery.isPending) return <Loading />;
  if (roomQuery.isError) {
    return (
      <View style={s.content}>
        <Text accessibilityRole="alert" style={s.error}>
          {roomQuery.error.message}
        </Text>
        <Button
          title="Thử tải lại"
          onPress={() => {
            void roomQuery.refetch();
          }}
        />
      </View>
    );
  }
  if (!room) {
    return (
      <EmptyState title="Không tìm thấy phòng" detail="Quay lại danh sách để chọn phòng khác." />
    );
  }

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        <Image
          source={room.image}
          style={{ width: '100%', height: 230, borderRadius: 24 }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={reduce ? 0 : 180}
          accessibilityLabel={`Minh họa ${room.name}`}
          accessible
        />
        <View style={{ gap: 10 }}>
          <Text style={s.eyebrow}>
            {room.kind.toUpperCase()} / {room.building}
          </Text>
          <Text style={s.title}>{room.name}</Text>
          <Text style={s.body}>{room.description}</Text>
          <Text style={s.muted}>
            {room.capacity} chỗ · {room.amenities.join(' · ')}
          </Text>
        </View>
        <Section title="01 / Chọn ngày">
          <View style={s.row}>
            {days.map((day, index) => (
              <Chip
                key={day}
                title={index === 0 ? 'Hôm nay' : dateLabel(day).slice(0, 5)}
                selected={date === day}
                onPress={() => {
                  setDate(day);
                  setStart(null);
                  setError('');
                }}
              />
            ))}
          </View>
        </Section>
        <Section title="02 / Thời lượng">
          <View style={s.row}>
            {[1, 2, 3].map((hours) => (
              <Chip
                key={hours}
                title={`${hours} giờ`}
                selected={duration === hours}
                onPress={() => {
                  setDuration(hours);
                  setStart(null);
                  setError('');
                }}
              />
            ))}
          </View>
        </Section>
        <Section title="03 / Giờ bắt đầu">
          <Text style={s.muted}>
            Chọn khung giờ còn trống. Lịch sẽ được xác nhận an toàn trước khi lưu.
          </Text>
          {availability.isPending ? (
            <Loading />
          ) : availability.isError ? (
            <View style={s.card}>
              <Text accessibilityRole="alert" style={s.error}>
                {availability.error.message}
              </Text>
              <Button
                title="Tải lại khung giờ"
                secondary
                onPress={() => {
                  void availability.refetch();
                }}
              />
            </View>
          ) : (
            <View style={s.row}>
              {availability.data.slots.map((slot) => (
                <Chip
                  key={slot.start}
                  title={timeLabel(slot.start)}
                  selected={start === slot.start}
                  disabled={!slot.available}
                  accessibilityLabel={`${timeLabel(slot.start)}, ${slot.available ? 'khả dụng' : slot.reason}`}
                  onPress={() => {
                    setStart(slot.start);
                    setError('');
                  }}
                />
              ))}
            </View>
          )}
        </Section>
        <View style={s.card}>
          <Text style={s.heading}>Tóm tắt lịch đặt</Text>
          <Text style={s.body}>
            {dateLabel(date)} ·{' '}
            {start === null
              ? 'Chưa chọn giờ bắt đầu'
              : `${timeLabel(start)}–${timeLabel(start + duration)}`}
          </Text>
          <Text style={s.muted}>
            Lịch đặt sẽ đồng bộ an toàn với tài khoản StudySpace của bạn.
          </Text>
          {!!error && (
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
          )}
          <Button
            title={createBooking.isPending ? 'Đang xác nhận…' : 'Xác nhận đặt phòng'}
            disabled={start === null || createBooking.isPending}
            onPress={() => {
              void submit();
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
