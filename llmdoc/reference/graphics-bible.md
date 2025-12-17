---
title: "图形系统圣经 - 重定向"
id: "graphics-bible-redirect"
type: "redirect"
tags: ["graphics", "coordinate-system", "matrix-order", "color-space", "rendering-pipeline"]
related_ids: ["graphics-system-bible"]
token_cost: "low"
context_dependency: []
redirect_to: "../foundations/graphics-bible.md"
---

# 图形系统圣经 - 重定向

> **注意：** 此文档已移动到新的权威位置。请更新您的书签和引用。

## 📍 权威位置

**图形系统圣经**的官方版本现在位于：
[`../foundations/graphics-bible.md`](../foundations/graphics-bible.md)

## 📋 文档内容概述

该文档定义了项目图形系统的核心宪法，包括：

### 🎯 核心内容
- **坐标系定义**：右手坐标系标准和验证方法
- **矩阵系统**：列主序布局和后乘规则
- **变换管线**：MVP变换流程和透视除法
- **纹理系统**：UV坐标、双线性插值和颜色空间转换
- **性能约束**：数值精度和对象创建规范

### 🔧 技术规范
- 列主序矩阵内存布局
- 右手定则验证代码
- 双线性插值算法实现
- Gamma校正颜色空间转换
- std140对齐规则

### ⚡ 性能要求
- EPSILON浮点数比较标准
- 对象池和复用模式
- 禁止循环中创建对象

## 🏗️ 为什么重构？

1. **消除重复**：避免维护两个相似文档
2. **建立权威**：`foundations/` 作为核心规范层
3. **提升可发现性**：统一文档结构和导航
4. **LLM-Native优化**：增强AI可理解性和处理效率

## 🔗 相关文档

### 核心规范
- [项目编码规范](../foundations/coding-conventions.md) - TypeScript编码标准
- [RHI Demo宪法](../foundations/rhi-demo-constitution.md) - Demo实现规范

### 技术实现
- [矩阵数学API](../api/math-type-reference.md) - 数学库参考
- [渲染管线](../advanced/integration/rendering-pipeline.md) - 管线集成

### 应用模块
- [PBR材质系统](./pbr-material-system.md) - 遵循图形圣经的PBR实现
- [阴影工具](./shadow-tools.md) - 基于图形圣经的阴影系统

---

> **最后更新：** 2025-12-17
>
> 此重定向确保所有引用指向统一的权威文档版本，减少维护负担并提高一致性。