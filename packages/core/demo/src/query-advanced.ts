/**
 * query-advanced.ts
 * ECS Query 高级用法 Demo
 * 展示 Query 的过滤器组合、遍历方法和性能特性
 */

import { World, EntityId } from '@maxellabs/core';

// ==================== 组件定义 ====================

class Position {
  x = 0;
  y = 0;
  z = 0;
}

class Velocity {
  x = 0;
  y = 0;
  z = 0;
}

class Health {
  current = 100;
  max = 100;
}

class Damage {
  value = 10;
}

class Dead {}

// ==================== Demo 状态 ====================

interface DemoState {
  world: World;
}

const state: DemoState = {
  world: new World(),
};

// ==================== 辅助函数 ====================

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
  const stats = state.world.getStats();

  const entityCountEl = document.getElementById('entityCount');
  const totalEntitiesEl = document.getElementById('totalEntities');
  const archetypeCountEl = document.getElementById('archetypeCount');
  const queryCountEl = document.getElementById('queryCount');

  if (entityCountEl) {
    entityCountEl.textContent = String(stats.entities);
  }
  if (totalEntitiesEl) {
    totalEntitiesEl.textContent = String(stats.entities);
  }
  if (archetypeCountEl) {
    archetypeCountEl.textContent = String(stats.archetypes);
  }
  if (queryCountEl) {
    queryCountEl.textContent = String(stats.queries);
  }
}

function updateEntityGrid(): void {
  const container = document.getElementById('entityGrid');
  if (!container) {
    return;
  }

  container.innerHTML = '';

  const entities = state.world.getAllEntities();

  for (const entity of entities) {
    const hasPosition = state.world.hasComponent(entity, Position);
    const hasVelocity = state.world.hasComponent(entity, Velocity);
    const hasHealth = state.world.hasComponent(entity, Health);
    const isDead = state.world.hasComponent(entity, Dead);

    let colorClass = '';
    if (hasPosition && hasVelocity) {
      colorClass = 'has-both';
    } else if (hasPosition) {
      colorClass = 'has-position';
    } else if (hasVelocity) {
      colorClass = 'has-velocity';
    }

    if (hasHealth) {
      colorClass += ' has-health';
    }
    if (isDead) {
      colorClass += ' is-dead';
    }

    const dot = document.createElement('div');
    dot.className = `entity-dot ${colorClass}`;
    dot.innerHTML = `
      <div>${EntityId.index(entity)}</div>
    `;
    dot.onclick = () => {
      log(`Entity ${EntityId.index(entity)}: P=${hasPosition} V=${hasVelocity} H=${hasHealth} D=${isDead}`, 'info');
    };

    container.appendChild(dot);
  }
}

function updateQueryTime(ms: number): void {
  const el = document.getElementById('lastQueryTime');
  if (el) {
    el.textContent = `${ms.toFixed(3)} ms`;
  }
}

// ==================== 查询函数 ====================

function runQuery1(): void {
  const start = performance.now();

  const query = state.world.query({ all: [Position] });
  const count = query.getEntityCount();

  const elapsed = performance.now() - start;
  updateQueryTime(elapsed);

  const countEl = document.getElementById('query1Count');
  if (countEl) {
    countEl.textContent = `${count} 个`;
  }

  const resultsEl = document.getElementById('query1Results');
  if (resultsEl) {
    const results: string[] = [];
    query.forEach((entity, [pos]) => {
      const p = pos as Position;
      results.push(`
        <div class="result-row">
          <span class="result-entity">Entity ${EntityId.index(entity)}</span>
          <span class="result-components">Position(${p.x.toFixed(1)}, ${p.y.toFixed(1)})</span>
        </div>
      `);
    });
    resultsEl.innerHTML =
      results.slice(0, 10).join('') +
      (results.length > 10 ? `<div class="result-row">... 还有 ${results.length - 10} 个</div>` : '');
  }

  log(`Query 1: 找到 ${count} 个有 Position 的实体 (${elapsed.toFixed(3)}ms)`, 'success');
}

function runQuery2(): void {
  const start = performance.now();

  const query = state.world.query({ all: [Position, Velocity] });
  const count = query.getEntityCount();

  const elapsed = performance.now() - start;
  updateQueryTime(elapsed);

  const countEl = document.getElementById('query2Count');
  if (countEl) {
    countEl.textContent = `${count} 个`;
  }

  const resultsEl = document.getElementById('query2Results');
  if (resultsEl) {
    const results: string[] = [];
    query.forEach((entity, [pos, vel]) => {
      const p = pos as Position;
      const v = vel as Velocity;
      results.push(`
        <div class="result-row">
          <span class="result-entity">Entity ${EntityId.index(entity)}</span>
          <span class="result-components">Pos(${p.x.toFixed(1)}, ${p.y.toFixed(1)}) Vel(${v.x.toFixed(1)}, ${v.y.toFixed(1)})</span>
        </div>
      `);
    });
    resultsEl.innerHTML =
      results.slice(0, 10).join('') +
      (results.length > 10 ? `<div class="result-row">... 还有 ${results.length - 10} 个</div>` : '');
  }

  log(`Query 2: 找到 ${count} 个有 Position+Velocity 的实体 (${elapsed.toFixed(3)}ms)`, 'success');
}

