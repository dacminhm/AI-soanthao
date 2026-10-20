import React from 'react';

interface TermsOfServiceProps {
  isOpen: boolean;
  onClose: () => void;
  isStandalone?: boolean;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({
  isOpen,
  onClose,
  isStandalone = false,
}) => {
  if (!isOpen && !isStandalone) return null;

  const content = (
    <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
      {/* Header Badge */}
      <div className="border-b border-slate-200 pb-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-semibold mb-2">
          <i className="fa-solid fa-scale-balanced text-blue-600"></i>
          <span>Quy chế Sử dụng Hệ thống Hành chính</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Điều khoản Dịch vụ (Terms of Service)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Hệ thống AI Hỗ trợ Soạn thảo Văn bản Hành chính theo Nghị định 30/2020/NĐ-CP • Cập nhật lần cuối: Tháng 10/2026
        </p>
      </div>

      {/* Tóm tắt điều khoản */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
        <h3 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">
          <i className="fa-solid fa-file-contract text-red-800"></i>
          Phạm vi &amp; Mục đích áp dụng
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Điều khoản này quy định việc sử dụng công cụ hỗ trợ soạn thảo, thẩm định, soát xét và xuất bản văn bản hành chính theo quy chuẩn Nghị định số 30/2020/NĐ-CP của Chính phủ cho cán bộ, chuyên viên thuộc Trung tâm Mã số, mã vạch Quốc gia và các đơn vị phối hợp.
        </p>
      </div>

      {/* Điều 1 */}
      <section className="space-y-2">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-red-100 text-red-900 text-xs flex items-center justify-center font-bold">1</span>
          Quy chuẩn Thể thức bắt buộc (Nghị định 30/2020/NĐ-CP)
        </h3>
        <p>
          Hệ thống được thiết kế cố định các thông số thể thức chuẩn nhằm đảm bảo tính pháp lý và tính đồng bộ:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-600 pl-2 text-xs">
          <li><strong>Khổ giấy &amp; Căn lề:</strong> Khổ giấy A4 (210 x 297 mm), lề trên 20 mm, lề dưới 20 mm, lề trái 30 mm, lề phải 15 mm.</li>
          <li><strong>Phông chữ &amp; Cỡ chữ:</strong> Bắt buộc dùng phông chữ tiếng Việt Times New Roman (bộ mã Unicode TCVN 6909:2001). Cỡ chữ và kiểu chữ (đậm, nghiêng, đứng) áp dụng theo đúng Phụ lục I Nghị định 30.</li>
          <li><strong>Khóa trường thể thức đầu văn bản:</strong> Các trường Quốc hiệu, Tiêu ngữ, Tên cơ quan chủ quản, Đơn vị ban hành và Ký hiệu văn bản được khóa mặc định để phòng tránh sai sót nghiệp vụ. Việc mở khóa chỉnh sửa chỉ dành cho mục đích xử lý văn bản đặc thù có thẩm quyền.</li>
        </ul>
      </section>

      {/* Điều 2 */}
      <section className="space-y-2">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-red-100 text-red-900 text-xs flex items-center justify-center font-bold">2</span>
          Trách nhiệm của Người dùng &amp; Người ký duyệt
        </h3>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <i className="fa-solid fa-triangle-exclamation text-amber-700"></i>
            Lưu ý quan trọng về trách nhiệm nội dung:
          </p>
          <p>
            Người dùng chịu trách nhiệm kiểm tra toàn diện tính chính xác của các số hiệu, trích dẫn văn bản quy phạm pháp luật, căn cứ thẩm quyền, thời hạn xử lý và số liệu chuyên môn trước khi trình ký hoặc ký ban hành chính thức.
          </p>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-600 pl-2 text-xs">
          <li>Công cụ AI và tính năng soát xét tự động chỉ đóng vai trò hỗ trợ tham khảo và phát hiện lỗi sơ bộ. Trợ lý AI không thay thế được thẩm định pháp lý và ý kiến chỉ đạo của lãnh đạo cơ quan.</li>
          <li>Không sử dụng hệ thống để soạn thảo, tải lên hoặc lưu trữ các thông tin thuộc danh mục <strong>bí mật nhà nước</strong> chưa được phép giải mật theo quy định của pháp luật bảo vệ bí mật nhà nước.</li>
        </ul>
      </section>

      {/* Điều 3 */}
      <section className="space-y-2">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-red-100 text-red-900 text-xs flex items-center justify-center font-bold">3</span>
          Tích hợp Dịch vụ Google Drive &amp; Bản quyền Tệp tin
        </h3>
        <p>
          Hệ thống cung cấp kết nối trực tiếp đến Google Drive của người dùng:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-600 pl-2 text-xs">
          <li>Mọi tệp tin lưu trữ trong thư mục &quot;AI Văn Bản - Dự thảo&quot; trên Google Drive thuộc quyền sở hữu toàn diện của chủ tài khoản Google đó.</li>
          <li>Người dùng có quyền chia sẻ, cấp quyền đọc/ghi hoặc xóa tệp trên Google Drive theo chính sách của tổ chức mình.</li>
          <li>Trung tâm Mã số, mã vạch Quốc gia không chịu trách nhiệm đối với trường hợp mất mát dữ liệu phát sinh từ việc người dùng tự xóa tệp trên Google Drive hoặc chia sẻ quyền cho tài khoản không an toàn.</li>
        </ul>
      </section>

      {/* Điều 4 */}
      <section className="space-y-2">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-red-100 text-red-900 text-xs flex items-center justify-center font-bold">4</span>
          Thay đổi &amp; Cập nhật Điều khoản
        </h3>
        <p className="text-xs text-slate-600">
          Điều khoản có thể được cập nhật định kỳ để phù hợp với các sửa đổi, bổ sung của Nghị định 30/2020/NĐ-CP hoặc các quy định quản lý của Ủy ban Tiêu chuẩn Đo lường Chất lượng Quốc gia. Bản cập nhật sẽ được công bố công khai tại trang này.
        </p>
      </section>

      {/* Điều 5 */}
      <section className="space-y-2 border-t border-slate-200 pt-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-red-100 text-red-900 text-xs flex items-center justify-center font-bold">5</span>
          Thông tin liên hệ &amp; Hỗ trợ nghiệp vụ
        </h3>
        <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1 text-slate-600">
          <p><strong>Cơ quan:</strong> TRUNG TÂM MÃ SỐ, MÃ VẠCH QUỐC GIA</p>
          <p><strong>Email tiếp nhận góp ý / Báo cáo sự cố:</strong> <a href="mailto:dacminhm@gmail.com" className="text-red-800 font-semibold underline">dacminhm@gmail.com</a></p>
          <p><strong>Hotline kỹ thuật:</strong> (+84) 24 3756 4269</p>
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
            <div className="w-8 h-8 rounded-lg bg-blue-800 text-white flex items-center justify-center text-sm shadow-xs">
              <i className="fa-solid fa-scale-balanced"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase">Điều khoản Dịch vụ</h3>
              <p className="text-[11px] text-slate-500">Decree 30/2020/NĐ-CP Administrative Terms</p>
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
