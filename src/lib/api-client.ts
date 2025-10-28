import { API_BASE_URL, STORAGE_KEYS } from './config';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiResponse<T> {
  data: T;
  status: number;
}

function getAccessToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.accessToken);
  } catch {
    return null;
  }
}

function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.refreshToken);
  } catch {
    return null;
  }
}

let refreshInFlight: Promise<void> | null = null;

async function performTokenRefresh(): Promise<void> {
  // Single-flight: reuse ongoing refresh if present
  if (refreshInFlight) return refreshInFlight;

  const existingRefreshToken = getRefreshToken();
  if (!existingRefreshToken) {
    // Nothing to refresh
    return Promise.reject(new Error('No refresh token'));
  }

  const url = `${API_BASE_URL}/auth/refresh`;
  const body = JSON.stringify({ refreshToken: existingRefreshToken });

  refreshInFlight = fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body,
    credentials: 'include',
  })
    .then(async res => {
      const status = res.status;
      let json: any = null;
      try {
        json = await res.json();
      } catch {
        // ignore non-json
      }
      if (!res.ok) {
        const message = (json && (json.message || json.error)) || `HTTP ${status}`;
        throw new Error(message);
      }
      const { accessToken, refreshToken } = json || {};
      if (!accessToken || !refreshToken) {
        throw new Error('Invalid refresh response');
      }
      try {
        localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
        localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
      } catch {
        // storage errors ignored
      }
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

async function request<T>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: any;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  } = {},
): Promise<ApiResponse<T>> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const doFetch = () => fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
    signal: options.signal,
  });

  let res = await doFetch();

  const status = res.status;
  if (status === 204) {
    return { data: undefined as unknown as T, status };
  }

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // ignore non-json
  }

  if (!res.ok) {
    // If unauthorized, attempt a single silent refresh then retry once
    if (res.status === 401 && !url.endsWith('/auth/refresh')) {
      try {
        await performTokenRefresh();
        // Update Authorization header with new token
        const newToken = getAccessToken();
        if (newToken) headers.Authorization = `Bearer ${newToken}`;
        res = await doFetch();
        const retryStatus = res.status;
        if (retryStatus === 204) {
          return { data: undefined as unknown as T, status: retryStatus };
        }
        let retryJson: any = null;
        try {
          retryJson = await res.json();
        } catch {}
        if (!res.ok) {
          const message = (retryJson && (retryJson.message || retryJson.error)) || `HTTP ${retryStatus}`;
          throw new Error(message);
        }
        return { data: retryJson as T, status: retryStatus };
      } catch (e) {
        // Notify app of session expiry so UI can handle gracefully
        try {
          window.dispatchEvent(new CustomEvent('pef:session-expired'));
        } catch {}
        // Bubble up 401 after failed refresh so caller can handle logout
        throw new Error('401 Unauthorized');
      }
    }
    const message = (json && (json.message || json.error)) || `HTTP ${status}`;
    throw new Error(message);
  }

  return { data: json as T, status };
}

export const apiClient = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { method: 'GET', signal }),
  post: <T>(path: string, body?: any) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: any) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: any) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};


