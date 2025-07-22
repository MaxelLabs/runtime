# 快速开始指南

本指南将帮助您快速上手使用Maxellabs Specification。

## 🚀 5分钟快速上手

### 步骤1：安装依赖

```bash
npm install @maxellabs/specification
```

### 步骤2：基础类型使用

#### 创建设计元素

```typescript
import type { DesignElement, DesignTextElement, CommonBounds } from '@maxellabs/specification';

// 定义文本元素
const titleText: DesignTextElement = {
  id: 'hero-title',
  name: '主标题',
  type: 'text',
  bounds: {
    x: 100,
    y: 200,
    width: 400,
    height: 60,
  },
  content: '欢迎使用Maxellabs',
  textStyle: {
    fontFamily: 'PingFang SC',
    fontSize: 32,
    color: '#333333',
    fontWeight: 'bold',
  },
  textAlign: 'center',
  visible: true,
  locked: false,
  opacity: 1,
};

// 定义图像元素
const heroImage: DesignElement = {
  id: 'hero-image',
  name: '英雄图像',
  type: 'image',
  bounds: {
    x: 0,
    y: 0,
    width: 1920,
    height: 1080,
  },
  source: '/assets/hero-bg.jpg',
  visible: true,
  locked: false,
  opacity: 1,
};
```

#### 定义动画状态

```typescript
import type { AnimationState, AnimationTransition } from '@maxellabs/specification/animation';

// 创建动画状态
const idleState: AnimationState = {
  id: 'idle',
  name: '待机',
  clip: 'character_idle',
  speed: 1.0,
  loop: true,
  weight: 1.0,
  fadeInTime: 0.2,
  fadeOutTime: 0.2,
};

const walkState: AnimationState = {
  id: 'walk',
  name: '行走',
  clip: 'character_walk',
  speed: 1.0,
  loop: true,
  weight: 1.0,
};

// 定义状态转换
const idleToWalk: AnimationTransition = {
  id: 'idle-to-walk',
  from: 'idle',
  to: 'walk',
  duration: 0.3,
  hasExitTime: false,
  conditions: [
    {
      id: 'speed-greater',
      parameter: 'speed',
      type: 'float',
      operator: 'greater',
      value: 0.1,
    },
  ],
};
```

### 步骤3：创建Maxellabs包

```typescript
import type { MaxellabsPackage, PackageMetadata } from '@maxellabs/specification/package';

const packageMetadata: PackageMetadata = {
  name: 'my-design-system',
  version: '1.0.0',
  description: '我的设计系统',
  author: {
    name: '张三',
    email: 'zhangsan@example.com',
    organization: 'Maxellabs'
  },
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
  size: 1024000,
  fileCount: 25,
  checksum: 'sha256:abc123...',
  compatibility: {
    minEngineVersion: '1.0.0',
    platforms: [Platform.Web, Platform.Mobile],
    deviceTypes: [DeviceType.Desktop, DeviceType.Mobile]
  }
};

const maxellabsPackage: MaxellabsPackage = {
  version: '1.0.0',
  metadata: packageMetadata,
  stage: {
    // USD stage配置
  },
  designDocuments: [
    {
      id: 'main-page',
      name: '主页面',
      elements: [titleText, heroImage]
    }
  ],
  workflows: [
    {
      id: 'deploy-workflow',
      name: '部署工作流',
      steps: [...]
    }
  ],
  configuration: {
    build: {
      target: BuildTarget.Web,
      mode: BuildMode.Production,
      outputDir: './dist',
      minify: true,
      treeShaking: true
    },
    runtime: {
      renderer: {
        type: RendererType.WebGL2,
        antialias: true,
        alpha: false
      },
      performance: {
        targetFPS: 60,
        maxMemory: 512,
        adaptiveQuality: true
      }
    }
  }
};
```

## 📚 按场景分类示例

### UI设计场景

