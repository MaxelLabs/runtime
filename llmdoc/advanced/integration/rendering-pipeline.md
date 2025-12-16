# 渲染管线整合文档

## 概述

现代3D渲染需要整合多个子系统来实现逼真的视觉效果。本文档介绍如何有效整合PBR材质、阴影映射、环境光照、后处理等模块，构建完整的高质量渲染管线。

## 系统架构概览

### 渲染管线组件

```
渲染管线 (Rendering Pipeline)
├── 几何阶段 (Geometry Pass)
│   ├── PBR材质渲染
│   ├── 光照计算
│   └── 阴影接收
├── 阴影阶段 (Shadow Pass)
│   ├── 方向光源阴影
│   ├── 点光源阴影
│   └── PCF软阴影
├── 后处理阶段 (Post-Process Pass)
│   ├── 抗锯齿 (FXAA)
│   ├── 色调映射
│   ├── 辉光效果
│   └── 颜色校正
└── 输出阶段 (Output Pass)
    └── 屏幕显示
```

### 数据流图

```
场景数据 → 几何渲染 → 阴影贴图生成 → 光照计算 → 后处理 → 最终输出
    ↓           ↓           ↓              ↓           ↓          ↓
  几何体    PBR材质   ShadowMap Cache   BRDF计算   效果链    帧缓冲
```

## PBR + Shadow + IBL集成

### 核心实现

```typescript
import { SimplePBRMaterial } from '../utils/material/pbr';
import { ShadowMapper } from '../utils/shadow';
import { PostProcessManager, FXAA, ToneMapping } from '../utils/postprocess';

class IntegratedRenderer {
  private device: RHIDevice;
  private pbrMaterial: SimplePBRMaterial;
  private shadowMapper: ShadowMapper;
  private postProcessManager: PostProcessManager;

  // 渲染目标
  private sceneRenderTarget: RenderTarget;
  private shadowRenderTargets: RenderTarget[];

  constructor(device: RHIDevice, width: number, height: number) {
    this.device = device;
    this.createRenderTargets(width, height);
    this.createPBRMaterial();
    this.createShadowMapper();
    this.createPostProcessPipeline();
  }

  private createPBRMaterial(): void {
    const materialParams: SimplePBRMaterialParams = {
      albedo: [0.7, 0.7, 0.7],
      metallic: 0.1,
      roughness: 0.8,
      ambientStrength: 0.15
    };

    const lightParams: SimplePBRLightParams = {
      lights: [
        {
          position: [10, 20, 10],
          color: [1.0, 0.95, 0.8],
          constant: 1.0,
          linear: 0.045,
          quadratic: 0.0075
        }
      ]
    };

    this.pbrMaterial = new SimplePBRMaterial(
      this.device,
      materialParams,
      lightParams
    );
  }

  private createShadowMapper(): void {
    this.shadowMapper = new ShadowMapper(this.device, {
      shadowMapSize: 2048,
      cascadeCount: 3,
      pcfKernel: 3,
      bias: 0.002,
      normalOffsetBias: 0.02
    });
  }

  private createPostProcessPipeline(): void {
    this.postProcessManager = new PostProcessManager(this.device, {
      width: this.sceneRenderTarget.width,
      height: this.sceneRenderTarget.height,
      useHDR: true
    });

    // 添加FXAA抗锯齿
    const fxaa = new FXAA(this.device, {
      subpixelQuality: 0.75,
      edgeThreshold: 0.166
    });

    // 添加色调映射
    const toneMapping = new ToneMapping(this.device, {
      mode: 'aces',
      exposure: 1.2,
      gamma: 2.2
    });

    this.postProcessManager.addEffect(fxaa);
    this.postProcessManager.addEffect(toneMapping);
  }

  public render(encoder: RHICommandEncoder, scene: Scene, camera: Camera): void {
    // 1. 阴影贴图生成
    this.generateShadowMaps(encoder, scene, camera);

    // 2. 主场景渲染
    const sceneTexture = this.renderScene(encoder, scene, camera);

    // 3. 后处理
    const finalTexture = this.postProcessManager.process(encoder, sceneTexture);

    // 4. 输出到屏幕
    this.renderToScreen(encoder, finalTexture);
  }
}
```

