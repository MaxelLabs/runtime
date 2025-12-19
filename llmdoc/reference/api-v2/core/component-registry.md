---
id: "core-component-registry"
type: "reference"
title: "ComponentRegistry - 组件注册表"
description: "管理组件类型、分配唯一ID和BitSet掩码，支持快速类型查询"
tags: ["ecs", "component", "registry", "bitset", "type-id"]
context_dependency: ["core-ecs-architecture", "core-bitset"]
related_ids: ["core-world", "core-archetype", "core-query"]
version: "3.0.0"
last_updated: "2025-12-19"
---

# ComponentRegistry - 组件注册表

> **核心职责**: 为每个组件类型分配唯一 ID 和 BitSet 掩码位，提供快速类型查询。

---

## 🔌 接口定义

### ComponentRegistry 类定义

```typescript
class ComponentRegistry {
  // 构造函数
  constructor();

  // 组件注册
  register<T>(type: ComponentClass<T>): ComponentTypeId;

  // 类型查询
  getTypeId(type: ComponentClass): ComponentTypeId | undefined;
  getTypeClass(id: ComponentTypeId): ComponentClass | undefined;
  isRegistered(type: ComponentClass): boolean;

  // 掩码操作
  createMask(types: ComponentClass[]): BitSet;
  getMask(type: ComponentClass): BitSet | undefined;

  // 元数据
  getName(type: ComponentClass): string | undefined;
  getBitIndex(type: ComponentClass): number | undefined;

  // 批量操作
  getAllRegistered(): ComponentClass[];
  clear(): void;
}
```

### 类型定义

```typescript
// 组件类类型
type ComponentClass<T = any> = new (...args: any[]) => T;

// 组件类型 ID
type ComponentTypeId = number;

// 组件元数据
interface ComponentMetadata<T = any> {
  id: ComponentTypeId;
  type: ComponentClass<T>;
  name: string;
  bitIndex: number;
  bitMask: BitSet;
}
```

---

## 🏗️ 掩码分配机制

### BitSet 掩码系统

```typescript
// 每个组件类型分配唯一的位索引
class ComponentRegistry {
  private nextBitIndex: number = 0;
  private static readonly MAX_COMPONENT_TYPES = 1024;

  register<T>(type: ComponentClass<T>): ComponentTypeId {
    // 1. 检查是否已注册
    if (this.isRegistered(type)) {
      throw new Error(`Component ${type.name} already registered`);
    }

    // 2. 检查容量限制
    if (this.nextBitIndex >= ComponentRegistry.MAX_COMPONENT_TYPES) {
      throw new Error('Maximum component types reached (1024)');
    }

    // 3. 分配 ID 和位索引
    const id = this.nextId++;
    const bitIndex = this.nextBitIndex++;
    const bitMask = BitSet.fromBit(bitIndex);

    // 4. 存储元数据
    const metadata: ComponentMetadata = {
      id,
      type,
      name: type.name,
      bitIndex,
      bitMask
    };

    this.typeToMeta.set(type, metadata);
    this.idToMeta.set(id, metadata);

    return id;
  }
}
```

### 掩码示例

```typescript
// 组件注册顺序
registry.register(Position);  // bitIndex=0, mask=0b00000001 (1)
registry.register(Velocity);  // bitIndex=1, mask=0b00000010 (2)
registry.register(MeshRef);   // bitIndex=2, mask=0b00000100 (4)
registry.register(Static);    // bitIndex=3, mask=0b00001000 (8)

// 创建组合掩码
const mask1 = registry.createMask([Position, Velocity]);
// 结果: 0b00000011 (1 | 2 = 3)

const mask2 = registry.createMask([Position, MeshRef, Static]);
// 结果: 0b00001101 (1 | 4 | 8 = 13)

const mask3 = registry.createMask([Velocity, MeshRef]);
// 结果: 0b00000110 (2 | 4 = 6)
```

---

## ⚙️ 核心操作

### 1. 创建掩码

```typescript
Pseudocode:
FUNCTION createMask(types):
  mask = BitSet.empty()

  FOR type IN types:
    // 1. 获取组件元数据
    meta = typeToMeta.get(type)
    IF meta == null:
      THROW Error("Component not registered")

    // 2. 添加位掩码
    mask = mask.or(meta.bitMask)

  RETURN mask
```

### 2. 类型查询

```typescript
Pseudocode:
FUNCTION getTypeId(type):
  meta = typeToMeta.get(type)
  RETURN meta?.id

FUNCTION getTypeClass(id):
  meta = idToMeta.get(id)
  RETURN meta?.type
```

### 3. 掩码反向查询

```typescript
// 从掩码提取组件类型
FUNCTION getTypesFromMask(mask: BitSet): ComponentTypeId[] {
  const types: ComponentTypeId[] = [];

  // 遍历所有已注册组件
  for (const [type, meta] of this.typeToMeta) {
    if (mask.has(meta.bitIndex)) {
      types.push(meta.id);
    }
  }

  return types;
}
```

---

## 📚 使用示例

### 基础注册

