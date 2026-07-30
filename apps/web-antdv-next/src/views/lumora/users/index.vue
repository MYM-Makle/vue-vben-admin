<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ManagedUser } from '#/api';

import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Switch,
  Tag,
} from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { adjustCreditsApi, getUsersApi, updateUserApi } from '#/api';

const total = ref(0);
const saving = ref(false);
const error = ref('');
const selected = ref<ManagedUser>();
const settingsOpen = ref(false);
const creditsOpen = ref(false);
const settings = reactive({
  dailyLimit: 10_000,
  isAdmin: false,
  plan: 'Free',
  status: 'active' as 'active' | 'disabled',
});
const creditForm = reactive({ delta: null as null | number, reason: '' });

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '正常', value: 'active' },
  { label: '已停用', value: 'disabled' },
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
        placeholder: '搜索邮箱或昵称',
      },
      fieldName: 'q',
      label: '用户',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: statusOptions.slice(1),
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

const gridOptions: VxeGridProps<ManagedUser> = {
  columns: [
    {
      align: 'left',
      field: 'name',
      minWidth: 220,
      slots: { default: 'user' },
      title: '用户',
    },
    {
      field: 'status',
      slots: { default: 'status' },
      title: '状态',
      width: 90,
    },
    {
      field: 'plan',
      minWidth: 130,
      slots: { default: 'plan' },
      title: '套餐',
    },
    {
      field: 'credits',
      minWidth: 130,
      slots: { default: 'credits' },
      title: '积分',
    },
    {
      field: 'totalCalls',
      minWidth: 130,
      slots: { default: 'usage' },
      title: '使用量',
    },
    {
      field: 'lastSeenAt',
      minWidth: 180,
      slots: { default: 'lastSeenAt' },
      title: '最后活跃',
    },
    {
      fixed: 'right',
      slots: { default: 'actions' },
      title: '操作',
      width: 150,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 10 },
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        error.value = '';
        try {
          const result = await getUsersApi({
            page: page.currentPage,
            pageSize: page.pageSize,
            q: String(formValues.q ?? '').trim() || undefined,
            status: String(formValues.status ?? '') || undefined,
          });
          total.value = result.total;
          return result;
        } catch (loadError) {
          error.value =
            loadError instanceof Error ? loadError.message : '用户列表加载失败';
          throw loadError;
        }
      },
    },
  },
  rowConfig: { height: 56, keyField: 'id' },
  toolbarConfig: { custom: true, refresh: true, zoom: true },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});

function openSettings(user: ManagedUser) {
  selected.value = user;
  Object.assign(settings, {
    dailyLimit: user.dailyLimit,
    isAdmin: user.isAdmin,
    plan: user.plan,
    status: user.status,
  });
  settingsOpen.value = true;
}

function openCredits(user: ManagedUser) {
  selected.value = user;
  Object.assign(creditForm, { delta: null, reason: '' });
  creditsOpen.value = true;
}

async function saveSettings() {
  if (!selected.value || saving.value) return;
  saving.value = true;
  try {
    await updateUserApi(selected.value.id, settings);
    settingsOpen.value = false;
    message.success('用户设置已保存');
    await gridApi.query();
  } finally {
    saving.value = false;
  }
}

