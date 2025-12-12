<!-- Investigation Report: rotating-cube Demo Texture and Lighting Issues -->

### Code Sections (The Evidence)

#### Texture Binding Chain

1. `packages/rhi/src/webgl/bindings/GLBindGroup.ts` (WebGLBindGroup.applyBindings, lines 415-433):
   - Handles texture binding in the applyBindings() method
   - For texture entries: calls `gl.activeTexture(gl.TEXTURE0 + textureUnit)`, then `gl.bindTexture()`, then `gl.uniform1i(uniformLocation, textureUnit)`
   - TextureUnit is fetched from layout via `getTextureUnitForBinding(binding)`

2. `packages/rhi/src/webgl/commands/GLRenderPass.ts` (WebGLRenderPass.setBindGroup, lines 427-451):
   - Calls `webglBindGroup.applyBindings(program, dynamicOffsets)` at line 441
   - This is where the texture uniform binding actually happens during rendering

3. `packages/rhi/demo/src/rotating-cube.ts` (Fragment shader definition, lines 65, 317-318):
   - Defines `uniform sampler2D uTexture;` in shader
   - BindGroupLayout binding 3 expects texture with name='uTexture'
   - BindGroupLayout binding 4 expects sampler with name='uTexture'

#### Lighting UBO Layout Issue

4. `packages/rhi/src/webgl/utils/Std140Layout.ts` (TYPE_INFO, lines 99-103):
   - VEC3 has baseAlignment=16 and size=12 (this is the std140 rule!)
   - This means vec3 must be **16-byte aligned** even though it only occupies 12 bytes
   - Each vec3 followed by 4 bytes of padding before the next field

5. `packages/rhi/demo/src/rotating-cube.ts` (Lighting uniform block, lines 67-72):
   - Fragment shader defines:
     ```glsl
     uniform Lighting {
       vec3 uLightDirection;      // 0-11, offset=0, aligned to 16
       vec3 uLightColor;          // 16-27, offset=16, aligned to 16
       vec3 uAmbientColor;        // 32-43, offset=32, aligned to 16
       float uSpecularIntensity;  // 44-47, offset=48 (should align to 48!)
     };
     ```

6. `packages/rhi/demo/src/rotating-cube.ts` (Data packing, lines 532-546):
   - CPU-side data layout:
     ```
     lightingData[0-2] = lightDir (vec3)
     lightingData[3]   = padding (0)
     lightingData[4-6] = light color (vec3)
     lightingData[7]   = padding (0)
     lightingData[8-10] = ambient color (vec3)
     lightingData[11]  = padding (0)
     lightingData[12]  = specular intensity (float)
     lightingData[13-15] = (unused)
     ```
   - Total: 16 float32 values = 64 bytes

7. `packages/rhi/src/webgl/bindings/GLBindGroup.ts` (UBO binding, lines 326-345):
   - Detects UBO by calling `gl.getUniformBlockIndex(program, uniformName)`
   - If found (not INVALID_INDEX), calls `uniformBlockBinding(program, blockIndex, binding)`
   - Then calls `bindBufferBase(gl.UNIFORM_BUFFER, binding, glBuffer.getGLBuffer())`
   - Logs: `[UBO] Successfully bound '${uniformName}' to binding point ${binding}, blockIndex=${blockIndex}`

#### Sampler Uniform Discovery Issue

8. `packages/rhi/src/webgl/pipeline/GLRenderPipeline.ts` (extractAttributeLocations, lines 134-151):
   - Only extracts **ACTIVE_ATTRIBUTES** from the program
   - Does **NOT** extract sampler2D uniforms or their locations
   - Problem: Sampler uniforms are not active attributes, they are uniforms!

9. `packages/rhi/src/webgl/pipeline/GLRenderPipeline.ts` (Constructor, lines 60-74):
   - Calls `extractAttributeLocations()` at line 64
   - No equivalent `extractUniformLocations()` or sampler location extraction
   - This means sampler locations are never cached or processed

#### Texture Unit Assignment in Layout

10. `packages/rhi/src/webgl/bindings/GLBindGroup.ts` (applyBindings, lines 423-433):
    - Calls `this.layout.getTextureUnitForBinding(binding)` to get the texture unit
    - If textureUnit is undefined, logs warning at lines 430-432
    - No texture is bound if textureUnit is undefined

11. `packages/rhi/demo/src/rotating-cube.ts` (Binding layout setup, lines 314-324):
    - Texture binding (binding 3): `texture: { sampleType: 'float', viewDimension: '2d' }, name: 'uTexture'`
    - Sampler binding (binding 4): `sampler: { type: 'filtering' }, name: 'uTexture'`
    - Both share the same name 'uTexture'
    - Note: WebGL doesn't have separate sampler objects like WebGPU; samplers and textures are bound together

### Report (The Answers)

#### Result: Root Causes Found

##### Problem 1: Texture Not Displaying

**Root Cause**: The texture sampler uniform location is not being discovered or set in the shader program.

