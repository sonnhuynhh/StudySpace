import type { PropsWithChildren } from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import { colors, s } from '../theme';
export function Button({
  title,
  onPress,
  disabled = false,
  secondary = false,
  danger = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
}) {
  const scale = useSharedValue(1);
  const reduce = useReducedMotion();
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => {
          if (!reduce) scale.value = withSpring(0.97);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        style={({ pressed }) => ({
          minHeight: 50,
          borderRadius: 14,
          padding: 14,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: secondary ? colors.soft : danger ? colors.danger : colors.primary,
          opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
        })}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: secondary ? colors.primary : colors.surface,
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
export function Chip({
  title,
  selected,
  onPress,
  disabled = false,
  expanded,
  accessibilityLabel,
  accessibilityHint,
}: {
  title: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  expanded?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected, disabled, expanded }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primary : colors.surface,
        borderRadius: 12,
        minHeight: 48,
        paddingHorizontal: 14,
        paddingVertical: 12,
        justifyContent: 'center',
        opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          fontSize: 14,
          color: selected ? colors.surface : colors.ink,
          fontWeight: selected ? '700' : '500',
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Section({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={s.heading}>{title}</Text>
      {children}
    </View>
  );
}
export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={[s.card, { marginVertical: 16 }]}>
      <Text style={s.heading}>{title}</Text>
      <Text style={s.muted}>{detail}</Text>
    </View>
  );
}
export function Loading() {
  return (
    <View style={{ padding: 40, gap: 16 }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[s.muted, { textAlign: 'center' }]}>Đang tải dữ liệu…</Text>
    </View>
  );
}
