/**
 * system-scheduler.ts
 * ECS System 调度 Demo
 * 展示 SystemScheduler 的阶段执行、依赖排序和并行分析功能
 */

import { World, SystemScheduler, SystemStage } from '@maxellabs/core';
import type { SystemDef, SystemContext } from '@maxellabs/core';

// ==================== 组件定义 ====================

class Position {
  x = 0;
  y = 0;
}

class Velocity {
  x = 0;
  y = 0;
}

class Transform {
  matrix = new Float32Array(16);
}

// ==================== Demo 状态 ====================

interface DemoState {
  world: World;
  scheduler: SystemScheduler;
  isRunning: boolean;
  animationId: number | null;
  executionLog: Array<{ time: number; system: string; stage: string }>;
}

const state: DemoState = {
  world: new World(),
  scheduler: new SystemScheduler(),
  isRunning: false,
  animationId: null,
  executionLog: [],
};

// ==================== System 定义 ====================

// 输入处理 System
const InputSystem: SystemDef = {
  name: 'InputSystem',
  stage: SystemStage.PreUpdate,
  priority: 100,
  execute: (ctx: SystemContext) => {
    logExecution('InputSystem', 'PreUpdate');
    // 模拟输入处理
    simulateWork(1);
  },
};

// 物理 System
const PhysicsSystem: SystemDef = {
  name: 'PhysicsSystem',
  stage: SystemStage.Update,
  priority: 100,
  after: ['InputSystem'],
  execute: (ctx: SystemContext) => {
    logExecution('PhysicsSystem', 'Update');
    // 模拟物理计算
    simulateWork(2);
  },
};

// 移动 System
const MovementSystem: SystemDef = {
  name: 'MovementSystem',
  stage: SystemStage.Update,
  priority: 90,
  after: ['PhysicsSystem'],
  execute: (ctx: SystemContext) => {
    logExecution('MovementSystem', 'Update');
    // 更新位置
    const query = state.world.query({ all: [Position, Velocity] });
    query.forEach((entity, [pos, vel]) => {
      (pos as Position).x += (vel as Velocity).x * ctx.deltaTime;
      (pos as Position).y += (vel as Velocity).y * ctx.deltaTime;
    });
    simulateWork(1);
  },
};

// 碰撞检测 System
const CollisionSystem: SystemDef = {
  name: 'CollisionSystem',
  stage: SystemStage.Update,
  priority: 80,
  after: ['MovementSystem'],
  execute: (ctx: SystemContext) => {
    logExecution('CollisionSystem', 'Update');
    // 模拟碰撞检测
    simulateWork(3);
  },
};

// Transform 更新 System
const TransformSystem: SystemDef = {
  name: 'TransformSystem',
  stage: SystemStage.PostUpdate,
  priority: 100,
  after: ['CollisionSystem'],
  execute: (ctx: SystemContext) => {
    logExecution('TransformSystem', 'PostUpdate');
    // 更新变换矩阵
    simulateWork(2);
  },
};

// 动画 System
const AnimationSystem: SystemDef = {
  name: 'AnimationSystem',
  stage: SystemStage.PostUpdate,
  priority: 90,
  execute: (ctx: SystemContext) => {
    logExecution('AnimationSystem', 'PostUpdate');
    // 更新动画
    simulateWork(1);
  },
};

// 渲染准备 System
const RenderPrepSystem: SystemDef = {
  name: 'RenderPrepSystem',
  stage: SystemStage.Render,
  priority: 100,
  after: ['TransformSystem', 'AnimationSystem'],
  execute: (ctx: SystemContext) => {
    logExecution('RenderPrepSystem', 'Render');
    // 准备渲染数据
    simulateWork(2);
  },
};

// 渲染 System
const RenderSystem: SystemDef = {
  name: 'RenderSystem',
  stage: SystemStage.Render,
  priority: 90,
  after: ['RenderPrepSystem'],
  execute: (ctx: SystemContext) => {
    logExecution('RenderSystem', 'Render');
    // 执行渲染
    simulateWork(3);
  },
};

