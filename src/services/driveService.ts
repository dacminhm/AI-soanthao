import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { DocumentState } from '../utils/decree30Rules.ts';
import { generateDecree30Docx } from '../utils/docxExport.ts';
import { StoredDraft } from '../data/initialTemplates.ts';

// 1. Initialize Firebase App & Auth
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const GOOGLE_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) ||
  firebaseConfig.oAuthClientId ||
  '';

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

// 2. Configure Google Provider with Drive Scope
export const provider = new GoogleAuthProvider();
provider.addScope(DRIVE_SCOPE);
provider.setCustomParameters({
  prompt: 'select_account',
});

// Storage key in sessionStorage
const SESSION_TOKEN_KEY = 'msmv_drive_access_token';

// In-memory cache for OAuth access token
let cachedAccessToken: string | null = null;

export class DrivePermissionError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 403) {
    super(message);
    this.name = 'DrivePermissionError';
    this.statusCode = statusCode;
  }
}

/**
 * Lưu trữ Access Token vào bộ nhớ và sessionStorage
 */
export const setGoogleAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      if (token) {
        sessionStorage.setItem(SESSION_TOKEN_KEY, token);
      } else {
        sessionStorage.removeItem(SESSION_TOKEN_KEY);
      }
    } catch (e) {
      console.warn('Không thể thao tác sessionStorage:', e);
    }
  }
};

/**
 * Xóa sạch token cũ trong sessionStorage và bộ nhớ đệm
 */
export const clearGoogleAccessToken = () => {
  cachedAccessToken = null;
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    } catch (e) {
      console.warn('Không thể xóa sessionStorage:', e);
    }
  }
};

/**
 * Lấy Access Token từ bộ nhớ hoặc sessionStorage
 */
export const getGoogleAccessToken = (): string | null => {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const saved = sessionStorage.getItem(SESSION_TOKEN_KEY);
      if (saved) {
        cachedAccessToken = saved;
        return saved;
      }
    } catch (e) {
      console.warn('Không thể đọc sessionStorage:', e);
    }
  }
  return null;
};

export interface GoogleDriveFolder {
  id: string;
  name: string;
  webViewLink?: string;
}

export interface UploadResult {
  id: string;
  name: string;
  webViewLink: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: number | string;
}

export const FOLDER_NAME = 'AI Văn Bản - Dự thảo';

export interface RequestDriveTokenOptions {
  prompt?: string;
  onSuccess: (token: string) => void;
  onError: (error: Error) => void;
}

/**
 * 1. GẮN LỆNH XIN QUYỀN TRỰC TIẾP VÀO SỰ KIỆN CLICK CHUỘT (Direct User Gesture)
 */
export const requestDriveAccessTokenDirect = (options: RequestDriveTokenOptions) => {
  if (typeof window !== 'undefined' && window.google?.accounts?.oauth2 && GOOGLE_CLIENT_ID) {
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: `${DRIVE_SCOPE} https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile`,
        callback: (tokenResp: any) => {
          if (tokenResp.error) {
            clearGoogleAccessToken();
            options.onError(
              new DrivePermissionError(
                `Lỗi phân quyền Drive: ${tokenResp.error_description || tokenResp.error}`,
                403
              )
            );
            return;
          }
          if (tokenResp.access_token) {
            setGoogleAccessToken(tokenResp.access_token);
            options.onSuccess(tokenResp.access_token);
          } else {
            clearGoogleAccessToken();
            options.onError(new Error('Không nhận được access token từ Google.'));
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: options.prompt ?? 'consent' });
      return;
    } catch (gisError: any) {
      console.warn('GIS Token Client direct call warning, fallback Firebase popup:', gisError);
    }
  }

  // Firebase signInWithPopup fallback
  signInWithPopup(auth, provider)
    .then((result) => {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      if (!accessToken) {
        clearGoogleAccessToken();
        throw new Error('Không nhận được OAuth Access Token từ Google.');
      }
      setGoogleAccessToken(accessToken);
      options.onSuccess(accessToken);
    })
    .catch((authError: any) => {
      clearGoogleAccessToken();
      if (authError?.code === 'auth/popup-closed-by-user') {
        options.onError(new Error('Bạn đã đóng cửa sổ xác thực Google Drive.'));
      } else {
        options.onError(
          new Error(`Lỗi cấp quyền Google: ${authError?.message || authError}`)
        );
      }
    });
};

