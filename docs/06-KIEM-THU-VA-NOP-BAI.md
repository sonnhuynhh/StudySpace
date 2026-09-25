# 06. Kiểm thử và checklist bàn giao

## Kết quả trên mã nguồn hiện tại

| Kiểm tra | Kết quả |
|---|---|
| TypeScript strict | Pass |
| Kiểm thử domain | 15/15 pass |
| Kiểm tra migration Auth/RLS và RPC | 2/2 pass |
| Expo bundle Web, Android, iOS | Export thành công |
| Kết nối Supabase trực tiếp từ iPhone | Chưa xác nhận trên thiết bị thật |
| Migration 003 trên project Supabase | Cần chạy trong SQL Editor |

Bundle thành công xác nhận mã đóng gói được với Expo SDK 57. Nó không xác nhận user đã đăng nhập, migration đã chạy trên project thật hoặc cấu hình email của Supabase đã hoàn tất.

## Checklist trước khi mở app

1. Trong Supabase chạy `supabase/migrations/003_supabase_auth.sql` sau migrations 001/002.
2. Xác nhận có `profiles`, `rooms`, `blocked_slots`, `bookings` và các policies/RPC từ migration 003.
3. Kiểm tra `.env` có `EXPO_PUBLIC_SUPABASE_URL` và `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, lấy từ cùng một project.
4. Chạy `npm install`, rồi `npm start` tại `D:\HocCODE\StudySpace`.
5. Quét QR Expo Go. Khi sửa `.env`, khởi động lại bằng `npm start -- --clear`.
6. Đăng ký tài khoản, kiểm tra trang chờ, mở email trên iPhone, xác nhận để app báo thành công rồi tự quay về login với email đã điền. Gửi lại email nếu cần.

## Kịch bản kiểm tra thủ công

| Kịch bản | Kết quả mong đợi |
|---|---|
| Tạo tài khoản rồi đăng xuất/đăng nhập | Session hoạt động; hồ sơ được tạo tự động |
| Đăng ký cùng email lần nữa | Supabase từ chối tài khoản trùng |
| Đặt một phòng/giờ hợp lệ | Nhận mã lịch; lịch hiện trong Lịch đặt |
| Cùng tài khoản đặt thời gian chồng lấn ở phòng khác | RPC từ chối xung đột cá nhân |
| Tài khoản thứ hai đọc danh sách booking | Không thấy dữ liệu tài khoản thứ nhất (RLS) |
| Hai thiết bị đặt cùng phòng/giờ | Chỉ một giao dịch commit |
| Hủy lịch đã xác nhận | Slot được mở lại; lịch còn trong lịch sử |
| Xóa lịch đã hủy | Cần xác nhận; chỉ xóa bản ghi thuộc tài khoản |
| Sửa họ tên rồi mở lại app | Tên được lưu trong profile/Auth metadata |
| Mất kết nối Internet | Hiện lỗi tải/ghi; không giả báo thành công |

## Khắc phục nhanh

- Lỗi cấu hình: kiểm tra hai biến `EXPO_PUBLIC_` và khởi động lại Metro.
- RPC không tồn tại: chạy migration 003, chờ schema cache Supabase rồi tải lại app.
- Permission/RLS: đăng nhập và kiểm tra policies; không cấp quyền `anon` và không dùng service-role key trong Expo.
- Expo QR không mở: kiểm tra Metro/Tunnel và Internet. Đây là kết nối bundle độc lập với Supabase.
- Xác nhận email không tới: kiểm tra Spam và cấu hình Auth/SMTP trong Supabase.

## Video demo 2–3 phút

1. Mở app trên iPhone, giới thiệu đăng nhập và tài khoản.
2. Tìm/lọc phòng, chọn ngày, xem slot không khả dụng.
3. Tạo một booking, mở phiếu và lịch đặt.
4. Đăng xuất/đăng nhập hoặc mở tài khoản thứ hai để minh họa dữ liệu cá nhân.
5. Hủy booking, xem lịch sử rồi xóa lịch đã hủy.
6. Thay tên trong hồ sơ; kết thúc bằng cách chỉ vị trí README và tài liệu kiến trúc.

## Tài liệu và lệnh kiểm tra

```powershell
npm run typecheck
npm test
npm run doctor
npm run export:web
npm run export:native
```

Hướng dẫn đầy đủ trong `docs/02-STEP-BY-STEP.md`; kiến trúc ở `docs/03-KIEN-TRUC.md`; workflow ở `docs/04-WORKFLOW.md`; chọn/cấu hình Supabase ở `docs/07-KET-NOI-SUPABASE.md`. Báo cáo PDF có thể tái tạo bằng `python scripts/build_report.py`.
