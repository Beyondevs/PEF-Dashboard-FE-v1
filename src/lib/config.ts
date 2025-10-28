export const API_BASE_URL: string =
  (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const STORAGE_KEYS = {
  accessToken: 'pef.accessToken',
  refreshToken: 'pef.refreshToken',
  userRole: 'pef.userRole',
};


