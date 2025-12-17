---
title: Using Rhi
description: 自动化LLM-Native标准化指南文档
category: guides
subcategory: general
tags: ['guide', 'llm-native', 'general', 'developers', 'code-examples', 'step-by-step']
target_audience: developers
complexity: intermediate
estimated_time: f"38 分钟"
last_updated: 2025-12-17
llm_native_compliance: true
version: 1.0.0
---


## 🎯 Context & Goal

### Context
本文档属于**general**类型的开发指南，面向**developers**。

### Goal
帮助开发者快速理解和掌握相关概念、工具和最佳实践，提高开发效率和代码质量。

### Prerequisites
- 基础的编程知识
- 了解项目架构和基本概念
- 相关领域的开发经验

---

# 使用 RHI 抽象层

## 如何使用 RHI 进行基本渲染

1. **创建 WebGL 引擎**
   ```typescript
   const configuration: WebGLEngineConfiguration = {
     canvas: "canvas-element", // 或 HTMLCanvasElement
     graphicDeviceOptions: {
       webGLMode: WebGLMode.Auto, // 自动选择 WebGL 版本
       stencil: true,
       _forceFlush: false
     }
   };

   const engine = await WebGLEngine.create(configuration);
   ```

2. **创建图形设备**
   WebGL 引擎会自动创建 WebGLGraphicDevice，但也可以通过配置自定义设备行为：
   ```typescript
   // 检查设备能力
   if (engine.device.canIUse(GLCapabilityType.vertexArrayObject)) {
     console.log("VAO 可用");
   }
   ```

3. **创建基本资源**
   ```typescript
   // 创建缓冲区
   const vertexBuffer = device.createPlatformBuffer(
     BufferBindFlag.VertexBuffer,
     vertexData.byteLength,
     BufferUsage.Static,
     vertexData
   );

   // 创建纹理
   const texture = device.createPlatformTexture2D(texture2D);

   // 创建渲染目标
   const renderTarget = device.createPlatformRenderTarget(target);
   ```

4. **设置渲染状态**
   ```typescript
   // 设置视口
   device.viewport(0, 0, width, height);

   // 设置裁剪区域
   device.scissor(0, 0, width, height);

   // 设置颜色遮罩
   device.colorMask(true, true, true, true);
   ```

5. **执行渲染**
   ```typescript
   // 激活渲染目标
   device.activeRenderTarget(renderTarget, viewport, isFlipProjection);

   // 激活纹理
   device.activeTexture(gl.TEXTURE0);
   device.bindTexture(texture);

   // 绘制图元
   device.drawPrimitive(primitive, subMesh, shaderProgram);
   ```

6. **资源清理**
   ```typescript
   // 销毁资源
   vertexBuffer.destroy();
   texture.destroy();
   renderTarget.destroy();
   ```

## 如何使用查询集进行遮挡查询

查询集用于获取 GPU 关于渲染操作的信息，最常见的用途是遮挡查询（Occlusion Query），用于检测对象是否被其他对象遮挡。

1. **创建查询集**
   ```typescript
   import { RHIQueryType } from '@maxellabs/rhi';

   const querySet = device.createQuerySet({
     type: RHIQueryType.OCCLUSION,
     count: 10,  // 创建 10 个查询槽位
     label: 'Occlusion Queries'
   });
   ```

2. **在渲染通道中使用查询**
   ```typescript
   // 开始一个查询
   renderPass.beginOcclusionQuery(querySet, 0);

   // 执行需要被查询的渲染操作
   renderPass.draw(vertexCount, instanceCount, firstVertex, firstInstance);

   // 结束查询
   renderPass.endOcclusionQuery();
   ```

