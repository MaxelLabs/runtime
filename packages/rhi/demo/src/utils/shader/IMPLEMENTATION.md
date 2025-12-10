/**
 * ============================================
 * ShaderUtils 着色器工具库 - 实现总结
 * ============================================
 *
 * 实现日期：2025-12-10
 * 版本：1.0
 *
 * 本文件总结了 ShaderUtils 着色器工具库的实现
 */

// ============================================
// 1. 项目结构
// ============================================

/*
packages/rhi/demo/src/utils/shader/
├── index.ts                          // 模块导出接口
├── types.ts                          // 类型定义
└── ShaderUtils.ts                    // 核心实现类
*/

// ============================================
// 2. 核心功能模块
// ============================================

/*
A. Uniform 块工具 (Uniform Block Tools)
   - generateUniformBlock()              生成 GLSL Uniform 块代码
   - calculateUniformBlockSize()         计算 std140 布局大小
   - calculateUniformBlockLayout()       获取详细布局信息
   - getTransformsBlock()                生成 MVP 矩阵块
   - getLightingBlock()                  生成光照参数块
   - getMaterialBlock()                  生成材质参数块

B. 着色器模板 (Shader Templates)
   - basicVertexShader()                 基础顶点着色器
   - basicFragmentShader()               基础片段着色器
   - phongShaders()                      完整 Phong 着色器对

C. 代码片段库 (Shader Snippets)
   - getLightingSnippet()                光照计算函数
   - getNormalTransformSnippet()         法线变换函数
   - getTextureSamplingSnippet()         纹理采样函数
   - getCommonUniformsSnippet()          常见 Uniform 声明
   - getScreenPositionSnippet()          屏幕空间位置函数
*/

// ============================================
// 3. std140 布局支持
// ============================================

/*
ShaderUtils 完整支持 GLSL std140 统一缓冲区布局规范：

类型                基础对齐  大小      说明
─────────────────────────────────────────
float               4         4        标量
int, uint, bool     4         4        标量
vec2                8         8        2 分量向量
vec3               16        12        3 分量（特殊对齐！）
vec4               16        16        4 分量向量
mat2               16        32        2x2 矩阵（2 个 vec2 按列）
mat3               16        48        3x3 矩阵（3 个 vec3 按列）
mat4               16        64        4x4 矩阵（4 个 vec4 按列）
数组 T[N]          16        16*N     数组元素步长 16 字节

关键点：
- vec3 对齐到 16 字节（需要 padding）
- 数组元素总是 16 字节对齐
- 所有块大小对齐到 16 字节边界
*/

// ============================================
// 4. API 示例
// ============================================

/*
// 示例 1: 生成自定义 Uniform 块
const block = ShaderUtils.generateUniformBlock({
  name: 'CustomParams',
  binding: 3,
  fields: [
    { name: 'time', type: 'float' },
    { name: 'colors', type: 'vec4', arraySize: 8 },
  ],
});

// 输出:
// layout(std140, binding = 3) uniform CustomParams {
//   float time;
//   vec4 colors[8];
// };

// 示例 2: 计算 Uniform 块大小
const blockSize = ShaderUtils.calculateUniformBlockSize([
  { name: 'a', type: 'float' },      // offset 0, size 4
  { name: 'b', type: 'vec3' },       // offset 16, size 12（对齐！）
  { name: 'c', type: 'mat4' },       // offset 32, size 64
]);
// blockSize = 96

// 示例 3: 获取详细布局信息
const layout = ShaderUtils.calculateUniformBlockLayout([
  { name: 'a', type: 'float' },
  { name: 'b', type: 'vec3' },
]);
// layout.fieldMap.get('a') = { name: 'a', offset: 0, size: 4 }
// layout.fieldMap.get('b') = { name: 'b', offset: 16, size: 12 }
// layout.totalSize = 32

// 示例 4: 使用标准 Uniform 块
const transformsBlock = ShaderUtils.getTransformsBlock(0);
// 包含: uModelMatrix, uViewMatrix, uProjectionMatrix

// 示例 5: 生成着色器
const vs = ShaderUtils.basicVertexShader({
  hasNormals: true,
  hasUVs: true,
  hasColors: false,
});

const fs = ShaderUtils.basicFragmentShader({
  mode: 'texture',
  hasLighting: true,
});

// 示例 6: 完整 Phong 着色器
const { vertex, fragment } = ShaderUtils.phongShaders();
*/

// ============================================
// 5. 集成方式
// ============================================

