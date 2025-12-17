---
title: Demo Standards
description: 自动化LLM-Native标准化指南文档
category: guides
subcategory: demo
tags: ['guide', 'llm-native', 'demo', 'demo-developers', 'interface-first', 'code-examples', 'step-by-step']
target_audience: demo-developers
complexity: advanced
estimated_time: f"136 分钟"
last_updated: 2025-12-17
llm_native_compliance: true
version: 1.0.0
---


## 🎯 Context & Goal

### Context
本文档属于**demo**类型的开发指南，面向**demo-developers**。

### Goal
帮助开发者快速理解和掌握相关概念、工具和最佳实践，提高开发效率和代码质量。

### Prerequisites
- 基础的编程知识
- 了解项目架构和基本概念
- 相关领域的开发经验

---

# Demo开发规范

## 概述

本规范定义了RHI Demo系统的开发标准、编码规范和最佳实践，确保所有Demo的一致性、可维护性和用户体验。

## 🎯 核心原则

### 一致性原则
- **统一的API使用**: 所有Demo使用相同的工具库API
- **标准的UI布局**: 统一的信息面板和控制布局
- **一致的交互模式**: 标准化的键盘/鼠标操作

### 可维护性原则
- **模块化设计**: 清晰的功能模块分离
- **完善的文档**: 详细的代码注释和说明
- **测试覆盖**: 自动化测试验证

### 性能原则
- **资源管理**: 正确的资源生命周期管理
- **内存安全**: 避免内存泄漏
- **性能监控**: 集成性能分析工具

## 📝 编码规范

### TypeScript标准

#### 1. 命名约定

```typescript
// 类名：PascalCase
export class RotatingCubeDemo {
  private runner: DemoRunner;
  private geometry: Geometry;
}

// 变量名：camelCase
const vertexBuffer = runner.createVertexBuffer(vertices, 'Vertices');
const transformMatrix = new MMath.Matrix4();

// 常量名：UPPER_SNAKE_CASE
const MAX_INSTANCES = 1000;
const DEFAULT_CLEAR_COLOR = [0.1, 0.1, 0.1, 1.0];

// 接口名：PascalCase，以I开头
interface DemoConfig {
  name: string;
  clearColor: number[];
}
```

#### 2. 文件结构

```typescript
// demo-template.ts
import { MSpec } from '@maxellabs/core';
import {
  DemoRunner,
  GeometryGenerator,
  OrbitController,
  Stats
} from './utils';

/**
 * Demo名称 - 简短描述
 *
 * 技术要点：
 * - 要点1
 * - 要点2
 * - 要点3
 */
export default class TemplateDemo {
  private runner: DemoRunner;
  private orbit: OrbitController;
  private stats: Stats;

  // 资源引用
  private pipeline?: MSpec.IRHIRenderPipeline;
  private vertexBuffer?: MSpec.IRHIBuffer;
  private indexBuffer?: MSpec.IRHIBuffer;
  private uniformBuffer?: MSpec.IRHIBuffer;

  constructor(canvas: HTMLCanvasElement) {
    this.runner = new DemoRunner({
      canvasId: 'J-canvas',
      name: 'Template Demo',
      clearColor: [0.1, 0.1, 0.1, 1.0],
    });
  }

  public async init(): Promise<void> {
    await this.runner.init();
    await this.setup();
    this.startRenderLoop();
  }

  private async setup(): Promise<void> {
    this.setupResources();
    this.setupPipeline();
    this.setupControls();
  }

  private setupResources(): void {
    // 创建几何体
    const geometry = GeometryGenerator.cube({ size: 1.0 });

    this.vertexBuffer = this.runner.track(
      this.runner.device.createBuffer({
        size: geometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        initialData: geometry.vertices
      })
    );

    this.indexBuffer = this.runner.track(
      this.runner.device.createBuffer({
        size: geometry.indices.byteLength,
        usage: MSpec.RHIBufferUsage.INDEX,
        initialData: geometry.indices
      })
    );

    this.uniformBuffer = this.runner.track(
      this.runner.device.createBuffer({
        size: 192, // 3个mat4 * 64字节
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic'
      })
    );
  }

  private setupPipeline(): void {
    // 实现着色器和管线创建
  }

  private setupControls(): void {
    this.orbit = new OrbitController(this.runner.canvas, {
      distance: 5,
      target: [0, 0, 0],
      enableDamping: true,
    });

    this.stats = new Stats({ position: 'top-left' });

    // 键盘事件
    this.runner.onKey('Escape', () => this.destroy());
    this.runner.onKey('F11', () => this.toggleFullscreen());
    this.runner.onKey('R', () => this.reset());

    // 显示帮助信息
    DemoRunner.showHelp([
      'ESC: 退出Demo',
      'F11: 切换全屏',
      'R: 重置场景',
      '鼠标左键: 旋转视角',
      '鼠标滚轮: 缩放',
      '鼠标右键: 平移',
    ]);
  }

  private startRenderLoop(): void {
    this.runner.start((dt) => {
      this.stats.begin();
      this.update(dt);
      this.render();
      this.stats.end();
    });
  }

  private update(dt: number): void {
    this.orbit.update(dt);
  }

  private render(): void {
    const { encoder, passDescriptor } = this.runner.beginFrame();

    const renderPass = encoder.beginRenderPass(passDescriptor);

    if (this.pipeline) {
      renderPass.setPipeline(this.pipeline);
      renderPass.setBindGroup(0, this.createBindGroup());
      renderPass.setVertexBuffer(0, this.vertexBuffer!);
      renderPass.setIndexBuffer(this.indexBuffer!, MSpec.RHIIndexFormat.UINT16);
      renderPass.drawIndexed(36);
    }

    renderPass.end();
    this.runner.endFrame(encoder);
  }

  private createBindGroup(): MSpec.IRHIBindGroup {
    // 实现绑定组创建
    return this.runner.device.createBindGroup({
      layout: this.pipeline!.getBindGroupLayout(0),
      entries: []
    });
  }

  private reset(): void {
    this.orbit.reset();
  }

  private toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  public destroy(): void {
    this.stats.destroy();
    this.orbit.destroy();
    this.runner.destroy();
  }
}
```

### HTML模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demo名称 - RHI Demo</title>
  <link rel="stylesheet" href="../styles/demo.css">
</head>
<body>
  <div class="container">
    <canvas id="J-canvas"></canvas>
  </div>

  <div class="info-panel">
    <h3>🔺 Demo名称</h3>
    <p class="description">简洁的Demo描述...</p>
    <div class="tech-points">
      <h4>💡 技术要点</h4>
      <ul>
        <li>技术点1</li>
        <li>技术点2</li>
        <li>技术点3</li>
      </ul>
    </div>
  </div>

  <script type="module">
    import TemplateDemo from '../src/template.js';

    async function init() {
      try {
        const canvas = document.getElementById('J-canvas');
        const demo = new TemplateDemo(canvas);
        await demo.init();
      } catch (error) {
        console.error('Demo初始化失败:', error);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  </script>
</body>
</html>
```

## 🎨 UI设计规范

### 布局结构

```css
/* 容器布局 */
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.container {
  width: 100vw;
  height: 100vh;
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
}

#J-canvas {
  display: block;
  cursor: grab;
}

#J-canvas:active {
  cursor: grabbing;
}

/* 信息面板 */
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

.info-panel h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #4CAF50;
}

.info-panel .description {
  margin: 0 0 12px 0;
  line-height: 1.4;
  opacity: 0.9;
}

