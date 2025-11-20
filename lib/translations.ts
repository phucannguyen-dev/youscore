import { Language } from '../types';

export interface Translations {
  // Auth
  signIn: string;
  signUp: string;
  email: string;
  password: string;
  signOut: string;
  createAccount: string;
  alreadyHaveAccount: string;
  dontHaveAccount: string;
  checkEmail: string;
  invalidCredentials: string;
  accountCreationFailed: string;
  passwordMinLength: string;
  
  // App
  appTitle: string;
  appDescription: string;
  trackYourScores: string;
  tellMeYourScore: string;
  enterScoreExample: string;
  uploadScoreImage: string;
  
  // Dashboard
  history: string;
  select: string;
  selectAll: string;
  deselectAll: string;
  cancel: string;
  delete: string;
  deleteConfirm: string;
  noScoresFound: string;
  
  // Settings
  settings: string;
  profile: string;
  language: string;
  theme: string;
  fullName: string;
  darkMode: string;
  lightMode: string;
  save: string;
  saveSettings: string;
  
  // Messages
  dataSecure: string;
  signInToAccess: string;
  createAccountToSave: string;
  couldNotUnderstandScore: string;
  noScoresInImage: string;
  failedToProcessImage: string;
}

export const translations: Record<Language, Translations> = {
  vi: {
    // Auth
    signIn: 'Đăng nhập',
    signUp: 'Tạo tài khoản',
    email: 'Email',
    password: 'Mật khẩu',
    signOut: 'Đăng xuất',
    createAccount: 'Tạo tài khoản',
    alreadyHaveAccount: 'Đã có tài khoản? Đăng nhập',
    dontHaveAccount: 'Chưa có tài khoản? Tạo tài khoản',
    checkEmail: 'Kiểm tra email của bạn để xác nhận tài khoản',
    invalidCredentials: 'Email hoặc mật khẩu không đúng',
    accountCreationFailed: 'Không thể tạo tài khoản. Vui lòng thử lại.',
    passwordMinLength: 'Mật khẩu phải có ít nhất 6 ký tự',
    
    // App
    appTitle: 'YouScore',
    appDescription: 'Theo dõi điểm của bạn',
    trackYourScores: 'Theo dõi điểm của bạn',
    tellMeYourScore: 'Chỉ cần cho tôi biết điểm của bạn, và tôi sẽ sắp xếp',
    enterScoreExample: 'Nhập "Được 10 điểm Toán" hoặc tải lên bảng điểm',
    uploadScoreImage: 'Tải lên ảnh bảng điểm',
    
    // Dashboard
    history: 'Lịch sử',
    select: 'Chọn',
    selectAll: 'Chọn tất cả',
    deselectAll: 'Bỏ chọn tất cả',
    cancel: 'Hủy',
    delete: 'Xóa',
    deleteConfirm: 'Bạn có muốn xóa',
    noScoresFound: 'Không tìm thấy điểm nào trong ảnh. Vui lòng thử ảnh rõ hơn.',
    
    // Settings
    settings: 'Cài đặt',
    profile: 'Hồ sơ',
    language: 'Ngôn ngữ',
    theme: 'Giao diện',
    fullName: 'Họ và tên',
    darkMode: 'Chế độ tối',
    lightMode: 'Chế độ sáng',
    save: 'Lưu',
    saveSettings: 'Lưu cài đặt',
    
    // Messages
    dataSecure: 'Dữ liệu của bạn được bảo mật và lưu trữ an toàn',
    signInToAccess: 'Đăng nhập để truy cập điểm của bạn',
    createAccountToSave: 'Tạo tài khoản để lưu điểm của bạn',
    couldNotUnderstandScore: 'Không thể hiểu điểm. Thử "Môn học điểm là X/Y"',
    noScoresInImage: 'Không tìm thấy điểm trong ảnh. Vui lòng thử ảnh rõ hơn.',
    failedToProcessImage: 'Không thể xử lý ảnh. Vui lòng thử lại.',
  },
  en: {
    // Auth
    signIn: 'Sign In',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    signOut: 'Sign Out',
    createAccount: 'Create Account',
    alreadyHaveAccount: 'Already have an account? Sign In',
    dontHaveAccount: "Don't have an account? Sign Up",
    checkEmail: 'Check your email to confirm your account',
    invalidCredentials: 'Invalid email or password',
    accountCreationFailed: 'Could not create account. Please try again.',
    passwordMinLength: 'Password must be at least 6 characters',
    
    // App
    appTitle: 'YouScore',
    appDescription: 'Track your scores',
    trackYourScores: 'Track your scores',
    tellMeYourScore: 'Just tell me your score, and I will organize it',
    enterScoreExample: 'Enter "Got 10 points in Math" or upload score sheet',
    uploadScoreImage: 'Upload score image',
    
    // Dashboard
    history: 'History',
    select: 'Select',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    cancel: 'Cancel',
    delete: 'Delete',
    deleteConfirm: 'Do you want to delete',
    noScoresFound: 'No scores found in the image. Please try a clearer photo.',
    
    // Settings
    settings: 'Settings',
    profile: 'Profile',
    language: 'Language',
    theme: 'Theme',
    fullName: 'Full Name',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    save: 'Save',
    saveSettings: 'Save Settings',
    
    // Messages
    dataSecure: 'Your data is secure and safely stored',
    signInToAccess: 'Sign in to access your scores',
    createAccountToSave: 'Create an account to save your scores',
    couldNotUnderstandScore: 'Could not understand the score. Try "Subject score was X/Y"',
    noScoresInImage: 'No scores found in the image. Please try a clearer photo.',
    failedToProcessImage: 'Failed to process the image. Please try again.',
  },
};

export function useTranslation(language: Language): Translations {
  return translations[language];
}
