"""Build the current four-page Vietnamese StudySpace technical report."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
import os

ROOT = Path(__file__).resolve().parents[1]
font_dir = Path(os.environ.get('WINDIR', 'C:/Windows')) / 'Fonts'
regular = Path(os.environ.get('REPORT_FONT', str(font_dir / 'arial.ttf')))
bold = Path(os.environ.get('REPORT_FONT_BOLD', str(font_dir / 'arialbd.ttf')))
pdfmetrics.registerFont(TTFont('Report', str(regular)))
pdfmetrics.registerFont(TTFont('ReportBold', str(bold)))
pdfmetrics.registerFontFamily('Report', normal='Report', bold='ReportBold')
out = ROOT / 'docs/StudySpace-Bao-cao-ky-thuat.pdf'
c = canvas.Canvas(str(out), pagesize=(595.28, 841.89))
c.setTitle('StudySpace - Báo cáo kỹ thuật')
c.setAuthor('StudySpace project')
ink, navy, muted = '#172554', '#1E3A8A', '#475569'
body_style = ParagraphStyle('body', fontName='Report', fontSize=10.2, leading=15, textColor=HexColor(ink))
y = 0


def para(text, size=10.2, color=ink, space=9, bold=False):
    global y
    style = ParagraphStyle('p', parent=body_style, fontSize=size, leading=size * 1.42,
                           fontName='ReportBold' if bold else 'Report', textColor=HexColor(color))
    p = Paragraph(text, style)
    _, h = p.wrap(491, 750)
    if y - h < 66:
        raise RuntimeError(f'Page overflow at: {text[:60]}')
    p.drawOn(c, 52, y - h)
    y -= h + space


def page(number, title, subtitle):
    global y
    c.setFillColor(HexColor(navy)); c.rect(0, 817, 595.28, 25, fill=1, stroke=0)
    c.setFont('ReportBold', 9); c.setFillColor(HexColor(navy)); c.drawString(52, 785, 'STUDYSPACE / SUPABASE VERSION')
    c.setFont('Report', 9); c.setFillColor(HexColor(muted)); c.drawRightString(543, 785, 'EXPO + SUPABASE AUTH + POSTGRESQL')
    y = 756
    para(title, 24, bold=True, space=7)
    para(subtitle, 10, color=muted, space=20)
    c.setStrokeColor(HexColor('#BFDBFE')); c.line(52, 48, 543, 48)
    c.setFont('Report', 9); c.setFillColor(HexColor(muted)); c.drawString(52, 31, 'StudySpace • 25/09/2026'); c.drawRightString(543, 31, f'{number} / 4')


page(1, 'StudySpace', 'Ứng dụng tìm và đặt không gian học tập trên iPhone, Android và web')
para('1. Mục tiêu sản phẩm', 14, navy, bold=True)
para('StudySpace giúp người dùng tìm phòng, xem lịch trống, đặt hoặc hủy chỗ và quản lý lịch cá nhân. Ứng dụng Expo/React Native kết nối qua HTTPS đến Supabase Auth và PostgreSQL; dữ liệu được phân quyền theo tài khoản.')
para('2. Tính năng', 14, navy, bold=True)
para('• Đăng ký email/mật khẩu, xác nhận email, đăng nhập và khôi phục session.<br/>• Khám phá 24 phòng; tìm kiếm và lọc theo tòa nhà, sức chứa, tiện ích.<br/>• Chọn ngày, thời lượng và giờ còn trống.<br/>• Xem lịch, hủy đặt chỗ và xóa lịch đã hủy khỏi lịch sử.<br/>• Sửa hồ sơ, đăng xuất và đồng bộ dữ liệu tài khoản.')
para('3. Xác nhận email', 14, navy, bold=True)
para('Sau signup, app hiển thị trang chờ và cho gửi lại thư. Link trong email quay về app qua deep link; app báo xác nhận thành công, tự chuyển sang login và điền sẵn email.')
para('4. Quy tắc đặt chỗ', 14, navy, bold=True)
para('Có thể đặt trong 7 ngày tính từ hôm nay, giờ hoạt động 08:00-20:00, thời lượng 1-3 giờ. Thời gian dùng khoảng nửa mở [start,end), do đó hai lượt liền kề được phép. PostgreSQL kiểm tra lại xung đột trong transaction khi ghi.')
para('5. Trải nghiệm', 14, navy, bold=True)
para('Thiết kế sáng, rõ thứ bậc, vùng chạm lớn và trạng thái loading/error/empty. Danh sách dùng FlatList theo lô, ảnh được cache bằng expo-image, dữ liệu server dùng TanStack Query và bộ lọc được giữ bằng Zustand.', color=muted)
c.showPage()

page(2, 'Kiến trúc và database', 'Supabase cung cấp Auth, API HTTPS và PostgreSQL làm backend')
para('1. Kết nối', 14, navy, bold=True)
para('<b>iPhone / Expo Go</b> → Expo Tunnel → Metro (tải bundle).<br/><b>Ứng dụng đang chạy</b> → HTTPS → Supabase Auth + Data API → PostgreSQL.<br/>Tunnel không chuyển tiếp dữ liệu backend; iPhone không cần cùng Wi-Fi hoặc biết IP máy tính.')
para('2. Bảng dữ liệu', 14, navy, bold=True)
para('<b>auth.users:</b> email, UUID và trạng thái xác thực do Supabase quản lý.<br/><b>profiles:</b> tên hiển thị gắn với UUID Auth.<br/><b>rooms:</b> tên, tòa, sức chứa, tiện ích, ảnh và trạng thái hoạt động.<br/><b>blocked_slots:</b> lịch bận theo phòng/ngày/giờ.<br/><b>bookings:</b> chủ tài khoản, phòng, khoảng giờ, trạng thái và thời điểm hủy.')
para('3. Phân quyền', 14, navy, bold=True)
para('RLS giới hạn hồ sơ và booking theo auth.uid(). App chỉ nhận publishable key cùng JWT; không nhúng secret/service-role key. RPC lấy danh tính trực tiếp từ JWT, không nhận user ID tự khai báo từ client.')
para('4. Tính nhất quán', 14, navy, bold=True)
para('RPC create_my_booking kiểm tra ngày/giờ, khóa transaction theo ngày và phòng, rồi xét lịch bận, trùng phòng và lịch cá nhân trước khi ghi. cancel_my_booking giữ bản ghi lịch sử; delete_my_cancelled_booking chỉ xóa lịch đã hủy của người gọi.')
c.showPage()

page(3, 'Workflow hoạt động', 'Xác nhận tài khoản, đặt chỗ an toàn và quản lý dữ liệu')
para('1. Đăng ký và xác nhận email', 14, navy, bold=True)
para('Người dùng gửi email/mật khẩu → Supabase tạo tài khoản chưa xác nhận → app giữ trang chờ và cho gửi lại thư. Link email mở callback deep link; app đổi PKCE code (hoặc OTP token) lấy kết quả, xóa session tạm, hiện thành công rồi tự về login với email đã điền. Trigger database tạo hồ sơ khi tài khoản được tạo.')
para('2. Đăng nhập và phiên', 14, navy, bold=True)
para('Supabase Auth xác thực email/mật khẩu → session được lưu bằng AsyncStorage → AuthProvider bảo vệ màn hình tài khoản. Đăng xuất xóa session; cache truy vấn của tài khoản được làm sạch.')
para('3. Tìm phòng và chọn giờ', 14, navy, bold=True)
para('Chọn ngày → Expo gọi get_active_rooms và get_day_conflicts qua HTTPS → RLS/RPC trả phòng đang hoạt động cùng các khoảng bận → giao diện dựng trạng thái phòng/slot. TanStack Query cache theo ngày; kéo xuống để tải mới.')
para('4. Tạo lịch an toàn', 14, navy, bold=True)
para('Chọn phòng/giờ → create_my_booking nhận JWT → lấy auth.uid() → xác thực ngày và thời lượng → khóa transaction → kiểm tra xung đột lần cuối → ghi booking → trả phiếu → làm mới lịch và availability. Nếu hai thiết bị cùng chọn giờ, chỉ một giao dịch có thể hoàn tất.')
para('5. Hủy và xóa', 14, navy, bold=True)
para('Hủy cần xác nhận; booking chuyển trạng thái cancelled và vẫn hiện trong lịch sử. Xóa lịch sử cần xác nhận riêng và chỉ áp dụng bản ghi đã hủy thuộc người dùng. Mutation chỉ báo thành công khi database đã commit.')
para('6. Mất mạng', 14, navy, bold=True)
para('Truy vấn hiển thị lỗi và có thể thử lại. Dữ liệu cũ trong cache không được xem là giao dịch đã hoàn tất. Lỗi Metro/Expo Tunnel tách biệt với lỗi HTTPS tới Supabase.', color=muted)
c.showPage()

page(4, 'Cài đặt và kiểm chứng', 'Cấu hình Supabase, mở trên iPhone và trạng thái kiểm thử')
para('1. Cài database', 14, navy, bold=True)
para('Trong Supabase SQL Editor, chạy migrations theo thứ tự cần thiết. Với project đã chạy 001 và 002, chạy 003 để tạo profiles, gắn booking với auth.users, bật RLS và thay RPC bằng thao tác theo tài khoản. Kiểm tra bảng và policies trong Dashboard.')
para('2. Cấu hình Expo', 14, navy, bold=True)
para('Trong .env đặt EXPO_PUBLIC_SUPABASE_URL và EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY; không đặt secret/service-role key trong app. Chạy npm install rồi npm start và quét QR tunnel bằng Expo Go. Tunnel link thay đổi theo phiên; dữ liệu app gọi Supabase HTTPS, không dùng IP máy tính cố định.')
para('3. Cho phép email redirect', 14, navy, bold=True)
para('Trong Authentication → URL Configuration → Redirect URLs thêm studyspace://auth/callback và exp://**/--/auth/callback. Scheme đầu dùng cho build riêng; mẫu exp:// hỗ trợ host Expo Go động. Wildcard chỉ dành cho phát triển; production nên dùng link ổn định, chính xác và domain/app link riêng.')
para('4. Kiểm chứng mã nguồn', 14, navy, bold=True)
para('TypeScript strict: pass. Kiểm thử domain: 15/15 pass. Kiểm thử tĩnh Auth/RLS: 2/2 pass. Expo export bundle iOS/Android: thành công. Luồng email và tài khoản cần kiểm tra thực tế trên iPhone với migration 003, redirect allow-list và email settings đã cấu hình.')
para('5. Tài liệu', 14, navy, bold=True)
para('README.md giới thiệu hệ thống. docs/02 hướng dẫn từng bước; docs/03 mô tả kiến trúc; docs/04 trình bày workflow; docs/06 có checklist kiểm thử; docs/07 hướng dẫn Supabase, email redirect và xử lý kết nối.')
para('Project: D:\\HocCODE\\StudySpace. Expo Tunnel chỉ tải bundle; backend và database chạy trên Supabase qua HTTPS.', color=muted)
c.save()
print(out)
