import { defineConfig } from '@vben/vite-config';

export default defineConfig(async ({ command }) => {
  const productionBuild = command === 'build';
  return {
    application: {
      nitroMock: false,
    },
    vite: {
      base: productionBuild ? '/admin/' : '/',
      define: {
        'import.meta.env.VITE_BASE': JSON.stringify(
          productionBuild ? '/admin/' : '/',
        ),
      },
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            target: 'https://makle.cloud',
          },
        },
      },
    },
  };
});