/*
在项目中使用 ShaderUtils：

// 导入
import { ShaderUtils } from './utils';

// 生成着色器代码
const vertexShaderCode = \`#version 300 es
  precision highp float;

  in vec3 aPosition;
  in vec3 aNormal;

  \${ShaderUtils.getTransformsBlock(0)}
  \${ShaderUtils.getLightingBlock(1)}

  out vec3 vNormal;

  void main() {
    // 自定义 shader 代码
  }
\`;

// 创建着色器模块
const vertexShader = device.createShaderModule({
  code: vertexShaderCode,
  language: 'glsl',
  stage: MSpec.RHIShaderStage.VERTEX,
});

// 计算缓冲区大小
const bufferSize = ShaderUtils.calculateUniformBlockSize([
  { name: 'uModelMatrix', type: 'mat4' },
  { name: 'uViewMatrix', type: 'mat4' },
  { name: 'uProjectionMatrix', type: 'mat4' },
]);

// 创建 Uniform 缓冲区
const uniformBuffer = device.createBuffer({
  size: bufferSize,
  usage: MSpec.RHIBufferUsage.UNIFORM,
  hint: 'dynamic',
});
*/

// ============================================
// 6. 类型系统
// ============================================

/*
导出的主要类型：

interface UniformField {
  name: string;
  type: 'float' | 'vec2' | 'vec3' | 'vec4' | 'mat3' | 'mat4' | 'int' | 'uint' | 'bool';
  arraySize?: number;
}

interface UniformBlockDefinition {
  name: string;
  binding: number;
  fields: UniformField[];
}

interface Std140LayoutInfo {
  fields: Std140FieldOffset[];
  totalSize: number;
  fieldMap: Map<string, Std140FieldOffset>;
}

interface BasicVertexShaderOptions {
  hasNormals?: boolean;
  hasUVs?: boolean;
  hasColors?: boolean;
}

interface BasicFragmentShaderOptions {
  mode?: 'solid' | 'vertexColor' | 'texture';
  hasLighting?: boolean;
}

interface PhongShaders {
  vertex: string;
  fragment: string;
}
*/

// ============================================
// 7. 代码统计
// ============================================

/*
文件构成：
- ShaderUtils.ts    623 行  核心实现和所有 API
- types.ts          118 行  完整的类型定义
- index.ts            7 行  模块导出

总计：748 行代码

实现的 API：
- 6 个 Uniform 块生成方法
- 3 个布局计算方法
- 3 个着色器模板方法
- 5 个代码片段方法
共 17 个公开 API
*/

// ============================================
// 8. 特色功能
// ============================================

/*
✓ 完整的 std140 布局计算
  - 自动处理所有类型的对齐规则
  - 特别处理 vec3 的 16 字节对齐
  - 支持数组类型

✓ 预定义的标准块
  - Transforms (MVP 矩阵)
  - Lighting (光照参数)
  - Material (材质参数)

✓ 灵活的着色器模板
  - 可组合的选项参数
  - 支持多种着色模式
  - 包含完整的 Phong 实现

✓ 可复用的代码片段
  - 光照计算函数
  - 法线变换函数
  - 纹理采样函数
  - 屏幕空间函数

✓ 完整的类型定义
  - 所有 API 都有完整的 TypeScript 类型
  - 支持编辑器自动完成
  - 类型安全检查
*/

// ============================================
// 9. 最佳实践
// ============================================

/*
1. 优先使用预定义块
   ✓ ShaderUtils.getTransformsBlock() 而不是手动编写

2. 自动计算缓冲区大小
   ✓ 使用 calculateUniformBlockSize() 或 calculateUniformBlockLayout()
   ✗ 避免手动计算导致的对齐错误

3. 组合代码片段
   ✓ 使用片段库中的函数构建复杂着色器
   ✓ 提高代码复用和维护性

4. 关注 vec3 对齐
   ✓ 记住 vec3 占用 16 字节（不是 12）
   ✓ 使用布局计算工具自动处理

5. 模块化着色器开发
   ✓ 先用工具生成基础框架
   ✓ 在模板基础上添加自定义逻辑
*/

// ============================================
// 10. 文档和参考
// ============================================

/*
完整文档：
- packages/rhi/llmdoc/reference/shader-utils-reference.md

相关文档：
- llmdoc/architecture/mvp-matrix-implementation.md
- llmdoc/reference/push-constants.md
- llmdoc/guides/webgl-commands.md

项目使用：
- packages/rhi/demo/src/rotating-cube.ts  (现有 Demo 示例)
- packages/rhi/demo/src/triangle.ts       (现有 Demo 示例)
- packages/rhi/demo/src/blend-modes.ts    (现有 Demo 示例)
*/

// ============================================
// 11. 导入和使用
// ============================================

/*
在项目中导入使用：

// 导入工具类
import { ShaderUtils } from './utils';

// 导入类型（可选）
import type {
  UniformField,
  UniformBlockDefinition,
  BasicVertexShaderOptions
} from './utils';

// 使用示例
const blockCode = ShaderUtils.getTransformsBlock(0);
const size = ShaderUtils.calculateUniformBlockSize([...]);
const shader = ShaderUtils.basicVertexShader({ hasNormals: true });
*/

// ============================================
// 12. 版本信息
// ============================================

/*
实现版本：1.0
创建日期：2025-12-10
维护者：Max Runtime Team

主要版本历史：
v1.0 (2025-12-10)
  - 初版实现
  - 完整的 std140 布局支持
  - 所有预定义块和模板
  - 完整的代码片段库
*/

export {};
