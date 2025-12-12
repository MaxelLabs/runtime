<!-- Deep Investigation Report: Rotating Cube Lighting UBO Issue -->

## Code Sections (The Evidence)

### UBO Data Layout in rotating-cube.ts
- `packages/rhi/demo/src/rotating-cube.ts` (lines 529-546): Fragment shader defines three uniform blocks: `Lighting { vec3 uLightDirection; vec3 uLightColor; vec3 uAmbientColor; float uSpecularIntensity; }`, `Camera { vec3 uCameraPosition; }`. Lighting UBO buffer created with size 64 bytes.
- `packages/rhi/demo/src/rotating-cube.ts` (lines 532-545): lightingData Float32Array construction - manually packed with padding: `lightingData[0-2]` = lightDir (vec3), `lightingData[3]` = padding, `lightingData[4-6]` = lightColor (vec3), `lightingData[7]` = padding, `lightingData[8-10]` = ambientColor (vec3), `lightingData[11]` = padding, `lightingData[12]` = specularIntensity. This matches std140 offsets: 0, 16, 32, 48 bytes.

### Std140 Layout Calculation Engine
- `packages/rhi/src/webgl/utils/Std140Layout.ts` (lines 86-123): TYPE_INFO table defines vec3 as `{ baseAlignment: 16, size: 12, elements: 3, isMatrix: false }` - correct per std140 spec.
- `packages/rhi/src/webgl/utils/Std140Layout.ts` (lines 181-237): `calculateLayout()` method properly calculates field offsets with alignment. For vec3 fields: alignment=16, each field offset is adjusted to 16-byte boundary.
- `packages/rhi/src/webgl/utils/Std140Layout.ts` (lines 163-165): `alignOffset()` correctly aligns offset to alignment boundary using ceiling division.

### Uniform Block Binding in GLBindGroup
- `packages/rhi/src/webgl/bindings/GLBindGroup.ts` (lines 314-348): `applyBindings()` method handles UBO binding. For WebGL2 with uniform buffer:
  - Line 327: Gets block index using `gl.getUniformBlockIndex(program, uniformName)` where uniformName is "Lighting", "Transforms", "Camera", etc.
  - Line 331: Binds block to binding point using `gl.uniformBlockBinding(program, blockIndex, binding)`
  - Lines 339-343: Uses `gl.bindBufferRange()` or `gl.bindBufferBase()` to bind the buffer to the binding point.

### Buffer Data Upload in GLBuffer
- `packages/rhi/src/webgl/resources/GLBuffer.ts` (lines 143-168): `update()` method handles both full and partial buffer updates.
  - Line 157: Binds buffer to target (UNIFORM_BUFFER for uniform buffers)
  - Line 161: If offset=0 and dataSize=bufferSize, uses `gl.bufferData()` (full update)
  - Line 164: Otherwise uses `gl.bufferSubData()` to update partial data
  - Line 167: Unbinds buffer

### Push Constants UBO Initialization in GLRenderPipeline
- `packages/rhi/src/webgl/pipeline/GLRenderPipeline.ts` (lines 661-712): `initPushConstantsUBO()` initializes Push Constants.
  - Line 669-672: Only queries `_PushConstants` uniform block specifically, not other blocks like "Lighting", "Transforms", "Camera"
  - Line 674-677: If block not found, returns early (normal case for demos without _PushConstants block)
  - **Critical**: This method does NOT initialize uniform block binding for application-defined blocks like "Lighting", "Transforms", "Camera"

### Missing: No Uniform Block Binding in Pipeline Initialization
- `packages/rhi/src/webgl/pipeline/GLRenderPipeline.ts` (lines 46-74): Constructor does not bind any uniform blocks to binding points. It only calls:
  1. `createProgram()` - compiles and links shader program
  2. `extractAttributeLocations()` - queries vertex attributes
  3. `initPushConstantsUBO()` - only handles `_PushConstants` block
  4. `prepareVertexLayout()` - vertex layout setup
  5. `createVertexArrayObject()` - VAO creation

---

## Report (The Answers)

### Result: Root Cause Analysis

The lighting parameters have no effect in rotating-cube.ts due to **incomplete Uniform Block Binding in the WebGL Pipeline**. The investigation reveals:

#### Problem 1: Missing Uniform Block Binding Setup in Pipeline
- **Location**: `packages/rhi/src/webgl/pipeline/GLRenderPipeline.ts`, constructor (lines 46-74)
- **Issue**: The pipeline initialization only handles `_PushConstants` uniform blocks via `initPushConstantsUBO()`. Application-defined uniform blocks like "Lighting", "Transforms", "Camera" are **never bound** to binding points during pipeline initialization.
- **Impact**: Although GLBindGroup correctly queries and binds these blocks during `applyBindings()` (lines 326-348), the pipeline program must also have the block binding configured. Without this, the UBO binding may not be properly associated with the shader program.

#### Problem 2: Potential Binding Point Mismatch
- **Location**: `packages/rhi/demo/src/rotating-cube.ts`, lines 290-328 (BindGroupLayout definition)
- **Details**: BindGroupLayout specifies:
  ```
  binding: 0 → "Transforms" (VERTEX, uniform buffer)
  binding: 1 → "Lighting" (FRAGMENT, uniform buffer)
  binding: 2 → "Camera" (FRAGMENT, uniform buffer)
  ```
- **Issue**: The demo uses binding indices 0, 1, 2 directly as binding points. However, WebGL's `uniformBlockBinding()` binds a uniform block to a binding point, and `bindBufferBase()` binds a buffer to that same binding point. The pipeline may not be aware of these pre-assigned binding points.

