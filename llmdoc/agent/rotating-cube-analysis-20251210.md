# rotating-cube.ts 实现模式分析

## 代码 Sections（证据）

### 1. Stats 性能监控集成 (`rotating-cube.ts:128-132, 487-488, 562-563`)
```typescript
// 创建性能统计
const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });

// 渲染循环中使用
runner.start((dt) => {
  stats.begin();
  // ... 渲染代码 ...
  stats.end();
});
```

### 2. OrbitController 相机控制集成 (`rotating-cube.ts:131-139, 496-512`)
```typescript
// 创建轨道控制器
const orbit = new OrbitController(runner.canvas, {
  distance: 3,
  target: [0, 0, 0],
  elevation: Math.PI / 6,
  azimuth: Math.PI / 4,
  enableDamping: true,
  dampingFactor: 0.08,
});

// 渲染循环中更新
orbit.update(dt);
const viewMatrix = orbit.getViewMatrix();
const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);
const cameraPos = orbit.getPosition();
```

### 3. 渲染循环结构 (`rotating-cube.ts:486-563`)
```typescript
runner.start((dt) => {
  stats.begin();

  // 1. 更新状态
  if (params.autoRotate) {
    rotationY += params.rotationSpeed * dt;
    rotationX += params.rotationSpeed * 0.3 * dt;
  }

  // 2. 更新相机
  orbit.update(dt);

  // 3. 更新模型矩阵
  modelMatrix.identity();
  modelMatrix.rotateY(rotationY);
  modelMatrix.rotateX(rotationX);

  // 4. 更新 Uniform 数据
  transformBuffer.update(transformData, 0);
  lightingBuffer.update(lightingData, 0);
  cameraBuffer.update(cameraData, 0);

  // 5. 渲染
  const { encoder, passDescriptor } = runner.beginFrame();
  const renderPass = encoder.beginRenderPass(passDescriptor);
  renderPass.setPipeline(pipeline);
  renderPass.setBindGroup(0, bindGroup);
  renderPass.setVertexBuffer(0, vertexBuffer);
  renderPass.setIndexBuffer(indexBuffer, MSpec.RHIIndexFormat.UINT16);
  renderPass.drawIndexed(geometry.indexCount!);
  renderPass.end();
  runner.endFrame(encoder);

  stats.end();
});
```

### 4. 与其他 demo 的主要差异

#### triangle.ts - 最简单的 demo
- **无 Stats 监控**
- **无 OrbitController**
- **渲染循环简单**：只有 `beginFrame` → `setPipeline` → `setVertexBuffer` → `draw` → `endFrame`
- **无 Uniform 更新**
- **无相机控制**

#### quad-indexed.ts - 索引缓冲区 demo
- **无 Stats 监控**
- **无 OrbitController**
- **使用索引绘制**：`setIndexBuffer` + `drawIndexed`
- **渲染循环结构与 triangle.ts 基本相同**

#### rotating-cube.ts - 完整功能的 demo
- **包含 Stats 监控**
- **包含 OrbitController 相机控制**
- **复杂的 Uniform 更新机制**
- **多缓冲区管理**：顶点、索引、多个 Uniform 缓冲区
- **纹理绑定和采样器**
- **GUI 交互控制**
- **深度测试**
- **程序化纹理支持**

## Report（答案）

### result

#### 1. Stats 性能监控集成和使用

**集成方式**：
- 创建实例：`new Stats({ position: 'top-left', show: ['fps', 'ms'] })`
- 配置选项：支持位置设置（top-left/top-right/bottom-left/bottom-right）和显示项选择
- 自动渲染到 DOM，无需手动添加

**使用模式**：
- 在渲染循环开始时调用 `stats.begin()`
- 在渲染循环结束时调用 `stats.end()`
- 每秒自动更新显示，根据 FPS 值改变颜色（绿色≥55，黄色≥30，红色<30）

