<script lang="ts" setup>
import type { SystemSettings } from '#/api';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Alert,
  Button,
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
const lastSavedTime = ref('2026-07-30 16:30:12');

// Helper to format date
function getNowString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

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
    lastSavedTime.value = getNowString();
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
  <Page>
    <div class="max-w-5xl mx-auto py-8 px-6">
      
      <!-- Premium Settings Header -->
      <div class="flex items-start justify-between gap-6 mb-8 relative pb-6 border-b border-slate-100">
        <div class="flex-1">
          <!-- Breadcrumb tracker -->
          <div class="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
            <IconifyIcon icon="lucide:settings" class="size-3.5" />
            <span>系统配置中心</span>
            <IconifyIcon icon="lucide:chevron-right" class="size-3" />
            <span class="text-indigo-600 font-medium">全局配额</span>
          </div>
          <h1 class="text-2xl font-bold text-slate-800 tracking-tight">系统全局配额配置</h1>
          <p class="text-sm text-slate-500 mt-1.5">全局管理员用户注册初始资源赠送及每日算力 API 调用阈值限制</p>
          <a href="javascript:;" class="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-3 transition-colors">
            <IconifyIcon icon="lucide:info" class="size-3.5" />
            配置说明
          </a>
        </div>

        <!-- Elegant floating illustration -->
        <div class="relative hidden md:block w-56 h-28 overflow-hidden select-none shrink-0">
          <div class="absolute -right-6 -top-6 w-32 h-32 bg-indigo-100/40 rounded-full blur-2xl"></div>
          <div class="absolute right-4 top-2 w-44 h-24 bg-white/40 backdrop-blur-md border border-white/60 rounded-xl shadow-md p-3 flex flex-col justify-between transform rotate-[-2deg] transition-all hover:rotate-0 duration-300">
            <div class="flex items-center gap-1.5">
              <div class="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
              <div class="w-16 h-1.5 bg-slate-300/40 rounded-full"></div>
            </div>
            <div class="space-y-1.5">
              <div class="w-full h-2 bg-slate-200/40 rounded-full"></div>
              <div class="w-4/5 h-2 bg-slate-200/40 rounded-full"></div>
              <div class="w-3/5 h-2 bg-slate-200/40 rounded-full"></div>
            </div>
            <div class="w-10 h-2.5 bg-indigo-200/50 rounded-full"></div>
          </div>
        </div>

        <div class="flex flex-col items-end gap-1.5 shrink-0 self-center">
          <Button 
            :loading="saving" 
            type="primary" 
            class="h-10 px-6 font-semibold shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 bg-gradient-to-r from-indigo-600 to-blue-600 border-0 rounded-lg flex items-center gap-2 transition-all"
            @click="save"
          >
            <IconifyIcon icon="lucide:save" class="size-4" />
            保存全局配置
          </Button>
          <span class="text-[11px] text-slate-400 font-mono">上次保存: {{ lastSavedTime }}</span>
        </div>
      </div>

      <Alert v-if="error" class="mb-6 rounded-lg" :message="error" show-icon type="error" />

      <Spin :spinning="loading">
        <!-- Settings cards grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
          <!-- Card 1: Registration Credits -->
          <div class="bg-white border border-slate-200/80 border-t-2 border-t-indigo-500 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col justify-between min-h-[220px]">
            <div>
              <div class="flex items-center justify-between mb-4">
                <div class="w-11 h-11 rounded-2xl bg-indigo-50/80 flex items-center justify-center text-indigo-600">
                  <IconifyIcon icon="lucide:gift" class="size-5" />
                </div>
                <span class="text-xs font-semibold bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full">新注册赠送</span>
              </div>
              <h3 class="text-base font-bold text-slate-800 mb-1">新用户初始积分</h3>
              <p class="text-xs text-slate-500 mb-6 leading-relaxed">新账号注册成功后，系统自动向其发放的初始可用算力积分总量。</p>
            </div>
            
            <div>
              <div class="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all bg-white h-12">
                <span class="bg-slate-50/50 px-5 text-slate-400 font-mono text-xs font-bold border-r border-slate-200 flex items-center justify-center h-full select-none">
                  PTS
                </span>
                <InputNumber
                  v-model:value="settings.registrationCredits"
                  class="flex-1 font-mono text-indigo-600 font-bold !border-0 focus:!shadow-none !h-full flex items-center text-base"
                  :max="1_000_000"
                  :min="0"
                  :precision="0"
                />
              </div>
              <div class="bg-indigo-50/40 text-indigo-700/80 px-4 py-2.5 rounded-lg flex items-center gap-2 text-xs border border-indigo-50/60 mt-4">
                <IconifyIcon icon="lucide:info" class="size-4 text-indigo-500" />
                <span>赠送积分可用于抵扣生成式 AI 模型调用消耗。</span>
              </div>
            </div>
          </div>

          <!-- Card 2: Daily Call Limit -->
          <div class="bg-white border border-slate-200/80 border-t-2 border-t-emerald-500 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col justify-between min-h-[220px]">
            <div>
              <div class="flex items-center justify-between mb-4">
                <div class="w-11 h-11 rounded-2xl bg-emerald-50/80 flex items-center justify-center text-emerald-600">
                  <IconifyIcon icon="lucide:zap" class="size-5" />
                </div>
                <span class="text-xs font-semibold bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full">安全阈值</span>
              </div>
              <h3 class="text-base font-bold text-slate-800 mb-1">默认每日 API 限制</h3>
              <p class="text-xs text-slate-500 mb-6 leading-relaxed">新账号每日可发起图像模型调用的上限，超过限制将限制当日请求。</p>
            </div>
            
            <div>
              <div class="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all bg-white h-12">
                <span class="bg-slate-50/50 px-5 text-slate-400 font-mono text-xs font-bold border-r border-slate-200 flex items-center justify-center h-full select-none">
                  REQ
                </span>
                <InputNumber
                  v-model:value="settings.defaultDailyLimit"
                  class="flex-1 font-mono text-emerald-600 font-bold !border-0 focus:!shadow-none !h-full flex items-center text-base"
                  :max="1_000_000"
                  :min="1"
                  :precision="0"
                />
              </div>
              <div class="bg-emerald-50/40 text-emerald-700/80 px-4 py-2.5 rounded-lg flex items-center gap-2 text-xs border border-emerald-50/60 mt-4">
                <IconifyIcon icon="lucide:info" class="size-4 text-emerald-500" />
                <span>旨在防止接口滥用、DDoS 攻击以及算力资源耗尽。</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Bottom Scope Info Card -->
        <div class="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-indigo-50/60 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
              <IconifyIcon icon="lucide:shield-check" class="size-6" />
            </div>
            <div>
              <h4 class="text-sm font-bold text-slate-800">配置生效范围</h4>
              <p class="text-xs text-slate-500 mt-0.5">本配置对所有新注册用户生效，不影响已存在用户的配额设置。</p>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full lg:w-auto border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0">
            <div class="flex items-center gap-2">
              <IconifyIcon icon="lucide:users" class="size-4.5 text-indigo-500" />
              <div class="text-left">
                <div class="text-xs font-bold text-slate-800">全局生效</div>
                <div class="text-[10px] text-slate-400 mt-0.5 font-medium">所有新注册用户</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <IconifyIcon icon="lucide:clock" class="size-4.5 text-indigo-500" />
              <div class="text-left">
                <div class="text-xs font-bold text-slate-800">实时生效</div>
                <div class="text-[10px] text-slate-400 mt-0.5 font-medium">保存后立即生效</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <IconifyIcon icon="lucide:shield-alert" class="size-4.5 text-indigo-500" />
              <div class="text-left">
                <div class="text-xs font-bold text-slate-800">安全可控</div>
                <div class="text-[10px] text-slate-400 mt-0.5 font-medium">防止资源滥用</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <IconifyIcon icon="lucide:sliders" class="size-4.5 text-indigo-500" />
              <div class="text-left">
                <div class="text-xs font-bold text-slate-800">灵活调整</div>
                <div class="text-[10px] text-slate-400 mt-0.5 font-medium">随时修改配额</div>
              </div>
            </div>
          </div>
        </div>
      </Spin>
    </div>
  </Page>
</template>
