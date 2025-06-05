/**
 * geometry.ts
 * 几何体生成工具
 * 提供常用几何体的顶点数据生成功能
 */

/**
 * 顶点数据接口
 */
export interface VertexData {
  /** 顶点位置数据 */
  positions: Float32Array;
  /** 纹理坐标数据 */
  texCoords?: Float32Array;
  /** 法线数据 */
  normals?: Float32Array;
  /** 顶点颜色数据 */
  colors?: Float32Array;
  /** 索引数据 */
  indices?: Uint16Array | Uint32Array;
  /** 顶点数量 */
  vertexCount: number;
  /** 索引数量 */
  indexCount?: number;
}

/**
 * 生成三角形几何体
 * @param size 三角形大小
 * @returns 顶点数据
 */
export function createTriangle(size: number = 1.0): VertexData {
  const halfSize = size * 0.5;

  const positions = new Float32Array([
    0.0,
    halfSize,
    0.0, // 顶部
    -halfSize,
    -halfSize,
    0.0, // 左下
    halfSize,
    -halfSize,
    0.0, // 右下
  ]);

  const texCoords = new Float32Array([
    0.5,
    1.0, // 顶部
    0.0,
    0.0, // 左下
    1.0,
    0.0, // 右下
  ]);

  const normals = new Float32Array([
    0.0,
    0.0,
    1.0, // 顶部
    0.0,
    0.0,
    1.0, // 左下
    0.0,
    0.0,
    1.0, // 右下
  ]);

  const colors = new Float32Array([
    1.0,
    0.0,
    0.0,
    1.0, // 红色
    0.0,
    1.0,
    0.0,
    1.0, // 绿色
    0.0,
    0.0,
    1.0,
    1.0, // 蓝色
  ]);

  return {
    positions,
    texCoords,
    normals,
    colors,
    vertexCount: 3,
  };
}

/**
 * 生成四边形几何体
 * @param width 宽度
 * @param height 高度
 * @returns 顶点数据
 */
export function createQuad(width: number = 2.0, height: number = 2.0): VertexData {
  const halfWidth = width * 0.5;
  const halfHeight = height * 0.5;

  const positions = new Float32Array([
    -halfWidth,
    -halfHeight,
    0.0, // 左下
    halfWidth,
    -halfHeight,
    0.0, // 右下
    halfWidth,
    halfHeight,
    0.0, // 右上
    -halfWidth,
    halfHeight,
    0.0, // 左上
  ]);

  const texCoords = new Float32Array([
    0.0,
    0.0, // 左下
    1.0,
    0.0, // 右下
    1.0,
    1.0, // 右上
    0.0,
    1.0, // 左上
  ]);

  const normals = new Float32Array([
    0.0,
    0.0,
    1.0, // 左下
    0.0,
    0.0,
    1.0, // 右下
    0.0,
    0.0,
    1.0, // 右上
    0.0,
    0.0,
    1.0, // 左上
  ]);

  const colors = new Float32Array([
    1.0,
    1.0,
    1.0,
    1.0, // 白色
    1.0,
    1.0,
    1.0,
    1.0, // 白色
    1.0,
    1.0,
    1.0,
    1.0, // 白色
    1.0,
    1.0,
    1.0,
    1.0, // 白色
  ]);

  const indices = new Uint16Array([
    0,
    1,
    2, // 第一个三角形
    2,
    3,
    0, // 第二个三角形
  ]);

  return {
    positions,
    texCoords,
    normals,
    colors,
    indices,
    vertexCount: 4,
    indexCount: 6,
  };
}

/**
 * 生成立方体几何体
 * @param size 立方体大小
 * @returns 顶点数据
 */
