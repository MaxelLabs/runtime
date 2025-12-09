# RHI 核心接口定义

## 1. Identity

- **What it is:** RHI 框架的接口规范层，定义所有设备、资源、管线、命令缓冲区的契约。
- **Purpose:** 提供统一的 API 规范，使不同的渲染后端可以实现共同的接口。

## 2. Core Components

### 接口文件组织

- `specification/src/common/rhi/device.ts` (`IRHIDevice`): 主设备接口，管理资源创建和初始化
- `specification/src/common/rhi/passes/renderPass.ts` (`IRHIRenderPass`): 渲染通道接口，记录渲染命令
- `specification/src/common/rhi/resources/querySet.ts` (`IRHIQuerySet`): 查询集接口，支持遮挡查询和时间戳查询
- `specification/src/common/rhi/types.ts` (`RHIQueryType`, `RHIQuerySetDescriptor`): 类型定义

### 主要接口

#### IRHIDevice

主设备接口，负责创建所有 RHI 资源。新增方法：

```
- createQuerySet(descriptor: RHIQuerySetDescriptor): IRHIQuerySet
```

#### IRHIRenderPass

渲染通道接口，在录制渲染命令时可以启动遮挡查询。新增方法：

```
- beginOcclusionQuery(querySet: IRHIQuerySet, queryIndex: number): void
- endOcclusionQuery(): void
```

#### IRHIQuerySet（新增）

管理一组 GPU 查询，支持遮挡查询、时间戳查询等。

**主要方法**：
- `isResultAvailable(queryIndex: number): boolean` - 检查查询结果是否可用
- `getResult(queryIndex: number): number` - 同步获取查询结果
- `getResultAsync(queryIndex: number): Promise<number>` - 异步获取查询结果（推荐）
- `reset(queryIndex: number): void` - 重置查询对象
- `destroy(): void` - 销毁资源

**属性**：
- `type: RHIQueryType` - 查询类型（OCCLUSION、TIMESTAMP、PIPELINE_STATISTICS）
- `count: number` - 查询对象数量
- `label?: string` - 调试标签

## 3. Execution Flow (LLM Retrieval Map)

### 查询集生命周期

1. **创建**：应用调用 `device.createQuerySet(descriptor)` → `GLQuerySet` 构造函数创建 WebGL Query 对象
   - 引用：`rhi/src/webgl/resources/GLQuerySet.ts:39-68`

2. **使用**：在渲染通道中启用查询
   - `renderPass.beginOcclusionQuery(querySet, index)` 开始查询
   - 执行绘制命令
   - `renderPass.endOcclusionQuery()` 结束查询
   - 引用：`rhi/src/webgl/commands/GLRenderPass.ts:96-102`

3. **读取**：查询完成后读取结果
   - 检查 `querySet.isResultAvailable(index)`
   - 同步：`querySet.getResult(index)` 或异步：`querySet.getResultAsync(index)`
   - 引用：`rhi/src/webgl/resources/GLQuerySet.ts:152-190`

4. **销毁**：`querySet.destroy()` 释放所有 WebGL Query 对象

### Push Constants 工作流

1. **初始化**：`GLRenderPipeline` 构造函数检测着色器中的 `_PushConstants` uniform block
   - 自动计算 std140 布局（使用 `Std140Calculator`）
   - 创建独立的 UBO 缓冲区
   - 引用：`rhi/src/webgl/pipeline/GLRenderPipeline.ts:1-100`（构造函数初始化部分）

2. **更新**：应用调用 `pipeline.updatePushConstants(offset, data)`
   - WebGL 2.0：直接通过 `bufferSubData` 更新 UBO
   - WebGL 1.0：降级方案（警告日志）
   - 引用：`rhi/src/webgl/pipeline/GLRenderPipeline.ts:720-734`

3. **绑定**：在绘制前调用 `pipeline.bindPushConstantsUBO()`
   - 使用 `bindBufferBase` 绑定 UBO 到指定的 binding point
   - 引用：`rhi/src/webgl/pipeline/GLRenderPipeline.ts:740-748`

## 4. Design Rationale

### Query Set 设计

- **为什么需要 Query Set？**：GPU 遮挡查询是重要的优化技术（遮挡剔除），但不同 API 的查询机制差异大。统一接口便于应用代码跨平台复用。
- **为什么支持异步读取？**：GPU 查询结果通常不是立即可用的，异步读取避免应用线程阻塞。
- **为什么要求 result available 检查？**：防止 GPU 阻塞，提高并发性能。

### Push Constants 设计

- **为什么用 UBO 实现？**：WebGL 没有原生的 push constants 概念。通过 UBO（Uniform Buffer Object）模拟，同时完全兼容 std140 布局规范，保证与 WebGPU/Vulkan 的一致性。
- **Std140 布局为什么重要？**：确保 CPU 端和 GPU 端的数据对齐一致，避免数据错位问题。
