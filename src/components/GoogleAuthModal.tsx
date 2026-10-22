import React, { useState, useEffect, useRef } from 'react';
import firebaseConfig from '../../firebase-applet-config.json';
import { setGoogleAccessToken, clearGoogleAccessToken } from '../services/driveService.ts';

export interface AuthUser {
  name: string;
  email: string;
  isAdmin: boolean;
  role?: 'admin' | 'user';
  picture?: string;
  accessToken?: string;
}

interface GoogleAuthModalProps {
  isOpen: boolean;
  currentUser: AuthUser | null;
  onClose: () => void;
  onSelectUser: (user: AuthUser | null) => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) ||
  firebaseConfig.oAuthClientId ||
  (typeof process !== 'undefined' && (process as any).env?.GOOGLE_CLIENT_ID) ||
  '';

// Giải mã JWT credential an toàn, hỗ trợ chuẩn Unicode / tiếng Việt
function parseJwtCredential(token: string): {
  email?: string;
  name?: string;
  picture?: string;
  sub?: string;
} | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Lỗi giải mã Google JWT credential:', err);
    return null;
  }
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSelectUser,
  onOpenPrivacy,
  onOpenTerms,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [gisRendered, setGisRendered] = useState<boolean>(false);
  const gisContainerRef = useRef<HTMLDivElement>(null);

  // Xử lý khi xác thực thành công từ Google
  const handleSignInSuccess = (profile: {
    email?: string;
    name?: string;
    picture?: string;
    accessToken?: string;
  }) => {
    if (!profile.email) {
      setError('Không lấy được thông tin email từ tài khoản Google.');
      return;
    }

    const normalizedEmail = profile.email.trim().toLowerCase();
    const isAdmin = normalizedEmail === 'dacminhm@gmail.com';
    const role: 'admin' | 'user' = isAdmin ? 'admin' : 'user';

    const user: AuthUser = {
      name: profile.name || profile.email,
      email: profile.email,
      picture: profile.picture,
      isAdmin,
      role,
      accessToken: profile.accessToken,
    };

    // Lưu session vào localStorage để duy trì trạng thái đăng nhập
    try {
      localStorage.setItem('msmv_user', JSON.stringify(user));
    } catch (e) {
      console.error('Không thể lưu phiên đăng nhập:', e);
    }

    if (profile.accessToken) {
      setGoogleAccessToken(profile.accessToken);
    }

    onSelectUser(user);
    onClose();
  };

  // Khởi tạo Google Identity Services (google.accounts.id)
  useEffect(() => {
    if (!isOpen) {
      setGisRendered(false);
      setError(null);
      setIsLoading(false);
      return;
    }

    const initGis = () => {
      if (!window.google?.accounts?.id) return;

      try {
        if (GOOGLE_CLIENT_ID) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response: any) => {
              if (response?.credential) {
                const decoded = parseJwtCredential(response.credential);
                if (decoded) {
                  handleSignInSuccess(decoded);
                }
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (gisContainerRef.current) {
            gisContainerRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(gisContainerRef.current, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              shape: 'rectangular',
              text: 'continue_with',
              logo_alignment: 'left',
              width: 340,
              locale: 'vi',
            });
            setGisRendered(true);
          }
        }
      } catch (err) {
        console.warn('Lỗi khởi tạo GIS:', err);
      }
    };

    if (window.google?.accounts?.id) {
      initGis();
    } else {
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timer);
          initGis();
        }
      }, 150);
      return () => clearInterval(timer);
    }
  }, [isOpen]);

  // Click vào nút Google Sign-In chính thức
  const handleGoogleSignInClick = () => {
    setError(null);
    setIsLoading(true);

    // Sử dụng OAuth 2.0 token client pop-up nếu có
    if (window.google?.accounts?.oauth2 && GOOGLE_CLIENT_ID) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope:
            'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.file',
          callback: async (tokenResponse: any) => {
            setIsLoading(false);
            if (tokenResponse?.error) {
              setError(`Đăng nhập Google thất bại: ${tokenResponse.error}`);
              return;
            }
            if (tokenResponse?.access_token) {
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const profile = await res.json();
                handleSignInSuccess({
                  email: profile.email,
                  name: profile.name,
                  picture: profile.picture,
                  accessToken: tokenResponse.access_token,
                });
              } catch (err) {
                setError('Không thể lấy thông tin người dùng từ Google API.');
              }
            }
          },
        });
        tokenClient.requestAccessToken();
        return;
      } catch (err) {
        console.warn('Lỗi gọi OAuth Token Client:', err);
      }
    }

    // Nếu google.accounts.id khả dụng
    if (window.google?.accounts?.id && GOOGLE_CLIENT_ID) {
      try {
        window.google.accounts.id.prompt();
        setIsLoading(false);
        return;
      } catch (err) {
        console.warn('Lỗi gọi Google prompt:', err);
      }
    }

    setIsLoading(false);
    setError(
      'Chưa cấu hình biến môi trường VITE_GOOGLE_CLIENT_ID. Vui lòng cung cấp Google OAuth Client ID để kết nối Google Identity Services.'
    );
  };

  // Đăng xuất
  const handleLogout = () => {
    try {
      localStorage.removeItem('msmv_user');
      clearGoogleAccessToken();
    } catch (e) {
      // ignore
    }
    onSelectUser(null);
    onClose();
  };

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
        {/* Nút đóng [X] */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition focus:outline-none cursor-pointer"
          title="Đóng hộp thoại"
        >
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>

        {/* Logo Google chính thức */}
        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mx-auto mb-3.5 shadow-sm border border-slate-200">
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
        </div>

        {/* Tiêu đề & Dòng phụ */}
        <h3 className="text-xl font-bold text-gray-900 text-center tracking-tight">
          Đăng nhập bằng tài khoản Google
        </h3>
        <p className="text-xs text-gray-500 text-center mt-1.5 leading-relaxed max-w-sm mx-auto">
          Sử dụng tài khoản Google để đồng bộ dự thảo và lưu trữ an toàn trên Google Drive cá nhân.
        </p>

        {/* Thông tin tài khoản hiện tại nếu đã đăng nhập */}
        {currentUser && (
          <div className="my-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              {currentUser.picture ? (
                <img
                  src={currentUser.picture}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-300 shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-sm ring-2 ring-slate-300 shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
              )}
              <div className="text-left min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {currentUser.name}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider shrink-0 ${
                      currentUser.isAdmin
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {currentUser.isAdmin ? 'Quản trị viên' : 'Chuyên viên'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono truncate block">
                  {currentUser.email}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 px-2.5 py-1.5 rounded-lg hover:bg-amber-50 transition cursor-pointer shrink-0 ml-2"
            >
              <i className="fa-solid fa-arrow-right-from-bracket mr-1"></i>
              Đăng xuất
            </button>
          </div>
        )}

        {/* Báo lỗi nếu có */}
        {error && (
          <div className="my-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
            <i className="fa-solid fa-circle-exclamation text-amber-600 mt-0.5 shrink-0"></i>
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* VÙNG HÀNH ĐỘNG DUY NHẤT: Nút bấm chuẩn Google Identity Services (GIS) */}
        {!currentUser && (
          <div className="my-6 flex flex-col items-center justify-center">
            {/* Vùng render chuẩn Google Identity Services button */}
            <div
              ref={gisContainerRef}
              className={`flex justify-center w-full min-h-[44px] ${
                gisRendered ? 'block' : 'hidden'
              }`}
            ></div>

            {/* Nút bấm chuẩn dự phòng nếu GIS chưa tải xong hoặc cần kích hoạt qua popup */}
            {!gisRendered && (
              <button
                type="button"
                onClick={handleGoogleSignInClick}
                disabled={isLoading}
                className="w-full max-w-[340px] flex items-center justify-center space-x-3 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-sm font-semibold shadow-xs hover:shadow-sm transition cursor-pointer active:scale-[0.99] disabled:opacity-60"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                <span>
                  {isLoading ? 'Đang kết nối Google...' : 'Tiếp tục bằng tài khoản Google'}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Chân trang (Footer): Cam kết bảo mật & Điều khoản Google OAuth */}
        <div className="pt-4 border-t border-slate-100 text-center space-y-1.5">
          <p className="text-[11px] text-slate-400 leading-relaxed flex items-center justify-center gap-1.5">
            <i className="fa-solid fa-shield-halved text-slate-400 text-xs"></i>
            <span>Bảo mật dữ liệu chuẩn Google API &amp; Nghị định 30/2020/NĐ-CP</span>
          </p>
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPrivacy?.();
              }}
              className="hover:text-amber-800 underline transition cursor-pointer"
            >
              Chính sách quyền riêng tư
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTerms?.();
              }}
              className="hover:text-amber-800 underline transition cursor-pointer"
            >
              Điều khoản sử dụng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
