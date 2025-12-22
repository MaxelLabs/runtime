---
id: "component-refactoring-plan"
type: "strategy"
title: "组件重构方案 - 基于 Specification"
description: "ECS 组件系统重构策略文档，记录从旧架构迁移到基于 Specification 接口的新架构的决策过程"
tags: ["ecs", "components", "refactoring", "specification", "architecture"]
context_dependency: ["core-ecs-architecture", "spec-type-system"]
related_ids: ["core-components"]
version: "1.0.0"
last_updated: "2025-12-23"
---

> **文档状态**: 已完成 ✅
> **最终决策**: 方案 B (扩展 Specification)
> **原始位置**: `packages/core/src/components/REFACTORING_PLAN.md` (已移除)

> **注意**: 原始的 `packages/core/src/components/REFACTORING_PLAN.md` 已移除，相关内容归档至此文档。

## 📋 重构原则

### ✅ 已完成

#### 1. **Transform 组件** - 完全基于 `ITransform`

```typescript
// specification/core/interfaces.ts
export interface ITransform {
  position: Vector3Like;
  rotation: QuaternionLike;
  scale: Vector3Like;
  matrix?: Matrix4Like;
  anchor?: Vector3Like;
  space?: TransformSpace;  // 新增：变换空间
}

// core/src/components/transform/index.ts
export class LocalTransform implements ITransform {
  position: Vector3Like = { x: 0, y: 0, z: 0 };
  rotation: QuaternionLike = { x: 0, y: 0, z: 0, w: 1 };
  scale: Vector3Like = { x: 1, y: 1, z: 1 };
  matrix?: Matrix4Like;
  anchor?: Vector3Like;
  space?: TransformSpace;
  dirty: boolean = true; // ECS 专用字段

  static fromData(data: ITransform): LocalTransform {
    // 从 spec ITransform 解析，包含空值检查
  }
}
```

**特点**:
- ✅ 直接实现 `ITransform` 接口
- ✅ `fromData()` 接收完整的 `ITransform` 类型
- ✅ 所有字段严格遵循 specification 定义
- ✅ 可以添加 ECS 专用字段 (如 `dirty`)
- ✅ 包含空值检查，防止运行时错误

---

## 🎯 最终决策

### **采用方案 B: 扩展 Specification**

在 specification 包中补充了缺失的定义，所有 ECS 组件严格实现对应接口：

```typescript
// specification/src/core/ecs.ts
export interface IMeshRef {
  assetId: string;
  meshName?: string;
  submeshIndex?: number;
}

export interface IMaterialRef {
  assetId: string;
  overrides?: Record<string, unknown>;
  enabled?: boolean;
}

export interface IVisible {
  value: boolean;
}

export interface ILayer {
  mask: number;
}

export interface ICastShadow {
  value: boolean;
}

export interface IReceiveShadow {
  value: boolean;
}
```

然后 ECS 组件严格实现：

```typescript
export class MeshRef implements IMeshRef {
  static fromData(data: IMeshRef): MeshRef { }
}

export class MaterialRef implements IMaterialRef {
  static fromData(data: IMaterialRef): MaterialRef { }
}
```

**优点**:
- ✅ 完全统一
- ✅ 类型定义集中管理
- ✅ 更好的跨包一致性
- ✅ 类型安全

---

## 📊 重构完成状态

### 所有组件

| 组件 | 基于 Spec | 状态 |
|------|-----------|------|
| `LocalTransform` | ✅ `ITransform` | ✅ 完成 |
| `WorldTransform` | ✅ `ITransform` | ✅ 完成 |
| `Parent` | ✅ `IParent` | ✅ 完成 |
| `Children` | ✅ `IChildren` | ✅ 完成 |
| `Color` | ✅ `ColorLike` | ✅ 完成 |
| `TextureRef` | ✅ `BaseTextureRef` | ✅ 完成 |
| `MeshRef` | ✅ `IMeshRef` | ✅ 完成 |
| `MaterialRef` | ✅ `IMaterialRef` | ✅ 完成 |
| `Visible` | ✅ `IVisible` | ✅ 完成 |
| `Layer` | ✅ `ILayer` | ✅ 完成 |
| `CastShadow` | ✅ `ICastShadow` | ✅ 完成 |
| `ReceiveShadow` | ✅ `IReceiveShadow` | ✅ 完成 |
| `AnimationState` | ✅ `IAnimationState` | ✅ 完成 |
| `AnimationClipRef` | ✅ `IAnimationClipRef` | ✅ 完成 |
| `Timeline` | ✅ `ITimeline` | ✅ 完成 |
| `TweenState` | ✅ `ITweenState` | ✅ 完成 |
| `Name` | ✅ `IName` | ✅ 完成 |
| `Tag` | ✅ `ITag` | ✅ 完成 |
| `Tags` | ✅ `ITags` | ✅ 完成 |
| `Metadata` | ✅ `IMetadata` | ✅ 完成 |
| `Disabled` | ✅ `IDisabled` | ✅ 完成 |
| `Static` | ✅ `IStatic` | ✅ 完成 |

---

## 📝 实现规范

### fromData() 方法规范

所有组件的 `fromData()` 方法遵循以下规范：

1. **参数类型**: 直接使用 Specification 中定义的接口类型
2. **空值检查**: 对必需字段进行空值检查，缺失时使用默认值
3. **深拷贝**: 对象类型字段必须进行深拷贝，避免引用共享
4. **返回类型**: 返回组件实例

```typescript
static fromData(data: ISpecInterface): ComponentClass {
  const component = new ComponentClass();
  
  // 空值检查示例
  if (data.field) {
    component.field = {
      x: data.field.x ?? defaultValue,
      // ...
    };
  }
  
  // 深拷贝示例
  if (data.objectField) {
    component.objectField = { ...data.objectField };
  }
  
  return component;
}
```

### 命名约定

- `fromData()`: 从 ECS 组件接口创建（运行时数据）
- `fromSpecData()`: 从场景文件格式创建（需要字段映射时）

---

## 🔗 相关文档

- [ECS 架构文档](../architecture/core/core-ecs-architecture.md)
- [Specification 类型参考](../api-standardized/specification-type-reference.md)