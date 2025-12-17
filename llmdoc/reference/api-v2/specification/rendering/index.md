# Specification 渲染规范 API 文档

> 完整的3D渲染管线定义 - **导航式文档**
> 详细实现请参考专门的渲染模块和API文档

## 📖 概览

Specification渲染规范提供完整的3D渲染管线定义，基于现代渲染API设计，深度集成USD标准，支持PBR、卡通渲染、线框渲染等多种渲染模式。

### 核心特性
- **USD几何体兼容**: 完全支持OpenUSD几何体规范
- **PBR材质系统**: 基于物理的渲染材质
- **着色器网络**: 灵活的节点化着色器编辑
- **多渲染管线**: 前向、延迟、自定义渲染管线
- **光照阴影系统**: 完整的光照和阴影支持
- **LOD系统**: 多细节层次优化

## 🏗️ 文档结构

### 核心渲染系统
- [几何体系统](#几何体系统) - 网格、细分、实例化
- [材质系统](#材质系统) - PBR材质、着色器网络
- [光照系统](#光照系统) - 动态光照、阴影映射
- [相机系统](#相机系统) - 投影、视锥、控制

### 高级渲染功能
- [渲染管线](#渲染管线) - 前向、延迟、自定义管线
- [后处理效果](#后处理效果) - 抗锯齿、色调映射、特效
- [性能优化](#性能优化) - LOD、批处理、剔除
- [扩展开发](#扩展开发) - 自定义着色器和材质

## 🚀 快速开始

### 1. 基础渲染设置
```typescript
import { MeshGeometry, PBRMaterial, DirectionalLight } from './rendering-system';

// 创建网格几何体
const geometry = new MeshGeometry({
  attributes: {
    points: new Float32Array([/* 顶点数据 */]),
    faceVertexIndices: new Uint32Array([/* 索引数据 */]),
    normals: new Float32Array([/* 法线数据 */])
  }
});

// 创建PBR材质
const material = new PBRMaterial({
  albedo: [0.8, 0.2, 0.2],
  metallic: 0.7,
  roughness: 0.3
});
```

### 2. 光照配置
```typescript
// 设置主光源
const directionalLight = new DirectionalLight({
  direction: [0.5, -1, 0.3],
  color: [1.0, 1.0, 0.9],
  intensity: 2.0,
  castShadows: true
});

// 添加环境光
const ambientLight = new AmbientLight({
  color: [0.2, 0.2, 0.3],
  intensity: 0.5
});
```

### 3. 渲染管线配置
```typescript
// 创建前向渲染管线
const forwardPipeline = new ForwardRenderPipeline({
  enableShadows: true,
  shadowQuality: ShadowQuality.High,
  antiAliasing: AntiAliasing.FXAA
});

// 设置渲染目标
renderPipeline.setRenderTarget({
  width: 1920,
  height: 1080,
  format: 'rgba16f'
});
```

## 🧩 几何体系统

### 网格几何体基础

基于USD标准的几何体定义：
- **基础属性**: 顶点位置、索引、法线、UV坐标
- **扩展属性**: 切线、双切线、顶点颜色
- **拓扑信息**: 拓扑类型、绕序、索引格式
- **细分支持**: Catmull-Clark、Loop细分方案

### 几何体类型
```typescript
enum TopologyType {
  TriangleList = 'triangle-list',     // 三角形列表
  TriangleStrip = 'triangle-strip',   // 三角形条带
  LineList = 'line-list',             // 线段列表
  PointList = 'point-list'            // 点列表
}
```

### 实例化渲染
```typescript
interface InstancingProperties {
  enabled: boolean;
  count: number;                      // 实例数量
  perInstanceData: Float32Array;      // 每实例数据
  attributes: InstanceAttribute[];    // 实例属性
}
```

### LOD系统
```typescript
interface LODConfiguration {
  enabled: boolean;
  levels: LODLevel[];
  screenSizeThresholds: number[];
  hysteresis: number;
}
```

## 🎨 材质系统

### PBR材质工作流
```typescript
interface PBRMaterial extends Material {
  // 基础属性
  albedo: Color | Texture;            // 反照率
  metallic: number | Texture;         // 金属度
  roughness: number | Texture;        // 粗糙度
  normalMap?: Texture;                // 法线贴图
  occlusionMap?: Texture;             // 环境光遮蔽

  // 高级属性
  emissive: Color | Texture;          // 自发光
  clearcoat?: ClearcoatProperties;    // 清漆层
  transmission?: TransmissionProperties; // 透射
  sheen?: SheenProperties;            // 丝光效果
}
```

### 着色器网络
```typescript
interface ShaderNetwork {
  nodes: ShaderNode[];                // 着色器节点
  connections: NodeConnection[];      // 节点连接
  outputs: NetworkOutput[];           // 网络输出
}

interface ShaderNode {
  id: string;
  type: NodeType;
  position: Vec2;
  parameters: NodeParameter[];
  inputs: NodeInput[];
  outputs: NodeOutput[];
}
```

### 材质混合模式
```typescript
enum BlendMode {
  OPAQUE = 'opaque',                  // 不透明
  TRANSLUCENT = 'translucent',        // 半透明
  ADDITIVE = 'additive',              // 加法混合
  MULTIPLY = 'multiply',              // 乘法混合
  SCREEN = 'screen'                   // 屏幕混合
}
```

## 💡 光照系统

### 光源类型
```typescript
// 方向光 (太阳光)
interface DirectionalLight extends Light {
  direction: Vec3;
  castShadows: boolean;
  shadowCascade: CascadeShadowConfig;
}

// 点光源
interface PointLight extends Light {
  position: Vec3;
  range: number;
  attenuation: AttenuationType;
}

// 聚光灯
interface SpotLight extends Light {
  position: Vec3;
  direction: Vec3;
  innerConeAngle: number;
  outerConeAngle: number;
}
```

### 阴影映射
```typescript
interface ShadowMapping {
  enabled: boolean;
  technique: ShadowTechnique;
  resolution: number;
  bias: number;
  pcfSamples: number;
  cascadeConfig?: CascadeConfig;
}

enum ShadowTechnique {
  HardShadows = 'hard',               // 硬阴影
  PCF = 'pcf',                        // 百分比接近过滤
  VSM = 'vsm',                        // 方差阴影映射
  CSM = 'csm'                         // 级联阴影映射
}
```

### 图像基础光照 (IBL)
```typescript
interface ImageBasedLighting {
  environmentMap: TextureCube;         // 环境贴图
  irradianceMap: TextureCube;          // 漫反射光照
  prefilteredMap: TextureCube;         // 镜面反射
  brdfLUT: Texture2D;                  // BRDF查找表
}
```

## 📷 相机系统

### 相机类型
```typescript
enum CameraType {
  Perspective = 'perspective',        // 透视相机
  Orthographic = 'orthographic',      // 正交相机
  VR = 'vr',                          // VR相机
  Custom = 'custom'                   // 自定义相机
}

interface PerspectiveCamera extends Camera {
  fovY: number;                       // 垂直视场角
  aspectRatio: number;                // 宽高比
  nearZ: number;                      // 近裁剪面
  farZ: number;                       // 远裁剪面
}
```

### 视锥体剔除
```typescript
interface Frustum {
  planes: FrustumPlane[];             // 6个裁剪平面
  corners: Vec3[];                    // 8个角点
  center: Vec3;                       // 中心点
}
```

### 相机控制
```typescript
interface CameraController {
  orbit: OrbitControls;               // 轨道控制
  firstPerson: FirstPersonControls;   // 第一人称控制
  fly: FlyControls;                   // 飞行控制
}
```

## 🔧 渲染管线

### 管线类型
```typescript
enum RenderPipelineType {
  Forward = 'forward',                // 前向渲染
  Deferred = 'deferred',              // 延迟渲染
  ForwardPlus = 'forward+',           // 前向+
  TileBased = 'tile-based',           // 基于瓦片
  Custom = 'custom'                   // 自定义
}
```

### 渲染阶段
```typescript
interface RenderPass {
  name: string;
  type: PassType;
  inputs: PassInput[];
  outputs: PassOutput[];
  shaders: ShaderStage[];
  state: RenderState;
}

enum PassType {
  Geometry = 'geometry',              // 几何体通道
  Lighting = 'lighting',              // 光照通道
  Shadow = 'shadow',                  // 阴影通道
  PostProcess = 'post-process',       // 后处理通道
  UI = 'ui'                           // UI通道
}
```

### 渲染状态
```typescript
interface RenderState {
  rasterization: RasterizationState;  // 光栅化状态
  depthStencil: DepthStencilState;    // 深度模板状态
  blend: BlendState;                  // 混合状态
  viewport: ViewportState;            // 视口状态
}
```

## 🎬 后处理效果

### 抗锯齿技术
```typescript
enum AntiAliasing {
  None = 'none',                      // 无抗锯齿
  MSAA = 'msaa',                      // 多重采样抗锯齿
  FXAA = 'fxaa',                      // 快速近似抗锯齿
  TAA = 'taa',                        // 时间抗锯齿
  DLSS = 'dlss'                       // 深度学习超采样
}
```

### 色调映射
```typescript
enum ToneMapping {
  Linear = 'linear',                  // 线性映射
  Reinhard = 'reinhard',              // Reinhard映射
  ACES = 'aces',                      // ACES映射
  Uncharted2 = 'uncharted2',          // Uncharted2映射
  Filmic = 'filmic'                   // 胶片映射
}
```

### 内置效果
- **亮度/对比度**: 图像增强
- **高斯模糊**: 景深和辉光效果
- **色调饱和度**: 颜色调整
- **晕影**: 边角暗化效果
- **色差**: 镜头色散效果

## ⚡ 性能优化

### 剔除技术
- **视锥体剔除**: 移除视锥外的几何体
- **遮挡剔除**: 移除被遮挡的几何体
- **背面剔除**: 移除背向相机的面片

### 批处理优化
```typescript
interface BatchConfiguration {
  enabled: boolean;
  batchSize: number;                  // 批处理大小
  maxDrawCalls: number;               // 最大Draw Call数
  strategy: BatchingStrategy;         // 批处理策略
}
```

### GPU实例化
```typescript
interface GPUInstancing {
  maxInstances: number;               // 最大实例数
  instanceDataFormat: VertexFormat;   // 实例数据格式
  drawIndirect: boolean;              // 间接绘制支持
}
```

## 🔗 扩展开发

### 自定义着色器
```typescript
interface CustomShader {
  name: string;
  type: ShaderType;
  source: string;
  entryPoint: string;
  language: ShaderLanguage;
  uniforms: ShaderUniform[];
}

enum ShaderLanguage {
  GLSL = 'glsl',                      // OpenGL着色器语言
  HLSL = 'hlsl',                      // DirectX着色器语言
  WGSL = 'wgsl',                      // WebGPU着色器语言
  SPIRV = 'spirv'                     // SPIR-V二进制
}
```

### 材质编辑器
```typescript
class MaterialEditor {
  // 创建材质
  createMaterial(type: MaterialType): Material;

  // 编辑材质属性
  editProperty(material: Material, property: string, value: any): void;

  // 预览材质
  previewMaterial(material: Material): PreviewResult;
}
```

### 渲染调试工具
- **性能分析器**: 渲染性能分析
- **帧调试器**: 逐帧渲染调试
- **内存分析器**: GPU内存使用分析
- **着色器调试器**: 着色器代码调试

## 📊 性能指标

### 渲染性能
```typescript
interface RenderMetrics {
  frameTime: number;                  // 帧时间 (ms)
  fps: number;                        // 帧率
  drawCalls: number;                  // Draw Call数量
  triangles: number;                  // 三角形数量
  vertices: number;                   // 顶点数量
  memoryUsage: MemoryUsage;           // 内存使用
}
```

### 优化建议
- **Draw Call优化**: 合并材质相同的物体
- **纹理优化**: 使用纹理图集和压缩
- **LOD应用**: 根据距离调整细节级别
- **批处理**: 合理设置批处理大小

## 🔗 相关资源

### API文档
- [几何体API](./geometry/) - 几何体创建和操作
- [材质API](./materials/) - 材质定义和编辑
- [光照API](./lighting/) - 光照配置和计算
- [相机API](./camera/) - 相机控制和投影

### 实现模块
- **渲染器核心**: `/packages/renderer/core/`
- **几何体处理**: `/packages/renderer/geometry/`
- **材质系统**: `/packages/renderer/materials/`
- **着色器编译**: `/packages/renderer/shaders/`

### 示例项目
- **PBR渲染演示**: 完整的PBR材质渲染
- **实时阴影系统**: 动态阴影映射实现
- **延迟渲染**: G-Buffer和光照通道
- **VR渲染应用**: WebXR集成示例

### 参考资源
- **USD官方文档**: [OpenUSD规范](https://graphics.pixar.com/usd/release/index.html)
- **PBR理论**: [迪士尼的BRDF](https://disney-animation.s3.amazonaws.com/library/s2012_pbs_disney_brdf_notes.pdf)
- **Vulkan指南**: [Vulkan渲染管线](https://www.khronos.org/vulkan/)

---

**备注**: 这是导航式概览文档。详细的API接口、实现代码和高级功能请参考对应的专门模块。渲染规范为现代3D应用提供完整的渲染解决方案。