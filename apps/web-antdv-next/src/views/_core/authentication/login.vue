<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const rememberMe = ref(true);
const showPassword = ref(false);

const emailError = ref('');
const passwordError = ref('');
const formError = ref('');

const REMEMBER_ME_KEY = `REMEMBER_ME_USERNAME_${location.hostname}`;

// Canvas Particle Animation Background
const canvasRef = ref<HTMLCanvasElement | null>(null);
let animFrameId: number | null = null;

function initParticleCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const handleResize = () => {
    if (!canvas) return;
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', handleResize);

  // Particles setup
  const particleCount = Math.min(Math.floor((width * height) / 18000), 70);
  const particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    alpha: number;
  }> = [];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.5 + 1,
      alpha: Math.random() * 0.5 + 0.2,
    });
  }

  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    // Render particles & connecting lines
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00f2fe';
      ctx.fill();

      // Connect near particles
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.15 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.8;
          ctx.shadowBlur = 0;
          ctx.stroke();
        }
      }
    }

    animFrameId = requestAnimationFrame(render);
  }

  render();
}

onMounted(() => {
  const saved = localStorage.getItem(REMEMBER_ME_KEY);
  if (saved) {
    email.value = saved;
    rememberMe.value = true;
  }
  initParticleCanvas();
});

onUnmounted(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId);
});

function clearEmail() {
  email.value = '';
  emailError.value = '';
}

function quickFillDemo() {
  email.value = 'admin@makle.cloud';
  password.value = 'admin123456';
  emailError.value = '';
  passwordError.value = '';
  formError.value = '';
}

function validate() {
  let valid = true;
  emailError.value = '';
  passwordError.value = '';
  formError.value = '';

  if (!email.value) {
    emailError.value = '请输入账号';
    valid = false;
  }

  if (!password.value) {
    passwordError.value = '请输入密码';
    valid = false;
  }

  return valid;
}

async function handleLogin() {
  if (!validate()) return;

  if (rememberMe.value) {
    localStorage.setItem(REMEMBER_ME_KEY, email.value.trim());
  } else {
    localStorage.removeItem(REMEMBER_ME_KEY);
  }

  try {
    await authStore.authLogin({
      username: email.value.trim(),
      password: password.value,
    });
  } catch (err: any) {
    formError.value = err?.message || '登录验证失败，请核对账号密码';
  }
}
</script>

