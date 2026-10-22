import React, { useState, useRef, useEffect } from 'react';
import { AuthUser } from './GoogleAuthModal.tsx';

interface HeaderProps {
  currentTab: 'editor' | 'archive';
  setCurrentTab: (tab: 'editor' | 'archive') => void;
  currentUser: AuthUser | null;
  onOpenAdminModal: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  activeStep?: 1 | 2 | 3;
  onSelectStep?: (step: 1 | 2 | 3) => void;
  onSaveToDrive?: () => void;
  onExportDocx?: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onOpenAdminModal,
  onOpenAuthModal,
  onLogout,
  activeStep = 2,
  onSelectStep,
  onSaveToDrive,
  onExportDocx,
  onOpenPrivacy,
  onOpenTerms,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 z-30 shrink-0 select-none shadow-xs">
      {/* ======================================================== */}
      {/* HÀNG 1: TOP BAR (Brand - Switcher - Profile & Admin CTA) */}
      {/* ======================================================== */}
      <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between gap-4 border-b border-gray-100">
        {/* Left: Brand, Decree Badge & Lock Indicator */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-400 shadow-sm shrink-0">
            <i className="fa-solid fa-file-shield text-base text-amber-400"></i>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-gray-900 text-sm sm:text-base leading-tight tracking-tight">
                AI hỗ trợ soạn thảo văn bản
              </span>
              <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                Nghị định 30/2020/NĐ-CP
              </span>
            </div>
            <span className="text-[11px] text-gray-500 font-medium hidden 2xl:inline-block">
              Chuẩn hoá văn bản hành chính nhà nước • Trung tâm MSMV
            </span>
          </div>

          <div className="hidden lg:flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg ml-1">
            <span className="text-[11px] text-slate-500 font-medium">Loại hình:</span>
            <span className="inline-flex items-center text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              <i className="fa-solid fa-lock text-[9px] mr-1 text-amber-700"></i> CỐ ĐỊNH: CÔNG VĂN
            </span>
          </div>
        </div>

        {/* Center: Tabs Switcher (Kho dự thảo Drive chỉ hiển thị khi đã đăng nhập) */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setCurrentTab('editor')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
              currentTab === 'editor'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fa-solid fa-pen-nib text-[10px]"></i>
            <span>Soạn thảo</span>
          </button>
          {currentUser && (
            <button
              type="button"
              onClick={() => setCurrentTab('archive')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                currentTab === 'archive'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <i className="fa-solid fa-folder-open text-[10px]"></i>
              <span>Kho dự thảo Drive</span>
            </button>
          )}
        </div>

        {/* Right: Auth Profile / Login Button & Admin CTA */}
        <div className="flex items-center space-x-2.5 shrink-0">
          {currentUser ? (
            /* Logged in state: Profile Pill with Dropdown Menu */
            <div className="relative" ref={dropdownRef}>
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 pl-2 pr-2.5 py-1.5 rounded-full shadow-2xs transition cursor-pointer shrink-0 select-none"
                title="Nhấn để mở menu tài khoản"
              >
                {currentUser.picture ? (
                  <img
                    src={currentUser.picture}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-slate-300 shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-amber-400 font-bold text-xs flex items-center justify-center ring-2 ring-slate-300 shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-gray-800 leading-tight">
                      {currentUser.name}
                    </span>
                    {currentUser.isAdmin && (
                      <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider whitespace-nowrap">
                        Admin
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 leading-tight font-medium truncate max-w-[120px]">
                    {currentUser.email}
                  </span>
                </div>
                <i className={`fa-solid fa-chevron-down text-[10px] text-gray-400 ml-1 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
              </div>

              {/* Account Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Account Summary */}
                  <div className="px-4 py-2.5 border-b border-gray-100 bg-slate-50/50 flex items-center gap-3">
                    {currentUser.picture ? (
                      <img
                        src={currentUser.picture}
                        alt={currentUser.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-300 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 font-bold text-sm flex items-center justify-center ring-2 ring-slate-300 shrink-0">
                        {currentUser.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-gray-500 font-mono truncate">{currentUser.email}</p>
                      <div className="mt-1 flex items-center space-x-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            currentUser.isAdmin
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-300'
                          }`}
                        >
                          {currentUser.isAdmin ? 'Quản trị viên (Admin)' : 'Chuyên viên thường'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick navigation */}
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentTab('archive');
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-xs text-left text-gray-700 hover:bg-slate-50 flex items-center space-x-2 transition cursor-pointer"
                    >
                      <i className="fa-regular fa-folder text-slate-400 w-4"></i>
                      <span>📁 Kho dự thảo của tôi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onOpenAuthModal();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-xs text-left text-gray-700 hover:bg-slate-50 flex items-center space-x-2 transition cursor-pointer"
                    >
                      <i className="fa-brands fa-google text-slate-400 w-4"></i>
                      <span>Tài khoản Google &amp; Đăng xuất</span>
                    </button>

                    {onOpenPrivacy && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenPrivacy();
                          setIsDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-xs text-left text-gray-700 hover:bg-slate-50 flex items-center space-x-2 transition cursor-pointer"
                      >
                        <i className="fa-solid fa-shield-halved text-emerald-600 w-4"></i>
                        <span>Chính sách quyền riêng tư</span>
                      </button>
                    )}

                    {onOpenTerms && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenTerms();
                          setIsDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-xs text-left text-gray-700 hover:bg-slate-50 flex items-center space-x-2 transition cursor-pointer"
                      >
                        <i className="fa-solid fa-file-contract text-blue-600 w-4"></i>
                        <span>Điều khoản sử dụng</span>
                      </button>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100 my-1"></div>

                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full px-4 py-2 text-xs text-left text-amber-700 hover:bg-amber-50 flex items-center space-x-2 transition cursor-pointer font-semibold"
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket text-amber-600 w-4"></i>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Not logged in state: "Đăng nhập bằng Google" Button */
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"></path>
              </svg>
              <span>Đăng nhập bằng Google</span>
            </button>
          )}

          {/* Admin Template Management CTA: Only visible if currentUser.isAdmin */}
          {currentUser && currentUser.isAdmin && (
            <button
              type="button"
              onClick={onOpenAdminModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700 rounded-lg text-xs font-bold shadow-xs transition duration-150 cursor-pointer shrink-0"
            >
              <i className="fa-solid fa-gear text-xs"></i>
              <span>Quản lý mẫu biểu</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HÀNG 2: SUB BAR - THANH TIẾN TRÌNH & CỤM NÚT TÁC VỤ NHANH                 */}
      {/* ========================================================================= */}
      {currentTab === 'editor' && (
        <div className="bg-gray-50/95 border-b border-gray-200 px-3 sm:px-6 py-2">
          <div className="w-full flex items-center justify-between gap-2 sm:gap-4 text-xs font-semibold">
            {/* Trái: Badge đồng bộ bản in A4 */}
            <div className="hidden xl:flex items-center space-x-2 text-slate-500 text-[11px] font-medium min-w-[150px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></span>
              <span>Đồng bộ thời gian thực A4</span>
            </div>

            {/* Giữa: Thanh tiến trình 3 bước */}
            <div className="flex-1 max-w-xl mx-auto flex items-center justify-between">
              {/* Bước 1 */}
              <button
                type="button"
                onClick={() => onSelectStep?.(1)}
                className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all duration-300 cursor-pointer shrink-0 ${
                  activeStep === 1
                    ? 'bg-amber-600 text-white font-bold shadow-2xs ring-2 ring-amber-200'
                    : activeStep > 1
                    ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Nhấn để chuyển đến Khối 1: Thể thức & Thông tin đơn vị"
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                    activeStep === 1
                      ? 'bg-white text-amber-800'
                      : activeStep > 1
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {activeStep > 1 ? <i className="fa-solid fa-check"></i> : '1'}
                </div>
                <span className="tracking-tight whitespace-nowrap">1. Thể thức &amp; Đơn vị</span>
              </button>

              <div
                className={`flex-1 h-[2px] mx-1.5 sm:mx-3 transition-colors duration-300 min-w-[10px] sm:min-w-[16px] ${
                  activeStep > 1 ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              ></div>

              {/* Bước 2 */}
              <button
                type="button"
                onClick={() => onSelectStep?.(2)}
                className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all duration-300 cursor-pointer shrink-0 ${
                  activeStep === 2
                    ? 'bg-amber-600 text-white font-bold shadow-2xs ring-2 ring-amber-200'
                    : activeStep > 2
                    ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Nhấn để chuyển đến Khối 2: Soạn thảo nội dung & Trợ lý AI"
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                    activeStep === 2
                      ? 'bg-white text-amber-800'
                      : activeStep > 2
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {activeStep > 2 ? <i className="fa-solid fa-check"></i> : '2'}
                </div>
                <span className="tracking-tight whitespace-nowrap">2. Soạn thảo Công văn AI</span>
              </button>

              <div
                className={`flex-1 h-[2px] mx-1.5 sm:mx-3 transition-colors duration-300 min-w-[10px] sm:min-w-[16px] ${
                  activeStep > 2 ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              ></div>

              {/* Bước 3 */}
              <button
                type="button"
                onClick={() => onSelectStep?.(3)}
                className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all duration-300 cursor-pointer shrink-0 ${
                  activeStep === 3
                    ? 'bg-amber-600 text-white font-bold shadow-2xs ring-2 ring-amber-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Nhấn để chuyển đến Bước 3: Ký duyệt & Xuất bản"
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                    activeStep === 3
                      ? 'bg-white text-amber-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  3
                </div>
                <span className="tracking-tight whitespace-nowrap">3. Ký duyệt &amp; Xuất bản</span>
              </button>
            </div>

            {/* Phải: Cụm nút tác vụ nhanh */}
            <div className="flex items-center space-x-2 shrink-0 min-w-[150px] justify-end">
              {/* Nút 1: Icon Lưu Drive */}
              <button
                type="button"
                onClick={onSaveToDrive}
                className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 flex items-center justify-center transition shadow-2xs cursor-pointer active:scale-95"
                title="Lưu dự thảo vào Google Drive"
              >
                <i className="fa-solid fa-cloud-arrow-up text-xs text-amber-700"></i>
              </button>

              {/* Nút 2: Nút xuất bản chính Xuất file Word để in */}
              <button
                type="button"
                onClick={onExportDocx}
                className="px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 shadow-sm hover:shadow-md transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                title="Tải file Word (.docx) chuẩn in ấn Nghị định 30/2020/NĐ-CP"
              >
                <i className="fa-solid fa-file-word text-xs"></i>
                <span className="hidden sm:inline">Xuất file Word để in</span>
                <span className="sm:hidden">Xuất Word</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
