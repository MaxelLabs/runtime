# Strategy: 第四层高级渲染Demo开发战略

## 1. Analysis

### Context
当前已完成前三层Demo开发（基础渲染、纹理系统、光照模型），第四层将聚焦高级渲染技术。基于前期调研结果，需要在WebGL2约束下实现10个高级渲染Demo。

### Constitution
- **坐标系**: 右手坐标系（Graphics Bible）
- **矩阵**: 列主序存储，后乘规则（Graphics Bible）
- **资源管理**: 所有RHI资源必须通过`runner.track()`追踪
- **UI布局**: Stats左上角、SimpleGUI右上角、InfoPanel左下角
- **着色器**: GLSL 300 es，顶点highp精度、片元mediump精度

## 2. Assessment

<Assessment>
**Complexity**: Level 3（Deep）
**Risk**: High（WebGL限制、性能要求高）
</Assessment>

### Demo技术复杂度分级

| Demo名称 | 复杂度 | 风险点 | 依赖关系 |
|---------|--------|--------|----------|
| 1. 实例化渲染 | Level 2 | 性能优化 | 无 |
| 2. 视锥剔除 | Level 3 | 计算密集 | 实例化渲染 |
| 3. 阴影贴图 | Level 3 | PCF软阴影 | 光照系统 |
| 4. 级联阴影贴图 | Level 3 | 多级联优化 | 阴影贴图 |
| 5. 延迟渲染 | Level 3 | MRT支持 | 光照系统 |
| 6. SSAO | Level 3 | 采样优化 | 延迟渲染 |
| 7. SSR | Level 3 | 光线追踪近似 | 延迟渲染 |
| 8. 体积光 | Level 3 | 性能平衡 | 光照系统 |
| 9. 后处理栈 | Level 2 | 链式处理 | 无 |
| 10. GPU粒子系统 | Level 3 | 计算+渲染 | 实例化渲染 |

## 3. Math/Algo Specification

### 3.1 视锥剔除算法
```
// 1. 提取视锥体6个平面
function extractFrustumPlanes(viewProjMatrix: Matrix4): Plane[] {
  const planes: Plane[] = [];

  // 左平面: row4 + row1
  planes[0] = new Plane().setFromComponents(
    viewProjMatrix.elements[3] + viewProjMatrix.elements[0],
    viewProjMatrix.elements[7] + viewProjMatrix.elements[4],
    viewProjMatrix.elements[11] + viewProjMatrix.elements[8],
    viewProjMatrix.elements[15] + viewProjMatrix.elements[12]
  );

  // 右平面: row4 - row1
  planes[1] = new Plane().setFromComponents(
    viewProjMatrix.elements[3] - viewProjMatrix.elements[0],
    viewProjMatrix.elements[7] - viewProjMatrix.elements[4],
    viewProjMatrix.elements[11] - viewProjMatrix.elements[8],
    viewProjMatrix.elements[15] - viewProjMatrix.elements[12]
  );

  // ... 其他4个平面
  return planes;
}

// 2. 包围球测试
function isInFrustum(sphere: BoundingSphere, planes: Plane[]): boolean {
  for (const plane of planes) {
    if (plane.distanceToPoint(sphere.center) < -sphere.radius) {
      return false;
    }
  }
  return true;
}
```

### 3.2 级联阴影贴图算法
```
// 1. 计算级联分割
function calculateCascadeSplits(near: number, far: number, numCascades: number): number[] {
  const splits = [near];
  const lambda = 0.5; // 混合系数

  for (let i = 1; i < numCascades; i++) {
    const uniform = near + (far - near) * (i / numCascades);
    const logarithmic = near * Math.pow(far / near, i / numCascades);
    const split = lambda * uniform + (1 - lambda) * logarithmic;
    splits.push(split);
  }
  splits.push(far);
  return splits;
}

// 2. 构建级联正交投影
function buildCascadeMatrix(lightDir: Vector3, cascade: Frustum): Matrix4 {
  const viewMatrix = Matrix4().lookAt(lightDir, Vector3(), Vector3(0, 1, 0));

  // 获取级联包围盒
  const corners = getCascadeCorners(cascade);
  const lightSpaceCorners = corners.map(c => viewMatrix.multiplyVector3(c));

  const min = Vector3().min(...lightSpaceCorners);
  const max = Vector3().max(...lightSpaceCorners);

  const projMatrix = Matrix4().orthographic(
    min.x, max.x, min.y, max.y, -max.z, -min.z
  );

  return projMatrix.multiply(viewMatrix);
}
```

