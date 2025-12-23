---
# Identity
id: "architecture-logic-systems"
type: "architecture"
title: "Logic Systems Architecture"

# Semantics
description: "System execution stages, dependencies, and data flow for TransformSystem, LayoutSystem, AnimationSystem, and InteractionSystem"
tags: ["architecture", "systems", "ecs", "transform", "layout", "animation", "interaction"]
context_dependency: ["architecture-system-overview"]
related_ids: ["data-models-core"]
---

## 1. Identity

**What it is:** Phase 4 逻辑系统的执行架构，定义系统调度阶段和依赖关系。

**Purpose:** 为 ECS World 提供可预测的系统执行顺序，确保 TransformSystem 在 LayoutSystem 之前执行，AnimationSystem 在 Update 阶段执行。

## 2. Core Components

- `packages/core/src/systems/types.ts` (ISystem, SystemMetadata, SystemExecutionStats): System 接口定义和元数据类型。
- `packages/core/src/systems/transform/index.ts` (TransformSystem, createTransformSystemDef): 层级变换矩阵计算。
- `packages/core/src/systems/layout/index.ts` (LayoutSystem, createLayoutSystemDef): Anchor 和 Flexbox 布局计算。
- `packages/core/src/systems/animation/index.ts` (AnimationSystem, getTweenValue, createAnimationSystemDef): 动画时间推进和缓动插值。
- `packages/core/src/systems/interaction/index.ts` (InteractionSystem, createInteractionSystemDef): 交互检测骨架（待实现）。
- `packages/core/src/ecs/types.ts` (SystemStage, SystemContext, Query): System 执行阶段枚举和上下文类型。

## 3. Execution Flow (LLM Retrieval Map)

```pseudocode
// FrameStart 阶段
InteractionSystem.execute():
  1. 获取指针输入状态
  2. 执行射线检测
  3. 更新交互状态 (hovered, pressed)

// Update 阶段
AnimationSystem.execute():
  1. 更新 AnimationState.time += deltaTime * speed
  2. 更新 TweenState.progress += deltaTime / duration
  3. 更新 Timeline.currentTime += deltaTime * speed
  4. 处理循环和结束状态

// PostUpdate 阶段 (按 priority 排序)
TransformSystem.execute(priority: 0):
  FOR each entity WITH (LocalTransform, WorldTransform):
    IF LocalTransform.dirty:
      parentMatrix = getParentWorldMatrix(entity)
      worldMatrix = parentMatrix * localMatrix
      WorldTransform.matrix = decompose(worldMatrix)
      markChildrenDirty(entity)

LayoutSystem.execute(priority: 10, after: ['TransformSystem']):
  1. processAnchorLayout():
     FOR each entity WITH (Anchor, LayoutResult):
       parentSize = getParentSize(entity)
       result.x = anchor.minX * parentSize.width + margin.left
       result.width = (anchor.maxX - anchor.minX) * parentSize.width

  2. processFlexLayout():
     FOR each entity WITH (FlexContainer, Children):
       children = collectFlexChildren()
       calculateFlexSpaceDistribution(children)
       applyFlexPositions(children)
```

## 4. Design Rationale

**SystemStage 分层设计:**
- FrameStart: 处理输入事件，最早执行确保交互状态可用于游戏逻辑
- Update: 游戏逻辑更新，动画状态推进在变换计算之前
- PostUpdate: 变换和布局计算，确保渲染使用最新的世界坐标

**依赖关系:**
- LayoutSystem 依赖 TransformSystem: 布局计算需要父级 WorldTransform 结果
- priority 数字越小越先执行: TransformSystem (0) → LayoutSystem (10)

**脏标记优化:**
- TransformSystem 只处理 dirty 的 LocalTransform，级联标记子节点
- LayoutSystem 只处理 dirty 的 Anchor/FlexContainer，避免重复计算

## 5. 禁止事项

- 🚫 **在 PostUpdate 之后修改 Transform**: 会导致渲染时使用过时的矩阵
- 🚫 **在 LayoutSystem 执行前读取 LayoutResult**: 结果尚未计算
- 🚫 **在系统间共享临时对象**: 使用实例级临时变量避免每帧分配
- 🚫 **跳过脏标记检查**: 导致不必要的计算和性能浪费
