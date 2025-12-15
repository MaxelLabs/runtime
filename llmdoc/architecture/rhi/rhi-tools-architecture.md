# RHI 工具模块架构

## 1. 概述

RHI 工具模块是构建在 RHI 抽象层之上的高级渲染工具集合，位于 `packages/rhi/demo/src/utils/` 目录下。这些模块提供了从基础渲染到高级特效的完整解决方案。

## 2. 模块架构图

```
packages/rhi/demo/src/utils/
├── material/              # 材质系统
│   └── pbr/              # PBR材质模块
│       ├── PBRMaterial.ts     # 核心材质类
│       ├── IBLLoader.ts       # IBL加载器
│       ├── MaterialLibrary.ts # 材质库
│       ├── PBRShaders.ts      # 着色器代码
│       └── types.ts          # 类型定义
├── particle/              # 粒子系统
│   ├── ParticleBuffer.ts     # GPU数据管理
│   ├── ParticleEmitter.ts    # 发射器
│   ├── ParticleRenderer.ts   # 渲染器
│   ├── ParticleAnimator.ts   # 动画器
│   ├── ParticleShaders.ts    # 着色器
│   └── types.ts             # 类型定义
├── skybox/               # 天空盒系统
│   ├── SkyboxRenderer.ts     # 渲染器
│   ├── ProceduralSky.ts      # 程序化天空
│   ├── EnvironmentMap.ts     # 环境映射
│   └── types.ts             # 类型定义
└── shadow/               # 阴影工具
    ├── ShadowMap.ts          # 阴影贴图
    └── LightSpaceMatrix.ts   # 光源空间矩阵
```

## 3. 核心设计原则

### 3.1 模块化设计
- **独立模块**: 每个工具都是独立的 TypeScript 模块
- **清晰接口**: 通过 types.ts 定义公共接口
- **可选依赖**: 模块间依赖最小化，支持按需使用

### 3.2 性能优先
- **GPU 加速**: 充分利用 WebGL2 特性
- **批量处理**: 使用实例化渲染和批处理技术
- **内存管理**: 通过 runner.track() 管理资源生命周期

### 3.3 易于使用
- **统一API**: 遵循 RHI 的设计模式
- **预设配置**: 提供常用的默认配置
- **渐进增强**: 支持从基础到高级的渐进使用

## 4. 模块详细设计

### 4.1 PBR材质系统

#### 架构组件
```
PBRMaterial
├── 材质属性管理
│   ├── Albedo (反照率)
│   ├── Metalness (金属度)
│   ├── Roughness (粗糙度)
│   ├── Normal Map (法线贴图)
│   └── AO (环境遮蔽)
├── IBL 支持
│   ├── Diffuse Irradiance
│   ├── Specular Prefilter
│   └── BRDF LUT
└── 着色器系统
    ├── Vertex Shader
    ├── Fragment Shader
    └── Uniform Blocks
```

#### 数据流
1. **纹理加载** → 材质属性设置
2. **环境映射** → IBL贴图生成
3. **渲染调用** → PBR着色计算 → 输出颜色

### 4.2 粒子系统

#### 架构组件
```
ParticleSystem
├── 数据管理 (ParticleBuffer)
│   ├── Position Buffer
│   ├── Velocity Buffer
│   ├── Life Buffer
│   └── Color Buffer
├── 发射器 (ParticleEmitter)
│   ├── 发射形状
│   ├── 发射速率
│   └── 初始参数
├── 渲染器 (ParticleRenderer)
│   ├── 实例化渲染
│   ├── Billboard 着色器
│   └── 混合模式
└── 动画器 (ParticleAnimator)
    ├── 物理更新
    ├── 生命周期管理
    └── 回收机制
```

#### 渲染流程
1. **发射**: Emitter 生成新粒子
2. **更新**: Animator 更新粒子状态
3. **渲染**: Renderer 批量渲染活跃粒子

### 4.3 天空盒系统

#### 架构组件
```
SkyboxSystem
├── 渲染器 (SkyboxRenderer)
│   ├── 立方体网格
│   ├── 渲染管线
│   └── 深度技巧
├── 程序化天空 (ProceduralSky)
│   ├── 天空渐变
│   ├── 太阳光晕
│   └── 日夜循环
└── 环境映射 (EnvironmentMap)
    ├── 辐照度卷积
    ├── 镜面预过滤
    └── BRDF积分
```

