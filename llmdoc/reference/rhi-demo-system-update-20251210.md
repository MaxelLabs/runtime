# RHI Demo 系统更新记录

**更新时间**：2025-12-10
**版本**：RHI Demo System v1.2
**更新类型**：重大架构更新

## 更新概述

本次为 RHI Demo 系统引入了完整的 Model-View-Projection (MVP) 矩阵变换管线，取代了之前的固定管线渲染。所有 Demo 现在都支持动态 3D 相机控制，通过 OrbitController 实现旋转、缩放和平移交互，并提供了可扩展的变换架构基础。

## 更新内容

### 1. 架构重大升级

#### MVP 矩阵变换管线

- **引入完整的 Model-View-Projection 矩阵变换**，取代固定管线渲染
- 所有 Demo 使用统一的 `transforms` uniform 块进行矩阵传递
- 支持 std140 布局规范的 Uniform 缓冲区管理
- 每帧动态更新视图和投影矩阵，支持实时相机控制

#### OrbitController 相机控制增强

- 所有 Demo 必须集成 `OrbitController` 轨道控制器
- 支持 MVP 矩阵的完整 3D 交互：旋转、缩放、平移
- 自动旋转和阻尼平滑效果
- 提供 `getViewMatrix()` 和 `getProjectionMatrix()` API
- 退出时必须正确销毁控制器实例

#### Stats 性能监控集成

- 所有 Demo 必须使用 `Stats` 组件进行实时性能监控
- 显示 FPS（每秒帧数）和帧时间（毫秒）
- 位置固定在左上角，半透明背景，不影响主视图

### 2. UI 布局标准化

#### 左上角：Stats 性能面板

```css
/* Stats 组件自动渲染，位置固定 */
position: 'top-left';
```

#### 左下角：Demo 介绍面板

```css
.info-panel {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  /* ... 其他样式 */
}
```

- 包含 Demo 名称、描述和技术要点
- 最大宽度 320px，响应式设计
- 使用 emoji 增强视觉效果

### 3. 渲染循环标准化

标准渲染流程：

1. 更新轨道控制器状态
2. 开始性能统计（`stats.begin()`）
3. 执行渲染逻辑
4. 结束性能统计（`stats.end()`）

## 更新的文件列表

### TypeScript 源文件

- `packages/rhi/demo/src/triangle.ts`
- `packages/rhi/demo/src/quad-indexed.ts`
- `packages/rhi/demo/src/primitive-types.ts`
- `packages/rhi/demo/src/viewport-scissor.ts`
- `packages/rhi/demo/src/blend-modes.ts`
- `packages/rhi/demo/src/rotating-cube.ts`（如果存在）

### HTML 文件

- `packages/rhi/demo/html/triangle.html`
- `packages/rhi/demo/html/quad-indexed.html`
- `packages/rhi/demo/html/primitive-types.html`
- `packages/rhi/demo/html/viewport-scissor.html`
- `packages/rhi/demo/html/blend-modes.html`
- `packages/rhi/demo/html/rotating-cube.html`（如果存在）

### 文档文件

- `packages/rhi/llmdoc/guides/demo-development.md` - 更新了开发规范

## 技术规范

### 必需导入

```typescript
import { MSpec, MMath } from '@maxellabs/core';
import {
  DemoRunner,
  GeometryGenerator,
  OrbitController, // 必需
  Stats, // 必需
} from './utils';
```

### 初始化代码

```typescript
// 创建模型矩阵
const modelMatrix = new MMath.Matrix4();

// Stats 性能监控
const stats = new Stats({
  position: 'top-left',
  show: ['fps', 'ms'],
});

// OrbitController 相机控制
const orbit = new OrbitController(runner.canvas, {
  distance: 3, // 根据场景调整
  target: [0, 0, 0],
  enableDamping: true,
  autoRotate: false,
  autoRotateSpeed: 0.5,
});
```

### 渲染循环

```typescript
runner.start((dt) => {
  // 1. 更新相机
  orbit.update(dt);

  // 2. 获取变换矩阵
  const viewMatrix = orbit.getViewMatrix();
  const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);

  // 3. 更新 Transform Uniform
  const transformData = new Float32Array(64); // 4 * 16
  transformData.set(modelMatrix.toArray(), 0);
  transformData.set(viewMatrix, 16);
  transformData.set(projMatrix, 32);
  transformBuffer.update(transformData, 0);

  // 4. 性能统计开始
  stats.begin();

  // 5. 渲染代码
  const { encoder, passDescriptor } = runner.beginFrame();
  // ... 渲染逻辑 ...
  runner.endFrame(encoder);

  // 6. 性能统计结束
  stats.end();
});
```

