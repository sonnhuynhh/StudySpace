# 07. Kết nối Supabase và xử lý lỗi trên iPhone

## Cách kết nối được chọn

StudySpace dùng Supabase trực tiếp: Expo → Supabase Auth/Data API qua HTTPS. Đây là backend do Supabase cung cấp. Máy tính chỉ chạy Metro để phát bundle; Expo Tunnel không chuyển tiếp API backend. Nhờ vậy điện thoại không cần cùng Wi-Fi, địa chỉ IP LAN hay firewall port.

Giao dịch đặt phòng vẫn được xử lý nguyên tử trong PostgreSQL RPC, không tin dữ liệu khả dụng cũ trên client. Supabase Auth cung cấp JWT, RLS giới hạn booking/profile, publishable key chỉ nhận diện project chứ không cấp quyền quản trị.

## Tạo schema và migration

Trong Supabase Dashboard → **SQL Editor**, chạy migrations theo thứ tự:

1. `001_studyspace.sql`: tạo `rooms`, `blocked_slots`, `bookings`, indexes, lịch bận và seed 24 phòng.
2. `002_publishable_backend.sql`: migration cũ; chạy nếu project đã theo hướng dẫn ban đầu hoặc mới tạo từ đầu theo lịch sử project.
3. `003_supabase_auth.sql`: tạo `profiles`, liên kết `bookings.user_id` với `auth.users`, thu hồi RPC cũ nhận user ID do client truyền vào, bật quyền theo tài khoản và tạo RPC mới.

Các booking cũ có user ID demo/orphan được tách khỏi Auth và giữ làm dữ liệu lịch sử ẩn; chúng không còn xuất hiện cho tài khoản mới hoặc chiếm khung giờ.

Kiểm tra Table Editor có `profiles`, `rooms`, `blocked_slots`, `bookings`; trong Authentication → Users sẽ xuất hiện user khi đăng ký. `profiles.id` tự tạo từ trigger `on_auth_user_created`.

Nếu project trước đã chạy migration 001 và 002 thì chỉ cần chạy 003. Migrations lưu trong repository; chạy lại migration cũ không thay thế việc chạy 003.

## Cấu hình Expo

Mở **Project Settings → API Keys** và sao chép Project URL cùng Publishable key. Trong thư mục project:

```powershell
Copy-Item .env.example .env
notepad .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<key>
```

Expo chỉ nhận hai giá trị công khai này. Không dùng `service_role`, secret key, database password hay connection string trong app.

## Khởi động

```powershell
cd D:\HocCODE\StudySpace
npm install
npm start
```

Quét QR Expo Go. Link Tunnel thay đổi theo phiên là bình thường; nó chỉ dùng tải Metro. Nếu vừa sửa `.env`, khởi động lại Metro để Expo nạp biến mới:

```powershell
npm start -- --clear
```

Tạo tài khoản bằng email/mật khẩu. App đưa bạn sang màn hình chờ email; bấm link xác nhận trên cùng iPhone để mở lại app, nhận thông báo thành công, rồi app tự chuyển về đăng nhập và điền sẵn email. Sau đó thử tạo và hủy lịch.

### Deep link xác nhận email

Trong Supabase Dashboard → **Authentication → URL Configuration → Redirect URLs**, thêm các URL sau:

```text
studyspace://auth/callback
exp://**/--/auth/callback
```

URL thứ nhất dành cho development/standalone build có scheme `studyspace`. URL thứ hai cho Expo Go; host tunnel được tạo động mỗi lần chạy nên cần mẫu `**`. `emailRedirectTo` trong app được tạo từ `Linking.createURL`, không ghim IP hay địa chỉ tunnel. Supabase chỉ nhận các redirect nằm trong allow-list; mẫu wildcard nên chỉ dùng cho môi trường phát triển. Trong production, ưu tiên app link/domain riêng và redirect chính xác. [Tài liệu redirect URL của Supabase](https://supabase.com/docs/guides/auth/redirect-urls).

Mở email trên chính iPhone đang chạy Expo Go để mã PKCE đã lưu trong app có thể được dùng khi callback quay lại. Nếu link báo URL không hợp lệ, kiểm tra allow-list ở trên và gửi lại email. Nếu Expo Go không bắt được `exp://` trên phiên bản đang cài, dùng development build với scheme `studyspace`.

## Kiểm tra kết nối Supabase

1. Xác nhận URL và publishable key cùng thuộc một project.
2. Kiểm tra Supabase project đang hoạt động và điện thoại có Internet.
3. Kiểm tra migration 003 đã chạy thành công, không có lỗi trong SQL Editor.
4. Đăng nhập; nếu RPC báo không tìm thấy function, chờ PostgREST nạp schema rồi tải lại app.
5. Nếu báo permission/RLS, xác nhận user đã đăng nhập và policies migration 003 tồn tại. Không khắc phục bằng cách cấp quyền `anon` hoặc nhúng secret key.
6. Nếu QR không tải bundle, xử lý riêng Expo Tunnel/Metro; một lỗi tunnel không cho biết Supabase đang lỗi.

## Bảo mật và dữ liệu

- `profiles` cho phép user đọc/thay đổi hàng có `id = auth.uid()`.
- `bookings` chỉ đọc được hàng có `user_id = auth.uid()`; RPC tự lấy UUID từ JWT.
- `rooms` và `blocked_slots` chỉ đọc cho `authenticated`.
- Tạo lịch lấy advisory lock theo phòng/ngày; hủy giữ lịch sử; xóa chỉ áp dụng lịch đã hủy của chủ tài khoản.
- Trước production cần cấu hình SMTP, email redirect, backup và quản lý migration. Không chia sẻ hoặc commit `.env`.
