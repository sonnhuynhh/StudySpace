import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/UI';
import { supabaseConfigured, supabase } from '../services/supabase';
import { useAuth } from '../auth/AuthProvider';
import { colors, s } from '../theme';

export function AuthScreen() {
  const { confirmationResult, consumeConfirmationResult } = useAuth();
  const [signup, setSignup] = useState(false);
  const [waitingForEmail, setWaitingForEmail] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!confirmationResult) return;
    setWaitingForEmail(false);
    setSignup(false);
    setPassword('');
    setConfirm('');
    if (confirmationResult.email) setEmail(confirmationResult.email);
    if (confirmationResult.ok) {
      setConfirmed(true);
      setMessage('Email đã được xác nhận thành công. Đang chuyển về đăng nhập…');
      setError('');
      const timer = setTimeout(() => {
        setConfirmed(false);
        setMessage('Email đã xác nhận. Bạn có thể đăng nhập ngay.');
        consumeConfirmationResult();
      }, 2200);
      return () => clearTimeout(timer);
    }
    setConfirmed(false);
    setError(confirmationResult.message ?? 'Không thể xác nhận email.');
    consumeConfirmationResult();
  }, [confirmationResult, consumeConfirmationResult]);

  const sendConfirmationAgain = async () => {
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: { emailRedirectTo: Linking.createURL('auth/callback') },
      });
      if (resendError) throw resendError;
      setMessage('Đã gửi lại email xác nhận. Hãy kiểm tra hộp thư và thư mục Spam.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không gửi lại được email xác nhận.');
    } finally {
      setBusy(false);
    }
  };
  const submit = async () => {
    setError('');
    setMessage('');
    if (!supabaseConfigured) {
      setError(
        'Thiếu cấu hình Supabase. Hãy điền EXPO_PUBLIC_SUPABASE_URL và EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY trong file .env rồi khởi động lại Expo.',
      );
      return;
    }
    if (signup && password !== confirm) {
      setError('Mật khẩu xác nhận chưa khớp.');
      return;
    }
    if (password.length < 8) {
      setError('Mật khẩu cần có ít nhất 8 ký tự.');
      return;
    }
    setBusy(true);
    try {
      const result = signup
        ? await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: { full_name: name.trim() },
              emailRedirectTo: Linking.createURL('auth/callback'),
            },
          })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) throw result.error;
      if (signup && !result.data.session) setWaitingForEmail(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể xác thực tài khoản.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            s.content,
            { flexGrow: 1, justifyContent: 'center', maxWidth: 560 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ gap: 14, marginBottom: 24 }}>
            <Text style={s.eyebrow}>STUDYSPACE / CAMPUS</Text>
            <Text style={[s.title, { fontSize: 38 }]}>Không gian học tập, theo lịch của bạn.</Text>
            <Text style={s.muted}>
              Đăng nhập để đặt phòng và đồng bộ lịch trên các thiết bị của bạn.
            </Text>
          </View>
          <View style={s.card}>
            {confirmed ? (
              <View accessibilityRole="alert" style={{ gap: 12, alignItems: 'center' }}>
                <Text style={s.heading}>Xác nhận thành công</Text>
                <Text style={[s.muted, { textAlign: 'center' }]}>{message}</Text>
              </View>
            ) : waitingForEmail ? (
              <View accessibilityRole="alert" style={{ gap: 12 }}>
                <Text style={s.heading}>Kiểm tra email của bạn</Text>
                <Text style={s.muted}>
                  Chúng tôi đã gửi liên kết xác nhận đến {email}. Mở email trên iPhone và nhấn xác
                  nhận; ứng dụng sẽ báo thành công rồi tự điền email ở màn hình đăng nhập.
                </Text>
                {!!error && <Text style={s.error}>{error}</Text>}
                {!!message && <Text style={[s.muted, { color: colors.primary }]}>{message}</Text>}
                <Button
                  title={busy ? 'Đang gửi…' : 'Gửi lại email xác nhận'}
                  disabled={busy}
                  onPress={() => void sendConfirmationAgain()}
                />
                <Button
                  title="Quay lại đăng nhập"
                  secondary
                  onPress={() => {
                    setWaitingForEmail(false);
                    setSignup(false);
                    setPassword('');
                    setError('');
                    setMessage('');
                  }}
                />
              </View>
            ) : (
              <>
                <Text style={s.heading}>{signup ? 'Tạo tài khoản' : 'Chào mừng trở lại'}</Text>
                {signup && (
                  <Field
                    label="Họ và tên"
                    value={name}
                    onChangeText={setName}
                    autoComplete="name"
                  />
                )}
                <Field
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                <Field
                  label="Mật khẩu"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete={signup ? 'new-password' : 'current-password'}
                />
                {signup && (
                  <Field
                    label="Nhập lại mật khẩu"
                    value={confirm}
                    onChangeText={setConfirm}
                    secureTextEntry
                  />
                )}
                {!!error && (
                  <Text accessibilityRole="alert" style={s.error}>
                    {error}
                  </Text>
                )}
                {!!message && (
                  <Text accessibilityRole="alert" style={[s.muted, { color: colors.primary }]}>
                    {message}
                  </Text>
                )}
                <Button
                  title={busy ? 'Đang xử lý…' : signup ? 'Tạo tài khoản' : 'Đăng nhập'}
                  disabled={busy}
                  onPress={() => {
                    void submit();
                  }}
                />
              </>
            )}
            {!waitingForEmail && !confirmed && (
              <Button
                title={signup ? 'Đã có tài khoản? Đăng nhập' : 'Tạo tài khoản mới'}
                secondary
                onPress={() => {
                  setSignup(!signup);
                  setError('');
                  setMessage('');
                }}
              />
            )}
          </View>
          <Text style={[s.muted, { textAlign: 'center', marginTop: 16 }]}>
            Bảo mật tài khoản bằng Supabase Auth
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'email-address';
  autoCapitalize?: 'none';
  autoComplete?: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.body}>{props.label}</Text>
      <TextInput
        accessibilityLabel={props.label}
        style={s.input}
        value={props.value}
        onChangeText={props.onChangeText}
        secureTextEntry={props.secureTextEntry}
        keyboardType={props.keyboardType}
        autoCapitalize={props.autoCapitalize}
        autoComplete={props.autoComplete as never}
        textContentType={props.secureTextEntry ? 'password' : undefined}
      />
    </View>
  );
}