// 所有 System 列表
const allSystems: SystemDef[] = [
  InputSystem,
  PhysicsSystem,
  MovementSystem,
  CollisionSystem,
  TransformSystem,
  AnimationSystem,
  RenderPrepSystem,
  RenderSystem,
];

// ==================== 辅助函数 ====================

function simulateWork(ms: number): void {
  const start = performance.now();
  while (performance.now() - start < ms) {
    // 模拟工作
  }
}

function logExecution(system: string, stage: string): void {
  state.executionLog.push({
    time: performance.now(),
    system,
    stage,
  });
}

function log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
  const logArea = document.getElementById('logArea');
  if (!logArea) {
    return;
  }

  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logArea.insertBefore(entry, logArea.firstChild);

  while (logArea.children.length > 15) {
    logArea.removeChild(logArea.lastChild!);
  }
}

// ==================== UI 更新函数 ====================

function updateStats(): void {
  const stats = state.scheduler.getStats();

  const frameCountEl = document.getElementById('frameCount');
  const systemCountEl = document.getElementById('systemCount');
  const totalTimeEl = document.getElementById('totalTime');
  const parallelBatchesEl = document.getElementById('parallelBatches');

  if (frameCountEl) {
    frameCountEl.textContent = String(stats.frameCount);
  }
  if (systemCountEl) {
    systemCountEl.textContent = String(stats.systemCount);
  }
  if (totalTimeEl) {
    totalTimeEl.textContent = stats.totalTime.toFixed(2);
  }
  if (parallelBatchesEl) {
    parallelBatchesEl.textContent = String(stats.parallelBatches || 0);
  }
}

function updateSystemList(): void {
  const container = document.getElementById('systemList');
  if (!container) {
    return;
  }

  container.innerHTML = '';

  for (const system of allSystems) {
    const isEnabled = state.scheduler.isSystemEnabled(system.name);
    const card = document.createElement('div');
    card.className = `system-card ${isEnabled ? 'enabled' : 'disabled'}`;

    const stageName = getStageDisplayName(system.stage);
    const dependencies = system.after?.join(', ') || '无';

    card.innerHTML = `
      <div class="system-header">
        <span class="system-name">${system.name}</span>
        <span class="system-stage stage-${stageName}">${stageName}</span>
      </div>
      <div class="system-info">
        优先级: ${system.priority} | 依赖: ${dependencies}
      </div>
      <div class="system-controls">
        <button onclick="toggleSystem('${system.name}')" class="btn btn-sm ${isEnabled ? 'btn-warning' : 'btn-success'}">
          ${isEnabled ? '禁用' : '启用'}
        </button>
      </div>
    `;

    container.appendChild(card);
  }
}

function updateDAGView(): void {
  const container = document.getElementById('dagView');
  if (!container) {
    return;
  }

  // 按阶段分组显示执行顺序
  const stages = [SystemStage.PreUpdate, SystemStage.Update, SystemStage.PostUpdate, SystemStage.Render];
  const stageNames = ['PreUpdate', 'Update', 'PostUpdate', 'Render'];

  let html = '';
  for (let i = 0; i < stages.length; i++) {
    const stageSystems = allSystems.filter((s) => s.stage === stages[i]);
    if (stageSystems.length === 0) {
      continue;
    }

    html += `<div style="margin-bottom: 12px;">`;
    html += `<div style="color: #888; font-size: 12px; margin-bottom: 4px;">${stageNames[i]}:</div>`;
    html += stageSystems
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .map((s) => {
        const isEnabled = state.scheduler.isSystemEnabled(s.name);
        return `<span class="dag-node" style="opacity: ${isEnabled ? 1 : 0.4}">${s.name}</span>`;
      })
      .join('<span class="dag-arrow">→</span>');
    html += `</div>`;
  }

  container.innerHTML = html;
}

