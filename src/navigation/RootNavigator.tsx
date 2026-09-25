import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList, TabParamList } from './types';
import { BrowseRoomsScreen } from '../screens/BrowseRoomsScreen';
import { MyBookingsScreen } from '../screens/MyBookingsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RoomDetailsScreen } from '../screens/RoomDetailsScreen';
import { BookingConfirmationScreen } from '../screens/BookingConfirmationScreen';
import { colors } from '../theme';
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();
const icons = {
  BrowseRooms: { active: 'search', inactive: 'search-outline' },
  MyBookings: { active: 'calendar', inactive: 'calendar-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
} as const;
function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          minHeight: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 12, lineHeight: 16 },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            name={icons[route.name][focused ? 'active' : 'inactive']}
            size={size}
            color={color}
            accessible={false}
          />
        ),
      })}
    >
      <Tabs.Screen
        name="BrowseRooms"
        component={BrowseRoomsScreen}
        options={{ title: 'Khám phá', tabBarAccessibilityLabel: 'Khám phá' }}
      />
      <Tabs.Screen
        name="MyBookings"
        component={MyBookingsScreen}
        options={{ title: 'Lịch đặt', tabBarAccessibilityLabel: 'Lịch đặt' }}
      />
      <Tabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Cá nhân', tabBarAccessibilityLabel: 'Cá nhân' }}
      />
    </Tabs.Navigator>
  );
}
export function RootNavigator() {
  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: colors.primary,
          background: colors.bg,
          card: colors.surface,
          text: colors.ink,
          border: colors.border,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShadowVisible: false,
          headerTintColor: colors.ink,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="RoomDetails"
          component={RoomDetailsScreen}
          options={({ route }) => ({ title: route.params.roomName })}
        />
        <Stack.Screen
          name="BookingConfirmation"
          component={BookingConfirmationScreen}
          options={{ title: 'Phiếu đặt phòng', presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