export function createCube(size: number = 1.0): VertexData {
  const halfSize = size * 0.5;

  // 立方体的8个顶点
  const vertices = [
    [-halfSize, -halfSize, -halfSize], // 0: 左下后
    [halfSize, -halfSize, -halfSize], // 1: 右下后
    [halfSize, halfSize, -halfSize], // 2: 右上后
    [-halfSize, halfSize, -halfSize], // 3: 左上后
    [-halfSize, -halfSize, halfSize], // 4: 左下前
    [halfSize, -halfSize, halfSize], // 5: 右下前
    [halfSize, halfSize, halfSize], // 6: 右上前
    [-halfSize, halfSize, halfSize], // 7: 左上前
  ];

  // 立方体的6个面，每个面4个顶点
  const faceVertices: number[] = [];
  const faceTexCoords: number[] = [];
  const faceNormals: number[] = [];
  const faceColors: number[] = [];
  const faceIndices: number[] = [];

  // 面的定义：顶点索引和法线
  const faces = [
    { vertices: [0, 1, 2, 3], normal: [0, 0, -1], color: [1, 0, 0, 1] }, // 后面 - 红色
    { vertices: [4, 7, 6, 5], normal: [0, 0, 1], color: [0, 1, 0, 1] }, // 前面 - 绿色
    { vertices: [0, 4, 5, 1], normal: [0, -1, 0], color: [0, 0, 1, 1] }, // 下面 - 蓝色
    { vertices: [2, 6, 7, 3], normal: [0, 1, 0], color: [1, 1, 0, 1] }, // 上面 - 黄色
    { vertices: [0, 3, 7, 4], normal: [-1, 0, 0], color: [1, 0, 1, 1] }, // 左面 - 洋红
    { vertices: [1, 5, 6, 2], normal: [1, 0, 0], color: [0, 1, 1, 1] }, // 右面 - 青色
  ];

  // 纹理坐标
  const texCoords = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ];

  let vertexIndex = 0;
  faces.forEach((face) => {
    // 添加4个顶点
    face.vertices.forEach((vi, i) => {
      faceVertices.push(...vertices[vi]);
      faceTexCoords.push(...texCoords[i]);
      faceNormals.push(...face.normal);
      faceColors.push(...face.color);
    });

    // 添加2个三角形的索引
    const baseIndex = vertexIndex;
    faceIndices.push(baseIndex, baseIndex + 1, baseIndex + 2, baseIndex + 2, baseIndex + 3, baseIndex);
    vertexIndex += 4;
  });

  return {
    positions: new Float32Array(faceVertices),
    texCoords: new Float32Array(faceTexCoords),
    normals: new Float32Array(faceNormals),
    colors: new Float32Array(faceColors),
    indices: new Uint16Array(faceIndices),
    vertexCount: 24,
    indexCount: 36,
  };
}

/**
 * 生成球体几何体
 * @param radius 半径
 * @param segments 水平分段数
 * @param rings 垂直分段数
 * @returns 顶点数据
 */
export function createSphere(radius: number = 1.0, segments: number = 32, rings: number = 16): VertexData {
  const positions = [];
  const texCoords = [];
  const normals = [];
  const colors = [];
  const indices = [];

  // 生成顶点
  for (let ring = 0; ring <= rings; ring++) {
    const phi = (ring * Math.PI) / rings;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);

    for (let segment = 0; segment <= segments; segment++) {
      const theta = (segment * 2 * Math.PI) / segments;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      // 位置
      const x = radius * sinPhi * cosTheta;
      const y = radius * cosPhi;
      const z = radius * sinPhi * sinTheta;
      positions.push(x, y, z);

      // 法线（单位化的位置向量）
      normals.push(x / radius, y / radius, z / radius);

      // 纹理坐标
      const u = segment / segments;
      const v = ring / rings;
      texCoords.push(u, v);

      // 颜色（基于位置生成彩色）
      const r = (x / radius + 1) * 0.5;
      const g = (y / radius + 1) * 0.5;
      const b = (z / radius + 1) * 0.5;
      colors.push(r, g, b, 1.0);
    }
  }

  // 生成索引
  for (let ring = 0; ring < rings; ring++) {
    for (let segment = 0; segment < segments; segment++) {
      const current = ring * (segments + 1) + segment;
      const next = current + segments + 1;

      // 第一个三角形
      indices.push(current, next, current + 1);
      // 第二个三角形
      indices.push(current + 1, next, next + 1);
    }
  }

  return {
    positions: new Float32Array(positions),
    texCoords: new Float32Array(texCoords),
    normals: new Float32Array(normals),
    colors: new Float32Array(colors),
    indices: new Uint16Array(indices),
    vertexCount: (rings + 1) * (segments + 1),
    indexCount: indices.length,
  };
}

/**
 * 生成圆柱体几何体
 * @param radius 半径
 * @param height 高度
 * @param segments 分段数
 * @returns 顶点数据
 */
export function createCylinder(radius: number = 1.0, height: number = 2.0, segments: number = 32): VertexData {
  const positions = [];
  const texCoords = [];
  const normals = [];
  const colors = [];
  const indices = [];

  const halfHeight = height * 0.5;

  // 生成侧面顶点
  for (let i = 0; i <= segments; i++) {
    const angle = (i * 2 * Math.PI) / segments;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);

    // 底部顶点
    positions.push(x, -halfHeight, z);
    normals.push(x / radius, 0, z / radius);
    texCoords.push(i / segments, 0);
    colors.push(1, 0, 0, 1);

    // 顶部顶点
    positions.push(x, halfHeight, z);
    normals.push(x / radius, 0, z / radius);
    texCoords.push(i / segments, 1);
    colors.push(0, 1, 0, 1);
  }

  // 生成侧面索引
  for (let i = 0; i < segments; i++) {
    const bottom1 = i * 2;
    const top1 = i * 2 + 1;
    const bottom2 = (i + 1) * 2;
    const top2 = (i + 1) * 2 + 1;

    // 第一个三角形
    indices.push(bottom1, bottom2, top1);
    // 第二个三角形
    indices.push(top1, bottom2, top2);
  }

  // 添加底面和顶面的中心点
  const bottomCenterIndex = positions.length / 3;
  positions.push(0, -halfHeight, 0);
  normals.push(0, -1, 0);
  texCoords.push(0.5, 0.5);
  colors.push(0, 0, 1, 1);

  const topCenterIndex = bottomCenterIndex + 1;
  positions.push(0, halfHeight, 0);
  normals.push(0, 1, 0);
  texCoords.push(0.5, 0.5);
  colors.push(1, 1, 0, 1);

  // 生成底面索引
  for (let i = 0; i < segments; i++) {
    const current = i * 2;
    const next = ((i + 1) % segments) * 2;
    indices.push(bottomCenterIndex, next, current);
  }

  // 生成顶面索引
  for (let i = 0; i < segments; i++) {
    const current = i * 2 + 1;
    const next = ((i + 1) % segments) * 2 + 1;
    indices.push(topCenterIndex, current, next);
  }

  return {
    positions: new Float32Array(positions),
    texCoords: new Float32Array(texCoords),
    normals: new Float32Array(normals),
    colors: new Float32Array(colors),
    indices: new Uint16Array(indices),
    vertexCount: positions.length / 3,
    indexCount: indices.length,
  };
}