.info-panel h4 {
  margin: 12px 0 6px 0;
  font-size: 14px;
  color: #2196F3;
}

.info-panel ul {
  margin: 0;
  padding-left: 16px;
}

.info-panel li {
  margin: 4px 0;
  font-size: 12px;
  opacity: 0.8;
}
```

### 统一组件

#### 性能监控面板
```typescript
// 标准性能监控配置
const stats = new Stats({
  position: 'top-left',
  show: ['fps', 'ms', 'memory'],
  theme: 'dark'
});
```

#### 相机控制
```typescript
// 标准相机控制配置
const orbit = new OrbitController(canvas, {
  distance: 5,
  target: [0, 0, 0],
  enableDamping: true,
  dampingFactor: 0.05,
  enableZoom: true,
  enableRotate: true,
  enablePan: true,
  minDistance: 1,
  maxDistance: 100
});
```

## 📊 质量标准

### 性能要求

```typescript
// 性能基准
interface PerformanceBenchmark {
  targetFPS: 60;           // 目标帧率
  maxFrameTime: 16.67;     // 最大帧时间(ms)
  maxDrawCalls: 100;       // 最大绘制调用数
  maxMemoryUsage: 50;      // 最大内存使用(MB)
  maxGeometryVertices: 65536; // 最大顶点数
}

// 性能监控
class PerformanceMonitor {
  private benchmark: PerformanceBenchmark = {
    targetFPS: 60,
    maxFrameTime: 16.67,
    maxDrawCalls: 100,
    maxMemoryUsage: 50,
    maxGeometryVertices: 65536
  };

  public validatePerformance(metrics: any): ValidationResult {
    const results: ValidationResult = {
      passed: true,
      warnings: [],
      errors: []
    };

    if (metrics.fps < this.benchmark.targetFPS * 0.8) {
      results.errors.push(`FPS过低: ${metrics.fps} < ${this.benchmark.targetFPS * 0.8}`);
      results.passed = false;
    }

    if (metrics.drawCalls > this.benchmark.maxDrawCalls) {
      results.warnings.push(`绘制调用过多: ${metrics.drawCalls} > ${this.benchmark.maxDrawCalls}`);
    }

    return results;
  }
}
```

### 兼容性标准

```typescript
// 浏览器兼容性检查
class CompatibilityChecker {
  public static checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }

  public static checkWebGL2Support(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl2'));
    } catch (e) {
      return false;
    }
  }

  public static checkRequiredExtensions(extensions: string[]): boolean {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return false;

    return extensions.every(ext => gl.getExtension(ext));
  }
}
```

## 🧪 测试规范

### 单元测试

```typescript
// demo.test.ts
import TemplateDemo from '../src/template';
import { jest } from '@jest/globals';

describe('TemplateDemo', () => {
  let demo: TemplateDemo;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    // 创建模拟Canvas
    mockCanvas = document.createElement('canvas') as HTMLCanvasElement;
    mockCanvas.id = 'J-canvas';
    document.body.appendChild(mockCanvas);

    demo = new TemplateDemo(mockCanvas);
  });

  afterEach(() => {
    demo.destroy();
    document.body.removeChild(mockCanvas);
  });

  it('应该正确初始化', async () => {
    await expect(demo.init()).resolves.not.toThrow();
  });

  it('应该创建正确的几何体', () => {
    const geometry = demo['geometry'];
    expect(geometry).toBeDefined();
    expect(geometry.vertices).toBeInstanceOf(Float32Array);
    expect(geometry.indices).toBeInstanceOf(Uint16Array);
  });

  it('应该处理键盘事件', () => {
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    const destroySpy = jest.spyOn(demo, 'destroy');

    document.dispatchEvent(escapeEvent);

    expect(destroySpy).toHaveBeenCalled();
  });
});
```

### 集成测试

```typescript
// e2e.test.ts
import puppeteer from 'puppeteer';

describe('TemplateDemo E2E', () => {
  let browser: puppeteer.Browser;
  let page: puppeteer.Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('应该正确加载Demo', async () => {
    await page.goto('http://localhost:3001/demo/html/template.html');

    // 检查Canvas是否加载
    await page.waitForSelector('#J-canvas');

    // 检查是否没有错误
    const errors = await page.evaluate(() => {
      return (window as any).demoErrors || [];
    });

    expect(errors).toHaveLength(0);
  });

  it('应该保持良好的性能', async () => {
    await page.goto('http://localhost:3001/demo/html/template.html');
    await page.waitForSelector('#J-canvas');

    // 测量帧率
    const fps = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frameCount = 0;
        const startTime = performance.now();

        function measureFPS() {
          frameCount++;
          const elapsed = performance.now() - startTime;
          if (elapsed < 5000) { // 测量5秒
            requestAnimationFrame(measureFPS);
          } else {
            resolve(frameCount / (elapsed / 1000));
          }
        }

        measureFPS();
      });
    });

    expect(fps).toBeGreaterThan(30); // 至少30FPS
  });
});
```

## 📚 文档规范

### 代码注释

```typescript
/**
 * 创建立方体几何体
 *
 * @param options - 立方体配置选项
 * @param options.size - 立方体大小，默认1.0
 * @param options.segments - 每边的分段数，默认1
 * @returns 立方体几何体数据
 *
 * @example
 * ```typescript
 * const cube = GeometryGenerator.cube({
 *   size: 2.0,
 *   segments: 2
 * });
 * ```
 */
export function createCube(options: CubeOptions = {}): Geometry {
  // 实现逻辑...
}
```

### README文档

每个Demo目录应包含README.md：

```markdown
# Demo名称

## 概述
简短描述Demo的功能和目的。

## 技术要点
- 要点1
- 要点2
- 要点3

## 运行方式
```bash
# 开发模式
pnpm --filter @maxellabs/rhi dev

# 访问
http://localhost:3001/demo/html/demo-name.html
```

## 文件结构
```
demo-name/
├── demo-name.ts      # 主逻辑
├── demo-name.html    # 入口页面
└── README.md         # 说明文档
```

## 依赖
- @maxellabs/core
- @maxellabs/math

## 性能指标
- 目标FPS: 60
- 绘制调用: < 10
- 内存使用: < 10MB
```

## 🔍 代码审查清单

### 提交前检查

- [ ] 代码符合ESLint规则
- [ ] 所有函数都有TypeScript类型注解
- [ ] 包含必要的错误处理
- [ ] 资源正确释放（无内存泄漏）
- [ ] 性能在可接受范围内
- [ ] 文档注释完整
- [ ] 通过所有测试用例

### 功能检查

- [ ] MVP矩阵变换正确
- [ ] 相机控制流畅
- [ ] 性能监控正常
- [ ] 键盘/鼠标交互正常
- [ ] 全屏切换功能正常
- [ ] 资源加载错误处理

### 用户体验检查

- [ ] 加载时间合理（< 3秒）
- [ ] 帧率稳定（> 30FPS）
- [ ] 界面响应流畅
- [ ] 错误信息友好
- [ ] 帮助信息清晰

## 🚀 部署规范

### 构建配置

```typescript
// vite.config.ts
export default {
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'core': ['@maxellabs/core'],
          'math': ['@maxellabs/math'],
          'utils': ['./src/utils/index']
        }
      }
    }
  }
};
```

### 发布检查

```bash
# 运行完整测试套件
pnpm test

# 检查构建
pnpm build

# 运行性能基准测试
pnpm test:performance

