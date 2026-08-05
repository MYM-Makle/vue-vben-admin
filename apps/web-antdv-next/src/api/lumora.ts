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

export interface CreditLedgerItem {
  balanceAfter: number;
  createdAt: string;
  delta: number;
  id: string;
  operatorEmail: null | string;
  reason: string;
  referenceId: string;
  userEmail: string;
  userId: string;
}

export interface UsageLogItem {
  appVersion: string;
  createdAt: string;
  creditsUsed: number;
  deviceId: string;
  durationMs: number;
  endpoint: string;
  id: string;
  imageUrl: null | string;
  ipAddress: string;
  model: string;
  platform: string;
  providerName: string;
  status: 'error' | 'success';
  userAgent: string;
  userEmail: string;
  userId: string;
}

export interface IpLocationResult {
  cached: boolean;
  ip: string;
  isp: string;
  location: string;
}

export interface SystemSettings {
  defaultDailyLimit: number;
  legacyApiKeys: number;
  registrationCredits: number;
}

export interface AdminProvider {
  baseUrl: string;
  createdAt: string;
  id: string;
  isActive: boolean;
  maskedApiKey: string;
  model: string;
  name: string;
  needsRotation: boolean;
}

export type AnnouncementType = 'feature' | 'system' | 'update';

export interface AdminAnnouncement {
  content: string;
  date: string;
  id: string;
  isNew: boolean;
  title: string;
  type: AnnouncementType;
}

export type AnnouncementPayload = Omit<AdminAnnouncement, 'id'>;

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

export function getCreditLedgerApi(params: {
  page: number;
  pageSize: number;
  userId?: string;
}) {
  return requestClient.get<PagedResult<CreditLedgerItem>>(
    '/admin/credit-ledger',
    { params },
  );
}

export function getUsageLogsApi(params: {
  page: number;
  pageSize: number;
  q?: string;
  status?: string;
}) {
  return requestClient.get<PagedResult<UsageLogItem>>('/admin/usage-logs', {
    params,
  });
}

export function getIpLocationApi(ip: string) {
  return requestClient.get<IpLocationResult>('/admin/ip-location', {
    params: { ip },
  });
}

export function getSettingsApi() {
  return requestClient.get<SystemSettings>('/admin/settings');
}

export function updateSettingsApi(
  data: Pick<SystemSettings, 'defaultDailyLimit' | 'registrationCredits'>,
) {
  return requestClient.put<null>('/admin/settings', data);
}

export function revokeLegacyApiKeysApi() {
  return requestClient.post<{ revoked: number }>(
    '/admin/api-keys/revoke-legacy',
  );
}

export function getProvidersApi() {
  return requestClient.get<{ items: AdminProvider[] }>('/admin/providers');
}

export function createProviderApi(data: {
  apiKey: string;
  baseUrl: string;
  name: string;
}) {
  return requestClient.post<AdminProvider>('/admin/providers', data);
}

export function activateProviderApi(id: string) {
  return requestClient.put<null>(
    `/admin/providers/${encodeURIComponent(id)}/activate`,
  );
}

export function deleteProviderApi(id: string) {
  return requestClient.delete<null>(
    `/admin/providers/${encodeURIComponent(id)}`,
  );
}

export function getAnnouncementsApi() {
  return requestClient.get<{ items: AdminAnnouncement[] }>('/announcements');
}

export function createAnnouncementApi(data: AnnouncementPayload) {
  return requestClient.post<{ id: string }>('/admin/announcements', data);
}

export function updateAnnouncementApi(id: string, data: AnnouncementPayload) {
  return requestClient.put<null>(
    `/admin/announcements/${encodeURIComponent(id)}`,
    data,
  );
}

export function deleteAnnouncementApi(id: string) {
  return requestClient.delete<null>(
    `/admin/announcements/${encodeURIComponent(id)}`,
  );
}