export const requestDriveAccessToken = (prompt: string = 'consent'): Promise<string> => {
  const currentToken = getGoogleAccessToken();
  if (currentToken) {
    return Promise.resolve(currentToken);
  }
  return new Promise((resolve, reject) => {
    requestDriveAccessTokenDirect({
      prompt,
      onSuccess: resolve,
      onError: reject,
    });
  });
};

/**
 * Tìm thư mục 'AI Văn Bản - Dự thảo'
 */
export const findDraftsFolder = async (
  accessToken: string
): Promise<GoogleDriveFolder | null> => {
  const query = `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name,webViewLink)`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearGoogleAccessToken();
      throw new DrivePermissionError('Lỗi phân quyền Drive (401): Phiên đăng nhập hết hạn.', 401);
    }
    if (res.status === 403) {
      clearGoogleAccessToken();
      throw new DrivePermissionError(
        'Lỗi phân quyền Drive (403): Chưa được cấp quyền truy cập thư mục Google Drive (scope drive.file).',
        403
      );
    }
    const errText = await res.text();
    throw new Error(`Lỗi tìm kiếm thư mục Drive (${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return {
      id: data.files[0].id,
      name: data.files[0].name,
      webViewLink: data.files[0].webViewLink,
    };
  }

  return null;
};

/**
 * Tạo thư mục nếu chưa tồn tại
 */
export const createDraftsFolder = async (
  accessToken: string
): Promise<GoogleDriveFolder> => {
  const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Thư mục lưu trữ văn bản dự thảo tự động từ hệ thống AI Văn Bản MSMV',
    }),
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearGoogleAccessToken();
      throw new DrivePermissionError('Lỗi phân quyền Drive (401): Phiên đăng nhập hết hạn khi tạo thư mục.', 401);
    }
    if (res.status === 403) {
      clearGoogleAccessToken();
      throw new DrivePermissionError(
        'Lỗi phân quyền Drive (403): Tài khoản chưa có quyền tạo thư mục trên Google Drive.',
        403
      );
    }
    const errText = await res.text();
    throw new Error(`Lỗi tạo thư mục '${FOLDER_NAME}' trên Google Drive: ${errText}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    name: data.name,
    webViewLink: data.webViewLink,
  };
};

export const getOrCreateDraftsFolder = async (
  accessToken: string
): Promise<GoogleDriveFolder> => {
  const existing = await findDraftsFolder(accessToken);
  if (existing) {
    return existing;
  }
  return await createDraftsFolder(accessToken);
};

/**
 * Upload file chuẩn base64 multipart để tránh lỗi 400 Bad Request và CORS
 */
export const uploadDraftToGoogleDrive = async (
  document: DocumentState,
  accessToken: string,
  userEmail: string
): Promise<UploadResult> => {
  // Lấy hoặc tạo thư mục
  const folder = await getOrCreateDraftsFolder(accessToken);

  // Tạo blob .docx chuẩn Nghị định 30
  const docxBlob = await generateDecree30Docx(document);

  const now = new Date();
  const dateFormatted = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const fileName = `CongVan_${document.docNumber || '125'}_MSMV_KHTC_${dateFormatted}.docx`;

  const draftMetadata = {
    name: fileName,
    parents: [folder.id],
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    description: JSON.stringify({
      ...document,
      savedAt: now.toISOString(),
      author: userEmail,
      folderId: folder.id,
      folderWebViewLink: folder.webViewLink,
    }),
  };

  // Chuyển binary docx thành Base64 để tránh lỗi encoding khi truyền qua multipart HTTP
  const buffer = await docxBlob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Data = btoa(binary);

  const boundary = '-------MSMV_BOUNDARY_' + Date.now();
  const delimiter = "\r\n--" + boundary + "\r\n";
  const closeDelimiter = "\r\n--" + boundary + "--";

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(draftMetadata) +
    delimiter +
    'Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document\r\n' +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    base64Data +
    closeDelimiter;

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,createdTime,modifiedTime,size',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (uploadRes.status === 200 || uploadRes.status === 201) {
    const data = await uploadRes.json();
    return {
      id: data.id,
      name: data.name,
      webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
      createdTime: data.createdTime,
      modifiedTime: data.modifiedTime,
      size: data.size,
    };
  }

  if (uploadRes.status === 401) {
    clearGoogleAccessToken();
    throw new DrivePermissionError('Lỗi phân quyền Drive (401): Phiên đăng nhập hết hạn.', 401);
  }
  if (uploadRes.status === 403) {
    clearGoogleAccessToken();
    throw new DrivePermissionError('Lỗi phân quyền Drive (403): Chưa được cấp quyền ghi tệp (scope drive.file).', 403);
  }

  const errBody = await uploadRes.text();
  throw new Error(`Lỗi tải lên Google Drive (${uploadRes.status}): ${errBody || uploadRes.statusText}`);
};