### 阴影贴图生成

```typescript
private generateShadowMaps(encoder: RHICommandEncoder, scene: Scene, camera: Camera): void {
  // 获取主光源
  const mainLight = scene.getMainLight();
  if (!mainLight || !mainLight.castShadow) return;

  // 更新阴影级联
  this.shadowMapper.updateCascadeSplits(camera.near, camera.far);

  // 生成方向光阴影贴图
  for (let cascade = 0; cascade < this.shadowMapper.cascadeCount; cascade++) {
    const shadowMatrix = this.shadowMapper.getLightViewProjectionMatrix(
      mainLight.direction,
      camera,
      cascade
    );

    // 渲染到阴影贴图
    const shadowPass = encoder.beginRenderPass(
      this.shadowRenderTargets[cascade].getRenderPassDescriptor([1, 1, 1, 1], 1.0)
    );

    this.shadowMapper.renderScene(shadowPass, scene, shadowMatrix);
    shadowPass.end();
  }
}
```

### PBR场景渲染

```typescript
private renderScene(encoder: RHICommandEncoder, scene: Scene, camera: Camera): RHITextureView {
  const scenePass = encoder.beginRenderPass(
    this.sceneRenderTarget.getRenderPassDescriptor([0.02, 0.02, 0.05, 1.0], 1.0)
  );

  // 渲染所有PBR对象
  for (const renderObject of scene.getRenderObjects()) {
    if (renderObject.material instanceof SimplePBRMaterial) {
      this.renderPBRObject(scenePass, renderObject, camera);
    }
  }

  scenePass.end();
  return this.sceneRenderTarget.getColorView(0);
}

private renderPBRObject(renderPass: RHIRenderPass, obj: RenderObject, camera: Camera): void {
  // 更新变换矩阵
  const normalMatrix = new Matrix4().getNormalMatrix(obj.transform);
  obj.material.updateTransforms(
    obj.transform,
    camera.viewMatrix,
    camera.projectionMatrix,
    normalMatrix,
    camera.position
  );

  // 应用阴影数据
  if (this.shadowMapper.hasShadows()) {
    obj.material.setShadowData({
      shadowMap: this.shadowMapper.getShadowMapArray(),
      shadowMatrices: this.shadowMapper.getCascadeMatrices(),
      cascadeSplits: this.shadowMapper.getCascadeSplits(),
      shadowBias: 0.002,
      shadowStrength: 0.8
    });
  }

  // 更新并绑定材质
  obj.material.update();
  obj.material.bind(renderPass);

  // 绘制对象
  renderPass.setVertexBuffer(0, obj.geometry.vertexBuffer);
  renderPass.setIndexBuffer(obj.geometry.indexBuffer, RHIIndexFormat.UINT16);
  renderPass.drawIndexed(obj.geometry.indexCount, 1, 0, 0, 0);
}
```

## 后处理链集成

### 完整后处理管线

