/**
 * AI Hỗ Trợ Soạn Thảo Văn Bản Hành Chính - Nghị định 30/2020/NĐ-CP
 * Trung tâm Mã số, mã vạch Quốc gia (MSMV) - Ủy ban TĐC
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { A4Preview } from './components/A4Preview.tsx';
import { EditorAccordion } from './components/EditorAccordion.tsx';
import { UnlockWarningModal } from './components/UnlockWarningModal.tsx';
import { AdminTemplateModal } from './components/AdminTemplateModal.tsx';
import { GoogleAuthModal, AuthUser } from './components/GoogleAuthModal.tsx';
import { DriveArchiveView } from './components/DriveArchiveView.tsx';
import { PrivacyPolicy } from './components/PrivacyPolicy.tsx';
import { TermsOfService } from './components/TermsOfService.tsx';
import { DocumentState, getDefaultDocumentState } from './utils/decree30Rules.ts';
import {
  INITIAL_DRAFTS,
  StoredDraft,
  AdministrativeTemplate,
} from './data/initialTemplates.ts';
import { generateDecree30Docx, downloadBlob } from './utils/docxExport.ts';
import { DrivePermissionModal } from './components/DrivePermissionModal.tsx';
import {
  DrivePermissionError,
  clearGoogleAccessToken,
  requestDriveAccessToken,
  uploadDraftToGoogleDrive,
  listRealDraftsFromDrive,
  deleteFileFromDrive,
  getGoogleAccessToken,
  setGoogleAccessToken,
} from './services/driveService.ts';

export default function App() {
  const [driveFolderLink, setDriveFolderLink] = useState<string>('');
  // Current user state (Default: null - Chưa đăng nhập)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('msmv_user');
    if (saved && saved !== 'null' && saved !== 'undefined') {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return null;
  });

  // Active step in stepper (1: Thể thức, 2: Soạn thảo AI, 3: Ký duyệt & Xuất bản)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(2);

  // Current tab: 'editor' | 'archive'
  const [currentTab, setCurrentTab] = useState<'editor' | 'archive'>('editor');

  // Document state
  const [document, setDocument] = useState<DocumentState>(() => {
    const saved = localStorage.getItem('msmv_current_doc');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return getDefaultDocumentState();
  });

  // Helper to load clean drafts for a user
  const getDraftsForUser = (user: AuthUser | null): StoredDraft[] => {
    try {
      // Clean up legacy mock data key if present in browser localStorage
      const legacy = localStorage.getItem('msmv_drafts');
      if (
        legacy &&
        (legacy.includes('Thông báo 42') ||
          legacy.includes('draft-1') ||
          legacy.includes('124/CV-MSMV') ||
          legacy.includes('Tờ trình 07'))
      ) {
        localStorage.removeItem('msmv_drafts');
      }
    } catch (e) {
      // ignore
    }

    const key = user
      ? `msmv_drafts_${user.email.toLowerCase().trim()}`
      : 'msmv_drafts_guest';
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed: StoredDraft[] = JSON.parse(saved);
        // Clean out any legacy mock drafts if found
        return parsed.filter(
          (d) =>
            !/^draft-[1-8]$/.test(d.id) &&
            !d.title?.includes('Thông báo 42') &&
            !d.title?.includes('Công văn 124') &&
            !d.title?.includes('Tờ trình 07') &&
            !d.title?.includes('Quyết định 89')
        );
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  // Drafts stored in Drive (User-specific, defaults to empty array [])
  const [drafts, setDrafts] = useState<StoredDraft[]>(() => {
    return getDraftsForUser(currentUser);
  });

  // Reload drafts when current user changes
  useEffect(() => {
    setDrafts(getDraftsForUser(currentUser));
  }, [currentUser?.email]);

  // Persist drafts for the current user key
  useEffect(() => {
    const key = currentUser
      ? `msmv_drafts_${currentUser.email.toLowerCase().trim()}`
      : 'msmv_drafts_guest';
    localStorage.setItem(key, JSON.stringify(drafts));
  }, [drafts, currentUser?.email]);

  // Unlocked fields state map
  const [unlockedFields, setUnlockedFields] = useState<Record<string, boolean>>({});

  // Unlock modal target
  const [unlockTarget, setUnlockTarget] = useState<{
    isOpen: boolean;
    fieldId: keyof DocumentState | null;
    fieldLabel: string;
  }>({
    isOpen: false,
    fieldId: null,
    fieldLabel: '',
  });

  // Modals state
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState<boolean>(false);

  // Drive Permission Modal state (Direct user click gesture to avoid GSI popup blocker & handle 403)
  const [drivePermissionState, setDrivePermissionState] = useState<{
    isOpen: boolean;
    action: 'save' | 'refresh' | null;
    has403Error?: boolean;
    reason?: string;
  }>({
    isOpen: false,
    action: null,
    has403Error: false,
    reason: '',
  });

  // Listen to URL query params or hash for Google Verification reviewers (?view=privacy, ?view=terms, #privacy, #terms)
  useEffect(() => {
    const handleUrlCheck = () => {
      const search = window.location.search || '';
      const hash = window.location.hash || '';
      const pathname = window.location.pathname || '';
      if (
        search.includes('privacy') ||
        search.includes('policy') ||
        hash.includes('privacy') ||
        hash.includes('policy') ||
        pathname.includes('privacy') ||
        pathname.includes('policy')
      ) {
        setIsPrivacyModalOpen(true);
      }
      if (
        search.includes('terms') ||
        hash.includes('terms') ||
        pathname.includes('terms')
      ) {
        setIsTermsModalOpen(true);
      }
    };
    handleUrlCheck();
    window.addEventListener('hashchange', handleUrlCheck);
    window.addEventListener('popstate', handleUrlCheck);
    return () => {
      window.removeEventListener('hashchange', handleUrlCheck);
      window.removeEventListener('popstate', handleUrlCheck);
    };
  }, []);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('msmv_current_doc', JSON.stringify(document));
  }, [document]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('msmv_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('msmv_user');
    }
  }, [currentUser]);

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('msmv_user');
    setCurrentTab('editor');
    showNotification('Đã đăng xuất tài khoản. Bạn đang ở chế độ khách vãng lai.');
  };

  // Field updater
  const handleUpdateField = (field: keyof DocumentState, value: any) => {
    setDocument((prev) => ({ ...prev, [field]: value }));
  };

  // Request to unlock standard field
  const handleRequestUnlock = (fieldId: keyof DocumentState, label: string) => {
    setUnlockTarget({
      isOpen: true,
      fieldId,
      fieldLabel: label,
    });
  };

  // Confirm unlocking standard field
  const handleConfirmUnlock = () => {
    if (unlockTarget.fieldId) {
      setUnlockedFields((prev) => ({
        ...prev,
        [unlockTarget.fieldId as string]: true,
      }));
      showNotification(`Đã mở khóa trường ${unlockTarget.fieldLabel} để chỉnh sửa.`);
    }
    setUnlockTarget({ isOpen: false, fieldId: null, fieldLabel: '' });
  };

  // Reset to default MSMV template
  const handleResetDefault = () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục lại mẫu chuẩn ban đầu của Trung tâm?')) {
      const def = getDefaultDocumentState();
      setDocument(def);
      setUnlockedFields({});
      showNotification('Đã khôi phục thành công mẫu chuẩn ban đầu của Trung tâm MSMV.');
    }
  };

  // Thực hiện lưu dự thảo lên Google Drive bằng token hợp lệ
  const executeSaveToDrive = async (token: string) => {
    if (!currentUser) return;
    try {
      showNotification('⏳ Đang tải file dự thảo .docx lên thư mục "AI Văn Bản - Dự thảo"...');
      const uploadRes = await uploadDraftToGoogleDrive(document, token, currentUser.email);

      const now = new Date();
      const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(
        now.getMonth() + 1
      )
        .toString()
        .padStart(2, '0')}/${now.getFullYear()} - ${now
        .getHours()
        .toString()
        .padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const newDraft: StoredDraft = {
        id: uploadRes.id,
        title: document.subject.startsWith('V/v')
          ? document.subject
          : `V/v ${document.subject}`,
        docNumber: document.docNumber || '...',
        docSymbol: document.docSymbol || '/MSMV-KHTC',
        category: 'congvan',
        categoryLabel: 'CÔNG VĂN',
        updatedAt: dateStr,
        author: currentUser.email,
        driveStatus: 'synced',
        drivePath: 'Google Drive / AI Văn Bản - Dự thảo',
        recipient: document.recipient,
        opening: document.opening,
        content: document.content,
        closing: document.closing,
        legalBases: document.legalBases,
        distributionList: document.distributionList,
        parentAgency: document.parentAgency,
        issuingAgency: document.issuingAgency,
        signerRole: document.signerRole,
        signerName: document.signerName,
        placeDate: document.placeDate,
        webViewLink: uploadRes.webViewLink,
      };

      setDrafts((prev) => [newDraft, ...prev.filter((d) => d.id !== newDraft.id)]);
      showNotification('✅ Đã lưu dự thảo thành công vào Google Drive của bạn.');
    } catch (error: any) {
      console.error('Lỗi lưu Google Drive:', error);
      // XỬ LÝ LỖI 403 / TOKEN INVALID: Dừng ngay, không chạy loop ngầm, hiển thị thông báo yêu cầu cấp quyền
      if (
        error instanceof DrivePermissionError ||
        error?.statusCode === 403 ||
        error?.statusCode === 401 ||
        error?.message?.includes('403') ||
        error?.message?.includes('401')
      ) {
        clearGoogleAccessToken();
        showNotification('⚠️ Lỗi phân quyền 403 Forbidden: Tài khoản chưa cấp quyền Google Drive (drive.file).');
        setDrivePermissionState({
          isOpen: true,
          action: 'save',
          has403Error: true,
          reason: 'Cần cấp quyền truy cập Google Drive để lưu văn bản',
        });
      } else {
        const errMsg = error?.message || 'Lỗi không xác định khi lưu vào Google Drive.';
        showNotification(`❌ ${errMsg}`);
      }
    }
  };

  // Người dùng bấm nút "💾 Lưu dự thảo"
  const handleSaveToDrive = async () => {
    if (!currentUser) {
      showNotification('⚠️ Vui lòng đăng nhập Google để đồng bộ và lưu dự thảo vào Google Drive của bạn.');
      setIsAuthModalOpen(true);
      return;
    }

    const token = getGoogleAccessToken();
    // Nếu chưa có token hợp lệ: mở ngay Modal xin quyền (Direct user gesture onClick)
    if (!token) {
      setDrivePermissionState({
        isOpen: true,
        action: 'save',
        has403Error: false,
        reason: 'Cần cấp quyền truy cập Google Drive để lưu văn bản',
      });
      return;
    }

    // Đã có token: tiến hành upload
    await executeSaveToDrive(token);
  };

  // Thực hiện tải danh sách file từ Drive
  const executeRefreshDrive = async (token: string) => {
    try {
      showNotification('⏳ Đang tải danh sách văn bản thực tế từ Google Drive...');
      const { files, folderLink } = await listRealDraftsFromDrive(token);
      setDrafts(files);
      if (folderLink) {
        setDriveFolderLink(folderLink);
      }
      showNotification(`✅ Đã đồng bộ thành công ${files.length} văn bản thực tế từ Google Drive.`);
    } catch (err: any) {
      console.error('Lỗi lấy danh sách file Drive:', err);
      // XỬ LÝ LỖI 403 / TOKEN INVALID: Dừng ngay, không chạy loop ngầm, hiển thị thông báo yêu cầu cấp quyền
      if (
        err instanceof DrivePermissionError ||
        err?.statusCode === 403 ||
        err?.statusCode === 401 ||
        err?.message?.includes('403') ||
        err?.message?.includes('401')
      ) {
        clearGoogleAccessToken();
        showNotification('⚠️ Lỗi phân quyền 403 Forbidden: Chưa cấp quyền đọc Google Drive.');
        setDrivePermissionState({
          isOpen: true,
          action: 'refresh',
          has403Error: true,
          reason: 'Cần cấp quyền truy cập Google Drive để xem danh sách dự thảo',
        });
      } else {
        showNotification(`❌ ${err?.message || 'Không thể lấy danh sách file từ Drive'}`);
      }
    }
  };

  // Làm mới danh sách dự thảo từ Google Drive
  const handleRefreshDrive = async () => {
    if (!currentUser) {
      showNotification('⚠️ Vui lòng đăng nhập Google để xem các tệp trên Drive.');
      setIsAuthModalOpen(true);
      return;
    }

    const token = getGoogleAccessToken();
    if (!token) {
      setDrivePermissionState({
        isOpen: true,
        action: 'refresh',
        has403Error: false,
        reason: 'Cần cấp quyền truy cập Google Drive để xem danh sách dự thảo',
      });
      return;
    }

    await executeRefreshDrive(token);
  };

  // Open existing draft from archive
  const handleOpenDraft = (draft: StoredDraft) => {
    setDocument({
      parentAgency: draft.parentAgency || 'ỦY BAN TIÊU CHUẨN ĐO LƯỜNG CHẤT LƯỢNG QUỐC GIA',
      issuingAgency: draft.issuingAgency || 'TRUNG TÂM MÃ SỐ, MÃ VẠCH QUỐC GIA',
      docNumber: draft.docNumber,
      docSymbol: draft.docSymbol,
      docType: draft.categoryLabel || 'CÔNG VĂN HÀNH CHÍNH',
      subject: draft.title.replace(/^V\/v\s*/i, ''),
      recipient: draft.recipient || 'Ủy ban Tiêu chuẩn Đo lường Chất lượng Quốc gia',
      placeDate: draft.placeDate || 'Hà Nội, ngày 19 tháng 10 năm 2026',
      opening: draft.opening || '',
      content: draft.content || '',
      closing: draft.closing || '',
      distributionList: draft.distributionList || ['- Như trên;', '- Chủ tịch Nguyễn Nam Hải (để b/c);', '- Lưu: VT, KHTC.'],
      signerRole: draft.signerRole || 'GIÁM ĐỐC',
      signerName: draft.signerName || 'Bùi Bá Chính',
      legalBases: draft.legalBases || [],
    });
    setCurrentTab('editor');
    showNotification(`Đã tải dự thảo "${draft.title}" vào trình soạn thảo.`);
  };

  // Delete draft (Xóa cả trên Google Drive nếu có token)
  const handleDeleteDraft = async (id: string) => {
    let token = getGoogleAccessToken() || currentUser?.accessToken;
    if (token && id && !id.startsWith('draft-')) {
      try {
        await deleteFileFromDrive(id, token);
        showNotification('🗑️ Đã xóa file trên Google Drive.');
      } catch (e: any) {
        const msg = e?.message || '';
        if (msg.includes('401') || msg.includes('403')) {
          try {
            setGoogleAccessToken(null);
            token = await requestDriveAccessToken();
            await deleteFileFromDrive(id, token);
            showNotification('🗑️ Đã xóa file trên Google Drive sau khi cấp lại quyền.');
          } catch (retryErr) {
            console.warn('Không thể xóa trên Drive sau khi thử lại:', retryErr);
          }
        } else {
          console.warn('Lỗi xóa trên Google Drive API:', e);
        }
      }
    }
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  // Apply template from Admin Manager
  const handleApplyTemplate = (tmpl: AdministrativeTemplate) => {
    setDocument((prev) => ({
      ...prev,
      parentAgency: tmpl.parentAgency,
      issuingAgency: tmpl.issuingAgency,
      docSymbol: tmpl.code,
      docType: tmpl.name,
      opening: tmpl.defaultOpening,
      closing: tmpl.defaultClosing,
      distributionList: tmpl.distributionList,
      signerRole: tmpl.defaultSignerRole,
      legalBases: tmpl.legalBases,
    }));
    showNotification(`Đã kích hoạt áp dụng cấu trúc mẫu: ${tmpl.name}`);
  };

  // Export docx
  const handleExportDocx = async () => {
    try {
      const blob = await generateDecree30Docx(document);
      downloadBlob(blob, `${document.docNumber || 'CongVan'}_MSMV.docx`);
      showNotification('Đã xuất file Word theo chuẩn Nghị định 30/2020/NĐ-CP thành công!');
    } catch (err) {
      console.error('Lỗi xuất file Word:', err);
      showNotification('Không thể tạo file Word. Vui lòng kiểm tra lại nội dung.');
    }
  };

  // Print / PDF
  const handlePrint = () => {
    window.print();
  };

  // Mobile sub-view when in editor: 'preview' | 'editor'
  const [mobileSubTab, setMobileSubTab] = useState<'preview' | 'editor'>('editor');

  return (
    <div className="bg-gray-100 text-slate-800 font-sans antialiased h-screen flex flex-col overflow-hidden">
      {/* Header with Navigation, Stepper, and Actions */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        activeStep={activeStep}
        onSelectStep={setActiveStep}
        onSaveToDrive={handleSaveToDrive}
        onExportDocx={handleExportDocx}
        onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
        onOpenTerms={() => setIsTermsModalOpen(true)}
      />

      {/* Mobile Sub-view Switcher for Editor Mode */}
      {currentTab === 'editor' && (
        <div className="lg:hidden bg-slate-200 border-b border-slate-300 px-3 py-1.5 flex items-center justify-center space-x-2">
          <button
            type="button"
            onClick={() => setMobileSubTab('editor')}
            className={`flex-1 py-1 rounded text-xs font-semibold flex items-center justify-center space-x-1 transition ${
              mobileSubTab === 'editor'
                ? 'bg-red-800 text-white shadow-2xs'
                : 'bg-white text-slate-700'
            }`}
          >
            <i className="fa-solid fa-pen-nib text-[10px]"></i>
            <span>Soạn thảo &amp; Trợ lý AI</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileSubTab('preview')}
            className={`flex-1 py-1 rounded text-xs font-semibold flex items-center justify-center space-x-1 transition ${
              mobileSubTab === 'preview'
                ? 'bg-red-800 text-white shadow-2xs'
                : 'bg-white text-slate-700'
            }`}
          >
            <i className="fa-solid fa-eye text-[10px]"></i>
            <span>Xem trước bản in A4</span>
          </button>
        </div>
      )}

      {/* Main Workspace Area */}
      <main className="flex-1 flex overflow-hidden">
        {currentTab === 'editor' ? (
          <>
            {/* Left A4 Live Preview Pane (occupies 38%-40% on desktop) */}
            <div
              className={`h-full lg:w-[40%] xl:w-[38%] lg:flex shrink-0 ${
                mobileSubTab === 'preview' ? 'w-full flex' : 'hidden'
              }`}
            >
              <A4Preview document={document} />
            </div>

            {/* Right Administrative Accordion Editor Pane (fills entire remaining screen) */}
            <div
              className={`h-full flex-1 w-full max-w-none lg:flex overflow-hidden ${
                mobileSubTab === 'editor' ? 'w-full flex' : 'hidden'
              }`}
            >
              <EditorAccordion
                document={document}
                onUpdateField={handleUpdateField}
                onRequestUnlock={handleRequestUnlock}
                unlockedFields={unlockedFields}
                onResetDefault={handleResetDefault}
                onSaveToDrive={handleSaveToDrive}
                onNotify={showNotification}
                activeStep={activeStep}
                onStepChange={setActiveStep}
                onExportDocx={handleExportDocx}
                onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
                onOpenTerms={() => setIsTermsModalOpen(true)}
              />
            </div>
          </>
        ) : (
          /* Google Drive Drafts Archive Table */
          <DriveArchiveView
            drafts={drafts}
            onOpenDraft={handleOpenDraft}
            onDeleteDraft={handleDeleteDraft}
            onNewDocument={() => setCurrentTab('editor')}
            onNotify={showNotification}
            currentUser={currentUser}
            onRefreshDrive={handleRefreshDrive}
            folderLink={driveFolderLink}
            onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
            onOpenTerms={() => setIsTermsModalOpen(true)}
            onRequestDrivePermission={() =>
              setDrivePermissionState({
                isOpen: true,
                action: 'refresh',
                has403Error: false,
                reason: 'Cần cấp quyền truy cập Google Drive để xem danh sách dự thảo',
              })
            }
          />
        )}
      </main>

      {/* Unlock Confirmation Modal */}
      <UnlockWarningModal
        isOpen={unlockTarget.isOpen}
        fieldName={unlockTarget.fieldId || ''}
        fieldLabel={unlockTarget.fieldLabel}
        onClose={() =>
          setUnlockTarget({ isOpen: false, fieldId: null, fieldLabel: '' })
        }
        onConfirm={handleConfirmUnlock}
      />

      {/* Admin Template Management Modal */}
      <AdminTemplateModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onApplyTemplate={handleApplyTemplate}
      />

      {/* Google Authentication & Account Switcher Modal */}
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        currentUser={currentUser}
        onClose={() => setIsAuthModalOpen(false)}
        onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
        onOpenTerms={() => setIsTermsModalOpen(true)}
        onSelectUser={(u) => {
          setCurrentUser(u);
          if (u) {
            showNotification(`Đăng nhập thành công với tài khoản: ${u.email} (${u.isAdmin ? 'Quản trị viên' : 'Chuyên viên'})`);
          } else {
            showNotification('Đã đăng xuất tài khoản Google.');
          }
        }}
      />

      {/* Drive Permission Modal - Direct User Gesture onClick to prevent popup blocker & handle 403 */}
      <DrivePermissionModal
        isOpen={drivePermissionState.isOpen}
        has403Error={drivePermissionState.has403Error}
        actionReason={drivePermissionState.reason}
        onClose={() => setDrivePermissionState((prev) => ({ ...prev, isOpen: false }))}
        onGranted={(freshToken) => {
          showNotification('✅ Đã cấp quyền Google Drive thành công.');
          if (drivePermissionState.action === 'save') {
            executeSaveToDrive(freshToken);
          } else if (drivePermissionState.action === 'refresh') {
            executeRefreshDrive(freshToken);
          }
        }}
        onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
        onOpenTerms={() => setIsTermsModalOpen(true)}
      />

      {/* Privacy Policy Modal (Google OAuth Verification Compliance) */}
      <PrivacyPolicy
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      {/* Terms of Service Modal (Decree 30 Compliance) */}
      <TermsOfService
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2.5 animate-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <i className="fa-solid fa-circle-check text-emerald-400 text-sm"></i>
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