Evidence:
- The `GLRenderPipeline` extracts only **vertex attributes** (line 140-149 in GLRenderPipeline.ts)
- It does **NOT** extract **sampler2D uniform locations** from the fragment shader
- When `GLBindGroup.applyBindings()` is called, it looks up `uniformLocation = gl.getUniformLocation(program, uniformName)` (line 296 in GLBindGroup.ts)
- For sampler uniforms like `uTexture`, if the uniform location lookup succeeds but is not pre-cached, it should still work
- However, the actual issue is likely in **WebGLBindGroupLayout** not assigning texture units properly

The actual flow:
1. Fragment shader has `uniform sampler2D uTexture;` (line 65 of rotating-cube.ts)
2. Binding layout expects texture binding 3 with name 'uTexture' (line 316-318)
3. In `applyBindings()`, it tries to get textureUnit via `this.layout.getTextureUnitForBinding(binding)` (line 423)
4. If textureUnit is undefined, texture binding is skipped entirely (line 430-432 warning)
5. **The critical issue: WebGLBindGroupLayout must auto-assign texture units during creation, but there's no evidence it does this**

##### Problem 2: Lighting Adjustments Have No Effect

**Root Cause**: The Lighting UBO data layout matches the std140 specification, but the shader's uniform block layout may not match the actual data packing in the shader compiler's internal layout.

Evidence:
- GPU-side std140 layout for vec3:
  - baseAlignment=16, size=12 (lines 99-100 in Std140Layout.ts)
  - Each vec3 must start at 16-byte boundary

- CPU-side packing (lines 532-546 in rotating-cube.ts) appears correct:
  - 3x vec3 + 1x float = 3×16 + 16 = 64 bytes total
  - Each vec3 properly padded with 4 bytes

- **BUT**: The shader expects the layout as declared in GLSL:
  ```glsl
  uniform Lighting {
    vec3 uLightDirection;      // offset 0, baseAlignment 16
    vec3 uLightColor;          // offset 16, baseAlignment 16
    vec3 uAmbientColor;        // offset 32, baseAlignment 16
    float uSpecularIntensity;  // offset 48, baseAlignment 4
  };
  ```

- **Critical observation**: The CPU data fills 64 bytes but the shader only expects 52 bytes (3 vecs at 16 each = 48, plus 4 for float = 52)
- The issue is that the `lightingBuffer` is created with size=64 bytes (line 203), but the shader's Lighting block total size is likely only 52 or 64 (depending on final alignment)

- **No logging to confirm**: There's no log output showing:
  - The actual byte offset and size of each UBO field as seen by the GPU
  - Verification that the CPU data layout matches GPU expectations
  - Whether the specularIntensity is being read correctly

#### Conclusions

**Texture Issue - WHY IT'S NOT SHOWING:**
1. The sampler uniform `uTexture` exists in the fragment shader
2. The BindGroupLayout defines both texture binding (binding 3) and sampler binding (binding 4), both with name 'uTexture'
3. **Missing evidence**: WebGLBindGroupLayout's `getTextureUnitForBinding()` method is called but we haven't verified it assigns texture units correctly
4. The correct fix requires ensuring texture units are auto-assigned and logged during layout creation
5. Currently there are no logs showing texture unit assignment success or failure

**Lighting Issue - WHY CHANGES DON'T AFFECT RENDERING:**
1. The UBO binding succeeds (console shows: `[UBO] Successfully bound 'Lighting' to binding point 1, blockIndex=1`)
2. The data is packed with correct std140 padding (vec3 at 16-byte alignment)
3. **The actual problem is likely one of these:**
   - The GPU's internal layout of the Lighting uniform block doesn't match expectations
   - The specularIntensity field is at the wrong offset (should be offset 48, not 52 or beyond)
   - The std140 layout should round the final struct size to 16-byte boundary, making it 64 bytes ✓ (this is correct)
4. **Missing verification**: No code logs what the GPU sees as the actual byte layout of the Lighting uniform block
5. The CPU-side packing appears correct for std140, but without GPU-side verification, we can't confirm alignment

#### Relations

1. **GLRenderPipeline** creates WebGL program and prepares vertex layout but **doesn't extract sampler uniform locations**
2. **GLBindGroup.applyBindings()** is called by **GLRenderPass.setBindGroup()** during rendering
3. **GLBindGroup.applyBindings()** calls layout methods to discover texture unit assignments and sampler locations
4. **Texture binding requires**: correct uniform location lookup + correct texture unit assignment in layout + proper gl.activeTexture/bindTexture/uniform1i sequence
5. **Lighting UBO requires**: correct std140 struct layout + matching CPU data packing + verified GPU block layout
6. **Missing pieces**:
   - No verification that WebGLBindGroupLayout auto-assigns texture units
   - No logs showing texture unit assignments
   - No GPU-side verification of UBO block layout or field offsets
   - No sampler uniform location extraction or caching in GLRenderPipeline
