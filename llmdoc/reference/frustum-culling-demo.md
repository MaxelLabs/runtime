# 视锥剔除 Demo

## 概述
实现了大规模场景中的视锥剔除技术，动态剔除不可见物体以提升渲染性能。

## 技术要点

### 1. 视锥体提取
- 从视图投影矩阵提取6个裁剪平面
- 左、右、上、下、近、远平面
- 平面归一化确保正确的距离计算

### 2. 包围球测试
- 为每个立方体创建包围球
- 支持变换矩阵应用（缩放因子）
- 高效的相交测试算法

### 3. 剔除算法
- CPU端实现，每帧更新
- 支持8000+物体的大规模场景
- 可动态启用/禁用剔除

## 实现细节

### 文件结构
```
src/
├── frustum-culling.ts          # 主实现
└── utils/culling/
    ├── Frustum.ts              # 视锥体工具类
    └── BoundingSphere.ts       # 包围球工具类
```

### 核心类

#### Frustum类
```typescript
export class Frustum {
  planes: Plane[] = [];  // 6个裁剪平面

  setFromProjectionMatrix(matrix: Matrix4): void
  intersectsSphere(sphere: BoundingSphere): boolean
}
```

#### BoundingSphere类
```typescript
export class BoundingSphere {
  center: Vector3;
  radius: number;

  static fromVertices(vertices: Float32Array): BoundingSphere
  static fromCubeSize(size: number): BoundingSphere
  applyMatrix4(matrix: Matrix4): BoundingSphere
}
```

### 性能优化

#### 1. 批量渲染
- 所有物体共享同一套几何体
- 只更新变换矩阵和颜色

#### 2. Uniform更新优化
- 合并多个Uniform为单个缓冲区
- 使用std140布局对齐

#### 3. 剔除效率
- O(n)时间复杂度
- 支持50%+的剔除率

## 使用方法

### 运行Demo
```bash
cd packages/rhi
npm run dev
# 访问 http://localhost:3003/demo/html/frustum-culling.html
```

### 控制面板
- **场景规模**: 调整物体网格大小（10x10x10 - 30x30x30）
- **启用视锥剔除**: 切换剔除开关
- **重建场景**: 重新生成物体布局

### 相机控制
- **鼠标左键拖拽**: 旋转相机
- **鼠标右键拖拽**: 平移相机
- **鼠标滚轮**: 缩放
- **R键**: 重置相机

## 性能指标

### 测试场景
- 默认：20x20x20 = 8000个立方体
- 最大支持：30x30x30 = 27000个立方体

### 性能目标
- 8000物体场景：60FPS+
- 剔除率：50%+（取决于视角）
- Draw Call减少：50%+

## 技术特点

### 1. 准确性
- 精确的视锥体计算
- 保守的包围球估计

### 2. 可扩展性
- 工具类可复用于其他Demo
- 支持不同的包围体类型

### 3. 实时性
- 每帧更新剔除状态
- 即时响应视角变化

## 适用场景

1. **大规模场景渲染**
   - 城市环境
   - 森林场景
   - 室内场景

2. **游戏引擎**
   - 实时渲染
   - 性能优化

3. **3D可视化**
   - 数据可视化
   - CAD系统

## Constitution合规性

✅ **坐标系**: 右手坐标系
✅ **矩阵**: 列主序存储
✅ **资源管理**: 使用runner.track()追踪
✅ **UI布局**: Stats左上、GUI右上、Info左下
✅ **着色器**: GLSL 300 es，std140布局