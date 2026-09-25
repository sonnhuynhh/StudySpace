# StudySpace — ứng dụng đặt phòng học

StudySpace là ứng dụng Expo/React Native cho iPhone, Android và web. Ứng dụng kết nối trực tiếp tới Supabase qua HTTPS, dùng Supabase Auth cho tài khoản và PostgreSQL làm nguồn dữ liệu bền vững. Expo Tunnel chỉ phân phối JavaScript bundle; app không cần backend Node hay địa chỉ IP cố định trên máy tính.

## Cấu hình Supabase

Trong Supabase Dashboard → **SQL Editor**, chạy lần lượt:

1. `supabase/migrations/001_studyspace.sql` (nếu chưa có schema và dữ liệu phòng).
2. `supabase/migrations/002_publishable_backend.sql` (nếu đã cài bản trước).
3. `supabase/migrations/003_supabase_auth.sql` (bắt buộc cho đăng nhập, quyền dữ liệu riêng và thao tác lịch).

Ở **Project Settings → API Keys**, lấy Project URL và Publishable key (`sb_publishable_...`). Tạo `.env` từ `.env.example`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_ME
```

Không đặt secret/service-role key trong Expo. Publishable key được nhúng vào ứng dụng; RLS và Auth bảo vệ từng hàng dữ liệu.

## Chạy trên iPhone

```powershell
cd D:\HocCODE\StudySpace
npm install
npm start
```

Quét QR hiện trong terminal bằng Expo Go. Giữ terminal chạy khi dùng app. Khi đổi `.env`, dừng Metro và chạy lại `npm start -- --clear`. iPhone cần Internet tới Supabase; không cần cùng Wi-Fi với máy tính hoặc mở firewall cho API cục bộ.

Đăng ký email/mật khẩu trong app. Khi Supabase bật email confirmation, app hiện trang chờ, hỗ trợ gửi lại thư và mở callback về app khi bấm xác nhận. App báo thành công rồi tự chuyển về đăng nhập với email đã điền sẵn. Trước khi thử, thêm `studyspace://auth/callback` và `exp://**/--/auth/callback` vào **Authentication → URL Configuration → Redirect URLs**; chi tiết ở [hướng dẫn Supabase](docs/07-KET-NOI-SUPABASE.md). Sau đó có thể xem phòng, tạo lịch, hủy lịch, xóa lịch đã hủy khỏi lịch sử và lưu tên hồ sơ.

## Hệ thống

```text
iPhone / Expo Go ── Expo Tunnel ── Metro (chỉ tải app)
       │
       └── HTTPS ── Supabase Auth + Data API
                              │
                              └── PostgreSQL (RLS, profiles, rooms,
                                               blocked_slots, bookings)
```

PostgreSQL RPC `create_my_booking` kiểm tra quyền, thời gian và xung đột trong transaction có advisory lock. `cancel_my_booking` đổi trạng thái và giữ lịch sử; `delete_my_cancelled_booking` chỉ xóa lịch đã hủy thuộc tài khoản hiện tại. Đọc bookings và profiles được giới hạn bằng RLS.

Xem [hướng dẫn từng bước](docs/02-STEP-BY-STEP.md), [kiến trúc](docs/03-KIEN-TRUC.md), [workflow](docs/04-WORKFLOW.md), và [cấu hình Supabase](docs/07-KET-NOI-SUPABASE.md).
