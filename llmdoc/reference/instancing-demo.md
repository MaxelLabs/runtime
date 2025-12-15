# 实例化渲染Demo技术文档

## 概述

实例化渲染Demo展示了GPU实例化渲染技术，通过单次绘制调用渲染大量相同几何体，显著提升性能。

## 核心技术

### 1. 实例化渲染机制

```typescript
// 传统方式：N次绘制调用
for (let i = 0; i < instanceCount; i++) {
  // 更新模型矩阵
  transformBuffer.update(instanceMatrix[i]);
  // 执行绘制
  renderPass.drawIndexed(geometry.indexCount!);
}

// 实例化方式：1次绘制调用
renderPass.drawIndexed(geometry.indexCount!, instanceCount, 0, 0, 0);
```

### 2. 着色器实现

#### 顶点着色器
```glsl
// 顶点属性（per-vertex）
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;

// 实例属性（per-instance）
layout(location = 2) in mat4 aInstanceMatrix;  // locations 2-5
layout(location = 6) in vec4 aInstanceColor;

void main() {
  // 使用实例矩阵变换
  vec4 worldPos = aInstanceMatrix * vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
}
```

### 3. 实例数据结构

每个实例包含：
- **变换矩阵**：mat4 (64字节)
- **颜色**：vec4 (16字节)
- **总计**：80字节/实例

### 4. 性能对比

| 实例数 | 传统方式 | 实例化方式 | 性能提升 |
|--------|----------|------------|----------|
| 1000   | 1000 Draw Calls | 1 Draw Call | ~100x |
| 5000   | 5000 Draw Calls | 1 Draw Call | ~500x |
| 10000  | 10000 Draw Calls | 1 Draw Call | ~1000x |

## Demo功能

### GUI控制面板

1. **实例数量** (100-10000)
   - 调整渲染的立方体数量
   - 动态更新实例数据

2. **分布半径** (5-50)
   - 控制实例的分布范围
   - 实时更新位置

3. **自动旋转** (0-2)
   - 场景旋转速度
   - 可完全停止

4. **渲染模式切换**
   - 实例化渲染：高性能模式
   - 传统渲染：对比模式（限制100个实例）

5. **光照控制**
   - 平行光方向
   - 环境光强度
   - 镜面反射强度

## 性能优化技巧

### 1. 内存布局优化
- 使用std140布局确保跨平台兼容性
- 紧凑排列实例数据减少内存占用

### 2. GPU负载优化
- 单次绘制调用减少CPU-GPU通信
- 减少状态切换（管线、绑定组）

### 3. 实例数据优化
- 预计算变换矩阵避免重复计算
- 使用Float32Array减少类型转换

## 使用场景

实例化渲染适用于以下场景：

1. **植被渲染**：森林、草地
2. **粒子系统**：火花、雨滴
3. **人群模拟**：大量相似角色
4. **建筑渲染**：重复的建筑元素
5. **物体阵列**：网格分布的物体

## 技术限制

1. **WebGL支持**：
   - WebGL2原生支持
   - WebGL1需要ANGLE_instanced_arrays扩展

2. **实例数量限制**：
   - 理论最大：2^16-1（65535）
   - 实际限制取决于GPU内存

3. **数据共享**：
   - 所有实例共享几何体数据
   - 不能有per-vertex的属性变化

## 扩展建议

1. **纹理数组**：使用不同纹理
2. **LOD系统**：根据距离使用不同细节
3. **视锥剔除**：只渲染可见实例
4. **深度预排序**：优化透明渲染

## 相关资源

- [WebGL Instancing](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawElementsInstanced)
- [ANGLE_instanced_arrays](https://www.khronos.org/registry/webgl/extensions/ANGLE_instanced_arrays/)
- [GPU Gems Chapter 3: Instancing](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-3-instanced-vertices)