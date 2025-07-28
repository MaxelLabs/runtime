# Maxellabs Specification 文档

本文档系统基于 `packages/specification/src` 目录结构，为每个 TypeScript 文件生成对应的 Markdown 文档，确保 docs 与 src 目录结构镜像对应。

## 📁 文档结构

### 核心模块 (`core/`)

- [接口定义](./core/interfaces.md) - 核心接口和类型定义
- [枚举定义](./core/enums.md) - 核心枚举类型
- [基础类型](./core/base.md) - 基础数据类型和常量

### 设计模块 (`design/`)

- [颜色系统](./design/colors.md) - 设计颜色系统和调色板
- [组件定义](./design/components.md) - 设计组件和组件库管理

### 模块清单

| 模块         | 状态      | 文件数 | 最后更新   |
| ------------ | --------- | ------ | ---------- |
| `core/`      | ✅ 完成   | 3      | 2024-07-28 |
| `design/`    | 🔄 进行中 | 2/13   | 2024-07-28 |
| `animation/` | ⏳ 待开始 | 0/11   | -          |
| `common/`    | ⏳ 待开始 | 0/18   | -          |
| `package/`   | ⏳ 待开始 | 0/2    | -          |
| `rendering/` | ⏳ 待开始 | 0/2    | -          |
| `workflow/`  | ⏳ 待开始 | 0/2    | -          |

## 🎯 文档规范

### 文档结构

每个文档文件遵循统一的七大部分结构：

1. **模块名** - 二级标题标识
2. **接口总览** - 表格形式展示所有接口
3. **枚举总览** - 表格形式展示所有枚举
4. **核心接口详解** - 完整类型签名和字段说明
5. **枚举值详解** - 枚举值详情和使用场景
6. **使用示例** - 三段递进示例（最小可运行、业务封装、边界处理）
7. **最佳实践** - 类型收窄、运行时校验、协议对齐、国际化
8. **变更日志** - 倒序时间轴记录版本历史

### 交叉引用

- 所有类型链接采用相对路径
- 格式：`[TypeName](./relative/path.md#typename)`
- 支持跳转到具体类型定义

### 代码规范

- 所有代码块使用 `tsx` 语法高亮
- 行内符号使用反引号包裹
- 中文技术语境，避免口语化

## 🚀 快速开始

### 安装依赖

```bash
npm install @maxellabs/specification
```

### 基本使用

```typescript
// 导入核心类型
import type { VisualEffect, ITransform } from '@maxellabs/specification/core';
import type { DesignComponent } from '@maxellabs/specification/design';

// 使用颜色系统
import { createBrandColorSystem } from '@maxellabs/specification/design/colors';
```

## 📚 使用指南

### 按模块浏览

- **核心模块**: 基础类型、接口定义、枚举
- **设计模块**: 设计系统、颜色、组件、排版
- **动画模块**: 动画系统、粒子效果、时间轴
- **通用模块**: 通用元素、交互、资源管理

### 按场景使用

- **UI设计**: 使用 `design/` 模块
- **动画制作**: 使用 `animation/` 模块
- **3D渲染**: 使用 `rendering/` 模块
- **包管理**: 使用 `package/` 模块

## 🔗 相关链接

- [快速开始指南](./QUICK_START.md)
- [GitHub Issues](https://github.com/maxellabs/specification/issues)
- [官方文档](https://docs.maxellabs.com)
- [社区论坛](https://forum.maxellabs.com)

## 📈 更新日志

### 2024-07-28

- 完成核心模块文档（interfaces.md, enums.md, base.md）
- 完成设计模块颜色系统文档（colors.md）
- 完成设计模块组件定义文档（components.md）
- 建立文档结构和交叉引用体系

### 2024-07-27

- 初始化文档项目结构
- 创建文档生成框架
