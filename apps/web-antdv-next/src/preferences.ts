import { defineOverridesPreferences } from '@vben/preferences';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    accessMode: 'frontend',
    defaultHomePath: '/overview',
    enableRefreshToken: false,
    layout: 'sidebar-nav',
    name: 'Lumora 管理后台',
  },
  breadcrumb: {
    enable: false,
  },
  copyright: {
    enable: false,
  },
  theme: {
    mode: 'light',
    semiDarkHeader: false,
    semiDarkSidebar: false,
    semiDarkSidebarSub: false,
  },
});
