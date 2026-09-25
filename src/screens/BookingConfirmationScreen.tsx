import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useBooking } from '../hooks/useBookings';
import { dateLabel, timeLabel } from '../domain/booking';
import { Button, EmptyState, Loading } from '../components/UI';
import { colors, s } from '../theme';
export function BookingConfirmationScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'BookingConfirmation'>) {
  const bookingQuery = useBooking(route.params.bookingId);
  const booking = bookingQuery.data;
  if (bookingQuery.isPending) return <Loading />;
  if (bookingQuery.isError)
    return (
      <View style={s.content}>
        <Text accessibilityRole="alert" style={s.error}>
          {bookingQuery.error.message}
        </Text>
        <Button
          title="Thử tải lại"
          onPress={() => {
            void bookingQuery.refetch();
          }}
        />
      </View>
    );
  if (!booking)
    return <EmptyState title="Không tìm thấy phiếu" detail="Quay lại lịch đặt để kiểm tra." />;
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={s.screen}>
      <ScrollView contentContainerStyle={[s.content, { maxWidth: 640, paddingTop: 32 }]}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Ionicons
            name={
              booking.status === 'confirmed' ? 'checkmark-circle-outline' : 'close-circle-outline'
            }
            size={64}
            color={booking.status === 'confirmed' ? colors.primary : colors.danger}
            accessible={false}
          />
          <Text style={s.title}>
            {booking.status === 'confirmed' ? 'Phòng đã sẵn sàng.' : 'Lịch đặt đã hủy.'}
          </Text>
          <Text style={s.muted}>Phiếu xác nhận của bạn</Text>
        </View>
        <View style={[s.card, { padding: 28, gap: 24 }]}>
          <Text style={s.eyebrow}>STUDYSPACE / BOOKING PASS</Text>
          <Text style={s.title}>{booking.roomName}</Text>
          <View>
            <Text style={s.muted}>NGÀY HỌC</Text>
            <Text style={s.heading}>{dateLabel(booking.date)}</Text>
          </View>
          <View>
            <Text style={s.muted}>KHUNG GIỜ</Text>
            <Text style={s.heading}>
              {timeLabel(booking.start)}–{timeLabel(booking.end)}
            </Text>
          </View>
          <View
            style={{
              borderTopWidth: 1,
              borderStyle: 'dashed',
              borderColor: colors.border,
              paddingTop: 20,
              gap: 8,
            }}
          >
            <Text style={s.muted}>MÃ ĐẶT PHÒNG</Text>
            <Text selectable style={s.body}>
              {booking.id.toUpperCase()}
            </Text>
            <Text style={s.muted}>
              {booking.status === 'confirmed' ? 'Đã xác nhận' : 'Đã hủy'} · Đã đồng bộ với tài khoản
            </Text>
          </View>
        </View>
        <Text style={s.muted}>
          Thông tin đặt phòng được lưu trong tài khoản StudySpace của bạn.
        </Text>
        <Button
          title="Về lịch đặt của tôi"
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs', params: { screen: 'MyBookings' } }],
            })
          }
        />
        <Button
          title="Tiếp tục tìm phòng"
          secondary
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs', params: { screen: 'BrowseRooms' } }],
            })
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}
