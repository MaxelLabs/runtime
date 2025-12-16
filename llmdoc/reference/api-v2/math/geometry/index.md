# 几何体扩展API文档

## 概述

Math库的几何体模块提供了一套完整的3D几何计算工具，包括包围盒、球体、射线、平面等几何体类型，以及它们之间的相交检测、空间查询等功能。这些工具广泛应用于碰撞检测、视锥剔除、射线拾取等3D应用场景。

# Box3 - 三维包围盒

## 概述

`Box3`表示轴对齐包围盒（Axis-Aligned Bounding Box），是3D空间中最常用的包围体。用于快速进行碰撞检测、视锥剔除和空间分割。

## 构造函数

```typescript
new Box3(min?: Vector3, max?: Vector3)
```

**参数：**
- `min: Vector3` - 最小角点，默认为(∞, ∞, ∞)表示空包围盒
- `max: Vector3` - 最大角点，默认为(-∞, -∞, -∞)

## 基础方法

### 设置和初始化
```typescript
// 设置包围盒
set(min: Vector3, max: Vector3): Box3

// 从数组创建包围盒（每三个元素一个点）
setFromArray(array: number[]): Box3

// 从点集创建包围盒
setFromPoints(points: Vector3[]): Box3

// 从中心和大小创建包围盒
setFromCenterAndSize(center: Vector3, size: Vector3): Box3

// 设置为空包围盒
makeEmpty(): Box3

// 判断是否为空包围盒
isEmpty(): boolean
```

### 包围盒属性
```typescript
// 获取中心点
getCenter(target?: Vector3): Vector3

// 获取大小
getSize(target?: Vector3): Vector3

// 获取顶点
getPoints(points?: Vector3[]): Vector3[]
getBoundingBox(target?: Box3): Box3
```

### 包围盒操作
```typescript
// 扩展包围盒以包含点
expandByPoint(point: Vector3): Box3

// 扩展包围盒以包含向量
expandByVector(vector: Vector3): Box3

// 扩展包围盒以包含标量值
expandByScalar(scalar: number): Box3

// 扩展包围盒以包含另一个包围盒
union(box: Box3): Box3

// 计算与另一个包围盒的交集
intersect(box: Box3): Box3

// 平移包围盒
translate(offset: Vector3): Box3
```

### 相交检测
```typescript
// 判断与点相交
containsPoint(point: Vector3): boolean

// 判断包含另一个包围盒
containsBox(box: Box3): boolean

// 获取点到包围盒的最近点
clampPoint(point: Vector3, target?: Vector3): Vector3

// 计算点到包围盒的距离
distanceToPoint(point: Vector3): number

// 与包围盒相交测试
intersectsBox(box: Box3): boolean

// 与球体相交测试
intersectsSphere(sphere: Sphere): boolean

// 与平面相交测试
intersectsPlane(plane: Plane): boolean

// 与凸包相交测试（SAT算法）
intersectsConvexHull(hull: Vector3[]): boolean
```

### 变换操作
```typescript
// 应用矩阵变换
applyMatrix4(matrix: Matrix4): Box3

// 应用4x4矩阵变换（非仿射变换）
applyTransform(transform: Transform): Box3
```

## 应用示例

### 视锥剔除
```typescript
class FrustumCulling {
  private frustumPlanes: Plane[];
  private tempBox: Box3;

  constructor() {
    this.frustumPlanes = [
      Plane.create(), Plane.create(), Plane.create(),
      Plane.create(), Plane.create(), Plane.create()
    ];
    this.tempBox = Box3.create();
  }

  // 从投影视图矩阵更新视锥平面
  updateFrustum(viewProjectionMatrix: Matrix4): void {
    // 提取6个裁剪平面
    const m = viewProjectionMatrix.elements;

    // 左平面: m30 + m00
    this.frustumPlanes[0].setComponents(m[3] + m[0], m[7] + m[4], m[11] + m[8], m[15] + m[12]).normalize();
    // 右平面: m30 - m00
    this.frustumPlanes[1].setComponents(m[3] - m[0], m[7] - m[4], m[11] - m[8], m[15] - m[12]).normalize();
    // ...其他平面
  }

  // 检测包围盒是否在视锥内
  isBoxVisible(box: Box3): boolean {
    // 检查所有6个平面
    for (let i = 0; i < 6; i++) {
      const plane = this.frustumPlanes[i];

      // 获取包围盒在平面上投影最远的点
      let maxDistance = -Infinity;
      for (let corner = 0; corner < 8; corner++) {
        const point = this.getBoxCorner(box, corner);
        const distance = plane.distanceToPoint(point);
        maxDistance = Math.max(maxDistance, distance);
      }

      // 如果所有点都在平面背面，则包围盒不可见
      if (maxDistance < 0) {
        return false;
      }
    }

    return true;
  }

  private getBoxCorner(box: Box3, index: number): Vector3 {
    const { min, max } = box;
    return Vector3.create().set(
      (index & 1) ? max.x : min.x,
      (index & 2) ? max.y : min.y,
      (index & 4) ? max.z : min.z
    );
  }
}
```

