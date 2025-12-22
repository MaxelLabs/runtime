/**
 * world-basics.ts
 * ECS World 基础 Demo
 * 展示 World、Entity、Component、Query 的基本用法
 */

import { EntityId, World } from '@maxellabs/core';

// ==================== 组件定义 ====================

/**
 * 位置组件
 */
class Position {
  x = 0;
  y = 0;
  z = 0;
}

/**
 * 速度组件
 */
class Velocity {
  x = 0;
  y = 0;
  z = 0;
}

/**
 * 生命值组件
 */
class Health {
  current = 100;
  max = 100;
}

// ==================== Demo 状态 ====================

interface DemoState {
  world: World;
  selectedEntity: EntityId | null;
}

const state: DemoState = {
  world: new World(),
  selectedEntity: null,
};

// ==================== UI 更新函数 ====================

/**
 * 更新统计信息
 */
function updateStats(): void {
  const stats = state.world.getStats();

  const entityCountEl = document.getElementById('entityCount');
  const archetypeCountEl = document.getElementById('archetypeCount');
  const componentCountEl = document.getElementById('componentCount');
  const queryCountEl = document.getElementById('queryCount');

  if (entityCountEl) {
    entityCountEl.textContent = String(stats.entities);
  }
  if (archetypeCountEl) {
    archetypeCountEl.textContent = String(stats.archetypes);
  }
  if (componentCountEl) {
    componentCountEl.textContent = String(stats.componentTypes);
  }
  if (queryCountEl) {
    queryCountEl.textContent = String(stats.queries);
  }

  // 更新实体选择器
  const select = document.getElementById('entitySelect') as HTMLSelectElement;
  if (select) {
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- 选择实体 --</option>';

    for (const entity of state.world.getAllEntities()) {
      const option = document.createElement('option');
      option.value = String(entity);
      option.textContent = `Entity ${EntityId.index(entity)}`;
      select.appendChild(option);
    }

    select.value = currentValue;
  }
}

/**
 * 更新可视化
 * 使用公开 API 展示实体和组件信息
 */
function updateVisualization(): void {
  const container = document.getElementById('visualization');
  if (!container) {
    return;
  }

  container.innerHTML = '';

  // 获取所有实体并按组件组合分组
  const entities = state.world.getAllEntities();
  const groups = new Map<string, { components: string[]; entities: EntityId[] }>();

  for (const entity of entities) {
    const components: string[] = [];
    if (state.world.hasComponent(entity, Position)) {
      components.push('Position');
    }
    if (state.world.hasComponent(entity, Velocity)) {
      components.push('Velocity');
    }
    if (state.world.hasComponent(entity, Health)) {
      components.push('Health');
    }

    const key = components.sort().join('+') || '空';
    if (!groups.has(key)) {
      groups.set(key, { components, entities: [] });
    }
    groups.get(key)!.entities.push(entity);
  }

  // 渲染每个组
  for (const [key, group] of groups) {
    const box = document.createElement('div');
    box.className = 'archetype-box fade-in';

    box.innerHTML = `
      <div class="archetype-header">
        <span class="archetype-title">组件组合 [${key}]</span>
        <span class="archetype-count">${group.entities.length} 个实体</span>
      </div>
      <div class="archetype-components">
        ${group.components.map((name) => `<span class="component-tag">${name}</span>`).join('')}
      </div>
      <div class="archetype-entities">
        ${group.entities.map((e) => `<span class="entity-badge" onclick="window.selectEntityById(${e})">Entity ${EntityId.index(e)}</span>`).join('')}
      </div>
    `;

    container.appendChild(box);
  }
}

/**
 * 添加日志
 */
function log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
  const logArea = document.getElementById('logArea');
  if (!logArea) {
    return;
  }

  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logArea.insertBefore(entry, logArea.firstChild);

  // 限制日志数量
  while (logArea.children.length > 20) {
    logArea.removeChild(logArea.lastChild!);
  }
}

// ==================== 全局操作函数 ====================

/**
 * 创建空实体
 */
function createEntity(): void {
  const entity = state.world.createEntity();
  log(`创建实体 ${EntityId.index(entity)}`, 'success');
  updateStats();
  updateVisualization();
}

/**
 * 创建带 Position 的实体
 */
