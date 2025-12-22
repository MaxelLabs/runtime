# ECS 数据组件

> **面向数据的组件设计** - 纯数据结构(POD)组件,配合静态 `fromData()` 方法实现数据解析

## 📂 目录结构

```
components/
├── transform/          # 变换组件 (Position, Rotation, Scale, etc.)
├── visual/             # 视觉组件 (Mesh, Material, Color, etc.)
├── data/               # 数据组件 (Metadata, Tags, etc.)
├── animation/          # 动画组件 (AnimationState, Timeline, etc.)
├── physics/            # 物理组件 (Velocity, RigidBody, etc.)
└── index.ts            # 统一导出
```

## 🎯 设计原则

### 1. 组件是纯数据结构(POD)

```typescript
// ✅ 正确: 纯数据结构
class Position {
  x: number = 0;
  y: number = 0;
  z: number = 0;

  static fromData(data: Partial<Position>): Position {
    const pos = new Position();
    if (data.x !== undefined) pos.x = data.x;
    if (data.y !== undefined) pos.y = data.y;
    if (data.z !== undefined) pos.z = data.z;
    return pos;
  }
}

// ❌ 错误: 包含业务逻辑
class BadPosition {
  x: number = 0;

  // 不应该有方法逻辑
  normalize(): void { ... }
  update(delta: number): void { ... }
}
```

### 2. 使用静态 fromData() 方法

每个组件类必须实现 `static fromData()` 方法用于数据解析:

```typescript
interface ComponentFromData<T> {
  /**
   * 从数据对象创建组件实例
   * @param data 部分数据对象
   * @returns 完整的组件实例
   */
  fromData(data: Partial<T>): T;
}
```

### 3. 支持部分数据(Partial)

`fromData()` 接收 `Partial<T>` 类型,允许只提供部分字段:

```typescript
// 完整数据
const pos1 = Position.fromData({ x: 10, y: 20, z: 30 });

// 部分数据 (使用默认值)
const pos2 = Position.fromData({ x: 10 }); // y=0, z=0

// 空数据 (全部默认值)
const pos3 = Position.fromData({}); // x=0, y=0, z=0
```

### 4. 类型安全

使用 TypeScript 泛型确保类型安全:

```typescript
// 泛型辅助类型
type ComponentData<T> = Partial<T>;

// 使用示例
function createEntity<T>(
  world: World,
  componentType: ComponentClass<T>,
  data: ComponentData<T>
): EntityId {
  const entity = world.createEntity();
  const component = (componentType as any).fromData(data);
  world.addComponent(entity, componentType, component);
  return entity;
}
```

## 📝 组件模板

### 基础组件模板

```typescript
/**
 * 组件名称
 * @description 组件功能描述
 */
export class MyComponent {
  // 字段定义 (必须有默认值)
  field1: number = 0;
  field2: string = '';
  field3: boolean = false;

  /**
   * 从数据创建组件实例
   * @param data 部分数据对象
   * @returns 组件实例
   */
  static fromData(data: Partial<MyComponent>): MyComponent {
    const component = new MyComponent();

    // 方式1: 逐字段赋值 (类型安全)
    if (data.field1 !== undefined) component.field1 = data.field1;
    if (data.field2 !== undefined) component.field2 = data.field2;
    if (data.field3 !== undefined) component.field3 = data.field3;

    return component;
  }
}
```

### 复杂组件模板

```typescript
import { Vector3 } from '@maxellabs/math';

/**
 * 复杂组件 (包含嵌套对象)
 */
export class ComplexComponent {
  name: string = '';
  position: Vector3 = new Vector3(0, 0, 0);
  metadata: Record<string, any> = {};

  static fromData(data: Partial<ComplexComponent>): ComplexComponent {
    const component = new ComplexComponent();

    if (data.name !== undefined) {
      component.name = data.name;
    }

    // 嵌套对象: 深拷贝
    if (data.position !== undefined) {
      component.position.set(
        data.position.x ?? 0,
        data.position.y ?? 0,
        data.position.z ?? 0
      );
    }

    // 复杂对象: 浅拷贝或深拷贝
    if (data.metadata !== undefined) {
      component.metadata = { ...data.metadata };
    }

    return component;
  }
}
```

