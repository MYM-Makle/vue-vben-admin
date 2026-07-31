<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { IpLocationResult, UsageLogItem } from '#/api';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Alert, Button, Image, Tag } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getIpLocationApi, getUsageLogsApi } from '#/api';

const total = ref(0);
const error = ref('');
const ipLocations = ref<Record<string, IpLocationResult>>({});
const locatingIps = ref<Record<string, boolean>>({});

async function loadIpLocation(ip: string) {
  if (!ip || locatingIps.value[ip]) return;
  locatingIps.value = { ...locatingIps.value, [ip]: true };
  try {
    const result = await getIpLocationApi(ip);
    ipLocations.value = { ...ipLocations.value, [ip]: result };
  } catch (locationError) {
    error.value =
      locationError instanceof Error ? locationError.message : 'IP 地区查询失败';
  } finally {
    locatingIps.value = { ...locatingIps.value, [ip]: false };
  }
}

const statusOptions = [
  { label: '成功', value: 'success' },
  { label: '失败', value: 'error' },
];

const formOptions: VbenFormProps = {
  actionButtonsReverse: true,
  actionLayout: 'inline',
  layout: 'horizontal',
  resetButtonOptions: { content: '重置' },
  schema: [
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '邮箱、IP、设备 ID 或接口',
      },
      fieldName: 'q',
      label: '关键词',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: statusOptions,
        placeholder: '全部状态',
      },
      fieldName: 'status',
      label: '状态',
    },
  ],
  showCollapseButton: false,
  submitButtonOptions: { content: '搜索' },
  submitOnEnter: true,
};

const gridOptions: VxeGridProps<UsageLogItem> = {
  columns: [
    {
      field: 'imageUrl',
      slots: { default: 'image' },
      title: '图片',
      width: 84,
    },
    {
      align: 'left',
      field: 'userEmail',
      minWidth: 220,
      slots: { default: 'user' },
      title: '用户',
    },
    {
      align: 'left',
      field: 'endpoint',
      minWidth: 240,
      slots: { default: 'call' },
      title: '调用',
    },
    {
      field: 'status',
      slots: { default: 'status' },
      title: '状态',
      width: 90,
    },
    {
      field: 'durationMs',
      slots: { default: 'usage' },
      title: '耗时 / 积分',
      width: 130,
    },
    {
      align: 'left',
      field: 'ipAddress',
      minWidth: 260,
      slots: { default: 'network' },
      title: 'IP / 客户端',
    },
    {
      field: 'createdAt',
      slots: { default: 'createdAt' },
      title: '时间',
      width: 180,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 10 },
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        error.value = '';
        try {
          const result = await getUsageLogsApi({
            page: page.currentPage,
            pageSize: page.pageSize,
            q: String(formValues.q ?? '').trim() || undefined,
            status: String(formValues.status ?? '') || undefined,
          });
          total.value = result.total;
          return result;
        } catch (loadError) {
          error.value =
            loadError instanceof Error ? loadError.message : '调用日志加载失败';
          throw loadError;
        }
      },
    },
  },
  rowConfig: { height: 72, keyField: 'id' },
  toolbarConfig: { custom: true, refresh: true, zoom: true },
};

const [Grid] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});
</script>

<template>
  <Page auto-content-height>
    <Alert v-if="error" class="mb-4" :message="error" show-icon type="error" />
    <Grid>
      <template #toolbar-tools>
        <span class="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700 shadow-sm">
          共 {{ total }} 条接口日志记录
        </span>
      </template>
      <template #image="{ row }">
        <Image
          v-if="row.imageUrl"
          :height="52"
          :src="row.imageUrl"
          :width="52"
          class="rounded object-cover"
        />
        <span v-else class="text-xs text-slate-300">-</span>
      </template>
      <template #user="{ row }">
        <div class="font-bold text-slate-800 text-xs font-mono">{{ row.userEmail }}</div>
      </template>
      <template #call="{ row }">
        <div class="font-mono text-indigo-600 font-semibold text-xs">{{ row.endpoint }}</div>
        <div class="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
          <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">{{ row.providerName || '默认服务' }}</span>
          <span>·</span>
          <span class="text-indigo-700 font-medium">{{ row.model }}</span>
        </div>
      </template>
      <template #status="{ row }">
        <Tag :color="row.status === 'success' ? 'success' : 'error'" class="rounded-full px-2 font-bold">
          {{ row.status === 'success' ? 'SUCCESS' : 'FAILED' }}
        </Tag>
      </template>
      <template #usage="{ row }">
        <div class="font-mono text-xs font-bold" :class="row.durationMs > 5000 ? 'text-amber-600' : 'text-emerald-600'">
          {{ row.durationMs }} ms
        </div>
        <div class="text-[11px] text-amber-600 font-medium">{{ row.creditsUsed }} 积分</div>
      </template>
      <template #network="{ row }">
        <div class="font-mono text-xs text-slate-700">{{ row.ipAddress || '-' }}</div>
        <div v-if="ipLocations[row.ipAddress]" class="mt-0.5 text-[11px] text-cyan-700">
          {{ ipLocations[row.ipAddress]?.location }}
          <span v-if="ipLocations[row.ipAddress]?.isp" class="text-slate-400">
            · {{ ipLocations[row.ipAddress]?.isp }}
          </span>
        </div>
        <Button
          v-else-if="row.ipAddress"
          class="h-auto p-0 text-[11px]"
          :loading="locatingIps[row.ipAddress]"
          size="small"
          type="link"
          @click="loadIpLocation(row.ipAddress)"
        >
          获取地区
        </Button>
        <div class="text-[11px] text-slate-400">
          {{ row.platform || row.userAgent || '未知客户端' }}
          {{ row.appVersion ? ` · v${row.appVersion}` : '' }}
        </div>
      </template>
      <template #createdAt="{ row }">
        <div class="text-xs font-mono text-slate-500">
          {{
            new Date(row.createdAt).toLocaleString('zh-CN', {
              hour12: false,
            })
          }}
        </div>
      </template>
    </Grid>
  </Page>
</template>
