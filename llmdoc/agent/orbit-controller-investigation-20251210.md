# OrbitController 相机控制失效调查报告

**调查时间**: 2025-12-10
**调查目标**: 分析为什么除了 rotating-cube.ts 外，其他 demo 的相机控制（OrbitController）没有生效

---

## Code Sections (The Evidence)

### 1. `/packages/rhi/demo/src/rotating-cube.ts` (OrbitController 成功案例)
- **关键差异**: 实现了完整的 3D 渲染管线
  - 顶点着色器中使用 `uProjectionMatrix * uViewMatrix * worldPosition` 进行 3D 变换
  - 创建了 Uniform 缓冲区传递相机矩阵
  - 在渲染循环中调用 `orbit.getViewMatrix()` 和 `orbit.getProjectionMatrix()` 获取矩阵
  - 将矩阵数据更新到 Transform Uniform 缓冲区供着色器使用

### 2. `/packages/rhi/demo/src/triangle.ts` (OrbitController 失效案例)
- **关键差异**: 使用简化的 2D 渲染
  - 顶点着色器中直接使用 `gl_Position = vec4(aPosition, 1.0)`，没有应用相机变换
  - 没有创建 Uniform 缓冲区传递相机矩阵
  - 虽然调用了 `orbit.update(dt)`，但获取的矩阵没有被使用
  - 渲染的是 2D 三角形，在屏幕空间中固定显示

### 3. `/packages/rhi/demo/src/quad-indexed.ts` (OrbitController 失效案例)
- **关键差异**: 同样使用简化的 2D 渲染
  - 顶点着色器中直接使用 `gl_Position = vec4(aPosition, 1.0)`，没有应用相机变换
  - 没有创建 Uniform 缓冲区或绑定组传递相机矩阵
  - 虽然调用了 `orbit.update(dt)`，但矩阵没有被传递到着色器
  - 渲染的是 2D 四边形，在屏幕空间中固定显示

### 4. `/packages/rhi/demo/src/primitive-types.ts` (OrbitController 失效案例)
- **关键差异**: 同样使用简化的 2D 渲染
  - 顶点着色器中使用 `gl_Position = vec4(aPosition, 1.0)`，没有应用相机变换
  - 没有使用相机矩阵
  - 渲染的是 2D 图元（点、线、三角形），在屏幕空间中固定显示

### 5. `/packages/rhi/demo/src/utils/camera/OrbitController.ts` (控制器实现)
- **功能**: 实现了完整的轨道相机控制
  - 支持鼠标交互（左键旋转、滚轮缩放、右键平移）
  - 提供了 `getViewMatrix()` 和 `getProjectionMatrix()` 方法
  - 在 `update()` 方法中更新相机状态和矩阵
  - 控制器本身工作正常，问题在于矩阵没有被传递到着色器

---

## Report (The Answers)

### result
经过深入分析，发现除了 rotating-cube.ts 外，其他 demo 的 OrbitController 失效的根本原因是：**这些 demo 使用的是简化的 2D 渲染管线，没有将相机矩阵传递给着色器**。

具体表现为：
1. **着色器层面**：triangle.ts、quad-indexed.ts 和 primitive-types.ts 的顶点着色器都直接使用 `gl_Position = vec4(aPosition, 1.0)`，没有应用任何视图变换或投影变换
2. **管线层面**：这些 demo 没有创建 Uniform 缓冲区或绑定组来传递相机矩阵
3. **渲染层面**：虽然调用了 `orbit.update(dt)` 更新相机状态，但获取的矩阵没有被使用

与之相对，rotating-cube.ts 实现了完整的 3D 渲染管线：
- 顶点着色器中正确使用 `uProjectionMatrix * uViewMatrix * worldPosition`
- 创建了 Transform Uniform 缓冲区传递模型、视图、投影矩阵
- 在渲染循环中调用 `orbit.getViewMatrix()` 和 `orbit.getProjectionMatrix()` 更新矩阵数据

### conclusions
1. **OrbitController 工作正常**：控制器本身没有问题，能够正确响应鼠标交互并更新相机状态
2. **2D vs 3D 渲染差异**：问题出在渲染管线的实现方式上
3. **相机矩阵未被使用**：失败的 demo 都没有将相机矩阵传递给着色器
4. **设计目的**：triangle、quad-indexed 等 demo 设计为 2D 演示，可能不需要相机控制，但按照规范应该支持基本的交互功能

### relations
1. **triangle.ts → OrbitController**: 调用了 `orbit.update(dt)` 但未使用矩阵
2. **quad-indexed.ts → OrbitController**: 同样调用了更新但未使用矩阵
3. **primitive-types.ts → OrbitController**: 同样问题
4. **rotating-cube.ts → OrbitController**: 正确使用矩阵更新 Uniform 缓冲区
5. **OrbitController.ts → 所有 demo**: 提供了统一的相机控制接口，但使用方实现不一致

---

## 分析建议

### 1. 对 2D Demo 的修复方案

对于 triangle.ts、quad-indexed.ts 和 primitive-types.ts，需要修改着色器来支持相机变换。有两种方案：

#### 方案 A：保持 2D 效果但支持相机控制
修改顶点着色器，添加一个简单的投影矩阵：

```glsl
// 添加 Uniform
uniform mat4 uProjectionMatrix;

void main() {
  vColor = aColor;
  gl_Position = uProjectionMatrix * vec4(aPosition, 1.0);
}
```

在渲染循环中：
```typescript
// 获取正交投影矩阵（适合 2D）
const projMatrix = orbit.getOrthographicMatrix(-2, 2, -2, 2, -1, 100);
```

#### 方案 B：升级为 3D 渲染
参考 rotating-cube.ts 的实现，添加完整的变换矩阵传递。

### 2. 统一渲染规范

建议在 Demo 开发指南中明确：
- 所有必须支持相机控制的 demo
- 2D demo 可以使用正交投影，3D demo 使用透视投影
- 统一矩阵传递机制（Uniform 缓冲区或绑定组）

### 3. 演示说明

建议在 2D demo 的帮助信息中说明：
- 虽然相机控制可用，但 2D 对象的视觉变化可能不明显
- 可以通过调整相机距离（distance）参数来优化交互体验

---

## 根本原因总结

**核心问题**：OrbitController 提供了相机控制功能，但 demo 实现者没有在着色器中使用相机矩阵。

**解决方案**：需要在所有需要相机控制的 demo 中，将相机矩阵传递给着色器，并在顶点着色器中应用相应的变换。

**技术细节**：
- 2D demo 可以使用正交投影矩阵
- 3D demo 应该使用透视投影矩阵
- 需要创建适当的 Uniform 缓冲区或绑定组来传递矩阵数据
- 在渲染循环中定期更新矩阵数据