## 🚫 负面约束

### 禁止事项

- 🚫 **不要在组件中定义业务逻辑方法** - 逻辑应该在 System 中实现
- 🚫 **不要在组件中存储 Entity 引用** - 使用查询系统获取相关实体
- 🚫 **不要在组件中使用继承** - 使用组合而非继承
- 🚫 **不要忘记提供默认值** - 所有字段必须有默认值
- 🚫 **不要在 fromData 中做复杂计算** - 保持简单的数据赋值

### 常见错误

```typescript
// ❌ 错误: 没有默认值
class BadComponent1 {
  value: number; // 错误! 必须有默认值
}

// ❌ 错误: 包含业务逻辑
class BadComponent2 {
  value: number = 0;

  calculate(): void { ... } // 错误! 不应该有方法
}

// ❌ 错误: 存储引用
class BadComponent3 {
  target: EntityId; // 错误! 不应该存储实体引用
}

// ✅ 正确: 使用组合
class GoodComponent {
  targetTag: string = ''; // 通过标签查找
}
```

## 📊 使用示例

### 创建实体

```typescript
import { World } from '@maxellabs/core';
import { Position, Velocity, MeshRef } from '@maxellabs/core/components';

const world = new World();

// 方式1: 使用 fromData
const entity1 = world.createEntity();
world.addComponent(entity1, Position, Position.fromData({ x: 10, y: 0, z: 0 }));
world.addComponent(entity1, Velocity, Velocity.fromData({ x: 1, y: 0, z: 0 }));

// 方式2: 直接传递数据 (World 内部调用 fromData)
const entity2 = world.createEntity();
world.addComponent(entity2, Position, { x: 20, y: 5, z: 0 });
world.addComponent(entity2, Velocity, { x: 2, y: 1, z: 0 });

// 方式3: 使用 EntityBuilder
const entity3 = new EntityBuilder(world)
  .with(Position, { x: 30, y: 10, z: 0 })
  .with(Velocity, { x: 3, y: 2, z: 0 })
  .with(MeshRef, { assetId: 'cube' })
  .build();
```

### 批量创建

```typescript
// 从配置数据批量创建实体
interface EntityConfig {
  position: Partial<Position>;
  velocity: Partial<Velocity>;
  mesh?: string;
}

function spawnEntities(world: World, configs: EntityConfig[]): EntityId[] {
  return configs.map(config => {
    const entity = world.createEntity();
    world.addComponent(entity, Position, Position.fromData(config.position));
    world.addComponent(entity, Velocity, Velocity.fromData(config.velocity));

    if (config.mesh) {
      world.addComponent(entity, MeshRef, MeshRef.fromData({ assetId: config.mesh }));
    }

    return entity;
  });
}

// 使用
const entities = spawnEntities(world, [
  { position: { x: 0, y: 0, z: 0 }, velocity: { x: 1, y: 0, z: 0 }, mesh: 'cube' },
  { position: { x: 10, y: 0, z: 0 }, velocity: { x: -1, y: 0, z: 0 } },
  { position: { x: 20, y: 0, z: 0 }, velocity: { x: 0, y: 1, z: 0 } },
]);
```

## 🔗 相关文档

- [Core ECS Architecture](../../llmdoc/architecture/core/core-ecs-architecture.md) - ECS 架构概览
- [ComponentRegistry](../../llmdoc/reference/api-v2/core/component-registry.md) - 组件注册表
- [World API](../../llmdoc/reference/api-v2/core/world.md) - World 中央调度器

---

**版本**: 1.0.0
**最后更新**: 2025-12-22
**状态**: ✅ 就绪