<template>
  <div class="login-container">
    <!-- Sci-Fi Canvas Background -->
    <canvas ref="canvasRef" class="particle-canvas"></canvas>

    <!-- Glowing Ambient Rays -->
    <div class="ambient-glow glow-top-cyan"></div>
    <div class="ambient-glow glow-bottom-indigo"></div>
    <div class="ambient-glow glow-center-purple"></div>

    <!-- Main Desktop Studio Window -->
    <div class="desktop-window">
      <!-- Titlebar -->
      <div class="window-titlebar">
        <div class="window-controls">
          <span class="control-dot close" title="关闭窗口">
            <svg class="dot-icon" viewBox="0 0 12 12"><path d="M3 3l6 6m0-6L3 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </span>
          <span class="control-dot minimize" title="最小化">
            <svg class="dot-icon" viewBox="0 0 12 12"><path d="M2 6h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </span>
          <span class="control-dot maximize" title="最大化">
            <svg class="dot-icon" viewBox="0 0 12 12"><rect x="2.5" y="2.5" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>
          </span>
        </div>

        <div class="window-title">
          <span class="status-radar-dot"></span>
          LUMORA ADMIN STUDIO · CONTROL CENTER
        </div>

        <div class="window-actions-dummy"></div>
      </div>

      <!-- Main Split View Container -->
      <div class="window-content">
        <!-- Left Panel: Holographic Studio Branding -->
        <div class="visual-panel">
          <div class="cyber-grid-overlay"></div>
          <div class="cyber-scan-line"></div>

          <div class="brand-showcase">
            <!-- Multi-layered Holographic Lens Icon -->
            <div class="hologram-wrapper">
              <div class="ring-outer"></div>
              <div class="ring-middle"></div>
              <div class="core-icon-box">
                <svg viewBox="0 0 100 100" class="hologram-svg">
                  <defs>
                    <linearGradient id="cyber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#00f2fe" />
                      <stop offset="50%" stop-color="#3b82f6" />
                      <stop offset="100%" stop-color="#a855f7" />
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="url(#cyber-grad)" stroke-width="2" stroke-dasharray="6 8" class="spin-slow" />
                  <circle cx="50" cy="50" r="28" fill="none" stroke="url(#cyber-grad)" stroke-width="3" />
                  <polygon points="50,32 63,42 63,58 50,68 37,58 37,42" fill="url(#cyber-grad)" class="pulse-core" />
                </svg>
              </div>
            </div>

            <div class="brand-text-block">
              <h1 class="brand-title">LUMORA</h1>
              <p class="brand-sub">STUDIO GRAPHICS MIDDLEWARE</p>
              <div class="accent-bar"></div>
              <p class="brand-desc">新一代智能图像生成与高可用中控系统</p>
            </div>

            <!-- Telemetry Badges -->
            <div class="telemetry-badges font-mono">
              <div class="badge-item">
                <span class="dot-green"></span>
                <span>GPU CLUSTER · ONLINE</span>
              </div>
              <div class="badge-item">
                <span>TLS 1.3 ENCRYPTED</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Panel: Precise Micro-Interactions Login Form -->
        <div class="form-panel">
          <div class="form-wrapper">
            <div class="form-header">
              <h2>账号安全接入</h2>
              <p>请在下方输入您的管理员凭据</p>
            </div>

            <!-- Global Error Banner -->
            <div v-if="formError" class="global-error-banner">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4 mr-2 shrink-0">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{{ formError }}</span>
            </div>

            <form @submit.prevent="handleLogin" class="auth-form">
              <!-- Field 1: Username / Email (ONLY DELETE/CLEAR BUTTON ON THE RIGHT) -->
              <div class="input-group">
                <label for="email">管理员账号 / 邮箱</label>
                <div class="input-wrapper" :class="{ 'has-error': emailError }">
                  <span class="left-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </span>
                  <input
                    id="email"
                    type="email"
                    v-model="email"
                    placeholder="请输入账号"
                    autocomplete="username"
                  />
                  <!-- ONLY Clear/Delete icon for Email -->
                  <button
                    v-if="email"
                    type="button"
                    class="action-btn clear-btn"
                    title="一键清空账号"
                    @click="clearEmail"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                <div v-if="emailError" class="error-msg">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-3 inline mr-1"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {{ emailError }}
                </div>
              </div>

              <!-- Field 2: Password (ONLY EYE VIEW TOGGLE BUTTON ON THE RIGHT) -->
              <div class="input-group">
                <label for="password">登录密码</label>
                <div class="input-wrapper" :class="{ 'has-error': passwordError }">
                  <span class="left-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </span>
                  <input
                    id="password"
                    :type="showPassword ? 'text' : 'password'"
                    v-model="password"
                    placeholder="请输入密码"
                    autocomplete="current-password"
                  />
                  <!-- ONLY Eye View Toggle button for Password -->
                  <button
                    type="button"
                    class="action-btn eye-btn"
                    :class="{ 'is-viewing': showPassword }"
                    :title="showPassword ? '隐藏明文密码' : '查看明文密码'"
                    @click="showPassword = !showPassword"
                  >
                    <!-- Eye Open Icon -->
                    <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <!-- Eye Closed / Off Icon -->
                    <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  </button>
                </div>
                <div v-if="passwordError" class="error-msg">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-3 inline mr-1"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {{ passwordError }}
                </div>
              </div>

              <!-- Options -->
              <div class="form-options">
                <label class="remember-option">
                  <input type="checkbox" v-model="rememberMe" />
                  <span class="checkbox-box">
                    <svg class="check-mark" viewBox="0 0 12 10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="1.5 5 4.5 8 10.5 1.5"></polyline>
                    </svg>
                  </span>
                  <span class="label-txt">记住我的登录状态</span>
                </label>
                <a href="#" class="forgot-link" @click.prevent="formError = '请联系系统管理员进行身份核查与凭据重置'">忘记密码?</a>
              </div>

              <!-- Primary Submit Button -->
              <button
                type="submit"
                class="submit-btn"
                :disabled="authStore.loginLoading"
              >
                <span v-if="authStore.loginLoading" class="loading-flex">
                  <svg class="animate-spin size-4 text-white mr-2" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  正在验证凭据...
                </span>
                <span v-else class="btn-text">
                  立即登录
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background-color: #04060d;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", sans-serif;
  user-select: none;
}

/* Canvas Particle Animation */
.particle-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

/* Ambient Radial Lights */
.ambient-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  z-index: 2;
  opacity: 0.18;
}