#### 2. OrbitController 集成和使用

**初始化配置**：
```typescript
const orbit = new OrbitController(runner.canvas, {
  distance: 3,            // 初始距离
  target: [0, 0, 0],      // 目标点
  elevation: Math.PI / 6, // 仰角（弧度）
  azimuth: Math.PI / 4,   // 方位角（弧度）
  enableDamping: true,    // 启用阻尼
  dampingFactor: 0.08,    // 阻尼系数
});
```

**使用模式**：
1. **更新**：`orbit.update(dt)` - 处理鼠标/触摸输入，更新相机状态
2. **获取矩阵**：
   - `orbit.getViewMatrix()` - 获取视图矩阵
   - `orbit.getProjectionMatrix(aspect)` - 获取投影矩阵
   - `orbit.getPosition()` - 获取相机位置
3. **销毁**：`orbit.destroy()` - 清理事件监听器

#### 3. 渲染循环结构

**完整结构**：
1. **性能监控开始**：`stats.begin()`
2. **状态更新**：旋转角度、相机位置
3. **相机更新**：`orbit.update(dt)`
4. **矩阵计算**：模型矩阵、视图矩阵、投影矩阵、法线矩阵
5. **Uniform 更新**：将矩阵和光照数据写入缓冲区
6. **渲染执行**：
   - `runner.beginFrame()` - 开始帧，获取编码器和渲染通道描述符
   - `encoder.beginRenderPass()` - 开始渲染通道
   - `renderPass.setPipeline()` - 设置渲染管线
   - `renderPass.setBindGroup()` - 设置绑定组
   - `renderPass.setVertexBuffer()` / `setIndexBuffer()` - 设置缓冲区
   - `renderPass.drawIndexed()` - 执行绘制
   - `renderPass.end()` - 结束渲染通道
   - `runner.endFrame()` - 结束帧，提交命令
7. **性能监控结束**：`stats.end()`

#### 4. 与其他 demo 的主要差异

| 功能特性 | triangle.ts | quad-indexed.ts | rotating-cube.ts |
|---------|------------|----------------|------------------|
| Stats 监控 | ❌ | ❌ | ✅ |
| OrbitController | ❌ | ❌ | ✅ |
| 索引缓冲区 | ❌ | ✅ | ✅ |
| Uniform 缓冲区 | ❌ | ❌ | ✅ |
| 纹理贴图 | ❌ | ❌ | ✅ |
| GUI 控制 | ❌ | ❌ | ✅ |
| 深度测试 | ❌ | ❌ | ✅ |
| 程序化纹理 | ❌ | ❌ | ✅ |
| 多缓冲区管理 | ❌ | ❌ | ✅ |
| 动态状态更新 | ❌ | ❌ | ✅ |

## conclusions

1. **Stats 监控**是可选的高级功能，通过在渲染循环前后调用 `begin()` 和 `end()` 实现性能统计
2. **OrbitController** 提供了完整的 3D 相机控制系统，支持鼠标/触摸交互和阻尼效果
3. **渲染循环复杂度**与 demo 功能成正比，基础 demo 只有简单的绘制调用，而复杂 demo 包含状态更新、矩阵计算、Uniform 更新等多个步骤
4. **资源管理**采用统一的 `runner.track()` 机制，确保资源的自动清理
5. **模块化设计**：通过 utils 目录的工具库，实现了功能的复用和分离

## relations

1. **DemoRunner** 是所有 demo 的基础框架，提供统一的初始化、渲染循环和资源管理
2. **Stats** 与渲染循环紧密配合，通过 `begin()`/`end()` 包裹整个渲染过程
3. **OrbitController** 与渲染循环中的相机更新步骤集成，提供视图和投影矩阵
4. **SimpleGUI** 提供用户界面控制，与 DemoRunner 的键盘事件系统集成
5. **GeometryGenerator** 提供几何体生成功能，简化了复杂几何体的创建过程