function createEntityWithPosition(): void {
  const entity = state.world.createEntity();
  state.world.addComponent(entity, Position, {
    x: Math.random() * 100,
    y: Math.random() * 100,
    z: 0,
  });
  log(`创建实体 ${EntityId.index(entity)} 并添加 Position`, 'success');
  updateStats();
  updateVisualization();
}

/**
 * 创建带 Velocity 的实体
 */
function createEntityWithVelocity(): void {
  const entity = state.world.createEntity();
  state.world.addComponent(entity, Velocity, {
    x: Math.random() * 10,
    y: Math.random() * 10,
    z: 0,
  });
  log(`创建实体 ${EntityId.index(entity)} 并添加 Velocity`, 'success');
  updateStats();
  updateVisualization();
}

/**
 * 创建带 Position 和 Velocity 的实体
 */
function createEntityWithBoth(): void {
  const entity = state.world.createEntity();
  state.world.addComponent(entity, Position, {
    x: Math.random() * 100,
    y: Math.random() * 100,
    z: 0,
  });
  state.world.addComponent(entity, Velocity, {
    x: Math.random() * 10,
    y: Math.random() * 10,
    z: 0,
  });
  log(`创建实体 ${EntityId.index(entity)} 并添加 Position + Velocity`, 'success');
  updateStats();
  updateVisualization();
}

/**
 * 销毁最后一个实体
 */
function destroyLastEntity(): void {
  const entities = state.world.getAllEntities();
  if (entities.length === 0) {
    log('没有实体可销毁', 'warning');
    return;
  }
  const entity = entities[entities.length - 1];
  state.world.destroyEntity(entity);
  log(`销毁实体 ${EntityId.index(entity)}`, 'warning');
  updateStats();
  updateVisualization();
}

/**
 * 清空所有实体
 */
function clearAll(): void {
  state.world.clear();
  log('清空所有实体', 'error');
  updateStats();
  updateVisualization();
}

/**
 * 选择实体
 */
function selectEntity(): void {
  const select = document.getElementById('entitySelect') as HTMLSelectElement;
  state.selectedEntity = select.value ? (parseInt(select.value) as EntityId) : null;
  if (state.selectedEntity !== null) {
    log(`选中实体 ${EntityId.index(state.selectedEntity)}`, 'info');
  }
}

/**
 * 通过 ID 选择实体
 */
function selectEntityById(id: EntityId): void {
  state.selectedEntity = id;
  const select = document.getElementById('entitySelect') as HTMLSelectElement;
  if (select) {
    select.value = String(id);
  }

  log(`选中实体 ${EntityId.index(id)}`, 'info');

  // 显示组件信息
  const pos = state.world.getComponent(id, Position);
  const vel = state.world.getComponent(id, Velocity);
  const health = state.world.getComponent(id, Health);

  let info = `实体 ${EntityId.index(id)} 的组件: `;
  if (pos) {
    info += `Position(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}) `;
  }
  if (vel) {
    info += `Velocity(${vel.x.toFixed(1)}, ${vel.y.toFixed(1)}) `;
  }
  if (health) {
    info += `Health(${health.current}/${health.max}) `;
  }
  if (!pos && !vel && !health) {
    info += '无组件';
  }

  log(info, 'info');
}

/**
 * 为选中实体添加 Position
 */
function addPositionToSelected(): void {
  if (state.selectedEntity === null) {
    log('请先选择一个实体', 'warning');
    return;
  }
  if (state.world.hasComponent(state.selectedEntity, Position)) {
    log(`实体 ${EntityId.index(state.selectedEntity)} 已有 Position 组件`, 'warning');
    return;
  }
  state.world.addComponent(state.selectedEntity, Position, {
    x: Math.random() * 100,
    y: Math.random() * 100,
    z: 0,
  });
  log(`为实体 ${EntityId.index(state.selectedEntity)} 添加 Position`, 'success');
  updateStats();
  updateVisualization();
}

/**
 * 为选中实体添加 Velocity
 */
function addVelocityToSelected(): void {
  if (state.selectedEntity === null) {
    log('请先选择一个实体', 'warning');
    return;
  }
  if (state.world.hasComponent(state.selectedEntity, Velocity)) {
    log(`实体 ${EntityId.index(state.selectedEntity)} 已有 Velocity 组件`, 'warning');
    return;
  }
  state.world.addComponent(state.selectedEntity, Velocity, {
    x: Math.random() * 10,
    y: Math.random() * 10,
    z: 0,
  });
  log(`为实体 ${EntityId.index(state.selectedEntity)} 添加 Velocity`, 'success');
  updateStats();
  updateVisualization();
}

