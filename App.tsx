import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider, useAuth } from './src/auth/AuthProvider';
import { AuthScreen } from './src/screens/AuthScreen';
import { Loading } from './src/components/UI';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1_000,
      gcTime: 10 * 60 * 1_000,
      retry: 2,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar style="dark" />
            <AuthenticatedApp />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AuthenticatedApp() {
  const { session, user, loading, confirmationInProgress, confirmationResult } = useAuth();
  const client = useQueryClient();
  useEffect(() => {
    void client.cancelQueries();
    client.clear();
  }, [client, user?.id]);
  if (loading) return <Loading />;
  if (confirmationInProgress || confirmationResult) return <AuthScreen />;
  return session ? <RootNavigator /> : <AuthScreen />;
}