# 验证所有Demo
pnpm test:demo -- --all
```

## 📖 相关文档

- [Demo开发概览](./overview.md)
- [工具库使用指南](./tools-library.md)
- [Demo目录和状态](./demo-catalog.md)
- [最佳实践指南](./best-practices.md)
## 🔌 Interface First

### 核心接口定义
#### DemoConfig
```typescript
interface DemoConfig {
  name: string;
  renderer: RendererType;
  resources: ResourceConfig;
}
```

#### DemoRunner
```typescript
class DemoRunner {
  initialize(config: DemoConfig): Promise<void>;
  run(): Promise<void>;
  cleanup(): void;
}
```

### 使用流程
1. **初始化**: 按照规范初始化相关组件
2. **配置**: 设置必要的参数和选项
3. **执行**: 调用核心接口执行功能
4. **验证**: 检查结果和状态

---

# Demo开发规范

## 概述

本规范定义了RHI Demo系统的开发标准、编码规范和最佳实践，确保所有Demo的一致性、可维护性和用户体验。

## 🎯 核心原则

### 一致性原则
- **统一的API使用**: 所有Demo使用相同的工具库API
- **标准的UI布局**: 统一的信息面板和控制布局
- **一致的交互模式**: 标准化的键盘/鼠标操作

### 可维护性原则
- **模块化设计**: 清晰的功能模块分离
- **完善的文档**: 详细的代码注释和说明
- **测试覆盖**: 自动化测试验证

### 性能原则
- **资源管理**: 正确的资源生命周期管理
- **内存安全**: 避免内存泄漏
- **性能监控**: 集成性能分析工具

## 📝 编码规范

### TypeScript标准

#### 1. 命名约定

```typescript
// 类名：PascalCase
export class RotatingCubeDemo {
  private runner: DemoRunner;
  private geometry: Geometry;
}

// 变量名：camelCase
const vertexBuffer = runner.createVertexBuffer(vertices, 'Vertices');
const transformMatrix = new MMath.Matrix4();

// 常量名：UPPER_SNAKE_CASE
const MAX_INSTANCES = 1000;
const DEFAULT_CLEAR_COLOR = [0.1, 0.1, 0.1, 1.0];

// 接口名：PascalCase，以I开头
interface DemoConfig {
  name: string;
  clearColor: number[];
}
```

#### 2. 文件结构

```typescript
// demo-template.ts
import { MSpec } from '@maxellabs/core';
import {
  DemoRunner,
  GeometryGenerator,
  OrbitController,
  Stats
} from './utils';

/**
 * Demo名称 - 简短描述
 *
 * 技术要点：
 * - 要点1
 * - 要点2
 * - 要点3
 */
export default class TemplateDemo {
  private runner: DemoRunner;
  private orbit: OrbitController;
  private stats: Stats;

  // 资源引用
  private pipeline?: MSpec.IRHIRenderPipeline;
  private vertexBuffer?: MSpec.IRHIBuffer;
  private indexBuffer?: MSpec.IRHIBuffer;
  private uniformBuffer?: MSpec.IRHIBuffer;

  constructor(canvas: HTMLCanvasElement) {
    this.runner = new DemoRunner({
      canvasId: 'J-canvas',
      name: 'Template Demo',
      clearColor: [0.1, 0.1, 0.1, 1.0],
    });
  }

  public async init(): Promise<void> {
    await this.runner.init();
    await this.setup();
    this.startRenderLoop();
  }

  private async setup(): Promise<void> {
    this.setupResources();
    this.setupPipeline();
    this.setupControls();
  }

  private setupResources(): void {
    // 创建几何体
    const geometry = GeometryGenerator.cube({ size: 1.0 });

    this.vertexBuffer = this.runner.track(
      this.runner.device.createBuffer({
        size: geometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        initialData: geometry.vertices
      })
    );

    this.indexBuffer = this.runner.track(
      this.runner.device.createBuffer({
        size: geometry.indices.byteLength,
        usage: MSpec.RHIBufferUsage.INDEX,
        initialData: geometry.indices
      })
    );

    this.uniformBuffer = this.runner.track(
      this.runner.device.createBuffer({
        size: 192, // 3个mat4 * 64字节
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic'
      })
    );
  }

  private setupPipeline(): void {
    // 实现着色器和管线创建
  }

  private setupControls(): void {
    this.orbit = new OrbitController(this.runner.canvas, {
      distance: 5,
      target: [0, 0, 0],
      enableDamping: true,
    });

    this.stats = new Stats({ position: 'top-left' });

    // 键盘事件
    this.runner.onKey('Escape', () => this.destroy());
    this.runner.onKey('F11', () => this.toggleFullscreen());
    this.runner.onKey('R', () => this.reset());

    // 显示帮助信息
    DemoRunner.showHelp([
      'ESC: 退出Demo',
      'F11: 切换全屏',
      'R: 重置场景',
      '鼠标左键: 旋转视角',
      '鼠标滚轮: 缩放',
      '鼠标右键: 平移',
    ]);
  }

  private startRenderLoop(): void {
    this.runner.start((dt) => {
      this.stats.begin();
      this.update(dt);
      this.render();
      this.stats.end();
    });
  }

  private update(dt: number): void {
    this.orbit.update(dt);
  }

  private render(): void {
    const { encoder, passDescriptor } = this.runner.beginFrame();

    const renderPass = encoder.beginRenderPass(passDescriptor);

    if (this.pipeline) {
      renderPass.setPipeline(this.pipeline);
      renderPass.setBindGroup(0, this.createBindGroup());
      renderPass.setVertexBuffer(0, this.vertexBuffer!);
      renderPass.setIndexBuffer(this.indexBuffer!, MSpec.RHIIndexFormat.UINT16);
      renderPass.drawIndexed(36);
    }

    renderPass.end();
    this.runner.endFrame(encoder);
  }

  private createBindGroup(): MSpec.IRHIBindGroup {
    // 实现绑定组创建
    return this.runner.device.createBindGroup({
      layout: this.pipeline!.getBindGroupLayout(0),
      entries: []
    });
  }

  private reset(): void {
    this.orbit.reset();
  }

  private toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  public destroy(): void {
    this.stats.destroy();
    this.orbit.destroy();
    this.runner.destroy();
  }
}
```

### HTML模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demo名称 - RHI Demo</title>
  <link rel="stylesheet" href="../styles/demo.css">
</head>
<body>
  <div class="container">
    <canvas id="J-canvas"></canvas>
  </div>

  <div class="info-panel">
    <h3>🔺 Demo名称</h3>
    <p class="description">简洁的Demo描述...</p>
    <div class="tech-points">
      <h4>💡 技术要点</h4>
      <ul>
        <li>技术点1</li>
        <li>技术点2</li>
        <li>技术点3</li>
      </ul>
    </div>
  </div>

  <script type="module">
    import TemplateDemo from '../src/template.js';

    async function init() {
      try {
        const canvas = document.getElementById('J-canvas');
        const demo = new TemplateDemo(canvas);
        await demo.init();
      } catch (error) {
        console.error('Demo初始化失败:', error);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  </script>
</body>
</html>
```

## 🎨 UI设计规范

### 布局结构

```css
/* 容器布局 */
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.container {
  width: 100vw;
  height: 100vh;
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
}

#J-canvas {
  display: block;
  cursor: grab;
}

#J-canvas:active {
  cursor: grabbing;
}

/* 信息面板 */
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

.info-panel h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #4CAF50;
}

.info-panel .description {
  margin: 0 0 12px 0;
  line-height: 1.4;
  opacity: 0.9;
}

.info-panel h4 {
  margin: 12px 0 6px 0;
  font-size: 14px;
  color: #2196F3;
}

.info-panel ul {
  margin: 0;
  padding-left: 16px;
}

.info-panel li {
  margin: 4px 0;
  font-size: 12px;
  opacity: 0.8;
}
```

