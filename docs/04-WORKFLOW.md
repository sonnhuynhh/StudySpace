# 04. Workflow hoạt động

## Khởi động và xác thực

```mermaid
sequenceDiagram
  actor U as Người dùng
  participant Expo as Expo Go / StudySpace
  participant Auth as Supabase Auth
  participant DB as PostgreSQL
  U->>Expo: Quét QR Expo Tunnel
  Expo-->>U: Tải bundle từ Metro
  U->>Expo: Đăng nhập hoặc đăng ký
  Expo->>Auth: HTTPS email + password
  Auth->>DB: Tạo auth.users và phát trigger profile
  Auth-->>Expo: Session JWT
  Expo->>Expo: Lưu session trong AsyncStorage
```

Khi mở lại app, `AuthProvider` khôi phục session đã lưu. Đăng xuất xóa session và cache server state; các màn hình dữ liệu chỉ xuất hiện khi có user session.

## Tải phòng và lịch trống

```mermaid
sequenceDiagram
  actor U as Người dùng
  participant App as Expo app
  participant Q as TanStack Query
  participant SB as Supabase Data API
  participant DB as PostgreSQL + RLS
  U->>App: Chọn ngày
  App->>Q: rooms(date)
  Q->>SB: RPC get_active_rooms + get_day_conflicts
  SB->>DB: JWT + auth.uid()
  DB-->>App: Phòng đang hoạt động và khung bận
  App-->>U: Danh sách phòng/khả dụng
```

Tìm kiếm và filter chạy trên dữ liệu đã tải. Khi đổi ngày, query key thay đổi để lấy lịch mới. Thao tác kéo xuống refetch dữ liệu từ Supabase.

## Đặt lịch

```mermaid
flowchart TD
  Detail[Chi tiết phòng] --> Slots[Đọc lịch trống]
  Slots --> Select[Chọn giờ]
  Select --> RPC[RPC create_my_booking + JWT]
  RPC --> Auth{auth.uid tồn tại?}
  Auth -->|Không| Reject[Từ chối]
  Auth -->|Có| Lock[Advisory transaction lock]
  Lock --> Validate{Kiểm tra giờ và xung đột}
  Validate -->|Xung đột| Rollback[Rollback + thông báo]
  Validate -->|Hợp lệ| Insert[Insert booking của auth.uid]
  Insert --> Invalidate[Invalidate Query caches]
  Invalidate --> Pass[Hiển thị phiếu xác nhận]
```

Khung giờ bị vô hiệu hóa trong giao diện để người dùng dễ chọn. RPC vẫn kiểm tra lại trong transaction vì một thiết bị khác có thể đặt sau khi màn hình đã tải.

## Hủy và xóa lịch sử

Người dùng xác nhận hủy → RPC `cancel_my_booking` kiểm tra chủ sở hữu và trạng thái → cập nhật trạng thái, thời điểm hủy → invalidate danh sách/lịch trống. Dữ liệu còn trong lịch sử. Khi người dùng chọn xóa một lịch đã hủy, xác nhận lần nữa rồi gọi `delete_my_cancelled_booking`; database chỉ xóa đúng bản ghi thuộc tài khoản.

## Mất kết nối

Truy vấn Supabase trả lỗi rõ ràng và có thể thử lại khi mạng phục hồi. Cache có thể hiển thị dữ liệu đã tải trong khi truy vấn, nhưng thao tác ghi chỉ báo thành công khi RPC đã commit trên PostgreSQL. Expo Tunnel cấp bundle và có thể lỗi độc lập; nó không phải kết nối backend.

## Dữ liệu theo màn hình

| Màn hình | Query/thao tác |
|---|---|
| Đăng nhập | Supabase Auth sign-in/sign-up |
| Khám phá | Phòng và khung bận theo ngày |
| Chi tiết phòng | Phòng, availability, `create_my_booking` |
| Lịch đặt | Booking của `auth.uid()`, hủy, xóa lịch đã hủy |
| Phiếu | Booking theo ID; RLS chỉ trả về bản ghi của chủ sở hữu |
| Cá nhân | Profile, cập nhật tên, đăng xuất |
