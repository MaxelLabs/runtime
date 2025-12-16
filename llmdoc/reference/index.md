# Reference 参考层

本层提供完整的技术参考文档，包括API文档、架构说明和模块规范。

## 技术参考

### 🔌 API Documentation
- [RHI API](api/) - 渲染硬件接口API
- [Math API](api/math-type-reference.md) - **常用**：数学库API参考
- [Utils API](api/) - 工具函数API
- [Shader工具API](api/shader-utils-reference.md) - 着色器开发工具
- [Specification API](api/specification-type-reference.md) - 类型系统API

### 🏗️ Architecture
- [Engine Architecture](architecture/) - 引擎架构设计
- [Math Architecture](architecture/) - 数学模块架构
- [RHI Architecture](architecture/) - 渲染硬件接口架构

### 📦 核心工具模块 ✅
- [**PBR材质系统**](pbr-material-system.md) - **核心**：基于物理的渲染实现
- [**阴影工具**](shadow-tools.md) - 实时阴影渲染工具
- [**天空盒系统**](skybox-system.md) - 环境渲染与IBL
- [**粒子系统**](particle-system.md) - GPU加速粒子效果
- [**实例化渲染工具**](instancing-tools.md) - 高效批量渲染

### 🎬 后处理模块 🆕
- [**后处理系统**](modules/post-processing-system.md) - **核心**：完整的后处理框架
- [**FXAA抗锯齿**](modules/fxaa-anti-aliasing.md) - **推荐**：快速抗锯齿技术
- [更多后处理模块](modules/) - 模块索引

### 🎮 Demos
- [Basic Demos](demos/) - 基础演示
- [Advanced Demos](demos/) - 高级演示
- [Integration Demos](demos/) - 集成演示

## 🎮 Demo演示集合 (27个完整演示)

### 🔥 推荐演示
- [**FXAA抗锯齿演示**](../../../packages/rhi/demo/html/fxaa.html) - **体验**：实时抗锯齿效果对比
- [**后处理系统演示**](../../../packages/rhi/demo/html/post-process.html) - **体验**：完整后处理效果链
- [**阴影映射演示**](../../../packages/rhi/demo/html/shadow-mapping.html) - **经典**：实时阴影技术
- [**PBR材质演示**](../../../packages/rhi/demo/html/pbr-material.html) - **核心**：现代PBR渲染效果

### 渲染技术演示
- [Flat Shading Demo](flat-shading-demo.md) - 平面着色技术
- [Gouraud Shading Demo](gouraud-shading-demo.md) - 高洛德着色
- [Phong Lighting Demo](phong-lighting-demo.md) - 冯氏光照模型
- [GPU Instancing Demo](instancing-demo.md) - 高效批量渲染

### 纹理技术演示
- [Procedural Texture Demo](procedural-texture-demo.md) - 程序化纹理生成
- [Compressed Texture Demo](compressed-texture-demo.md) - 纹理压缩技术
- [Texture Array Demo](texture-array-demo.md) - 纹理数组应用
- [Render to Texture Demo](render-to-texture-demo.md) - �屏渲染技术

### 光照系统演示
- [Directional Light Demo](directional-light-demo.md) - 方向光源实现
- [Point Lights Demo](point-lights-demo.md) - 点光源系统
- [Spotlight Demo](spotlight-demo.md) - 聚光灯效果

### 高级技术演示
- [Particle System Demo](particle-system.md) - GPU粒子系统
- [Shadow Mapping Demo](shadow-mapping-demo.md) - 深度阴影映射
- [Cubemap Skybox Demo](cubemap-skybox-demo.md) - 立方体贴图天空盒
- [Frustum Culling Demo](frustum-culling-demo.md) - 视锥体剔除优化

---

## 🔗 主题关联网络

### 🎯 完整渲染管线主题链
**学习路径**：[方向光源Demo](directional-light-demo.md) → [Phong光照Demo](phong-lighting-demo.md) → [PBR材质系统](pbr-material-system.md) → [阴影映射Demo](shadow-mapping-demo.md) → [后处理系统](modules/post-processing-system.md)
**完整体验**：[Demo主页](../../../packages/rhi/demo/index.html) → 选择技术组合

### 🚀 性能优化主题链
**理论基础**：[GPU实例化Demo](instancing-demo.md) + [视锥体剔除Demo](frustum-culling-demo.md)
**实践应用**：[PBR迁移指南](../learning/tutorials/pbr-migration-guide.md) + [后处理系统](modules/post-processing-system.md)

### 🎨 现代渲染技术主题链
**核心技术**：[PBR材质系统](pbr-material-system.md) + [阴影映射Demo](shadow-mapping-demo.md) + [后处理系统](modules/post-processing-system.md) + [FXAA抗锯齿](modules/fxaa-anti-aliasing.md)
**相关技术**：[天空盒系统](skybox-system.md) + [粒子系统](particle-system.md)

## 导航

- [🏛️ Foundations](../foundations/) - 基础层（理论基础）
- [📚 Learning](../learning/) - 学习层（系统教程）
- [⚡ Advanced](../advanced/) - 高级层（深度集成）