```typescript
class AdvancedPostProcessPipeline {
  private postProcessManager: PostProcessManager;
  private effects: PostProcessEffect[] = [];

  constructor(device: RHIDevice, width: number, height: number) {
    this.postProcessManager = new PostProcessManager(device, {
      width,
      height,
      useHDR: true,
      colorFormat: RHITextureFormat.RGBA16_FLOAT
    });

    this.setupEffects();
  }

  private setupEffects(): void {
    // 1. 辉光效果 (Bloom)
    const bloom = new Bloom(this.device, {
      threshold: 1.0,
      intensity: 0.5,
      blurIterations: 3
    });

    // 2. 景深 (Depth of Field)
    const dof = new DepthOfField(this.device, {
      focusDistance: 10.0,
      aperture: 2.8,
      maxBlur: 1.0
    });

    // 3. 色差效果 (Chromatic Aberration)
    const chromaticAberration = new ChromaticAberration(this.device, {
      strength: 0.5
    });

    // 4. 色调映射 (Tone Mapping)
    const toneMapping = new ToneMapping(this.device, {
      mode: 'aces',
      exposure: 1.0,
      gamma: 2.2
    });

    // 5. 颜色校正 (Color Grading)
    const colorGrading = new ColorGrading(this.device, {
      contrast: 1.1,
      saturation: 1.0,
      temperature: 6500
    });

    // 6. FXAA抗锯齿
    const fxaa = new FXAA(this.device, {
      subpixelQuality: 0.75,
      edgeThreshold: 0.166
    });

    // 按处理顺序添加效果
    this.effects = [bloom, dof, chromaticAberration, toneMapping, colorGrading, fxaa];
    this.effects.forEach(effect => {
      this.postProcessManager.addEffect(effect);
    });

    // 默认启用设置
    this.setDefaultSettings();
  }

  private setDefaultSettings(): void {
    // 根据性能要求调整
    this.setQualityPreset('balanced');
  }

  public setQualityPreset(preset: 'low' | 'balanced' | 'high' | 'ultra'): void {
    // 清除所有效果
    this.effects.forEach(effect => effect.enabled = false);

    switch (preset) {
      case 'low':
        this.effects[3].enabled = true;  // Tone mapping
        this.effects[5].enabled = true;  // FXAA
        break;

      case 'balanced':
        this.effects[0].enabled = true;  // Bloom
        this.effects[3].enabled = true;  // Tone mapping
        this.effects[4].enabled = true;  // Color grading
        this.effects[5].enabled = true;  // FXAA
        break;

      case 'high':
        this.effects.forEach((effect, index) => {
          effect.enabled = index !== 2; // 除了色差效果都启用
        });
        break;

      case 'ultra':
        this.effects.forEach(effect => effect.enabled = true);
        break;
    }
  }
}
```

### 动态效果管理

```typescript
class AdaptivePostProcess {
  private frameTimeHistory: number[] = [];
  private currentQuality: 'low' | 'medium' | 'high' = 'medium';

  public updateQuality(frameTime: number): void {
    this.frameTimeHistory.push(frameTime);
    if (this.frameTimeHistory.length > 60) {
      this.frameTimeHistory.shift();
    }

    const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
    const targetFrameTime = 16.67; // 60 FPS

    if (avgFrameTime > targetFrameTime * 1.5) {
      this.downgradeQuality();
    } else if (avgFrameTime < targetFrameTime * 0.8) {
      this.upgradeQuality();
    }
  }

  private downgradeQuality(): void {
    if (this.currentQuality === 'high') {
      this.currentQuality = 'medium';
      this.disableHeavyEffects();
    } else if (this.currentQuality === 'medium') {
      this.currentQuality = 'low';
      this.disableNonEssentialEffects();
    }
  }

  private upgradeQuality(): void {
    if (this.currentQuality === 'low' && this.canEnableMoreEffects()) {
      this.currentQuality = 'medium';
      this.enableBasicEffects();
    } else if (this.currentQuality === 'medium' && this.canEnableHeavyEffects()) {
      this.currentQuality = 'high';
      this.enableAllEffects();
    }
  }
}
```

## 性能分析与优化

### 性能分析工具

```typescript
class RenderingProfiler {
  private timings: Map<string, number[]> = new Map();
  private memoryTracker: MemoryTracker;

  public startProfile(name: string): void {
    if (!this.timings.has(name)) {
      this.timings.set(name, []);
    }
    performance.mark(`${name}-start`);
  }

  public endProfile(name: string): number {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);

    const measure = performance.getEntriesByName(name)[0];
    const duration = measure.duration;

    this.timings.get(name)!.push(duration);
    return duration;
  }

  public getAverageTiming(name: string, samples: number = 60): number {
    const timings = this.timings.get(name) || [];
    const recentTimings = timings.slice(-samples);
    return recentTimings.reduce((a, b) => a + b, 0) / recentTimings.length;
  }

  public generateReport(): PerformanceReport {
    return {
      shadowPass: this.getAverageTiming('shadow-pass'),
      geometryPass: this.getAverageTiming('geometry-pass'),
      postProcessPass: this.getAverageTiming('postprocess-pass'),
      totalFrameTime: this.getAverageTiming('total-frame'),
      memoryUsage: this.memoryTracker.getCurrentUsage(),
      gpuMemory: this.memoryTracker.getGPUUsage()
    };
  }
}
```