### 空间分割 - 八叉树
```typescript
class OctreeNode {
  public bounds: Box3;
  public children: OctreeNode[] | null;
  public objects: any[];

  constructor(bounds: Box3, maxDepth = 8, depth = 0) {
    this.bounds = bounds;
    this.children = null;
    this.objects = [];
    this.maxDepth = maxDepth;
    this.depth = depth;
  }

  // 插入对象
  insert(object: { bounds: Box3 }): void {
    // 如果对象不完全包含在此节点，添加到此节点
    if (!this.bounds.containsBox(object.bounds)) {
      this.objects.push(object);
      return;
    }

    // 如果达到最大深度或没有子节点，添加到此节点
    if (this.depth >= this.maxDepth || !this.children) {
      this.objects.push(object);

      // 如果对象数量超过阈值且未达到最大深度，分割节点
      if (this.objects.length > 8 && this.depth < this.maxDepth) {
        this.subdivide();
      }
      return;
    }

    // 尝试插入到子节点
    for (const child of this.children) {
      child.insert(object);
    }
  }

  // 分割节点为8个子节点
  private subdivide(): void {
    if (this.children) return;

    const center = this.bounds.getCenter();
    const size = this.bounds.getSize().multiplyScalar(0.5);

    this.children = [];
    for (let i = 0; i < 8; i++) {
      const childMin = Vector3.create().copy(center);
      const childMax = Vector3.create().copy(center);

      if (i & 1) {
        childMin.x -= size.x;
        childMax.x += size.x;
      } else {
        childMin.x += size.x;
        childMax.x += size.x;
      }

      if (i & 2) {
        childMin.y -= size.y;
        childMax.y += size.y;
      } else {
        childMin.y += size.y;
        childMax.y += size.y;
      }

      if (i & 4) {
        childMin.z -= size.z;
        childMax.z += size.z;
      } else {
        childMin.z += size.z;
        childMax.z += size.z;
      }

      const childBounds = Box3.create().setFromCenterAndSize(
        childMin.add(childMax).multiplyScalar(0.5),
        childMax.sub(childMin)
      );

      this.children.push(new OctreeNode(childBounds, this.maxDepth, this.depth + 1));
    }
  }

  // 查询与包围盒相交的对象
  query(bounds: Box3, result: any[] = []): any[] {
    // 如果查询范围不与此节点相交，返回空结果
    if (!this.bounds.intersectsBox(bounds)) {
      return result;
    }

    // 添加此节点中相交的对象
    for (const object of this.objects) {
      if (bounds.intersectsBox(object.bounds)) {
        result.push(object);
      }
    }

    // 递归查询子节点
    if (this.children) {
      for (const child of this.children) {
        child.query(bounds, result);
      }
    }

    return result;
  }
}
```

# Sphere - 球体

## 概述

`Sphere`表示3D空间中的球体，常用于快速碰撞检测、影响范围计算和视锥剔除。

## 构造函数

```typescript
new Sphere(center?: Vector3, radius?: number)
```

**参数：**
- `center: Vector3` - 球心，默认为原点
- `radius: number` - 半径，默认为0

## 方法详解

### 基础操作
```typescript
// 设置球体
set(center: Vector3, radius: number): Sphere

// 设置球心
setCenter(center: Vector3): Sphere

// 设置半径
setRadius(radius: number): Sphere

// 复制球体
copy(sphere: Sphere): Sphere

// 克隆球体
clone(): Sphere

// 设置为空球体
makeEmpty(): Sphere

// 判断是否为空球体
isEmpty(): boolean
```

### 包围操作
```typescript
// 从点集创建包围球
setFromPoints(points: Vector3[]): Sphere

// 扩展球体以包含点
expandByPoint(point: Vector3): Sphere

// 扩展球体以包含另一个球体
union(sphere: Sphere): Sphere

// 从包围盒创建包围球
setFromBox(box: Box3): Sphere
```

