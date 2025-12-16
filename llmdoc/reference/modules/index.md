# 模块文档索引

## 核心渲染模块

### [渲染管线整合 (Rendering Pipeline Integration)](./rendering-pipeline.md)
- **描述**: 完整的渲染管线整合指南
- **内容**: PBR+Shadow+IBL集成、后处理链集成、性能分析、最佳实践
- **适用场景**: 高质量3D渲染、复杂视觉效果集成

### [后处理系统 (Post-Processing System)](./post-processing-system.md)
- **描述**: 强大的图像处理框架
- **内容**: 管道式设计、效果链组合、内置效果、自定义效果开发
- **适用场景**: 图像后处理、视觉效果、画面美化

### [FXAA抗锯齿 (FXAA Anti-Aliasing)](./fxaa-anti-aliasing.md)
- **描述**: 快速近似抗锯齿技术
- **内容**: 算法原理、参数调优、性能分析、使用示例
- **适用场景**: 实时抗锯齿、性能敏感场景

## 材质系统

### PBR材质系列
- [SimplePBR材质使用指南](../learning/tutorials/pbr-migration-guide.md) - PBR材质迁移指南
- [PBR材质基础](./pbr-basics.md) - PBR渲染原理介绍
- [材质参数详解](./material-parameters.md) - 详细的材质参数说明

### 传统材质
- [基础材质](./basic-material.md) - Lambert、Phong等传统材质
- [纹理映射](./texture-mapping.md) - 纹理使用和管理

## 光照系统

### [阴影映射 (Shadow Mapping)](./shadow-mapping.md)
- **描述**: 实时阴影渲染技术
- **内容**: 阴影贴图生成、PCF软阴影、级联阴影贴图
- **适用场景**: 动态阴影、光照效果增强

### 环境光照
- [IBL光照](./ibl-lighting.md) - 基于图像的光照
- [天空盒渲染](./skybox-rendering.md) - 环境背景渲染

## 几何处理

### [几何体生成器](./geometry-generator.md)
- **描述**: 基础几何体生成工具
- **内容**: 立方体、球体、圆柱体等基础几何体
- **适用场景**: 快速原型、测试场景

### [网格处理](./mesh-processing.md)
- **描述**: 网格数据处理和优化
- **内容**: 网格简化、LOD生成、法线计算

## 动画系统

### 骨骼动画
- [骨骼系统](./skeletal-animation.md) - 骨骼动画基础
- [蒙皮渲染](./skinned-mesh.md) - 蒙皮网格渲染

### 变换动画
- [关键帧动画](./keyframe-animation.md) - 关键帧动画系统
- [变形动画](./morph-animation.md) - 目标变形动画

## 物理集成

### [碰撞检测](./collision-detection.md)
- **描述**: 几何体碰撞检测算法
- **内容**: AABB、OBB、射线检测
- **适用场景**: 物理交互、拾取操作

### [基础物理](./basic-physics.md)
- **描述**: 简单物理模拟
- **内容**: 重力、碰撞响应、运动模拟

## 工具类库

### 数学工具
- [向量运算](./math-vectors.md) - Vector2/3/4操作
- [矩阵运算](./math-matrices.md) - Matrix3/4操作和变换
- [四元数](./math-quaternions.md) - 旋转表示和插值

### 实用工具
- [相机控制器](./camera-controllers.md) - 轨道、飞行、第一人称相机
- [GUI系统](./gui-system.md) - 界面控件和调试面板
- [性能监控](./performance-monitoring.md) - FPS、内存使用监控

## 扩展模块

### [粒子系统](./particle-system.md)
- **描述**: 高性能粒子效果系统
- **内容**: 粒子发射器、物理模拟、渲染优化
- **适用场景**: 火焰、烟雾、爆炸等特效

### [水体渲染](./water-rendering.md)
- **描述**: 真实水体效果渲染
- **内容**: 水面波动、反射折射、泡沫效果
- **适用场景**: 海洋、河流、湖泊

### [地形系统](./terrain-system.md)
- **描述**: 大规模地形渲染
- **内容**: 高度图、纹理混合、LOD优化
- **适用场景**: 开放世界、室外场景

## 性能优化

### 渲染优化
- [批次渲染](./batch-rendering.md) - 减少Draw Call
- [实例化渲染](./instanced-rendering.md) - GPU实例化技术
- [遮挡剔除](./occlusion-culling.md) - 视锥剔除优化

### 内存优化
- [纹理压缩](./texture-compression.md) - 纹理格式优化
- [几何体压缩](./geometry-compression.md) - 顶点数据压缩
- [资源池管理](./resource-pooling.md) - 资源复用系统

## 平台特定

### WebGL特定
- [WebGL限制](./webgl-limitations.md) - 平台限制和解决方案
- [WebGL性能](./webgl-performance.md) - 平台特定优化
- [移动端适配](./mobile-adaptation.md) - 移动设备优化

### 浏览器集成
- [响应式设计](./responsive-design.md) - 不同屏幕适配
- [触摸控制](./touch-controls.md) - 移动端交互
- [全屏模式](./fullscreen-mode.md) - 沉浸式体验

## 开发工具

### 调试工具
- [着色器调试](./shader-debugging.md) - GLSL调试技巧
- [性能分析器](./profiler-tools.md) - 性能瓶颈分析
- [内存检查器](./memory-inspector.md) - 内存泄漏检测

### 编辑器扩展
- [场景编辑器](./scene-editor.md) - 可视化场景编辑
- [材质编辑器](./material-editor.md) - 材质参数调整
- [动画编辑器](./animation-editor.md) - 动画曲线编辑

---

## 文档使用指南

### 快速查找
1. **按功能模块** - 在相应分类下查找
2. **按应用场景** - 查看适用场景描述
3. **按关键词** - 使用全文搜索功能

### 学习路径
1. **初学者** → 核心渲染模块 → 基础几何处理 → 简单材质
2. **进阶开发者** → PBR系统 → 光照系统 → 性能优化
3. **高级开发者** → 扩展模块 → 平台特定 → 开发工具

### 贡献指南
- 文档缺失？请提交Issue
- 发现错误？欢迎Pull Request
- 新模块开发？请参考文档规范

### 最后更新
- **更新时间**: 2025-12-17
- **版本**: v1.0
- **维护者**: Graphics Team