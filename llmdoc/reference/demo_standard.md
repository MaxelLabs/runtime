---
id: "reference-rhi-demo-standard"
type: "reference"
title: "RHI Demo Creation Standard"
description: "Constitutional rules for creating RHI demos with DemoRunner lifecycle, resource management, and render patterns"
tags: ["rhi", "demo", "lifecycle", "resource-management", "render-loop", "constitution"]
related_ids: ["reference-rhi-geometry-generator", "reference-orbit-controller", "reference-post-process-manager"]
---

## 🔌 Core Interfaces

### Demo Lifecycle States
```typescript
type DemoState = "UNINITIALIZED" | "INITIALIZED" | "RUNNING" | "PAUSED" | "DESTROYED";

interface DemoRunner {
  state: DemoState;
  canvas: HTMLCanvasElement;

  // Lifecycle
  init(): Promise<void>;
  start(): void;
  pause(): void;
  destroy(): void;

  // Resource Management
  track<T extends { destroy(): void }>(resource: T): T;

  // Render Loop
  beginFrame(): boolean;
  endFrame(): void;

  // Events
  on(event: "keydown", handler: (e: KeyboardEvent) => void): void;
}
```

### Resource Interface
```typescript
interface TrackableResource {
  destroy(): void;
  isDestroyed?: boolean;
}
```

### Geometry Creation Pattern
```typescript
interface GeometryDescriptor {
  type: "triangle" | "cube" | "sphere" | "plane";
  attributes: {
    position?: Float32Array;
    normal?: Float32Array;
    uv?: Float32Array;
    indices?: Uint16Array;
  };
  material?: MaterialConfig;
}
```

### Utility Integration
```typescript
interface OrbitController {
  update(): void;
  destroy(): void;
}

interface Stats {
  begin(): void;
  end(): void;
  destroy(): void;
}

interface GUI {
  add(params: Record<string, any>, key: string): void;
  destroy(): void;
}
```

---

## 📜 Constitutional Rules

### 1. Resource Management
**ALL resources MUST be tracked via runner.track()**
```typescript
// ✅ CORRECT
const buffer = runner.track(device.createBuffer(...));
const texture = runner.track(loader.load('image.png'));

// ❌ WRONG
const buffer = device.createBuffer(...); // Memory leak
```

**Automatic cleanup via track()**
```typescript
// No manual cleanup needed
// runner.destroy() automatically calls:
// buffer.destroy(), texture.destroy(), etc.
```

**Uniform buffers MUST be tracked**
```typescript
const uniformBuffer = runner.track(device.createBuffer({
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  size: 64,
}));
```

### 2. Lifecycle State Machine
**State transitions MUST follow the lifecycle**
```typescript
UNINITIALIZED → init() → INITIALIZED
INITIALIZED → start() → RUNNING
RUNNING → pause() → PAUSED
PAUSED → start() → RUNNING
ANY → destroy() → DESTROYED
```

**Initialization sequence is MANDATORY**
```typescript
async function demo(runner: DemoRunner) {
  // 1. Initialize
  await runner.init();

  // 2. Create resources (tracked)
  const geometry = runner.track(GeometryGenerator.cube());
  const pipeline = runner.track(device.createRenderPipeline(...));

  // 3. Setup utilities
  const controller = runner.track(new OrbitController(runner.canvas));
  const stats = runner.track(new Stats());

  // 4. Start loop
  runner.start();

  // 5. Handle cleanup automatically
}
```

### 3. Render Loop Pattern
**MUST use beginFrame/endFrame**
```typescript
runner.on("frame", () => {
  if (!runner.beginFrame()) return; // Handle context loss

  // Render commands here
  const commandEncoder = device.createCommandEncoder();
  // ... encode commands

  device.queue.submit([commandEncoder.finish()]);

  runner.endFrame();
});
```

**No synchronous resource creation in render loop**
```typescript
// ❌ WRONG - Performance violation
runner.on("frame", () => {
  const texture = device.createTexture(...); // SLOW!
  // ...
});

// ✅ CORRECT
const texture = runner.track(device.createTexture(...)); // Created once
runner.on("frame", () => {
  // Use pre-created texture
});
```

### 4. Canvas Requirements
**Canvas ID MUST be 'J-canvas'**
```html
<canvas id="J-canvas"></canvas>
```

**Canvas configuration**
```typescript
const canvas = document.getElementById('J-canvas') as HTMLCanvasElement;
canvas.width = 800;
canvas.height = 600;
```