### 性能优化策略

#### 1. 阴影优化

```typescript
class ShadowOptimizer {
  private adaptiveShadowMap: boolean = true;
  private cascadeUpdateFrequency: number = 1;

  public optimizeForDistance(distance: number): ShadowQuality {
    if (distance < 50) {
      return {
        shadowMapSize: 4096,
        pcfKernel: 5,
        cascadeCount: 4
      };
    } else if (distance < 200) {
      return {
        shadowMapSize: 2048,
        pcfKernel: 3,
        cascadeCount: 3
      };
    } else {
      return {
        shadowMapSize: 1024,
        pcfKernel: 1,
        cascadeCount: 2
      };
    }
  }

  public setUpdateFrequency(frequency: number): void {
    this.cascadeUpdateFrequency = frequency;
    // 偶数帧更新部分级联，奇数帧更新另一部分
  }
}
```

#### 2. 材质批处理

```typescript
class MaterialBatchRenderer {
  private materialBatches: Map<string, RenderBatch> = new Map();

  public addToBatch(obj: RenderObject): void {
    const materialKey = obj.material.getBatchKey();

    if (!this.materialBatches.has(materialKey)) {
      this.materialBatches.set(materialKey, new RenderBatch(obj.material));
    }

    this.materialBatches.get(materialKey)!.addObject(obj);
  }

  public renderBatches(renderPass: RHIRenderPass): void {
    for (const batch of this.materialBatches.values()) {
      if (batch.isEmpty()) continue;

      // 绑定材质一次
      batch.material.bind(renderPass);

      // 批量渲染相同材质的对象
      for (const obj of batch.objects) {
        batch.material.updateTransforms(
          obj.transform,
          obj.camera.viewMatrix,
          obj.camera.projectionMatrix,
          obj.normalMatrix,
          obj.camera.position
        );

        renderPass.setVertexBuffer(0, obj.geometry.vertexBuffer);
        renderPass.setIndexBuffer(obj.geometry.indexBuffer, RHIIndexFormat.UINT16);
        renderPass.drawIndexed(obj.geometry.indexCount, 1, 0, 0, 0);
      }
    }

    // 清空批次
    this.materialBatches.clear();
  }
}
```

#### 3. GPU内存管理

```typescript
class GPUMemoryManager {
  private texturePool: TexturePool;
  private bufferPool: BufferPool;
  private renderTargetPool: RenderTargetPool;

  public preallocateCommonResources(): void {
    // 预分配常用纹理尺寸
    const commonSizes = [256, 512, 1024, 2048, 4096];
    for (const size of commonSizes) {
      this.texturePool.allocate(size, size, RHITextureFormat.RGBA8_UNORM);
      this.renderTargetPool.allocate(size, size);
    }

    // 预分配常用缓冲区大小
    const commonBufferSizes = [1024, 4096, 16384, 65536];
    for (const size of commonBufferSizes) {
      this.bufferPool.allocate(size, RHIBufferUsage.UNIFORM);
      this.bufferPool.allocate(size, RHIBufferUsage.STORAGE);
    }
  }

  public getOptimalRenderTarget(width: number, height: number): RenderTarget {
    // 查找合适尺寸的预分配渲染目标
    return this.renderTargetPool.acquire(width, height) ||
           new RenderTarget(this.device, { width, height });
  }

  public releaseRenderTarget(renderTarget: RenderTarget): void {
    this.renderTargetPool.release(renderTarget);
  }
}
```

## 最佳实践

### 1. 渲染顺序优化

