<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type {
  AdminAnnouncement,
  AnnouncementPayload,
  AnnouncementType,
} from '#/api';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Tag,
  TextArea,
} from 'antdv-next';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createAnnouncementApi,
  deleteAnnouncementApi,
  getAnnouncementsApi,
  updateAnnouncementApi,
} from '#/api';

const saving = ref(false);
const deletingId = ref('');
const error = ref('');
const formOpen = ref(false);
const editingId = ref('');
const form = reactive<AnnouncementPayload>({
  content: '',
  date: dayjs().format('YYYY-MM-DD'),
  isNew: true,
  title: '',
  type: 'system',
});

const typeOptions: { label: string; value: AnnouncementType }[] = [
  { label: '系统', value: 'system' },
  { label: '功能', value: 'feature' },
  { label: '更新', value: 'update' },
];
const typeLabels: Record<AnnouncementType, string> = {
  feature: '功能',
  system: '系统',
  update: '更新',
};
const typeColors: Record<AnnouncementType, string> = {
  feature: 'processing',
  system: 'warning',
  update: 'success',
};

const gridOptions: VxeGridProps<AdminAnnouncement> = {
  columns: [
    {
      align: 'left',
      field: 'title',
      minWidth: 420,
      slots: { default: 'title' },
      title: '公告',
    },
    {
      field: 'type',
      slots: { default: 'type' },
      title: '类型',
      width: 90,
    },
    { field: 'date', title: '日期', width: 120 },
    {
      field: 'isNew',
      slots: { default: 'isNew' },
      title: '标记',
      width: 90,
    },
    {
      fixed: 'right',
      slots: { default: 'actions' },
      title: '操作',
      width: 150,
    },
  ],
  data: [],
  height: 'auto',
  pagerConfig: { enabled: false },
  rowConfig: { height: 64, keyField: 'id' },
  toolbarConfig: { custom: true, refresh: false, zoom: true },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions,
  tableTitle: '公告列表',
});

async function load() {
  gridApi.setLoading(true);
  error.value = '';
  try {
    gridApi.setGridOptions({ data: (await getAnnouncementsApi()).items });
  } catch (loadError) {
    error.value =
      loadError instanceof Error ? loadError.message : '公告列表加载失败';
  } finally {
    gridApi.setLoading(false);
  }
}

function openCreate() {
  editingId.value = '';
  Object.assign(form, {
    content: '',
    date: dayjs().format('YYYY-MM-DD'),
    isNew: true,
    title: '',
    type: 'system' as AnnouncementType,
  });
  formOpen.value = true;
}

function openEdit(item: AdminAnnouncement) {
  editingId.value = item.id;
  Object.assign(form, {
    content: item.content,
    date: item.date,
    isNew: item.isNew,
    title: item.title,
    type: item.type,
  });
  formOpen.value = true;
}

async function save() {
  if (
    saving.value ||
    !form.title.trim() ||
    !form.content.trim() ||
    !form.date
  ) {
    return;
  }
  saving.value = true;
  error.value = '';
  const payload: AnnouncementPayload = {
    ...form,
    content: form.content.trim(),
    title: form.title.trim(),
  };
  try {
    if (editingId.value) {
      await updateAnnouncementApi(editingId.value, payload);
    } else {
      await createAnnouncementApi(payload);
    }
    formOpen.value = false;
    message.success('公告已保存');
    await load();
  } catch (saveError) {
    error.value =
      saveError instanceof Error ? saveError.message : '公告保存失败';
  } finally {
    saving.value = false;
  }
}

async function remove(id: string) {
  if (deletingId.value) return;
  deletingId.value = id;
  error.value = '';
  try {
    await deleteAnnouncementApi(id);
    message.success('公告已删除');
    await load();
  } catch (deleteError) {
    error.value =
      deleteError instanceof Error ? deleteError.message : '公告删除失败';
  } finally {
    deletingId.value = '';
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
          <Button type="primary" @click="openCreate">发布公告</Button>
        </Space>
      </template>
      <template #title="{ row }">
        <strong>{{ row.title }}</strong>
        <div class="mt-1 max-w-2xl text-xs text-gray-500">
          {{ row.content }}
        </div>
      </template>
      <template #type="{ row }">
        <Tag :color="typeColors[row.type]">
          {{ typeLabels[row.type] }}
        </Tag>
      </template>
      <template #isNew="{ row }">
        <Tag v-if="row.isNew" color="processing">最新</Tag>
        <span v-else>-</span>
      </template>
      <template #actions="{ row }">
        <Space>
          <Button size="small" @click="openEdit(row)">编辑</Button>
          <Popconfirm
            cancel-text="取消"
            ok-text="删除"
            title="确认删除该公告？"
            @confirm="remove(row.id)"
          >
            <Button
              danger
              :disabled="Boolean(deletingId)"
              :loading="deletingId === row.id"
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
      :title="editingId ? '编辑公告' : '发布公告'"
      :confirm-loading="saving"
      :ok-button-props="{
        disabled: !form.title.trim() || !form.content.trim() || !form.date,
      }"
      @ok="save"
    >
      <Form layout="vertical">
        <FormItem label="标题" required>
          <Input v-model:value="form.title" :maxlength="120" show-count />
        </FormItem>
        <FormItem label="内容" required>
          <TextArea
            v-model:value="form.content"
            :auto-size="{ minRows: 4, maxRows: 8 }"
            :maxlength="5000"
            show-count
          />
        </FormItem>
        <FormItem label="类型">
          <Select v-model:value="form.type" :options="typeOptions" />
        </FormItem>
        <FormItem label="日期" required>
          <Input v-model:value="form.date" type="date" />
        </FormItem>
        <FormItem label="最新标记">
          <Switch v-model:checked="form.isNew" />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>
