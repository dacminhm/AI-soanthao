# AI Hỗ Trợ Soạn Thảo Văn Bản Hành Chính (Chuẩn Nghị định 30/2020/NĐ-CP)

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC.svg)](https://tailwindcss.com/)
[![Gemini API](https://img.shields.io/badge/Google_Gemini-1.5_Flash-orange.svg)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Hệ thống web trợ lý ảo thông minh hỗ trợ cán bộ, công chức, viên chức soạn thảo, thẩm định thể thức và chuẩn hóa văn bản hành chính nhà nước theo quy định tại Nghị định số 30/2020/NĐ-CP của Chính phủ.**

---

## 📌 Tổng Quan Dự Án

Việc soạn thảo văn bản quản lý nhà nước thường tốn nhiều thời gian căn chỉnh lề phôi in, soát xét từ ngữ công vụ và tra cứu căn cứ pháp lý. Dự án được xây dựng nhằm mục đích:
- Tự động hóa thể thức trình bày văn bản hành chính theo đúng quy cách của **Nghị định 30/2020/NĐ-CP**.
- Tận dụng sức mạnh của **Google Gemini AI** để đóng vai trò chuyên viên tổng hợp: chuẩn hóa văn phong công vụ, phân tích logic, bổ sung các ý còn thiếu và đề xuất căn cứ quy phạm pháp luật phù hợp.
- Tích hợp mô hình lưu trữ an toàn **User-Owned Storage**: Mọi dự thảo lưu trực tiếp vào tài khoản **Google Drive cá nhân** của người dùng, không lưu trữ dữ liệu nhạy cảm trên máy chủ trung gian.
- Xem trước thời gian thực (Live Preview) mô phỏng tờ giấy in A4 chuẩn tỷ lệ milimet và xuất file `.docx` mở chuẩn xác trên Microsoft Word.

---

## ✨ Tính Năng Nổi Bật

### 1. Xem Trước Thời Gian Thực (Live Preview A4)
- Giả lập khổ giấy A4 tỷ lệ chuẩn ($210\text{ mm} \times 297\text{ mm}$), phông chữ Unicode `Times New Roman`.
- Quy chuẩn căn lề in ấn theo Nghị định 30:
  - Lề trên: $20\text{ mm}$
  - Lề dưới: $20\text{ mm}$
  - Lề trái: $30\text{ mm}$
  - Lề phải: $15\text{ mm}$
- Header 2 cột cân đối: Quốc hiệu trên 1 dòng duy nhất, Tên cơ quan chủ quản / cơ quan ban hành, số ký hiệu và trích yếu bố trí liền mạch không thừa khoảng trắng.
- Thụt lề đầu dòng chuẩn $1.27\text{ cm}$ (0.5 inch), căn đều hai bên (Justify).

### 2. Trợ Lý AI Chuyên Sâu (Powered by Google Gemini)
- **Hộp điều khiển AI linh hoạt**: Tiếp nhận yêu cầu mở rộng, trau chuốt hoặc gọt giũa câu từ theo chỉ thị tùy biến của người dùng.
- **Tự động thẩm định thể thức**: Loại bỏ hoàn toàn khẩu ngữ, văn nói, đưa về văn phong công vụ trang trọng, khúc chiết.
- **Bổ sung ý logic & Căn cứ**: Phân tích bối cảnh tại *Đoạn mở đầu* để tự động phát hiện các nội dung còn thiếu (thời hạn, đơn vị phối hợp, kiến nghị) và gợi ý danh sách Luật, Nghị định, Thông tư viện dẫn.
- **Kiểm tra đầu vào (Validation)**: Chặn dữ liệu rỗng và nhắc nhở người dùng nhập ý chính trước khi gửi API.

### 3. Bảo Vệ Dữ Liệu Chuẩn & Khóa Mẫu Biểu
- Các trường định danh đơn vị (Tên cơ quan, Ký hiệu `.../MSMV-KHTC`, Nơi nhận mặc định, Chức danh ký) được khóa bảo vệ theo cấu hình chuẩn.
- Modal cảnh báo xác nhận khi người dùng chủ động mở khóa chỉnh sửa các vùng thông tin cố định.

### 4. Đồng Bộ Đám Mây Cá Nhân (Google Drive Integration)
- Đăng nhập xác thực thông qua **Google Identity Services (OAuth 2.0)**.
- Phân quyền theo quyền hạn: Quyền riêng tư cấp `https://www.googleapis.com/auth/drive.file` chỉ quản lý các tài liệu do ứng dụng tạo ra.
- Tự động tạo thư mục `/AI Văn Bản - Dự thảo` trên Google Drive của người dùng và lưu trữ tệp tin kèm liên kết mở trực tiếp.
- Phân quyền Quản trị viên (Admin) cho tài khoản phụ trách cấu hình mẫu biểu.

### 5. Xuất File Chuẩn In Ấn
- Tạo và xuất file Microsoft Word (`.docx`) tương thích 100% với Office Word và Google Docs.

---

## 🛠 Công Nghệ Sử Dụng

| Tầng | Công nghệ | Chi tiết |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Tailwind CSS | Giao diện Single Page Application, chia cột responsive, typography chuẩn hành chính |
| **Backend / API** | Node.js, Express / Fetch REST API | Xử lý middleware, định tuyến và kết nối dịch vụ ngoài an toàn |
| **Trí tuệ nhân tạo** | Google Gemini API (1.5 Flash) | Xử lý ngôn ngữ tự nhiên, phân tích thể thức qua Structured Output |
| **Xác thực & Lưu trữ** | Google Identity Services, Google Drive REST API v3 | Đăng nhập một chạm, phân quyền và lưu trữ tệp tin trên Drive cá nhân |
| **Xử lý tài liệu** | docx.js, file-saver | Đóng gói và kết xuất tệp Microsoft Word trực tiếp từ trình duyệt |

---

## 🚀 Cài Đặt & Khởi Chạy

### 1. Yêu cầu hệ thống
- [Node.js](https://nodejs.org/) phiên bản 18.x trở lên.
- Quản lý gói: `npm` hoặc `pnpm` / `yarn`.
- [Google Cloud Project](https://console.cloud.google.com/) đã kích hoạt Google Drive API và có OAuth 2.0 Client ID.
- [Google AI Studio](https://aistudio.google.com/) API Key.

### 2. Cài đặt mã nguồn

```bash
# 1. Clone repository về máy
git clone https://github.com/dacminhm/ai-soan-thao-van-ban.git

# 2. Di chuyển vào thư mục dự án
cd ai-soan-thao-van-ban

# 3. Cài đặt các gói phụ thuộc
npm install
```

### 3. Cấu hình biến môi trường

Tạo tệp `.env` tại thư mục gốc của dự án và khai báo các khóa bí mật:

```env
# Google Gemini API Key (lấy từ Google AI Studio)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Google OAuth 2.0 Client ID (dành cho Web Application)
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com

# Email quản trị viên hệ thống
VITE_ADMIN_EMAIL=dacminhm@gmail.com
```

> **Lưu ý bảo mật:** Tệp `.env` đã được cấu hình trong `.gitignore`. Tuyệt đối không commit tệp này lên các kho mã nguồn công khai.

### 4. Khởi chạy môi trường phát triển

```bash
# Khởi chạy ứng dụng (Vite Dev Server)
npm run dev
```

Mở trình duyệt và truy cập: `http://localhost:5173` (hoặc cổng hiển thị trên terminal).

---

## 📂 Cấu Trúc Thư Mục

```text
ai-soan-thao-van-ban/
├── public/                     # Tài nguyên tĩnh, favicon, logo
├── src/
│   ├── components/             # Các component giao diện React
│   │   ├── A4Preview.tsx       # Khung xem trước A4 Live Preview chuẩn NĐ 30
│   │   ├── EditorAccordion.tsx # Bộ nhập liệu 3 khối & thanh công cụ AI
│   │   ├── GoogleAuthModal.tsx # Hộp thoại đăng nhập Google & phân quyền
│   │   ├── Header.tsx          # Thanh điều hướng, thông tin tài khoản & stepper
│   │   ├── DriveArchiveView.tsx# Giao diện Kho dự thảo đồng bộ Google Drive
│   │   └── UnlockWarningModal.tsx # Pop-up cảnh báo mở khóa dữ liệu chuẩn
│   ├── services/
│   │   ├── aiService.ts        # Tương tác với Google Gemini API
│   │   └── driveService.ts     # Gọi Google Drive REST API v3
│   ├── utils/
│   │   ├── decree30Rules.ts    # Bộ quy tắc kiểm tra thể thức Nghị định 30
│   │   └── docxExport.ts       # Logic đóng gói và xuất file Word .docx
│   ├── data/
│   │   └── initialTemplates.ts # Dữ liệu mẫu công văn mặc định
│   ├── App.tsx                 # Điều phối state và luồng xử lý chính
│   ├── main.tsx                # Điểm khởi chạy React
│   └── index.css               # Cấu hình phông chữ Times New Roman và Tailwind
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 📋 Quy Chuẩn Định Dạng Văn Bản (Nghị định 30/2020/NĐ-CP)

Dự án áp dụng chặt chẽ các thông số kỹ thuật trình bày văn bản hành chính:

| Thành phần thể thức | Phông chữ | Cỡ chữ | Kiểu chữ | Vị trí / Quy cách |
| :--- | :--- | :--- | :--- | :--- |
| **Quốc hiệu** | Times New Roman | 12 - 13pt | In hoa, đứng, đậm | Căn giữa, dòng 1 phía trên bên phải |
| **Tiêu ngữ** | Times New Roman | 13 - 14pt | Chữ thường, đứng, đậm | Dưới Quốc hiệu, có đường kẻ ngang bằng độ dài chữ |
| **Tên cơ quan ban hành** | Times New Roman | 12 - 13pt | In hoa, đứng, đậm | Căn giữa cột trái, có đường kẻ ngang phía dưới |
| **Số, ký hiệu** | Times New Roman | 13pt | Đứng, không đậm | Đặt sát bên dưới tên cơ quan ban hành |
| **Trích yếu nội dung** | Times New Roman | 12pt | Đứng, không đậm | Đặt sát bên dưới số ký hiệu văn bản |
| **Địa danh, thời gian** | Times New Roman | 13 - 14pt | Nghiêng | Căn giữa dưới Tiêu ngữ |
| **Nội dung văn bản** | Times New Roman | 13 - 14pt | Đứng | Căn đều 2 lề, thụt lề đầu dòng $1.27\text{ cm}$ |
| **Chức vụ người ký** | Times New Roman | 13 - 14pt | In hoa, đứng, đậm | Căn giữa cột chữ ký phía dưới bên phải |
| **Họ và tên người ký** | Times New Roman | 13 - 14pt | Chữ thường, đứng, đậm | Căn giữa bên dưới chức vụ |
| **Nơi nhận** | Times New Roman | 11 - 12pt | Tiêu đề nghiêng đậm, mục chữ đứng | Đặt ở góc dưới bên trái |

---

## 🤝 Đóng Góp Phát Triển (Contributing)

Mọi đóng góp, báo cáo lỗi hoặc đề xuất tính năng mới luôn được hoan nghênh:
1. Fork dự án trên GitHub.
2. Tạo nhánh tính năng mới (`git checkout -b feature/TinhNangMoi`).
3. Commit các thay đổi (`git commit -m 'Thêm tính năng mới'`).
4. Push lên nhánh của bạn (`git push origin feature/TinhNangMoi`).
5. Tạo một **Pull Request** trên GitHub.

---

## 📄 Giấy Phép (License)

Dự án được phân phối dưới giấy phép **MIT License**. Chi tiết xem tại tệp [LICENSE](LICENSE).

---

## 📬 Liên Hệ Hỗ Trợ

- **Phụ trách dự án**: Nguyễn Đắc Minh
- **Email**: [dacminhm@gmail.com](mailto:dacminhm@gmail.com)
- **Đơn vị công tác**: Trung tâm Mã số, mã vạch Quốc gia - Ủy ban Tiêu chuẩn Đo lường Chất lượng Quốc gia