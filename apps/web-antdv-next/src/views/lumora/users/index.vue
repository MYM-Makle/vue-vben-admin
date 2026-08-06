<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ManagedUser, ManagedUserDetail } from '#/api';

import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Alert,
  Button,
  Descriptions,
  DescriptionsItem,
  Drawer,
  Empty,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
} from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  adjustCreditsApi,
  bulkSetCreditsApi,
  getUserDetailApi,
  getUsersApi,
  updateUserApi,
} from '#/api';

const total = ref(0);
const saving = ref(false);
const error = ref('');
const selected = ref<ManagedUser>();
const detail = ref<ManagedUserDetail>();
const detailLoading = ref(false);
const detailOpen = ref(false);
const settingsOpen = ref(false);
const creditsOpen = ref(false);
const bulkCreditsOpen = ref(false);
const bulkUsers = ref<ManagedUser[]>([]);
const settings = reactive({
  dailyLimit: 10_000,
  isAdmin: false,
  plan: 'Free',
  status: 'active' as 'active' | 'disabled',
});
const creditForm = reactive({ delta: null as null | number, reason: '' });
const bulkCreditForm = reactive({
  credits: null as null | number,
  reason: '',
});

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
  checkboxConfig: { highlight: true },
  columns: [
    { type: 'checkbox', width: 48 },
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

async function openDetails(user: ManagedUser) {
  detail.value = undefined;
  detailOpen.value = true;
  detailLoading.value = true;
  try {
    detail.value = await getUserDetailApi(user.id);
  } catch (loadError) {
    error.value =
      loadError instanceof Error ? loadError.message : '用户详情加载失败';
  } finally {
    detailLoading.value = false;
  }
}

function openBulkCredits() {
  const users = gridApi.grid.getCheckboxRecords();
  if (users.length === 0) {
    message.warning('请先选择用户');
    return;
  }
  bulkUsers.value = users;
  Object.assign(bulkCreditForm, { credits: null, reason: '' });
  bulkCreditsOpen.value = true;
}

function formatDateTime(value: null | string) {
  return value
    ? new Date(value).toLocaleString('zh-CN', { hour12: false })
    : '-';
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

async function saveBulkCredits() {
  const credits = bulkCreditForm.credits;
  const reason = bulkCreditForm.reason.trim();
  if (credits === null || saving.value || reason.length < 2) return;
  saving.value = true;
  try {
    const result = await bulkSetCreditsApi({
      credits,
      reason,
      requestId: crypto.randomUUID(),
      userIds: bulkUsers.value.map((user) => user.id),
    });
    bulkCreditsOpen.value = false;
    await gridApi.grid.clearCheckboxRow();
    message.success(`已统一设置 ${result.updated} 个用户的积分`);
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
        <Space>
          <Button size="small" type="primary" @click="openBulkCredits">
            <IconifyIcon icon="lucide:coins" />
            批量设置积分
          </Button>
          <span
            class="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 shadow-sm"
          >
            共 {{ total }} 个用户账号
          </span>
        </Space>
      </template>
      <template #user="{ row }">
        <div class="flex items-center gap-2.5">
          <div
            class="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold text-xs shadow-sm"
          >
            {{ row.name ? row.name.charAt(0).toUpperCase() : 'U' }}
          </div>
          <div>
            <div
              class="font-bold text-slate-800 text-sm flex items-center gap-1.5"
            >
              <Button
                class="h-auto p-0 font-bold text-slate-800"
                size="small"
                type="link"
                @click="openDetails(row)"
              >
                {{ row.name }}
              </Button>
              <Tag
                v-if="row.isAdmin"
                color="purple"
                class="text-[10px] px-1.5 py-0 border-0 bg-purple-100 text-purple-700 font-semibold rounded"
                >管理员</Tag
              >
            </div>
            <div class="text-xs text-slate-500 font-mono">{{ row.email }}</div>
          </div>
        </div>
      </template>
      <template #status="{ row }">
        <Tag
          :color="row.status === 'active' ? 'success' : 'error'"
          class="rounded-full px-2.5 font-semibold"
        >
          {{ row.status === 'active' ? '正常' : '已停用' }}
        </Tag>
      </template>
      <template #plan="{ row }">
        <div class="font-semibold text-slate-700">{{ row.plan }}</div>
        <div class="text-xs text-slate-500">
          每日限额 {{ row.dailyLimit.toLocaleString() }}
        </div>
      </template>
      <template #credits="{ row }">
        <div class="font-bold text-indigo-600 font-mono">
          {{ row.credits.toLocaleString() }}
          <span class="text-xs text-slate-500 font-normal">积分</span>
        </div>
        <div class="text-xs text-slate-400">预扣 {{ row.creditsReserved }}</div>
      </template>
      <template #usage="{ row }">
        <div class="font-semibold text-emerald-600">
          {{ row.totalCalls }}
          <span class="text-xs text-slate-500 font-normal">次</span>
        </div>
        <div class="text-xs text-slate-500">
          消耗 {{ row.creditsUsed }} 积分
        </div>
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
          <Button
            size="small"
            type="link"
            class="font-medium"
            @click="openCredits(row)"
            >积分</Button
          >
          <Button
            size="small"
            type="link"
            class="font-medium"
            @click="openSettings(row)"
            >设置</Button
          >
        </Space>
      </template>
    </Grid>

    <Drawer
      v-model:open="detailOpen"
      title="用户详情"
      width="min(640px, 100vw)"
    >
      <Spin :spinning="detailLoading">
        <template v-if="detail">
          <div class="mb-5 flex items-center gap-3">
            <div
              class="flex size-11 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white"
            >
              {{ detail.name ? detail.name.charAt(0).toUpperCase() : 'U' }}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 font-bold text-slate-800">
                {{ detail.name }}
                <Tag v-if="detail.isAdmin" color="purple">管理员</Tag>
              </div>
              <div class="truncate font-mono text-xs text-slate-500">
                {{ detail.email }}
              </div>
            </div>
          </div>

          <Descriptions bordered :column="2" size="small">
            <DescriptionsItem label="账号 ID" :span="2">
              <span class="break-all font-mono text-xs">{{ detail.id }}</span>
            </DescriptionsItem>
            <DescriptionsItem label="邮箱" :span="2">
              {{ detail.email }}
            </DescriptionsItem>
            <DescriptionsItem label="密码">
              <Tag :color="detail.passwordConfigured ? 'success' : 'default'">
                {{
                  detail.passwordConfigured ? '已设置（不可查看）' : '未设置'
                }}
              </Tag>
            </DescriptionsItem>
            <DescriptionsItem label="状态">
              <Tag :color="detail.status === 'active' ? 'success' : 'error'">
                {{ detail.status === 'active' ? '正常' : '已停用' }}
              </Tag>
            </DescriptionsItem>
            <DescriptionsItem label="套餐">{{ detail.plan }}</DescriptionsItem>
            <DescriptionsItem label="每日限额">
              {{ detail.dailyLimit.toLocaleString() }}
            </DescriptionsItem>
            <DescriptionsItem label="当前积分">
              {{ detail.credits.toLocaleString() }}
            </DescriptionsItem>
            <DescriptionsItem label="可用积分">
              {{ detail.availableCredits.toLocaleString() }}
            </DescriptionsItem>
            <DescriptionsItem label="注册时间" :span="2">
              {{ formatDateTime(detail.createdAt) }}
            </DescriptionsItem>
            <DescriptionsItem label="最近登录">
              {{ formatDateTime(detail.lastLoginAt) }}
            </DescriptionsItem>
            <DescriptionsItem label="最近活跃">
              {{ formatDateTime(detail.lastSeenAt) }}
            </DescriptionsItem>
          </Descriptions>

          <div class="mb-3 mt-6 flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-800">调用方列表</h3>
            <Tag>{{ detail.providers.length }} 个</Tag>
          </div>
          <Empty
            v-if="detail.providers.length === 0"
            description="暂无可用调用方"
          />
          <div
            v-else
            class="divide-y divide-slate-100 border-y border-slate-200"
          >
            <div
              v-for="provider in detail.providers"
              :key="provider.id"
              class="py-4"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <div class="font-semibold text-slate-800">
                    {{ provider.name }}
                  </div>
                  <Tag
                    :color="provider.source === 'system' ? 'blue' : 'default'"
                  >
                    {{ provider.source === 'system' ? '系统提供' : '用户配置' }}
                  </Tag>
                </div>
                <Tag :color="provider.isActive ? 'success' : 'default'">
                  {{ provider.isActive ? '已启用' : '未启用' }}
                </Tag>
              </div>
              <div class="mt-1 break-all text-xs text-slate-500">
                {{ provider.baseUrl }}
              </div>
              <div
                class="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-slate-600"
              >
                <span>{{ provider.model }}</span>
                <span>{{ provider.maskedApiKey }}</span>
              </div>
            </div>
          </div>
        </template>
      </Spin>
    </Drawer>

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

    <Modal
      v-model:open="bulkCreditsOpen"
      title="批量设置积分"
      :confirm-loading="saving"
      :ok-button-props="{
        disabled:
          bulkCreditForm.credits === null ||
          bulkCreditForm.reason.trim().length < 2,
      }"
      @ok="saveBulkCredits"
    >
      <Form layout="vertical">
        <FormItem label="已选用户">
          <Input :value="`${bulkUsers.length} 个账号`" disabled />
        </FormItem>
        <FormItem label="统一积分">
          <InputNumber
            v-model:value="bulkCreditForm.credits"
            class="w-full"
            :max="1_000_000_000"
            :min="0"
            placeholder="设置为相同的积分余额"
          />
        </FormItem>
        <FormItem label="调整原因">
          <Input
            v-model:value="bulkCreditForm.reason"
            :maxlength="200"
            placeholder="请输入调整原因"
            show-count
          />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>
