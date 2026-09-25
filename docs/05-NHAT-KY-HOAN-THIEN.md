# 05. Nhật ký hoàn thiện

Tài liệu mô tả các bước xây dựng ban đầu ngày 17/09/2026 và đợt rà soát/cải tiến ngày 24/09/2026, không phải lịch sử commit đầy đủ.

## Giai đoạn 1 — Đọc và chốt đề

Trích xuất nội dung hai PDF, xem trực quan wireframe Week 05 trang 29 và yêu cầu nộp Week 06 trang 28. Xác định đây là cùng Mini Project 2. Ghi yêu cầu minh bạch: 24 phòng vượt mức tối thiểu 20; Stack/Tabs, strict TypeScript, Zustand persist, Query refresh, chống trùng, animation và tài liệu. Template báo cáo không nằm trong tài liệu đầu vào.

## Giai đoạn 2 — Khởi tạo nền tảng

Tạo nền project bằng template Expo blank-typescript rồi bàn giao tại `D:\HocCODE\StudySpace`. Template lúc tạo là SDK 57, React Native 0.86.3. Cài các native module bằng expo install; navigation major 7, Zustand và Query riêng. Khóa dependency bằng package-lock. Cấu hình hướng màn hình default để xoay, giao diện sáng.

## Giai đoạn 3 — Dữ liệu và nghiệp vụ

Định nghĩa Room/Interval/Booking/Filters trước. Tạo fixture 24 phòng và lịch bận ổn định. Viết hàm thuần normalize, filterRooms, nextDays, overlaps, validateBooking. Tách roomService khỏi UI và tạo cờ mô phỏng lỗi một lần để demo recovery. Chọn quy tắc 7 ngày, 1–3 giờ, 08:00–20:00 và không trùng lịch cá nhân.

## Giai đoạn 4 — State và persistence

Query giữ phòng, Zustand giữ lịch local và filter. Store kiểm tra lại mỗi yêu cầu đặt. Persist bookings bằng AsyncStorage; thêm hàng đợi ghi và hydration gate. Trong quá trình rà soát, chuyển trạng thái hydration/lỗi sang store riêng để việc báo lỗi đọc không ghi đè dữ liệu persisted. Hủy giữ lịch sử với status cancelled.

## Giai đoạn 5 — Giao diện và tương tác

Xây năm màn hình với Stack + Tabs typed. Tạo theme, các UI primitives có vùng chạm lớn và nhãn. Dùng FlatList responsive, RoomCard memoized/FadeInDown và ảnh local. Dùng Gesture Handler + Reanimated cho vuốt hủy, có modal xác nhận và nút thay thế. Ảnh phòng học/lab/thư viện được tạo bằng ImageGen và đóng gói vào assets; không sử dụng ảnh thật của trường.

## Giai đoạn 6 — Kiểm tra và sửa

- Typecheck ban đầu của app pass; khi thêm test, TypeScript 6 yêu cầu khai báo rõ node types. Đã bổ sung types react/node và dependency @types/node.
- tsx bị lỗi `uv_os_get_passwd` khi chạy trong sandbox Windows; chạy kiểm thử ngoài sandbox đã pass 15/15. Không thay validator để né test.
- Metro export thành công web, Android, iOS. Expo Doctor ban đầu 20/21 vì expo-font chỉ là dependency gián tiếp; thêm trực tiếp và plugin, kết quả 21/21.
- Kiểm tra trình duyệt: tìm tiếng Việt không dấu, layout 375px, ngày khả dụng, giờ bận, chọn giờ và phiếu. Các kịch bản tiếp theo ghi tại tài liệu 06.
- Cải thiện chuyển màn hình: truyền ngày đang xem qua typed route vào chi tiết để giữ ngữ cảnh.

## Giai đoạn 7 — Tài liệu

Tạo README, bảng đối chiếu, hướng dẫn thực hiện và chạy từng bước, tài liệu kiến trúc, sơ đồ workflow, nhật ký và checklist demo/nộp. Sinh báo cáo PDF 4 trang bằng ReportLab với font Unicode tiếng Việt; render bằng Poppler để xem bố cục. Script build_report.py cho phép tái tạo báo cáo, không cần chỉnh PDF thủ công.