#### 渲染特点
- **深度处理**: 使用 gl_Position.xyww 确保深度为1.0
- **视图矩阵**: 移除位移分量，只保留旋转
- **立方体贴图**: +X, -X, +Y, -Y, +Z, -Z 顺序

### 4.4 阴影工具

#### 架构组件
```
ShadowTools
├── 阴影贴图 (ShadowMap)
│   ├── FBO管理
│   ├── 深度纹理
│   └── PCF滤波
└── 光源空间矩阵 (LightSpaceMatrix)
    ├── 正交投影（平行光）
    ├── 透视投影（点光源）
    └── 视锥体计算
```

## 5. 与 RHI 核心的集成

### 5.1 资源管理
所有工具模块都通过 RHI 的资源管理系统管理 GPU 资源：

```typescript
// 使用 runner.track() 管理资源
runner.track(buffer);
runner.track(texture);
runner.track(pipeline);
```

### 5.2 命令编码
工具生成的渲染命令通过 RHI 的命令编码器执行：

```typescript
// 编码渲染命令
cmdBuf.drawIndexedInstanced(...);
cmdBuf.bindPipeline(...);
cmdBuf.bindResources(...);
```

### 5.3 设备兼容性
所有工具都遵循 RHI 的设备抽象，支持 WebGL2 和未来的 WebGPU。

## 6. 性能优化策略

### 6.1 批处理优化
- **实例化渲染**: 粒子和几何体批量渲染
- **状态排序**: 减少渲染状态切换
- **纹理合并**: 多纹理绑定和采样

### 6.2 内存优化
- **对象池**: 粒子复用机制
- **预分配**: 缓冲区预分配策略
- **压缩格式**: 纹理压缩支持

### 6.3 GPU优化
- **computeShader**: 利用transform反馈
- **UBO**: 统一缓冲区对象
- **InstancedDrawing**: 实例化绘制

## 7. 扩展性设计

### 7.1 插件架构
工具模块设计为可插拔的组件：

```typescript
interface ToolModule {
    name: string;
    version: string;
    dependencies?: string[];
    initialize(rhi: RHIDevice): void;
    dispose(): void;
}
```

### 7.2 配置系统
每个模块都支持灵活的配置：

```typescript
interface PBRConfig {
    enableIBL: boolean;
    maxLights: number;
    shadowQuality: 'low' | 'medium' | 'high';
}
```

## 8. 使用示例

### 8.1 基础使用
```typescript
import { PBRMaterial } from './utils/material/pbr';
import { ParticleSystem } from './utils/particle';
import { SkyboxRenderer } from './utils/skybox';

// 创建材质
const material = new PBRMaterial(rhi, config);

// 创建粒子系统
const particles = new ParticleSystem(rhi, particleConfig);

// 创建天空盒
const skybox = new SkyboxRenderer(rhi, cubemap);
```

### 8.2 集成渲染
```typescript
// 渲染循环
function render() {
    // 1. 渲染阴影
    shadowMap.render();

    // 2. 渲染天空盒
    skybox.render(camera);

    // 3. 渲染PBR物体
    material.render(objects);

    // 4. 渲染粒子
    particles.render(camera);
}
```

## 9. 未来扩展

### 9.1 计划模块
- **后处理系统**: Bloom、DOF、运动模糊
- **地形系统**: 高度图、LOD、纹理混合
- **体积渲染**: 云层、雾效、体积光

### 9.2 技术演进
- **WebGPU支持**: 利用更先进的GPU特性
- **GPU Driven**: 计算着色器驱动渲染
- **AI增强**: 神经网络辅助渲染

## 10. 总结

RHI 工具模块架构提供了：

1. **完整的渲染工具链**: 从材质到特效的全套解决方案
2. **高性能实现**: 充分利用现代GPU特性
3. **易于集成**: 与RHI核心无缝配合
4. **可扩展性**: 支持未来功能扩展
5. **开发友好**: 简洁的API和丰富的配置选项

这些工具模块为开发者提供了构建高质量3D应用的强大基础。