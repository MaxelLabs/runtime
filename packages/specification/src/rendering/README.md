# Rendering 模块

## 概述

Rendering 模块定义了 Maxellabs 3D Engine 的渲染管线规范，包括几何体渲染、材质系统和着色器管理等高级渲染功能。

## 主要功能

### 几何体渲染系统
- **网格几何体**: 完整的网格渲染支持
- **基础几何体**: 立方体、球体等基础图形
- **曲线和点云**: 矢量图形和粒子系统支持
- **体积渲染**: 3D体积数据渲染
- **实例化渲染**: 高性能批量渲染

### 材质系统
- **PBR材质**: 基于物理的渲染材质
- **着色器管理**: 顶点、片段、计算着色器
- **纹理系统**: 多种纹理类型和采样模式
- **材质变体**: 动态材质切换和LOD

### 渲染优化
- **LOD系统**: 距离级别细节优化
- **几何体优化**: 顶点合并、索引优化、压缩
- **缓存策略**: 多种缓存算法支持
- **批次渲染**: 自动批次合并和优化

## 核心类型

### 几何体类型层次
```typescript
// 几何体类型
GeometryPrim (基础接口)
├── MeshGeometry          // 网格几何体
├── PrimitiveGeometry     // 基础几何体
├── CurveGeometry         // 曲线几何体
├── PointsGeometry        // 点云几何体
├── VolumeGeometry        // 体积几何体
└── InstancerGeometry     // 实例化几何体
```

### 材质系统层次
```typescript
// 材质类型
MaterialPrim (基础接口)
├── PBRMaterial           // PBR材质
├── UnlitMaterial         // 无光照材质
├── MaterialGraph         // 节点材质
└── MaterialInstance      // 材质实例
```

## 使用示例

### 创建网格几何体（使用命名空间）
```typescript
import { Rendering } from '@maxellabs/specification';

const meshGeometry: Rendering.MeshGeometry = {
  typeName: 'Geometry',
  attributes: {
    points: { value: vertices },
    faceVertexIndices: { value: indices },
    faceVertexCounts: { value: faceCounts },
    normals: { value: normals },
    uvs: { value: uvCoords }
  },
  properties: {
    geometryType: Rendering.GeometryType.Mesh,
    topology: Rendering.TopologyType.Triangles,
    vertexCount: vertices.length,
    triangleCount: indices.length / 3
  }
};
```

### 配置PBR材质（使用命名空间）
```typescript
import { Rendering, MaterialType } from '@maxellabs/specification';

const pbrMaterial: Rendering.PBRMaterial = {
  typeName: 'Material',
  materialType: MaterialType.PBR, // 使用 core 模块的类型
  properties: {
    albedo: [1.0, 1.0, 1.0, 1.0],
    metallic: 0.0,
    roughness: 0.5,
    normalScale: 1.0
  },
  textures: {
    albedoTexture: '/textures/diffuse.jpg',
    normalTexture: '/textures/normal.jpg',
    roughnessTexture: '/textures/roughness.jpg'
  }
};
```

### 设置LOD配置（使用命名空间）
```typescript
import { Rendering } from '@maxellabs/specification';

const lodConfig: Rendering.LODConfiguration = {
  levels: [
    {
      level: 0,
      distance: [0, 50],
      geometryRef: '/geometry/high_detail',
      qualityFactor: 1.0,
      triangleCount: 10000
    },
    {
      level: 1,
      distance: [50, 200],
      geometryRef: '/geometry/medium_detail',
      qualityFactor: 0.5,
      triangleCount: 2500
    }
  ],
  distanceMode: Rendering.DistanceMode.BoundingSphere
};
```

## 设计原则

1. **性能优先**: 所有渲染功能都考虑性能优化
2. **扩展性**: 支持自定义着色器和材质
3. **平台兼容**: 支持WebGL/WebGL2/WebGPU多种渲染API
4. **数据驱动**: 基于USD数据格式的渲染管线

## 与其他模块的关系

- **扩展 core**: 基于core模块的基础类型
- **补充 common**: 提供比common/rendering更详细的渲染功能
- **被 engine 使用**: 作为引擎的渲染后端
- **依赖 Package**: 使用包格式中的优化配置（通过 Package 命名空间）

## 渲染管线架构

```
输入数据 (USD Geometry + Material)
    ↓
几何体处理 (顶点变换、剔除)
    ↓
材质绑定 (着色器选择、参数设置)
    ↓
批次合并 (实例化、状态排序)
    ↓
渲染输出 (Frame Buffer)
```

## 优化特性

### 几何体优化
- **顶点缓存优化**: 减少顶点着色器调用
- **索引压缩**: 降低内存占用
- **几何体简化**: 自适应LOD

### 材质优化
- **着色器变体**: 条件编译优化
- **纹理压缩**: 多种压缩格式支持
- **材质实例化**: 共享着色器资源

### 渲染优化
- **视锥剔除**: GPU加速的剔除
- **遮挡剔除**: 硬件遮挡查询
- **批次合并**: 减少绘制调用

## 命名空间使用

从 v0.0.6 开始，Rendering 模块通过命名空间导出，避免与其他模块的命名冲突：

```typescript
// 推荐的导入方式
import { Rendering } from '@maxellabs/specification';

// 使用时加上命名空间前缀
const geometry: Rendering.MeshGeometry = { ... };
const material: Rendering.PBRMaterial = { ... };

// core 模块的类型仍可直接导入
import { MaterialType } from '@maxellabs/specification';
```

## 注意事项

- 渲染功能与common/rendering形成互补关系
- 支持运行时着色器编译和热重载
- 材质系统兼容USD MaterialX标准
- LOD切换支持平滑过渡动画
- 使用命名空间导出避免类型名称冲突 