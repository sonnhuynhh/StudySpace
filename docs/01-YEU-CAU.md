# 01. Đối chiếu yêu cầu

## Cách hiểu đề

Hai tài liệu mô tả cùng **Mini Project 2: Study Room Booking App**, không phải hai bài độc lập. Week 05 trang 28–30 khởi động; Week 06 trang 27–29 nêu phần nộp và rubric. Trang 32 Week 05 và trang 31 Week 06 bổ sung bài tập triển khai cụ thể. Nội dung trong PDF được dùng làm đặc tả bài tập, không dùng làm quyền tự động gửi/nộp/publish tài khoản bên ngoài.

| Yêu cầu nguồn                                      | Hiện thực                                                                  | Cách kiểm tra                                           |
| -------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------- |
| W05 tr.29: ảnh, tên, tòa, chỗ, trạng thái RoomCard | `components/RoomCard.tsx`                                                  | Mở Khám phá, xem thẻ                                    |
| W05 tr.30: tìm kiếm + chips đa tham số             | `BrowseRoomsScreen`, `filterRooms`                                         | Gõ `thu vien`, kết hợp tòa/số chỗ/tiện ích              |
| W05 tr.30: feed FlatList hướng tới 60fps           | FlatList, memo, batch/window, clip Android, ảnh cache và tìm kiếm deferred | Cần đo thêm FPS trên native; chưa chứng nhận 60fps      |
| W05 tr.30: chọn giờ + chặn xung đột                | `RoomDetailsScreen`, Supabase RPC transaction                                          | Đặt cùng giờ/giờ đã qua/giờ chiếm                       |
| W05 tr.30: Expo managed, TS strict                 | package.json, tsconfig.json                                                | `npm run typecheck`                                     |
| W05 tr.32: ít nhất 20 phòng                        | bảng `rooms`: 24 phòng được seed                                           | Bộ lọc mặc định hiển thị 24/24                          |
| W05 tr.32: máy thật + emulator                     | Checklist thiết bị                                                         | Chưa có bằng chứng chạy hai thiết bị                    |
| W06 tr.4–9,31: Stack + Bottom Tabs + typed params  | `navigation/`                                                              | Khám phá/Lịch đặt/Cá nhân; chi tiết và phiếu ngoài tabs |
| W06 tr.12,31: Zustand persist                      | `useFilterStore` lưu preferences; booking chuyển lên server state          | Đổi bộ lọc → mở lại app                                 |
| W06 tr.17–18,31: Query + pull-to-refresh           | Query quản lý rooms, availability, bookings và mutations                   | Kéo xuống → truy vấn Supabase HTTPS                     |
| W06 tr.23,26: spring, swipe-to-cancel              | `UI.Button`, `BookingCard`                                                 | Nhấn nút; vuốt trái → hộp xác nhận                      |
| W06 tr.31: bonus FadeInDown                        | `RoomCard`                                                                 | Thẻ xuất hiện có animation; tôn trọng giảm chuyển động  |
| Yêu cầu vận hành bổ sung                           | Supabase Auth/Data API + PostgreSQL; Expo Tunnel phát Metro              | QR Expo thay đổi theo phiên; không cần API LAN          |
| W06 tr.28: Expo QR + video 2–3 phút                | Hướng dẫn demo đã viết                                                     | QR tạo khi chạy Metro, video cần quay trên máy thật     |
| W06 tr.28: public GitHub + README                  | Source + README + .gitignore                                               | Chưa publish lên tài khoản ngoài                        |
| W06 tr.28: báo cáo PDF 2–4 trang đúng template     | Báo cáo 4 trang                                                            | Chưa có template chính thức để đối chiếu                |

## Quy tắc bổ sung do project lựa chọn

Đề không chỉ rõ giờ mở cửa, độ dài slot hoặc cửa sổ đặt. Bản này dùng 08:00–20:00, bước 1 giờ, đặt 1–3 giờ/lượt, trong 7 ngày tính cả hôm nay. Không cho một sinh viên đặt hai phòng cùng lúc. Mọi ngày/giờ theo múi giờ thiết bị. Bản production nên dùng múi giờ trường cố định và thời gian server.

Trạng thái thẻ “Còn giờ trống” nghĩa là backend còn ít nhất một khoảng 1 giờ có thể đặt trong ngày đang chọn, không đồng nghĩa phòng trống ngay lúc này. Lịch đã hủy không chặn khung giờ. Các lựa chọn filter kết hợp bằng AND; tiện ích phải có đủ mọi mục chọn.

## Phần mở rộng backend/database

Đề gốc không bắt buộc backend, nhưng bản hoàn thiện dùng Supabase Auth và PostgreSQL làm backend. Database có profiles, rooms, blocked_slots, bookings; RLS giới hạn dữ liệu theo tài khoản và RPC transaction chống hai thiết bị đặt cùng phòng/giờ. TanStack Query sở hữu server state, Zustand giữ client preferences đúng ranh giới state của Week 06.

## Rubric

UI/UX 25%: hệ màu thống nhất, trạng thái và animation. Features 30%: tìm/lọc/đặt/hủy. Navigation 15%: Stack + Tabs có kiểu. State 15%: Zustand tách Query. Code quality 15%: strict, hooks, module nghiệp vụ, test và tài liệu. Đây là đối chiếu khả năng đáp ứng, không phải cam kết điểm số.
