import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    component: () => import('#/views/lumora/overview/index.vue'),
    meta: {
      affixTab: true,
      icon: 'lucide:layout-dashboard',
      order: 1,
      title: '运营概览',
    },
    name: 'Overview',
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
];

export default routes;
