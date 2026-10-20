import React, { useState } from 'react';
import { requestDriveAccessTokenDirect, DrivePermissionError } from '../services/driveService.ts';

interface DrivePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGranted: (token: string) => void;
  has403Error?: boolean;
  actionReason?: string;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

export const DrivePermissionModal: React.FC<DrivePermissionModalProps> = ({
  isOpen,
  onClose,
  onGranted,
  has403Error = false,
  actionReason = 'Cần cấp quyền truy cập Google Drive để lưu văn bản',
  onOpenPrivacy,
  onOpenTerms,
}) => {
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // LƯU Ý BẮT BUỘC: Hàm requestDriveAccessTokenDirect PHẢI ĐƯỢC GỌI TRỰC TIẾP
  // TRONG SỰ KIỆN CLICK CHUỘT (onClick) CỦA NÚT NÀY (Direct User Gesture)
  // Không được bọc sau bất kỳ lệnh await hoặc Promise không đồng bộ nào
  // để tránh bị trình duyệt chặn cửa sổ popup google.accounts.oauth2.
  const handleDirectConnect = () => {
    setIsRequesting(true);
    setErrorMessage(null);

    requestDriveAccessTokenDirect({
      prompt: 'consent', // Yêu cầu hiển thị rõ màn hình xin quyền scope drive.file
      onSuccess: (token) => {
        setIsRequesting(false);
        onGranted(token);
        onClose();
      },
      onError: (err) => {
        setIsRequesting(false);
        const msg = err.message || 'Không thể cấp quyền truy cập Google Drive.';
        setErrorMessage(msg);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-800 to-red-950 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-inner">
              <i className="fa-brands fa-google-drive text-2xl text-amber-300"></i>
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Cấp quyền Google Drive</h3>
              <p className="text-[11px] text-red-200 font-medium">Trung tâm Mã số, mã vạch Quốc gia</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-red-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Đóng"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-slate-700">
          {has403Error && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2.5">
              <i className="fa-solid fa-triangle-exclamation text-amber-600 text-sm mt-0.5 shrink-0"></i>
              <div className="space-y-1">
                <span className="font-bold">Lỗi phân quyền 403 Forbidden:</span>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Tài khoản Google chưa cấp quyền ghi tệp (scope <code className="bg-amber-100 px-1 rounded font-mono">drive.file</code>) hoặc token phiên làm việc đã hết hạn. Vui lòng bấm nút bên dưới để cấp quyền mới.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <i className="fa-solid fa-cloud-arrow-up text-red-800 text-xs"></i>
              <span>{actionReason}</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ứng dụng chỉ yêu cầu quyền tối thiểu (<strong>scope: drive.file</strong>) nhằm:
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside pl-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <li>Tạo và quản lý thư mục <code className="text-red-900 font-semibold bg-red-50 px-1 rounded">AI Văn Bản - Dự thảo</code>.</li>
              <li>Lưu trữ các tệp công văn dự thảo <code className="font-semibold">.docx</code> do chính bạn tạo.</li>
              <li>Tuyệt đối <strong>không truy cập hay chỉnh sửa</strong> bất kỳ tệp dữ liệu cá nhân nào khác của bạn.</li>
            </ul>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center space-x-2 animate-in fade-in">
              <i className="fa-solid fa-circle-exclamation text-red-600 shrink-0"></i>
              <span className="text-[11px] font-medium">{errorMessage}</span>
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-center space-x-2">
            <i className="fa-solid fa-circle-info text-blue-600 shrink-0"></i>
            <span>
              Để tránh trình duyệt chặn cửa sổ xác thực pop-up, vui lòng bấm trực tiếp nút bên dưới.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-[10px] text-slate-400">
            {onOpenPrivacy && (
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="hover:text-red-800 underline transition cursor-pointer"
              >
                Quyền riêng tư
              </button>
            )}
            {onOpenTerms && (
              <>
                <span>•</span>
                <button
                  type="button"
                  onClick={onOpenTerms}
                  className="hover:text-red-800 underline transition cursor-pointer"
                >
                  Điều khoản
                </button>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isRequesting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Để sau
            </button>
            <button
              type="button"
              onClick={handleDirectConnect}
              disabled={isRequesting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-red-800 hover:bg-red-900 active:scale-95 rounded-xl shadow-md hover:shadow-lg transition flex items-center space-x-2 cursor-pointer disabled:opacity-60"
            >
              {isRequesting ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin text-xs"></i>
                  <span>Đang kết nối...</span>
                </>
              ) : (
                <>
                  <i className="fa-brands fa-google-drive text-amber-300 text-sm"></i>
                  <span>Kết nối Google Drive</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