```typescript
class RenderOrderOptimizer {
  public sortRenderObjects(objects: RenderObject[], camera: Camera): RenderObject[] {
    return objects.sort((a, b) => {
      // 1. 按材质类型排序（减少状态切换）
      if (a.material.type !== b.material.type) {
        return this.getMaterialPriority(a.material) - this.getMaterialPriority(b.material);
      }

      // 2. 按透明度排序（不透明在前，透明在后）
      if (a.material.transparent !== b.material.transparent) {
        return a.material.transparent ? 1 : -1;
      }

      // 3. 透明物体按距离排序（从远到近）
      if (a.material.transparent && b.material.transparent) {
        const distA = camera.position.distanceTo(a.position);
        const distB = camera.position.distanceTo(b.position);
        return distB - distA;
      }

      // 4. 不透明物体按距离排序（从近到远，利用早期Z测试）
      const distA = camera.position.distanceTo(a.position);
      const distB = camera.position.distanceTo(b.position);
      return distA - distB;
    });
  }
}
```

### 2. 动态LOD系统

```typescript
class LODManager {
  public selectLODLevel(obj: RenderObject, camera: Camera): number {
    const distance = camera.position.distanceTo(obj.position);
    const screenSpaceSize = this.calculateScreenSpaceSize(obj, camera, distance);

    if (screenSpaceSize > 500) return 0;      // 高质量
    if (screenSpaceSize > 200) return 1;      // 中等质量
    if (screenSpaceSize > 50)  return 2;      // 低质量
    return 3;                                 // 最低质量
  }

  private calculateScreenSpaceSize(obj: RenderObject, camera: Camera, distance: number): number {
    const projectedSize = (obj.boundingRadius * camera.fov) / distance;
    return projectedSize * Math.min(camera.width, camera.height);
  }
}
```

### 3. 实例化渲染

```typescript
class InstancedRenderer {
  public renderInstanced(objects: RenderObject[], renderPass: RHIRenderPass): void {
    // 按几何体分组
    const groups = this.groupByGeometry(objects);

    for (const [geometry, group] of groups) {
      if (group.length < 2) continue; // 不值得实例化

      // 准备实例数据
      const instanceData = new Float32Array(group.length * 16); // mat4 per instance
      for (let i = 0; i < group.length; i++) {
        instanceData.set(group[i].transform.toArray(), i * 16);
      }

      // 更新实例缓冲区
      this.instanceBuffer.update(instanceData);

      // 渲染实例
      renderPass.setVertexBuffer(0, geometry.vertexBuffer);
      renderPass.setVertexBuffer(1, this.instanceBuffer);
      renderPass.setIndexBuffer(geometry.indexBuffer, RHIIndexFormat.UINT16);
      renderPass.drawIndexedInstanced(geometry.indexCount, group.length, 0, 0, 0);
    }
  }
}
```

## 完整集成示例