### 相交检测
```typescript
// 判断与点相交
containsPoint(point: Vector3): boolean

// 计算点到球体表面的距离
distanceToPoint(point: Vector3): number

// 与球体相交测试
intersectsSphere(sphere: Sphere): boolean

// 与包围盒相交测试
intersectsBox(box: Box3): boolean

// 与平面相交测试
intersectsPlane(plane: Plane): boolean
```

### 变换操作
```typescript
// 应用矩阵变换
applyMatrix4(matrix: Matrix4): Sphere

// 平移球体
translate(offset: Vector3): Sphere
```

### 裁剪操作
```typescript
// 获取与平面的交点
intersectPlane(plane: Plane, target?: { normal: Vector3, point: Vector3 }): { normal: Vector3, point: Vector3 } | null

// 获取与射线的交点
intersectRay(ray: Ray, target?: Vector3[]): Vector3[]
```

## 应用示例

### 空间索引 - 均匀网格
```typescript
class SpatialGrid {
  private cellSize: number;
  private grid: Map<string, Sphere[]>;
  private bounds: Box3;
  private tempKey: Vector3;

  constructor(bounds: Box3, cellSize: number) {
    this.cellSize = cellSize;
    this.grid = new Map();
    this.bounds = bounds;
    this.tempKey = Vector3.create();
  }

  // 获取网格键
  private getGridKey(position: Vector3): string {
    const x = Math.floor(position.x / this.cellSize);
    const y = Math.floor(position.y / this.cellSize);
    const z = Math.floor(position.z / this.cellSize);
    return `${x},${y},${z}`;
  }

  // 插入球体
  insert(sphere: Sphere): void {
    const min = Vector3.create().copy(sphere.center).subScalar(sphere.radius);
    const max = Vector3.create().copy(sphere.center).addScalar(sphere.radius);

    const minX = Math.floor(min.x / this.cellSize);
    const maxX = Math.floor(max.x / this.cellSize);
    const minY = Math.floor(min.y / this.cellSize);
    const maxY = Math.floor(max.y / this.cellSize);
    const minZ = Math.floor(min.z / this.cellSize);
    const maxZ = Math.floor(max.z / this.cellSize);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const key = `${x},${y},${z}`;

          if (!this.grid.has(key)) {
            this.grid.set(key, []);
          }

          this.grid.get(key)!.push(sphere);
        }
      }
    }
  }

  // 查询与球体相交的对象
  querySphere(querySphere: Sphere): Sphere[] {
    const result: Sphere[] = [];
    const min = Vector3.create().copy(querySphere.center).subScalar(querySphere.radius);
    const max = Vector3.create().copy(querySphere.center).addScalar(querySphere.radius);

    const minX = Math.floor(min.x / this.cellSize);
    const maxX = Math.floor(max.x / this.cellSize);
    const minY = Math.floor(min.y / this.cellSize);
    const maxY = Math.floor(max.y / this.cellSize);
    const minZ = Math.floor(min.z / this.cellSize);
    const maxZ = Math.floor(max.z / this.cellSize);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const key = `${x},${y},${z}`;
          const cellObjects = this.grid.get(key);

          if (cellObjects) {
            for (const sphere of cellObjects) {
              if (sphere.intersectsSphere(querySphere)) {
                result.push(sphere);
              }
            }
          }
        }
      }
    }

    return result;
  }
}
```

### 动态影响范围
```typescript
class InfluenceSystem {
  private influencers: Map<string, { sphere: Sphere, strength: number }>;
  private queryResult: Vector3[];

  constructor() {
    this.influencers = new Map();
    this.queryResult = [];
  }

  // 添加影响源
  addInfluencer(id: string, position: Vector3, radius: number, strength: number): void {
    const sphere = Sphere.create().set(position, radius);
    this.influencers.set(id, { sphere, strength });
  }

  // 更新影响源位置
  updateInfluencer(id: string, position: Vector3): void {
    const influencer = this.influencers.get(id);
    if (influencer) {
      influencer.sphere.center.copy(position);
    }
  }

  // 计算点的总影响值
  calculateInfluence(point: Vector3): number {
    let totalInfluence = 0;

    for (const { sphere, strength } of this.influencers.values()) {
      if (sphere.containsPoint(point)) {
        // 根据距离计算衰减
        const distance = sphere.center.distanceTo(point);
        const normalizedDistance = distance / sphere.radius;
        const falloff = 1 - normalizedDistance; // 线性衰减

        totalInfluence += strength * falloff;
      }
    }

    return Math.min(totalInfluence, 1.0); // 限制最大值为1.0
  }

  // 获取影响范围内的所有影响源
  getInfluencersInRange(point: Vector3, radius: number): string[] {
    const querySphere = Sphere.create().set(point, radius);
    const result: string[] = [];

    for (const [id, { sphere }] of this.influencers.entries()) {
      if (sphere.intersectsSphere(querySphere)) {
        result.push(id);
      }
    }

    Sphere.release(querySphere);
    return result;
  }
}
```