/**
 * 合并顶点数据
 * @param vertexData 顶点数据数组
 * @returns 合并后的顶点数据
 */
export function mergeVertexData(vertexData: VertexData[]): VertexData {
  if (vertexData.length === 0) {
    throw new Error('No vertex data to merge');
  }

  const positions = [];
  const texCoords = [];
  const normals = [];
  const colors = [];
  const indices = [];

  let vertexOffset = 0;

  for (const data of vertexData) {
    // 合并位置数据
    positions.push(...data.positions);

    // 合并纹理坐标
    if (data.texCoords) {
      texCoords.push(...data.texCoords);
    }

    // 合并法线数据
    if (data.normals) {
      normals.push(...data.normals);
    }

    // 合并颜色数据
    if (data.colors) {
      colors.push(...data.colors);
    }

    // 合并索引数据（需要偏移）
    if (data.indices) {
      for (const index of data.indices) {
        indices.push(index + vertexOffset);
      }
    }

    vertexOffset += data.vertexCount;
  }

  return {
    positions: new Float32Array(positions),
    texCoords: texCoords.length > 0 ? new Float32Array(texCoords) : undefined,
    normals: normals.length > 0 ? new Float32Array(normals) : undefined,
    colors: colors.length > 0 ? new Float32Array(colors) : undefined,
    indices: indices.length > 0 ? new Uint16Array(indices) : undefined,
    vertexCount: vertexOffset,
    indexCount: indices.length,
  };
}

/**
 * 计算切线向量
 * @param positions 位置数据
 * @param texCoords 纹理坐标数据
 * @param indices 索引数据
 * @returns 切线向量数组
 */
export function calculateTangents(
  positions: Float32Array,
  texCoords: Float32Array,
  indices: Uint16Array | Uint32Array
): Float32Array {
  const vertexCount = positions.length / 3;
  const tangents = new Float32Array(vertexCount * 3);

  // 为每个三角形计算切线
  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i] * 3;
    const i1 = indices[i + 1] * 3;
    const i2 = indices[i + 2] * 3;

    const t0 = indices[i] * 2;
    const t1 = indices[i + 1] * 2;
    const t2 = indices[i + 2] * 2;

    // 位置差值
    const dx1 = positions[i1] - positions[i0];
    const dy1 = positions[i1 + 1] - positions[i0 + 1];
    const dz1 = positions[i1 + 2] - positions[i0 + 2];

    const dx2 = positions[i2] - positions[i0];
    const dy2 = positions[i2 + 1] - positions[i0 + 1];
    const dz2 = positions[i2 + 2] - positions[i0 + 2];

    // 纹理坐标差值
    const du1 = texCoords[t1] - texCoords[t0];
    const dv1 = texCoords[t1 + 1] - texCoords[t0 + 1];

    const du2 = texCoords[t2] - texCoords[t0];
    const dv2 = texCoords[t2 + 1] - texCoords[t0 + 1];

    // 计算切线
    const r = 1.0 / (du1 * dv2 - dv1 * du2);
    const tx = (dv2 * dx1 - dv1 * dx2) * r;
    const ty = (dv2 * dy1 - dv1 * dy2) * r;
    const tz = (dv2 * dz1 - dv1 * dz2) * r;

    // 累加到顶点切线
    tangents[i0] += tx;
    tangents[i0 + 1] += ty;
    tangents[i0 + 2] += tz;

    tangents[i1] += tx;
    tangents[i1 + 1] += ty;
    tangents[i1 + 2] += tz;

    tangents[i2] += tx;
    tangents[i2 + 1] += ty;
    tangents[i2 + 2] += tz;
  }

  // 标准化切线向量
  for (let i = 0; i < tangents.length; i += 3) {
    const length = Math.sqrt(
      tangents[i] * tangents[i] + tangents[i + 1] * tangents[i + 1] + tangents[i + 2] * tangents[i + 2]
    );
    if (length > 0) {
      tangents[i] /= length;
      tangents[i + 1] /= length;
      tangents[i + 2] /= length;
    }
  }

  return tangents;
}
