# WebGL 实现架构

## 1. Identity

- **What it is:** RHI 框架在 WebGL 2.0 上的具体实现层。
- **Purpose:** 将统一的 RHI 接口映射到原生 WebGL API，支持现代 Web 浏览器的 GPU 访问。

## 2. Core Components

核心设备实现：
- `rhi/src/webgl/GLDevice.ts` (`WebGLDevice`, `DeviceState`, `DeviceEventCallbacks`): WebGL 设备实现，管理上下文生命周期和资源追踪

资源实现层：
- `rhi/src/webgl/resources/GLQuerySet.ts` (`GLQuerySet`): WebGL 查询集实现，支持遮挡查询和时间戳查询
- `rhi/src/webgl/pipeline/GLRenderPipeline.ts` (`GLRenderPipeline`): WebGL 渲染管线实现
- `rhi/src/webgl/commands/GLRenderPass.ts` (`GLRenderPass`): WebGL 渲染通道实现

工具层：
- `rhi/src/webgl/utils/Std140Layout.ts` (`Std140Calculator`): std140 内存布局计算工具
- `rhi/src/webgl/utils/ResourceTracker.ts` (`ResourceTracker`, `ResourceType`, `ResourceStats`): 资源追踪和生命周期管理

## 3. Execution Flow (LLM Retrieval Map)

### WebGLDevice 生命周期

**初始化** (`GLDevice.ts:81-108`):
1. 创建 WebGL 上下文（优先 WebGL2，回退 WebGL1）
2. 初始化设备信息（特性标志、能力检测等）
3. 加载 WebGL 扩展
4. 创建资源追踪器 (`ResourceTracker` 实例)
5. 设置上下文丢失/恢复监听器

**上下文丢失处理** (`GLDevice.ts:113-138`):
- 浏览器事件 `webglcontextlost` 触发时调用 `handleContextLost()`
- 设备状态变更为 `DeviceState.LOST`
- 执行用户注册的 `onContextLost` 回调
- 继续参考：`setEventCallbacks()` (`GLDevice.ts:181-183`)

**上下文恢复处理** (`GLDevice.ts:140-175`):
- 浏览器事件 `webglcontextrestored` 触发时调用 `handleContextRestored()`
- 重新初始化 WebGL 上下文、设备信息和扩展
- 清空资源追踪器（旧资源已失效）
- 设备状态变更为 `DeviceState.ACTIVE`
- 执行用户注册的 `onContextRestored` 回调

**设备销毁** (`GLDevice.ts:683-724`):
1. 调用 `resourceTracker.destroyAll()` 销毁所有追踪的资源
2. 移除事件监听器
3. 调用 `WEBGL_lose_context` 扩展释放 GPU 资源
4. 更新状态为 `DeviceState.DESTROYED`
5. 执行用户注册的 `onDestroyed` 回调

### 资源追踪系统 (ResourceTracker)

**自动注册机制**：
- 所有通过 `Device.create*()` 方法创建的资源自动注册
- 示例：`createBuffer()` → `resourceTracker.register(buffer, ResourceType.BUFFER)` (`GLDevice.ts:469-473`)
- 资源类型分类见 `ResourceType` 枚举 (`ResourceTracker.ts:29-41`)

**资源销毁顺序** (`ResourceTracker.ts:203-215`):
- 依赖顺序销毁，避免使用已销毁的资源：
  1. 命令编码器
  2. 绑定组
  3. 管线
  4. 布局 (绑定组布局、管线布局)
  5. 查询集、着色器
  6. 采样器、纹理
  7. 缓冲区、其他资源

**泄漏检测**：
- `getStats()` 返回按类型统计的资源数量 (`ResourceTracker.ts:141-165`)
- `reportLeaks()` 输出详细的泄漏报告 (`ResourceTracker.ts:253-281`)
- 设备销毁时自动检查并报告泄漏 (`GLDevice.ts:691-695`)

### GLQuerySet 实现流程

**初始化** (构造函数 `GLQuerySet.ts:39-68`):
1. 验证是否为 WebGL 2.0（查询集仅在 WebGL 2.0 上支持）
2. 验证查询类型是否支持（OCCLUSION 原生支持，TIMESTAMP 需要扩展检查）
3. 预创建所有 WebGL Query 对象数组：`gl.createQuery()`

**查询执行流程**:
- `beginOcclusionQuery()` → `gl.beginQuery(GL.ANY_SAMPLES_PASSED_CONSERVATIVE, queryObj)`
- 执行绘制命令
- `endOcclusionQuery()` → `gl.endQuery(GL.ANY_SAMPLES_PASSED_CONSERVATIVE)`
- 引用：`GLRenderPass.ts` 中的查询启用逻辑

**结果读取** (`GLQuerySet.ts:152-190`):
- 检查 `gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)` 判断结果是否可用
- 同步读取：`gl.getQueryParameter(query, gl.QUERY_RESULT)` 获取样本数
- 异步读取：轮询等待（最多 1 秒），通过 Promise 返回结果

**资源清理** (`GLQuerySet.ts:272-286`):
- 逐个删除 Query 对象：`gl.deleteQuery(queryObj)`
- 标记已销毁状态，防止再次使用

