import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { FlatList, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRooms } from '../hooks/useRooms';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useFilterStore } from '../store/useFilterStore';
import { dateLabel, filterRooms, nextDays } from '../domain/booking';
import { RoomCard } from '../components/RoomCard';
import { Button, Chip, EmptyState, Loading } from '../components/UI';
import { colors, s } from '../theme';
import type { Amenity, Room } from '../types';
import type { TabProps } from '../navigation/types';
export function BrowseRoomsScreen({ navigation }: TabProps<'BrowseRooms'>) {
  const filters = useFilterStore((state) => state.filters);
  const update = useFilterStore((state) => state.update);
  const reset = useFilterStore((state) => state.reset);
  const { columns, cardWidth } = useResponsiveLayout();
  const [expanded, setExpanded] = useState(false);
  const days = useMemo(nextDays, []);
  const [date, setDate] = useState(days[0]);
  const query = useRooms(date);
  const deferredSearch = useDeferredValue(filters.search);
  const visible = useMemo(
    () =>
      filterRooms(
        query.data ?? [],
        { ...filters, search: deferredSearch },
        (room) => room.available === true,
      ),
    [query.data, filters, deferredSearch],
  );
  const openRoom = useCallback(
    (room: Room) =>
      navigation.navigate('RoomDetails', { roomId: room.id, roomName: room.name, date }),
    [navigation, date],
  );
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={s.screen}>
      <FlatList
        key={columns}
        data={visible}
        numColumns={columns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.content}
        columnWrapperStyle={columns > 1 ? { gap: 16 } : undefined}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        updateCellsBatchingPeriod={50}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshing={query.isRefetching}
        onRefresh={() => {
          void query.refetch();
        }}
        renderItem={({ item }) => (
          <RoomCard
            room={item}
            width={cardWidth}
            available={item.available === true}
            onPress={openRoom}
          />
        )}
        ListHeaderComponent={
          <View style={{ gap: 20, marginBottom: 4 }}>
            <View style={[s.row, { justifyContent: 'space-between' }]}>
              <Text style={s.eyebrow}>STUDYSPACE / CAMPUS</Text>
              <Text style={s.muted}>ĐẶT CHỖ HỌC TẬP</Text>
            </View>
            <View
              style={{ backgroundColor: colors.primary, borderRadius: 24, padding: 24, gap: 12 }}
            >
              <Text style={{ color: '#C7E5D8', fontWeight: '700', fontSize: 12, letterSpacing: 2 }}>
                KHÔNG GIAN CHO Ý TƯỞNG
              </Text>
              <Text style={[s.title, { color: 'white', fontSize: 34 }]}>
                Một chỗ ngồi.{'\n'}Nhiều cảm hứng.
              </Text>
              <Text style={{ color: '#E0F1E9', fontSize: 15, lineHeight: 23 }}>
                Tìm phòng học, chọn giờ và sẵn sàng cho buổi học tiếp theo.
              </Text>
            </View>
            <View style={{ gap: 8 }}>
              <Text style={s.body}>Tìm phòng</Text>
              <TextInput
                accessibilityLabel="Tìm phòng"
                placeholder="Tên phòng, tòa nhà hoặc phòng lab…"
                placeholderTextColor={colors.muted}
                value={filters.search}
                onChangeText={(search) => update({ search })}
                style={s.input}
                clearButtonMode="while-editing"
                returnKeyType="search"
                autoCorrect={false}
              />
            </View>
            <View style={s.row}>
              {['', 'A3', 'B1', 'Thư viện'].map((building) => (
                <Chip
                  key={building}
                  title={building || 'Tất cả tòa'}
                  selected={filters.building === building}
                  onPress={() => update({ building })}
                />
              ))}
              <Chip
                title={expanded ? 'Thu gọn bộ lọc' : 'Thêm bộ lọc'}
                selected={expanded}
                expanded={expanded}
                accessibilityHint="Hiển thị hoặc ẩn các bộ lọc nâng cao"
                onPress={() => setExpanded(!expanded)}
              />
            </View>
            {expanded && (
              <View style={[s.card, { gap: 16 }]}>
                <Text style={s.heading}>Lọc theo nhu cầu</Text>
                <Text style={s.body}>Sức chứa tối thiểu</Text>
                <View style={s.row}>
                  {[0, 12, 30, 50].map((minCapacity) => (
                    <Chip
                      key={minCapacity}
                      title={minCapacity ? `${minCapacity}+ chỗ` : 'Bất kỳ'}
                      selected={filters.minCapacity === minCapacity}
                      onPress={() => update({ minCapacity })}
                    />
                  ))}
                </View>
                <Text style={s.body}>Tiện ích (có đủ các mục đã chọn)</Text>
                <View style={s.row}>
                  {(['Wi-Fi', 'Máy chiếu', 'Bảng trắng', 'Máy tính'] as Amenity[]).map(
                    (amenity) => (
                      <Chip
                        key={amenity}
                        title={amenity}
                        selected={filters.amenities.includes(amenity)}
                        onPress={() =>
                          update({
                            amenities: filters.amenities.includes(amenity)
                              ? filters.amenities.filter((item) => item !== amenity)
                              : [...filters.amenities, amenity],
                          })
                        }
                      />
                    ),
                  )}
                </View>
                <Chip
                  title="Chỉ phòng còn giờ trống"
                  selected={filters.availableOnly}
                  onPress={() => update({ availableOnly: !filters.availableOnly })}
                />
                <Button title="Xóa tất cả bộ lọc" onPress={reset} secondary />
              </View>
            )}
            <View style={{ gap: 8 }}>
              <Text style={s.muted}>
                Trạng thái theo ngày · còn ít nhất một khung 1 giờ phù hợp
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {days.map((day, i) => (
                  <Chip
                    key={day}
                    title={i === 0 ? 'Hôm nay' : dateLabel(day).slice(0, 5)}
                    selected={date === day}
                    onPress={() => setDate(day)}
                  />
                ))}
              </ScrollView>
            </View>
            <View style={[s.row, { justifyContent: 'space-between' }]}>
              <Text style={s.heading}>Khám phá phòng</Text>
              <Text style={s.muted}>
                {visible.length} / {query.data?.length ?? 0} phòng
              </Text>
            </View>
            {query.isError && (
              <View style={s.card}>
                <Text accessibilityRole="alert" style={s.error}>
                  {query.error.message}
                </Text>
                <Button
                  title="Thử tải lại"
                  onPress={() => {
                    void query.refetch();
                  }}
                  secondary
                />
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          query.isPending ? (
            <Loading />
          ) : !query.isError ? (
            <View>
              <EmptyState
                title="Chưa tìm thấy phòng phù hợp"
                detail="Thử đổi tòa nhà, sức chứa hoặc xóa bộ lọc."
              />
              <Button title="Xóa bộ lọc" onPress={reset} secondary />
            </View>
          ) : null
        }
        ListFooterComponent={
          <Text style={[s.muted, { textAlign: 'center', marginBottom: 12 }]}>
            Danh sách phòng và lịch trống được cập nhật trực tiếp
          </Text>
        }
      />
    </SafeAreaView>
  );
}
