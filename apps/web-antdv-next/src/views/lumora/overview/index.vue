<script lang="ts" setup>
import type { AdminOverview, AdminProvider, UsageLogItem } from '#/api';

import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import * as THREE from 'three';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { Alert, Spin } from 'antdv-next';

import { getOverviewApi, getProvidersApi, getUsageLogsApi } from '#/api';

const overview = ref<AdminOverview>();
const usageLogs = ref<UsageLogItem[]>([]);
const providers = ref<AdminProvider[]>([]);
const loading = ref(false);
const error = ref('');

// Real-time clock for the HUD Header
const currentTime = ref('');
let clockTimer: any = null;

function updateClock() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const timeStr = now.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  currentTime.value = `${dateStr} ${timeStr}`;
}

// Real-time runtime ticker for System Health
const runtimeString = ref('12天 06:23:45');
let runtimeTimer: any = null;
const startupTime = new Date('2026-07-18T11:15:00');

function updateRuntime() {
  const now = new Date();
  const diffMs = now.getTime() - startupTime.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  const pad = (n: number) => String(n).padStart(2, '0');
  runtimeString.value = `${days}天 ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

const chartMax = computed(() => {
  const values = overview.value?.daily.flatMap((item) => [
    item.activeUsers,
    item.generations,
  ]) ?? [1];
  return Math.max(1, ...values);
});

async function loadData() {
  loading.value = true;
  error.value = '';
  try {
    const [overviewRes, logsRes, providersRes] = await Promise.all([
      getOverviewApi(),
      getUsageLogsApi({ page: 1, pageSize: 6 }).catch(() => ({ items: [] })),
      getProvidersApi().catch(() => ({ items: [] })),
    ]);
    overview.value = overviewRes;
    usageLogs.value = logsRes.items;
    providers.value = providersRes.items;

    await nextTick();
    if (globeContainer.value && !renderer) {
      initThreeGlobe();
    }
  } catch (loadError) {
    error.value =
      loadError instanceof Error ? loadError.message : '大屏数据加载失败';
  } finally {
    loading.value = false;
  }
}

// Three.js 3D Globe Implementation
const globeContainer = ref<HTMLDivElement | null>(null);
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let globeGroup: THREE.Group | null = null;
let animationFrameId: number | null = null;

function cleanupThreeGlobe() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (renderer) {
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    renderer.dispose();
    renderer = null;
  }
  scene = null;
  camera = null;
  globeGroup = null;
}

function initThreeGlobe() {
  if (!globeContainer.value) return;

  // Clean up any existing canvas instance
  cleanupThreeGlobe();

  const width = globeContainer.value.clientWidth || 420;
  const height = globeContainer.value.clientHeight || 280;

  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 0.5, 7.2);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  globeContainer.value.appendChild(renderer.domElement);

  // Group
  globeGroup = new THREE.Group();
  scene.add(globeGroup);

  // 1. Solid Core Sphere with glowing material
  const coreGeo = new THREE.SphereGeometry(1.75, 32, 32);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x0044aa,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending
  });
  const coreGlobe = new THREE.Mesh(coreGeo, coreMat);
  globeGroup.add(coreGlobe);

  // 2. Globe Point Cloud Shell
  const particleGeo = new THREE.BufferGeometry();
  const sphereSamples = new THREE.SphereGeometry(1.85, 36, 36);
  const positionAttr = sphereSamples.attributes.position;
  const pCount = positionAttr.count;
  const positions = new Float32Array(pCount * 3);

  for (let i = 0; i < pCount; i++) {
    positions[i * 3] = positionAttr.getX(i);
    positions[i * 3 + 1] = positionAttr.getY(i);
    positions[i * 3 + 2] = positionAttr.getZ(i);
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const particleMat = new THREE.PointsMaterial({
    color: 0x00f2fe,
    size: 0.05,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending
  });

  const globePoints = new THREE.Points(particleGeo, particleMat);
  globeGroup.add(globePoints);

  // 3. Tech Wireframe Outer Ring Shell
  const wireGeo = new THREE.SphereGeometry(1.86, 18, 18);
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x0088ff,
    wireframe: true,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending
  });
  const wireGlobe = new THREE.Mesh(wireGeo, wireMat);
  globeGroup.add(wireGlobe);

  // 4. Base Cyber Pedestal Platform (Matching the reference picture stand!)
  const pedestalGroup = new THREE.Group();
  pedestalGroup.position.y = -2.1;

  // Outer pedestal ring 1
  const ring1Geo = new THREE.RingGeometry(1.8, 2.3, 48);
  const ring1Mat = new THREE.MeshBasicMaterial({
    color: 0x00f2fe,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending
  });
  const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
  ring1.rotation.x = Math.PI / 2;
  pedestalGroup.add(ring1);

  // Outer pedestal ring 2 (thicker blue base)
  const ring2Geo = new THREE.RingGeometry(1.2, 1.7, 48);
  const ring2Mat = new THREE.MeshBasicMaterial({
    color: 0x0055ff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending
  });
  const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
  ring2.rotation.x = Math.PI / 2;
  ring2.position.y = -0.15;
  pedestalGroup.add(ring2);

  scene.add(pedestalGroup);

  // 5. Glowing Orbits around Earth
  const createOrbit = (radius: number, color: number, rx: number, ry: number) => {
    const points: THREE.Vector3[] = [];
    const segs = 64;
    for (let i = 0; i <= segs; i++) {
      const theta = (i / segs) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(points);
    const orbitMat = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    orbitLine.rotation.x = rx;
    orbitLine.rotation.y = ry;
    globeGroup!.add(orbitLine);
  };

  createOrbit(2.4, 0x00f2fe, Math.PI / 3, Math.PI / 6);
  createOrbit(2.6, 0x38bdf8, -Math.PI / 4, Math.PI / 4);
  createOrbit(2.5, 0x10b981, Math.PI / 6, -Math.PI / 3);

  // 6. Moving Satellite Nodes
  const satellites: THREE.Mesh[] = [];
  const satGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const satMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, transparent: true, opacity: 0.95 });
  
  for (let i = 0; i < 4; i++) {
    const sat = new THREE.Mesh(satGeo, satMat);
    globeGroup.add(sat);
    satellites.push(sat);
  }

  // Animation Loop
  let angle = 0;
  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);

    if (globeGroup) {
      globeGroup.rotation.y += 0.003;
      globeGroup.rotation.x += 0.0005;
    }

    if (pedestalGroup) {
      ring1.rotation.z += 0.005;
      ring2.rotation.z -= 0.003;
    }

    satellites.forEach((sat, idx) => {
      const rad = 2.4 + idx * 0.08;
      const speed = 0.01 + idx * 0.004;
      const t = angle * speed;
      sat.position.x = Math.cos(t) * rad;
      sat.position.z = Math.sin(t) * rad;
      sat.position.y = Math.sin(t * 1.5) * 0.4;
    });

    angle += 1;

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  };

  animate();

  // Resize Observer
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width: w, height: h } = entry.contentRect;
      if (renderer && camera && w > 0 && h > 0) {
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
    }
  });
  resizeObserver.observe(globeContainer.value);
}

watch(
  () => globeContainer.value,
  async (container) => {
    if (container) {
      await nextTick();
      initThreeGlobe();
    }
  },
  { immediate: true }
);


onMounted(() => {
  updateClock();
  clockTimer = setInterval(updateClock, 1000);
  
  updateRuntime();
  runtimeTimer = setInterval(updateRuntime, 1000);
  
  loadData();
  initThreeGlobe();
});

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer);
  if (runtimeTimer) clearInterval(runtimeTimer);
  cleanupThreeGlobe();
});
</script>

<template>
  <Page auto-content-height>
    <div class="bigscreen-container">
      <!-- Ambient Outer Glows -->
      <div class="ambient-glow glow-blue"></div>
      <div class="ambient-glow glow-cyan"></div>

      <!-- Sci-Fi Top Header -->
      <div class="hud-header">
        <div class="hud-header-left">
          <div class="hud-logo-icon">
            <IconifyIcon icon="lucide:cpu" class="size-5 text-cyan-400 animate-pulse" />
          </div>
          <div class="hud-brand-tag">
            <span class="pulse-dot"></span>
            <span>SYSTEM LIVE COMMAND CENTER</span>
          </div>
        </div>

        <div class="hud-header-center">
          <div class="hud-title-glow">LUMORA 全球图像创作与算力实时监控舱</div>
          <div class="hud-title-sub">REAL-TIME GRAPHICS ENGINE & TELEMETRY MONITOR</div>
          <div class="header-line-decorator"></div>
        </div>

        <div class="hud-header-right">
          <div class="clock-display">
            <IconifyIcon icon="lucide:clock" class="mr-1.5 text-blue-400 size-4 inline" />
            <span>{{ currentTime }}</span>
          </div>
          <button class="hud-btn" :class="{ 'anim-spin': loading }" @click="loadData">
            <IconifyIcon icon="lucide:refresh-cw" class="size-3.5 mr-1 inline" />
            <span>刷新数据</span>
          </button>
        </div>
      </div>

      <!-- Alert Banner -->
      <Alert v-if="error" class="mb-4 bg-red-950/40 border-red-800 text-red-300" :message="error" show-icon type="error" />

      <Spin :spinning="loading && !overview" class="flex-1 min-h-0">
        <div v-if="overview" class="hud-dashboard-body">
          
          <!-- TOP HERO METRIC PODS (4 Key HUD Cards) -->
          <div class="hero-pods-grid">
            <!-- Pod 1: Users -->
            <div class="hud-card pod-card cyan-theme">
              <div class="card-corner corner-tl"></div>
              <div class="card-corner corner-tr"></div>
              <div class="card-corner corner-bl"></div>
              <div class="card-corner corner-br"></div>

              <div class="pod-header">
                <span class="pod-title">全网注册用户</span>
                <span class="pod-tag cyan">USER NODES</span>
              </div>
              <div class="pod-body">
                <div class="pod-main-value">
                  <span class="num text-cyan-400">{{ overview.totalUsers.toLocaleString() }}</span>
                  <span class="unit">位</span>
                </div>
                <div class="meter-svg-wrapper">
                  <svg viewBox="0 0 36 36" class="circular-chart cyan">
                    <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path class="circle" stroke-dasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div class="meter-center-text">75%</div>
                </div>
              </div>
              <div class="pod-footer">
                <span class="foot-item">今日新增 <strong class="text-cyan-400">+{{ overview.todayNewUsers }}</strong></span>
                <span class="foot-divider">|</span>
                <span class="foot-item">月活 <strong class="text-cyan-300">{{ overview.monthlyActiveUsers }}</strong></span>
              </div>
            </div>

            <!-- Pod 2: Live Online -->
            <div class="hud-card pod-card blue-theme">
              <div class="card-corner corner-tl"></div>
              <div class="card-corner corner-tr"></div>
              <div class="card-corner corner-bl"></div>
              <div class="card-corner corner-br"></div>

              <div class="pod-header">
                <span class="pod-title">实时在线 & 节点</span>
                <span class="pod-tag blue">LIVE CONCURRENT</span>
              </div>
              <div class="pod-body">
                <div class="pod-main-value">
                  <span class="num text-blue-400">{{ overview.onlineUsers }}</span>
                  <span class="unit">在线</span>
                </div>
                <div class="radar-pulse-wrapper">
                  <div class="radar-circle"></div>
                  <div class="radar-sweep"></div>
                  <div class="radar-center-dot"></div>
                </div>
              </div>
              <div class="pod-footer">
                <span class="foot-item">今日活跃 <strong class="text-blue-300">{{ overview.dailyActiveUsers }}</strong></span>
                <span class="foot-divider">|</span>
                <span class="foot-item">物理设备 <strong class="text-blue-400">{{ overview.devices }}</strong></span>
              </div>
            </div>

            <!-- Pod 3: Image Generations -->
            <div class="hud-card pod-card emerald-theme">
              <div class="card-corner corner-tl"></div>
              <div class="card-corner corner-tr"></div>
              <div class="card-corner corner-bl"></div>
              <div class="card-corner corner-br"></div>

              <div class="pod-header">
                <span class="pod-title">图像生成总调用</span>
                <span class="pod-tag emerald">GENERATIONS</span>
              </div>
              <div class="pod-body">
                <div class="pod-main-value">
                  <span class="num text-emerald-400">{{ overview.totalCalls.toLocaleString() }}</span>
                  <span class="unit">次</span>
                </div>
                <div class="meter-svg-wrapper">
                  <svg viewBox="0 0 36 36" class="circular-chart emerald">
                    <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path class="circle" stroke-dasharray="88, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div class="meter-center-text">88%</div>
                </div>
              </div>
              <div class="pod-footer">
                <span class="foot-item">今日生成 <strong class="text-emerald-400">+{{ overview.todayCalls }}</strong></span>
                <span class="foot-divider">|</span>
                <span class="foot-item">图像总量 <strong class="text-emerald-300">{{ overview.totalImages }}</strong></span>
              </div>
            </div>

            <!-- Pod 4: Credits & Health -->
            <div class="hud-card pod-card purple-theme">
              <div class="card-corner corner-tl"></div>
              <div class="card-corner corner-tr"></div>
              <div class="card-corner corner-bl"></div>
              <div class="card-corner corner-br"></div>

              <div class="pod-header">
                <span class="pod-title">算力开销与成功率</span>
                <span class="pod-tag purple">ENGINE HEALTH</span>
              </div>
              <div class="pod-body">
                <div class="pod-main-value">
                  <span class="num text-purple-400">{{ overview.creditsUsed.toLocaleString() }}</span>
                  <span class="unit">积分</span>
                </div>
                <div class="gauge-arc-wrapper">
                  <div class="gauge-value-text">{{ overview.successRate.toFixed(1) }}%</div>
                  <div class="gauge-bar" :style="{ width: `${overview.successRate}%` }"></div>
                </div>
              </div>
              <div class="pod-footer">
                <span class="foot-item">请求成功率 <strong class="text-purple-300">{{ overview.successRate.toFixed(1) }}%</strong></span>
                <span class="foot-divider">|</span>
                <span class="foot-item">集群状态 <strong class="text-emerald-400">正常</strong></span>
              </div>
            </div>
          </div>

          <!-- MAIN COLUMNS: 3 COLUMNS -->
          <div class="main-columns-grid">
            
            <!-- LEFT COLUMN: LOAD DISTRIBUTION & MONITOR -->
            <div class="column-container flex-col-container">
              <!-- Left Card 1: Engine Load -->
              <div class="hud-card flex-1 flex flex-col p-4 relative justify-between overflow-hidden">
                <div class="card-corner corner-tl"></div>
                <div class="card-corner corner-tr"></div>
                <div class="card-corner corner-bl"></div>
                <div class="card-corner corner-br"></div>

                <div class="panel-header-mini">
                  <div class="panel-title-group">
                    <IconifyIcon icon="lucide:layers" class="panel-icon text-cyan-400" />
                    <span>模型引擎负载分布</span>
                  </div>
                  <span class="status-live-badge">HEALTHY</span>
                </div>

                <div class="flex items-center gap-4 my-2">
                  <!-- Large Radial Load Ring -->
                  <div class="relative w-24 h-24 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90">
                      <path class="text-slate-800" stroke-width="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path class="text-cyan-400" stroke-width="3" stroke-dasharray="45, 100" stroke-linecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span class="text-lg font-bold text-white leading-none">45%</span>
                      <span class="text-[9px] text-slate-500 scale-90 mt-0.5">总负载</span>
                    </div>
                  </div>

                  <!-- Model meters -->
                  <div class="flex-1 flex flex-col gap-2.5">
                    <div class="meter-item">
                      <div class="meter-info">
                        <span class="model-name">Flux.1 Dev / Schnell</span>
                        <span class="model-pct">45%</span>
                      </div>
                      <div class="meter-track"><div class="meter-fill fill-cyan" style="width: 45%"></div></div>
                    </div>
                    <div class="meter-item">
                      <div class="meter-info">
                        <span class="model-name">Stable Diffusion XL 1.0</span>
                        <span class="model-pct">30%</span>
                      </div>
                      <div class="meter-track"><div class="meter-fill fill-blue" style="width: 30%"></div></div>
                    </div>
                    <div class="meter-item">
                      <div class="meter-info">
                        <span class="model-name">Lumora Ultra HD</span>
                        <span class="model-pct">15%</span>
                      </div>
                      <div class="meter-track"><div class="meter-fill fill-purple" style="width: 15%"></div></div>
                    </div>
                    <div class="meter-item">
                      <div class="meter-info">
                        <span class="model-name">Midjourney V6 Bridge</span>
                        <span class="model-pct">10%</span>
                      </div>
                      <div class="meter-track"><div class="meter-fill fill-emerald" style="width: 10%"></div></div>
                    </div>
                  </div>
                </div>

                <!-- Provider Mini Block -->
                <div class="provider-status-block mt-1">
                  <div class="sub-panel-title">算力服务提供方</div>
                  <div class="flex items-center gap-2">
                    <div class="prov-logo-badge">AWS</div>
                    <div class="prov-logo-badge">GCP</div>
                    <div class="prov-logo-badge">Alibaba</div>
                    <div class="prov-logo-badge">Azure</div>
                    <div class="prov-logo-badge plus">+3</div>
                  </div>
                </div>
              </div>

              <!-- Left Card 2: Resource Monitor -->
              <div class="hud-card flex-1 flex flex-col p-4 relative justify-between overflow-hidden">
                <div class="card-corner corner-tl"></div>
                <div class="card-corner corner-tr"></div>
                <div class="card-corner corner-bl"></div>
                <div class="card-corner corner-br"></div>

                <div class="panel-header-mini">
                  <div class="panel-title-group">
                    <IconifyIcon icon="lucide:gauge" class="panel-icon text-blue-400" />
                    <span>实时资源监控</span>
                  </div>
                  <span class="live-pulse-badge"><span class="dot"></span> MONITOR</span>
                </div>

                <!-- 3 Circular Gauges -->
                <div class="grid grid-cols-3 gap-2 my-2 justify-items-center">
                  <div class="flex flex-col items-center">
                    <div class="relative w-14 h-14 flex items-center justify-center">
                      <svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90">
                        <path class="text-slate-800/80" stroke-width="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path class="text-blue-400" stroke-width="3" stroke-dasharray="68, 100" stroke-linecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <span class="absolute text-xs font-bold text-white">68%</span>
                    </div>
                    <span class="text-[10px] text-slate-400 mt-1">GPU 使用率</span>
                  </div>

                  <div class="flex flex-col items-center">
                    <div class="relative w-14 h-14 flex items-center justify-center">
                      <svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90">
                        <path class="text-slate-800/80" stroke-width="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path class="text-indigo-400" stroke-width="3" stroke-dasharray="52, 100" stroke-linecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <span class="absolute text-xs font-bold text-white">52%</span>
                    </div>
                    <span class="text-[10px] text-slate-400 mt-1">CPU 使用率</span>
                  </div>

                  <div class="flex flex-col items-center">
                    <div class="relative w-14 h-14 flex items-center justify-center">
                      <svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90">
                        <path class="text-slate-800/80" stroke-width="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path class="text-emerald-400" stroke-width="3" stroke-dasharray="73, 100" stroke-linecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <span class="absolute text-xs font-bold text-white">73%</span>
                    </div>
                    <span class="text-[10px] text-slate-400 mt-1">内存使用率</span>
                  </div>
                </div>

                <!-- Network Wave Animation -->
                <div class="network-bandwidth-block">
                  <div class="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                    <span>网络带宽 (Mbps)</span>
                    <div class="flex gap-2">
                      <span class="text-blue-400">● 上行带宽</span>
                      <span class="text-purple-400">● 下行带宽</span>
                    </div>
                  </div>
                  <div class="relative h-12 bg-slate-950/40 rounded-lg overflow-hidden border border-slate-900">
                    <svg viewBox="0 0 300 48" class="absolute inset-0 w-full h-full">
                      <!-- Wave path 1 -->
                      <path d="M 0 30 Q 30 10 60 30 T 120 30 T 180 30 T 240 30 T 300 20 L 300 48 L 0 48 Z" fill="rgba(59, 130, 246, 0.08)" stroke="rgba(59, 130, 246, 0.5)" stroke-width="1.5">
                        <animate attributeName="d" dur="5s" repeatCount="indefinite" values="
                          M 0 30 Q 30 10 60 30 T 120 30 T 180 30 T 240 30 T 300 20 L 300 48 L 0 48 Z;
                          M 0 25 Q 30 35 60 20 T 120 25 T 180 15 T 240 35 T 300 30 L 300 48 L 0 48 Z;
                          M 0 30 Q 30 10 60 30 T 120 30 T 180 30 T 240 30 T 300 20 L 300 48 L 0 48 Z
                        " />
                      </path>
                      <!-- Wave path 2 -->
                      <path d="M 0 20 Q 40 40 80 20 T 160 20 T 240 25 T 300 15 L 300 48 L 0 48 Z" fill="rgba(168, 85, 247, 0.04)" stroke="rgba(168, 85, 247, 0.4)" stroke-width="1.2">
                        <animate attributeName="d" dur="8s" repeatCount="indefinite" values="
                          M 0 20 Q 40 40 80 20 T 160 20 T 240 25 T 300 15 L 300 48 L 0 48 Z;
                          M 0 35 Q 40 10 80 30 T 160 25 T 240 15 T 300 35 L 300 48 L 0 48 Z;
                          M 0 20 Q 40 40 80 20 T 160 20 T 240 25 T 300 15 L 300 48 L 0 48 Z
                        " />
                      </path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- CENTER COLUMN: 3D GLOBE & 14-DAY TREND -->
            <div class="column-container center-panel flex-col-container">
              <!-- Center Card 1: 3D Earth Globe -->
              <div class="hud-card flex-[1.4] flex flex-col p-4 relative overflow-hidden justify-between">
                <div class="card-corner corner-tl"></div>
                <div class="card-corner corner-tr"></div>
                <div class="card-corner corner-bl"></div>
                <div class="card-corner corner-br"></div>

                <div class="panel-header-mini text-center flex justify-center flex-col items-center">
                  <div class="text-sm font-bold text-white tracking-wide">全球算力网络实时态势</div>
                  <div class="text-[9px] text-cyan-400 tracking-wider font-mono mt-0.5">GLOBAL COMPUTING NETWORK STATUS</div>
                </div>

                <!-- Globe Canvas Wrapper -->
                <div class="relative flex-1 min-h-[220px] flex items-center justify-center">
                  <div ref="globeContainer" class="w-full h-full absolute inset-0"></div>

                  <!-- Floating Nodes with Glow Lines -->
                  <!-- North America -->
                  <div class="absolute top-4 left-4 hud-node-tag flex flex-col">
                    <span class="node-title flex items-center gap-1"><span class="node-dot bg-cyan-400"></span>北美节点</span>
                    <span class="node-stat mt-0.5">在线 <strong class="text-white">128</strong> · 负载 <strong class="text-cyan-400">68%</strong></span>
                  </div>

                  <!-- Europe -->
                  <div class="absolute bottom-8 left-4 hud-node-tag flex flex-col">
                    <span class="node-title flex items-center gap-1"><span class="node-dot bg-blue-400"></span>欧洲节点</span>
                    <span class="node-stat mt-0.5">在线 <strong class="text-white">96</strong> · 负载 <strong class="text-blue-400">55%</strong></span>
                  </div>

                  <!-- Asia -->
                  <div class="absolute top-4 right-4 hud-node-tag flex flex-col">
                    <span class="node-title flex items-center gap-1"><span class="node-dot bg-emerald-400"></span>亚洲节点</span>
                    <span class="node-stat mt-0.5">在线 <strong class="text-white">256</strong> · 负载 <strong class="text-emerald-400">72%</strong></span>
                  </div>

                  <!-- Other -->
                  <div class="absolute bottom-8 right-4 hud-node-tag flex flex-col">
                    <span class="node-title flex items-center gap-1"><span class="node-dot bg-purple-400"></span>其他节点</span>
                    <span class="node-stat mt-0.5">在线 <strong class="text-white">64</strong> · 负载 <strong class="text-purple-400">45%</strong></span>
                  </div>
                </div>
              </div>

              <!-- Center Card 2: 14-day Trend Chart -->
              <div class="hud-card flex-1 flex flex-col p-4 relative justify-between overflow-hidden">
                <div class="card-corner corner-tl"></div>
                <div class="card-corner corner-tr"></div>
                <div class="card-corner corner-bl"></div>
                <div class="card-corner corner-br"></div>

                <div class="panel-header-mini">
                  <div class="panel-title-group">
                    <IconifyIcon icon="lucide:bar-chart-3" class="panel-icon text-cyan-400" />
                    <span>近 14 日核心数据走势 monitor</span>
                  </div>
                  <div class="hud-legends">
                    <span class="legend-item"><i class="dot cyan"></i> 活跃用户</span>
                    <span class="legend-item"><i class="dot emerald"></i> 成功生成</span>
                  </div>
                </div>

                <div class="bigscreen-chart-wrapper flex-1">
                  <div class="grid-scanlines"></div>
                  <div class="trend-chart-hud">
                    <div v-for="item in overview.daily" :key="item.date" class="hud-trend-day">
                      <div class="hud-bars-column">
                        <div class="bar-item bar-active" :style="{ height: `${Math.max(4, (item.activeUsers / chartMax) * 100)}%` }">
                          <span class="tooltip-popup">活跃: {{ item.activeUsers }}</span>
                        </div>
                        <div class="bar-item bar-gen" :style="{ height: `${Math.max(4, (item.generations / chartMax) * 100)}%` }">
                          <span class="tooltip-popup">生成: {{ item.generations }}</span>
                        </div>
                      </div>
                      <span class="day-text">{{ item.date.slice(5) }}</span>
                    </div>
                  </div>
                </div>

                <div class="telemetry-footer-stats mt-2">
                  <div class="stat-pill">
                    <span class="label">最高单日生成</span>
                    <span class="val text-cyan-400">{{ chartMax }}</span>
                  </div>
                  <div class="stat-pill">
                    <span class="label">模型平均响应</span>
                    <span class="val text-emerald-400">42 ms</span>
                  </div>
                  <div class="stat-pill">
                    <span class="label">全局节点并发</span>
                    <span class="val text-purple-400">100% OK</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- RIGHT COLUMN: LOGS STREAM & HEALTH STATUS -->
            <div class="column-container flex-col-container">
              <!-- Right Card 1: Live Log Stream -->
              <div class="hud-card flex-1 flex flex-col p-4 relative justify-between overflow-hidden">
                <div class="card-corner corner-tl"></div>
                <div class="card-corner corner-tr"></div>
                <div class="card-corner corner-bl"></div>
                <div class="card-corner corner-br"></div>

                <div class="panel-header-mini">
                  <div class="panel-title-group">
                    <IconifyIcon icon="lucide:activity" class="panel-icon text-purple-400 animate-pulse" />
                    <span>实时调用日志流</span>
                  </div>
                  <span class="live-pulse-badge purple"><span class="dot"></span> STREAM</span>
                </div>

                <!-- Log Stream Feed -->
                <div class="log-stream-feed flex-1 overflow-y-auto my-2 pr-1">
                  <div v-if="usageLogs.length > 0" class="log-scroll-track">
                    <div v-for="loop in 2" :key="loop" class="logs-list" :aria-hidden="loop === 2">
                      <div v-for="log in usageLogs" :key="log.id" class="log-item-row">
                        <div class="log-item-header">
                          <span class="log-user">{{ log.userEmail || '匿名用户' }}</span>
                          <span class="log-status-tag" :class="log.status">
                            {{ log.status === 'success' ? 'SUCCESS' : 'FAIL' }}
                          </span>
                        </div>
                        <div class="log-item-details">
                          <span class="log-endpoint">{{ log.endpoint }}</span>
                          <span class="log-time">{{ new Date(log.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }}</span>
                        </div>
                        <div class="log-item-footer">
                          <span class="log-meta text-slate-500">{{ log.model || 'Flux' }} · {{ log.durationMs }}ms</span>
                          <span class="log-credits text-amber-500 font-semibold">-{{ log.creditsUsed }} 积分</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="no-logs-placeholder">
                    <IconifyIcon icon="lucide:terminal" class="size-8 text-slate-700 mb-2 opacity-50" />
                    <span>暂无实时日志流数据</span>
                  </div>
                </div>
              </div>

              <!-- Right Card 2: System Health Status -->
              <div class="hud-card flex-1 flex flex-col p-4 relative justify-between overflow-hidden">
                <div class="card-corner corner-tl"></div>
                <div class="card-corner corner-tr"></div>
                <div class="card-corner corner-bl"></div>
                <div class="card-corner corner-br"></div>

                <div class="panel-header-mini">
                  <div class="panel-title-group">
                    <IconifyIcon icon="lucide:shield-alert" class="panel-icon text-emerald-400" />
                    <span>系统健康状态</span>
                  </div>
                  <span class="status-live-badge font-mono">SYSTEM HEALTH</span>
                </div>

                <div class="flex items-center gap-4 my-2 flex-1">
                  <!-- Circular shield decoration -->
                  <div class="relative w-24 h-24 flex items-center justify-center shrink-0">
                    <div class="absolute inset-0 rounded-full border border-dashed border-emerald-500/30 animate-[spin_10s_linear_infinite]"></div>
                    <div class="absolute inset-2 rounded-full border border-emerald-500/10"></div>
                    <div class="absolute inset-4 rounded-full border border-emerald-500/20 flex items-center justify-center bg-emerald-950/20">
                      <IconifyIcon icon="lucide:shield" class="size-8 text-emerald-400 animate-pulse" />
                    </div>
                  </div>

                  <!-- Checklist Grid -->
                  <div class="flex-1 grid grid-cols-2 gap-x-2 gap-y-2.5">
                    <div class="flex items-center gap-1.5 text-xs text-slate-350">
                      <IconifyIcon icon="lucide:check-circle-2" class="size-3.5 text-emerald-500" />
                      <span>API 服务</span>
                      <span class="text-[10px] text-emerald-400 font-semibold ml-auto">正常</span>
                    </div>
                    <div class="flex items-center gap-1.5 text-xs text-slate-350">
                      <IconifyIcon icon="lucide:check-circle-2" class="size-3.5 text-emerald-500" />
                      <span>数据服务</span>
                      <span class="text-[10px] text-emerald-400 font-semibold ml-auto">正常</span>
                    </div>
                    <div class="flex items-center gap-1.5 text-xs text-slate-350">
                      <IconifyIcon icon="lucide:check-circle-2" class="size-3.5 text-emerald-500" />
                      <span>存储服务</span>
                      <span class="text-[10px] text-emerald-400 font-semibold ml-auto">正常</span>
                    </div>
                    <div class="flex items-center gap-1.5 text-xs text-slate-350">
                      <IconifyIcon icon="lucide:check-circle-2" class="size-3.5 text-emerald-500" />
                      <span>队列服务</span>
                      <span class="text-[10px] text-emerald-400 font-semibold ml-auto">正常</span>
                    </div>
                    <div class="flex items-center gap-1.5 text-xs text-slate-350">
                      <IconifyIcon icon="lucide:check-circle-2" class="size-3.5 text-emerald-500" />
                      <span>监控服务</span>
                      <span class="text-[10px] text-emerald-400 font-semibold ml-auto">正常</span>
                    </div>
                    <div class="flex items-center gap-1.5 text-xs text-slate-350">
                      <IconifyIcon icon="lucide:check-circle-2" class="size-3.5 text-emerald-500" />
                      <span>安全防护</span>
                      <span class="text-[10px] text-emerald-400 font-semibold ml-auto">正常</span>
                    </div>
                  </div>
                </div>

                <div class="border-t border-slate-900/60 pt-2 flex items-center justify-between text-[10px] text-slate-500 mt-1">
                  <span>系统运行状态稳定</span>
                  <span>运行时长: <strong class="text-emerald-400 font-mono">{{ runtimeString }}</strong></span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </Spin>
    </div>
  </Page>
</template>

<style scoped>
.bigscreen-container {
  width: 100%;
  height: 100%;
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #020713;
  color: #e2e8f0;
  padding: 16px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", sans-serif;
  user-select: none;
}

/* Fix Ant Design Spin wrapper to pass flex height to dashboard body */
:deep(.ant-spin-nested-loading),
:deep(.ant-spin-container) {
  height: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

/* Ambient Floating Lights */
.ambient-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.16;
  pointer-events: none;
  z-index: 1;
}
.glow-blue {
  width: 50vw;
  height: 50vw;
  background: radial-gradient(circle, #3b82f6 0%, transparent 70%);
  top: -10%;
  left: 20%;
}
.glow-cyan {
  width: 40vw;
  height: 40vw;
  background: radial-gradient(circle, #06b6d4 0%, transparent 70%);
  bottom: 0;
  right: 10%;
}

/* Sci-Fi HUD Top Header */
.hud-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  background: rgba(10, 14, 26, 0.75);
  border: 1px solid rgba(0, 242, 254, 0.2);
  border-radius: 12px;
  padding: 0 20px;
  backdrop-filter: blur(20px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), inset 0 0 15px rgba(0, 242, 254, 0.08);
  margin-bottom: 16px;
  position: relative;
  z-index: 2;
}

.hud-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hud-logo-icon {
  width: 36px;
  height: 36px;
  background: rgba(6, 182, 212, 0.12);
  border: 1px solid rgba(6, 182, 212, 0.35);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hud-brand-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #38bdf8;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background-color: #00f2fe;
  border-radius: 50%;
  box-shadow: 0 0 10px #00f2fe;
  animation: pulse-glow 2s infinite;
}

@keyframes pulse-glow {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 1; box-shadow: 0 0 16px #00f2fe; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

.hud-header-center {
  text-align: center;
  position: relative;
}

.hud-title-glow {
  font-size: 19px;
  font-weight: 800;
  letter-spacing: 3px;
  background: linear-gradient(to right, #ffffff 0%, #38bdf8 50%, #818cf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 15px rgba(56, 189, 248, 0.45);
}

.hud-title-sub {
  font-size: 9px;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 2px;
}

.header-line-decorator {
  width: 140px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00f2fe, transparent);
  margin: 4px auto 0;
}

.hud-header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.clock-display {
  font-family: monospace, monospace;
  font-size: 13px;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.03);
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.hud-btn {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
  border: 1px solid rgba(6, 182, 212, 0.4);
  color: #38bdf8;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.hud-btn:hover {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.4) 0%, rgba(59, 130, 246, 0.4) 100%);
  box-shadow: 0 0 15px rgba(6, 182, 212, 0.3);
  color: #ffffff;
}

.anim-spin svg {
  animation: spin 1s linear infinite;
}

/* Base HUD Card Styling */
.hud-card {
  position: relative;
  background: rgba(8, 14, 30, 0.7);
  border: 1px solid rgba(0, 242, 254, 0.12);
  border-radius: 12px;
  backdrop-filter: blur(16px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 12px rgba(0, 242, 254, 0.03);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 2;
}

.hud-card:hover {
  border-color: rgba(0, 242, 254, 0.3);
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 242, 254, 0.1);
}

/* Corner Bracket Accents */
.card-corner {
  position: absolute;
  width: 8px;
  height: 8px;
  border-color: rgba(0, 242, 254, 0.45);
  pointer-events: none;
}
.corner-tl { top: -1px; left: -1px; border-top: 2px solid; border-left: 2px solid; border-top-left-radius: 12px; }
.corner-tr { top: -1px; right: -1px; border-top: 2px solid; border-right: 2px solid; border-top-right-radius: 12px; }
.corner-bl { bottom: -1px; left: -1px; border-bottom: 2px solid; border-left: 2px solid; border-bottom-left-radius: 12px; }
.corner-br { bottom: -1px; right: -1px; border-bottom: 2px solid; border-right: 2px solid; border-bottom-right-radius: 12px; }

/* HERO PODS GRID */
.hero-pods-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

@media (max-width: 1200px) {
  .hero-pods-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.pod-card {
  padding: 14px 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.pod-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pod-title {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 500;
}

.pod-tag {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 1px;
}

.pod-tag.cyan { background: rgba(6, 182, 212, 0.15); color: #00f2fe; border: 1px solid rgba(6, 182, 212, 0.3); }
.pod-tag.blue { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
.pod-tag.emerald { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
.pod-tag.purple { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }

.pod-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 8px 0;
}

.pod-main-value .num {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.5px;
  line-height: 1;
}

.pod-main-value .unit {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  margin-left: 4px;
}

/* Circular Chart SVG Meter */
.meter-svg-wrapper {
  width: 42px;
  height: 42px;
  position: relative;
}

.circular-chart {
  width: 100%;
  height: 100%;
}

.circular-chart .circle-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.05);
  stroke-width: 3.8;
}

.circular-chart .circle {
  fill: none;
  stroke-width: 3.8;
  stroke-linecap: round;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
  transition: stroke-dasharray 0.6s ease;
}

.circular-chart.cyan .circle { stroke: #00f2fe; }
.circular-chart.emerald .circle { stroke: #10b981; }

.meter-center-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
}

/* Radar Pulse for Online Pod */
.radar-pulse-wrapper {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid rgba(59, 130, 246, 0.35);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.08);
  overflow: hidden;
}

.radar-circle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px dashed rgba(59, 130, 246, 0.45);
}

.radar-center-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3b82f6;
  box-shadow: 0 0 8px #3b82f6;
}

.radar-sweep {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(59, 130, 246, 0.45) 360deg);
  animation: radar-spin 4s linear infinite;
}

@keyframes radar-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Gauge Arc for Health Pod */
.gauge-arc-wrapper {
  width: 90px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.gauge-value-text {
  font-size: 14px;
  font-weight: 700;
  color: #c084fc;
}

.gauge-bar {
  height: 6px;
  background: linear-gradient(90deg, #a855f7, #ec4899);
  border-radius: 3px;
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.4);
}

.pod-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 8px;
}

.foot-divider {
  color: rgba(255, 255, 255, 0.15);
}

.hud-dashboard-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* MAIN COLUMNS GRID WITH RESPONSIVE ADAPTATION */
.main-columns-grid {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(380px, 1.6fr) minmax(290px, 1fr);
  gap: 16px;
  flex: 1;
  min-height: 0;
}

@media (max-width: 1280px) {
  .main-columns-grid {
    grid-template-columns: 300px 1fr;
  }
  .right-panel {
    grid-column: span 2;
  }
}

@media (max-width: 900px) {
  .main-columns-grid {
    grid-template-columns: 1fr;
  }
  .right-panel {
    grid-column: span 1;
  }
}

.column-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
}

.panel-header-mini {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  margin-bottom: 10px;
}

.panel-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 700;
  color: #ffffff;
}

.status-live-badge {
  font-size: 9px;
  font-weight: 700;
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
  padding: 1.5px 5px;
  border-radius: 4px;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.live-pulse-badge {
  font-size: 9px;
  font-weight: 700;
  color: #00f2fe;
  display: flex;
  align-items: center;
  gap: 4px;
}

.live-pulse-badge.purple {
  color: #c084fc;
}

.live-pulse-badge .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00f2fe;
  box-shadow: 0 0 8px #00f2fe;
}

.live-pulse-badge.purple .dot {
  background: #c084fc;
  box-shadow: 0 0 8px #c084fc;
}

/* Model meters list */
.meter-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meter-info {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
}

.model-name { color: rgba(255, 255, 255, 0.65); }
.model-pct { font-weight: 700; color: #ffffff; }

.meter-track {
  height: 5px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
  overflow: hidden;
}

.meter-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
}

.fill-cyan { background: linear-gradient(90deg, #00f2fe, #38bdf8); box-shadow: 0 0 6px rgba(0, 242, 254, 0.3); }
.fill-blue { background: linear-gradient(90deg, #3b82f6, #60a5fa); box-shadow: 0 0 6px rgba(59, 130, 246, 0.3); }
.fill-purple { background: linear-gradient(90deg, #a855f7, #c084fc); box-shadow: 0 0 6px rgba(168, 85, 247, 0.3); }
.fill-emerald { background: linear-gradient(90deg, #10b981, #34d399); box-shadow: 0 0 6px rgba(16, 185, 129, 0.3); }

/* Provider status mini tags */
.provider-status-block {
  border-top: 1px dashed rgba(255, 255, 255, 0.08);
  padding-top: 8px;
}

.sub-panel-title {
  font-size: 10.5px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 6px;
}

.prov-logo-badge {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.7);
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.prov-logo-badge.plus {
  color: #00f2fe;
  border-color: rgba(0, 242, 254, 0.3);
}

/* Floating HTML Node tags around canvas */
.hud-node-tag {
  background: rgba(8, 20, 48, 0.75);
  border: 1px solid rgba(0, 242, 254, 0.25);
  box-shadow: 0 4px 15px rgba(0, 242, 254, 0.15);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 11px;
  z-index: 10;
  backdrop-filter: blur(8px);
}

.hud-node-tag .node-title {
  font-weight: 700;
  color: #ffffff;
}

.hud-node-tag .node-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}

.hud-node-tag .node-stat {
  color: rgba(255, 255, 255, 0.55);
}

/* CENTER PANEL CHART */
.hud-legends {
  display: flex;
  gap: 12px;
  font-size: 11px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.6);
}

.legend-item .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-item .dot.cyan { background: #00f2fe; box-shadow: 0 0 6px #00f2fe; }
.legend-item .dot.emerald { background: #10b981; box-shadow: 0 0 6px #10b981; }

.bigscreen-chart-wrapper {
  position: relative;
  flex: 1;
  min-height: 120px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px 10px 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.grid-scanlines {
  position: absolute;
  inset: 0;
  background-size: 100% 20px;
  background-image: linear-gradient(to bottom, rgba(0, 242, 254, 0.02) 1px, transparent 1px);
  pointer-events: none;
}

.trend-chart-hud {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 100%;
  position: relative;
  z-index: 2;
}

.hud-trend-day {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
}

.hud-bars-column {
  display: flex;
  gap: 4px;
  align-items: flex-end;
  height: calc(100% - 20px);
  width: 100%;
  justify-content: center;
}

.bar-item {
  width: 9px;
  border-radius: 3px 3px 0 0;
  position: relative;
  transition: height 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
}

.bar-active {
  background: linear-gradient(to top, rgba(0, 242, 254, 0.2), #00f2fe);
  box-shadow: 0 0 8px rgba(0, 242, 254, 0.3);
}

.bar-gen {
  background: linear-gradient(to top, rgba(16, 185, 129, 0.2), #10b981);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.3);
}

.bar-item:hover {
  filter: brightness(1.3);
}

.tooltip-popup {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(10, 14, 26, 0.95);
  border: 1px solid rgba(0, 242, 254, 0.3);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 9px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.bar-item:hover .tooltip-popup {
  opacity: 1;
}

.day-text {
  font-size: 9.5px;
  color: rgba(255, 255, 255, 0.35);
  margin-top: 6px;
}

.telemetry-footer-stats {
  display: flex;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  padding: 6px;
}

.stat-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-pill .label {
  font-size: 9.5px;
  color: rgba(255, 255, 255, 0.4);
}

.stat-pill .val {
  font-size: 12px;
  font-weight: 700;
  margin-top: 1px;
}

/* RIGHT PANEL: LOG FEED */
.log-stream-feed {
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.log-stream-feed::-webkit-scrollbar {
  display: none;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-scroll-track {
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: log-stream-scroll 18s linear infinite;
  will-change: transform;
}

.log-scroll-track:hover {
  animation-play-state: paused;
}

.log-item-row {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  padding: 8px 10px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  transition: background-color 0.2s;
}

.log-item-row:hover {
  background: rgba(255, 255, 255, 0.04);
}

.log-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.log-user {
  font-size: 11px;
  font-weight: 600;
  color: #38bdf8;
}

.log-status-tag {
  font-size: 8px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
}

.log-status-tag.success { background: rgba(16, 185, 129, 0.2); color: #34d399; }
.log-status-tag.error { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }

.log-item-details {
  display: flex;
  justify-content: space-between;
  font-size: 9.5px;
  color: rgba(255, 255, 255, 0.5);
}

.log-item-footer {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: rgba(255, 255, 255, 0.35);
}

.no-logs-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  color: rgba(255, 255, 255, 0.35);
  font-size: 11px;
}

@keyframes log-stream-scroll {
  to { transform: translateY(calc(-50% - 4px)); }
}

@media (prefers-reduced-motion: reduce) {
  .log-scroll-track {
    animation: none;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