### 5. Event Handling
**ALL demos MUST handle Escape key for destroy**
```typescript
runner.on("keydown", (e) => {
  if (e.key === "Escape") {
    runner.destroy();
  }
});
```

**Handle context loss**
```typescript
canvas.addEventListener("webglcontextlost", (e) => {
  e.preventDefault();
  runner.destroy();
});
```

### 6. Geometry Creation
**MUST use GeometryGenerator**
```typescript
// ✅ CORRECT
const cube = runner.track(GeometryGenerator.cube({
  size: 1.0,
  segments: 1,
}));

const triangle = runner.track(GeometryGenerator.triangle({
  vertices: [0, 0, 0, 1, 0, 0, 0, 1, 0],
}));

// ❌ WRONG - Manual geometry creation
const buffer = device.createBuffer({ /* manual data */ }); // Bypasses standard
```

### 7. Utility Integration Patterns
**OrbitController usage**
```typescript
const controller = runner.track(new OrbitController(runner.canvas));

runner.on("frame", () => {
  controller.update(); // Update before render
  // ... render
});
```

**Stats usage**
```typescript
const stats = runner.track(new Stats());

runner.on("frame", () => {
  stats.begin();
  // ... render
  stats.end();
});
```

**GUI usage**
```typescript
const gui = runner.track(new GUI());
const params = { rotationSpeed: 0.01 };

gui.add(params, "rotationSpeed");
```

### 8. Post-Processing
**PostProcessManager must be tracked**
```typescript
const postProcess = runner.track(new PostProcessManager(device, canvas));

// Setup passes
postProcess.addPass(bloomPass);
postProcess.addPass(fxaaPass);

// In render loop
runner.on("frame", () => {
  if (!runner.beginFrame()) return;

  // Render to texture
  postProcess.beginPass();
  // ... render scene
  postProcess.endPass();

  // Apply post-processing
  postProcess.render();

  runner.endFrame();
});
```

### 9. Texture Loading
**TextureLoader must be tracked**
```typescript
const loader = runner.track(new TextureLoader(device));

// Load textures
const texture = await loader.load("texture.png");
const cubemap = await loader.loadCubemap([
  "px.png", "nx.png",
  "py.png", "ny.png",
  "pz.png", "nz.png"
]);

// Use in shader
const uniformBuffer = runner.track(device.createBuffer({
  size: 64,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
}));

device.queue.writeBuffer(uniformBuffer, 0, texture);
```

### 10. Error Handling
**All resource creation MUST handle errors**
```typescript
try {
  const pipeline = runner.track(device.createRenderPipeline({
    layout: "auto",
    vertex: { module, entryPoint: "vs_main" },
    fragment: { module, entryPoint: "fs_main", targets: [{ format }] },
    primitive: { topology: "triangle-list" },
  }));
} catch (error) {
  console.error("Pipeline creation failed:", error);
  runner.destroy();
  return;
}
```

---

## 🚫 Forbidden Patterns

### Absolute Prohibitions

1. **NO manual resource cleanup**
   ```typescript
   // ❌ NEVER
   buffer.destroy(); // Use runner.track() instead
   texture.destroy(); // Automatic cleanup
   ```

2. **NO state transitions outside lifecycle**
   ```typescript
   // ❌ NEVER
   runner.state = "RUNNING"; // Must use runner.start()
   ```

3. **NO render loop without beginFrame/endFrame**
   ```typescript
   // ❌ NEVER
   function render() {
     // ... render without beginFrame
   }
   ```

4. **NO canvas with wrong ID**
   ```typescript
   // ❌ NEVER
   <canvas id="my-canvas"></canvas> // Must be "J-canvas"
   ```

5. **NO missing Escape handler**
   ```typescript
   // ❌ NEVER
   // No keyboard handler for Escape
   ```

6. **NO geometry creation without GeometryGenerator**
   ```typescript
   // ❌ NEVER
   const buffer = device.createBuffer({ /* manual data */ });
   ```

7. **NO synchronous operations in render loop**
   ```typescript
   // ❌ NEVER
   runner.on("frame", () => {
     const data = await fetch(...); // Blocking!
   });
   ```

8. **NO untracked utilities**
   ```typescript
   // ❌ NEVER
   const controller = new OrbitController(canvas); // Not tracked!
   ```

9. **NO missing context loss handling**
   ```typescript
   // ❌ NEVER
   // No webglcontextlost handler
   ```

10. **NO post-processing without tracking**
    ```typescript
    // ❌ NEVER
    const pp = new PostProcessManager(device, canvas); // Not tracked!
    ```