/**
 * 为选中实体添加 Health
 */
function addHealthToSelected(): void {
  if (state.selectedEntity === null) {
    log('请先选择一个实体', 'warning');
    return;
  }
  if (state.world.hasComponent(state.selectedEntity, Health)) {
    log(`实体 ${EntityId.index(state.selectedEntity)} 已有 Health 组件`, 'warning');
    return;
  }
  state.world.addComponent(state.selectedEntity, Health, { current: 100, max: 100 });
  log(`为实体 ${EntityId.index(state.selectedEntity)} 添加 Health`, 'success');
  updateStats();
  updateVisualization();
}

/**
 * 从选中实体移除 Position
 */
function removePositionFromSelected(): void {
  if (state.selectedEntity === null) {
    log('请先选择一个实体', 'warning');
    return;
  }
  if (!state.world.hasComponent(state.selectedEntity, Position)) {
    log(`实体 ${EntityId.index(state.selectedEntity)} 没有 Position 组件`, 'warning');
    return;
  }
  state.world.removeComponent(state.selectedEntity, Position);
  log(`从实体 ${EntityId.index(state.selectedEntity)} 移除 Position`, 'warning');
  updateStats();
  updateVisualization();
}

/**
 * 查询有 Position 的实体
 */
function queryWithPosition(): void {
  const query = state.world.query({ all: [Position] });
  const count = query.getEntityCount();
  log(`查询有 Position 的实体: 找到 ${count} 个`, 'success');

  query.forEach((entity, [pos]) => {
    const position = pos as Position;
    log(`  - Entity ${EntityId.index(entity)}: Position(${position.x.toFixed(1)}, ${position.y.toFixed(1)})`, 'info');
  });
}

/**
 * 查询有 Position 和 Velocity 的实体
 */
function queryWithBoth(): void {
  const query = state.world.query({ all: [Position, Velocity] });
  const count = query.getEntityCount();
  log(`查询有 Position + Velocity 的实体: 找到 ${count} 个`, 'success');

  query.forEach((entity, [pos, vel]) => {
    const position = pos as Position;
    const velocity = vel as Velocity;
    log(
      `  - Entity ${EntityId.index(entity)}: Pos(${position.x.toFixed(1)}, ${position.y.toFixed(1)}) Vel(${velocity.x.toFixed(1)}, ${velocity.y.toFixed(1)})`,
      'info'
    );
  });
}

/**
 * 查询没有 Health 的实体
 */
function queryWithoutHealth(): void {
  const query = state.world.query({ all: [Position], none: [Health] });
  const count = query.getEntityCount();
  log(`查询有 Position 但没有 Health 的实体: 找到 ${count} 个`, 'success');
}

// ==================== 初始化 ====================

function init(): void {
  // 注册组件
  state.world.registerComponent(Position);
  state.world.registerComponent(Velocity);
  state.world.registerComponent(Health);

  // 绑定全局函数
  (window as any).createEntity = createEntity;
  (window as any).createEntityWithPosition = createEntityWithPosition;
  (window as any).createEntityWithVelocity = createEntityWithVelocity;
  (window as any).createEntityWithBoth = createEntityWithBoth;
  (window as any).destroyLastEntity = destroyLastEntity;
  (window as any).clearAll = clearAll;
  (window as any).selectEntity = selectEntity;
  (window as any).selectEntityById = selectEntityById;
  (window as any).addPositionToSelected = addPositionToSelected;
  (window as any).addVelocityToSelected = addVelocityToSelected;
  (window as any).addHealthToSelected = addHealthToSelected;
  (window as any).removePositionFromSelected = removePositionFromSelected;
  (window as any).queryWithPosition = queryWithPosition;
  (window as any).queryWithBoth = queryWithBoth;
  (window as any).queryWithoutHealth = queryWithoutHealth;

  // 初始化 UI
  updateStats();
  updateVisualization();

  log('ECS World Demo 已初始化', 'success');
  log(`使用 @maxellabs/core 版本的 World`, 'info');
}

// 启动 Demo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