#### Problem 3: std140 Layout Verification Issues
- **Location**: `packages/rhi/src/webgl/bindings/GLBindGroup.ts`, lines 6-167
- **Issue**: The `applyKnownUniformFromBufferData()` function attempts to infer uniform types based on buffer data size and naming heuristics (lines 108-162), but this is a fallback mechanism. The primary path should be UBO binding (line 326-348).
- **Detail**: When `blockIndex !== gl.INVALID_INDEX` (line 329), the function correctly takes the UBO path. However, if there's any issue with block index detection, it falls back to extracting data and applying as scalar uniforms, which would NOT work for uniform blocks.

#### Problem 4: Missing Validation in GLBindGroup.applyBindings()
- **Location**: `packages/rhi/src/webgl/bindings/GLBindGroup.ts`, lines 326-348
- **Risk**: If `gl.getUniformBlockIndex()` returns `INVALID_INDEX` for "Lighting", "Transforms", or "Camera", the code silently falls through to the fallback path (line 351) which tries to extract data and apply as scalar uniforms. This would silently fail without clear error messages.
- **No warning**: No console warning is emitted when a uniform block lookup fails, making debugging difficult.

---

### Conclusions (Key Findings)

1. **UBO Data Layout is Correct**: The lightingData Float32Array in rotating-cube.ts (lines 532-545) correctly matches std140 memory layout with proper padding at offsets 0, 16, 32, 48 bytes.

2. **std140 Calculation is Correct**: Std140Calculator properly calculates vec3 alignment as 16-byte boundary with 12-byte size.

3. **Buffer Upload Works Correctly**: GLBuffer.update() method properly uploads data to GPU using gl.bufferSubData().

4. **Critical Missing Step: Pipeline Doesn't Set Up Uniform Block Bindings**: The GLRenderPipeline constructor (lines 46-74) does not establish uniform block binding associations for application-defined blocks. It only handles `_PushConstants`.

5. **Binding Success Depends on GLBindGroup.applyBindings()**: The actual binding of uniform blocks happens in GLBindGroup.applyBindings() (lines 326-348), which queries the block index and binds the buffer. This path appears correct.

6. **Potential Silent Failure**: If `gl.getUniformBlockIndex()` fails to find a block (returns INVALID_INDEX), the code silently falls back to scalar uniform extraction without warning the developer.

7. **Actual Root Cause - Most Likely**: The shader blocks may not be properly linked to the program, OR the binding indices (0, 1, 2) used in the demo do not match the actual block binding points expected by WebGL after linking.

---

### Relations (Code Relationships)

1. **rotating-cube.ts** (Demo) → **GLDevice.createBindGroup()** → **GLBindGroup constructor** → stores entries
2. **rotating-cube.ts** (Render Loop) → **GLRenderPass.setBindGroup()** → **GLBindGroup.applyBindings()**
3. **GLBindGroup.applyBindings()** (Line 326-348) → **getUniformBlockIndex()** → returns block index OR INVALID_INDEX
4. **If blockIndex is valid** → **uniformBlockBinding()** → **bindBufferBase()** binds UBO to binding point
5. **If blockIndex is INVALID_INDEX** → fallback to scalar uniform extraction (line 351-409) - **This is likely the failure point**
6. **GLRenderPipeline** (Line 669) → only queries `_PushConstants` block, not application blocks
7. **Std140Layout** → correctly calculates offsets, but not invoked by rotating-cube.ts (demo manually packs data)

---

## Diagnostic Questions to Answer

To confirm the root cause, the developer should:

1. **Enable Debug Logging**: Add `console.log()` in `GLBindGroup.applyBindings()` line 327-329 to check if `blockIndex === gl.INVALID_INDEX` for "Lighting" block. If true, the shader program was not properly compiled or the block name doesn't match.

2. **Verify Shader Compilation**: Check browser console for any shader compilation warnings related to "Lighting", "Transforms", "Camera" blocks.

3. **Add Uniform Block Discovery**: After linking the program, enumerate all uniform blocks using `gl.getProgramParameter(program, gl.ACTIVE_UNIFORM_BLOCKS)` to verify that "Lighting" block exists in the linked program.

4. **Test Direct Buffer Reading**: Add console logging in rotating-cube.ts after `lightingBuffer.update()` to verify the buffer contains expected values using `getData()` method (line 313 in GLBuffer.ts).

5. **Verify Binding Point Association**: Use WebGL debuggers (Chrome DevTools, SpectorJS) to trace which binding point actually receives the lighting data.

---

## Suspected Issue Chain

**Most Likely Scenario:**
1. Demo creates lightingBuffer and lightingData correctly
2. GLBuffer.update() successfully uploads data to GPU
3. GLBindGroup.applyBindings() is called during render
4. `gl.getUniformBlockIndex(program, "Lighting")` returns a valid blockIndex
5. `gl.uniformBlockBinding()` successfully binds the block to binding point 1
6. `gl.bindBufferBase(gl.UNIFORM_BUFFER, 1, lightingBuffer)` successfully binds the buffer
7. **BUT**: The shader may be sampling from wrong binding point OR there's a timing issue where pipeline is not active when buffer is bound

**Alternative Scenario:**
1. `gl.getUniformBlockIndex(program, "Lighting")` returns INVALID_INDEX
2. Code falls back to scalar uniform extraction (line 351-409 in GLBindGroup.ts)
3. The fallback tries to extract vec3 data as individual components, which silently fails
4. Fragment shader never receives lighting data, uses default uniform values (0.0)