### 3.3 延迟渲染G-Buffer布局
```
// G-Buffer纹理分配（GL_RGB10_A2UI格式）
GBuffer0: RGB = WorldNormal, A = Metallic
GBuffer1: RGB = Albedo, A = Roughness
GBuffer2: RGB = WorldPosition, A = Reserved
GBuffer3: RGB = MotionVector, A = Emissive

// 伪代码：
function deferredGeometryPass() {
  bindGBufferFrameBuffer();
  for (const object in scene) {
    // 渲染到G-Buffer
    renderWithGBufferShader(object);
  }
}

function deferredLightingPass() {
  bindScreenQuad();
  for (const light in scene) {
    // 使用G-Buffer计算光照
    renderWithLightShader(light);
  }
}
```

### 3.4 SSAO算法
```
// 1. 生成采样核
function generateSSAOKernel(size: number, radius: number): Vector3[] {
  const kernel: Vector3[] = [];

  for (let i = 0; i < size; i++) {
    // 半球采样
    const sample = Vector3(
      random(-1, 1),
      random(0, 1),
      random(-1, 1)
    ).normalize();

    // 缩放分布
    const scale = i / size;
    const alpha = scale * scale;
    sample.multiplyScalar(radius * (0.1 + alpha * 0.9));

    kernel.push(sample);
  }
  return kernel;
}

// 2. AO计算
float calculateAO(vec3 fragPos, vec3 normal, vec3 samplePos) {
  vec3 sampleDir = normalize(samplePos - fragPos);
  float NdotS = max(dot(normal, sampleDir), 0.0);

  // 距离衰减
  float distance = length(samplePos - fragPos);
  float attenuation = 1.0 / (distance * distance);

  return max(0.0, NdotS - 0.1) * attenuation;
}
```

## 4. The Plan

### Batch 1: 基础高级渲染（并行开发）

**Block 1: 实例化渲染与视锥剔除**
1. **Demo 1 - 实例化渲染**
   - 技术点：`gl_DrawID`、实例化缓冲区
   - 场景：1000+立方体森林
   - 性能目标：60FPS @ 10000实例

2. **Demo 2 - 视锥剔除**
   - 技术点：视锥体提取、包围盒测试
   - 场景：大规模建筑群动态剔除
   - 性能提升：50%+ draw call减少

**Block 2: 阴影系统**
3. **Demo 3 - 阴影贴图**
   - 技术点：深度纹理、PCF软阴影
   - 场景：单光源动态阴影
   - 特效：可调节软硬程度

4. **Demo 4 - 级联阴影贴图**
   - 技术点：CSM、视锥级联、Blend过渡
   - 场景：户外大场景阴影
   - 质量级别：4级联可配置

### Batch 2: 高级渲染管线（延迟渲染路径）

**Block 3: 延迟渲染基础**
5. **Demo 5 - 延迟渲染**
   - 技术点：MRT、G-Buffer、Lighting Pass
   - 场景：多光源场景（50+动态光源）
   - 性能对比：Forward vs Deferred

**Block 4: 屏幕空间效果**
6. **Demo 6 - SSAO（屏幕空间环境光遮蔽）**
   - 技术点：深度采样、半球采样核
   - 场景：室内场景AO效果
   - 优化：分层渲染、降噪

7. **Demo 7 - SSR（屏幕空间反射）**
   - 技术点：光线步进、深度测试
   - 场景：金属表面、水面反射
   - 限制：屏幕空间内反射

### Batch 3: 特效与后处理

**Block 5: 体积特效**
8. **Demo 8 - 体积光**
   - 技术点：光线传播、散射
   - 场景：教堂光束、雾气效果
   - 算法：光程积分、体积雾

