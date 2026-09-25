# 02. Hướng dẫn hoàn thiện và chạy ứng dụng

## 1. Chuẩn bị

- Node.js và npm phù hợp với Expo SDK 57.
- Expo Go trên iPhone.
- Project Supabase đã tạo và còn hoạt động.
- iPhone có Internet để truy cập Supabase và Expo Tunnel.

Project được đặt tại `D:\HocCODE\StudySpace`. Kết nối ứng dụng tới Supabase qua HTTPS, vì vậy điện thoại không cần cùng Wi-Fi với máy tính và không cần IP cố định.

## 2. Cài thư viện

Mở PowerShell:

```powershell
cd D:\HocCODE\StudySpace
npm install
```

Supabase client dùng AsyncStorage để lưu session Auth trên thiết bị và polyfill URL cho React Native.

## 3. Cài database

Trong Supabase Dashboard mở **SQL Editor → New query**. Chạy theo thứ tự migration trong `supabase/migrations`:

1. `001_studyspace.sql` tạo phòng, lịch bận, booking và dữ liệu phòng mẫu.
2. `002_publishable_backend.sql` nếu project hiện tại chưa chạy migration này; migration 003 sẽ thu hồi các RPC cũ.
3. `003_supabase_auth.sql` tạo hồ sơ, liên kết booking với Supabase Auth, bật policies RLS và các RPC an toàn.

Kiểm tra ở **Table Editor**: `profiles`, `rooms`, `blocked_slots`, `bookings` có tồn tại; `rooms` có 24 phòng. Không cần tạo bảng `users`: danh tính và mật khẩu do `auth.users` của Supabase quản lý.

## 4. Cấu hình app

Trong **Project Settings → API Keys**, sao chép Project URL và Publishable key, không dùng secret/service-role key. Tại thư mục project:

```powershell
Copy-Item .env.example .env
notepad .env
```

Điền hai biến:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<publishable-key>
```

Tên `EXPO_PUBLIC_` bắt buộc để Expo đưa cấu hình công khai vào ứng dụng. Không ghi secret key vào biến này.

## 5. Đăng nhập và mở trên iPhone

```powershell
npm start
```

Expo Tunnel cung cấp QR/link Metro của phiên hiện tại. Mở Expo Go và quét QR. Liên kết Tunnel có thể thay đổi theo phiên; app gọi Supabase bằng Project URL cố định (HTTPS), không gọi máy tính ở cổng API LAN.

Tạo tài khoản bằng email/mật khẩu. Khi email confirmation bật, app hiển thị trang chờ và gửi email xác nhận. Thêm redirect URLs `studyspace://auth/callback` và `exp://**/--/auth/callback` trong Supabase **Authentication → URL Configuration → Redirect URLs**. Mở thư trên iPhone, bấm xác nhận để quay về app; app báo thành công rồi tự về màn hình đăng nhập với email đã điền. Xem thêm `docs/07-KET-NOI-SUPABASE.md`.

Nếu vừa chỉnh `.env`, dừng Metro bằng Ctrl+C rồi chạy `npm start -- --clear`.

## 6. Luồng sử dụng

1. Đăng nhập/tạo tài khoản; session được giữ an toàn trong bộ nhớ ứng dụng bằng AsyncStorage.
2. Khám phá phòng và kiểm tra lịch trống theo ngày.
3. Mở phòng, chọn thời lượng và giờ phù hợp; PostgreSQL kiểm tra xung đột lần cuối trước khi ghi.
4. Trong Lịch đặt, mở phiếu, hủy lịch hoặc xem lịch sử.
5. Trong lịch sử, xóa riêng các lịch đã hủy khỏi tài khoản.
6. Trong Cá nhân, sửa tên hiển thị hoặc đăng xuất.

## 7. Khắc phục lỗi kết nối

- **Thiếu cấu hình Supabase**: kiểm tra `.env` nằm cạnh `package.json`, dùng chính xác tên `EXPO_PUBLIC_SUPABASE_URL` và `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, sau đó khởi động Metro lại.
- **Invalid API key / project not found**: sao chép Project URL và Publishable key từ cùng một Supabase project.
- **Function not found**: kiểm tra migration 003 đã chạy thành công; chờ vài giây để PostgREST nạp schema rồi khởi động lại app.
- **Permission denied / RLS**: đăng nhập trước và kiểm tra policies/grants trong migration 003; không chuyển app sang secret key.
- **Không nhận thư xác nhận**: xem Spam và cấu hình Auth → SMTP/email confirmation trong Supabase.
- **Expo Go không tải app**: kiểm tra Internet, giữ terminal Expo chạy, quét lại QR Tunnel. Đây là lỗi Metro riêng với truy cập Supabase.

## 8. Kiểm tra phát triển

```powershell
npm run typecheck
npm run doctor
npm run export:web
```

Kiểm tra end-to-end bằng hai tài khoản: mỗi tài khoản chỉ thấy lịch của mình; không thể đặt hai lịch trùng phòng hoặc trùng thời gian cá nhân; hủy mở lại slot; lịch đã hủy chỉ xóa được bởi chủ sở hữu.
