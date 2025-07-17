# Maxellabs 3D Engine - 数据规范包

基于 OpenUSD 格式的全流程数据描述包，支持从设计到上线的完整工作流程。

## 概述

本包提供了一套完整的数据描述规范，基于 OpenUSD (Universal Scene Description) 标准扩展，支持：

- **Web 引擎数据描述**：3D 场景、几何体、材质、光照等
- **动效引擎数据**：动画、时间轴、关键帧、缓动函数等
- **设计工具数据**：Figma 设计文档、组件库、设计系统等
- **图标数据系统**：SVG 图标库、分类管理、变体支持等
- **工作流程管理**：从设计到部署的完整流程定义
- **包格式规范**：基于 USDZ 的 .maxz 包格式

## 技术特性

### 1. 基于 OpenUSD 标准

- 完全兼容 OpenUSD 规范
- 支持 USD 的所有组合功能
- 可与现有 USD 工具链集成

### 2. 全流程数据描述

- 设计工具数据（Figma、Sketch 等）
- 3D 引擎数据（几何体、材质、动画）
- 工作流程管理数据
- 部署和配置数据

### 3. 高性能和可扩展性

- 支持大规模场景和资产
- 延迟加载和流式传输
- 多线程和 GPU 加速支持

### 4. 跨平台兼容性

- Web、iOS、Android、Desktop
- 多种渲染 API（WebGL、WebGPU、Metal、Vulkan）
- 多种浏览器和设备支持

### 5. 安全和版本控制

- 内容安全策略（CSP）
- 资源完整性验证（SRI）
- 完整的版本控制和依赖管理

## 开发和贡献

### 构建项目

```bash
# 安装依赖
pnpm install

# 构建规范包
pnpm build

# 运行测试
pnpm test
```

### 代码规范

- 使用 TypeScript 进行类型安全
- 遵循 ESLint 和 Prettier 配置
- 私有变量不使用下划线前缀
- 使用 getXXX/setXXX 方法替代 getter/setter

## 许可证

本项目采用 MIT 许可证。详见 LICENSE 文件。
