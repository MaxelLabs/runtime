# OpenUSD 架构设计

## 1. Identity

**OpenUSD 架构** 是一个基于 Universal Scene Description 格式的模块化场景描述系统，为 3D Web 应用提供标准化的数据表达和交互框架。

**Purpose**: 实现 3D 场景数据的标准化描述，支持跨平台内容创作和渲染管线统一。

## 2. 核心组件

- `packages/specification/src/core/usd.ts` (UsdPrim, UsdStage, UsdLayer, UsdValue): USD 核心数据类型和 Prim 系统
- `packages/specification/src/core/interfaces.ts` (ITransform, MaterialProperties, AnimationProperties): 核心业务接口定义
- `packages/specification/src/core/enums.ts` (UsdDataType, VisualEffectType, MaterialType): 枚举类型定义
- `packages/specification/src/animation/core.ts` (UsdAnimationClip, UsdAnimationTrack): USD 动画系统核心
- `packages/specification/src/design/components.ts` (DesignComponent, DesignComponentProperty): 设计系统组件
- `packages/specification/src/rendering/`: 渲染管线相关接口定义
- `packages/specification/src/common/`: 通用元素和组件定义

## 3. 执行流程 (LLM Retrieval Map)

- **1. 场景解析**: USD 文件被解析为 `UsdStage` 对象，包含 `rootLayer` 和 `pseudoRoot`
- **2. Prim 构建**: 每个 USD Prim 转换为 `UsdPrim` 对象，包含属性、关系、子节点等
- **3. 属性绑定**: 属性通过 `UsdValue` 统一表达，支持时间采样和类型安全
- **4. 组合处理**: 处理 SubLayer、Reference、Payload 等组合弧，构建场景层次
- **5. 扩展解析**: 解析 Maxellabs 扩展属性，添加业务特定功能
- **6. 动画集成**: 动画数据作为独立的 `UsdAnimationClip` 集成到场景中
- **7. 材质应用**: 材质定义通过 `MaterialProperties` 绑定到几何体

## 4. 设计原理

### 4.1 分层架构

```
应用层 (@maxellabs/engine)
    ↓
渲染抽象层 (@maxellabs/rhi)
    ↓
核心业务层 (@maxellabs/core)
    ↓
USD 描述层 (@maxellabs/specification)
    ↓
数学基础层 (@maxellabs/math)
```

### 4.2 USD 扩展策略

- **Custom 属性**: 通过 `custom` 前缀添加 Maxellabs 特定功能
- **命名空间**: 使用 `maxellabs:` 命名空间避免冲突
- **类型安全**: 保持与原生 USD 类型系统的兼容性

### 4.3 模块化设计

每个模块都有明确的职责边界：
- **core**: 基础类型和接口定义
- **common**: 通用元素和组件
- **animation**: 动画系统和控制
- **design**: 设计系统和界面元素
- **rendering**: 渲染管线和着色器
- **workflow**: 工作流定义和执行