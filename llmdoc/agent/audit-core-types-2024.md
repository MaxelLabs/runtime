---
id: "audit-core-types"
type: "agent-report"
title: "Core Package Type Definition Compliance Audit"
description: "Audit report for type definitions in @maxellabs/core against the Type Definition Source of Truth rule"
tags: ["audit", "types", "compliance", "constitution"]
created: "2024-12-23"
updated: "2024-12-23"
status: "完成 ✅"
---

# Core 包类型定义合规性审计报告

## 📊 审计概要

| 分类 | 数量 | 状态 |
|------|------|------|
| ✅ P0 重复定义已修复 | 3 | 已修复 |
| ✅ P1 基础接口已迁移 | 2 | 已修复 |
| ✅ P1 资源类型已迁移 | 7 | 已修复 |
| ✅ P2 Layout 接口已迁移 | 10 | 已修复 |
| ✅ P2 Scene/Render 评估 | - | 保留在 Core |
| ✅ 正确的内部类型 | 30+ | 合规 |

---

## ✅ 已修复 - P0 重复定义

### Camera 组件 (`components/camera/index.ts`)
- ❌ ~~`ICameraComponent`~~ → ✅ 使用 `ICameraData` from spec
- ❌ ~~`ICameraTargetComponent`~~ → ✅ 使用 `ICameraTarget` from spec

### Light 组件 (`components/light/index.ts`)
- ❌ ~~`ILightComponent`~~ → ✅ 使用 `IDirectionalLightData`/`IPointLightData`/`ISpotLightData` from spec

---

## ✅ 已修复 - P1 基础接口迁移

### IDisposable / IReferable
位置：`@maxellabs/specification/core/interfaces.ts`

- ✅ `IDisposable` - 可释放资源接口
- ✅ `IReferable` - 可引用计数资源接口

Core 中 re-export 以兼容现有代码。

---

## ✅ 已修复 - P1 资源类型迁移

### 资源类型
位置：`@maxellabs/specification/core/resources.ts`

- ✅ `ResourceType` enum
- ✅ `ResourceState` enum
- ✅ `IResourceHandle` interface
- ✅ `IMeshResource` interface
- ✅ `ITextureResource` interface
- ✅ `IMaterialResource` interface
- ✅ `IResourceLoader<T>` interface

Core 中保留向后兼容的类型别名（标记为 deprecated）。

---

## ✅ 已修复 - P2 Layout 接口迁移

### Layout 布局接口
位置：`@maxellabs/specification/common/layout.ts`

- ✅ `ISizeConstraint` interface - 尺寸约束
- ✅ `IAnchor` interface - 锚点配置
- ✅ `IEdgeInsets` interface - 边距/内边距
- ✅ `IFlexContainer` interface - Flex 容器
- ✅ `IFlexItem` interface - Flex 子项
- ✅ `ILayoutResult` interface - 布局结果
- ✅ `FlexDirection` type - Flex 方向
- ✅ `FlexAlign` type - Flex 对齐
- ✅ `FlexJustify` type - Flex 主轴对齐
- ✅ `FlexWrap` type - Flex 换行

Core 中 re-export 以兼容现有代码。

---

## ✅ P2 评估结果 - 保留在 Core

### Scene 接口 (`scene/`)
评估结论：**保留在 Core**

| 类型 | 原因 |
|------|------|
| `SceneConfig` | 扩展内部 SceneOptions |
| `ComponentFactory<T>` | 内部工厂函数 |
| `ComponentRegistration<T>` | 内部注册信息 |

理由：纯粹是 Core 包的内部实现细节，不需要跨包共享。

### Render 接口 (`systems/render/`)
评估结论：**暂时保留在 Core**

| 类型 | 原因 |
|------|------|
| `Renderable` | 依赖 EntityId |
| `RenderContext` | 依赖 SystemContext |
| `RenderHook` | 内部钩子机制 |

理由：依赖 Core 内部类型，需要先迁移这些依赖才能迁移渲染接口。

---

## ✅ 合规：正确的包内部类型

以下类型仅限 Core 包内部使用，正确保留在 Core 中：

### ECS 内部实现类型 (`ecs/`)
- `EntityId`, `ComponentClass<T>`, `ComponentTypeId`
- `Query`, `QueryFilter`, `QueryResult`
- `SystemContext`, `SystemDef`, `SystemExecuteFn`
- `ChangeType`, `DirtyFlag`

### 存储优化类型 (`ecs/`)
- `TypedArrayConstructor`, `TypedArrayInstance`
- `ComponentFieldDef`, `NumericComponentDef`
- `MatrixSlotId`, `RenderSlotId`

### 系统内部类型 (`systems/`)
- `SystemMetadata`, `SystemExecutionStats`
- `ISystem`, `SystemConstructor`, `SystemFactory`

### 工具类型 (`utils/`)
- `CoreObjectPoolStats`, `ObjectPoolOptions`
- `ErrorInfo`, `ErrorConfig`

---

## 📋 修改文件清单

### Specification 包新增
- `packages/specification/src/core/interfaces.ts` - 添加 `IDisposable`, `IReferable`
- `packages/specification/src/core/resources.ts` - 新建，包含资源类型
- `packages/specification/src/common/layout.ts` - 新建，包含布局接口

### Core 包修改
- `packages/core/src/components/camera/index.ts` - 使用 Spec 接口
- `packages/core/src/components/light/index.ts` - 使用 Spec 接口
- `packages/core/src/components/layout/index.ts` - 使用 Spec 接口
- `packages/core/src/base/disposable.ts` - 从 Spec 导入
- `packages/core/src/base/refer-resource.ts` - 从 Spec 导入
- `packages/core/src/resources/index.ts` - 从 Spec 导入

---

## ✅ 合规性检查清单

- [x] 所有跨包使用的接口已迁移到 Spec
- [x] 所有重复定义已删除
- [x] 保留向后兼容的 re-export
- [x] 构建验证通过
- [x] 内部类型正确保留在 Core