function updateTimeline(): void {
  const container = document.getElementById('timeline');
  if (!container) {
    return;
  }

  if (state.executionLog.length === 0) {
    container.innerHTML = '<div style="color: #888;">执行一帧后显示时间线</div>';
    return;
  }

  // 只显示最近一帧的执行记录
  const recentLogs = state.executionLog.slice(-8);
  const baseTime = recentLogs[0]?.time || 0;

  container.innerHTML = recentLogs
    .map((log) => {
      const relativeTime = (log.time - baseTime).toFixed(2);
      return `
      <div class="timeline-row">
        <span class="timeline-time">+${relativeTime}ms</span>
        <span class="timeline-event stage-${log.stage}">${log.system}</span>
      </div>
    `;
    })
    .join('');
}

function getStageDisplayName(stage: SystemStage): string {
  switch (stage) {
    case SystemStage.PreUpdate:
      return 'PreUpdate';
    case SystemStage.Update:
      return 'Update';
    case SystemStage.PostUpdate:
      return 'PostUpdate';
    case SystemStage.Render:
      return 'Render';
    default:
      return 'Unknown';
  }
}

// ==================== 操作函数 ====================

function stepFrame(): void {
  state.executionLog = [];
  state.scheduler.update(state.world, 16.67); // 模拟 60fps
  updateStats();
  updateTimeline();
  log(`执行帧 ${state.scheduler.getStats().frameCount}`, 'success');
}

function toggleAutoRun(): void {
  state.isRunning = !state.isRunning;
  const btn = document.getElementById('autoRunBtn');

  if (state.isRunning) {
    if (btn) {
      btn.textContent = '停止自动运行';
      btn.className = 'btn btn-danger';
    }
    runLoop();
    log('开始自动运行', 'info');
  } else {
    if (state.animationId) {
      cancelAnimationFrame(state.animationId);
      state.animationId = null;
    }
    if (btn) {
      btn.textContent = '开始自动运行';
      btn.className = 'btn btn-success';
    }
    log('停止自动运行', 'warning');
  }
}

function runLoop(): void {
  if (!state.isRunning) {
    return;
  }

  state.executionLog = [];
  state.scheduler.update(state.world, 16.67);
  updateStats();
  updateTimeline();

  state.animationId = requestAnimationFrame(runLoop);
}

function toggleSystem(name: string): void {
  const isEnabled = state.scheduler.isSystemEnabled(name);
  state.scheduler.setSystemEnabled(name, !isEnabled);
  updateSystemList();
  updateDAGView();
  log(`${name} 已${isEnabled ? '禁用' : '启用'}`, isEnabled ? 'warning' : 'success');
}

function resetDemo(): void {
  if (state.isRunning) {
    toggleAutoRun();
  }

  // 重新创建调度器
  state.scheduler = new SystemScheduler();
  state.scheduler.enableParallelExecution(true);

  // 重新添加所有 System
  for (const system of allSystems) {
    state.scheduler.addSystem(system);
  }

  state.executionLog = [];

  updateStats();
  updateSystemList();
  updateDAGView();
  updateTimeline();

  log('Demo 已重置', 'info');
}

// ==================== 初始化 ====================

function init(): void {
  // 注册组件
  state.world.registerComponent(Position);
  state.world.registerComponent(Velocity);
  state.world.registerComponent(Transform);

  // 创建一些测试实体
  for (let i = 0; i < 10; i++) {
    const entity = state.world.createEntity();
    state.world.addComponent(entity, Position, { x: Math.random() * 100, y: Math.random() * 100 });
    state.world.addComponent(entity, Velocity, { x: Math.random() * 10 - 5, y: Math.random() * 10 - 5 });
  }

  // 启用并行执行分析
  state.scheduler.enableParallelExecution(true);

  // 添加所有 System
  for (const system of allSystems) {
    state.scheduler.addSystem(system);
  }

  // 绑定全局函数
  (window as any).stepFrame = stepFrame;
  (window as any).toggleAutoRun = toggleAutoRun;
  (window as any).toggleSystem = toggleSystem;
  (window as any).resetDemo = resetDemo;

  // 初始化 UI
  updateStats();
  updateSystemList();
  updateDAGView();
  updateTimeline();

  log('System 调度 Demo 已初始化', 'success');
  log(`已注册 ${allSystems.length} 个 System`, 'info');
}

// 启动 Demo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