### 统一组件

#### 性能监控面板
```typescript
// 标准性能监控配置
const stats = new Stats({
  position: 'top-left',
  show: ['fps', 'ms', 'memory'],
  theme: 'dark'
});
```

#### 相机控制
```typescript
// 标准相机控制配置
const orbit = new OrbitController(canvas, {
  distance: 5,
  target: [0, 0, 0],
  enableDamping: true,
  dampingFactor: 0.05,
  enableZoom: true,
  enableRotate: true,
  enablePan: true,
  minDistance: 1,
  maxDistance: 100
});
```

## 📊 质量标准

### 性能要求

```typescript
// 性能基准
interface PerformanceBenchmark {
  targetFPS: 60;           // 目标帧率
  maxFrameTime: 16.67;     // 最大帧时间(ms)
  maxDrawCalls: 100;       // 最大绘制调用数
  maxMemoryUsage: 50;      // 最大内存使用(MB)
  maxGeometryVertices: 65536; // 最大顶点数
}

// 性能监控
class PerformanceMonitor {
  private benchmark: PerformanceBenchmark = {
    targetFPS: 60,
    maxFrameTime: 16.67,
    maxDrawCalls: 100,
    maxMemoryUsage: 50,
    maxGeometryVertices: 65536
  };

  public validatePerformance(metrics: any): ValidationResult {
    const results: ValidationResult = {
      passed: true,
      warnings: [],
      errors: []
    };

    if (metrics.fps < this.benchmark.targetFPS * 0.8) {
      results.errors.push(`FPS过低: ${metrics.fps} < ${this.benchmark.targetFPS * 0.8}`);
      results.passed = false;
    }

    if (metrics.drawCalls > this.benchmark.maxDrawCalls) {
      results.warnings.push(`绘制调用过多: ${metrics.drawCalls} > ${this.benchmark.maxDrawCalls}`);
    }

    return results;
  }
}
```

### 兼容性标准

```typescript
// 浏览器兼容性检查
class CompatibilityChecker {
  public static checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }

  public static checkWebGL2Support(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl2'));
    } catch (e) {
      return false;
    }
  }

  public static checkRequiredExtensions(extensions: string[]): boolean {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return false;

    return extensions.every(ext => gl.getExtension(ext));
  }
}
```

## 🧪 测试规范

### 单元测试

```typescript
// demo.test.ts
import TemplateDemo from '../src/template';
import { jest } from '@jest/globals';

describe('TemplateDemo', () => {
  let demo: TemplateDemo;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    // 创建模拟Canvas
    mockCanvas = document.createElement('canvas') as HTMLCanvasElement;
    mockCanvas.id = 'J-canvas';
    document.body.appendChild(mockCanvas);

    demo = new TemplateDemo(mockCanvas);
  });

  afterEach(() => {
    demo.destroy();
    document.body.removeChild(mockCanvas);
  });

  it('应该正确初始化', async () => {
    await expect(demo.init()).resolves.not.toThrow();
  });

  it('应该创建正确的几何体', () => {
    const geometry = demo['geometry'];
    expect(geometry).toBeDefined();
    expect(geometry.vertices).toBeInstanceOf(Float32Array);
    expect(geometry.indices).toBeInstanceOf(Uint16Array);
  });

  it('应该处理键盘事件', () => {
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    const destroySpy = jest.spyOn(demo, 'destroy');

    document.dispatchEvent(escapeEvent);

    expect(destroySpy).toHaveBeenCalled();
  });
});
```

### 集成测试

```typescript
// e2e.test.ts
import puppeteer from 'puppeteer';

describe('TemplateDemo E2E', () => {
  let browser: puppeteer.Browser;
  let page: puppeteer.Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('应该正确加载Demo', async () => {
    await page.goto('http://localhost:3001/demo/html/template.html');

    // 检查Canvas是否加载
    await page.waitForSelector('#J-canvas');

    // 检查是否没有错误
    const errors = await page.evaluate(() => {
      return (window as any).demoErrors || [];
    });

    expect(errors).toHaveLength(0);
  });

  it('应该保持良好的性能', async () => {
    await page.goto('http://localhost:3001/demo/html/template.html');
    await page.waitForSelector('#J-canvas');

    // 测量帧率
    const fps = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frameCount = 0;
        const startTime = performance.now();

        function measureFPS() {
          frameCount++;
          const elapsed = performance.now() - startTime;
          if (elapsed < 5000) { // 测量5秒
            requestAnimationFrame(measureFPS);
          } else {
            resolve(frameCount / (elapsed / 1000));
          }
        }

        measureFPS();
      });
    });

    expect(fps).toBeGreaterThan(30); // 至少30FPS
  });
});
```

## 📚 文档规范

### 代码注释

```typescript
/**
 * 创建立方体几何体
 *
 * @param options - 立方体配置选项
 * @param options.size - 立方体大小，默认1.0
 * @param options.segments - 每边的分段数，默认1
 * @returns 立方体几何体数据
 *
 * @example
 * ```typescript
 * const cube = GeometryGenerator.cube({
 *   size: 2.0,
 *   segments: 2
 * });
 * ```
 */
export function createCube(options: CubeOptions = {}): Geometry {
  // 实现逻辑...
}
```

### README文档

每个Demo目录应包含README.md：

```markdown
# Demo名称

## 概述
简短描述Demo的功能和目的。

## 技术要点
- 要点1
- 要点2
- 要点3

## 运行方式
```bash
# 开发模式
pnpm --filter @maxellabs/rhi dev

# 访问
http://localhost:3001/demo/html/demo-name.html
```

## 文件结构
```
demo-name/
├── demo-name.ts      # 主逻辑
├── demo-name.html    # 入口页面
└── README.md         # 说明文档
```

## 依赖
- @maxellabs/core
- @maxellabs/math

## 性能指标
- 目标FPS: 60
- 绘制调用: < 10
- 内存使用: < 10MB
```

## 🔍 代码审查清单

### 提交前检查

- [ ] 代码符合ESLint规则
- [ ] 所有函数都有TypeScript类型注解
- [ ] 包含必要的错误处理
- [ ] 资源正确释放（无内存泄漏）
- [ ] 性能在可接受范围内
- [ ] 文档注释完整
- [ ] 通过所有测试用例

### 功能检查

- [ ] MVP矩阵变换正确
- [ ] 相机控制流畅
- [ ] 性能监控正常
- [ ] 键盘/鼠标交互正常
- [ ] 全屏切换功能正常
- [ ] 资源加载错误处理

### 用户体验检查

- [ ] 加载时间合理（< 3秒）
- [ ] 帧率稳定（> 30FPS）
- [ ] 界面响应流畅
- [ ] 错误信息友好
- [ ] 帮助信息清晰

## 🚀 部署规范

### 构建配置

```typescript
// vite.config.ts
export default {
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'core': ['@maxellabs/core'],
          'math': ['@maxellabs/math'],
          'utils': ['./src/utils/index']
        }
      }
    }
  }
};
```

### 发布检查

```bash
# 运行完整测试套件
pnpm test

# 检查构建
pnpm build

# 运行性能基准测试
pnpm test:performance

# 验证所有Demo
pnpm test:demo -- --all
```

## 📖 相关文档

- [Demo开发概览](./overview.md)
- [工具库使用指南](./tools-library.md)
- [Demo目录和状态](./demo-catalog.md)
- [最佳实践指南](./best-practices.md)
## ⚠️ 禁止事项

