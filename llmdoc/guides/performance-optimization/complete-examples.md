---
title: "完整示例和最佳实践"
description: "性能优化系统的完整使用示例、集成指南和最佳实践"
category: "guides"
tags: ["examples", "integration", "best-practices", "performance"]
created: "2025-12-17"
updated: "2025-12-17"
version: "1.0.0"
---

# 完整示例和最佳实践

## 概述

本指南提供了性能优化系统的完整使用示例、集成方案和最佳实践。通过实际场景演示如何将各个优化模块协同工作，实现最佳性能表现。

## 完整系统演示

### 系统初始化

```typescript
import {
  PerformanceAnalyzer,
  RHICommandOptimizer,
  MathPoolManager,
  SIMDWrapper,
  GlobalMemoryLeakDetector,
  BatchSIMDProcessor
} from './performance-optimization';

class PerformanceOptimizedRenderer {
  private device: MSpec.IRHIDevice;
  private performanceAnalyzer: PerformanceAnalyzer;
  private commandOptimizer: RHICommandOptimizer;
  private mathPool: MathPoolManager;
  private memoryLeakDetector = GlobalMemoryLeakDetector;

  constructor(device: MSpec.IRHIDevice) {
    this.device = device;
    this.initializeOptimizations();
  }

  private initializeOptimizations(): void {
    // 1. 启动性能分析
    this.performanceAnalyzer = new PerformanceAnalyzer({
      thresholds: {
        fpsLow: 50,
        fpsCritical: 40,
        frameTimeMax: 25,
        memoryUsageRatio: 0.75,
        drawCallsMax: 800
      }
    });

    // 2. 初始化命令优化器
    this.commandOptimizer = new RHICommandOptimizer({
      instancingEnabled: true,
      maxInstancesPerBatch: 2048,
      enableStateSorting: true,
      enableDepthSorting: true
    });

    // 3. 获取对象池管理器
    this.mathPool = MathPoolManager.getInstance();

    // 4. 启动内存泄漏检测
    this.memoryLeakDetector.start();

    // 5. 预热系统
    this.preWarmSystems();

    console.log('🚀 性能优化系统已初始化');
  }

  private preWarmSystems(): void {
    // 预热数学对象池
    this.mathPool.preWarmAllPools();

    // 预热SIMD（如果支持）
    if (SIMDWrapper.supported) {
      this.preWarmSIMD();
    }

    // 预生成常用资源
    this.preGenerateResources();
  }
}
```

### 主渲染循环

```typescript
class PerformanceOptimizedRenderer {
  private renderLoop(): void {
    const frameStart = performance.now();

    // 开始帧分析
    this.performanceAnalyzer.beginFrame();

    // 开始CPU计时
    this.performanceAnalyzer.startCPUTimer('frame_total');

    try {
      // 1. 更新阶段
      this.performanceAnalyzer.startCPUTimer('update');
      this.updateScene();
      this.performanceAnalyzer.endCPUTimer('update');

      // 2. 剔除阶段
      this.performanceAnalyzer.startCPUTimer('culling');
      const visibleObjects = this.performCulling();
      this.performanceAnalyzer.endCPUTimer('culling');

      // 3. 优化阶段
      this.performanceAnalyzer.startCPUTimer('optimization');
      const renderCommands = this.generateRenderCommands(visibleObjects);
      this.commandOptimizer.addCommands(renderCommands);
      this.performanceAnalyzer.endCPUTimer('optimization');

      // 4. 渲染阶段
      this.performanceAnalyzer.startCPUTimer('render');
      this.executeRenderPass();
      this.performanceAnalyzer.endCPUTimer('render');

    } catch (error) {
      console.error('渲染错误:', error);
    } finally {
      // 结束帧分析
      this.performanceAnalyzer.endFrame();

      // 记录帧时间
      const frameTime = performance.now() - frameStart;
      this.performanceAnalyzer.recordCPUMetrics(
        this.performanceAnalyzer.endCPUTimer('frame_total'),
        0, 0, 0, 0
      );

      // 继续下一帧
      requestAnimationFrame(() => this.renderLoop());
    }
  }
}
```

## 实际应用场景

### 1. 大规模场景渲染