3. **获取查询结果**

   **同步方式**（会阻塞）:
   ```typescript
   // 检查结果是否可用
   if (querySet.isResultAvailable(0)) {
     const pixelCount = querySet.getResult(0);
     console.log(`有 ${pixelCount} 个像素通过深度测试`);

     if (pixelCount > 0) {
       // 对象可见
       console.log('对象可见');
     } else {
       // 对象被完全遮挡
       console.log('对象被遮挡');
     }
   }
   ```

   **异步方式**（推荐）:
   ```typescript
   // 不会阻塞，返回 Promise
   const pixelCount = await querySet.getResultAsync(0);

   if (pixelCount > 0) {
     console.log('对象可见');
   } else {
     console.log('对象被遮挡');
   }
   ```

4. **批量查询示例**
   ```typescript
   // 对多个对象进行遮挡查询
   const objects = [obj1, obj2, obj3];

   for (let i = 0; i < objects.length; i++) {
     renderPass.beginOcclusionQuery(querySet, i);
     renderPass.drawObject(objects[i]);
     renderPass.endOcclusionQuery();
   }

   // 异步获取所有结果
   const results = await Promise.all(
     objects.map((_, i) => querySet.getResultAsync(i))
   );

   results.forEach((count, i) => {
     console.log(`对象 ${i}: ${count > 0 ? '可见' : '被遮挡'}`);
   });
   ```

5. **重置和清理**
   ```typescript
   // 重置特定查询以便重新使用
   querySet.reset(0);

   // 销毁查询集
   querySet.destroy();
   ```

## 查询集最佳实践

- **使用异步 API**: 优先使用 `getResultAsync()` 以避免 GPU 同步阻塞
- **提前检查可用性**: 在关键路径中使用 `isResultAvailable()` 检查结果
- **批量创建**: 一次创建多个查询槽位以减少创建开销
- **及时销毁**: 使用完毕后立即调用 `destroy()` 释放 GPU 资源
- **合理复用**: 重置查询后可继续复用相同的查询集对象