### 关键约束
- 🚫 **避免硬编码路径**: 使用相对路径或配置文件
- 🚫 **忽略资源清理**: 确保所有资源得到正确释放
- 🚫 **缺少错误处理**: 提供清晰的错误信息和恢复机制

### 常见错误
- ❌ 忽略错误处理和异常情况
- ❌ 缺少必要的性能优化
- ❌ 不遵循项目的编码规范
- ❌ 忽略文档更新和维护

### 最佳实践提醒
- ✅ 始终考虑性能影响
- ✅ 提供清晰的错误信息
- ✅ 保持代码的可维护性
- ✅ 定期更新文档

---

# Demo开发规范

## 概述

本规范定义了RHI Demo系统的开发标准、编码规范和最佳实践，确保所有Demo的一致性、可维护性和用户体验。

## 🎯 核心原则

### 一致性原则
- **统一的API使用**: 所有Demo使用相同的工具库API
- **标准的UI布局**: 统一的信息面板和控制布局
- **一致的交互模式**: 标准化的键盘/鼠标操作

### 可维护性原则
- **模块化设计**: 清晰的功能模块分离
- **完善的文档**: 详细的代码注释和说明
- **测试覆盖**: 自动化测试验证

### 性能原则
- **资源管理**: 正确的资源生命周期管理
- **内存安全**: 避免内存泄漏
- **性能监控**: 集成性能分析工具

## 📝 编码规范

### TypeScript标准

#### 1. 命名约定

```typescript
// 类名：PascalCase
export class RotatingCubeDemo {
  private runner: DemoRunner;
  private geometry: Geometry;
}

// 变量名：camelCase
const vertexBuffer = runner.createVertexBuffer(vertices, 'Vertices');
const transformMatrix = new MMath.Matrix4();

// 常量名：UPPER_SNAKE_CASE
const MAX_INSTANCES = 1000;
const DEFAULT_CLEAR_COLOR = [0.1, 0.1, 0.1, 1.0];

// 接口名：PascalCase，以I开头
interface DemoConfig {
  name: string;
  clearColor: number[];
}
```

#### 2. 文件结构

```typescript
// demo-template.ts
import { MSpec } from '@maxellabs/core';
import {
  DemoRunner,
  GeometryGenerator,
  OrbitController,
  Stats
} from './utils';

/**
 * Demo名称 - 简短描述
 *
 * 技术要点：
 * - 要点1
 * - 要点2
 * - 要点3
 */
export default class TemplateDemo {
  private runner: DemoRunner;
  private orbit: OrbitController;
  private stats: Stats;

  // 资源引用
  private pipeline?: MSpec.IRHIRenderPipeline;
  private vertexBuffer?: MSpec.IRHIBuffer;
  private indexBuffer?: MSpec.IRHIBuffer;
  private uniformBuffer?: MSpec.IRHIBuffer;

  constructor(canvas: HTMLCanvasElement) {
    this.runner = new DemoRunner({
      canvasId: 'J-canvas',
      name: 'Template Demo',
      clearColor: [0.1, 0.1, 0.1, 1.0],
    });
  }

  public async init(): Promise<void> {
    await this.runner.init();
    await this.setup();
    this.startRenderLoop();
  }

  private async setup(): Promise<void> {
    this.setupResources();
    this.setupPipeline();
    this.setupControls();
  }

  private setupResources(): void {
    // 创建几何体
    const geometry = GeometryGenerator.cube({ size: 1.0 });

    this.vertexBuffer = this.runner.track(
      this.runner.device.createBuffer({
        size: geometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        initialData: geometry.vertices
      })
    );

    this.indexBuffer = this.runner.track(
      this.runner.device.createBuffer({
        size: geometry.indices.byteLength,
        usage: MSpec.RHIBufferUsage.INDEX,
        initialData: geometry.indices
      })
    );

    this.uniformBuffer = this.runner.track(
      this.runner.device.createBuffer({
        size: 192, // 3个mat4 * 64字节
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic'
      })
    );
  }

  private setupPipeline(): void {
    // 实现着色器和管线创建
  }

  private setupControls(): void {
    this.orbit = new OrbitController(this.runner.canvas, {
      distance: 5,
      target: [0, 0, 0],
      enableDamping: true,
    });

    this.stats = new Stats({ position: 'top-left' });

    // 键盘事件
    this.runner.onKey('Escape', () => this.destroy());
    this.runner.onKey('F11', () => this.toggleFullscreen());
    this.runner.onKey('R', () => this.reset());

    // 显示帮助信息
    DemoRunner.showHelp([
      'ESC: 退出Demo',
      'F11: 切换全屏',
      'R: 重置场景',
      '鼠标左键: 旋转视角',
      '鼠标滚轮: 缩放',
      '鼠标右键: 平移',
    ]);
  }

  private startRenderLoop(): void {
    this.runner.start((dt) => {
      this.stats.begin();
      this.update(dt);
      this.render();
      this.stats.end();
    });
  }

  private update(dt: number): void {
    this.orbit.update(dt);
  }

  private render(): void {
    const { encoder, passDescriptor } = this.runner.beginFrame();

    const renderPass = encoder.beginRenderPass(passDescriptor);

    if (this.pipeline) {
      renderPass.setPipeline(this.pipeline);
      renderPass.setBindGroup(0, this.createBindGroup());
      renderPass.setVertexBuffer(0, this.vertexBuffer!);
      renderPass.setIndexBuffer(this.indexBuffer!, MSpec.RHIIndexFormat.UINT16);
      renderPass.drawIndexed(36);
    }

    renderPass.end();
    this.runner.endFrame(encoder);
  }

  private createBindGroup(): MSpec.IRHIBindGroup {
    // 实现绑定组创建
    return this.runner.device.createBindGroup({
      layout: this.pipeline!.getBindGroupLayout(0),
      entries: []
    });
  }

  private reset(): void {
    this.orbit.reset();
  }

  private toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  public destroy(): void {
    this.stats.destroy();
    this.orbit.destroy();
    this.runner.destroy();
  }
}
```

### HTML模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demo名称 - RHI Demo</title>
  <link rel="stylesheet" href="../styles/demo.css">
</head>
<body>
  <div class="container">
    <canvas id="J-canvas"></canvas>
  </div>

  <div class="info-panel">
    <h3>🔺 Demo名称</h3>
    <p class="description">简洁的Demo描述...</p>
    <div class="tech-points">
      <h4>💡 技术要点</h4>
      <ul>
        <li>技术点1</li>
        <li>技术点2</li>
        <li>技术点3</li>
      </ul>
    </div>
  </div>

  <script type="module">
    import TemplateDemo from '../src/template.js';

    async function init() {
      try {
        const canvas = document.getElementById('J-canvas');
        const demo = new TemplateDemo(canvas);
        await demo.init();
      } catch (error) {
        console.error('Demo初始化失败:', error);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  </script>
</body>
</html>
```

## 🎨 UI设计规范

### 布局结构

```css
/* 容器布局 */
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.container {
  width: 100vw;
  height: 100vh;
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
}

#J-canvas {
  display: block;
  cursor: grab;
}

#J-canvas:active {
  cursor: grabbing;
}

/* 信息面板 */
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

.info-panel h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #4CAF50;
}

.info-panel .description {
  margin: 0 0 12px 0;
  line-height: 1.4;
  opacity: 0.9;
}

.info-panel h4 {
  margin: 12px 0 6px 0;
  font-size: 14px;
  color: #2196F3;
}

.info-panel ul {
  margin: 0;
  padding-left: 16px;
}