/**
 * Lấy danh sách file thực tế từ thư mục 'AI Văn Bản - Dự thảo'
 */
export const listRealDraftsFromDrive = async (
  accessToken: string
): Promise<{ files: StoredDraft[]; folderLink?: string }> => {
  const folder = await getOrCreateDraftsFolder(accessToken);
  const query = `'${folder.id}' in parents and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&orderBy=modifiedTime desc&fields=files(id,name,webViewLink,createdTime,modifiedTime,size,description,mimeType)&pageSize=50`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearGoogleAccessToken();
      throw new DrivePermissionError('Lỗi phân quyền Drive (401): Phiên làm việc đã hết hạn.', 401);
    }
    if (res.status === 403) {
      clearGoogleAccessToken();
      throw new DrivePermissionError(
        'Lỗi phân quyền Drive (403): Chưa được cấp quyền đọc danh sách tệp Google Drive.',
        403
      );
    }
    const errText = await res.text();
    throw new Error(`Lỗi tải danh sách file từ Drive (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const rawFiles = data.files || [];

  const drafts: StoredDraft[] = rawFiles.map((file: any) => {
    let parsedDesc: any = null;
    try {
      if (file.description) {
        parsedDesc = JSON.parse(file.description);
      }
    } catch {
      // Bỏ qua nếu description không phải JSON
    }

    const modified = file.modifiedTime ? new Date(file.modifiedTime) : new Date();
    const dateStr = `${modified.getDate().toString().padStart(2, '0')}/${(modified.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${modified.getFullYear()} - ${modified
      .getHours()
      .toString()
      .padStart(2, '0')}:${modified.getMinutes().toString().padStart(2, '0')}`;

    const numMatch = file.name.match(/CongVan_([^_]+)_/);
    const docNumber = parsedDesc?.docNumber || (numMatch ? numMatch[1] : '...');
    const docSymbol = parsedDesc?.docSymbol || '/MSMV-KHTC';
    const title = parsedDesc?.subject
      ? (parsedDesc.subject.startsWith('V/v') ? parsedDesc.subject : `V/v ${parsedDesc.subject}`)
      : file.name.replace(/\.docx$/i, '');

    return {
      id: file.id,
      title,
      docNumber,
      docSymbol,
      category: 'congvan',
      categoryLabel: 'CÔNG VĂN',
      updatedAt: dateStr,
      author: parsedDesc?.author || 'Google Drive',
      driveStatus: 'synced',
      drivePath: `Google Drive / ${FOLDER_NAME}`,
      recipient: parsedDesc?.recipient || 'Ủy ban Tiêu chuẩn Đo lường Chất lượng Quốc gia',
      opening: parsedDesc?.opening || '',
      content: parsedDesc?.content || '',
      closing: parsedDesc?.closing || '',
      legalBases: parsedDesc?.legalBases || [],
      distributionList: parsedDesc?.distributionList || ['- Như trên;', '- Lưu: VT, KHTC.'],
      parentAgency: parsedDesc?.parentAgency || 'ỦY BAN TIÊU CHUẨN ĐO LƯỜNG CHẤT LƯỢNG QUỐC GIA',
      issuingAgency: parsedDesc?.issuingAgency || 'TRUNG TÂM MÃ SỐ, MÃ VẠCH QUỐC GIA',
      signerRole: parsedDesc?.signerRole || 'GIÁM ĐỐC',
      signerName: parsedDesc?.signerName || 'Bùi Bá Chính',
      placeDate: parsedDesc?.placeDate || 'Hà Nội, ngày    tháng   năm 2026',
      webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
    };
  });

  return {
    files: drafts,
    folderLink: folder.webViewLink,
  };
};

/**
 * Xóa file trên Google Drive
 */
export const deleteFileFromDrive = async (
  fileId: string,
  accessToken: string
): Promise<void> => {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok && res.status !== 204) {
    if (res.status === 401 || res.status === 403) {
      clearGoogleAccessToken();
      throw new DrivePermissionError(`Lỗi phân quyền Drive (${res.status}): Không thể xóa file.`, res.status);
    }
    throw new Error(`Lỗi xóa file trên Drive (${res.status}): ${res.statusText}`);
  }
};

/**
 * Đăng xuất Google
 */
export const logoutGoogle = async (): Promise<void> => {
  await signOut(auth);
  clearGoogleAccessToken();
};