```typescript
// 响应式布局
import type { DesignConstraints } from '@maxellabs/specification/design';

const responsiveLayout: DesignConstraints = {
  left: { type: 'percentage', value: 5 },
  right: { type: 'percentage', value: 5 },
  top: { type: 'fixed', value: 20 },
  width: { type: 'parent', value: 0.9 },
  height: { type: 'auto' },
};

// 主题配置
import type { DesignTheme } from '@maxellabs/specification/design';

const lightTheme: DesignTheme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    text: '#000000',
  },
  typography: {
    fontFamily: 'PingFang SC',
    fontSizes: [12, 14, 16, 20, 24, 32],
    fontWeights: [400, 500, 600, 700],
  },
  spacing: [4, 8, 12, 16, 24, 32, 48, 64],
};
```

### 动画系统场景

```typescript
// 复杂状态机
import type { AnimationStateMachine } from '@maxellabs/specification/animation';

const characterStateMachine: AnimationStateMachine = {
  name: 'CharacterController',
  defaultState: 'idle',
  states: [
    {
      id: 'idle',
      name: 'Idle',
      clip: 'animations/character_idle.fbx',
      speed: 1.0,
      loop: true,
      weight: 1.0,
    },
    {
      id: 'run',
      name: 'Run',
      clip: 'animations/character_run.fbx',
      speed: 1.5,
      loop: true,
      weight: 1.0,
    },
  ],
  transitions: [
    {
      id: 'idle-to-run',
      from: 'idle',
      to: 'run',
      duration: 0.2,
      conditions: [
        {
          parameter: 'speed',
          type: 'float',
          operator: 'greater',
          value: 2.0,
        },
      ],
    },
  ],
  parameters: [
    { name: 'speed', type: 'float', defaultValue: 0 },
    { name: 'isGrounded', type: 'bool', defaultValue: true },
  ],
};
```

### 渲染配置场景

```typescript
// 性能优化配置
import type { PerformanceConfiguration } from '@maxellabs/specification/package';

const mobileConfig: PerformanceConfiguration = {
  targetFPS: 30,
  maxMemory: 256,
  gpuMemoryLimit: 128,
  adaptiveQuality: true,
  monitoring: true,
};

const desktopConfig: PerformanceConfiguration = {
  targetFPS: 60,
  maxMemory: 1024,
  gpuMemoryLimit: 512,
  adaptiveQuality: true,
  monitoring: true,
};
```

## 🛠️ 开发工具集成

### VS Code配置

在项目根目录创建`.vscode/settings.json`：

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "typescript.suggest.completeFunctionCalls": true
}
```

### ESLint配置

```javascript
// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['@typescript-eslint/recommended'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
  },
};
```

## 🎯 最佳实践

### 1. 类型导入最佳实践

```typescript
// ✅ 推荐：使用类型导入
import type { AnimationState } from '@maxellabs/specification/animation';

// ❌ 避免：直接导入整个模块
import * as Animation from '@maxellabs/specification/animation';
```

### 2. 模块选择指南

| 使用场景     | 推荐模块    |
| ------------ | ----------- |
| 基础类型定义 | `core`      |
| UI设计元素   | `design`    |
| 动画系统     | `animation` |
| 渲染配置     | `rendering` |
| 包格式       | `package`   |
| 工作流       | `workflow`  |

### 3. 性能优化建议

- 使用类型导入减少运行时开销
- 避免深层嵌套的导入路径
- 利用TypeScript的类型推断减少冗余

## 📞 获取帮助

- [GitHub Issues](https://github.com/maxellabs/specification/issues)
- [官方文档](https://docs.maxellabs.com)
- [社区论坛](https://forum.maxellabs.com)

## 下一步

完成快速开始后，建议：

1. 阅读[架构指南](./docs/ARCHITECTURE.md)
2. 查看[API参考](./docs/API.md)
3. 探索[示例项目](./examples/)