```typescript
class CompleteRenderer {
  private profiler: RenderingProfiler;
  private lodManager: LODManager;
  private materialBatcher: MaterialBatchRenderer;
  private memoryManager: GPUMemoryManager;
  private postProcessPipeline: AdvancedPostProcessPipeline;
  private shadowMapper: ShadowMapper;

  constructor(device: RHIDevice) {
    this.initializeComponents(device);
  }

  private initializeComponents(device: RHIDevice): void {
    this.profiler = new RenderingProfiler();
    this.lodManager = new LODManager();
    this.materialBatcher = new MaterialBatchRenderer();
    this.memoryManager = new GPUMemoryManager(device);
    this.postProcessPipeline = new AdvancedPostProcessPipeline(device);
    this.shadowMapper = new ShadowMapper(device);

    // 预分配资源
    this.memoryManager.preallocateCommonResources();
  }

  public renderFrame(scene: Scene, camera: Camera): void {
    this.profiler.startProfile('total-frame');

    const encoder = this.device.createCommandEncoder();

    try {
      // 1. 阴影映射
      this.profiler.startProfile('shadow-pass');
      this.renderShadows(encoder, scene, camera);
      this.profiler.endProfile('shadow-pass');

      // 2. 几何渲染
      this.profiler.startProfile('geometry-pass');
      const sceneTexture = this.renderGeometry(encoder, scene, camera);
      this.profiler.endProfile('geometry-pass');

      // 3. 后处理
      this.profiler.startProfile('postprocess-pass');
      const finalTexture = this.postProcessPipeline.process(encoder, sceneTexture);
      this.profiler.endProfile('postprocess-pass');

      // 4. 输出
      this.renderOutput(encoder, finalTexture);

    } finally {
      this.device.submitCommandEncoder(encoder);
      this.profiler.endProfile('total-frame');

      // 性能分析
      this.analyzePerformance();
    }
  }

  private renderGeometry(encoder: RHICommandEncoder, scene: Scene, camera: Camera): RHITextureView {
    const renderTarget = this.memoryManager.getOptimalRenderTarget(camera.width, camera.height);
    const renderPass = encoder.beginRenderPass(
      renderTarget.getRenderPassDescriptor([0.02, 0.02, 0.05, 1.0], 1.0)
    );

    try {
      // 获取并优化渲染对象
      let renderObjects = scene.getRenderObjects();
      renderObjects = this.optimizeRenderOrder(renderObjects, camera);
      renderObjects = this.applyLOD(renderObjects, camera);

      // 批处理渲染
      this.materialBatcher.clear();
      for (const obj of renderObjects) {
        if (this.canBatchRender(obj)) {
          this.materialBatcher.addToBatch(obj);
        } else {
          this.renderSingleObject(renderPass, obj, camera);
        }
      }

      this.materialBatcher.renderBatches(renderPass);

    } finally {
      renderPass.end();
      this.memoryManager.releaseRenderTarget(renderTarget);
    }

    return renderTarget.getColorView(0);
  }

  private analyzePerformance(): void {
    const frameTime = this.profiler.getAverageTiming('total-frame', 10);

    // 动态质量调整
    if (frameTime > 20) { // 低于50 FPS
      this.postProcessPipeline.downgradeQuality();
      this.shadowMapper.reduceQuality();
    } else if (frameTime < 10) { // 高于100 FPS
      this.postProcessPipeline.upgradeQuality();
      this.shadowMapper.increaseQuality();
    }

    // 输出性能报告
    if (Math.random() < 0.01) { // 1%概率输出报告
      console.log('Performance Report:', this.profiler.generateReport());
    }
  }
}
```

## 故障排除

### 常见集成问题

#### 1. 阴影显示异常
```typescript
// 检查阴影贴图设置
if (!shadowMapper.isConfiguredCorrectly()) {
  console.error('Shadow mapper misconfiguration detected');
  shadowMapper.validateSettings();
}

// 检查空间矩阵
if (!shadowMapper.validateMatrices(lightDirection, camera)) {
  console.warn('Invalid shadow matrices detected');
  shadowMapper.recalculateMatrices(lightDirection, camera);
}
```

#### 2. PBR材质过曝
```typescript
// 检查HDR设置
if (!postProcessManager.isHDREnabled()) {
  console.warn('HDR not enabled, PBR may appear overexposed');
  postProcessManager.enableHDR();
}

// 检查曝光设置
toneMapping.setParameters({ exposure: 1.0 }); // 调整到合适值
```

#### 3. 后处理效果顺序错误
```typescript
// 确保正确的处理顺序
const correctOrder = [
  'bloom',        // 先处理明亮区域
  'dof',          // 景深效果
  'colorGrading', // 颜色校正
  'toneMapping',  // 色调映射
  'fxaa'          // 最后抗锯齿
];
```

## 参考链接

- [PBR材质文档](../../reference/modules/pbr-material.md)
- [阴影映射文档](../../reference/modules/shadow-mapping.md)
- [后处理系统文档](../../reference/modules/post-processing-system.md)
- [性能优化指南](../optimization/performance.md)
- [FXAA抗锯齿文档](../../reference/modules/fxaa-anti-aliasing.md)