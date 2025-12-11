<!-- Vertex Formats Demo WebGL 错误调查报告 -->

### Code Sections (The Evidence)

- `packages/rhi/demo/src/vertex-formats.ts` (ultra_compact 配置): ultra_compact 格式定义存在数据不一致错误
- `packages/rhi/demo/src/vertex-formats.ts` (generateCubeWithFormat): 顶点数据生成函数按照 stride 16 字节写入数据
- `packages/rhi/demo/src/vertex-formats.ts` (drawIndexed 调用): 使用 `resources.indexCount` 进行索引绘制
- `packages/rhi/demo/src/vertex-formats.ts` (stride 计算): 所有格式都使用正确的 stride 计算顶点偏移

### Report (The Answers)

#### result

**WebGL 错误原因分析**：

1. **主要问题**：ultra_compact 格式的配置存在严重的数据不一致错误
   - `bytesPerVertex: 8` - 声称每顶点 8 字节
   - `stride: 16` - 实际使用 16 字节步长
   - 实际数据大小：FLOAT16x4(8) + UNORM8x4(4) + SNORM16x2(4) = 16 字节

2. **顶点缓冲区大小错误**：
   - 缓冲区创建时使用 `vertices.byteLength`（基于 stride * vertexCount = 16 * 24 = 384 字节）
   - 但 UI 显示和逻辑计算使用 `bytesPerVertex`（8 * 24 = 192 字节）
   - 导致顶点缓冲区实际大小是预期的一半

3. **GL_INVALID_OPERATION 错误**：
   - "Vertex buffer is not big enough for the draw call"
   - 索引缓冲区引用了超出顶点缓冲区实际范围的顶点
   - WebGL 检测到索引值超出了顶点缓冲区大小

4. **copyTextureToCanvas 错误**：
   - 由于渲染失败，帧缓冲区不完整
   - 导致拷贝纹理到画布时出现 INVALID_OPERATION

#### conclusions

- **配置错误**：ultra_compact 格式的 `bytesPerVertex` 应该是 16，不是 8
- **实际内存占用**：ultra_compact 格式占用 16 字节/顶点（57% 的标准格式），而不是声称的 29%
- **代码逻辑正确**：顶点数据生成和渲染逻辑本身是正确的，问题仅在于配置数据错误
- **其他格式正常**：standard、compressed_color、half_precision 格式的配置都是正确的

#### relations

- `generateCubeWithFormat()` 函数正确使用 stride 字节步长生成顶点数据
- 顶点布局配置正确使用 `stride - 4` 作为法线偏移
- `drawIndexed()` 调用正确传递索引数量
- 错误仅限于 ultra_compact 格式的数值配置错误

### 修复建议

1. **立即修复**：将 ultra_compact 的 `bytesPerVertex` 从 8 改为 16
2. **更新描述**：修改内存占用百分比为 57%（16/28）
3. **更新名称**：考虑重命名为 "Semi Compact" 以反映实际的内存节省

### 验证方法

1. 修复后 ultra_compact 格式应该能正常渲染
2. 内存占用显示应该与其他格式一致
3. 不再出现 WebGL 错误

---

## 修复实施记录（2025-01-11）

### 修复内容

已成功修复 vertex-formats demo 中的所有配置错误：

1. **ultra_compact 格式修复**：
   - `bytesPerVertex`: 8 → 16
   - `memoryPercent`: 29 → 57
   - `description`: 更新为"节省 43%"

2. **compressed_color 格式修复**：
   - `bytesPerVertex`: 16 → 20
   - `memoryPercent`: 57 → 72
   - `stride`: 16 → 20
   - `description`: 更新为"节省 28%"

3. **half_precision 格式修复**：
   - `bytesPerVertex`: 22 → 24
   - `memoryPercent`: 79 → 86
   - `stride`: 22 → 24
   - `description`: 更新为"节省 14%"

4. **Float16 转换实现**：
   - 添加 `floatToFloat16` 辅助函数，实现真正的 IEEE 754 半精度浮点转换
   - 修复 FLOAT16 数据写入，使用 Uint16Array 而不是 Float32Array
   - 为 FLOAT16x4 位置添加 w 分量（1.0）

5. **代码优化**：
   - 添加详细的字节注释，清晰标注每个属性的大小
   - 重构偏移计算逻辑，使用更清晰的颜色尺寸计算方式
   - 修复法线偏移计算，确保与实际数据布局一致

### 技术细节

- **问题根源**：初始实现时，`bytesPerVertex` 和 `stride` 不匹配，导致顶点缓冲区大小计算错误
- **修复方案**：确保所有格式的 `bytesPerVertex` 等于实际数据大小（stride）
- **Float16 实现**：按照 IEEE 754 标准实现完整的单精度到半精度浮点转换，包括符号位、指数和尾数的处理

### 验证结果

- 所有四种顶点格式现在都能正确渲染
- 内存占用百分比准确反映实际节省情况
- WebGL 错误已完全解决
- 性能统计正常显示