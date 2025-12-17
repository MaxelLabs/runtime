# 资产管理示例

> 完整的资产加载和管理系统 - **导航式文档**
> 详细实现请参考专门的代码模块

## 📖 概览

展示完整的资产管道流程，包括USD资产解析、RHI资源创建、内存优化、异步加载和跨平台兼容性处理。

### 核心特性
- **多格式支持**: USD、GLTF、OBJ、FBX等标准格式
- **异步加载**: 并行、流式、进度监控
- **内存管理**: GPU优化、LRU缓存、动态调整
- **性能优化**: 预加载、压缩支持、批处理

## 🏗️ 文档结构

### 核心模块
- [资产类型定义](#资产类型定义) - 基础数据结构
- [资产加载器](#资产加载器) - 多格式加载管理
- [USD处理器](#usd处理器) - USD专用解析器
- [RHI资源管理器](#rhi资源管理器) - GPU资源转换

### 功能特性
- [异步加载系统](#异步加载系统) - 并行和流式加载
- [内存管理](#内存管理) - GPU内存优化
- [性能优化](#性能优化) - 缓存和压缩策略
- [最佳实践](#最佳实践) - 开发建议

## 🚀 快速开始

### 1. 基础使用
```typescript
import { AssetLoadManager } from './asset-loader';
import { RHIResourceManager } from './rhi-resource-manager';

const loadManager = new AssetLoadManager();
const resourceManager = new RHIResourceManager(device);

// 加载资产
const asset = await loadManager.loadAsset('model.usd', {
  progressCallback: (p) => console.log(`${p.loaded}% - ${p.stage}`)
});

// 创建GPU资源
const gpuResource = resourceManager.createMeshResource(asset);
```

### 2. 场景加载
```typescript
const pipeline = new AssetPipelineDemo(device);

// 预加载关键资产
await pipeline.preloadCriticalAssets([
  'assets/textures/ground.jpg',
  'assets/models/character.usd'
]);

// 加载完整场景
await pipeline.loadScene('assets/scenes/main_scene.usd');
```

## 📋 支持的格式

### 3D模型格式
- **USD**: .usd, .usda, .usdc (完整解析和验证)
- **GLTF**: .gltf, .glb (WebGL首选)
- **标准格式**: .obj, .fbx

### 纹理格式
- **标准图片**: .png, .jpg, .jpeg, .webp
- **压缩纹理**: .ktx2, .exr, .hdr
- **程序化**: 噪声、渐变、棋盘格

### 其他格式
- **音频**: .mp3, .wav
- **着色器**: .wgsl, .glsl
- **材质**: .json (自定义格式)

## 🛠️ 核心组件

### 资产类型定义

完整的资产数据结构，支持：
- **基础资产**: UUID、名称、路径、状态管理
- **网格资产**: 几何数据、LOD级别、材质引用
- **纹理资产**: 格式、尺寸、压缩、Mipmap
- **材质资产**: 着色器、参数、渲染状态
- **USD资产**: 阶段信息、图层、基元层次
- **动画资产**: 关键帧、插值、骨架绑定
- **场景资产**: 层次结构、环境、光照

### 资产加载器

多格式异步加载管理器：
```typescript
// 支持的加载器
const loaders = {
  'gltf': GLTFLoader,     // GLTF/GLB加载
  'usd': USDLoader,       // USD专用加载器
  'obj': OBJLoader,       // OBJ格式加载
  'ktx2': KTX2Loader,     // 压缩纹理
  'exr': EXRLoader        // HDR纹理
};

// 并行加载管理
await loadManager.loadAssets([
  'model1.gltf',
  'texture1.jpg',
  'material.json'
]);
```

### USD处理器

专业的USD解析器：
- **格式支持**: ASCII (.usda)、二进制 (.usdc)、通用 (.usd)
- **解析功能**: 阶段信息、图层、基元层次结构
- **验证机制**: 路径格式、时间代码、单位检查
- **元数据提取**: 作者、创建日期、注释

### RHI资源管理器

GPU资源转换和内存管理：
```typescript
// 网格资源转换
const meshResource = resourceManager.createMeshResource(meshAsset);
// 创建: 顶点缓冲区 + 索引缓冲区 + UV缓冲区

// 纹理资源转换
const textureResource = resourceManager.createTextureResource(textureAsset);
// 上传: 解压缩 + GPU传输 + 采样器创建

// 内存管理
resourceManager.garbageCollect(60000); // 清理60秒未使用资源
```

## 🔄 异步加载系统

### 并行加载
```typescript
// 批量加载
const assets = await loadManager.loadAssets([
  'models/character.usd',
  'textures/diffuse.jpg',
  'materials/pbr.json'
]);

// 场景依赖加载
const sceneAsset = await loadManager.loadAsset('scene.usd');
await loadManager.loadAssets(sceneAsset.dependencies);
```

### 流式加载
```typescript
// 大文件分块下载
await pipeline.streamLargeAsset('huge_level.usd', 1024 * 1024);
// 进度: 0% → 25% → 50% → 75% → 100%
```

### 进度监控
```typescript
const asset = await loadManager.loadAsset(url, {
  progressCallback: (progress) => {
    console.log(`${progress.loaded}% - ${progress.stage}`);
    // 阶段: downloading → parsing → validating → creating_resources
  }
});
```

## 💾 内存管理

### GPU内存优化
```typescript
const memoryInfo = resourceManager.getMemoryInfo();
console.log({
  used: memoryInfo.used,        // 已使用内存
  budget: memoryInfo.budget,    // 内存预算
  available: memoryInfo.available, // 可用内存
  fragmentation: memoryInfo.fragmentation // 碎片率
});
```

### 缓存策略
- **LRU**: 最近最少使用 (默认)
- **LFU**: 最少使用频率
- **FIFO**: 先进先出
- **NONE**: 不缓存

### 动态质量调整
```typescript
// 基于内存使用率自动调整
pipeline.adjustQualityBasedOnMemory();
// >80%: 降低质量，释放非必要纹理
// <40%: 提升质量，重新加载高清资源
```

## ⚡ 性能优化

### 预加载策略
```typescript
// 关键资产优先加载
await pipeline.preloadCriticalAssets([
  'player_character.usd',  // 玩家角色
  'ui_texture.jpg',        // UI贴图
  'main_theme.mp3'         // 主题音乐
]);
```

### 压缩支持
- **纹理压缩**: DXT1、DXT5、ASTC、BC7
- **资产压缩**: ZIP/GZIP打包
- **格式优化**: 平台自适应格式选择

### 批处理优化
```typescript
// 批量创建GPU资源
await resourceManager.preloadAssets(assetList);
// 并行处理 + 内存分配优化
```

## 📊 最佳实践

### 1. 资产组织结构
```
assets/
├── textures/          # 纹理资源
│   ├── characters/    # 角色贴图
│   ├── environments/  # 环境贴图
│   └── ui/           # UI贴图
├── models/           # 3D模型
│   ├── characters/   # 角色模型
│   ├── props/        # 道具模型
│   └── levels/       # 场景模型
├── materials/        # 材质定义
├── scenes/          # 场景文件
└── audio/           # 音频资源
```

### 2. 错误处理
```typescript
try {
  const asset = await loadManager.loadAsset(url);
  // 使用资产...
} catch (error) {
  // 降级处理
  const fallback = await loadManager.loadAsset(fallbackUrl);
  // 或使用占位符资产
}
```

### 3. 内存监控
```typescript
setInterval(() => {
  const memInfo = resourceManager.getMemoryInfo();
  const usage = memInfo.used / memInfo.budget;

  if (usage > 0.8) {
    console.warn('内存使用率过高，执行清理');
    resourceManager.garbageCollect(30000);
  }
}, 10000);
```

### 4. 性能分析
```typescript
// 加载时间统计
const start = performance.now();
await pipeline.loadScene(sceneURL);
const loadTime = performance.now() - start;

// 内存使用统计
const stats = pipeline.exportStatistics();
console.log(`加载时间: ${loadTime.toFixed(2)}ms`);
console.log(`内存使用: ${(stats.memoryUsage.used / 1024 / 1024).toFixed(1)}MB`);
```

## 🔗 相关资源

### 实现文件
- **资产类型**: `./asset-types.ts` - 完整类型定义
- **加载管理**: `./asset-loader.ts` - 多格式加载器
- **USD处理**: `./usd-loader.ts` - USD专用解析器
- **资源管理**: `./rhi-resource-manager.ts` - GPU资源管理
- **演示代码**: `./asset-pipeline-demo.ts` - 完整使用示例

### API文档
- [RHI API规范](../specification/rendering/) - 底层渲染接口
- [USD文档链接](https://graphics.pixar.com/usd/release/index.html) - USD官方文档

### 性能指标
- **加载速度**: 100MB场景 < 2秒
- **内存效率**: GPU内存占用 < 512MB
- **并发能力**: 支持4个并行加载任务
- **缓存命中**: LRU策略 > 85%命中率

## 🔮 扩展功能

### 建议扩展
1. **资产包系统**: 打包/解包，减少网络请求
2. **版本管理**: 热更新，增量更新
3. **CDN集成**: 云端分发，就近加载
4. **预计算**: 离线预处理，运行时优化
5. **调试工具**: 可视化界面，实时监控

### 高级特性
- **智能预测**: 基于用户行为的预加载
- **自适应质量**: 根据设备性能动态调整
- **分布式加载**: 多服务器并行下载
- **缓存持久化**: 本地缓存管理

---

**备注**: 这是导航式概览文档。详细的实现代码、API接口和高级功能请参考对应的专门模块。该资产管理系统支持现代3D应用的完整资产管道需求。