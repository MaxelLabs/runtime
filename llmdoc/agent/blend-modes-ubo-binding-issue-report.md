### Code Sections (The Evidence)
- `/packages/rhi/src/webgl/bindings/GLBindGroup.ts:327-352` - UBO绑定查找逻辑，使用`gl.getUniformBlockIndex()`查找uniform块索引
- `/packages/rhi/demo/src/blend-modes.ts:22-23` - 顶点着色器中的uniform声明：`uniform vec2 uOffset;`和`uniform float uScale;`
- `/packages/rhi/demo/src/blend-modes.ts:40` - 片段着色器中的uniform声明：`uniform vec4 uColor;`
- `/packages/rhi/demo/src/blend-modes.ts:284-301` - 绑定组布局定义，将buffer绑定到`uOffset`和`uColor`名称
- `/packages/rhi/demo/src/triangle.ts:19-23` - 正常工作的demo中的UBO声明：`uniform Transforms { ... };`
- `/packages/rhi/demo/src/triangle.ts:123` - 正确的绑定组布局名称：`name: 'Transforms'`

### Report (The Answers)

#### result
blend-modes.ts demo中的UBO绑定错误问题源于着色器中的uniform声明方式与绑定组布局定义不匹配。

1. **问题根源**：
   - 顶点着色器中将`uOffset`和`uScale`声明为独立的uniform变量（第22-23行）
   - 但绑定组布局中却尝试将buffer绑定到名为`uOffset`的uniform块（第288行）
   - 同样，片段着色器中将`uColor`声明为独立uniform（第40行），但绑定组布局尝试绑定到`uColor`uniform块（第300行）

2. **错误流程**：
   - `GLBindGroup.ts`中的`gl.getUniformBlockIndex(program, uniformName)`返回`INVALID_INDEX`
   - 因为着色器中没有名为`uOffset`和`uColor`的uniform块
   - 着色器中只有独立的uniform变量，而不是uniform块

3. **正确做法**：
   - 参考`triangle.ts`demo，应该使用uniform块来组织相关的uniform变量
   - 或者像绑定组布局期望的那样，将独立的uniform变量重新组织成uniform块

#### conclusions
- blend-modes.ts demo错误地将独立uniform变量与uniform块混合使用
- UBO绑定要求着色器中的uniform块名称必须与绑定组布局中的名称完全匹配
- WebGL的uniform块机制需要使用`layout(std140, binding = N) uniform BlockName { ... };`语法
- 当找不到对应的uniform块时，WebGL会返回`INVALID_INDEX`，导致绑定失败

#### relations
- `GLBindGroup.ts`的applyBindings方法负责查找和绑定uniform块
- blend-modes.ts中的着色器代码与绑定组布局定义不匹配
- triangle.ts demo展示了正确的uniform块使用方式
- 错误信息中的`blockIndex=INVALID_INDEX`表明`gl.getUniformBlockIndex()`调用失败