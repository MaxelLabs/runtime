<!-- RHI 设备能力查询机制调查报告 -->

### Code Sections (The Evidence)

#### 设备信息接口定义
- `packages/specification/src/common/rhi/device.ts` (`IRHIDeviceInfo`): 定义设备基本信息结构，包含设备名称、厂商、后端、支持特性、最大纹理尺寸、多重采样支持等字段
- `packages/specification/src/common/rhi/device.ts` (Line 25-80): 完整的 `IRHIDeviceInfo` 接口定义

#### 特性标志枚举
- `packages/specification/src/common/rhi/types/enums.ts` (`RHIFeatureFlags`): 使用位标志枚举定义 16 个功能特性，包括深度纹理、浮点纹理、多重渲染目标、实例化绘制、各向异性过滤、纹理压缩、计算着色器、顶点数组对象、混合操作、间接绘制、光线追踪、网格着色器等

#### WebGL 设备实现
- `packages/rhi/src/webgl/GLDevice.ts` (`WebGLDevice`): WebGL 设备实现类，包含能力检测和初始化逻辑
- `packages/rhi/src/webgl/GLDevice.ts` (Line 94-174, `initDeviceInfo`): WebGL 设备能力检测的核心实现
- `packages/rhi/src/webgl/GLDevice.ts` (Line 179-224, `initExtensions`): WebGL 扩展加载和初始化

#### 查询集接口
- `packages/specification/src/common/rhi/resources/querySet.ts` (`IRHIQuerySet`): 查询集资源接口，定义查询相关操作
- `packages/rhi/src/webgl/resources/GLQuerySet.ts` (`GLQuerySet`): WebGL 查询集实现，支持遮挡查询、时间戳查询等

#### 查询类型枚举
- `packages/specification/src/common/rhi/types/enums.ts` (`RHIQueryType`): 三个查询类型 - OCCLUSION（遮挡查询）、TIMESTAMP（时间戳查询）、PIPELINE_STATISTICS（管线统计查询）

#### 渲染通道接口
- `packages/specification/src/common/rhi/passes/renderPass.ts` (`IRHIRenderPass`): 渲染通道接口定义，包含 `beginOcclusionQuery` 和 `endOcclusionQuery` 方法
- `packages/rhi/src/webgl/commands/GLRenderPass.ts` (Line 673-714, 查询方法实现): WebGL 渲染通道中的遮挡查询实现

---

### Report

#### result

**当前 IRHIDeviceInfo 结构分析**
1. 已有的设备信息字段包括：
   - 基本信息：`deviceName`（设备名称）、`vendorName`（厂商名）、`backend`（后端类型）
   - 纹理能力：`maxTextureSize`（最大纹理尺寸）
   - 多重采样：`supportsMSAA`（多重采样支持）、`maxSampleCount`（最大采样数）
   - 过滤：`supportsAnisotropy`（各向异性过滤）
   - 计算：`maxWorkgroupSize`（计算工作组大小，可选）、`maxBindings`（最大绑定数）
   - 着色器：`shaderLanguageVersion`（着色器语言版本）
   - 特性：`features`（RHIFeatureFlags 位标志，16 个功能特性）

2. RHIFeatureFlags 枚举定义了 16 个特性，使用位标志表示：
   - DEPTH_TEXTURE（深度纹理）、FLOAT_TEXTURE（浮点纹理）、HALF_FLOAT_TEXTURE（半精度浮点纹理）
   - MULTIPLE_RENDER_TARGETS（多重渲染目标）、INSTANCED_DRAWING（实例化绘制）
   - ANISOTROPIC_FILTERING（各向异性过滤）
   - BC_TEXTURE_COMPRESSION、ETC2_TEXTURE_COMPRESSION、ASTC_TEXTURE_COMPRESSION（纹理压缩格式）
   - COMPUTE_SHADER（计算着色器）、STORAGE_TEXTURE（存储纹理）
   - VERTEX_ARRAY_OBJECT（顶点数组对象）
   - BLEND_OPERATION（混合操作）、INDIRECT_DRAWING（间接绘制）
   - RAY_TRACING（光线追踪）、MESH_SHADER（网格着色器）

3. 现有的能力表示方式采用组合策略：
   - 复杂能力用位标志（features 字段）表示
   - 简单数值能力用独立字段表示（如 maxTextureSize、maxSampleCount 等）
   - 布尔能力用独立布尔字段表示（如 supportsAnisotropy、supportsMSAA）