11. **NO texture loading without loader**
    ```typescript
    // ❌ NEVER
    const texture = device.createTexture({ /* manual */ }); // Use TextureLoader
    ```

12. **NO uniform buffers without tracking**
    ```typescript
    // ❌ NEVER
    const uniform = device.createBuffer(...); // Must be tracked
    ```

---

## 📚 Correct Usage Examples

### Complete Demo Structure
```typescript
export async function demo(runner: DemoRunner) {
  // 1. Initialize
  await runner.init();

  // 2. Device & Context
  const device = runner.device;
  const canvas = runner.canvas;

  // 3. Geometry (tracked)
  const cube = runner.track(GeometryGenerator.cube({ size: 1.0 }));

  // 4. Pipeline (tracked)
  const pipeline = runner.track(device.createRenderPipeline({
    layout: "auto",
    vertex: { module: shaderModule, entryPoint: "vs_main" },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_main",
      targets: [{ format: canvas.format }]
    },
    primitive: { topology: "triangle-list" }
  }));

  // 5. Uniform buffer (tracked)
  const uniformBuffer = runner.track(device.createBuffer({
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  }));

  // 6. Utilities (tracked)
  const controller = runner.track(new OrbitController(canvas));
  const stats = runner.track(new Stats());
  const gui = runner.track(new GUI());

  const params = { rotation: 0 };
  gui.add(params, "rotation");

  // 7. Event handlers
  runner.on("keydown", (e) => {
    if (e.key === "Escape") runner.destroy();
  });

  // 8. Render loop
  runner.on("frame", () => {
    if (!runner.beginFrame()) return;

    stats.begin();
    controller.update();

    // Update uniform
    device.queue.writeBuffer(uniformBuffer, 0, new Float32Array([
      Math.cos(params.rotation), 0, 0, 0,
      0, Math.sin(params.rotation), 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]));

    // Render
    const commandEncoder = device.createCommandEncoder();
    const pass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: runner.getCurrentTexture().createView(),
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
        loadOp: "clear",
        storeOp: "store"
      }]
    });

    pass.setPipeline(pipeline);
    pass.setBindGroup(0, device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: uniformBuffer } }]
    }));
    pass.drawIndexed(cube.indexCount);
    pass.end();

    device.queue.submit([commandEncoder.finish()]);

    stats.end();
    runner.endFrame();
  });

  // 9. Start
  runner.start();
}
```

### Texture Loading Example
```typescript
export async function demo(runner: DemoRunner) {
  await runner.init();

  const loader = runner.track(new TextureLoader(runner.device));

  // Load texture
  const texture = await loader.load("assets/texture.png");

  // Create sampler (tracked)
  const sampler = runner.track(runner.device.createSampler({
    magFilter: "linear",
    minFilter: "linear"
  }));

  // Use in pipeline...

  runner.start();
}
```

### Post-Processing Example
```typescript
export async function demo(runner: DemoRunner) {
  await runner.init();

  const postProcess = runner.track(new PostProcessManager(runner.device, runner.canvas));

  // Add passes
  const bloom = runner.track(new BloomPass({ intensity: 0.5 }));
  const fxaa = runner.track(new FxaaPass());

  postProcess.addPass(bloom);
  postProcess.addPass(fxaa);

  runner.on("frame", () => {
    if (!runner.beginFrame()) return;

    // Render to offscreen
    postProcess.beginPass();
    // ... render scene
    postProcess.endPass();

    // Apply post-processing
    postProcess.render();

    runner.endFrame();
  });

  runner.start();
}
```

---

## 🎯 Validation Checklist

Before deploying any demo, verify:

- [ ] All resources created via `runner.track()`
- [ ] Lifecycle follows: init → start → (pause) → destroy
- [ ] Render loop uses `beginFrame()` and `endFrame()`
- [ ] Canvas ID is "J-canvas"
- [ ] Escape key handler implemented
- [ ] Geometry uses `GeometryGenerator`
- [ ] Uniform buffers tracked
- [ ] Utilities (OrbitController, Stats, GUI) tracked
- [ ] PostProcessManager tracked (if used)
- [ ] TextureLoader tracked (if used)
- [ ] Context loss handling implemented
- [ ] No synchronous operations in render loop
- [ ] All error cases handled
- [ ] No manual resource cleanup

---

## 🔗 Related Documents

- **reference-rhi-geometry-generator**: Geometry creation patterns
- **reference-orbit-controller**: Camera control specifications
- **reference-post-process-manager**: Post-processing pipeline standards
- **reference-texture-loader**: Asset loading conventions
