import { requestClient } from '#/api/request';

export interface DailyMetric {
  activeUsers: number;
  date: string;
  generations: number;
}

export interface AdminOverview {
  creditsUsed: number;
  daily: DailyMetric[];
  dailyActiveUsers: number;
  devices: number;
  monthlyActiveUsers: number;
  onlineUsers: number;
  successRate: number;
  todayCalls: number;
  todayNewUsers: number;
  totalCalls: number;
  totalImages: number;
  totalUsers: number;
}

export interface ManagedUser {
  availableCredits: number;
  createdAt: string;
  credits: number;
  creditsReserved: number;
  creditsUsed: number;
  dailyLimit: number;
  email: string;
  id: string;
  isAdmin: boolean;
  lastLoginAt: null | string;
  lastSeenAt: null | string;
  name: string;
  plan: string;
  status: 'active' | 'disabled';
  totalCalls: number;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export function getOverviewApi() {
  return requestClient.get<AdminOverview>('/admin/overview');
}

export function getUsersApi(params: {
  page: number;
  pageSize: number;
  q?: string;
  status?: string;
}) {
  return requestClient.get<PagedResult<ManagedUser>>('/admin/users', {
    params,
  });
}

export function updateUserApi(
  id: string,
  data: Pick<ManagedUser, 'dailyLimit' | 'isAdmin' | 'plan' | 'status'>,
) {
  return requestClient.put(`/admin/users/${encodeURIComponent(id)}`, data);
}

export function adjustCreditsApi(
  id: string,
  data: { delta: number; reason: string; requestId: string },
) {
  return requestClient.post<{ credits: number }>(
    `/admin/users/${encodeURIComponent(id)}/credits`,
    data,
  );
}