**WebGL 设备能力检测现状**
1. 能力检测在 `GLDevice.initDeviceInfo()` 中执行，逻辑包括：
   - WebGL 2.0 核心特性自动启用：DEPTH_TEXTURE、VERTEX_ARRAY_OBJECT、INSTANCED_DRAWING、MULTIPLE_RENDER_TARGETS、FLOAT_TEXTURE、HALF_FLOAT_TEXTURE
   - WebGL 1.0 需通过扩展检测：使用 `getExtension()` 检查 WEBGL_depth_texture、OES_vertex_array_object、ANGLE_instanced_arrays 等
   - 通用扩展检测：EXT_texture_filter_anisotropic（各向异性过滤）、WEBGL_compressed_texture_s3tc/etc/astc（纹理压缩）

2. 统一的查询方法：
   - 目前没有统一的能力查询 API，设备能力在初始化时计算一次，存储在 `IRHIDeviceInfo` 对象中
   - 查询方式：通过 `device.info` 属性或 `getInfo()` 方法访问
   - 所有能力检测在构造函数中完成，无动态查询机制

3. 能力检测代码位置：
   - `packages/rhi/src/webgl/GLDevice.ts` Line 94-174（initDeviceInfo）：主要检测逻辑
   - `packages/rhi/src/webgl/GLDevice.ts` Line 179-224（initExtensions）：扩展加载逻辑
   - `packages/rhi/src/webgl/GLDevice.ts` Line 51-56：初始化流程中调用能力检测

**WebGL 能力检测需求分析**
1. 需要检测的关键能力：
   - 间接绘制（INDIRECT_DRAWING）：需要 WebGL_multi_draw 扩展
   - 统一缓冲对象（UBO）：WebGL 2.0 原生支持，WebGL 1.0 不支持
   - 查询（遮挡/时间戳）：WebGL 2.0 原生支持，WebGL 1.0 需要 EXT_occlusion_query_boolean
   - 多重采样（MSAA）：WebGL 2.0 支持（maxSampleCount 设为 4），WebGL 1.0 不支持
   - 纹理格式支持（深度、浮点、半精度、压缩）：通过扩展检测

2. WebGL 2.0 vs WebGL 1.0 差异：
   - WebGL 2.0 原生支持：深度纹理、浮点纹理、半精度浮点纹理、顶点数组对象、实例化绘制、多重渲染目标、多重采样
   - WebGL 1.0 需要扩展：上述所有特性都依赖特定扩展
   - 两个版本都需要扩展：纹理压缩（BC、ETC2、ASTC）、各向异性过滤、混合操作扩展

3. 相关 WebGL 扩展及其对应功能：
   - WEBGL_depth_texture：深度纹理
   - OES_vertex_array_object：顶点数组对象
   - ANGLE_instanced_arrays：实例化绘制
   - WEBGL_draw_buffers：多重渲染目标（WebGL 1.0）
   - OES_texture_float / OES_texture_half_float：浮点纹理
   - EXT_texture_filter_anisotropic：各向异性过滤
   - WEBGL_compressed_texture_s3tc/etc/astc：纹理压缩
   - EXT_disjoint_timer_query_webgl2：时间戳查询
   - WEBGL_multi_draw：间接绘制

**设计建议**

1. 统一的能力查询 API 设计当前状态：
   - 优点：API 简洁，在 `IRHIDeviceInfo` 中集中管理所有能力
   - 限制：能力检测发生一次（初始化时），无法动态更新
   - 访问方式明确：`device.info.features` 获取位标志，通过 `(features & RHIFeatureFlags.XXX)` 检查

2. 需要新增接口方法的建议：
   - 不需要添加新的查询接口，现有设计已充分
   - 可考虑添加 `device.info.canUseFeature(flag: RHIFeatureFlags): boolean` 辅助方法用于更清晰的能力检查
   - 建议添加扩展信息到 `IRHIDeviceInfo`：当前缺少对某些扩展是否可用的查询（如 WEBGL_multi_draw）