**参考代码**:
- 引擎创建: `temp/engine/packages/rhi-webgl/src/WebGLEngine.ts:14-25`
- 设备初始化: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:168-211`
- 图元创建: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:213-240`
- 渲染执行: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:328-335`
- 查询集: `rhi/src/webgl/resources/GLQuerySet.ts`
## 🔌 Interface First

### 核心接口定义
#### 配置接口
```typescript
interface Config {
  version: string;
  options: Record<string, any>;
}
```

#### 执行接口
```typescript
function execute(config: Config): Promise<Result> {
  // 实现逻辑
}
```

### 使用流程
1. **初始化**: 按照规范初始化相关组件
2. **配置**: 设置必要的参数和选项
3. **执行**: 调用核心接口执行功能
4. **验证**: 检查结果和状态

---

# 使用 RHI 抽象层

## 如何使用 RHI 进行基本渲染

1. **创建 WebGL 引擎**
   ```typescript
   const configuration: WebGLEngineConfiguration = {
     canvas: "canvas-element", // 或 HTMLCanvasElement
     graphicDeviceOptions: {
       webGLMode: WebGLMode.Auto, // 自动选择 WebGL 版本
       stencil: true,
       _forceFlush: false
     }
   };

   const engine = await WebGLEngine.create(configuration);
   ```

2. **创建图形设备**
   WebGL 引擎会自动创建 WebGLGraphicDevice，但也可以通过配置自定义设备行为：
   ```typescript
   // 检查设备能力
   if (engine.device.canIUse(GLCapabilityType.vertexArrayObject)) {
     console.log("VAO 可用");
   }
   ```

3. **创建基本资源**
   ```typescript
   // 创建缓冲区
   const vertexBuffer = device.createPlatformBuffer(
     BufferBindFlag.VertexBuffer,
     vertexData.byteLength,
     BufferUsage.Static,
     vertexData
   );

   // 创建纹理
   const texture = device.createPlatformTexture2D(texture2D);

   // 创建渲染目标
   const renderTarget = device.createPlatformRenderTarget(target);
   ```

4. **设置渲染状态**
   ```typescript
   // 设置视口
   device.viewport(0, 0, width, height);

   // 设置裁剪区域
   device.scissor(0, 0, width, height);

   // 设置颜色遮罩
   device.colorMask(true, true, true, true);
   ```

5. **执行渲染**
   ```typescript
   // 激活渲染目标
   device.activeRenderTarget(renderTarget, viewport, isFlipProjection);

   // 激活纹理
   device.activeTexture(gl.TEXTURE0);
   device.bindTexture(texture);

   // 绘制图元
   device.drawPrimitive(primitive, subMesh, shaderProgram);
   ```

6. **资源清理**
   ```typescript
   // 销毁资源
   vertexBuffer.destroy();
   texture.destroy();
   renderTarget.destroy();
   ```

## 如何使用查询集进行遮挡查询

查询集用于获取 GPU 关于渲染操作的信息，最常见的用途是遮挡查询（Occlusion Query），用于检测对象是否被其他对象遮挡。

1. **创建查询集**
   ```typescript
   import { RHIQueryType } from '@maxellabs/rhi';

   const querySet = device.createQuerySet({
     type: RHIQueryType.OCCLUSION,
     count: 10,  // 创建 10 个查询槽位
     label: 'Occlusion Queries'
   });
   ```

2. **在渲染通道中使用查询**
   ```typescript
   // 开始一个查询
   renderPass.beginOcclusionQuery(querySet, 0);

   // 执行需要被查询的渲染操作
   renderPass.draw(vertexCount, instanceCount, firstVertex, firstInstance);

   // 结束查询
   renderPass.endOcclusionQuery();
   ```

3. **获取查询结果**

   **同步方式**（会阻塞）:
   ```typescript
   // 检查结果是否可用
   if (querySet.isResultAvailable(0)) {
     const pixelCount = querySet.getResult(0);
     console.log(`有 ${pixelCount} 个像素通过深度测试`);

     if (pixelCount > 0) {
       // 对象可见
       console.log('对象可见');
     } else {
       // 对象被完全遮挡
       console.log('对象被遮挡');
     }
   }
   ```

   **异步方式**（推荐）:
   ```typescript
   // 不会阻塞，返回 Promise
   const pixelCount = await querySet.getResultAsync(0);

   if (pixelCount > 0) {
     console.log('对象可见');
   } else {
     console.log('对象被遮挡');
   }
   ```

4. **批量查询示例**
   ```typescript
   // 对多个对象进行遮挡查询
   const objects = [obj1, obj2, obj3];

   for (let i = 0; i < objects.length; i++) {
     renderPass.beginOcclusionQuery(querySet, i);
     renderPass.drawObject(objects[i]);
     renderPass.endOcclusionQuery();
   }

   // 异步获取所有结果
   const results = await Promise.all(
     objects.map((_, i) => querySet.getResultAsync(i))
   );

   results.forEach((count, i) => {
     console.log(`对象 ${i}: ${count > 0 ? '可见' : '被遮挡'}`);
   });
   ```

5. **重置和清理**
   ```typescript
   // 重置特定查询以便重新使用
   querySet.reset(0);

   // 销毁查询集
   querySet.destroy();
   ```

## 查询集最佳实践

- **使用异步 API**: 优先使用 `getResultAsync()` 以避免 GPU 同步阻塞
- **提前检查可用性**: 在关键路径中使用 `isResultAvailable()` 检查结果
- **批量创建**: 一次创建多个查询槽位以减少创建开销
- **及时销毁**: 使用完毕后立即调用 `destroy()` 释放 GPU 资源
- **合理复用**: 重置查询后可继续复用相同的查询集对象

**参考代码**:
- 引擎创建: `temp/engine/packages/rhi-webgl/src/WebGLEngine.ts:14-25`
- 设备初始化: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:168-211`
- 图元创建: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:213-240`
- 渲染执行: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:328-335`
- 查询集: `rhi/src/webgl/resources/GLQuerySet.ts`
## ⚠️ 禁止事项

