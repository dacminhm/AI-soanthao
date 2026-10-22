# Chính Sách Bảo Mật (Security Policy)

Dự án **AI Hỗ trợ Soạn thảo Văn bản Hành chính** cam kết tuân thủ các tiêu chuẩn cao nhất về an toàn thông tin, bảo mật dữ liệu hành chính và quyền riêng tư của người dùng.

---

## 1. Phiên Bản Được Hỗ Trợ (Supported Versions)

Chúng tôi chủ động phát hành các bản vá bảo mật cho các phiên bản đang được duy trì:

| Phiên bản | Hỗ trợ bảo mật |
| :--- | :--- |
| `v1.x` (Hiện tại) | :white_check_mark: Được hỗ trợ |
| `< 1.0` | :x: Ngừng hỗ trợ |

---

## 2. Cam Kết Quyền Riêng Tư & An Toàn Dữ Liệu (Data Privacy & Scopes)

### Quyền truy cập Google Drive (`drive.file`)
- Ứng dụng chỉ yêu cầu phạm vi quyền tối thiểu `https://www.googleapis.com/auth/drive.file`.
- Hệ thống **chỉ có quyền đọc, ghi và quản lý các tệp do chính ứng dụng tạo ra** trong thư mục `AI Văn Bản - Dự thảo` trên tài khoản Google Drive của người dùng.
- Ứng dụng **tuyệt đối không đọc, truy cập, sao chép hoặc chỉnh sửa** bất kỳ tệp tin, hình ảnh hay thư mục cá nhân nào khác của người dùng.

### Xử lý Dữ liệu với Google Gemini AI
- Nội dung dự thảo văn bản chỉ được truyền tải tạm thời qua kênh mã hóa HTTPS/TLS tới máy chủ xử lý của Google Gemini API nhằm mục đích chuẩn hóa văn phong hành chính.
- Dữ liệu soạn thảo không được lưu trữ vĩnh viễn trên máy chủ trung gian và không được sử dụng để tái huấn luyện các mô hình AI công cộng mà không có sự đồng thuận.

### Bảo mật Khóa API & Thông tin xác thực
- Mọi khóa bí mật (`GEMINI_API_KEY`, OAuth Client Secrets) được quản lý nghiêm ngặt qua biến môi trường (`.env`), không bao giờ được đưa vào mã nguồn công khai (Git commit).
- Phiên làm việc (OAuth Access Token) chỉ được lưu tạm thời trên phiên trình duyệt của người dùng (`sessionStorage`) và tự động giải phóng khi đăng xuất.

---

## 3. Báo Cáo Lỗ Hổng Bảo Mật (Reporting a Vulnerability)

Nếu bạn phát hiện bất kỳ vấn đề bảo mật hoặc rủi ro an toàn thông tin nào liên quan đến ứng dụng:

1. **Vui lòng KHÔNG công khai lỗ hổng** trên mục GitHub Issues công cộng.
2. Hãy gửi thông tin chi tiết qua email riêng của Quản trị viên dự án:
   - **Email tiếp nhận:** `dacminhm@gmail.com`
   - **Tiêu đề email:** `[SECURITY] Báo cáo lỗ hổng - AI Soạn thảo văn bản`
3. Nội dung báo cáo nên bao gồm:
   - Mô tả chi tiết về lỗ hổng và rủi ro tiềm ẩn.
   - Các bước tái hiện lỗi (Proof of Concept - PoC) hoặc mã kiểm thử.
   - Môi trường phát hiện (Trình duyệt, Hệ điều hành, Phiên bản ứng dụng).

---

## 4. Quy Trình Xử Lý Của Chúng Tôi

- **Phản hồi xác nhận:** Trong vòng 24 - 48 giờ kể từ khi nhận được email báo cáo.
- **Đánh giá & Khắc phục:** Chúng tôi sẽ tiến hành kiểm tra, phân loại mức độ nghiêm trọng và phát hành bản vá sửa lỗi sớm nhất có thể.
- **Công bố an toàn:** Sau khi lỗ hổng đã được khắc phục hoàn toàn trên nhánh chính, thông tin chi tiết sẽ được ghi nhận và cảm ơn trong bản ghi chú phát hành (Release Notes).