## Giai đoạn 8 — Rà soát và tối ưu

- Đối chiếu lại hai PDF, bổ sung đúng cấu hình Query của Week 06: stale 5 phút, gc 10 phút, retry 2; thêm chuyển màn hình slide-from-right.
- Chuyển ảnh sang `expo-image` để downscale, cache memory-disk và lazy-load web; giữ kích thước khung cố định tránh layout shift.
- Hoãn giá trị tìm kiếm, tiền tính availability theo Set, memo hóa slot/lịch/count, memo hóa BookingCard và tinh chỉnh batch/clip FlatList.
- Bổ sung semantic expanded, nhãn slot khả dụng, ẩn icon trang trí khỏi screen reader, màu danger và modal xác nhận rõ hơn.
- Tạo `scripts/start-expo.mjs` để mọi lệnh Expo dùng `172.26.26.111:8080`, kèm `start:default` khi chuyển mạng.

## Giai đoạn 9 — Backend và database

- Thay fixture runtime bằng Supabase PostgreSQL với bảng users, rooms, blocked_slots và bookings; seed 24 phòng khi khởi động.
- Tạo REST API Node.js, health check, availability, CRUD booking, JSON error contract và CORS cho Expo/web.
- Đặt/hủy chạy transaction `PostgreSQL RPC transaction với advisory lock`; prepared statements, foreign keys, WAL, indexes và busy timeout bảo vệ tính nhất quán.
- Chuyển booking từ Zustand/AsyncStorage sang TanStack Query server state; Zustand persist tiếp tục lưu bộ lọc UI.
- Thêm integration test chạy migration và repository Supabase, kiểm tra xung đột phòng/cá nhân, hủy, giải phóng slot và persistence sau restart.
- Tạo `start-all.mjs` để một lệnh mở backend cổng 4000 và Expo cổng 8080 cho iPhone cùng Wi-Fi.

## Giai đoạn 10 — Supabase Auth và kết nối thực tế (25/09/2026)

- Chuyển Expo khỏi Node REST/LAN sang Supabase Auth + Data API qua HTTPS để iPhone không cần truy cập IP/cổng trên PC.
- Thêm màn hình đăng nhập/đăng ký, giữ session trên thiết bị, lưu hồ sơ thật, đổi tên và đăng xuất.
- Tạo migration 003: `profiles`, FK booking → `auth.users`, RLS theo `auth.uid()`, RPC đặt/hủy/xóa lịch của chính tài khoản; thu hồi RPC cũ nhận user ID tự khai báo.
- Sắp xếp lại scripts: `npm start` chạy Expo Tunnel động trên Metro 8080, không khởi động API cục bộ.
- Xóa nội dung demo/SQLite khỏi giao diện, chuyển theme sang navy/blue và cập nhật hướng dẫn, kiến trúc, workflow, checklist.
- Kiểm tra: TypeScript pass; 15 ca domain và 2 ca migration pass; bundle Expo Web/Android/iOS export thành công.

## Những việc cần hoàn tất trên tài khoản/thiết bị

Migration 003 đã có trong repository nhưng cần chạy trong SQL Editor của Supabase để cập nhật database từ phiên bản 002. Sau đó cần thử đăng ký/đăng nhập, xác nhận email (nếu bật), đặt/hủy/xóa lịch trên iPhone thật. Chưa đo native 60fps, quay video demo hoặc publish repository công khai.

## Ưu tiên tinh chỉnh sau bản nền

1. Chạy native và sửa vấn đề phát hiện trên thiết bị thật trước.
2. Cá nhân hóa tên/sinh viên, ảnh cơ sở thật, style và nội dung theo lớp.
3. Chuyển PNG sang WebP nếu quy trình nộp cho phép và đo FPS với production build.
4. Khi triển khai Internet, đổi Supabase PostgreSQL sang PostgreSQL, thêm HTTPS, authentication, authorization và deployment.
