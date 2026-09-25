import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import type { Room } from '../types';
import { colors, s } from '../theme';
export const RoomCard = memo(function RoomCard({
  room,
  width,
  available,
  onPress,
}: {
  room: Room;
  width: number;
  available: boolean;
  onPress: (room: Room) => void;
}) {
  const reduce = useReducedMotion();
  return (
    <Animated.View
      entering={reduce ? undefined : FadeInDown.duration(260)}
      style={{ width, marginBottom: 16 }}
    >
      <Pressable
        onPress={() => onPress(room)}
        accessibilityRole="button"
        accessibilityLabel={`${room.name}, ${room.capacity} chỗ, ${available ? 'còn giờ trống' : 'hết giờ trống'}. Xem chi tiết`}
        style={({ pressed }) => ({
          backgroundColor: colors.surface,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Image
          source={room.image}
          style={{ width: '100%', height: 164 }}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={room.id}
          transition={reduce ? 0 : 140}
          accessible={false}
        />
        <View style={{ padding: 18, gap: 12 }}>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <Text style={s.eyebrow}>{room.kind.toUpperCase()}</Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: available ? colors.primary : colors.danger,
              }}
            >
              {available ? 'Còn giờ trống' : 'Hết giờ trống'}
            </Text>
          </View>
          <Text style={s.heading}>{room.name}</Text>
          <View style={s.row}>
            <Ionicons name="location-outline" size={16} color={colors.muted} accessible={false} />
            <Text style={s.muted}>
              {room.building === 'Thư viện' ? 'Thư viện trung tâm' : `Tòa ${room.building}`}
            </Text>
            <Text style={s.muted}>· {room.capacity} chỗ</Text>
          </View>
          <View
            style={[
              s.row,
              {
                borderTopWidth: 1,
                borderColor: colors.border,
                paddingTop: 12,
                justifyContent: 'space-between',
              },
            ]}
          >
            <Text style={s.muted}>{room.amenities.slice(0, 2).join(' · ')}</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.primary} accessible={false} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});