.info-panel li {
  margin: 4px 0;
  font-size: 12px;
  opacity: 0.8;
}
```

### 统一组件

#### 性能监控面板
```typescript
// 标准性能监控配置
const stats = new Stats({
  position: 'top-left',
  show: ['fps', 'ms', 'memory'],
  theme: 'dark'
});
```

#### 相机控制
```typescript
// 标准相机控制配置
const orbit = new OrbitController(canvas, {
  distance: 5,
  target: [0, 0, 0],
  enableDamping: true,
  dampingFactor: 0.05,
  enableZoom: true,
  enableRotate: true,
  enablePan: true,
  minDistance: 1,
  maxDistance: 100
});
```

## 📊 质量标准

### 性能要求

```typescript
// 性能基准
interface PerformanceBenchmark {
  targetFPS: 60;           // 目标帧率
  maxFrameTime: 16.67;     // 最大帧时间(ms)
  maxDrawCalls: 100;       // 最大绘制调用数
  maxMemoryUsage: 50;      // 最大内存使用(MB)
  maxGeometryVertices: 65536; // 最大顶点数
}

// 性能监控
class PerformanceMonitor {
  private benchmark: PerformanceBenchmark = {
    targetFPS: 60,
    maxFrameTime: 16.67,
    maxDrawCalls: 100,
    maxMemoryUsage: 50,
    maxGeometryVertices: 65536
  };

  public validatePerformance(metrics: any): ValidationResult {
    const results: ValidationResult = {
      passed: true,
      warnings: [],
      errors: []
    };

    if (metrics.fps < this.benchmark.targetFPS * 0.8) {
      results.errors.push(`FPS过低: ${metrics.fps} < ${this.benchmark.targetFPS * 0.8}`);
      results.passed = false;
    }

    if (metrics.drawCalls > this.benchmark.maxDrawCalls) {
      results.warnings.push(`绘制调用过多: ${metrics.drawCalls} > ${this.benchmark.maxDrawCalls}`);
    }

    return results;
  }
}
```

### 兼容性标准

```typescript
// 浏览器兼容性检查
class CompatibilityChecker {
  public static checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }

  public static checkWebGL2Support(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl2'));
    } catch (e) {
      return false;
    }
  }

  public static checkRequiredExtensions(extensions: string[]): boolean {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return false;

    return extensions.every(ext => gl.getExtension(ext));
  }
}
```

## 🧪 测试规范

### 单元测试

```typescript
// demo.test.ts
import TemplateDemo from '../src/template';
import { jest } from '@jest/globals';

describe('TemplateDemo', () => {
  let demo: TemplateDemo;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    // 创建模拟Canvas
    mockCanvas = document.createElement('canvas') as HTMLCanvasElement;
    mockCanvas.id = 'J-canvas';
    document.body.appendChild(mockCanvas);

    demo = new TemplateDemo(mockCanvas);
  });

  afterEach(() => {
    demo.destroy();
    document.body.removeChild(mockCanvas);
  });

  it('应该正确初始化', async () => {
    await expect(demo.init()).resolves.not.toThrow();
  });

  it('应该创建正确的几何体', () => {
    const geometry = demo['geometry'];
    expect(geometry).toBeDefined();
    expect(geometry.vertices).toBeInstanceOf(Float32Array);
    expect(geometry.indices).toBeInstanceOf(Uint16Array);
  });

  it('应该处理键盘事件', () => {
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    const destroySpy = jest.spyOn(demo, 'destroy');

    document.dispatchEvent(escapeEvent);

    expect(destroySpy).toHaveBeenCalled();
  });
});
```

### 集成测试

```typescript
// e2e.test.ts
import puppeteer from 'puppeteer';

describe('TemplateDemo E2E', () => {
  let browser: puppeteer.Browser;
  let page: puppeteer.Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('应该正确加载Demo', async () => {
    await page.goto('http://localhost:3001/demo/html/template.html');

    // 检查Canvas是否加载
    await page.waitForSelector('#J-canvas');

    // 检查是否没有错误
    const errors = await page.evaluate(() => {
      return (window as any).demoErrors || [];
    });

    expect(errors).toHaveLength(0);
  });

  it('应该保持良好的性能', async () => {
    await page.goto('http://localhost:3001/demo/html/template.html');
    await page.waitForSelector('#J-canvas');

    // 测量帧率
    const fps = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frameCount = 0;
        const startTime = performance.now();

        function measureFPS() {
          frameCount++;
          const elapsed = performance.now() - startTime;
          if (elapsed < 5000) { // 测量5秒
            requestAnimationFrame(measureFPS);
          } else {
            resolve(frameCount / (elapsed / 1000));
          }
        }

        measureFPS();
      });
    });

    expect(fps).toBeGreaterThan(30); // 至少30FPS
  });
});
```

## 📚 文档规范

### 代码注释

```typescript
/**
 * 创建立方体几何体
 *
 * @param options - 立方体配置选项
 * @param options.size - 立方体大小，默认1.0
 * @param options.segments - 每边的分段数，默认1
 * @returns 立方体几何体数据
 *
 * @example
 * ```typescript
 * const cube = GeometryGenerator.cube({
 *   size: 2.0,
 *   segments: 2
 * });
 * ```
 */
export function createCube(options: CubeOptions = {}): Geometry {
  // 实现逻辑...
}
```

### README文档

每个Demo目录应包含README.md：

```markdown
# Demo名称

## 概述
简短描述Demo的功能和目的。

## 技术要点
- 要点1
- 要点2
- 要点3

## 运行方式
```bash
# 开发模式
pnpm --filter @maxellabs/rhi dev

# 访问
http://localhost:3001/demo/html/demo-name.html
```

## 文件结构
```
demo-name/
├── demo-name.ts      # 主逻辑
├── demo-name.html    # 入口页面
└── README.md         # 说明文档
```

## 依赖
- @maxellabs/core
- @maxellabs/math

## 性能指标
- 目标FPS: 60
- 绘制调用: < 10
- 内存使用: < 10MB
```

## 🔍 代码审查清单

### 提交前检查

- [ ] 代码符合ESLint规则
- [ ] 所有函数都有TypeScript类型注解
- [ ] 包含必要的错误处理
- [ ] 资源正确释放（无内存泄漏）
- [ ] 性能在可接受范围内
- [ ] 文档注释完整
- [ ] 通过所有测试用例

### 功能检查

- [ ] MVP矩阵变换正确
- [ ] 相机控制流畅
- [ ] 性能监控正常
- [ ] 键盘/鼠标交互正常
- [ ] 全屏切换功能正常
- [ ] 资源加载错误处理

### 用户体验检查

- [ ] 加载时间合理（< 3秒）
- [ ] 帧率稳定（> 30FPS）
- [ ] 界面响应流畅
- [ ] 错误信息友好
- [ ] 帮助信息清晰

## 🚀 部署规范

### 构建配置

```typescript
// vite.config.ts
export default {
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'core': ['@maxellabs/core'],
          'math': ['@maxellabs/math'],
          'utils': ['./src/utils/index']
        }
      }
    }
  }
};
```

### 发布检查

```bash
# 运行完整测试套件
pnpm test

# 检查构建
pnpm build

# 运行性能基准测试
pnpm test:performance