```typescript
class LargeSceneRenderer extends PerformanceOptimizedRenderer {
  private scene: Scene;
  private lodManager: LODManager;
  private instanceManager: InstanceManager;

  constructor(device: MSpec.IRHIDevice, scene: Scene) {
    super(device);
    this.scene = scene;
    this.lodManager = new LODManager();
    this.instanceManager = new InstanceManager();
    this.setupSceneOptimizations();
  }

  private setupSceneOptimizations(): void {
    // 按材质分组对象
    this.groupObjectsByMaterial();

    // 预计算包围盒
    this.precomputeBoundingBoxes();

    // 设置LOD
    this.setupLOD();
  }

  private generateRenderCommands(visibleObjects: SceneObject[]): OptimizedRenderCommand[] {
    const commands: OptimizedRenderCommand[] = [];
    const materialGroups = this.groupByMaterial(visibleObjects);

    for (const [materialId, objects] of materialGroups) {
      // 检查是否可以实例化渲染
      if (this.canInstanceRender(objects)) {
        commands.push(this.createInstancedCommand(objects, materialId));
      } else {
        // 单独渲染
        objects.forEach(obj => {
          commands.push(this.createRenderCommand(obj, materialId));
        });
      }
    }

    return commands;
  }

  private canInstanceRender(objects: SceneObject[]): boolean {
    // 检查对象是否使用相同的几何体和材质
    const firstGeometry = objects[0].geometry;
    const firstMaterial = objects[0].material;

    return objects.every(obj =>
      obj.geometry === firstGeometry &&
      obj.material === firstMaterial
    );
  }

  private createInstancedCommand(objects: SceneObject[], materialId: string): OptimizedRenderCommand {
    const instanceData = new Float32Array(objects.length * 20); // 80 bytes per instance

    // 使用SIMD批量处理实例数据
    const matrices = objects.map(obj => obj.transformMatrix.elements);
    const transformed = matrices.map(() => new Float32Array(16));

    BatchSIMDProcessor.transformVectors(
      this.getViewProjectionMatrix(),
      matrices,
      transformed
    );

    // 展平到实例数据
    objects.forEach((obj, i) => {
      const offset = i * 20;
      // [0-15]: mat4 modelMatrix (16 floats)
      transformed[i].forEach((val, j) => {
        instanceData[offset + j] = val;
      });
      // [16-19]: vec4 instanceColor (4 floats)
      const color = obj.material.color || [1, 1, 1, 1];
      instanceData.set(color, offset + 16);
    });

    return {
      type: RenderCommandType.DRAW_INSTANCED,
      pipeline: materialId,
      instanceData,
      instanceCount: objects.length,
      materialId,
      transparent: objects[0].material.transparent
    };
  }
}
```

### 2. 物理模拟优化

```typescript
class OptimizedPhysicsSimulation {
  private particles: Particle[] = [];
  private forces: ForceField[] = [];
  private collisionGrid: SpatialHashGrid;

  constructor() {
    this.collisionGrid = new SpatialHashGrid(100); // 100单位网格
    this.initializeParticles(10000); // 10000个粒子
  }

  update(deltaTime: number): void {
    // 使用对象池避免临时对象创建
    const positions = MathPoolManager.getInstance().getVector3Batch(this.particles.length);
    const velocities = MathPoolManager.getInstance().getVector3Batch(this.particles.length);
    const forces = MathPoolManager.getInstance().getVector3Batch(this.particles.length);

    // 填充数据
    this.particles.forEach((particle, i) => {
      positions[i].copy(particle.position);
      velocities[i].copy(particle.velocity);
      forces[i].set(0, 0, 0);
    });

    // 计算力场影响（SIMD优化）
    this.calculateForces(forces, positions);

    // 批量更新粒子（SIMD优化）
    this.batchUpdateParticles(velocities, forces, deltaTime);

    // 碰撞检测和响应
    this.performCollisions(positions, velocities);

    // 更新粒子位置
    this.particles.forEach((particle, i) => {
      particle.position.copy(positions[i]);
      particle.velocity.copy(velocities[i]);
    });

    // 释放对象池
    MathPoolManager.getInstance().releaseVector3Batch(positions);
    MathPoolManager.getInstance().releaseVector3Batch(velocities);
    MathPoolManager.getInstance().releaseVector3Batch(forces);
  }

  private calculateForces(forces: Vector3[], positions: Vector3[]): void {
    // 使用SIMD批量计算力场
    for (const forceField of this.forces) {
      const lightPositions = positions.map(p => p.elements as Float32Array);
      const lightColors = forces.map(() => forceField.color.elements as Float32Array);
      const results = forces.map(() => new Float32Array(4));

      BatchSIMDProcessor.calculateLighting(
        lightPositions,
        positions.map(p => [1, 0, 0, 0] as Float32Array), // 法线
        forceField.position.elements as Float32Array,
        forceField.color.elements as Float32Array,
        results
      );

      // 应用结果到力
      results.forEach((result, i) => {
        forces[i].add(
          MathPoolManager.getInstance().getVector3(
            result[0] * forceField.strength,
            result[1] * forceField.strength,
            result[2] * forceField.strength
          )
        );
      });
    }
  }
}
```