# Ray - 射线

## 概述

`Ray`表示3D空间中的射线，由起点和方向定义。广泛应用于射线拾取、视线检测、碰撞检测等场景。

## 构造函数

```typescript
new Ray(origin?: Vector3, direction?: Vector3)
```

**参数：**
- `origin: Vector3` - 射线起点，默认为原点
- `direction: Vector3` - 射线方向，默认为(0, 0, -1)

## 方法详解

### 基础操作
```typescript
// 设置射线
set(origin: Vector3, direction: Vector3): Ray

// 复制射线
copy(ray: Ray): Ray

// 克隆射线
clone(): Ray

// 获取指定参数位置的点
at(t: number, target?: Vector3): Vector3

// 获取到指定点的距离平方
distanceToPointSquared(point: Vector3): number

// 获取到指定点的距离
distanceToPoint(point: Vector3): number

// 获取到指定点的最近点
closestPointToPoint(point: Vector3, target?: Vector3): Vector3
```

### 相交检测
```typescript
// 与球体相交检测
intersectSphere(sphere: Sphere, target?: Vector3): Vector3 | null

// 与包围盒相交检测
intersectBox(box: Box3, target?: Vector3): Vector3 | null

// 与平面相交检测
intersectPlane(plane: Plane, target?: Vector3): Vector3 | null

// 与三角形相交检测
intersectTriangle(a: Vector3, b: Vector3, c: Vector3, backfaceCulling?: boolean, target?: Vector3): Vector3 | null
```

### 变换操作
```typescript
// 应用矩阵变换
applyMatrix4(matrix: Matrix4): Ray

// 应用方向变换（仅旋转方向）
applyDirectionTransform(matrix: Matrix4): Ray
```

## 应用示例

### 射线拾取系统
```typescript
class RaycastingSystem {
  private camera: Camera;
  private raycaster: Raycaster;
  private intersectedObjects: any[];
  private ray: Ray;

  constructor(camera: Camera) {
    this.camera = camera;
    this.raycaster = new Raycaster();
    this.intersectedObjects = [];
    this.ray = Ray.create();
  }

  // 从屏幕坐标发射射线
  castFromScreen(screenX: number, screenY: number, canvasWidth: number, canvasHeight: number): void {
    // 转换为NDC坐标
    const ndcX = (screenX / canvasWidth) * 2 - 1;
    const ndcY = -(screenY / canvasHeight) * 2 + 1;

    // 创建射线
    this.raycaster.setFromCamera(new Vector2(ndcX, ndcY), this.camera);
  }

  // 检测与网格的交点
  intersectMeshes(meshes: Mesh[]): any[] {
    this.intersectedObjects.length = 0;

    for (const mesh of meshes) {
      const intersections = this.raycaster.intersectObject(mesh, true);

      for (const intersection of intersections) {
        this.intersectedObjects.push({
          object: intersection.object,
          point: intersection.point,
          distance: intersection.distance,
          face: intersection.face,
          faceIndex: intersection.faceIndex,
          uv: intersection.uv
        });
      }
    }

    // 按距离排序
    this.intersectedObjects.sort((a, b) => a.distance - b.distance);

    return this.intersectedObjects;
  }

  // 检测与地形的高度图交点
  intersectTerrain(heightMap: Float32Array, terrainSize: number, terrainScale: Vector3): Vector3 | null {
    const ray = this.raycaster.ray;
    const step = terrainScale.x / heightMap.length;

    // 沿射线步进检测
    const maxDistance = 1000;
    const stepCount = Math.floor(maxDistance / step);

    for (let i = 0; i < stepCount; i++) {
      const t = i * step;
      const point = ray.at(t);

      // 转换为高度图坐标
      const x = Math.floor((point.x + terrainScale.x * 0.5) / terrainScale.x * heightMap.length);
      const z = Math.floor((point.z + terrainScale.z * 0.5) / terrainScale.z * heightMap.length);

      if (x >= 0 && x < heightMap.length && z >= 0 && z < heightMap.length) {
        const height = heightMap[z * heightMap.length + x] * terrainScale.y;

        if (point.y <= height) {
          return point;
        }
      }
    }

    return null;
  }

  // 自定义相交检测（粒子系统）
  intersectParticles(particles: Particle[], particleRadius: number): any[] {
    const results: any[] = [];
    const ray = this.raycaster.ray;

    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      const particleSphere = Sphere.create().set(particle.position, particleRadius);

      const intersection = ray.intersectSphere(particleSphere);

      if (intersection) {
        results.push({
          particle: particle,
          point: intersection,
          index: i,
          distance: ray.origin.distanceTo(intersection)
        });
      }

      Sphere.release(particleSphere);
    }

    // 按距离排序
    results.sort((a, b) => a.distance - b.distance);

    return results;
  }
}
```

