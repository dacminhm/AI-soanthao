import React from 'react';

interface PrivacyPolicyProps {
  isOpen: boolean;
  onClose: () => void;
  isStandalone?: boolean;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({
  isOpen,
  onClose,
  isStandalone = false,
}) => {
  if (!isOpen && !isStandalone) return null;

  const content = (
    <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
      {/* Header Badge */}
      <div className="border-b border-slate-200 pb-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2">
          <i className="fa-solid fa-shield-halved text-emerald-600"></i>
          <span>Tuân thủ Chính sách Dữ liệu Người dùng của Google</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Chính sách Quyền riêng tư (Privacy Policy)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Hệ thống AI Hỗ trợ Soạn thảo Văn bản Hành chính theo Nghị định 30/2020/NĐ-CP • Cập nhật lần cuối: Tháng 10/2026
        </p>
      </div>

      {/* Tóm tắt cam kết */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
        <h3 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">
          <i className="fa-solid fa-circle-check text-emerald-600"></i>
          Cam kết bảo mật cốt lõi
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Trung tâm Mã số, mã vạch Quốc gia cam kết tôn trọng và bảo vệ tối đa quyền riêng tư của người dùng. Ứng dụng tuân thủ nghiêm ngặt Chính sách Dữ liệu Người dùng của Dịch vụ Google API (bao gồm các yêu cầu về <em>Limited Use</em>).
        </p>
      </div>

      {/* Mục 1 */}
      <section className="space-y-2">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-red-100 text-red-900 text-xs flex items-center justify-center font-bold">1</span>
          Mục đích thu thập & Quyền truy cập Google Drive
        </h3>
        <p>
          Ứng dụng chỉ yêu cầu quyền truy cập Google Drive có phạm vi hạn chế nhất (scope: <code className="bg-slate-100 text-red-900 px-1.5 py-0.5 rounded text-xs font-mono">https://www.googleapis.com/auth/drive.file</code>) nhằm mục đích duy nhất:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-600 pl-2 text-xs">
          <li>Tạo một thư mục chuyên dụng mang tên <strong>&quot;AI Văn Bản - Dự thảo&quot;</strong> trong Google Drive của chính tài khoản người dùng đăng nhập.</li>
          <li>Lưu trữ, sao lưu và đồng bộ các file văn bản công văn (.docx) do chính người dùng chủ động bấm lưu từ giao diện soạn thảo.</li>
          <li>Hiển thị danh sách các file văn bản trong thư mục này để người dùng có thể mở lại chỉnh sửa hoặc tải về.</li>
        </ul>
      </section>

      {/* Mục 2 */}
      <section className="space-y-2">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-red-100 text-red-900 text-xs flex items-center justify-center font-bold">2</span>
          Quyền riêng tư & Bảo mật dữ liệu người dùng
        </h3>
        <p>
          Chúng tôi thực hiện nguyên tắc <strong>Đặc quyền tối thiểu (Least Privilege)</strong>:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-600 pl-2 text-xs">
          <li><strong>Không truy cập tệp ngoài phạm vi:</strong> Hệ thống tuyệt đối <em>không đọc, không chỉnh sửa, không sao chép, không chia sẻ và không thu thập</em> bất kỳ tài liệu, hình ảnh, bảng tính hay dữ liệu cá nhân nào khác ngoài các file do chính ứng dụng tạo ra trong thư mục &quot;AI Văn Bản - Dự thảo&quot;.</li>
          <li><strong>Không bán hoặc thương mại hóa dữ liệu:</strong> Dữ liệu người dùng và nội dung công văn không bao giờ được chia sẻ với bên thứ ba hoặc sử dụng cho mục đích quảng cáo.</li>
          <li><strong>Mã hóa khi truyền tải:</strong> Mọi liên lạc giữa trình duyệt và Google API đều được mã hóa bằng chuẩn HTTPS/TLS 1.3 an toàn.</li>
          <li><strong>Không lưu Access Token cố định:</strong> OAuth Access Token chỉ được lưu tạm thời trong bộ nhớ phiên làm việc (in-memory) và bị hủy ngay khi người dùng đăng xuất.</li>
        </ul>
      </section>

      {/* Mục 3 */}
      <section className="space-y-2">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-red-100 text-red-900 text-xs flex items-center justify-center font-bold">3</span>
          Sử dụng Dữ liệu & Xử lý Trí tuệ Nhân tạo (Google Gemini AI)
        </h3>
        <p>
          Khi người dùng nhấn nút yêu cầu <em>&quot;Trợ lý AI hỗ trợ viết&quot;</em>:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-600 pl-2 text-xs">
          <li>Nội dung trích yếu, đoạn mở đầu và nội dung công văn người dùng cung cấp chỉ được xử lý tạm thời qua <strong>Google Gemini API</strong> với mục đích duy nhất là soát xét văn phong hành chính, đối chiếu quy tắc Nghị định 30/2020/NĐ-CP và gợi ý sửa lỗi logic.</li>
          <li>Nội dung này <strong>không được lưu trữ vĩnh viễn</strong> trên máy chủ trung gian và <strong>không được sử dụng để huấn luyện (train)</strong> các mô hình trí tuệ nhân tạo công cộng.</li>
        </ul>
      </section>

      {/* Mục 4 */}
      <section className="space-y-2">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-red-100 text-red-900 text-xs flex items-center justify-center font-bold">4</span>
          Quyền của người dùng & Xóa dữ liệu
        </h3>
        <p className="text-xs text-slate-600">
          Người dùng có toàn quyền kiểm soát dữ liệu của mình:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-600 pl-2 text-xs">
          <li>Bạn có thể xóa bất kỳ dự thảo nào trực tiếp từ màn hình &quot;Kho lưu trữ dự thảo&quot; của ứng dụng. Khi bạn xác nhận xóa, ứng dụng sẽ gửi yêu cầu DELETE đến Google Drive API để gỡ bỏ tệp tương ứng.</li>
          <li>Bạn có thể hủy quyền truy cập của ứng dụng bất cứ lúc nào tại trang quản lý tài khoản Google của bạn (<a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-red-800 underline">Google Account Permissions</a>).</li>
        </ul>
      </section>

      {/* Mục 5 */}
      <section className="space-y-2 border-t border-slate-200 pt-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-red-100 text-red-900 text-xs flex items-center justify-center font-bold">5</span>
          Thông tin liên hệ & Đơn vị chủ quản
        </h3>
        <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1 text-slate-600">
          <p><strong>Đơn vị:</strong> TRUNG TÂM MÃ SỐ, MÃ VẠCH QUỐC GIA (Ủy ban Tiêu chuẩn Đo lường Chất lượng Quốc gia)</p>
          <p><strong>Địa chỉ:</strong> Số 8 Hoàng Quốc Việt, Phường Nghĩa Đô, Quận Cầu Giấy, TP. Hà Nội, Việt Nam</p>
          <p><strong>Email đầu mối hỗ trợ / Phụ trách kỹ thuật:</strong> <a href="mailto:dacminhm@gmail.com" className="text-red-800 font-semibold underline">dacminhm@gmail.com</a></p>
          <p><strong>Cơ sở pháp lý văn bản:</strong> Nghị định số 30/2020/NĐ-CP ngày 05/03/2020 của Chính phủ về công tác văn thư.</p>
        </div>
      </section>
    </div>
  );

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 flex justify-center items-start">
        <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl p-6 sm:p-10 border border-slate-200">
          {content}
          <div className="mt-8 pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-red-800 hover:bg-red-900 text-white text-xs font-bold rounded-lg transition shadow-sm cursor-pointer"
            >
              Quay lại ứng dụng
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 transform transition-all animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-800 text-white flex items-center justify-center text-sm shadow-xs">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase">Chính sách Quyền riêng tư</h3>
              <p className="text-[11px] text-slate-500">Google Drive &amp; AI Privacy Policy</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition cursor-pointer"
            title="Đóng"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-7 overflow-y-auto custom-scrollbar flex-1">
          {content}
        </div>

        {/* Modal Bottom Bar */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 rounded-b-2xl text-xs">
          <span className="text-slate-500 text-[11px]">
            © 2026 Trung tâm Mã số, mã vạch Quốc gia
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg transition cursor-pointer"
          >
            Đã hiểu &amp; Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