### 3. 动画系统优化

```typescript
class OptimizedAnimationSystem {
  private skeletons: Skeleton[] = [];
  private animationClips: AnimationClip[] = [];
  private skinningMatrices: Float32Array;

  constructor(maxSkeletons: number) {
    this.skinningMatrices = new Float32Array(maxSkeletons * 16 * 64); // 最多64个骨骼
  }

  update(deltaTime: number): void {
    // 按动画类型分组
    const groups = this.groupByAnimationType();

    for (const [animationType, skeletons] of groups) {
      switch (animationType) {
        case 'simple_transform':
          this.updateSimpleTransform(skeletons, deltaTime);
          break;
        case 'skeletal':
          this.updateSkeletalAnimation(skeletons, deltaTime);
          break;
        case 'morph':
          this.updateMorphTargets(skeletons, deltaTime);
          break;
      }
    }
  }

  private updateSimpleTransform(skeletons: Skeleton[], deltaTime: number): void {
    // 使用对象池批量处理变换
    const matrices = MathPoolManager.getInstance().getMatrix4Batch(skeletons.length);

    skeletons.forEach((skeleton, i) => {
      const matrix = matrices[i];
      matrix.identity();

      // 应用变换
      matrix.makeTranslation(skeleton.position.x, skeleton.position.y, skeleton.position.z);
      matrix.rotateFromQuaternion(skeleton.rotation);
      matrix.scale(skeleton.scale.x, skeleton.scale.y, skeleton.scale.z);

      // 计算最终矩阵
      matrix.multiplyMatrices(skeleton.parentMatrix, matrix);
    });

    // 应用变换
    skeletons.forEach((skeleton, i) => {
      skeleton.finalMatrix.copy(matrices[i]);
    });

    // 释放对象池
    MathPoolManager.getInstance().releaseMatrix4Batch(matrices);
  }

  private updateSkeletalAnimation(skeletons: Skeleton[], deltaTime: number): void {
    for (const skeleton of skeletons) {
      const animation = skeleton.currentAnimation;
      if (!animation) continue;

      // 更新动画时间
      skeleton.animationTime += deltaTime * animation.timeScale;

      // 获取当前帧数据
      const frameData = animation.getFrameData(skeleton.animationTime);

      // 使用SIMD批量计算骨骼矩阵
      const boneMatrices = this.calculateBoneMatrices(skeleton, frameData);

      // 存储到全局缓冲区
      const offset = skeleton.index * 16 * skeleton.boneCount;
      this.skinningMatrices.set(boneMatrices, offset);
    }
  }

  private calculateBoneMatrices(skeleton: Skeleton, frameData: FrameData): Float32Array {
    const bones = skeleton.bones;
    const matrices = new Float32Array(bones.length * 16);

    // 批量处理骨骼变换
    const parentIndices = bones.map(b => b.parentIndex);
    const localMatrices = frameData.boneMatrices;

    // SIMD优化的骨骼层级变换
    this.processBoneHierarchy(localMatrices, parentIndices, matrices);

    return matrices;
  }
}
```

## 集成指南

### 与Three.js集成