### 关键约束
- 🚫 **忽略错误处理**: 确保所有异常情况都有对应的处理逻辑
- 🚫 **缺少验证**: 验证输入参数和返回值的有效性
- 🚫 **不遵循约定**: 保持与项目整体架构和约定的一致性

### 常见错误
- ❌ 忽略错误处理和异常情况
- ❌ 缺少必要的性能优化
- ❌ 不遵循项目的编码规范
- ❌ 忽略文档更新和维护

### 最佳实践提醒
- ✅ 始终考虑性能影响
- ✅ 提供清晰的错误信息
- ✅ 保持代码的可维护性
- ✅ 定期更新文档

---

# 使用 RHI 抽象层

## 如何使用 RHI 进行基本渲染

1. **创建 WebGL 引擎**
   ```typescript
   const configuration: WebGLEngineConfiguration = {
     canvas: "canvas-element", // 或 HTMLCanvasElement
     graphicDeviceOptions: {
       webGLMode: WebGLMode.Auto, // 自动选择 WebGL 版本
       stencil: true,
       _forceFlush: false
     }
   };

   const engine = await WebGLEngine.create(configuration);
   ```

2. **创建图形设备**
   WebGL 引擎会自动创建 WebGLGraphicDevice，但也可以通过配置自定义设备行为：
   ```typescript
   // 检查设备能力
   if (engine.device.canIUse(GLCapabilityType.vertexArrayObject)) {
     console.log("VAO 可用");
   }
   ```

3. **创建基本资源**
   ```typescript
   // 创建缓冲区
   const vertexBuffer = device.createPlatformBuffer(
     BufferBindFlag.VertexBuffer,
     vertexData.byteLength,
     BufferUsage.Static,
     vertexData
   );

   // 创建纹理
   const texture = device.createPlatformTexture2D(texture2D);

   // 创建渲染目标
   const renderTarget = device.createPlatformRenderTarget(target);
   ```

4. **设置渲染状态**
   ```typescript
   // 设置视口
   device.viewport(0, 0, width, height);

   // 设置裁剪区域
   device.scissor(0, 0, width, height);

   // 设置颜色遮罩
   device.colorMask(true, true, true, true);
   ```

5. **执行渲染**
   ```typescript
   // 激活渲染目标
   device.activeRenderTarget(renderTarget, viewport, isFlipProjection);

   // 激活纹理
   device.activeTexture(gl.TEXTURE0);
   device.bindTexture(texture);

   // 绘制图元
   device.drawPrimitive(primitive, subMesh, shaderProgram);
   ```

6. **资源清理**
   ```typescript
   // 销毁资源
   vertexBuffer.destroy();
   texture.destroy();
   renderTarget.destroy();
   ```

## 如何使用查询集进行遮挡查询

查询集用于获取 GPU 关于渲染操作的信息，最常见的用途是遮挡查询（Occlusion Query），用于检测对象是否被其他对象遮挡。

1. **创建查询集**
   ```typescript
   import { RHIQueryType } from '@maxellabs/rhi';

   const querySet = device.createQuerySet({
     type: RHIQueryType.OCCLUSION,
     count: 10,  // 创建 10 个查询槽位
     label: 'Occlusion Queries'
   });
   ```

2. **在渲染通道中使用查询**
   ```typescript
   // 开始一个查询
   renderPass.beginOcclusionQuery(querySet, 0);

   // 执行需要被查询的渲染操作
   renderPass.draw(vertexCount, instanceCount, firstVertex, firstInstance);

   // 结束查询
   renderPass.endOcclusionQuery();
   ```

3. **获取查询结果**

   **同步方式**（会阻塞）:
   ```typescript
   // 检查结果是否可用
   if (querySet.isResultAvailable(0)) {
     const pixelCount = querySet.getResult(0);
     console.log(`有 ${pixelCount} 个像素通过深度测试`);

     if (pixelCount > 0) {
       // 对象可见
       console.log('对象可见');
     } else {
       // 对象被完全遮挡
       console.log('对象被遮挡');
     }
   }
   ```

   **异步方式**（推荐）:
   ```typescript
   // 不会阻塞，返回 Promise
   const pixelCount = await querySet.getResultAsync(0);

   if (pixelCount > 0) {
     console.log('对象可见');
   } else {
     console.log('对象被遮挡');
   }
   ```

