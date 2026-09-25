import type { NavigatorScreenParams, CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
export type TabParamList = { BrowseRooms: undefined; MyBookings: undefined; Profile: undefined };
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  RoomDetails: { roomId: string; roomName: string; date: string };
  BookingConfirmation: { bookingId: string };
};
export type TabProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
