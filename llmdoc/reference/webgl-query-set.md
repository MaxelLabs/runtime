# WebGL 查询集参考

## 1. Core Summary

WebGL 查询集是 RHI 框架在 WebGL 2.0 上的具体实现，提供了 GPU 查询功能。基于原生 WebGL Query API，支持遮挡查询和时间戳查询，并集成了资源追踪系统进行生命周期管理。

## 2. Source of Truth

**主要实现文件**：
- `packages/rhi/src/webgl/resources/GLQuerySet.ts` - WebGL 查询集的完整实现
- `packages/specification/src/common/rhi/resources/querySet.ts` - 查询集接口定义
- `packages/specification/src/common/rhi/types/enums.ts` - 查询类型枚举定义

**相关接口**：
- `packages/rhi/src/webgl/GLDevice.ts:559-566` - `createQuerySet()` 方法实现
- `packages/rhi/src/webgl/commands/GLRenderPass.ts:96-102` - 渲染通道中的查询启用逻辑

## 3. 关键特性

### WebGL 原生支持
- **遮挡查询**：WebGL 2.0 原生支持 `ANY_SAMPLES_PASSED_CONSERVATIVE`
- **时间戳查询**：需要 `EXT_disjoint_timer_query_webgl2` 扩展支持
- **管线统计**：WebGL 不支持

### 异步结果读取
- 使用轮询机制实现 `getResultAsync()`，最多等待 1 秒
- 自动处理查询结果可用性检查
- 返回 Promise，便于 async/await 使用

### 资源管理
- 自动集成 ResourceTracker 系统
- 预创建所有 Query 对象避免运行时开销
- 按依赖顺序自动销毁

## 4. 使用限制

- **WebGL 版本**：仅支持 WebGL 2.0
- **查询类型**：
  - OCCLUSION：完全支持
  - TIMESTAMP：需要扩展
  - PIPELINE_STATISTICS：不支持
- **并发限制**：同一渲染通道中只能进行一个遮挡查询
- **查询延迟**：结果通常延迟若干帧可用

## 5. 性能考虑

- 使用保守模式（CONSERVATIVE）提高性能
- 建议异步读取避免 GPU 阻塞
- 复用 Query Set 实例而非频繁创建销毁
- 读取结果时至少间隔 2-3 帧