```typescript
class ThreeJSPerformanceIntegration {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private performanceSystem: PerformanceOptimizedRenderer;

  constructor(container: HTMLElement) {
    this.initializeThreeJS(container);
    this.initializePerformanceIntegration();
  }

  private initializeThreeJS(container: HTMLElement): void {
    // 创建Three.js渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(1);
    container.appendChild(this.renderer.domElement);

    // 创建场景和相机
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  }

  private initializePerformanceIntegration(): void {
    // 包装Three.js渲染器
    const originalRender = this.renderer.render.bind(this.renderer);

    this.renderer.render = (scene: THREE.Scene, camera: THREE.Camera) => {
      // 开始性能监控
      this.performanceSystem.performanceAnalyzer.beginFrame();

      // 执行Three.js渲染
      originalRender(scene, camera);

      // 结束性能监控
      this.performanceSystem.performanceAnalyzer.endFrame();

      // 记录渲染统计
      const info = this.renderer.info;
      this.performanceSystem.performanceAnalyzer.recordRenderMetrics(
        info.render.calls,
        info.render.triangles,
        info.render.points,
        0 // 渲染时间由分析器自动计算
      );
    };
  }

  createOptimizedMesh(geometry: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry, material);

    // 追踪Three.js对象
    GlobalMemoryLeakDetector.trackObject(mesh, 'ThreeJS_Mesh', this.estimateMeshSize(mesh));

    // 优化几何体
    if (geometry instanceof THREE.BufferGeometry) {
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
    }

    return mesh;
  }

  private estimateMeshSize(mesh: THREE.Mesh): number {
    let size = 1024; // 基础对象大小

    // 几何体大小
    if (mesh.geometry) {
      const geometry = mesh.geometry as THREE.BufferGeometry;
      for (const name in geometry.attributes) {
        const attribute = geometry.attributes[name];
        size += attribute.array.byteLength;
      }
    }

    // 材质大小
    if (mesh.material) {
      if (mesh.material instanceof THREE.Material) {
        size += 512;
      } else if (Array.isArray(mesh.material)) {
        size += mesh.material.length * 512;
      }
    }

    return size;
  }
}
```

### 与React Three Fiber集成

```typescript
import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceAnalyzer } from './performance-analyzer';

const PerformanceOptimizedScene: React.FC = () => {
  const performanceRef = useRef<PerformanceAnalyzer>();

  return (
    <Canvas
      performance={{ min: 0.5 }}
      gl={{ antialias: false }}
      onCreated={({ gl }) => {
        performanceRef.current = new PerformanceAnalyzer();
        performanceRef.current.start();
      }}
    >
      <PerformanceMonitor />
      <OptimizedContent />
    </Canvas>
  );
};

const PerformanceMonitor: React.FC = () => {
  const { gl } = useThree();
  const performanceRef = useRef<PerformanceAnalyzer>();

  useEffect(() => {
    if (!performanceRef.current) {
      performanceRef.current = new PerformanceAnalyzer();
      performanceRef.current.start();
    }

    const interval = setInterval(() => {
      const analyzer = performanceRef.current;
      if (analyzer) {
        const metrics = analyzer.getMetrics();
        console.log('Performance:', metrics);

        // 动态调整质量
        if (metrics.frame.fps < 30) {
          gl.setPixelRatio(Math.max(0.5, gl.getPixelRatio() * 0.9));
        } else if (metrics.frame.fps > 50) {
          gl.setPixelRatio(Math.min(2, gl.getPixelRatio() * 1.1));
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gl]);

  return null;
};

const OptimizedContent: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>();
  const instances = useMemo(() => {
    return Array.from({ length: 1000 }, (_, i) => ({
      position: [Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5],
      scale: Math.random() * 0.5 + 0.5,
      color: [Math.random(), Math.random(), Math.random()]
    }));
  }, []);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.1;
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <>
      <instancedMesh ref={meshRef} args={[undefined, undefined, instances.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial />
      </instancedMesh>

      {instances.map((instance, i) => (
        <ObjectInstance key={i} index={i} data={instance} />
      ))}
    </>
  );
};

const ObjectInstance: React.FC<{ index: number; data: any }> = ({ index, data }) => {
  const { position, scale, color } = data;

  useEffect(() => {
    const mesh = document.querySelector(`#instanced-mesh-${index}`);
    if (mesh) {
      const dummy = new THREE.Object3D();
      dummy.position.fromArray(position);
      dummy.scale.setScalar(scale);

      const instancedMesh = mesh as THREE.InstancedMesh;
      instancedMesh.setMatrixAt(index, dummy.matrix);
      instancedMesh.setColorAt(index, new THREE.Color(...color));
      instancedMesh.instanceMatrix.needsUpdate = true;
      instancedMesh.instanceColor!.needsUpdate = true;
    }
  }, [index, position, scale, color]);

  return null;
};
```

## 性能监控仪表板

```typescript
class PerformanceDashboard {
  private container: HTMLElement;
  private analyzer: PerformanceAnalyzer;
  private memoryDetector = GlobalMemoryLeakDetector;
  private chart: Chart;

