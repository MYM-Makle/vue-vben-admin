<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { AdminProvider } from '#/api';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Form,
  FormItem,
  Input,
  InputPassword,
  message,
  Modal,
  Popconfirm,
  Space,
  Tag,
} from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  activateProviderApi,
  createProviderApi,
  deleteProviderApi,
  getProvidersApi,
} from '#/api';

const saving = ref(false);
const actionId = ref('');
const error = ref('');
const formOpen = ref(false);
const form = reactive({ apiKey: '', baseUrl: '', name: '' });

const gridOptions: VxeGridProps<AdminProvider> = {
  columns: [
    {
      align: 'left',
      field: 'name',
      minWidth: 180,
      slots: { default: 'name' },
      title: '服务',
    },
    {
      align: 'left',
      field: 'baseUrl',
      minWidth: 260,
      title: '接口地址',
    },
    {
      field: 'maskedApiKey',
      minWidth: 200,
      slots: { default: 'apiKey' },
      title: 'API Key',
    },
    {
      field: 'isActive',
      slots: { default: 'status' },
      title: '状态',
      width: 100,
    },
    {
      field: 'createdAt',
      slots: { default: 'createdAt' },
      title: '创建时间',
      width: 180,
    },
    {
      fixed: 'right',
      slots: { default: 'actions' },
      title: '操作',
      width: 160,
    },
  ],
  data: [],
  height: 'auto',
  pagerConfig: { enabled: false },
  rowConfig: { height: 56, keyField: 'id' },
  toolbarConfig: { custom: true, refresh: false, zoom: true },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions,
  tableTitle: '服务列表',
});

async function load() {
  gridApi.setLoading(true);
  error.value = '';
  try {
    gridApi.setGridOptions({ data: (await getProvidersApi()).items });
  } catch (loadError) {
    error.value =
      loadError instanceof Error ? loadError.message : '服务配置加载失败';
  } finally {
    gridApi.setLoading(false);
  }
}

function openCreate() {
  Object.assign(form, { apiKey: '', baseUrl: '', name: '' });
  formOpen.value = true;
}

async function save() {
  if (
    saving.value ||
    !form.name.trim() ||
    !form.baseUrl.trim() ||
    !form.apiKey.trim()
  ) {
    return;
  }
  saving.value = true;
  error.value = '';
  try {
    await createProviderApi({
      apiKey: form.apiKey.trim(),
      baseUrl: form.baseUrl.trim(),
      name: form.name.trim(),
    });
    formOpen.value = false;
    message.success('服务配置已添加');
    await load();
  } catch (saveError) {
    error.value =
      saveError instanceof Error ? saveError.message : '服务配置保存失败';
  } finally {
    saving.value = false;
  }
}

async function activate(id: string) {
  if (actionId.value) return;
  actionId.value = id;
  error.value = '';
  try {
    await activateProviderApi(id);
    message.success('当前服务已切换');
    await load();
  } catch (actionError) {
    error.value =
      actionError instanceof Error ? actionError.message : '服务切换失败';
  } finally {
    actionId.value = '';
  }
}

async function remove(id: string) {
  if (actionId.value) return;
  actionId.value = id;
  error.value = '';
  try {
    await deleteProviderApi(id);
    message.success('服务配置已删除');
    await load();
  } catch (actionError) {
    error.value =
      actionError instanceof Error ? actionError.message : '服务配置删除失败';
  } finally {
    actionId.value = '';
  }
}

onMounted(load);
</script>

<template>
  <Page auto-content-height>
    <Alert v-if="error" class="mb-4" :message="error" show-icon type="error" />
    <Grid>
      <template #toolbar-tools>
        <Space>
          <Button @click="load">刷新</Button>
          <Button type="primary" @click="openCreate">新增服务</Button>
        </Space>
      </template>
      <template #name="{ row }">
        <strong>{{ row.name }}</strong>
        <div class="text-xs text-gray-500">{{ row.model }}</div>
      </template>
      <template #apiKey="{ row }">
        {{ row.maskedApiKey }}
        <Tag v-if="row.needsRotation" class="ml-2" color="warning">
          需更新
        </Tag>
      </template>
      <template #status="{ row }">
        <Tag :color="row.isActive ? 'success' : 'default'">
          {{ row.isActive ? '使用中' : '未启用' }}
        </Tag>
      </template>
      <template #createdAt="{ row }">
        {{
          new Date(row.createdAt).toLocaleString('zh-CN', {
            hour12: false,
          })
        }}
      </template>
      <template #actions="{ row }">
        <Space>
          <Button
            :disabled="row.isActive || Boolean(actionId)"
            :loading="actionId === row.id && !row.isActive"
            size="small"
            @click="activate(row.id)"
          >
            启用
          </Button>
          <Popconfirm
            cancel-text="取消"
            ok-text="删除"
            title="确认删除该服务配置？"
            @confirm="remove(row.id)"
          >
            <Button
              danger
              :disabled="Boolean(actionId)"
              :loading="actionId === row.id"
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      </template>
    </Grid>

    <Modal
      v-model:open="formOpen"
      title="新增服务"
      :confirm-loading="saving"
      :ok-button-props="{
        disabled:
          !form.name.trim() || !form.baseUrl.trim() || !form.apiKey.trim(),
      }"
      @ok="save"
    >
      <Form layout="vertical">
        <FormItem label="名称" required>
          <Input v-model:value="form.name" :maxlength="80" />
        </FormItem>
        <FormItem label="接口地址" required>
          <Input
            v-model:value="form.baseUrl"
            placeholder="https://example.com/v1"
          />
        </FormItem>
        <FormItem label="API Key" required>
          <InputPassword v-model:value="form.apiKey" :maxlength="500" />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>