4. **批量查询示例**
   ```typescript
   // 对多个对象进行遮挡查询
   const objects = [obj1, obj2, obj3];

   for (let i = 0; i < objects.length; i++) {
     renderPass.beginOcclusionQuery(querySet, i);
     renderPass.drawObject(objects[i]);
     renderPass.endOcclusionQuery();
   }

   // 异步获取所有结果
   const results = await Promise.all(
     objects.map((_, i) => querySet.getResultAsync(i))
   );

   results.forEach((count, i) => {
     console.log(`对象 ${i}: ${count > 0 ? '可见' : '被遮挡'}`);
   });
   ```

5. **重置和清理**
   ```typescript
   // 重置特定查询以便重新使用
   querySet.reset(0);

   // 销毁查询集
   querySet.destroy();
   ```

## 查询集最佳实践

- **使用异步 API**: 优先使用 `getResultAsync()` 以避免 GPU 同步阻塞
- **提前检查可用性**: 在关键路径中使用 `isResultAvailable()` 检查结果
- **批量创建**: 一次创建多个查询槽位以减少创建开销
- **及时销毁**: 使用完毕后立即调用 `destroy()` 释放 GPU 资源
- **合理复用**: 重置查询后可继续复用相同的查询集对象

**参考代码**:
- 引擎创建: `temp/engine/packages/rhi-webgl/src/WebGLEngine.ts:14-25`
- 设备初始化: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:168-211`
- 图元创建: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:213-240`
- 渲染执行: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:328-335`
- 查询集: `rhi/src/webgl/resources/GLQuerySet.ts`
## 📚 Few-Shot示例

### 问题-解决方案对
**问题**: API调用返回错误
**解决方案**: 实现错误处理和重试机制
```typescript
try {
  const result = await apiCall(params);
  return result;
} catch (error) {
  if (retryCount < 3) {
    await delay(1000);
    return apiCall(params, retryCount + 1);
  }
  throw error;
}
```

**问题**: 配置文件格式错误
**解决方案**: 添加配置验证和默认值
```typescript
const config = validateAndNormalize(userConfig, defaultConfig);
if (!config.isValid()) {
  throw new ConfigError('配置验证失败');
}
```

### 学习要点
- 理解常见问题和解决方案
- 掌握最佳实践和避免陷阱
- 培养问题解决思维

---

# 使用 RHI 抽象层

## 如何使用 RHI 进行基本渲染

1. **创建 WebGL 引擎**
   ```typescript
   const configuration: WebGLEngineConfiguration = {
     canvas: "canvas-element", // 或 HTMLCanvasElement
     graphicDeviceOptions: {
       webGLMode: WebGLMode.Auto, // 自动选择 WebGL 版本
       stencil: true,
       _forceFlush: false
     }
   };

   const engine = await WebGLEngine.create(configuration);
   ```

2. **创建图形设备**
   WebGL 引擎会自动创建 WebGLGraphicDevice，但也可以通过配置自定义设备行为：
   ```typescript
   // 检查设备能力
   if (engine.device.canIUse(GLCapabilityType.vertexArrayObject)) {
     console.log("VAO 可用");
   }
   ```

3. **创建基本资源**
   ```typescript
   // 创建缓冲区
   const vertexBuffer = device.createPlatformBuffer(
     BufferBindFlag.VertexBuffer,
     vertexData.byteLength,
     BufferUsage.Static,
     vertexData
   );

   // 创建纹理
   const texture = device.createPlatformTexture2D(texture2D);

   // 创建渲染目标
   const renderTarget = device.createPlatformRenderTarget(target);
   ```

4. **设置渲染状态**
   ```typescript
   // 设置视口
   device.viewport(0, 0, width, height);

   // 设置裁剪区域
   device.scissor(0, 0, width, height);

   // 设置颜色遮罩
   device.colorMask(true, true, true, true);
   ```

5. **执行渲染**
   ```typescript
   // 激活渲染目标
   device.activeRenderTarget(renderTarget, viewport, isFlipProjection);

   // 激活纹理
   device.activeTexture(gl.TEXTURE0);
   device.bindTexture(texture);

   // 绘制图元
   device.drawPrimitive(primitive, subMesh, shaderProgram);
   ```

6. **资源清理**
   ```typescript
   // 销毁资源
   vertexBuffer.destroy();
   texture.destroy();
   renderTarget.destroy();
   ```

## 如何使用查询集进行遮挡查询

查询集用于获取 GPU 关于渲染操作的信息，最常见的用途是遮挡查询（Occlusion Query），用于检测对象是否被其他对象遮挡。

1. **创建查询集**
   ```typescript
   import { RHIQueryType } from '@maxellabs/rhi';

   const querySet = device.createQuerySet({
     type: RHIQueryType.OCCLUSION,
     count: 10,  // 创建 10 个查询槽位
     label: 'Occlusion Queries'
   });
   ```

2. **在渲染通道中使用查询**
   ```typescript
   // 开始一个查询
   renderPass.beginOcclusionQuery(querySet, 0);

   // 执行需要被查询的渲染操作
   renderPass.draw(vertexCount, instanceCount, firstVertex, firstInstance);

   // 结束查询
   renderPass.endOcclusionQuery();
   ```

3. **获取查询结果**

   **同步方式**（会阻塞）:
   ```typescript
   // 检查结果是否可用
   if (querySet.isResultAvailable(0)) {
     const pixelCount = querySet.getResult(0);
     console.log(`有 ${pixelCount} 个像素通过深度测试`);

     if (pixelCount > 0) {
       // 对象可见
       console.log('对象可见');
     } else {
       // 对象被完全遮挡
       console.log('对象被遮挡');
     }
   }
   ```

   **异步方式**（推荐）:
   ```typescript
   // 不会阻塞，返回 Promise
   const pixelCount = await querySet.getResultAsync(0);

   if (pixelCount > 0) {
     console.log('对象可见');
   } else {
     console.log('对象被遮挡');
   }
   ```

4. **批量查询示例**
   ```typescript
   // 对多个对象进行遮挡查询
   const objects = [obj1, obj2, obj3];

   for (let i = 0; i < objects.length; i++) {
     renderPass.beginOcclusionQuery(querySet, i);
     renderPass.drawObject(objects[i]);
     renderPass.endOcclusionQuery();
   }

   // 异步获取所有结果
   const results = await Promise.all(
     objects.map((_, i) => querySet.getResultAsync(i))
   );

   results.forEach((count, i) => {
     console.log(`对象 ${i}: ${count > 0 ? '可见' : '被遮挡'}`);
   });
   ```

5. **重置和清理**
   ```typescript
   // 重置特定查询以便重新使用
   querySet.reset(0);

   // 销毁查询集
   querySet.destroy();
   ```

## 查询集最佳实践

- **使用异步 API**: 优先使用 `getResultAsync()` 以避免 GPU 同步阻塞
- **提前检查可用性**: 在关键路径中使用 `isResultAvailable()` 检查结果
- **批量创建**: 一次创建多个查询槽位以减少创建开销
- **及时销毁**: 使用完毕后立即调用 `destroy()` 释放 GPU 资源
- **合理复用**: 重置查询后可继续复用相同的查询集对象

**参考代码**:
- 引擎创建: `temp/engine/packages/rhi-webgl/src/WebGLEngine.ts:14-25`
- 设备初始化: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:168-211`
- 图元创建: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:213-240`
- 渲染执行: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:328-335`
- 查询集: `rhi/src/webgl/resources/GLQuerySet.ts`