### 视线系统
```typescript
class LineOfSightSystem {
  private obstacles: Box3[];
  private tempRay: Ray;
  private tempSphere: Sphere;

  constructor() {
    this.obstacles = [];
    this.tempRay = Ray.create();
    this.tempSphere = Sphere.create();
  }

  // 添加障碍物
  addObstacle(bounds: Box3): void {
    this.obstacles.push(bounds.clone());
  }

  // 检查两点间是否有视线
  hasLineOfSight(from: Vector3, to: Vector3): boolean {
    // 创建从起点到终点的射线
    const direction = Vector3.create().copy(to).sub(from).normalize();
    const distance = from.distanceTo(to);

    this.tempRay.set(from, direction);

    // 检测与所有障碍物的相交
    for (const obstacle of this.obstacles) {
      const intersection = this.tempRay.intersectBox(obstacle);

      if (intersection && from.distanceTo(intersection) < distance) {
        Vector3.release(direction);
        return false; // 被障碍物阻挡
      }
    }

    Vector3.release(direction);
    return true; // 有视线
  }

  // 获取视线被阻挡的点
  getLineOfSightBlocker(from: Vector3, to: Vector3): { point: Vector3, obstacle: Box3 } | null {
    const direction = Vector3.create().copy(to).sub(from).normalize();
    const distance = from.distanceTo(to);

    this.tempRay.set(from, direction);

    let closestBlocker: { point: Vector3, obstacle: Box3 } | null = null;
    let closestDistance = Infinity;

    for (const obstacle of this.obstacles) {
      const intersection = this.tempRay.intersectBox(obstacle);

      if (intersection) {
        const intersectionDistance = from.distanceTo(intersection);

        if (intersectionDistance < distance && intersectionDistance < closestDistance) {
          closestDistance = intersectionDistance;
          closestBlocker = {
            point: intersection.clone(),
            obstacle: obstacle.clone()
          };
        }
      }
    }

    Vector3.release(direction);
    return closestBlocker;
  }

  // 获取可见区域
  getVisibleArea(observer: Vector3, viewDistance: number, numRays: number): Vector3[] {
    const visiblePoints: Vector3[] = [];
    const viewSphere = Sphere.create().set(observer, viewDistance);

    // 发射多条射线探测可见区域
    for (let i = 0; i < numRays; i++) {
      const theta = (i / numRays) * Math.PI * 2;
      const phi = Math.acos(1 - 2 * (i / numRays));

      const direction = Vector3.create().set(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi)
      );

      this.tempRay.set(observer, direction);

      // 检测与视距球面的交点
      const farPoint = this.tempRay.at(viewDistance);

      // 检测最近的障碍物
      let hitPoint = farPoint;
      let minDistance = viewDistance;

      for (const obstacle of this.obstacles) {
        const intersection = this.tempRay.intersectBox(obstacle);

        if (intersection) {
          const distance = observer.distanceTo(intersection);
          if (distance < minDistance) {
            minDistance = distance;
            hitPoint = intersection;
          }
        }
      }

      visiblePoints.push(hitPoint.clone());

      Vector3.release(direction);
      Vector3.release(farPoint);
    }

    Sphere.release(viewSphere);
    return visiblePoints;
  }
}
```

# Plane - 平面

## 概述

`Plane`表示3D空间中的无限平面，由法向量和距离原点的距离定义。用于空间分割、碰撞检测和视锥裁剪。

## 构造函数

```typescript
new Plane(normal?: Vector3, constant?: number)
```

**参数：**
- `normal: Vector3` - 平面法向量，默认为(0, 1, 0)
- `constant: number` - 距离原点的距离，默认为0

## 方法详解

