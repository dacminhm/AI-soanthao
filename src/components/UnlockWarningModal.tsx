import React from 'react';

interface UnlockWarningModalProps {
  isOpen: boolean;
  fieldName: string;
  fieldLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const UnlockWarningModal: React.FC<UnlockWarningModalProps> = ({
  isOpen,
  fieldLabel,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 transform transition-all animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close [X] button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition"
          title="Đóng hộp thoại"
        >
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>

        {/* Warning Icon */}
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 text-2xl border border-amber-200 shadow-2xs">
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>

        {/* Modal Title */}
        <h3 className="text-base sm:text-lg font-bold text-gray-900 text-center tracking-tight">
          Xác nhận mở khóa thông tin chuẩn
        </h3>

        {/* Description */}
        <div className="mt-3 text-center space-y-2">
          <p className="text-xs text-gray-600 leading-relaxed">
            Vùng thông tin này đã được thiết lập cố định theo quy chuẩn thể thức của đơn vị{' '}
            <strong className="text-gray-800">(Trung tâm Mã số, mã vạch Quốc gia)</strong>.
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">
            Việc thay đổi trường <strong className="text-amber-900 font-semibold">{fieldLabel}</strong> có thể làm sai lệch thể thức hành chính chuẩn hoặc ảnh hưởng đến quy cách ký duyệt.
          </p>
          <p className="text-xs font-bold text-gray-900 pt-1">
            Bạn có chắc chắn muốn mở khóa để chỉnh sửa?
          </p>
        </div>

        {/* Note Box */}
        <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-left flex items-start space-x-2 text-[11px] text-amber-900">
          <i className="fa-solid fa-lightbulb text-amber-600 mt-0.5 shrink-0"></i>
          <span>
            <strong>Lưu ý:</strong> Mọi chỉnh sửa tại mục này sẽ chỉ áp dụng cho văn bản hiện tại và không làm thay đổi mẫu gốc của hệ thống.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 py-2.5 px-4 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none transition shadow-2xs"
          >
            Giữ nguyên (Hủy)
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-1/2 py-2.5 px-4 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg focus:outline-none transition flex items-center justify-center space-x-1.5"
          >
            <i className="fa-solid fa-lock-open text-xs"></i>
            <span>Tôi hiểu, cho phép sửa</span>
          </button>
        </div>
      </div>
    </div>
  );
};