function runQuery3(): void {
  const start = performance.now();

  const query = state.world.query({ all: [Position], none: [Dead] });
  const count = query.getEntityCount();

  const elapsed = performance.now() - start;
  updateQueryTime(elapsed);

  const countEl = document.getElementById('query3Count');
  if (countEl) {
    countEl.textContent = `${count} 个`;
  }

  const resultsEl = document.getElementById('query3Results');
  if (resultsEl) {
    const results: string[] = [];
    query.forEach((entity, [pos]) => {
      const p = pos as Position;
      results.push(`
        <div class="result-row">
          <span class="result-entity">Entity ${EntityId.index(entity)}</span>
          <span class="result-components">Position(${p.x.toFixed(1)}, ${p.y.toFixed(1)}) [存活]</span>
        </div>
      `);
    });
    resultsEl.innerHTML =
      results.slice(0, 10).join('') +
      (results.length > 10 ? `<div class="result-row">... 还有 ${results.length - 10} 个</div>` : '');
  }

  log(`Query 3: 找到 ${count} 个有 Position 但没有 Dead 的实体 (${elapsed.toFixed(3)}ms)`, 'success');
}

function runQuery4(): void {
  const start = performance.now();

  const query = state.world.query({ any: [Health, Damage] });
  const count = query.getEntityCount();

  const elapsed = performance.now() - start;
  updateQueryTime(elapsed);

  const countEl = document.getElementById('query4Count');
  if (countEl) {
    countEl.textContent = `${count} 个`;
  }

  const resultsEl = document.getElementById('query4Results');
  if (resultsEl) {
    const results: string[] = [];
    query.forEach((entity) => {
      const hasHealth = state.world.hasComponent(entity, Health);
      const hasDamage = state.world.hasComponent(entity, Damage);
      const components = [];
      if (hasHealth) {
        const h = state.world.getComponent(entity, Health)!;
        components.push(`Health(${h.current}/${h.max})`);
      }
      if (hasDamage) {
        const d = state.world.getComponent(entity, Damage)!;
        components.push(`Damage(${d.value})`);
      }
      results.push(`
        <div class="result-row">
          <span class="result-entity">Entity ${EntityId.index(entity)}</span>
          <span class="result-components">${components.join(' ')}</span>
        </div>
      `);
    });
    resultsEl.innerHTML =
      results.slice(0, 10).join('') +
      (results.length > 10 ? `<div class="result-row">... 还有 ${results.length - 10} 个</div>` : '');
  }

  log(`Query 4: 找到 ${count} 个有 Health 或 Damage 的实体 (${elapsed.toFixed(3)}ms)`, 'success');
}

// ==================== 实体生成函数 ====================

function generateEntities(count: number): void {
  const start = performance.now();

  for (let i = 0; i < count; i++) {
    const entity = state.world.createEntity();
    const rand = Math.random();

    // 随机添加组件
    if (rand < 0.8) {
      // 80% 有 Position
      state.world.addComponent(entity, Position, {
        x: Math.random() * 200 - 100,
        y: Math.random() * 200 - 100,
        z: 0,
      });
    }

    if (rand < 0.5) {
      // 50% 有 Velocity
      state.world.addComponent(entity, Velocity, {
        x: Math.random() * 20 - 10,
        y: Math.random() * 20 - 10,
        z: 0,
      });
    }

    if (rand < 0.3) {
      // 30% 有 Health
      state.world.addComponent(entity, Health, {
        current: Math.floor(Math.random() * 100),
        max: 100,
      });
    }

    if (rand < 0.2) {
      // 20% 有 Damage
      state.world.addComponent(entity, Damage, {
        value: Math.floor(Math.random() * 50),
      });
    }

    if (rand < 0.1) {
      // 10% 是死亡状态
      state.world.addComponent(entity, Dead, {});
    }
  }

  const elapsed = performance.now() - start;

  log(`生成 ${count} 个实体 (${elapsed.toFixed(2)}ms)`, 'success');
  updateStats();
  updateEntityGrid();
}

function clearEntities(): void {
  state.world.clear();
  log('清空所有实体', 'warning');
  updateStats();
  updateEntityGrid();

  // 清空查询结果
  for (let i = 1; i <= 4; i++) {
    const countEl = document.getElementById(`query${i}Count`);
    const resultsEl = document.getElementById(`query${i}Results`);
    if (countEl) {
      countEl.textContent = '0 个';
    }
    if (resultsEl) {
      resultsEl.innerHTML = '';
    }
  }
}

// ==================== 初始化 ====================

function init(): void {
  // 注册组件
  state.world.registerComponent(Position);
  state.world.registerComponent(Velocity);
  state.world.registerComponent(Health);
  state.world.registerComponent(Damage);
  state.world.registerComponent(Dead);

  // 绑定全局函数
  (window as any).generateEntities = generateEntities;
  (window as any).clearEntities = clearEntities;
  (window as any).runQuery1 = runQuery1;
  (window as any).runQuery2 = runQuery2;
  (window as any).runQuery3 = runQuery3;
  (window as any).runQuery4 = runQuery4;

  // 初始化 UI
  updateStats();
  updateEntityGrid();

  log('Query 高级用法 Demo 已初始化', 'success');
  log('点击"生成实体"按钮创建测试数据', 'info');
}

// 启动 Demo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