**Block 6: 后处理与粒子**
9. **Demo 9 - 后处理栈**
   - 技术点：链式处理、可组合效果
   - 效果：Bloom、Tonemap、FXAA
   - 架构：EffectComposer模式

10. **Demo 10 - GPU粒子系统**
    - 技术点：Transform Feedback、计算模拟
    - 场景：烟花、火焰、雨雪
    - 性能：100万粒子@60FPS

## 5. 技术路线图

### Phase 1: 基础设施（Week 1）
- [ ] `RenderBatch`类：批量渲染管理
- [ ] `Frustum`类：视锥剔除算法
- [ ] `ShadowMapRenderer`：阴影渲染器
- [ ] `GBuffer`类：延迟渲染缓冲管理

### Phase 2: 核心Demo（Week 2-3）
- [ ] 并行开发：Demo 1-2（实例化+剔除）
- [ ] 并行开发：Demo 3-4（阴影系统）
- [ ] 单线程开发：Demo 5（延迟渲染）

### Phase 3: 高级特效（Week 4）
- [ ] 串行开发：Demo 6-7（SSAO+SSR）
- [ ] 串行开发：Demo 8（体积光）
- [ ] 并行开发：Demo 9-10（后处理+粒子）

### Phase 4: 优化与集成（Week 5）
- [ ] 性能优化：LOD、遮挡查询
- [ ] 代码重构：提取公共模式
- [ ] 文档编写：参考文档更新
- [ ] 集成测试：全部Demo联调

## 6. 风险缓解措施

### WebGL2限制及替代方案

| 技术需求 | WebGL2限制 | 替代方案 | 风险等级 |
|---------|------------|----------|----------|
| 间接绘制 | 不支持 | 使用实例化渲染+CPU排序 | 低 |
| 计算着色器 | 不支持 | Transform Feedback模拟 | 中 |
| 独立混合 | 有限支持 | 多Pass实现 | 低 |
| 无序访问 | 不支持 | 纹理读写模拟 | 高 |
| 几何着色器 | 不支持 | CPU预计算或实例化 | 中 |

### 性能风险缓解

1. **实例化渲染**
   - 限制最大实例数（10000）
   - 使用LOD分级渲染
   - 批次大小优化（128/256/512）

2. **阴影贴图**
   - 使用Cascade Shadow Maps减少内存
   - 动态分辨率调整
   - 距离相关过滤

3. **延迟渲染**
   - MRT格式优化（RGB10_A2）
   - Light Volume优化
   - Early-Z culling

4. **SSAO/SSR**
   - 分层渲染（1/4, 1/2, 1/1）
   - Temporal Reprojection
   - 边缘检测优化

## 7. 执行清单

### 每个Demo必须包含

- [ ] HTML入口文件（符合RHI Demo Constitution）
- [ ] TypeScript实现文件
- [ ] 完整的GUI控制面板
- [ ] Stats性能监控
- [ ] OrbitController交互
- [ ] 帮助信息（控制台输出）
- [ ] 资源清理（runner.track）

### 代码质量要求

- [ ] 遵循Graphics Bible坐标系和矩阵规则
- [ ] 所有Buffer正确对齐（std140）
- [ ] 着色器精度声明（vertex: highp, fragment: mediump）
- [ ] 详细的JSDoc注释
- [ ] 性能热点标记

### 测试要求

- [ ] Chrome/Firefox/Safari兼容性测试
- [ ] 移动设备基础测试
- [ ] 内存泄漏检测
- [ ] 性能基准测试

## 8. 成功标准

### 技术指标

- 所有Demo稳定运行在60FPS（桌面）
- 内存使用合理（<500MB）
- 加载时间<3秒
- 零内存泄漏

### 交付物

- 10个完整的Demo实现
- 统一的高级渲染工具库
- 3篇技术文档（延迟渲染、阴影、屏幕空间效果）
- 性能对比报告
- 最佳实践指南

---

**备注**: 本战略基于WebGL2能力边界设计，如遇性能瓶颈可动态调整实现方案。所有开发严格遵循Constitution规则，确保代码质量和一致性。