# rotating-cube.ts 实现模式总结

## 必要的导入语句

```typescript
import { MSpec, MMath } from '@maxellabs/core';
import {
  DemoRunner,
  GeometryGenerator,
  OrbitController,
  ProceduralTexture,
  SimpleGUI,
  Stats
} from './utils';
```

## 初始化代码模式

### 1. 创建 DemoRunner
```typescript
const runner = new DemoRunner({
  canvasId: 'J-canvas',
  name: 'Demo 名称',
  clearColor: [r, g, b, a],
});
```

### 2. 初始化
```typescript
await runner.init();
```

### 3. 创建 Stats 性能监控（可选）
```typescript
const stats = new Stats({
  position: 'top-left', // 可选: 'top-right', 'bottom-left', 'bottom-right'
  show: ['fps', 'ms'],  // 可选: ['fps'], ['ms'], ['memory'], ['fps', 'ms', 'memory']
});
```

### 4. 创建 OrbitController（可选）
```typescript
const orbit = new OrbitController(runner.canvas, {
  distance: 5,                    // 初始距离
  target: [0, 0, 0],              // 目标点
  elevation: Math.PI / 6,         // 仰角（弧度）
  azimuth: Math.PI / 4,           // 方位角（弧度）
  enableDamping: true,            // 启用阻尼
  dampingFactor: 0.08,            // 阻尼系数
  rotateSpeed: 0.005,            // 旋转速度
  zoomSpeed: 0.1,                // 缩放速度
  panSpeed: 0.01,                // 平移速度
});
```

### 5. 创建 GUI 控制面板（可选）
```typescript
const gui = new SimpleGUI();

gui
  .add('parameterName', {
    value: initialValue,
    min: minValue,
    max: maxValue,
    step: stepValue,
    onChange: (value) => {
      // 更新参数
      params.parameterName = value;
    },
  })
  .add('parameterName2', {
    value: initialValue,
    options: ['option1', 'option2', 'option3'],
    onChange: (value) => {
      // 更新选项
      params.parameterName = value;
    },
  });
```

## 渲染循环结构

### 基本模式
```typescript
runner.start((dt) => {
  // 1. 性能监控开始
  stats.begin();

  // 2. 更新状态（旋转、动画等）
  if (params.autoRotate) {
    rotation += speed * dt;
  }

  // 3. 更新相机（如果有 OrbitController）
  orbit.update(dt);

  // 4. 计算矩阵
  const viewMatrix = orbit.getViewMatrix();
  const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);
  const cameraPos = orbit.getPosition();

  // 5. 更新 Uniform 数据（如果有）
  uniformBuffer.update(data, offset);

  // 6. 渲染
  const { encoder, passDescriptor } = runner.beginFrame();

  const renderPass = encoder.beginRenderPass(passDescriptor);
  renderPass.setPipeline(pipeline);
  renderPass.setBindGroup(0, bindGroup);
  renderPass.setVertexBuffer(0, vertexBuffer);
  if (hasIndexBuffer) {
    renderPass.setIndexBuffer(indexBuffer, MSpec.RHIIndexFormat.UINT16);
    renderPass.drawIndexed(indexCount);
  } else {
    renderPass.draw(vertexCount);
  }
  renderPass.end();

  runner.endFrame(encoder);

  // 7. 性能监控结束
  stats.end();
});
```

## 关键配置参数

### 1. DemoRunner 配置
```typescript
interface DemoConfig {
  canvasId: string;              // 画布元素 ID
  name?: string;                 // Demo 名称（可选）
  clearColor?: [number, number, number, number]; // 清除颜色
}
```

### 2. OrbitController 配置
```typescript
interface OrbitControllerConfig {
  distance?: number;             // 相机距离
  target?: [number, number, number]; // 目标点
  elevation?: number;           // 仰角（弧度）
  azimuth?: number;             // 方位角（弧度）
  enableDamping?: boolean;       // 是否启用阻尼
  dampingFactor?: number;        // 阻尼系数
  rotateSpeed?: number;          // 旋转速度
  zoomSpeed?: number;            // 缩放速度
  panSpeed?: number;             // 平移速度
  minDistance?: number;         // 最小距离
  maxDistance?: number;         // 最大距离
  minElevation?: number;         // 最小仰角
  maxElevation?: number;         // 最大仰角
}
```

### 3. Stats 配置
```typescript
interface StatsConfig {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  show?: ('fps' | 'ms' | 'memory')[];
}
```

### 4. GUI 配置
```typescript
// 滑块控件
gui.add('parameterName', {
  value: number,
  min: number,
  max: number,
  step: number,
  onChange: (value) => void
});

// 开关控件
gui.add('parameterName', {
  value: boolean,
  onChange: (value) => void
});

// 下拉选择控件
gui.add('parameterName', {
  value: string,
  options: string[],
  onChange: (value) => void
});

// 分隔符
gui.addSeparator('Section Name');
```

### 5. 缓冲区配置
```typescript
// 顶点缓冲区
runner.track(
  runner.device.createBuffer({
    size: geometry.vertices.byteLength,
    usage: MSpec.RHIBufferUsage.VERTEX,
    hint: 'static', // 'static' | 'dynamic' | 'stream'
    initialData: geometry.vertices as BufferSource,
    label: 'Vertex Buffer',
  })
);

// 索引缓冲区
runner.track(
  runner.device.createBuffer({
    size: geometry.indices!.byteLength,
    usage: MSpec.RHIBufferUsage.INDEX,
    hint: 'static',
    initialData: geometry.indices as BufferSource,
    label: 'Index Buffer',
  })
);

// Uniform 缓冲区
runner.track(
  runner.device.createBuffer({
    size: size,
    usage: MSpec.RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
    label: 'Uniform Buffer',
  })
);
```

### 6. 纹理配置
```typescript
// 创建纹理
const texture = runner.track(
  runner.device.createTexture({
    width: 256,
    height: 256,
    format: MSpec.RHITextureFormat.RGBA8_UNORM,
    usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
    label: 'Texture',
  })
);

// 更新纹理数据
texture.update(data as BufferSource);

// 创建采样器
const sampler = runner.track(
  runner.device.createSampler({
    magFilter: MSpec.RHIFilterMode.LINEAR,     // 放大滤波
    minFilter: MSpec.RHIFilterMode.LINEAR,     // 缩小滤波
    mipmapFilter: MSpec.RHIFilterMode.LINEAR, // Mipmap 滤波
    addressModeU: MSpec.RHIAddressMode.REPEAT, // U 向地址模式
    addressModeV: MSpec.RHIAddressMode.REPEAT, // V 向地址模式
    useMipmap: false,                         // 是否使用 Mipmap
  })
);
```

### 7. 键盘事件绑定
```typescript
// ESC 键退出
runner.onKey('Escape', () => {
  gui.destroy();
  stats.destroy();
  orbit.destroy();
  runner.destroy();
});

// F11 切换全屏
runner.onKey('F11', (_, event) => {
  event.preventDefault();
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    runner.canvas.requestFullscreen();
  }
});

// 空格键切换状态
runner.onKey(' ', () => {
  params.autoRotate = !params.autoRotate;
  gui.set('autoRotate', params.autoRotate);
});
```

### 8. 帮助信息显示
```typescript
DemoRunner.showHelp([
  'ESC: 退出 Demo',
  'F11: 切换全屏',
  'Space: 暂停/继续旋转',
  '鼠标左键拖动: 旋转视角',
  '鼠标滚轮: 缩放',
  '鼠标右键拖动: 平移',
]);
```