### 着色器代码要求

```glsl
// 顶点着色器必须包含 Transforms uniform 块
uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

// 使用 MVP 矩阵变换进行顶点位置计算
void main() {
  // 原有属性传递
  vColor = aColor;

  // MVP 变换
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
```

### Uniform 缓冲区创建

```typescript
// 创建动态 Uniform 缓冲区（256字节，std140对齐）
const transformBuffer = runner.track(
  runner.device.createBuffer({
    size: 256,
    usage: MSpec.RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
    label: 'Transform Uniform Buffer',
  })
);

// 创建绑定组布局
const bindGroupLayout = runner.track(
  runner.device.createBindGroupLayout(
    [
      {
        binding: 0,
        visibility: MSpec.RHIShaderStage.VERTEX,
        buffer: { type: 'uniform' },
        name: 'Transforms',
      },
    ],
    'Transform BindGroup Layout'
  )
);
```

### 资源清理

```typescript
// ESC 键退出时销毁资源
runner.onKey('Escape', () => {
  stats.destroy();
  orbit.destroy();
  runner.destroy();
});
```

## 布局示例

### HTML 结构

```html
<!-- 左下角介绍面板 -->
<div class="info-panel">
  <h3>🔺 Demo 名称</h3>
  <p class="description">简洁的 Demo 描述...</p>
  <div class="tech-points">
    <h4>💡 技术要点</h4>
    <ul>
      <li>技术点 1</li>
      <li>技术点 2</li>
      <li>技术点 3</li>
    </ul>
  </div>
</div>
```

### CSS 样式

```css
.info-panel {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 15px 20px;
  border-radius: 8px;
  font-size: 13px;
  max-width: 320px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}
```

## 更新影响

### 架构升级

1. **从固定管线到可编程变换**：MVP 矩阵提供了更灵活的 3D 渲染能力
2. **统一的变换架构**：所有 Demo 使用相同的矩阵变换管线，降低维护成本
3. **可扩展性增强**：为后续功能（如模型动画、骨骼蒙皮）奠定基础

### 开发体验提升

1. **统一的开发流程**：所有 Demo 遵循相同的规范，降低学习成本
2. **实时性能监控**：开发者可以直观看到渲染性能
3. **便捷的相机控制**：支持 3D 场景的自由查看和交互
4. **清晰的调试支持**：通过 MVP 分离便于问题定位

### 演示效果提升

1. **真正的 3D 演示**：支持旋转、缩放、平移的完整 3D 交互
2. **专业的外观**：统一的 UI 风格，更专业的展示效果
3. **交互友好**：鼠标控制让演示更加生动和直观
4. **信息完整**：每个 Demo 都有清晰的功能说明

### 代码质量

1. **强制规范**：通过工具库强制执行开发规范
2. **资源管理**：确保所有组件正确销毁，避免内存泄漏
3. **可维护性**：统一的代码结构便于后续维护和扩展
4. **性能优化**：动态 Uniform 缓冲区支持高效的每帧更新

## 后续计划

1. **模型动画系统**：扩展 modelMatrix 支持模型级变换和动画
2. **多相机支持**：实现分屏和画中画效果
3. **高级特性**：
   - 添加更多 Stats 统计信息（如内存使用）
   - 扩展 OrbitController 功能（如预设视角）
   - 实现矩阵变换的增量更新优化
4. **开发工具**：
   - 开发 Demo 自动化测试系统
   - 添加矩阵可视化调试面板
   - 实现性能分析工具

## 相关文档

- [RHI Demo 开发指南](/packages/rhi/llmdoc/guides/demo-development.md)
- [MVP 矩阵实现架构](/llmdoc/architecture/mvp-matrix-implementation.md)
- [MVP 矩阵更新指南](/llmdoc/reference/mvp-matrix-update-guide.md)
- [OrbitController API 参考](/packages/rhi/llmdoc/reference/orbit-controller.md)
- [Stats API 参考](/packages/rhi/llmdoc/reference/stats.md)
