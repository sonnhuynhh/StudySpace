import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { supabase } from '../services/supabase';

type ConfirmationResult = { email: string; ok: boolean; message?: string };
type AuthValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  confirmationInProgress: boolean;
  confirmationResult: ConfirmationResult | null;
  consumeConfirmationResult: () => void;
};
const AuthContext = createContext<AuthValue>({
  session: null,
  user: null,
  loading: true,
  confirmationInProgress: false,
  confirmationResult: null,
  consumeConfirmationResult: () => undefined,
});

function isAuthCallback(url: string) {
  const parsed = Linking.parse(url);
  return /(?:^|\/)auth\/callback(?:\/|$)/.test(parsed.path ?? '');
}

function queryFromUrl(url: string) {
  const query = url.split('?')[1]?.split('#')[0] ?? '';
  const hash = url.split('#')[1] ?? '';
  return new URLSearchParams(`${query}&${hash}`);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmationInProgress, setConfirmationInProgress] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  useEffect(() => {
    let alive = true;
    let handlingUrl = false;
    const handleUrl = async (url: string) => {
      if (!isAuthCallback(url) || handlingUrl) return false;
      handlingUrl = true;
      if (alive) setConfirmationInProgress(true);
      const params = queryFromUrl(url);
      const callbackError = params.get('error_description') ?? params.get('error');
      let email = params.get('email') ?? '';
      try {
        if (callbackError) throw new Error(callbackError);
        const code = params.get('code');
        const tokenHash = params.get('token_hash');
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          email = data.user?.email ?? data.session?.user.email ?? email;
        } else if (tokenHash) {
          const type = params.get('type');
          if (type !== 'signup' && type !== 'email')
            throw new Error('Liên kết xác nhận không hợp lệ.');
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as 'signup' | 'email',
          });
          if (error) throw error;
          email = data.user?.email ?? email;
        } else {
          throw new Error('Liên kết xác nhận thiếu mã xác thực. Hãy yêu cầu gửi lại email.');
        }
        if (!email) email = (await supabase.auth.getUser()).data.user?.email ?? '';
        await supabase.auth.signOut({ scope: 'local' });
        if (alive) setConfirmationResult({ email, ok: true });
      } catch (error) {
        if (alive)
          setConfirmationResult({
            email,
            ok: false,
            message: error instanceof Error ? error.message : 'Không thể xác nhận email.',
          });
      } finally {
        handlingUrl = false;
        if (alive) {
          setConfirmationInProgress(false);
          setLoading(false);
        }
      }
      return true;
    };
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    const subscription = Linking.addEventListener('url', ({ url }) => void handleUrl(url));
    void (async () => {
      const [sessionResult, initialUrl] = await Promise.all([
        supabase.auth.getSession(),
        Linking.getInitialURL(),
      ]);
      if (!alive) return;
      setSession(sessionResult.data.session);
      if (initialUrl && (await handleUrl(initialUrl))) return;
      setLoading(false);
    })();
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
      subscription.remove();
    };
  }, []);
  const consumeConfirmationResult = useCallback(() => setConfirmationResult(null), []);
  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      confirmationInProgress,
      confirmationResult,
      consumeConfirmationResult,
    }),
    [session, loading, confirmationInProgress, confirmationResult, consumeConfirmationResult],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
