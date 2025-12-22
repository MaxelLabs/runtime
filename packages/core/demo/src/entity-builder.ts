/**
 * entity-builder.ts
 * ECS EntityBuilder Demo
 * 展示 EntityBuilder 的链式 API、内置组件和层级关系管理
 */

import {
  World,
  EntityId,
  createWorldSync,
  Name,
  Tag,
  Position,
  Rotation,
  Scale,
  Parent,
  Children,
  Active,
} from '@maxellabs/core';

// ==================== 自定义组件 ====================

class Health {
  current = 100;
  max = 100;
}

class Damage {
  value = 10;
}

class Speed {
  value = 5;
}

// ==================== Demo 状态 ====================

type ExtendedWorld = ReturnType<typeof createWorldSync>;

interface DemoState {
  world: ExtendedWorld;
  selectedEntity: EntityId | null;
}

const state: DemoState = {
  world: null as any,
  selectedEntity: null,
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

function updateEntityList(): void {
  const container = document.getElementById('entityList');
  const countEl = document.getElementById('entityCount');
  if (!container) {
    return;
  }

  const entities = state.world.getAllEntities();
  if (countEl) {
    countEl.textContent = String(entities.length);
  }

  container.innerHTML = '';

  for (const entity of entities) {
    const card = document.createElement('div');
    card.className = `entity-card ${state.selectedEntity === entity ? 'selected' : ''}`;
    card.onclick = () => selectEntity(entity);

    // 获取组件数据
    const name = state.world.getComponent(entity, Name);
    const tag = state.world.getComponent(entity, Tag);
    const pos = state.world.getComponent(entity, Position);
    const rot = state.world.getComponent(entity, Rotation);
    const scale = state.world.getComponent(entity, Scale);
    const health = state.world.getComponent(entity, Health);
    const active = state.world.getComponent(entity, Active);
    const parent = state.world.getComponent(entity, Parent);

    // 构建标签 HTML
    const tagsHtml = tag
      ? Array.from(tag.values)
          .map((t) => `<span class="tag ${t}">${t}</span>`)
          .join('')
      : '';

    // 构建组件徽章 HTML
    const components: string[] = [];
    if (pos) {
      components.push('Position');
    }
    if (rot) {
      components.push('Rotation');
    }
    if (scale) {
      components.push('Scale');
    }
    if (health) {
      components.push('Health');
    }
    if (active) {
      components.push('Active');
    }

    const componentsHtml = components.map((c) => `<span class="component-badge ${c}">${c}</span>`).join('');

    // 构建详情 HTML
    let detailsHtml = '';
    if (pos) {
      detailsHtml += `Position: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})<br>`;
    }
    if (health) {
      detailsHtml += `Health: ${health.current}/${health.max}<br>`;
    }
    if (parent && parent.entity !== 0xffffffff) {
      detailsHtml += `Parent: Entity ${EntityId.index(parent.entity)}<br>`;
    }

    card.innerHTML = `
      <div class="entity-header">
        <span class="entity-name">${name?.value || 'Unnamed'}</span>
        <span class="entity-id">ID: ${EntityId.index(entity)}</span>
      </div>
      <div class="entity-tags">${tagsHtml}</div>
      <div class="entity-components">${componentsHtml}</div>
      ${detailsHtml ? `<div class="entity-details">${detailsHtml}</div>` : ''}
    `;

    container.appendChild(card);
  }
}

function updateHierarchyView(): void {
  const container = document.getElementById('hierarchyView');
  if (!container) {
    return;
  }

  const entities = state.world.getAllEntities();

  // 找出根实体（没有父级的实体）
  const roots: EntityId[] = [];
  for (const entity of entities) {
    const parent = state.world.getComponent(entity, Parent);
    if (!parent || parent.entity === 0xffffffff) {
      roots.push(entity);
    }
  }

  // 递归构建层级视图
  function buildHierarchy(entity: EntityId, level: number): string {
    const name = state.world.getComponent(entity, Name);
    const children = state.world.getComponent(entity, Children);
    const prefix = level > 0 ? '└─ ' : '';

    let html = `<div class="hierarchy-node level-${Math.min(level, 3)}" onclick="selectEntity(${entity})">
      ${prefix}${name?.value || `Entity ${EntityId.index(entity)}`}
    </div>`;

    if (children && children.entities.length > 0) {
      for (const child of children.entities) {
        html += buildHierarchy(child, level + 1);
      }
    }

    return html;
  }

  if (roots.length === 0) {
    container.innerHTML = '<div style="color: #888;">暂无实体</div>';
  } else {
    container.innerHTML = roots.map((root) => buildHierarchy(root, 0)).join('');
  }
}

function selectEntity(entity: EntityId): void {
  state.selectedEntity = entity;
  updateEntityList();
  const name = state.world.getComponent(entity, Name);
  log(`选中实体: ${name?.value || `Entity ${EntityId.index(entity)}`}`, 'info');
}

// ==================== 创建函数 ====================

function createPlayer(): void {
  const entity = state.world
    .spawn('Player')
    .position(0, 0, 0)
    .rotation(0, 0, 0, 1)
    .scale(1)
    .tag('player')
    .add(Health, { current: 100, max: 100 })
    .add(Speed, { value: 10 })
    .build();

  log(`创建玩家: Entity ${EntityId.index(entity)}`, 'success');
  updateEntityList();
  updateHierarchyView();
}

function createEnemy(): void {
  const x = Math.random() * 100 - 50;
  const z = Math.random() * 100 - 50;

  const entity = state.world
    .spawn(`Enemy_${Date.now() % 1000}`)
    .position(x, 0, z)
    .scale(0.8)
    .tag('enemy')
    .add(Health, { current: 50, max: 50 })
    .add(Damage, { value: 10 })
    .add(Speed, { value: 5 })
    .build();

  log(`创建敌人: Entity ${EntityId.index(entity)} at (${x.toFixed(1)}, 0, ${z.toFixed(1)})`, 'success');
  updateEntityList();
  updateHierarchyView();
}

function createNPC(): void {
  const x = Math.random() * 50 - 25;
  const z = Math.random() * 50 - 25;

  const entity = state.world
    .spawn(`NPC_${Date.now() % 1000}`)
    .position(x, 0, z)
    .scale(1)
    .tag('npc')
    .add(Health, { current: 100, max: 100 })
    .build();

  log(`创建 NPC: Entity ${EntityId.index(entity)}`, 'success');
  updateEntityList();
  updateHierarchyView();
}

function createBoss(): void {
  const entity = state.world
    .spawn('Boss')
    .position(0, 0, 50)
    .scale(2)
    .tag('enemy', 'boss')
    .add(Health, { current: 500, max: 500 })
    .add(Damage, { value: 50 })
    .add(Speed, { value: 3 })
    .build();

  log(`创建 Boss: Entity ${EntityId.index(entity)}`, 'warning');
  updateEntityList();
  updateHierarchyView();
}

function spawnEnemyWave(count: number): void {
  const entities = state.world.spawnBatch(count, (builder, index) => {
    const angle = (index / count) * Math.PI * 2;
    const radius = 30 + Math.random() * 20;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    builder
      .name(`Enemy_Wave_${index}`)
      .position(x, 0, z)
      .scale(0.8)
      .tag('enemy')
      .add(Health, { current: 30 + Math.random() * 20, max: 50 })
      .add(Damage, { value: 5 + Math.random() * 10 })
      .add(Speed, { value: 3 + Math.random() * 4 });
  });

  log(`生成敌人波次: ${entities.length} 个敌人`, 'success');
  updateEntityList();
  updateHierarchyView();
}

function createHierarchy(): void {
  // 创建根实体
  const root = state.world.spawn('Scene_Root').position(0, 0, 0).build();

  // 创建子实体
  const group1 = state.world.spawn('Group_Enemies').position(10, 0, 0).parent(root).build();

  const group2 = state.world.spawn('Group_NPCs').position(-10, 0, 0).parent(root).build();

  // 在 Group_Enemies 下创建敌人
  for (let i = 0; i < 3; i++) {
    state.world
      .spawn(`Enemy_${i}`)
      .position(i * 5, 0, 0)
      .tag('enemy')
      .parent(group1)
      .add(Health, { current: 50, max: 50 })
      .build();
  }

  // 在 Group_NPCs 下创建 NPC
  for (let i = 0; i < 2; i++) {
    state.world
      .spawn(`NPC_${i}`)
      .position(i * 5, 0, 0)
      .tag('npc')
      .parent(group2)
      .add(Health, { current: 100, max: 100 })
      .build();
  }

  log('创建层级结构: 1 个根节点, 2 个分组, 5 个子实体', 'success');
  updateEntityList();
  updateHierarchyView();
}

function findByName(name: string): void {
  const entity = state.world.findByName(name);
  if (entity !== undefined) {
    selectEntity(entity);
    log(`找到实体: ${name}`, 'success');
  } else {
    log(`未找到实体: ${name}`, 'warning');
  }
}

function findByTag(tagName: string): void {
  const entities = state.world.findByTag(tagName);
  if (entities.length > 0) {
    log(`找到 ${entities.length} 个带有标签 "${tagName}" 的实体`, 'success');
    // 选中第一个
    selectEntity(entities[0]);
  } else {
    log(`未找到带有标签 "${tagName}" 的实体`, 'warning');
  }
}

function clearAll(): void {
  state.world.clear();
  state.selectedEntity = null;
  log('清空所有实体', 'error');
  updateEntityList();
  updateHierarchyView();
}

// ==================== 初始化 ====================

function init(): void {
  // 创建扩展的 World
  state.world = createWorldSync(World);

  // 注册自定义组件
  state.world.registerComponent(Health);
  state.world.registerComponent(Damage);
  state.world.registerComponent(Speed);

  // 绑定全局函数
  (window as any).createPlayer = createPlayer;
  (window as any).createEnemy = createEnemy;
  (window as any).createNPC = createNPC;
  (window as any).createBoss = createBoss;
  (window as any).spawnEnemyWave = spawnEnemyWave;
  (window as any).createHierarchy = createHierarchy;
  (window as any).findByName = findByName;
  (window as any).findByTag = findByTag;
  (window as any).clearAll = clearAll;
  (window as any).selectEntity = selectEntity;

  // 初始化 UI
  updateEntityList();
  updateHierarchyView();

  log('EntityBuilder Demo 已初始化', 'success');
  log('使用 createWorldSync 创建扩展 World', 'info');
}

// 启动 Demo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
