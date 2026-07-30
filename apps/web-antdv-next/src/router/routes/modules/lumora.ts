import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    component: () => import('#/views/lumora/overview/index.vue'),
    meta: {
      affixTab: true,
      icon: 'lucide:layout-dashboard',
      order: 1,
      title: '工作台',
    },
    name: 'Workspace',
    path: '/overview',
  },
  {
    component: () => import('#/views/lumora/users/index.vue'),
    meta: {
      icon: 'lucide:users',
      order: 2,
      title: '用户管理',
    },
    name: 'Users',
    path: '/users',
  },
  {
    component: () => import('#/views/lumora/usage-logs/index.vue'),
    meta: {
      icon: 'lucide:scroll-text',
      order: 3,
      title: '调用日志',
    },
    name: 'UsageLogs',
    path: '/usage-logs',
  },
  {
    component: () => import('#/views/lumora/credit-ledger/index.vue'),
    meta: {
      icon: 'lucide:circle-dollar-sign',
      order: 4,
      title: '积分流水',
    },
    name: 'CreditLedger',
    path: '/credit-ledger',
  },
  {
    component: () => import('#/views/lumora/providers/index.vue'),
    meta: {
      icon: 'lucide:server-cog',
      order: 5,
      title: '服务配置',
    },
    name: 'Providers',
    path: '/providers',
  },
  {
    component: () => import('#/views/lumora/announcements/index.vue'),
    meta: {
      icon: 'lucide:megaphone',
      order: 6,
      title: '公告管理',
    },
    name: 'Announcements',
    path: '/announcements',
  },
  {
    component: () => import('#/views/lumora/settings/index.vue'),
    meta: {
      icon: 'lucide:settings',
      order: 7,
      title: '系统配置',
    },
    name: 'Settings',
    path: '/settings',
  },
];

export default routes;
