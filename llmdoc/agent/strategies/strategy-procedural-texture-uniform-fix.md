# Strategy: 修复 procedural-texture.ts Uniform Block 绑定问题

## 1. Problem Analysis (问题分析)
- **核心问题**: `procedural-texture.ts` 示例无法正常渲染，并在浏览器控制台抛出 WebGL 错误。
- **根本原因**:
    1.  **Uniform Block 命名不匹配**: `BindGroupLayout` 中定义的名称 (`uTransforms`) 与 GLSL 着色器中声明的块名称 (`Transforms`) 不一致，导致绑定失败，出现 `blockIndex=INVALID_INDEX` 错误。
    2.  **未使用的顶点属性**: 顶点着色器声明了 `aNormal` 属性但未使用它，这是一种不规范的写法，可能导致性能问题或在某些严格的驱动下编译失败。
    3.  **资源浪费**: 由于着色器不使用法线，但在生成几何体时仍创建了法线数据。

## 2. Constitution (宪法约束)
根据 Librarian 提供的 "Rules of Engagement"，必须遵守以下规则：
1.  **GLSL Uniform Block 命名规范**: `BindGroupLayout` 的 `name` 字段必须与 GLSL 着色器中的 `uniform BlockName { ... }` 的 BlockName 完全一致（区分大小写）。
2.  **顶点属性声明规则**: 顶点着色器中的 `in` 属性必须在着色器中被使用，或者从声明中移除。
3.  **几何体生成规则**: 如果着色器不使用法线，几何体生成时应设置 `normals: false`。

## 3. Solution Design (解决方案设计)

### 3.1 修复 1: 统一 Uniform Block 命名
将 `createBindGroupLayout` 函数调用中，针对 uniform buffer 的 `binding` 配置里的 `name` 字段从 `'uTransforms'` 修改为 `'Transforms'`，以确保与顶点着色器 `vs` 中的 `uniform Transforms` 声明完全匹配。

### 3.2 修复 2: 移除未使用的顶点属性
从顶点着色器 (`vs`) 的 GLSL 源码字符串中，删除 `in vec3 aNormal;` 这一行。该属性未在着色器逻辑中使用，应当移除。

### 3.3 修复 3: 更新几何体生成配置
在调用 `createCube()` 函数创建立方体几何体时，传入配置对象 `{ normals: false }`。这样可以避免生成和上传 GPU 不需要的法线数据，优化资源使用。

## 4. Implementation Steps (实施步骤)
1.  **读取文件**: 读取 `packages/rhi/demo/src/procedural-texture.ts` 的内容。
2.  **修改 BindGroupLayout**: 定位到 `engine.createBindGroupLayout` 的调用。找到 `name: 'uTransforms'` 并将其修改为 `name: 'Transforms'`。
3.  **修改顶点着色器**: 在 `vs` 字符串模板中，删除 `in vec3 aNormal;` 这一行。
4.  **修改几何体创建**: 在 `createCube()` 调用处，添加参数 `{ normals: false }`。
5.  **写回文件**: 将修改后的内容写回到 `packages/rhi/demo/src/procedural-texture.ts`。

## 5. Verification (验证方法)
1.  重新编译并运行 `procedural-texture` demo。
2.  在浏览器中打开页面，确认没有 WebGL 相关的错误或警告信息输出到控制台。
3.  确认场景中的立方体被正确渲染，并且其表面显示了程序化生成的纹理。

## 6. Risk Assessment (风险评估)
- **风险**: 低。
- **分析**:
    - 此修改仅限于一个独立的 demo 文件，不会影响 RHI 核心库或其它示例。
    - 修复方案遵循了项目代码库中其他正常工作的 demo（如 `render-to-texture.ts`）已建立的正确模式。
    - 属于明确的 Bug 修复，逻辑清晰，影响范围可控。