3. 与现有 RHIFeatureFlags 的配合：
   - 现有枚举设计良好，覆盖 WebGL 主要能力需求
   - 建议补充以下特性标志：
     - UNIFORM_BUFFER_OBJECT（UBO）：区分 WebGL 1.0 和 2.0
     - QUERY_SUPPORT（查询支持）：区分遮挡查询可用性
     - INDIRECT_DRAW_MULTI_DRAW：间接绘制多重绘制
   - 当前 COMPUTE_SHADER、RAY_TRACING、MESH_SHADER 在 WebGL 中均不支持，可保留供未来 WebGPU 后端使用

4. 能力检测机制的改进方向：
   - 现在：在初始化时一次性检测所有能力
   - 建议增强：增加设备能力的可扩展性，允许后端（如 WebGPU）动态报告特定能力
   - 建议改进：为每个特性增加版本信息，标记首次支持该特性的 WebGL 版本或扩展

#### conclusions

1. **当前状态**：RHI 的设备能力查询机制已基本成熟，使用 `IRHIDeviceInfo` 接口集中管理所有能力信息，通过位标志枚举 `RHIFeatureFlags` 表示特性支持

2. **WebGL 能力检测完整**：GLDevice 在初始化时完成所有能力检测，包括 WebGL 2.0 核心特性和可选扩展，覆盖纹理、渲染、着色器等主要能力需求

3. **查询集功能独立**：遮挡查询、时间戳查询等功能通过独立的 `IRHIQuerySet` 接口和 `GLQuerySet` 实现，与设备能力查询机制分离，设计清晰

4. **缺失的能力表示**：现有 RHIFeatureFlags 枚举未明确涵盖 UBO、查询支持、间接绘制多重绘制等细粒度能力，这些需求可通过补充枚举值解决

5. **扩展管理未暴露**：WebGL 扩展加载在 GLDevice 内部完成，上层无法查询特定扩展是否可用，可考虑增加扩展查询 API

6. **接口设计原则**：能力查询采用声明式设计（预先声明所有能力），避免了运行时查询开销，符合高性能 Web 图形编程的要求

#### relations

1. **设备初始化流程**：`GLDevice` 构造函数 → `initWebGL()` 创建上下文 → `initDeviceInfo()` 检测能力 → `initExtensions()` 加载扩展 → 生成 `IRHIDeviceInfo` 对象

2. **能力标志使用链**：位标志定义在 `RHIFeatureFlags` 枚举 → 在 `GLDevice.initDeviceInfo()` 中设置 → 存储在 `IRHIDeviceInfo.features` 字段 → 上层通过 `device.info.features` 访问

3. **查询集与渲染通道关系**：`IRHIQuerySet` 定义查询接口 → `GLQuerySet` 在 WebGL 中实现 → `IRHIRenderPass` 定义查询操作方法 → `WebGLRenderPass` 实现查询操作

4. **扩展依赖关系**：多个能力依赖对应扩展可用（如 DEPTH_TEXTURE 依赖 WEBGL_depth_texture）→ 扩展在 `initExtensions()` 中加载 → 能力标志基于扩展可用性设置

5. **版本差异处理**：WebGL 2.0 和 1.0 在 `initDeviceInfo()` 中采用不同检测策略 → 2.0 某些能力自动启用 → 1.0 需通过扩展检测 → 最终统一表示在 features 字段中

---

## 完整性检查

### 当前能力覆盖范围
- **纹理相关**：深度、浮点、半精度、压缩格式等已覆盖
- **渲染相关**：多重渲染目标、多重采样、混合操作已覆盖
- **绘制相关**：实例化、间接绘制已覆盖（基础层面）
- **对象相关**：顶点数组、存储纹理、计算着色器已覆盖
- **高级特性**：光线追踪、网格着色器已预留（虽然 WebGL 不支持）

### 缺失的能力表示（建议补充）
1. **UBO 支持**：区分 WebGL 1.0（不支持）和 2.0（支持）
2. **查询支持**：遮挡查询的精确支持级别（ANY_SAMPLES_PASSED vs ANY_SAMPLES_PASSED_CONSERVATIVE）
3. **间接绘制详细分类**：
   - 基础间接绘制（drawIndirect）
   - 多重间接绘制（multiDrawIndirect / WEBGL_multi_draw）
4. **浮点纹理线性过滤**：OES_texture_float_linear
5. **扩展查询接口**：允许查询特定扩展是否可用

### 改进优先级
1. **高优先级**：补充 UBO 和查询支持标志
2. **中优先级**：增加扩展查询 API
3. **低优先级**：细化间接绘制分类
