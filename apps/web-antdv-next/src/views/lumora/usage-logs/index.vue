<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { UsageLogItem } from '#/api';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Alert, Tag } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getUsageLogsApi } from '#/api';

const total = ref(0);
const error = ref('');

const statusOptions = [
  { label: '成功', value: 'success' },
  { label: '失败', value: 'error' },
];

const formOptions: VbenFormProps = {
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
  submitButtonOptions: { content: '查询' },
  submitOnEnter: true,
};

const gridOptions: VxeGridProps<UsageLogItem> = {
  columns: [
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
      title: 'IP / 设备',
    },
    {
      field: 'createdAt',
      slots: { default: 'createdAt' },
      title: '时间',
      width: 180,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 30 },
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
  rowConfig: { height: 64, keyField: 'id' },
  toolbarConfig: { custom: true, refresh: true, zoom: true },
};

const [Grid] = useVbenVxeGrid({
  formOptions,
  gridOptions,
  tableTitle: '调用记录',
});
</script>

<template>
  <Page auto-content-height>
    <Alert v-if="error" class="mb-4" :message="error" show-icon type="error" />
    <Grid>
      <template #toolbar-tools>
        <span class="text-sm text-gray-500">共 {{ total }} 条</span>
      </template>
      <template #user="{ row }">
        <strong>{{ row.userEmail }}</strong>
        <div class="text-xs text-gray-500">{{ row.userId }}</div>
      </template>
      <template #call="{ row }">
        {{ row.endpoint }}
        <div class="text-xs text-gray-500">
          {{ row.providerName || '未记录服务' }} · {{ row.model }}
        </div>
      </template>
      <template #status="{ row }">
        <Tag :color="row.status === 'success' ? 'success' : 'error'">
          {{ row.status === 'success' ? '成功' : '失败' }}
        </Tag>
      </template>
      <template #usage="{ row }">
        {{ row.durationMs }} ms
        <div class="text-xs text-gray-500">{{ row.creditsUsed }} 积分</div>
      </template>
      <template #network="{ row }">
        {{ row.ipAddress || '-' }}
        <div class="text-xs text-gray-500">
          {{ row.platform || row.userAgent || '未知设备' }}
          {{ row.appVersion ? ` · v${row.appVersion}` : '' }}
        </div>
        <div v-if="row.deviceId" class="text-xs text-gray-500">
          {{ row.deviceId }}
        </div>
      </template>
      <template #createdAt="{ row }">
        {{
          new Date(row.createdAt).toLocaleString('zh-CN', {
            hour12: false,
          })
        }}
      </template>
    </Grid>
  </Page>
</template>