```typescript
import { ComponentRegistry } from '@maxellabs/core';

const registry = new ComponentRegistry();

// 定义组件（纯数据结构）
class Position {
  x: number = 0;
  y: number = 0;
  z: number = 0;
}

class Velocity {
  x: number = 0;
  y: number = 0;
  z: number = 0;
}

class MeshRef {
  assetId: string = "";
}

// 注册组件
const posId = registry.register(Position);
const velId = registry.register(Velocity);
const meshId = registry.register(MeshRef);

console.log(posId);  // 0
console.log(velId);  // 1
console.log(meshId); // 2

// 查询
console.log(registry.getTypeId(Position)); // 0
console.log(registry.getTypeClass(1));     // Velocity
```

### 掩码操作

```typescript
// 创建查询掩码
const movingMask = registry.createMask([Position, Velocity]);
console.log(movingMask.toString()); // "0b11" (二进制)

const renderableMask = registry.createMask([Position, MeshRef]);
console.log(renderableMask.toString()); // "0b101"

// 掩码比较
const hasPosition = movingMask.has(0); // true
const hasVelocity = movingMask.has(1); // true
const hasMesh = movingMask.has(2);     // false

// 掩码组合
const allMask = movingMask.or(renderableMask);
// 结果: 0b111 (Position, Velocity, MeshRef)
```

### 在 Archetype 中使用

```typescript
// Archetype 使用注册表创建掩码
class Archetype {
  constructor(
    private registry: ComponentRegistry,
    componentTypes: ComponentClass[]
  ) {
    // 创建掩码
    this.mask = registry.createMask(componentTypes);

    // 获取类型 ID
    this.componentTypeIds = componentTypes.map(
      type => registry.getTypeId(type)!
    );
  }
}

// World 使用注册表
class World {
  private registry = new ComponentRegistry();

  registerComponent<T>(type: ComponentClass<T>): ComponentTypeId {
    return this.registry.register(type);
  }

  getOrCreateArchetype(components: ComponentClass[]): Archetype {
    const mask = this.registry.createMask(components);
    const hash = mask.toString();

    // 查找或创建
    let archetype = this.archetypes.get(hash);
    if (!archetype) {
      archetype = new Archetype(this.registry, components);
      this.archetypes.set(hash, archetype);
    }

    return archetype;
  }
}
```

---

## 📊 容量限制

### 1024 组件类型限制

```
BitSet 容量: 1024 位
每个组件: 1 位
最大类型数: 1024

实际使用情况:
- 小型项目: 20-50 种组件
- 中型项目: 50-200 种组件
- 大型项目: 200-500 种组件
- 超大型: 500-1000 种组件

1024 足够覆盖绝大多数场景
```

### 溢出处理

```typescript
register<T>(type: ComponentClass<T>): ComponentTypeId {
  if (this.nextBitIndex >= 1024) {
    throw new Error(`
      ComponentRegistry 容量已满 (1024)
      当前已注册: ${this.nextBitIndex}

      解决方案:
      1. 合并相似组件
      2. 使用数据字段区分，而非组件类型
      3. 考虑拆分 World 为多个
    `);
  }
  // ...
}
```

---

## 🚫 负面约束

### 禁止事项

- 🚫 **不要重复注册同一组件**
  - 原因：会导致 ID 冲突
  - 正确：使用 isRegistered() 检查

- 🚫 **不要修改已注册的组件类**
  - 原因：可能导致类型不一致
  - 正确：定义好组件结构后再注册

- 🚫 **不要使用匿名类注册**
  - 原因：无法在其他地方引用
  - 正确：使用具名类或导出的类

- 🚫 **不要假设 ID 顺序**
  - 原因：ID 取决于注册顺序
  - 正确：通过 getTypeId() 查询

### 常见错误

```typescript
// ❌ 错误: 重复注册
registry.register(Position);
registry.register(Position); // 错误！

// ✅ 正确: 检查后注册
if (!registry.isRegistered(Position)) {
  registry.register(Position);
}

// ❌ 错误: 使用匿名类
registry.register(class { x = 0; }); // 无法引用

// ✅ 正确: 具名类
class MyComponent { x = 0; }
registry.register(MyComponent);

// ❌ 错误: 假设 ID 为 0
const posId = 0; // 硬编码
// 如果注册顺序改变，ID 会变！

// ✅ 正确: 动态查询
const posId = registry.getTypeId(Position);
```

---

## 📊 性能特征

### 时间复杂度

| 操作 | 复杂度 | 说明 |
| --- | --- | --- |
| `register()` | O(1) | Map 插入 |
| `getTypeId()` | O(1) | Map 查找 |
| `getTypeClass()` | O(1) | Map 查找 |
| `createMask()` | O(n) | n=组件数 |

### 内存占用

```
Per Component Type:
- ComponentMetadata: ~48 bytes
  - id: 4 bytes
  - type: 8 bytes (引用)
  - name: ~20 bytes (字符串)
  - bitIndex: 4 bytes
  - bitMask: ~12 bytes (BitSet 对象)

100 种组件: ~4.8 KB
1000 种组件: ~48 KB
```

---

## 🔗 相关文档

### 核心模块
- [Core ECS Architecture](../../architecture/core/core-ecs-architecture.md) - 整体架构
- [World](./world.md) - 中央调度器
- [Archetype](./archetype.md) - 内存布局
- [BitSet](../utils/bitset.md) - 位集合工具

### 类型系统
- [Component 设计](../patterns/component-design.md) - 组件设计模式
- [Type Safety](../guides/type-safety.md) - 类型安全指南

---

**版本**: 3.0.0
**状态**: ✅ 生产就绪
**最后更新**: 2025-12-19
