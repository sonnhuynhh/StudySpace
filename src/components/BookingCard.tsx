import { memo, useMemo } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  useReducedMotion,
} from 'react-native-reanimated';
import type { Booking } from '../types';
import { dateLabel, timeLabel } from '../domain/booking';
import { colors, s } from '../theme';
import { Button } from './UI';
export const BookingCard = memo(function BookingCard({
  booking,
  onCancel,
  onOpen,
  onDelete,
  canDelete = false,
}: {
  booking: Booking;
  onCancel: (id: string) => void;
  onOpen: (id: string) => void;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}) {
  const x = useSharedValue(0);
  const reduce = useReducedMotion();
  const active =
    booking.status === 'confirmed' &&
    new Date(`${booking.date}T${String(booking.end).padStart(2, '0')}:00:00`).getTime() >
      Date.now();
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(active)
        .activeOffsetX([-15, 15])
        .failOffsetY([-12, 12])
        .onUpdate((event) => {
          x.value = Math.max(-150, Math.min(0, event.translationX));
        })
        .onEnd((event) => {
          if (event.translationX < -110) runOnJS(onCancel)(booking.id);
          x.value = reduce ? 0 : withSpring(0);
        }),
    [active, booking.id, onCancel, reduce, x],
  );
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View style={{ backgroundColor: colors.danger, borderRadius: 20, marginBottom: 16 }}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ position: 'absolute', right: 16, top: 30 }}
      >
        <Text style={{ color: 'white' }}>Hủy lịch</Text>
      </View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[s.card, style]}>
          <Text style={s.eyebrow}>
            {booking.status === 'cancelled' ? 'ĐÃ HỦY' : active ? 'ĐÃ XÁC NHẬN' : 'ĐÃ KẾT THÚC'}
          </Text>
          <Text style={s.heading}>{booking.roomName}</Text>
          <Text style={s.body}>
            {dateLabel(booking.date)} · {timeLabel(booking.start)}–{timeLabel(booking.end)}
          </Text>
          <Button title="Xem phiếu đặt phòng" onPress={() => onOpen(booking.id)} secondary />
          {canDelete && onDelete && (
            <Button title="Xóa khỏi lịch sử" onPress={() => onDelete(booking.id)} secondary />
          )}
          {active && (
            <>
              <Button title="Hủy lịch đặt" onPress={() => onCancel(booking.id)} secondary />
              <Text style={s.muted}>Có thể vuốt thẻ sang trái để hủy.</Text>
            </>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
});
