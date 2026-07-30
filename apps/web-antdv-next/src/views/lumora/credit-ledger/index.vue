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
  schema: [
    {
      component: 'Input',
      componentProps: { allowClear: true, placeholder: '用户 ID' },
      fieldName: 'userId',
      label: '用户',
    },
  ],
  showCollapseButton: false,
  submitButtonOptions: { content: '查询' },
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
  pagerConfig: { pageSize: 30 },
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
  rowConfig: { keyField: 'id' },
  toolbarConfig: { custom: true, refresh: true },
};

const [Grid] = useVbenVxeGrid({
  formOptions,
  gridOptions,
  tableTitle: '积分明细',
});
</script>

<template>
  <Page title="积分流水">
    <Alert v-if="error" class="mb-4" :message="error" show-icon type="error" />
    <Grid>
      <template #toolbar-tools>
        <span class="text-sm text-gray-500">共 {{ total }} 条</span>
      </template>
      <template #user="{ row }">
        <strong>{{ row.userEmail }}</strong>
        <div class="text-xs text-gray-500">{{ row.userId }}</div>
      </template>
      <template #delta="{ row }">
        <Tag :color="row.delta > 0 ? 'success' : 'error'">
          {{ row.delta > 0 ? '+' : '' }}{{ row.delta }}
        </Tag>
      </template>
      <template #reason="{ row }">
        {{ row.reason }}
        <div class="text-xs text-gray-500">{{ row.referenceId }}</div>
      </template>
      <template #operator="{ row }">
        {{ row.operatorEmail || '系统' }}
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