### 基础操作
```typescript
// 设置平面
set(normal: Vector3, constant: number): Plane

// 设置分量
setComponents(nx: number, ny: number, nz: number, constant: number): Plane

// 复制平面
copy(plane: Plane): Plane

// 克隆平面
clone(): Plane

// 归一化法向量
normalize(): Plane

// 反转平面
negate(): Plane

// 获取点到平面的距离
distanceToPoint(point: Vector3): number
```

### 相交检测
```typescript
// 判断点在平面哪一侧
signedDistanceToPoint(point: Vector3): number

// 投影点到平面
projectPoint(point: Vector3, target?: Vector3): Vector3

// 与射线相交检测
intersectLine(line: Line3, target?: Vector3): Vector3 | null

// 与射线相交检测（Ray对象）
intersectRay(ray: Ray, target?: Vector3): Vector3 | null

// 判定平面与线段的关系
intersectLineSegment(start: Vector3, end: Vector3): {
  intersect: boolean;
  point?: Vector3;
  parameter?: number;
}
```

### 平面关系
```typescript
// 判定两平面是否平行
isParallelTo(plane: Plane): boolean

// 判定两平面是否相等
equals(plane: Plane): boolean

// 获取两平面的交线
coplanarPoint(target?: Vector3): Vector3

// 应用矩阵变换
applyMatrix4(matrix: Matrix4, normalMatrix?: Matrix3): Plane
```

## 应用示例

### 空间分割 - BSP树
```typescript
class BSPNode {
  public plane: Plane | null;
  public front: BSPNode | null;
  public back: BSPNode | null;
  public polygons: any[];

  constructor(polygons: any[] = []) {
    this.plane = null;
    this.front = null;
    this.back = null;
    this.polygons = [];

    if (polygons.length > 0) {
      this.build(polygons);
    }
  }

  // 构建BSP树
  private build(polygons: any[]): void {
    if (polygons.length === 0) return;

    // 选择分割平面（这里使用第一个多边形的平面）
    this.plane = polygons[0].plane.clone();
    const frontPolygons: any[] = [];
    const backPolygons: any[] = [];

    for (const polygon of polygons) {
      this.plane.splitPolygon(polygon, frontPolygons, backPolygons);
    }

    this.polygons = polygons.filter(p => this.plane!.isCoplanarPolygon(p));

    // 递归构建子树
    if (frontPolygons.length > 0) {
      this.front = new BSPNode(frontPolygons);
    }
    if (backPolygons.length > 0) {
      this.back = new BSPNode(backPolygons);
    }
  }

  // 分类多边形
  classifyPolygon(polygon: any): 'front' | 'back' | 'coplanar' | 'spanning' {
    if (!this.plane) return 'front';

    let frontCount = 0;
    let backCount = 0;

    for (const vertex of polygon.vertices) {
      const distance = this.plane.distanceToPoint(vertex.position);

      if (distance > Plane.EPSILON) {
        frontCount++;
      } else if (distance < -Plane.EPSILON) {
        backCount++;
      }
    }

    if (backCount === 0) return 'front';
    if (frontCount === 0) return 'back';
    if (frontCount > 0 && backCount > 0) return 'spanning';
    return 'coplanar';
  }

  // 查询与射线相交的多边形
  intersectRay(ray: Ray, result: any[] = []): any[] {
    if (!this.plane) return result;

    // 检测与分割平面的交点
    const intersection = ray.intersectPlane(this.plane);

    if (!intersection) {
      // 射线与平面平行，检查在平面前面还是后面
      const distance = this.plane.distanceToPoint(ray.origin);

      if (distance > 0 && this.front) {
        return this.front.intersectRay(ray, result);
      } else if (distance < 0 && this.back) {
        return this.back.intersectRay(ray, result);
      }

      return result;
    }

    // 检测交点是否在多边形内
    for (const polygon of this.polygons) {
      if (this.isPointInPolygon(intersection, polygon)) {
        result.push({
          polygon: polygon,
          point: intersection,
          distance: ray.origin.distanceTo(intersection)
        });
      }
    }

    // 继续检测子树
    if (this.front && this.plane.distanceToPoint(ray.origin) >= 0) {
      this.front.intersectRay(ray, result);
    }
    if (this.back && this.plane.distanceToPoint(ray.origin) <= 0) {
      this.back.intersectRay(ray, result);
    }

    return result;
  }

  // 判断点是否在多边形内
  private isPointInPolygon(point: Vector3, polygon: any): boolean {
    // 使用射线法判断点是否在多边形内
    let inside = false;
    const vertices = polygon.vertices;

    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const vi = vertices[i].position;
      const vj = vertices[j].position;

      if (((vi.y > point.y) !== (vj.y > point.y)) &&
          (point.x < (vj.x - vi.x) * (point.y - vi.y) / (vj.y - vi.y) + vi.x)) {
        inside = !inside;
      }
    }

    return inside;
  }
}
```

