import {
  AuthResponse,
  AuthUser,
  CampaignAnalyticsResponse,
  CustomerInsightsResponse,
  DatasetPreviewResponse,
  DatasetSummaryResponse,
  ForgotPasswordResponse,
  ModelPerformanceResponse,
  OverviewResponse,
  PredictionFormInput,
  PredictionHistoryRecord,
  PredictionResultResponse
} from '../types/bankora.ts';

let memoryAccessToken: string | null = null;

export function setMemoryAccessToken(token: string | null) {
  memoryAccessToken = token;
}

export function getMemoryAccessToken(): string | null {
  return memoryAccessToken;
}

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers || {});
  if (!headers.has('Content-Type') && !(options?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (memoryAccessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${memoryAccessToken}`);
  }

  const res = await fetch(url, {
    ...options,
    headers
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}


export const bankoraApi = {
  getOverview: () => requestJson<OverviewResponse>('/api/analytics/overview'),

  getDatasetSummary: () => requestJson<DatasetSummaryResponse>('/api/dataset/summary'),

  getDatasetPreview: (params: {
    page?: number;
    limit?: number;
    search?: string;
    job?: string;
    marital?: string;
    education?: string;
    y?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    return requestJson<DatasetPreviewResponse>(`/api/dataset/preview?${qs.toString()}`);
  },

  uploadDataset: (csvContent: string, fileName: string) =>
    requestJson<{
      message: string;
      summary: DatasetSummaryResponse;
      bestPreCallModel: string;
      bestPreCallRocAuc: number;
    }>('/api/dataset/upload', {
      method: 'POST',
      body: JSON.stringify({ csvContent, fileName })
    }),

  cleanDataset: () =>
    requestJson<{ message: string; summary: DatasetSummaryResponse }>('/api/dataset/clean', {
      method: 'POST'
    }),

  resetDataset: () =>
    requestJson<{ message: string; summary: DatasetSummaryResponse }>('/api/dataset/reset', {
      method: 'POST'
    }),

  clearDataset: () =>
    requestJson<{ message: string; summary: DatasetSummaryResponse }>('/api/dataset/clear', {
      method: 'POST'
    }),

  getCustomerInsights: (filters: {
    minAge: number;
    maxAge: number;
    job: string;
    education: string;
    marital: string;
    housing: string;
    loan: string;
  }) => {
    const qs = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => qs.set(k, String(v)));
    return requestJson<CustomerInsightsResponse>(`/api/analytics/customers?${qs.toString()}`);
  },

  getCampaignAnalytics: () => requestJson<CampaignAnalyticsResponse>('/api/analytics/campaigns'),

  predictCustomer: (input: PredictionFormInput) =>
    requestJson<PredictionResultResponse>('/api/predict', {
      method: 'POST',
      body: JSON.stringify(input)
    }),

  getModelPerformance: () => requestJson<ModelPerformanceResponse>('/api/models/performance'),

  retrainModels: () =>
    requestJson<ModelPerformanceResponse & { message: string }>('/api/models/train', {
      method: 'POST'
    }),

  getPredictionHistory: (params?: { search?: string; result?: string; sort?: 'asc' | 'desc' }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.result) qs.set('result', params.result);
    if (params?.sort) qs.set('sort', params.sort);
    return requestJson<{ total: number; records: PredictionHistoryRecord[] }>(
      `/api/predictions/history?${qs.toString()}`
    );
  },

  deletePrediction: (id: number) =>
    requestJson<{ message: string; deletedId: number }>(`/api/predictions/${id}`, {
      method: 'DELETE'
    }),

  clearAllPredictions: () =>
    requestJson<{ message: string; deletedCount: number }>('/api/predictions', {
      method: 'DELETE'
    }),

  getSettings: () => requestJson<Record<string, unknown>>('/api/settings'),

  saveSettings: (settings: Record<string, unknown>) =>
    requestJson<{ message: string }>('/api/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    }),

  // Authentication API Endpoints
  register: (payload: {
    full_name: string;
    email: string;
    phone_number?: string;
    password: string;
    confirm_password: string;
  }) =>
    requestJson<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  login: (payload: { email: string; password: string; rememberMe?: boolean }) =>
    requestJson<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  logout: (refreshToken?: string) =>
    requestJson<{ message: string }>('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    }),

  refresh: (refreshToken?: string) =>
    requestJson<{ accessToken: string; user: AuthUser }>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    }),

  getMe: () => requestJson<{ user: AuthUser; accessToken?: string }>('/api/auth/me'),

  forgotPassword: (email: string) =>
    requestJson<ForgotPasswordResponse>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  resetPassword: (payload: { token: string; new_password: string; confirm_password: string }) =>
    requestJson<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateProfile: (payload: { full_name: string; phone_number?: string }) =>
    requestJson<{ message: string; user: AuthUser }>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),

  changePassword: (payload: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }) =>
    requestJson<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};

