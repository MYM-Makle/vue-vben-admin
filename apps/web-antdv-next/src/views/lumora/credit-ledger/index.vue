<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { CreditLedgerItem } from '#/api';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Alert, Tag } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCreditLedgerApi } from '#/api';

const total = ref(0);
const error = ref('');

const formOptions: VbenFormProps = {
  actionButtonsReverse: true,
  actionLayout: 'inline',
  layout: 'horizontal',
  resetButtonOptions: { content: '重置' },
  schema: [
    {
      component: 'Input',
      componentProps: { allowClear: true, placeholder: '用户 ID' },
      fieldName: 'userId',
      label: '用户',
    },
  ],
  showCollapseButton: false,
  submitButtonOptions: { content: '搜索' },
  submitOnEnter: true,
};

const gridOptions: VxeGridProps<CreditLedgerItem> = {
  columns: [
    {
      align: 'left',
      field: 'userEmail',
      minWidth: 220,
      slots: { default: 'user' },
      title: '用户',
    },
    {
      field: 'delta',
      slots: { default: 'delta' },
      title: '变动',
      width: 110,
    },
    { field: 'balanceAfter', minWidth: 130, title: '变动后余额' },
    {
      align: 'left',
      field: 'reason',
      minWidth: 260,
      slots: { default: 'reason' },
      title: '原因',
    },
    {
      field: 'operatorEmail',
      minWidth: 180,
      slots: { default: 'operator' },
      title: '操作人',
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
          const result = await getCreditLedgerApi({
            page: page.currentPage,
            pageSize: page.pageSize,
            userId: String(formValues.userId ?? '').trim() || undefined,
          });
          total.value = result.total;
          return result;
        } catch (loadError) {
          error.value =
            loadError instanceof Error ? loadError.message : '积分流水加载失败';
          throw loadError;
        }
      },
    },
  },
  rowConfig: { height: 56, keyField: 'id' },
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
        <span class="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 shadow-sm">
          共 {{ total }} 条变动纪录
        </span>
      </template>
      <template #user="{ row }">
        <div class="font-bold text-slate-800 text-xs font-mono">{{ row.userEmail }}</div>
        <div class="text-[11px] text-slate-400 font-mono">{{ row.userId }}</div>
      </template>
      <template #delta="{ row }">
        <Tag :color="row.delta > 0 ? 'success' : 'error'" class="font-mono font-bold px-2 py-0.5 rounded text-xs">
          {{ row.delta > 0 ? '+' : '' }}{{ row.delta.toLocaleString() }}
        </Tag>
      </template>
      <template #reason="{ row }">
        <div class="font-medium text-slate-700 text-xs">{{ row.reason }}</div>
        <div class="text-[11px] text-slate-400 font-mono">{{ row.referenceId }}</div>
      </template>
      <template #operator="{ row }">
        <span class="text-xs font-medium" :class="row.operatorEmail ? 'text-indigo-600' : 'text-slate-500'">
          {{ row.operatorEmail || '系统自动处理' }}
        </span>
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