# 验证所有Demo
pnpm test:demo -- --all
```

## 📖 相关文档

- [Demo开发概览](./overview.md)
- [工具库使用指南](./tools-library.md)
- [Demo目录和状态](./demo-catalog.md)
- [最佳实践指南](./best-practices.md)
## 📚 Few-Shot示例

### 问题-解决方案对
**问题**: Demo无法在特定设备上运行
**解决方案**: 添加设备兼容性检查和降级方案
```typescript
if (!device.supportsFeature('requiredFeature')) {
  // 使用降级渲染
  renderer.useFallbackMode();
}
```

**问题**: 资源加载失败导致Demo崩溃
**解决方案**: 实现资源加载重试机制
```typescript
try {
  await resourceLoader.loadWithRetry(texturePath, 3);
} catch (error) {
  console.warn('使用默认纹理:', error);
  texture = defaultTexture;
}
```

### 学习要点
- 理解常见问题和解决方案
- 掌握最佳实践和避免陷阱
- 培养问题解决思维

---

# Demo开发规范

## 概述

本规范定义了RHI Demo系统的开发标准、编码规范和最佳实践，确保所有Demo的一致性、可维护性和用户体验。

## 🎯 核心原则

### 一致性原则
- **统一的API使用**: 所有Demo使用相同的工具库API
- **标准的UI布局**: 统一的信息面板和控制布局
- **一致的交互模式**: 标准化的键盘/鼠标操作

### 可维护性原则
- **模块化设计**: 清晰的功能模块分离
- **完善的文档**: 详细的代码注释和说明
- **测试覆盖**: 自动化测试验证

### 性能原则
- **资源管理**: 正确的资源生命周期管理
- **内存安全**: 避免内存泄漏
- **性能监控**: 集成性能分析工具

## 📝 编码规范

### TypeScript标准

#### 1. 命名约定

```typescript
// 类名：PascalCase
export class RotatingCubeDemo {
  private runner: DemoRunner;
  private geometry: Geometry;
}

// 变量名：camelCase
const vertexBuffer = runner.createVertexBuffer(vertices, 'Vertices');
const transformMatrix = new MMath.Matrix4();

// 常量名：UPPER_SNAKE_CASE
const MAX_INSTANCES = 1000;
const DEFAULT_CLEAR_COLOR = [0.1, 0.1, 0.1, 1.0];

// 接口名：PascalCase，以I开头
interface DemoConfig {
  name: string;
  clearColor: number[];
}
```

#### 2. 文件结构

```typescript
// demo-template.ts
import { MSpec } from '@maxellabs/core';
import {
  DemoRunner,
  GeometryGenerator,
  OrbitController,
  Stats
} from './utils';

/**
 * Demo名称 - 简短描述
 *
 * 技术要点：
 * - 要点1
 * - 要点2
 * - 要点3
 */
export default class TemplateDemo {
  private runner: DemoRunner;
  private orbit: OrbitController;
  private stats: Stats;

  // 资源引用
  private pipeline?: MSpec.IRHIRenderPipeline;
  private vertexBuffer?: MSpec.IRHIBuffer;
  private indexBuffer?: MSpec.IRHIBuffer;
  private uniformBuffer?: MSpec.IRHIBuffer;

  constructor(canvas: HTMLCanvasElement) {
    this.runner = new DemoRunner({
      canvasId: 'J-canvas',
      name: 'Template Demo',
      clearColor: [0.1, 0.1, 0.1, 1.0],
    });
  }

  public async init(): Promise<void> {
    await this.runner.init();
    await this.setup();
    this.startRenderLoop();
  }

  private async setup(): Promise<void> {
    this.setupResources();
    this.setupPipeline();
    this.setupControls();
  }

  private setupResources(): void {
    // 创建几何体
    const geometry = GeometryGenerator.cube({ size: 1.0 });

    this.vertexBuffer = this.runner.track(
      this.runner.device.createBuffer({
        size: geometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        initialData: geometry.vertices
      })
    );

    this.indexBuffer = this.runner.track(
      this.runner.device.createBuffer({
        size: geometry.indices.byteLength,
        usage: MSpec.RHIBufferUsage.INDEX,
        initialData: geometry.indices
      })
    );

    this.uniformBuffer = this.runner.track(
      this.runner.device.createBuffer({
        size: 192, // 3个mat4 * 64字节
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic'
      })
    );
  }

  private setupPipeline(): void {
    // 实现着色器和管线创建
  }

  private setupControls(): void {
    this.orbit = new OrbitController(this.runner.canvas, {
      distance: 5,
      target: [0, 0, 0],
      enableDamping: true,
    });

    this.stats = new Stats({ position: 'top-left' });

    // 键盘事件
    this.runner.onKey('Escape', () => this.destroy());
    this.runner.onKey('F11', () => this.toggleFullscreen());
    this.runner.onKey('R', () => this.reset());

    // 显示帮助信息
    DemoRunner.showHelp([
      'ESC: 退出Demo',
      'F11: 切换全屏',
      'R: 重置场景',
      '鼠标左键: 旋转视角',
      '鼠标滚轮: 缩放',
      '鼠标右键: 平移',
    ]);
  }

  private startRenderLoop(): void {
    this.runner.start((dt) => {
      this.stats.begin();
      this.update(dt);
      this.render();
      this.stats.end();
    });
  }

  private update(dt: number): void {
    this.orbit.update(dt);
  }

  private render(): void {
    const { encoder, passDescriptor } = this.runner.beginFrame();

    const renderPass = encoder.beginRenderPass(passDescriptor);

    if (this.pipeline) {
      renderPass.setPipeline(this.pipeline);
      renderPass.setBindGroup(0, this.createBindGroup());
      renderPass.setVertexBuffer(0, this.vertexBuffer!);
      renderPass.setIndexBuffer(this.indexBuffer!, MSpec.RHIIndexFormat.UINT16);
      renderPass.drawIndexed(36);
    }

    renderPass.end();
    this.runner.endFrame(encoder);
  }

  private createBindGroup(): MSpec.IRHIBindGroup {
    // 实现绑定组创建
    return this.runner.device.createBindGroup({
      layout: this.pipeline!.getBindGroupLayout(0),
      entries: []
    });
  }

  private reset(): void {
    this.orbit.reset();
  }

  private toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  public destroy(): void {
    this.stats.destroy();
    this.orbit.destroy();
    this.runner.destroy();
  }
}
```

### HTML模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demo名称 - RHI Demo</title>
  <link rel="stylesheet" href="../styles/demo.css">
</head>
<body>
  <div class="container">
    <canvas id="J-canvas"></canvas>
  </div>

  <div class="info-panel">
    <h3>🔺 Demo名称</h3>
    <p class="description">简洁的Demo描述...</p>
    <div class="tech-points">
      <h4>💡 技术要点</h4>
      <ul>
        <li>技术点1</li>
        <li>技术点2</li>
        <li>技术点3</li>
      </ul>
    </div>
  </div>

  <script type="module">
    import TemplateDemo from '../src/template.js';

    async function init() {
      try {
        const canvas = document.getElementById('J-canvas');
        const demo = new TemplateDemo(canvas);
        await demo.init();
      } catch (error) {
        console.error('Demo初始化失败:', error);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  </script>
</body>
</html>
```

## 🎨 UI设计规范

### 布局结构

```css
/* 容器布局 */
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.container {
  width: 100vw;
  height: 100vh;
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
}

#J-canvas {
  display: block;
  cursor: grab;
}

#J-canvas:active {
  cursor: grabbing;
}

/* 信息面板 */
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

.info-panel h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #4CAF50;
}

.info-panel .description {
  margin: 0 0 12px 0;
  line-height: 1.4;
  opacity: 0.9;
}

.info-panel h4 {
  margin: 12px 0 6px 0;
  font-size: 14px;
  color: #2196F3;
}

.info-panel ul {
  margin: 0;
  padding-left: 16px;
}

.info-panel li {
  margin: 4px 0;
  font-size: 12px;
  opacity: 0.8;
}
```

