<script lang="ts" setup>
import type { ManagedUser } from '#/api';

import { onMounted, reactive, ref } from 'vue';

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
  Pagination,
  Select,
  Space,
  Switch,
  Table,
  Tag,
} from 'antdv-next';

import { adjustCreditsApi, getUsersApi, updateUserApi } from '#/api';

const users = ref<ManagedUser[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 20;
const query = ref('');
const status = ref('');
const loading = ref(false);
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

const columns = [
  { key: 'user', title: '用户' },
  { key: 'status', title: '状态', width: 90 },
  { key: 'plan', title: '套餐' },
  { key: 'credits', title: '积分' },
  { key: 'usage', title: '使用量' },
  { key: 'lastSeenAt', title: '最后活跃' },
  { fixed: 'right' as const, key: 'actions', title: '操作', width: 150 },
];

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '正常', value: 'active' },
  { label: '已停用', value: 'disabled' },
];

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const result = await getUsersApi({
      page: page.value,
      pageSize,
      q: query.value || undefined,
      status: status.value || undefined,
    });
    users.value = result.items;
    total.value = result.total;
  } catch (error) {
    error.value = error instanceof Error ? error.message : '用户列表加载失败';
  } finally {
    loading.value = false;
  }
}

function search() {
  page.value = 1;
  void load();
}

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
    await load();
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
    await load();
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <Page description="管理账号状态、套餐、每日限额与积分" title="用户管理">
    <Alert v-if="error" class="mb-4" :message="error" show-icon type="error" />
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <Input
        v-model:value="query"
        class="w-72"
        allow-clear
        placeholder="搜索邮箱或昵称"
        @press-enter="search"
      />
      <Select
        v-model:value="status"
        class="w-32"
        :options="statusOptions"
        @change="search"
      />
      <Button :loading="loading" type="primary" @click="search">查询</Button>
      <span class="ml-auto text-sm text-gray-500">共 {{ total }} 个账号</span>
    </div>
    <Table
      :columns="columns"
      :data-source="users"
      :loading="loading"
      :pagination="false"
      :row-key="(row: ManagedUser) => row.id"
      :scroll="{ x: 1100 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'user'">
          <strong>{{ record.name }}</strong>
          <div class="text-xs text-gray-500">
            {{ record.email }}{{ record.isAdmin ? ' · 管理员' : '' }}
          </div>
        </template>
        <template v-else-if="column.key === 'status'">
          <Tag :color="record.status === 'active' ? 'success' : 'error'">
            {{ record.status === 'active' ? '正常' : '停用' }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'plan'">
          {{ record.plan }}
          <div class="text-xs text-gray-500">
            日限额 {{ record.dailyLimit }}
          </div>
        </template>
        <template v-else-if="column.key === 'credits'">
          {{ record.credits.toLocaleString() }}
          <div class="text-xs text-gray-500">
            预扣 {{ record.creditsReserved }}
          </div>
        </template>
        <template v-else-if="column.key === 'usage'">
          {{ record.totalCalls }} 次
          <div class="text-xs text-gray-500">消耗 {{ record.creditsUsed }}</div>
        </template>
        <template v-else-if="column.key === 'lastSeenAt'">
          {{
            record.lastSeenAt
              ? new Date(record.lastSeenAt).toLocaleString('zh-CN', {
                  hour12: false,
                })
              : '从未'
          }}
        </template>
        <template v-else-if="column.key === 'actions'">
          <Space>
            <Button size="small" @click="openCredits(record)">积分</Button>
            <Button size="small" @click="openSettings(record)">设置</Button>
          </Space>
        </template>
      </template>
    </Table>
    <div class="mt-4 flex justify-end">
      <Pagination
        v-model:current="page"
        :page-size="pageSize"
        :show-size-changer="false"
        :total="total"
        @change="load"
      />
    </div>

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
