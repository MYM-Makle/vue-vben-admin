<script lang="ts" setup>
import type { SystemSettings } from '#/api';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Alert,
  Button,
  Card,
  Form,
  FormItem,
  InputNumber,
  message,
  Spin,
} from 'antdv-next';

import { getSettingsApi, updateSettingsApi } from '#/api';

const settings = reactive<SystemSettings>({
  defaultDailyLimit: 10_000,
  registrationCredits: 3000,
});
const loading = ref(false);
const saving = ref(false);
const error = ref('');

async function load() {
  loading.value = true;
  error.value = '';
  try {
    Object.assign(settings, await getSettingsApi());
  } catch (loadError) {
    error.value =
      loadError instanceof Error ? loadError.message : '系统配置加载失败';
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (saving.value) return;
  saving.value = true;
  error.value = '';
  try {
    await updateSettingsApi({ ...settings });
    message.success('系统配置已保存');
  } catch (saveError) {
    error.value =
      saveError instanceof Error ? saveError.message : '系统配置保存失败';
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <Page title="系统配置">
    <template #extra>
      <Button :loading="saving" type="primary" @click="save">
        <IconifyIcon icon="lucide:save" />
        保存
      </Button>
    </template>

    <Alert v-if="error" class="mb-4" :message="error" show-icon type="error" />
    <Spin :spinning="loading">
      <Card class="max-w-2xl" title="账号默认值">
        <Form layout="vertical">
          <FormItem label="注册赠送积分">
            <InputNumber
              v-model:value="settings.registrationCredits"
              class="w-full"
              :max="1_000_000"
              :min="0"
              :precision="0"
            />
          </FormItem>
          <FormItem label="默认每日调用限额">
            <InputNumber
              v-model:value="settings.defaultDailyLimit"
              class="w-full"
              :max="1_000_000"
              :min="1"
              :precision="0"
            />
          </FormItem>
        </Form>
      </Card>
    </Spin>
  </Page>
</template>