### Push Constants 实现流程

#### 初始化阶段

`GLRenderPipeline` 构造函数：
1. **着色器解析**：扫描编译后的着色器程序，查找 `_PushConstants` uniform block
   - 使用 `gl.getActiveUniformBlockName(program, blockIndex)` 检测
   - 引用：`GLRenderPipeline.ts` 构造函数

2. **std140 布局计算**：
   - 解析 `_PushConstants` block 中的所有 uniform 字段
   - 调用 `Std140Calculator.calculateLayout(fields)` 计算偏移和对齐
   - 引用：`Std140Layout.ts:223-279`

3. **UBO 缓冲区创建**：
   - `gl.createBuffer()` 创建 UBO
   - `gl.bufferData(gl.UNIFORM_BUFFER, totalSize, gl.DYNAMIC_DRAW)` 分配空间
   - 记录 UBO binding point

#### 更新和绑定

**updatePushConstants** (`GLRenderPipeline.ts:720-734`):
- WebGL 2.0：`gl.bindBuffer()` + `gl.bufferSubData(offset, data)` 直接更新 UBO
- WebGL 1.0：降级到标量 uniform，输出警告

**bindPushConstantsUBO** (`GLRenderPipeline.ts:740-748`):
- `gl.bindBufferBase(gl.UNIFORM_BUFFER, bindingPoint, uboBuffer)`
- 绑定到 uniform block 的 binding point

**flushPushConstants** (`GLRenderPipeline.ts:767-777`):
- 将整个 CPU 侧缓冲区 (`pushConstantData: Float32Array`) 一次性上传到 GPU

### Std140 布局计算细节

`Std140Calculator` 类实现完整的 std140 内存规范：

**类型对齐规则** (`Std140Layout.ts:136-173`):
- 标量（float/int/uint/bool）：4 字节对齐，4 字节大小
- vec2：8 字节对齐，8 字节大小
- vec3：**16 字节对齐**，12 字节大小（特殊规则！）
- vec4：16 字节对齐，16 字节大小
- 矩阵（按列存储）：每列 16 字节对齐

**字段布局计算** (`Std140Layout.ts:223-279`):
1. 遍历所有字段定义
2. 对每个字段计算对齐值和大小
3. 数组字段：步长必须是 16 的倍数（std140 规则）
4. 调整当前偏移以符合对齐要求
5. 最终总大小对齐到 16 字节边界

**数据写入** (`Std140Layout.ts:299-335`):
- 标量：直接写入一个 float32
- 向量：连续写入元素
- 矩阵：按列主序存储，每列 4 个 float32 (16 字节)
- 数组：按步长间隔写入元素

## 4. Design Rationale

### 上下文丢失/恢复处理策略

**为什么需要专门处理？**
- WebGL 上下文可能在以下情况丢失：GPU 驱动崩溃、标签页被置后台、显存被其他应用占用等
- 仅清空资源不足以恢复，需要重新初始化 WebGL 上下文和所有扩展
- 应用层需要在恢复时重建资源，因此必须提供通知机制

**事件回调设计**：
- `onContextLost` 和 `onContextRestored` 允许应用注册自定义恢复逻辑
- `onDestroyed` 允许应用在设备销毁时清理应用级资源
- 使用接口 `DeviceEventCallbacks` 提供类型安全的回调定义

**资源清理策略**：
- 上下文恢复时调用 `resourceTracker.clear()` 清空映射（旧资源对象仍存在但已失效）
- 应用必须在 `onContextRestored` 回调中重建所有资源

### 资源追踪系统的必要性

**问题背景**：
- WebGL 资源（缓冲区、纹理、着色器等）的生命周期复杂
- 手动管理容易导致泄漏和重复销毁错误
- 设备销毁时需要确保所有资源已清理

**自动追踪的好处**：
- 集中式生命周期管理，避免遗漏资源
- 按依赖顺序销毁，防止依赖关系错误
- 自动泄漏检测和报告，便于调试
- 可选的生产环境禁用（通过 `enabled` 参数），避免性能开销

**销毁顺序的重要性**：
- 绑定组和管线依赖布局对象，必须先销毁
- 命令编码器可能引用其他资源，也需要优先销毁
- 缓冲区和纹理通常是最后销毁的基础资源

### Query Set 使用 ANY_SAMPLES_PASSED_CONSERVATIVE

- **为什么是 CONSERVATIVE 模式？**：性能考量。保守模式的查询成本更低，结果虽然可能不完全准确（可能有假阳性），但对于遮挡剔除等优化应用足够。

### Push Constants 为什么不用 Uniform 而用 UBO？

- **性能**：UBO 支持批量更新，避免多次 `uniform()` 调用开销
- **灵活性**：std140 布局支持复杂数据结构（矩阵、数组等）
- **兼容性**：UBO 方案能更好地对应 WebGPU 和 Vulkan 的 push constants 概念

### WebGL 1.0 降级策略

- **为什么只是警告而不完全实现？**：WebGL 1.0 缺乏 UBO 支持，完整实现需要 uniform 名称映射表（增加复杂性）。当前策略是让开发者意识到限制，后续可选择升级或使用 WebGL 2.0。