### 反射系统
```typescript
class ReflectionSystem {
  private reflectors: Array<{ plane: Plane, material: any }>;
  private tempRay: Ray;
  private tempNormal: Vector3;
  private tempPoint: Vector3;

  constructor() {
    this.reflectors = [];
    this.tempRay = Ray.create();
    this.tempNormal = Vector3.create();
    this.tempPoint = Vector3.create();
  }

  // 添加反射面
  addReflector(plane: Plane, material: any): void {
    this.reflectors.push({ plane: plane.clone(), material });
  }

  // 计算反射射线
  reflectRay(incident: Ray): { ray: Ray, point: Vector3, material: any }[] {
    const reflections: { ray: Ray, point: Vector3, material: any }[] = [];

    for (const { plane, material } of this.reflectors) {
      // 检测射线与反射面的交点
      const intersection = incident.intersectPlane(plane);

      if (intersection) {
        // 计算反射方向
        const normal = plane.normal.clone();
        const direction = incident.direction.clone();

        // r = d - 2(d·n)n
        const dot = direction.dot(normal);
        const reflectedDirection = direction.sub(normal.multiplyScalar(2 * dot));

        // 创建反射射线
        const reflectedRay = Ray.create().set(
          intersection.clone().add(normal.multiplyScalar(0.001)), // 稍微偏移避免自相交
          reflectedDirection.normalize()
        );

        reflections.push({
          ray: reflectedRay,
          point: intersection,
          material: material
        });

        Vector3.release(normal);
        Vector3.release(direction);
        Vector3.release(reflectedDirection);
      }
    }

    return reflections;
  }

  // 计算多次反射
  calculateMultipleReflections(
    incident: Ray,
    maxBounces: number
  ): Array<{ ray: Ray, point: Vector3, material: any, depth: number }> {
    const allReflections: Array<{ ray: Ray, point: Vector3, material: any, depth: number }> = [];
    const currentRays: Ray[] = [incident.clone()];

    for (let depth = 0; depth < maxBounces; depth++) {
      if (currentRays.length === 0) break;

      const nextRays: Ray[] = [];

      for (const currentRay of currentRays) {
        const reflections = this.reflectRay(currentRay);

        for (const reflection of reflections) {
          allReflections.push({
            ...reflection,
            depth: depth + 1
          });

          nextRays.push(reflection.ray);
        }
      }

      // 清理当前射线
      for (const ray of currentRays) {
        Ray.release(ray);
      }

      currentRays.length = 0;
      currentRays.push(...nextRays);
    }

    // 清理剩余射线
    for (const ray of currentRays) {
      Ray.release(ray);
    }

    return allReflections;
  }

  // 声音反射模拟
  simulateSoundReflections(
    source: Vector3,
    listener: Vector3,
    maxBounces: number
  ): Array<{ point: Vector3, distance: number, delay: number }> {
    const directRay = Ray.create().set(source,
      Vector3.create().copy(listener).sub(source).normalize()
    );

    const reflections = this.calculateMultipleReflections(directRay, maxBounces);
    const soundPaths: Array<{ point: Vector3, distance: number, delay: number }> = [];

    // 直接传播路径
    const directDistance = source.distanceTo(listener);
    soundPaths.push({
      point: listener.clone(),
      distance: directDistance,
      delay: directDistance / 343 // 声速 343m/s
    });

    // 反射路径
    for (const reflection of reflections) {
      const totalDistance = source.distanceTo(reflection.point) +
                           reflection.point.distanceTo(listener);

      soundPaths.push({
        point: reflection.point,
        distance: totalDistance,
        delay: totalDistance / 343
      });
    }

    Ray.release(directRay);

    // 按延迟排序
    soundPaths.sort((a, b) => a.delay - b.delay);

    return soundPaths;
  }
}
```

# 几何体组合应用

## 空间查询系统