  constructor(container: HTMLElement, analyzer: PerformanceAnalyzer) {
    this.container = container;
    this.analyzer = analyzer;
    this.createDashboard();
  }

  private createDashboard(): void {
    this.container.innerHTML = `
      <div class="performance-dashboard">
        <div class="metrics-panel">
          <h3>实时性能指标</h3>
          <div class="metric">
            <span class="label">FPS:</span>
            <span id="fps-value">60</span>
          </div>
          <div class="metric">
            <span class="label">Frame Time:</span>
            <span id="frame-time-value">16.67ms</span>
          </div>
          <div class="metric">
            <span class="label">Draw Calls:</span>
            <span id="draw-calls-value">0</span>
          </div>
          <div class="metric">
            <span class="label">Memory:</span>
            <span id="memory-value">0MB</span>
          </div>
        </div>

        <div class="chart-panel">
          <h3>性能趋势</h3>
          <canvas id="performance-chart"></canvas>
        </div>

        <div class="warnings-panel">
          <h3>性能警告</h3>
          <div id="warnings-list"></div>
        </div>

        <div class="controls-panel">
          <button id="optimize-btn">执行优化</button>
          <button id="reset-btn">重置统计</button>
          <button id="export-btn">导出报告</button>
        </div>
      </div>
    `;

    this.initializeChart();
    this.bindEvents();
    this.startUpdating();
  }