async function saveCredits() {
  const delta = creditForm.delta;
  const reason = creditForm.reason.trim();
  if (!selected.value || saving.value || !delta || reason.length < 2) return;
  saving.value = true;
  try {
    await adjustCreditsApi(selected.value.id, {
      delta,
      reason,
      requestId: crypto.randomUUID(),
    });
    creditsOpen.value = false;
    message.success('积分已调整');
    await gridApi.query();
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Page auto-content-height>
    <Alert v-if="error" class="mb-4" :message="error" show-icon type="error" />
    <Grid>
      <template #toolbar-tools>
        <span class="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 shadow-sm">
          共 {{ total }} 个用户账号
        </span>
      </template>
      <template #user="{ row }">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            {{ row.name ? row.name.charAt(0).toUpperCase() : 'U' }}
          </div>
          <div>
            <div class="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              {{ row.name }}
              <Tag v-if="row.isAdmin" color="purple" class="text-[10px] px-1.5 py-0 border-0 bg-purple-100 text-purple-700 font-semibold rounded">管理员</Tag>
            </div>
            <div class="text-xs text-slate-500 font-mono">{{ row.email }}</div>
          </div>
        </div>
      </template>
      <template #status="{ row }">
        <Tag :color="row.status === 'active' ? 'success' : 'error'" class="rounded-full px-2.5 font-semibold">
          {{ row.status === 'active' ? '正常' : '已停用' }}
        </Tag>
      </template>
      <template #plan="{ row }">
        <div class="font-semibold text-slate-700">{{ row.plan }}</div>
        <div class="text-xs text-slate-500">每日限额 {{ row.dailyLimit.toLocaleString() }}</div>
      </template>
      <template #credits="{ row }">
        <div class="font-bold text-indigo-600 font-mono">{{ row.credits.toLocaleString() }} <span class="text-xs text-slate-500 font-normal">积分</span></div>
        <div class="text-xs text-slate-400">预扣 {{ row.creditsReserved }}</div>
      </template>
      <template #usage="{ row }">
        <div class="font-semibold text-emerald-600">{{ row.totalCalls }} <span class="text-xs text-slate-500 font-normal">次</span></div>
        <div class="text-xs text-slate-500">消耗 {{ row.creditsUsed }} 积分</div>
      </template>
      <template #lastSeenAt="{ row }">
        <div class="text-xs font-mono text-slate-500">
          {{
            row.lastSeenAt
              ? new Date(row.lastSeenAt).toLocaleString('zh-CN', {
                  hour12: false,
                })
              : '从未活跃'
          }}
        </div>
      </template>
      <template #actions="{ row }">
        <Space>
          <Button size="small" type="link" class="font-medium" @click="openCredits(row)">积分</Button>
          <Button size="small" type="link" class="font-medium" @click="openSettings(row)">设置</Button>
        </Space>
      </template>
    </Grid>

    <Modal
      v-model:open="settingsOpen"
      title="账号设置"
      :confirm-loading="saving"
      @ok="saveSettings"
    >
      <Form layout="vertical">
        <FormItem label="用户">
          <Input :value="selected?.email" disabled />
        </FormItem>
        <FormItem label="套餐">
          <Input v-model:value="settings.plan" :maxlength="40" />
        </FormItem>
        <FormItem label="每日调用限额">
          <InputNumber
            v-model:value="settings.dailyLimit"
            class="w-full"
            :max="1_000_000"
            :min="1"
          />
        </FormItem>
        <FormItem label="账号状态">
          <Select
            v-model:value="settings.status"
            :options="statusOptions.slice(1)"
          />
        </FormItem>
        <FormItem label="管理员权限">
          <Switch v-model:checked="settings.isAdmin" />
        </FormItem>
      </Form>
    </Modal>

    <Modal
      v-model:open="creditsOpen"
      title="调整积分"
      :confirm-loading="saving"
      :ok-button-props="{
        disabled: !creditForm.delta || creditForm.reason.trim().length < 2,
      }"
      @ok="saveCredits"
    >
      <Form layout="vertical">
        <FormItem label="用户">
          <Input :value="selected?.email" disabled />
        </FormItem>
        <FormItem label="当前积分">
          <Input :value="String(selected?.credits ?? 0)" disabled />
        </FormItem>
        <FormItem label="调整数量">
          <InputNumber
            v-model:value="creditForm.delta"
            class="w-full"
            placeholder="增加填正数，扣减填负数"
          />
        </FormItem>
        <FormItem label="调整原因">
          <Input
            v-model:value="creditForm.reason"
            :maxlength="200"
            placeholder="请输入调整原因"
            show-count
          />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>