.glow-top-cyan {
  width: 50vw;
  height: 50vw;
  background: radial-gradient(circle, #00f2fe 0%, transparent 70%);
  top: -20%;
  left: 15%;
  animation: float-glow 22s infinite alternate ease-in-out;
}

.glow-bottom-indigo {
  width: 45vw;
  height: 45vw;
  background: radial-gradient(circle, #3b82f6 0%, transparent 70%);
  bottom: -15%;
  right: 10%;
  animation: float-glow 18s infinite alternate-reverse ease-in-out;
}

.glow-center-purple {
  width: 35vw;
  height: 35vw;
  background: radial-gradient(circle, #a855f7 0%, transparent 70%);
  top: 30%;
  right: 25%;
  animation: float-glow 26s infinite alternate ease-in-out;
}

@keyframes float-glow {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(5%, 8%) scale(1.1); }
  100% { transform: translate(-5%, -5%) scale(0.9); }
}

/* Desktop App Window Container */
.desktop-window {
  position: relative;
  z-index: 10;
  width: 920px;
  height: 590px;
  background: rgba(11, 15, 27, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  backdrop-filter: blur(30px);
  box-shadow: 0 35px 70px -15px rgba(0, 0, 0, 0.75),
              0 0 50px rgba(0, 242, 254, 0.07);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: window-fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes window-fade-in {
  from { opacity: 0; transform: scale(0.96) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* Window Titlebar */
.window-titlebar {
  height: 42px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.window-controls {
  display: flex;
  gap: 8px;
}

.control-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.7);
  transition: transform 0.2s;
}

.control-dot.close { background-color: #ef4444; }
.control-dot.minimize { background-color: #f59e0b; }
.control-dot.maximize { background-color: #10b981; }

.control-dot:hover { transform: scale(1.1); }

.dot-icon {
  width: 8px;
  height: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.control-dot:hover .dot-icon { opacity: 1; }

.window-title {
  color: rgba(255, 255, 255, 0.45);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-radar-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00f2fe;
  box-shadow: 0 0 8px #00f2fe;
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 0.7; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.2); box-shadow: 0 0 12px #00f2fe; }
}

.quick-fill-btn {
  background: rgba(6, 182, 212, 0.1);
  border: 1px solid rgba(6, 182, 212, 0.3);
  color: #38bdf8;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 99px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.quick-fill-btn:hover {
  background: rgba(6, 182, 212, 0.25);
  color: #ffffff;
  box-shadow: 0 0 14px rgba(6, 182, 212, 0.3);
}

/* Split Window Content */
.window-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* Visual Hologram Left Panel */
.visual-panel {
  width: 44%;
  background: linear-gradient(135deg, rgba(14, 18, 35, 0.95) 0%, rgba(7, 9, 18, 0.98) 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.cyber-grid-overlay {
  position: absolute;
  inset: 0;
  background-size: 28px 28px;
  background-image: 
    linear-gradient(to right, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
}

.cyber-scan-line {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 242, 254, 0.04) 50%, transparent 100%);
  background-size: 100% 12px;
  pointer-events: none;
}

.brand-showcase {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hologram-wrapper {
  width: 110px;
  height: 110px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring-outer {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(0, 242, 254, 0.15);
  border-radius: 50%;
}

.ring-middle {
  position: absolute;
  inset: 10px;
  border: 1px dashed rgba(59, 130, 246, 0.3);
  border-radius: 50%;
  animation: spin-middle 20s linear infinite;
}

@keyframes spin-middle {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.core-icon-box {
  width: 70px;
  height: 70px;
}

.hologram-svg {
  width: 100%;
  height: 100%;
}

.spin-slow {
  transform-origin: center;
  animation: spin-slow-anim 16s linear infinite reverse;
}

@keyframes spin-slow-anim {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.pulse-core {
  animation: pulse-core-anim 3s ease-in-out infinite alternate;
  transform-origin: center;
}

@keyframes pulse-core-anim {
  0% { filter: drop-shadow(0 0 2px rgba(0, 242, 254, 0.4)); transform: scale(0.96); }
  100% { filter: drop-shadow(0 0 15px rgba(168, 85, 247, 0.9)); transform: scale(1.04); }
}

.brand-title {
  color: #ffffff;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 6px;
  margin: 16px 0 0 0;
  background: linear-gradient(to right, #ffffff 0%, #38bdf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-sub {
  color: rgba(255, 255, 255, 0.35);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 2px;
  margin-top: 4px;
}

.accent-bar {
  width: 32px;
  height: 2px;
  background: linear-gradient(90deg, #00f2fe, #a855f7);
  margin: 14px auto;
  border-radius: 1px;
}

.brand-desc {
  color: rgba(255, 255, 255, 0.5);
  font-size: 11.5px;
  margin: 0;
  text-align: center;
}

.telemetry-badges {
  margin-top: 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.badge-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 4px 12px;
  border-radius: 99px;
  color: rgba(255, 255, 255, 0.45);
  font-size: 9.5px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot-green {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}

/* Right Panel: Precise Login Form */
.form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 36px 48px;
}

.form-wrapper {
  width: 100%;
  max-width: 350px;
}

.form-header {
  margin-bottom: 24px;
}

.form-header h2 {
  color: #ffffff;
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.3px;
}

.form-header p {
  color: rgba(255, 255, 255, 0.4);
  font-size: 12.5px;
  margin: 6px 0 0 0;
}

.global-error-banner {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 10px 12px;
  border-radius: 8px;
  color: #fca5a5;
  font-size: 12px;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  animation: slide-down 0.3s ease-out forwards;
}

@keyframes slide-down {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-group label {
  color: rgba(255, 255, 255, 0.55);
  font-size: 11.5px;
  font-weight: 600;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  height: 42px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.input-wrapper:hover {
  border-color: rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.05);
}

.input-wrapper:focus-within {
  background: rgba(10, 14, 26, 0.95);
  border-color: #38bdf8;
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.18),
              0 0 15px rgba(56, 189, 248, 0.1);
}

.input-wrapper.has-error {
  border-color: #ef4444 !important;
}

.input-wrapper.has-error:focus-within {
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2),
              0 0 15px rgba(239, 68, 68, 0.1) !important;
}

.left-icon {
  position: absolute;
  left: 12px;
  color: rgba(255, 255, 255, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  pointer-events: none;
}

.input-wrapper:focus-within .left-icon {
  color: #38bdf8;
}

.left-icon svg {
  width: 16px;
  height: 16px;
}

/* Precise Input Padding so text never collides with left or right icons! */
.input-wrapper input {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  padding: 0 40px 0 38px; /* 38px left for left-icon, 40px right for single action button */
  color: #ffffff;
  font-size: 13.5px;
}

.input-wrapper input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

/* Dedicated Action Button on the Right (Clear or Eye View) */
.action-btn {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.35);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

/* Clear Button Specific Styling */
.clear-btn:hover {
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.15);
}

.clear-btn svg {
  width: 13px;
  height: 13px;
}

/* Eye Toggle Button Specific Styling */
.eye-btn:hover {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
}

.eye-btn.is-viewing {
  color: #00f2fe;
}

.eye-btn svg {
  width: 16px;
  height: 16px;
  transition: transform 0.2s ease;
}

.eye-btn:active svg {
  transform: scale(0.9);
}

.error-msg {
  color: #f87171;
  font-size: 11px;
  margin-top: 2px;
  display: flex;
  align-items: center;
}

/* Checkbox & Options */
.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;
}

.remember-option {
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
}

.remember-option input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkbox-box {
  width: 16px;
  height: 16px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 4px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
  transition: all 0.2s ease;
}

.check-mark {
  width: 10px;
  height: 10px;
  color: #ffffff;
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.remember-option:hover .checkbox-box {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.08);
}

.remember-option input:checked ~ .checkbox-box {
  background: linear-gradient(135deg, #0284c7, #4f46e5);
  border-color: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
}

.remember-option input:checked ~ .checkbox-box .check-mark {
  opacity: 1;
  transform: scale(1);
}

.label-txt {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.forgot-link {
  color: #38bdf8;
  font-size: 12px;
  text-decoration: none;
  transition: color 0.2s;
}

.forgot-link:hover {
  color: #7dd3fc;
  text-decoration: underline;
}

/* Primary Submit Button */
.submit-btn {
  width: 100%;
  height: 44px;
  background: linear-gradient(135deg, #0284c7 0%, #4f46e5 100%);
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(2, 132, 199, 0.35);
  margin-top: 6px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  background: linear-gradient(135deg, #0369a1 0%, #4338ca 100%);
  box-shadow: 0 6px 24px rgba(2, 132, 199, 0.5), 0 0 15px rgba(0, 242, 254, 0.2);
}

.submit-btn:hover:not(:disabled) .arrow-icon {
  transform: translateX(3px);
}

.arrow-icon {
  transition: transform 0.2s ease;
}

.submit-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.submit-btn:disabled {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.25);
  cursor: not-allowed;
  box-shadow: none;
  border: 1px solid rgba(255, 255, 255, 0.04);
}
</style>
