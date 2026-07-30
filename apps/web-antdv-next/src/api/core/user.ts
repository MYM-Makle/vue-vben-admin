import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  const result = await requestClient.get<{
    user: {
      avatar: string;
      email: string;
      id: string;
      name: string;
    };
  }>('/admin/session');
  return {
    avatar: result.user.avatar,
    desc: result.user.email,
    homePath: '/overview',
    realName: result.user.name,
    roles: ['admin'],
    token: 'cookie-session',
    userId: result.user.id,
    username: result.user.email,
  } satisfies UserInfo;
}