### 统一组件

#### 性能监控面板
```typescript
// 标准性能监控配置
const stats = new Stats({
  position: 'top-left',
  show: ['fps', 'ms', 'memory'],
  theme: 'dark'
});
```

#### 相机控制
```typescript
// 标准相机控制配置
const orbit = new OrbitController(canvas, {
  distance: 5,
  target: [0, 0, 0],
  enableDamping: true,
  dampingFactor: 0.05,
  enableZoom: true,
  enableRotate: true,
  enablePan: true,
  minDistance: 1,
  maxDistance: 100
});
```

## 📊 质量标准

### 性能要求

```typescript
// 性能基准
interface PerformanceBenchmark {
  targetFPS: 60;           // 目标帧率
  maxFrameTime: 16.67;     // 最大帧时间(ms)
  maxDrawCalls: 100;       // 最大绘制调用数
  maxMemoryUsage: 50;      // 最大内存使用(MB)
  maxGeometryVertices: 65536; // 最大顶点数
}

// 性能监控
class PerformanceMonitor {
  private benchmark: PerformanceBenchmark = {
    targetFPS: 60,
    maxFrameTime: 16.67,
    maxDrawCalls: 100,
    maxMemoryUsage: 50,
    maxGeometryVertices: 65536
  };

  public validatePerformance(metrics: any): ValidationResult {
    const results: ValidationResult = {
      passed: true,
      warnings: [],
      errors: []
    };

    if (metrics.fps < this.benchmark.targetFPS * 0.8) {
      results.errors.push(`FPS过低: ${metrics.fps} < ${this.benchmark.targetFPS * 0.8}`);
      results.passed = false;
    }

    if (metrics.drawCalls > this.benchmark.maxDrawCalls) {
      results.warnings.push(`绘制调用过多: ${metrics.drawCalls} > ${this.benchmark.maxDrawCalls}`);
    }

    return results;
  }
}
```

### 兼容性标准

```typescript
// 浏览器兼容性检查
class CompatibilityChecker {
  public static checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }

  public static checkWebGL2Support(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl2'));
    } catch (e) {
      return false;
    }
  }

  public static checkRequiredExtensions(extensions: string[]): boolean {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return false;

    return extensions.every(ext => gl.getExtension(ext));
  }
}
```

## 🧪 测试规范

### 单元测试

```typescript
// demo.test.ts
import TemplateDemo from '../src/template';
import { jest } from '@jest/globals';

describe('TemplateDemo', () => {
  let demo: TemplateDemo;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    // 创建模拟Canvas
    mockCanvas = document.createElement('canvas') as HTMLCanvasElement;
    mockCanvas.id = 'J-canvas';
    document.body.appendChild(mockCanvas);

    demo = new TemplateDemo(mockCanvas);
  });

  afterEach(() => {
    demo.destroy();
    document.body.removeChild(mockCanvas);
  });

  it('应该正确初始化', async () => {
    await expect(demo.init()).resolves.not.toThrow();
  });

  it('应该创建正确的几何体', () => {
    const geometry = demo['geometry'];
    expect(geometry).toBeDefined();
    expect(geometry.vertices).toBeInstanceOf(Float32Array);
    expect(geometry.indices).toBeInstanceOf(Uint16Array);
  });

  it('应该处理键盘事件', () => {
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    const destroySpy = jest.spyOn(demo, 'destroy');

    document.dispatchEvent(escapeEvent);

    expect(destroySpy).toHaveBeenCalled();
  });
});
```

### 集成测试

```typescript
// e2e.test.ts
import puppeteer from 'puppeteer';

describe('TemplateDemo E2E', () => {
  let browser: puppeteer.Browser;
  let page: puppeteer.Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('应该正确加载Demo', async () => {
    await page.goto('http://localhost:3001/demo/html/template.html');

    // 检查Canvas是否加载
    await page.waitForSelector('#J-canvas');

    // 检查是否没有错误
    const errors = await page.evaluate(() => {
      return (window as any).demoErrors || [];
    });

    expect(errors).toHaveLength(0);
  });

  it('应该保持良好的性能', async () => {
    await page.goto('http://localhost:3001/demo/html/template.html');
    await page.waitForSelector('#J-canvas');

    // 测量帧率
    const fps = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frameCount = 0;
        const startTime = performance.now();

        function measureFPS() {
          frameCount++;
          const elapsed = performance.now() - startTime;
          if (elapsed < 5000) { // 测量5秒
            requestAnimationFrame(measureFPS);
          } else {
            resolve(frameCount / (elapsed / 1000));
          }
        }

        measureFPS();
      });
    });

    expect(fps).toBeGreaterThan(30); // 至少30FPS
  });
});
```

## 📚 文档规范

### 代码注释

```typescript
/**
 * 创建立方体几何体
 *
 * @param options - 立方体配置选项
 * @param options.size - 立方体大小，默认1.0
 * @param options.segments - 每边的分段数，默认1
 * @returns 立方体几何体数据
 *
 * @example
 * ```typescript
 * const cube = GeometryGenerator.cube({
 *   size: 2.0,
 *   segments: 2
 * });
 * ```
 */
export function createCube(options: CubeOptions = {}): Geometry {
  // 实现逻辑...
}
```

### README文档

每个Demo目录应包含README.md：

```markdown
# Demo名称

## 概述
简短描述Demo的功能和目的。

## 技术要点
- 要点1
- 要点2
- 要点3

## 运行方式
```bash
# 开发模式
pnpm --filter @maxellabs/rhi dev

# 访问
http://localhost:3001/demo/html/demo-name.html
```

## 文件结构
```
demo-name/
├── demo-name.ts      # 主逻辑
├── demo-name.html    # 入口页面
└── README.md         # 说明文档
```

## 依赖
- @maxellabs/core
- @maxellabs/math

## 性能指标
- 目标FPS: 60
- 绘制调用: < 10
- 内存使用: < 10MB
```

## 🔍 代码审查清单

### 提交前检查

- [ ] 代码符合ESLint规则
- [ ] 所有函数都有TypeScript类型注解
- [ ] 包含必要的错误处理
- [ ] 资源正确释放（无内存泄漏）
- [ ] 性能在可接受范围内
- [ ] 文档注释完整
- [ ] 通过所有测试用例

### 功能检查

- [ ] MVP矩阵变换正确
- [ ] 相机控制流畅
- [ ] 性能监控正常
- [ ] 键盘/鼠标交互正常
- [ ] 全屏切换功能正常
- [ ] 资源加载错误处理

### 用户体验检查

- [ ] 加载时间合理（< 3秒）
- [ ] 帧率稳定（> 30FPS）
- [ ] 界面响应流畅
- [ ] 错误信息友好
- [ ] 帮助信息清晰

## 🚀 部署规范

### 构建配置

```typescript
// vite.config.ts
export default {
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'core': ['@maxellabs/core'],
          'math': ['@maxellabs/math'],
          'utils': ['./src/utils/index']
        }
      }
    }
  }
};
```

### 发布检查

```bash
# 运行完整测试套件
pnpm test

# 检查构建
pnpm build

# 运行性能基准测试
pnpm test:performance

# 验证所有Demo
pnpm test:demo -- --all
```

## 📖 相关文档

- [Demo开发概览](./overview.md)
- [工具库使用指南](./tools-library.md)
- [Demo目录和状态](./demo-catalog.md)
- [最佳实践指南](./best-practices.md)