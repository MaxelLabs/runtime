# ECS 数据组件

> **面向数据的组件设计** - 所有组件继承 Component 基类，配合静态 `fromData()` 方法实现数据解析

## 📂 目录结构

```
components/
├── base/               # 基类 (Component)
├── transform/          # 变换组件 (LocalTransform, WorldTransform, Parent, Children)
├── visual/             # 视觉组件 (MeshRef, MaterialRef, Color, etc.)
├── data/               # 数据组件 (Name, Tag, Tags, Metadata, etc.)
├── animation/          # 动画组件 (AnimationState, Timeline, etc.)
├── physics/            # 物理组件 (Velocity, RigidBody, etc.)
└── index.ts            # 统一导出
```

## 🎯 设计原则

### 1. 所有组件继承 Component 基类

```typescript
import { Component } from '../base/component';
import type { ITransform } from '@maxellabs/specification';

// ✅ 正确: 继承 Component 基类，实现 Specification 接口
class LocalTransform extends Component implements ITransform {
  position: Vector3Like = { x: 0, y: 0, z: 0 };
  rotation: QuaternionLike = { x: 0, y: 0, z: 0, w: 1 };
  scale: Vector3Like = { x: 1, y: 1, z: 1 };

  static fromData(data: ITransform): LocalTransform {
    const component = new LocalTransform();
    if (data.position) {
      component.position = { ...data.position };
    }
    // ... 其他字段
    return component;
  }

  override clone(): LocalTransform {
    const cloned = new LocalTransform();
    cloned.position = { ...this.position };
    // ... 其他字段
    return cloned;
  }
}

// ❌ 错误: 不继承 Component 基类
class BadPosition {
  x: number = 0;
  y: number = 0;
  z: number = 0;
}
```

### 2. 使用静态 fromData() 方法

每个组件类必须实现 `static fromData()` 方法用于数据解析，接受 Specification 接口类型：

```typescript
interface IComponentFactory<T, D> {
  /**
   * 从 Specification 接口数据创建组件实例
   * @param data Specification 接口数据
   * @returns 完整的组件实例
   */
  fromData(data: D): T;
}
```

### 3. fromData 接受 Specification 接口类型

`fromData()` 接收 Specification 中定义的接口类型（如 `ITransform`、`IName`），而不是 `Partial<T>` 类型：

```typescript
import type { ITransform, IName } from '@maxellabs/specification';

// ✅ 正确: 使用 Specification 接口类型
static fromData(data: ITransform): LocalTransform { ... }
static fromData(data: IName): Name { ... }

// ❌ 错误: 使用 Partial<T>
static fromData(data: Partial<LocalTransform>): LocalTransform { ... }
```

**设计理由：**
1. **类型安全**: Specification 接口定义了数据���完整契约
2. **数据来源明确**: 组件数据通常来自序列化的场景文件或 API
3. **职责分离**: 如果需要部分数据创建，应该在调用方处理默认值
4. **与 Specification 对齐**: 保持与 specification 包的类型一致性

### 4. 必须实现 clone() 方法

每个组件必须重写 `clone()` 方法以支持深拷贝：

```typescript
override clone(): LocalTransform {
  const cloned = new LocalTransform();
  cloned.position = { ...this.position };
  cloned.rotation = { ...this.rotation };
  cloned.scale = { ...this.scale };
  return cloned;
}
```

## 📝 组件模板

### 基础组件模板

```typescript
import { Component } from '../base/component';
import type { IMyData } from '@maxellabs/specification';

/**
 * 组件名称
 * @description 继承 Component 基类，实现 IMyData 接口
 */
export class MyComponent extends Component implements IMyData {
  // 字段定义 (必须有默认值)
  field1: number = 0;
  field2: string = '';
  field3: boolean = false;

  /**
   * 从 Specification 数据创建组件实例
   * @param data IMyData 规范数据
   * @returns 组件实例
   */
  static fromData(data: IMyData): MyComponent {
    const component = new MyComponent();

    // 逐字段赋值 (类型安全)
    if (data.field1 !== undefined) component.field1 = data.field1;
    if (data.field2 !== undefined) component.field2 = data.field2;
    if (data.field3 !== undefined) component.field3 = data.field3;

    return component;
  }

  /**
   * 克隆组件
   * @returns 克隆的组件实例
   */
  override clone(): MyComponent {
    const cloned = new MyComponent();
    cloned.field1 = this.field1;
    cloned.field2 = this.field2;
    cloned.field3 = this.field3;
    return cloned;
  }
}
```

### 复杂组件模板

