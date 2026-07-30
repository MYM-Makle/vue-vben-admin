<script lang="ts" setup>
import type { AdminOverview } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Alert,
  Button,
  Card,
  Col,
  Row,
  Spin,
  Statistic,
  Tag,
} from 'antdv-next';

import { getOverviewApi } from '#/api';

const overview = ref<AdminOverview>();
const loading = ref(false);
const error = ref('');

const metrics = computed(() => {
  if (!overview.value) return [];
  return [
    [
      '注册用户',
      overview.value.totalUsers,
      `今日新增 ${overview.value.todayNewUsers}`,
    ],
    [
      '今日活跃',
      overview.value.dailyActiveUsers,
      `月活 ${overview.value.monthlyActiveUsers}`,
    ],
    ['当前在线', overview.value.onlineUsers, '近 5 分钟'],
    ['设备数量', overview.value.devices, '已记录设备'],
    [
      '今日生成',
      overview.value.todayCalls,
      `累计 ${overview.value.totalCalls}`,
    ],
    ['生成成功率', `${overview.value.successRate.toFixed(1)}%`, '全部生成请求'],
    ['累计消耗积分', overview.value.creditsUsed, '已完成结算'],
    ['图片记录', overview.value.totalImages, '全部图片元数据'],
  ] as const;
});

const chartMax = computed(() => {
  const values = overview.value?.daily.flatMap((item) => [
    item.activeUsers,
    item.generations,
  ]) ?? [1];
  return Math.max(1, ...values);
});

async function load() {
  loading.value = true;
  error.value = '';
  try {
    overview.value = await getOverviewApi();
  } catch (loadError) {
    error.value =
      loadError instanceof Error ? loadError.message : '运营数据加载失败';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <Page title="运营工作台">
    <template #extra>
      <Button :loading="loading" @click="load">
        <IconifyIcon icon="lucide:refresh-cw" />
        刷新
      </Button>
    </template>

    <Alert v-if="error" class="mb-4" :message="error" show-icon type="error" />
    <Spin :spinning="loading && !overview">
      <Row :gutter="[12, 12]">
        <Col
          v-for="metric in metrics"
          :key="metric[0]"
          :lg="6"
          :sm="12"
          :xs="24"
        >
          <Card size="small">
            <Statistic :title="metric[0]" :value="metric[1]" />
            <div class="mt-2 text-xs text-gray-500">{{ metric[2] }}</div>
          </Card>
        </Col>
      </Row>

      <Card v-if="overview" class="mt-4" title="近 14 日趋势">
        <template #extra>
          <div class="flex gap-2">
            <Tag color="processing">活跃用户</Tag>
            <Tag color="success">成功生成</Tag>
          </div>
        </template>
        <div class="trend-chart">
          <div
            v-for="item in overview.daily"
            :key="item.date"
            class="trend-day"
          >
            <div class="trend-bars">
              <i
                class="active"
                :style="{
                  height: `${Math.max(2, (item.activeUsers / chartMax) * 100)}%`,
                }"
                :title="`活跃用户 ${item.activeUsers}`"
              ></i>
              <i
                class="generation"
                :style="{
                  height: `${Math.max(2, (item.generations / chartMax) * 100)}%`,
                }"
                :title="`成功生成 ${item.generations}`"
              ></i>
            </div>
            <span>{{ item.date.slice(5) }}</span>
          </div>
        </div>
      </Card>
    </Spin>
  </Page>
</template>

<style scoped>
.trend-chart {
  display: grid;
  grid-template-columns: repeat(14, minmax(36px, 1fr));
  gap: 8px;
  align-items: end;
  height: 280px;
  padding-top: 16px;
  overflow-x: auto;
  border-bottom: 1px solid var(--ant-color-border-secondary, #e5e7eb);
}

.trend-day {
  display: grid;
  grid-template-rows: 1fr 28px;
  gap: 8px;
  min-width: 36px;
  height: 100%;
}

.trend-bars {
  display: flex;
  gap: 4px;
  align-items: end;
  justify-content: center;
  height: 100%;
}

.trend-bars i {
  width: min(11px, 36%);
  min-height: 2px;
  border-radius: 2px 2px 0 0;
}

.trend-bars .active {
  background: #1677ff;
}

.trend-bars .generation {
  background: #52c41a;
}

.trend-day span {
  font-size: 10px;
  color: #7d8793;
  text-align: center;
}
</style>