```typescript
class SpatialQuerySystem {
  private octree: Octree;
  private sphereTree: SphereTree;
  private grid: SpatialGrid;

  constructor(bounds: Box3) {
    this.octree = new Octree(bounds);
    this.sphereTree = new SphereTree(bounds);
    this.grid = new SpatialGrid(bounds, 10);
  }

  // 多层次空间查询
  queryRegion(queryBounds: Box3, types: string[]): any[] {
    const results: any[] = [];

    // 第一层：粗略的网格查询
    const candidates = this.grid.queryBox(queryBounds);

    // 第二层：八叉树精确查询
    for (const candidate of candidates) {
      if (types.includes(candidate.type) &&
          queryBounds.intersectsBox(candidate.bounds)) {
        results.push(candidate);
      }
    }

    // 第三层：球体树动态对象查询
    const dynamicObjects = this.sphereTree.queryBox(queryBounds);
    for (const object of dynamicObjects) {
      if (types.includes(object.type)) {
        results.push(object);
      }
    }

    return results;
  }

  // 射线查询
  raycast(ray: Ray, maxDistance?: number): any[] {
    const results: any[] = [];

    // 使用八叉树进行射线查询
    const octreeResults = this.octree.raycast(ray, maxDistance);

    // 使用球体树查询动态对象
    const sphereResults = this.sphereTree.raycast(ray, maxDistance);

    // 合并结果
    results.push(...octreeResults, ...sphereResults);

    // 按距离排序
    results.sort((a, b) => a.distance - b.distance);

    return results;
  }

  // 范围查询（球体）
  querySphere(center: Vector3, radius: number, types?: string[]): any[] {
    const querySphere = Sphere.create().set(center, radius);
    const results: any[] = [];

    // 八叉树查询
    const octreeResults = this.octree.querySphere(querySphere);

    // 球体树查询
    const sphereResults = this.sphereTree.querySphere(querySphere);

    // 类型过滤
    for (const result of [...octreeResults, ...sphereResults]) {
      if (!types || types.includes(result.type)) {
        results.push(result);
      }
    }

    Sphere.release(querySphere);
    return results;
  }
}
```

## 几何体性能优化

```typescript
class GeometryOptimizer {
  private tempBox: Box3;
  private tempSphere: Sphere;
  private tempPlane: Plane;

  constructor() {
    this.tempBox = Box3.create();
    this.tempSphere = Sphere.create();
    this.tempPlane = Plane.create();
  }

  // 批量包围盒计算
  calculateBoundingBoxes(positions: Float32Array, stride: number = 3): Box3[] {
    const boxes: Box3[] = [];
    const numObjects = positions.length / stride;

    // 预分配结果数组
    for (let i = 0; i < numObjects; i++) {
      boxes.push(Box3.create());
    }

    // 批量计算
    for (let i = 0; i < numObjects; i++) {
      const offset = i * stride;
      const point = Vector3.create().set(
        positions[offset],
        positions[offset + 1],
        positions[offset + 2]
      );

      boxes[i].setFromCenterAndSize(point, Vector3.ONE);
      Vector3.release(point);
    }

    return boxes;
  }

  // 包围盒合并优化
  mergeBoundingBoxes(boxes: Box3[]): Box3 {
    if (boxes.length === 0) {
      return Box3.create();
    }

    this.tempBox.copy(boxes[0]);

    // 批量合并
    for (let i = 1; i < boxes.length; i++) {
      this.tempBox.union(boxes[i]);
    }

    return this.tempBox.clone();
  }

  // 紧凑内存
  compactGeometryData(geometry: any): void {
    // 合并重复顶点
    const uniqueVertices = new Map<string, number>();
    const newPositions: number[] = [];
    const newIndices: number[] = [];

    const positions = geometry.attributes.position.array;
    const indices = geometry.index.array;

    // 处理索引
    for (let i = 0; i < indices.length; i++) {
      const index = indices[i] * 3;
      const key = `${positions[index]},${positions[index + 1]},${positions[index + 2]}`;

      if (!uniqueVertices.has(key)) {
        const newIndex = uniqueVertices.size / 3;
        uniqueVertices.set(key, newIndex);

        newPositions.push(
          positions[index],
          positions[index + 1],
          positions[index + 2]
        );
      }

      newIndices.push(uniqueVertices.get(key)!);
    }

    // 更新几何数据
    geometry.attributes.position.array = new Float32Array(newPositions);
    geometry.attributes.position.count = newPositions.length / 3;
    geometry.index.array = new Uint32Array(newIndices);

    // 计算新的包围盒
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }

  // 清理临时对象
  dispose(): void {
    Box3.release(this.tempBox);
    Sphere.release(this.tempSphere);
    Plane.release(this.tempPlane);
  }
}
```