```typescript
import { Component } from '../base/component';
import type { IComplexData, Vector3Like } from '@maxellabs/specification';

/**
 * 复杂组件 (包含嵌套对象)
 */
export class ComplexComponent extends Component implements IComplexData {
  name: string = '';
  position: Vector3Like = { x: 0, y: 0, z: 0 };
  metadata: Record<string, unknown> = {};

  static fromData(data: IComplexData): ComplexComponent {
    const component = new ComplexComponent();

    if (data.name !== undefined) {
      component.name = data.name;
    }

    // 嵌套对象: 深拷贝
    if (data.position !== undefined) {
      component.position = {
        x: data.position.x ?? 0,
        y: data.position.y ?? 0,
        z: data.position.z ?? 0,
      };
    }

    // 复杂对象: 浅拷贝
    if (data.metadata !== undefined) {
      component.metadata = { ...data.metadata };
    }

    return component;
  }

  override clone(): ComplexComponent {
    const cloned = new ComplexComponent();
    cloned.name = this.name;
    cloned.position = { ...this.position };
    cloned.metadata = { ...this.metadata };
    return cloned;
  }
}
```

## 🚫 负面约束

### 禁止事项

- 🚫 **不要在组件中定义业务逻辑方法** - 逻辑应该在 System 中实现
- 🚫 **不要忘记继承 Component 基类** - 所有组件必须继承 Component
- 🚫 **不要忘记提供默认值** - 所有字段必须有默认值
- 🚫 **不要在 fromData 中做复杂计算** - 保持简单的数据赋值
- 🚫 **不要忘记实现 clone() 方法** - 必须支持深拷贝
- 🚫 **不要使用 Partial<T> 作为 fromData 参数** - 使用 Specification 接口类型

### 常见错误

```typescript
// ❌ 错误: 没有继承 Component 基类
class BadComponent1 implements IMyData {
  value: number = 0;
}

// ❌ 错误: 没有默认值
class BadComponent2 extends Component {
  value: number; // 错误! 必须有默认值
}

// ❌ 错误: 包含业务逻辑
class BadComponent3 extends Component {
  value: number = 0;

  calculate(): void { ... } // 错误! 不应该有方法（clone 除外）
}

// ❌ 错误: 使用 Partial<T> 作为参数类型
class BadComponent4 extends Component {
  static fromData(data: Partial<BadComponent4>): BadComponent4 { ... }
}

// ✅ 正确: 继承 Component，使用 Specification 接口
class GoodComponent extends Component implements IMyData {
  value: number = 0;

  static fromData(data: IMyData): GoodComponent {
    const component = new GoodComponent();
    component.value = data.value;
    return component;
  }

  override clone(): GoodComponent {
    const cloned = new GoodComponent();
    cloned.value = this.value;
    return cloned;
  }
}
```

## 📊 使用示例

### 创建实体

```typescript
import { World } from '@maxellabs/core';
import { LocalTransform, MeshRef } from '@maxellabs/core/components';
import type { ITransform, IMeshRef } from '@maxellabs/specification';

const world = new World();

// 方式1: 使用 fromData（推荐）
const entity1 = world.createEntity();
const transformData: ITransform = {
  position: { x: 10, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};
world.addComponent(entity1, LocalTransform, LocalTransform.fromData(transformData));

// 方式2: 使用 EntityBuilder
const entity2 = new EntityBuilder(world)
  .with(LocalTransform, LocalTransform.fromData({
    position: { x: 30, y: 10, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  }))
  .with(MeshRef, MeshRef.fromData({ assetId: 'cube' }))
  .build();
```

### 批量创建

```typescript
import type { ITransform, IMeshRef } from '@maxellabs/specification';

// 从配置数据批量创建实体
interface EntityConfig {
  transform: ITransform;
  mesh?: IMeshRef;
}

function spawnEntities(world: World, configs: EntityConfig[]): EntityId[] {
  return configs.map(config => {
    const entity = world.createEntity();
    world.addComponent(entity, LocalTransform, LocalTransform.fromData(config.transform));

    if (config.mesh) {
      world.addComponent(entity, MeshRef, MeshRef.fromData(config.mesh));
    }

    return entity;
  });
}

// 使用
const entities = spawnEntities(world, [
  {
    transform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    mesh: { assetId: 'cube' },
  },
  {
    transform: {
      position: { x: 10, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
  },
]);
```

## 🔧 Component 基类功能

所有组件继承自 `Component` 基类，提供以下功能：

- **引用计数管理** - 继承自 `ReferResource`
- **启用/禁用状态** - `enabled` 属性
- **脏标记** - `dirty` 属性和 `markDirty()` / `clearDirty()` 方法
- **实体关联** - `entityId` 属性
- **生命周期钩子** - `onAttach()` / `onDetach()` 方法
- **克隆支持** - `clone()` 方法

## 🔗 相关文档

- [Core ECS Architecture](../../llmdoc/architecture/core/core-ecs-architecture.md) - ECS 架构概览
- [ComponentRegistry](../../llmdoc/reference/api-v2/core/component-registry.md) - 组件注册表
- [World API](../../llmdoc/reference/api-v2/core/world.md) - World 中央调度器

---

**版本**: 1.0.0
**最后更新**: 2025-12-22
**状态**: ✅ 就绪
