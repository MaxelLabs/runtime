# Maxellabs Specification

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![npm version](https://badge.fury.io/js/%40maxellabs%2Fspecification.svg)](https://badge.fury.io/js/%40maxellabs%2Fspecification)

## 项目概述

Maxellabs Specification 是一个综合性的设计到开发规范库，提供了从UI设计、动画系统、渲染管线到部署工作流的完整类型定义和接口规范。

### 核心特性

- **统一类型系统**: 跨设计、动画、渲染、工作流的统一类型定义
- **USDZ兼容**: 基于USDZ标准扩展的.maxz包格式
- **模块化架构**: 清晰的模块边界和依赖关系
- **TypeScript优先**: 完整的类型安全和智能提示
- **工作流集成**: 从设计到部署的端到端工作流支持

## 模块架构

### 📦 核心模块 (Core)

**路径**: `src/core/`

- **职责**: 系统基础定义、数学工具、USD集成
- **导出**: 基础类型、枚举、接口、USD扩展
- **依赖**: 无外部依赖（纯基础定义）

### 🎨 设计模块 (Design)

**路径**: `src/design/`

- **职责**: 设计系统、UI元素、样式系统
- **关键特性**:
  - 响应式设计约束
  - 主题系统
  - 组件库规范
  - 协作权限管理
- **依赖**: Core, Common, Package

### 🎬 动画模块 (Animation)

**路径**: `src/animation/`

- **职责**: 动画状态机、时间轴、粒子系统
- **关键特性**:
  - 状态机系统
  - 动画混合器
  - 粒子物理
  - 缓动函数库
- **依赖**: Core, Common, Package

### 🎭 通用模块 (Common)

**路径**: `src/common/`

- **职责**: 跨系统共享的通用类型和工具
- **子模块**:
  - Elements: 通用UI元素
  - Animation: 通用动画类型
  - Frame: 帧动画系统
  - RHI: 渲染硬件接口
  - Texture, Material, Text, Image, Sprite
- **依赖**: Core, Package

### 📋 包格式模块 (Package)

**路径**: `src/package/`

- **职责**: .maxz包格式定义、构建配置、部署规范
- **关键特性**:
  - 基于USDZ的扩展格式
  - 资产清单管理
  - 构建优化配置
  - 安全策略定义
- **依赖**: Core, Design, Workflow

### 🎮 渲染模块 (Rendering)

**路径**: `src/rendering/`

- **职责**: 渲染管线、材质系统、几何处理
- **关键特性**:
  - 几何体优化
  - 材质系统
  - 渲染配置
- **依赖**: Core, Common, Package

### 🔄 工作流模块 (Workflow)

**路径**: `src/workflow/`

- **职责**: 设计到部署的完整工作流定义
- **关键特性**:
  - 质量门控制
  - 自动化部署
  - 兼容性检查
- **依赖**: Core, Package

## 快速开始

### 安装

```bash
npm install @maxellabs/specification
```

### 基础使用

```typescript
import type {
  DesignDocument,
  AnimationState,
  MaxellabsPackage
} from '@maxellabs/specification';

// 创建设计文档
const designDoc: DesignDocument = {
  id: 'hero-section',
  name: '首页英雄区域',
  elements: [...],
  constraints: {...}
};

// 定义动画状态
const idleState: AnimationState = {
  id: 'idle',
  name: '待机状态',
  clip: 'character_idle',
  speed: 1.0,
  loop: true,
  weight: 1.0
};

// 构建Maxellabs包
const package: MaxellabsPackage = {
  version: '1.0.0',
  metadata: {...},
  designDocuments: [designDoc],
  workflows: [...],
  configuration: {...}
};
```

### 模块导入路径

```typescript
// 核心类型
import type { ElementType } from '@maxellabs/specification/core';

// 设计系统
import type { DesignElement } from '@maxellabs/specification/design';

// 动画系统
import type { AnimationState } from '@maxellabs/specification/animation';

// 通用类型
import type { CommonElement } from '@maxellabs/specification/common';

// 包格式
import type { MaxellabsPackage } from '@maxellabs/specification/package';
```

## 架构原则

### 1. 单向依赖

- 无循环依赖（已通过验证）
- 清晰的层次结构：Core → Common → 功能模块 → Package

### 2. 权威来源

- 每种类型只有一个权威定义位置
- 其他模块通过类型导入引用
- 避免重复定义

### 3. 渐进式增强

- 基础类型在Core中定义
- 功能模块在其范围内扩展
- 保持向后兼容性

### 4. 类型安全

- 100% TypeScript覆盖
- 严格的类型检查
- 完整的IDE支持

## 开发指南

### 贡献规范

1. **类型定义规范**

   - 使用PascalCase命名接口和类型
   - 使用camelCase命名属性
   - 提供完整的JSDoc注释

2. **模块组织**

   - 每个模块有清晰的职责边界
   - 使用index.ts统一导出
   - 避免跨模块重复定义

3. **依赖管理**
   - 禁止循环依赖
   - 优先使用类型导入
   - 保持最小依赖原则

### 代码示例

#### 创建自定义动画状态

```typescript
import type { AnimationState } from '@maxellabs/specification/animation';

const customState: AnimationState = {
  id: 'custom-animation',
  name: '自定义动画',
  clip: 'path/to/animation',
  speed: 1.5,
  loop: false,
  weight: 0.8,
  fadeInTime: 0.3,
  fadeOutTime: 0.3,
  behaviors: [
    {
      id: 'on-complete',
      type: 'on-state-exit',
      parameters: { action: 'next-state' },
    },
  ],
};
```

#### 定义响应式设计约束

```typescript
import type { DesignConstraints } from '@maxellabs/specification/design';

const responsiveConstraints: DesignConstraints = {
  left: { type: 'percentage', value: 10 },
  right: { type: 'percentage', value: 10 },
  top: { type: 'fixed', value: 20 },
  width: { type: 'parent', value: 0.8 },
  height: { type: 'auto' },
};
```

## 变更日志

查看 [CHANGELOG.md](./CHANGELOG.md) 获取完整的版本历史。

## 许可证

MIT License - 查看 [LICENSE](../LICENSE) 文件获取详情。
