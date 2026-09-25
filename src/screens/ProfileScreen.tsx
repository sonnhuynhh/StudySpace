import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { TabProps } from '../navigation/types';
import { useAuth } from '../auth/AuthProvider';
import { useBookings } from '../hooks/useBookings';
import { supabase } from '../services/supabase';
import { Button, Section } from '../components/UI';
import { colors, s } from '../theme';

export function ProfileScreen({ navigation }: TabProps<'Profile'>) {
  const { user } = useAuth();
  const bookings = useBookings();
  const [name, setName] = useState(String(user?.user_metadata.full_name ?? ''));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    setName(String(user?.user_metadata.full_name ?? ''));
  }, [user?.id]);
  const counts = useMemo(
    () =>
      (bookings.data ?? []).reduce(
        (out, item) => {
          out[item.status] += 1;
          return out;
        },
        { confirmed: 0, cancelled: 0 },
      ),
    [bookings.data],
  );
  const save = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    setNotice('');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, full_name: name.trim() }, { onConflict: 'id' });
    if (profileError) setError(profileError.message);
    else {
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: name.trim() },
      });
      if (authError) setError(authError.message);
      else setNotice('Thông tin tài khoản đã được lưu.');
    }
    setSaving(false);
  };
  const signOut = async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(signOutError.message);
  };
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.eyebrow}>TÀI KHOẢN</Text>
        <Text style={s.title}>Hồ sơ của bạn.</Text>
        <View style={s.card}>
          <Ionicons
            name="person-circle-outline"
            size={60}
            color={colors.primary}
            accessible={false}
          />
          <Text style={s.heading}>{user?.email}</Text>
          <Text style={s.muted}>
            {counts.confirmed} lịch đã xác nhận · {counts.cancelled} lịch đã hủy
          </Text>
        </View>
        <Section title="Thông tin cá nhân">
          <Text style={s.body}>Họ và tên</Text>
          <TextInput
            accessibilityLabel="Họ và tên"
            style={s.input}
            value={name}
            onChangeText={setName}
            autoComplete="name"
            returnKeyType="done"
          />
          {!!notice && <Text style={[s.muted, { color: colors.primary }]}>{notice}</Text>}
          {!!error && (
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
          )}
          <Button
            title={saving ? 'Đang lưu…' : 'Lưu thay đổi'}
            disabled={saving || name.trim() === String(user?.user_metadata.full_name ?? '')}
            onPress={() => {
              void save();
            }}
          />
        </Section>
        <Section title="Quy tắc đặt phòng">
          <Text style={s.body}>
            Đặt trước tối đa 7 ngày · khung giờ 08:00–20:00 · mỗi lượt từ 1 đến 3 giờ. Lịch được
            kiểm tra và xác nhận trên cơ sở dữ liệu trước khi hoàn tất.
          </Text>
        </Section>
        <Text style={s.muted}>Thông tin hồ sơ và lịch đặt được bảo vệ theo tài khoản của bạn.</Text>
        <Button
          title="Đăng xuất"
          secondary
          onPress={() => {
            void signOut();
          }}
        />
        <Button title="Mở danh sách phòng" onPress={() => navigation.navigate('BrowseRooms')} />
      </ScrollView>
    </SafeAreaView>
  );
}