  private initializeChart(): void {
    const ctx = this.container.querySelector('#performance-chart') as HTMLCanvasElement;
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'FPS',
          data: [],
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }, {
          label: 'Frame Time (ms)',
          data: [],
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  private startUpdating(): void {
    setInterval(() => {
      this.updateMetrics();
      this.updateChart();
      this.updateWarnings();
    }, 1000);
  }

  private updateMetrics(): void {
    const metrics = this.analyzer.getMetrics();
    const memoryStats = this.memoryDetector.getStatistics();

    document.getElementById('fps-value')!.textContent = metrics.frame.fps.toFixed(1);
    document.getElementById('frame-time-value')!.textContent = `${metrics.frame.frameTime.toFixed(2)}ms`;
    document.getElementById('draw-calls-value')!.textContent = metrics.frame.drawCalls.toString();
    document.getElementById('memory-value')!.textContent = `${(memoryStats.totalMemory / 1024 / 1024).toFixed(1)}MB`;
  }

  private updateWarnings(): void {
    const warnings = this.analyzer.getWarnings();
    const warningsList = document.getElementById('warnings-list')!;

    if (warnings.length === 0) {
      warningsList.innerHTML = '<div class="no-warnings">暂无警告</div>';
      return;
    }

    warningsList.innerHTML = warnings.map(warning => `
      <div class="warning ${warning.severity}">
        <span class="warning-type">${warning.type}</span>
        <span class="warning-message">${warning.message}</span>
      </div>
    `).join('');
  }

  private bindEvents(): void {
    document.getElementById('optimize-btn')?.addEventListener('click', () => {
      this.executeOptimizations();
    });

    document.getElementById('reset-btn')?.addEventListener('click', () => {
      this.analyzer.reset();
      this.chart.data.labels = [];
      this.chart.data.datasets.forEach(dataset => {
        dataset.data = [];
      });
      this.chart.update();
    });

    document.getElementById('export-btn')?.addEventListener('click', () => {
      this.exportReport();
    });
  }

  private executeOptimizations(): void {
    const report = this.analyzer.getReport();

    // 根据建议执行优化
    report.recommendations.forEach(recommendation => {
      console.log('执行优化建议:', recommendation);
      // 这里可以实现具体的优化逻辑
    });

    // 重新预热对象池
    MathPoolManager.getInstance().preWarmAllPools();

    // 清理内存泄漏
    this.memoryDetector.generateReport();

    console.log('✅ 优化执行完成');
  }

  private exportReport(): void {
    const report = this.analyzer.getReport();
    const memoryReport = this.memoryDetector.generateReport();
    const poolStats = MathPoolManager.getInstance().getPoolStatistics();

    const fullReport = {
      timestamp: Date.now(),
      performance: report,
      memory: memoryReport,
      objectPools: poolStats,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    const blob = new Blob([JSON.stringify(fullReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

## 最佳实践总结

### 1. 系统设计原则

```typescript
// ✅ 良好的系统设计
class WellDesignedSystem {
  private dependencies = new Map<string, any>();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // 按依赖顺序初始化
    await this.initializePerformanceMonitoring();
    await this.initializeObjectPools();
    await this.initializeMemoryTracking();
    await this.initializeSIMDOptimizations();

    this.initialized = true;
    console.log('✅ 系统初始化完成');
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) return;

    // 按相反顺序清理
    await this.cleanupSIMDOptimizations();
    await this.cleanupMemoryTracking();
    await this.cleanupObjectPools();
    await this.cleanupPerformanceMonitoring();

    this.initialized = false;
    console.log('✅ 系统清理完成');
  }
}
```

### 2. 性能优化检查清单

```typescript
const PerformanceOptimizationChecklist = {
  // 🎯 对象管理
  objectPooling: {
    enabled: true,
    preWarmed: true,
    autoShrinking: true,
    batchOperations: true
  },

  // 🚀 SIMD优化
  simdOptimization: {
    supported: SIMDWrapper.supported,
    batchProcessing: true,
    vectorizedOperations: true,
    gracefulDegradation: true
  },

  // 📊 性能监控
  performanceMonitoring: {
    realTimeMetrics: true,
    alertingEnabled: true,
    trendAnalysis: true,
    automatedReporting: true
  },

  // 🧠 内存管理
  memoryManagement: {
    leakDetectionEnabled: true,
    automaticCleanup: true,
    memorySnapshots: true,
    sizeEstimation: true
  },

  // 🎮 渲染优化
  renderingOptimization: {
    commandOptimization: true,
    instancingEnabled: true,
    stateSorting: true,
    depthSorting: true
  }
};
```

### 3. 调试和故障排除

```typescript
class PerformanceDebugger {
  static async runDiagnostic(): Promise<DiagnosticReport> {
    const report: DiagnosticReport = {
      timestamp: Date.now(),
      systemInfo: this.getSystemInfo(),
      performanceMetrics: this.getPerformanceMetrics(),
      memoryAnalysis: this.analyzeMemoryUsage(),
      recommendations: []
    };

    // 检查关键指标
    if (report.performanceMetrics.fps < 30) {
      report.recommendations.push({
        type: 'performance',
        severity: 'high',
        message: 'FPS过低，建议降低渲染质量或启用LOD',
        action: 'reduce_render_quality'
      });
    }

    if (report.memoryAnalysis.leakDetected) {
      report.recommendations.push({
        type: 'memory',
        severity: 'medium',
        message: '检测到内存泄漏，建议检查对象生命周期',
        action: 'check_object_lifecycle'
      });
    }

    return report;
  }

  private static getSystemInfo(): SystemInfo {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      cores: navigator.hardwareConcurrency || 0,
      memory: (navigator as any).deviceMemory || 0,
      gpu: this.getGPUInfo()
    };
  }

  private static getGPUInfo(): string {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'Unknown';

    const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'WebGL supported';

    return (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
  }
}
```

## 相关文档

- [性能优化概览](./overview.md)
- [性能分析器详细指南](./performance-analyzer.md)
- [RHI命令优化器](./rhi-command-optimizer.md)
- [数学对象池优化](./math-pool-optimization.md)
- [SIMD优化技术](./simd-optimization.md)
- [内存泄漏检测](./memory-leak-detection.md)