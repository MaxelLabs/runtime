<!-- Deep Investigation Report: WebGL Texture Sampler Binding Issue in Rotating Cube Demo -->

### Code Sections (The Evidence)

#### 1. Texture Binding Path in GLBindGroup.applyBindings()

- `packages/rhi/src/webgl/bindings/GLBindGroup.ts` (lines 415-433): Texture binding handler
  - Line 423: `const textureUnit = this.layout.getTextureUnitForBinding(binding);`
  - Lines 426-428: `gl.activeTexture(gl.TEXTURE0 + textureUnit)`, `gl.bindTexture(textureView.getGLTextureTarget(), textureView.getGLTexture())`, `gl.uniform1i(uniformLocation, textureUnit)`
  - Lines 430-432: Warning logged if `textureUnit === undefined`

#### 2. Texture Unit Assignment in GLBindGroupLayout

- `packages/rhi/src/webgl/bindings/GLBindGroupLayout.ts` (lines 96-106): Texture unit allocation during layout validation
  - Lines 97-105: For each texture binding, auto-assigns a texture unit incrementally: `this.textureBindingToUnitMap.set(entry.binding, this.nextAvailableTextureUnit++)`
  - Line 36: `nextAvailableTextureUnit` initialized to 0
  - Line 143-144: `getTextureUnitForBinding()` returns the assigned texture unit

#### 3. Sampler Binding Path in GLBindGroup.applyBindings()

- `packages/rhi/src/webgl/bindings/GLBindGroup.ts` (lines 434-473): Sampler binding handler
  - Line 436: `const associatedTextureBinding = this.layout.getAssociatedTextureBindingForSampler(binding);`
  - Line 439: `const textureUnitForSampler = this.layout.getTextureUnitForBinding(associatedTextureBinding);`
  - Lines 447-453: Applies sampler to texture via `sampler.applyToTexture()`, sets uniform via `gl.uniform1i(uniformLocation, textureUnitForSampler)`

#### 4. Sampler-Texture Association Logic in GLBindGroupLayout

- `packages/rhi/src/webgl/bindings/GLBindGroupLayout.ts` (lines 153-178): `getAssociatedTextureBindingForSampler()` method
  - Lines 164-170: Uses proximity heuristic: `const potentialTextureBinding = samplerBinding - 1;`
  - If sampler binding N exists, assumes texture binding N-1 is associated
  - **Critical Issue**: This heuristic assumes samplers are always placed immediately after their textures

#### 5. GLSampler.applyToTexture() Implementation

- `packages/rhi/src/webgl/resources/GLSampler.ts` (lines 450-552): Applies sampler parameters to texture
  - Lines 450-551: Sets texture parameters (wrap modes, filter modes, LOD, comparison function, anisotropy)
  - **Key Detail**: Does NOT bind the sampler object to a texture unit. It sets texture parameters directly on the currently bound texture.

#### 6. WebGL2 Sampler Binding Capability

- `packages/rhi/src/webgl/resources/GLSampler.ts` (lines 559-564): `bind()` method for WebGL2 sampler objects
  - Line 562: `(this.gl as WebGL2RenderingContext).bindSampler(unit, this.sampler);`
  - **Critical Finding**: This method exists but is **NEVER CALLED** by GLBindGroup

#### 7. Rotating Cube Demo - Texture Setup

- `packages/rhi/demo/src/rotating-cube.ts` (lines 250-261): Texture creation and update
  - Line 255: Format is `RGBA8_UNORM`
  - Line 261: Data updated via `currentTexture.update(textures.checkerboard.data as BufferSource);`

#### 8. Rotating Cube Demo - Texture Binding Layout

- `packages/rhi/demo/src/rotating-cube.ts` (lines 317-328): BindGroupLayout texture and sampler entries
  - Binding 3: Texture with `name: 'uTexture'`
  - Binding 4: Sampler with `name: 'uTexture'`
  - Both share the same name

#### 9. Rotating Cube Demo - Fragment Shader

- `packages/rhi/demo/src/rotating-cube.ts` (lines 64-65, 82): Sampler2D uniform and texture sampling
  - Line 64: `uniform sampler2D uTexture;`
  - Line 82: `vec4 texColor = texture(uTexture, vTexCoord);`

#### 10. GLRenderPass.setBindGroup() Call

- `packages/rhi/src/webgl/commands/GLRenderPass.ts` (lines 427-451): Render pass bind group application
  - Line 441: `webglBindGroup.applyBindings(program, dynamicOffsets);`
  - This is where GLBindGroup.applyBindings() is invoked during rendering

#### 11. GLTexture.update() Method

- `packages/rhi/src/webgl/resources/GLTexture.ts` (lines 439-590): Texture data upload
  - Lines 461-589: Proper WebGL2 handling with `gl.bindTexture()`, then `gl.texSubImage2D()` or `gl.texSubImage3D()`
  - Line 589: Properly unbinds texture after update
  - **Data upload is correct**

#### 12. GLTexture.createView() Method

- `packages/rhi/src/webgl/resources/GLTexture.ts` (lines 595-620): Creates texture view
  - Returns `new WebGLTextureView(this.gl, viewDescriptor);`
  - The viewDescriptor contains reference to parent texture and format information

---

### Report (The Answers)

#### Result: Root Cause of Black Texture Rendering

The rotating cube texture renders black due to **missing WebGL2 sampler object binding**. Here is the precise issue chain:

##### Problem 1: WebGL2 Sampler Objects Are Never Bound to Texture Units

**Location**: `packages/rhi/src/webgl/bindings/GLBindGroup.ts` (lines 434-473)

**Issue**:
1. The demo defines a sampler binding at binding point 4 (line 324-327 in rotating-cube.ts)
2. GLBindGroup.applyBindings() recognizes this sampler entry and calls `sampler.applyToTexture()` at line 449
3. **BUT**: In WebGL2, samplers are separate objects that must be explicitly bound to texture units via `gl.bindSampler(unit, sampler)`
4. GLSampler has this capability via `bind()` method (lines 559-564 in GLSampler.ts), but GLBindGroup **NEVER CALLS IT**
5. Instead, GLBindGroup only calls `applyToTexture()` which sets texture parameters, not WebGL2 sampler objects

**Why This Causes Black Rendering**:
- In WebGL2 strict mode (version 300 es), sampler2D uniforms require **both**:
  1. A texture bound to the correct texture unit (✓ done via `gl.activeTexture()` + `gl.bindTexture()`)
  2. A sampler object bound to the same texture unit (✗ MISSING)
- Without the sampler object binding, the shader may not properly configure the texture sampling parameters, or the binding may be incomplete
- The fragment shader's `texture(uTexture, vTexCoord)` call fails to properly sample because the sampler object is missing

##### Problem 2: Sampler-Texture Association Uses Fragile Heuristic

**Location**: `packages/rhi/src/webgl/bindings/GLBindGroupLayout.ts` (lines 153-178)

**Issue**:
- `getAssociatedTextureBindingForSampler()` assumes sampler binding N is associated with texture binding N-1
- In rotating-cube demo: sampler at binding 4, texture at binding 3 (✓ this works by luck)
- But if the layout was different, this would fail silently
- Line 173-175: Warning is logged but code continues, making the failure hard to debug

##### Problem 3: No WebGL2 Sampler Binding in Rendering Pipeline

**Location**: `packages/rhi/src/webgl/bindings/GLBindGroup.ts` (lines 434-473)

**Current Flow**:
```
applyBindings() → finds sampler entry → calls sampler.applyToTexture() → exits
```

**Missing Step**:
```
applyBindings() → finds sampler entry → calls sampler.bind(textureUnit) → sets texture parameters via applyToTexture()
```

**Evidence**:
- GLSampler.bind() at lines 559-564 is a public method that calls `gl.bindSampler(unit, this.sampler)`
- But GLBindGroup never calls this method
- The code goes through effort to fetch the associated texture binding and textureUnit, but then doesn't use them for actual sampler binding

---

### Conclusions

1. **Texture Data Upload is Correct**: GLTexture.update() properly uploads pixel data to GPU using gl.texSubImage2D()

2. **Texture Unit Assignment Works**: GLBindGroupLayout correctly auto-assigns texture units incrementally (unit 0 for binding 3, unit 1 for binding 4)

3. **Sampler Object Creation is Correct**: GLSampler constructor properly creates WebGL2 sampler objects with correct parameters

4. **Critical Missing Step**: GLBindGroup.applyBindings() handles sampler entries but FAILS to call `sampler.bind(unit)` to bind the WebGL2 sampler object to its texture unit

5. **Fallback Path Exists But Incomplete**: For WebGL1, `sampler.applyToTexture()` is sufficient because WebGL1 doesn't have separate sampler objects. But WebGL2 needs both texture binding AND sampler object binding

6. **Current Behavior**:
   - Texture is bound to texture unit 0 (binding 3)
   - Texture data is correctly uploaded
   - Sampler parameters are applied to texture (via applyToTexture)
   - **BUT** the WebGL2 sampler object is never bound to the texture unit
   - Shader samples from texture unit 0 which is configured as texture but lacks a properly bound sampler object
   - Result: Black or undefined texture

7. **Why Fragment Shader Gets Black**:
   - In WebGL2 GLSL (version 300 es), `sampler2D` is a separate type that requires both texture AND sampler object
   - Without the sampler object binding, sampling may fail or return vec4(0, 0, 0, 0) (black)
   - Some drivers may apply default sampling parameters, but official behavior is undefined

---

### Relations

1. **rotating-cube.ts** (lines 317-328) defines both texture (binding 3) and sampler (binding 4) in BindGroupLayout
2. **rotating-cube.ts** (lines 340-341) creates BindGroup with both texture view and sampler resources
3. **GLRenderPass.setBindGroup()** calls **GLBindGroup.applyBindings()** during each render frame (line 441)
4. **GLBindGroup.applyBindings()** processes texture entry (binding 3) and correctly:
   - Gets texture unit from layout
   - Activates texture unit
   - Binds texture
   - Sets uniform1i with texture unit
5. **GLBindGroup.applyBindings()** processes sampler entry (binding 4) but INCORRECTLY:
   - Gets associated texture binding (binding 3)
   - Gets texture unit for that binding (unit 0)
   - Calls `sampler.applyToTexture()` which sets texture parameters
   - **MISSING**: Does NOT call `sampler.bind(unit)` to bind the actual WebGL2 sampler object
6. **GLSampler** has `bind(unit)` method available (lines 559-564) but it's never invoked by GLBindGroup
7. **Result**: Texture is bound but sampler object is not, causing shader to fail texture sampling

---

## The Fix Requirement

The GLBindGroup.applyBindings() sampler handler (lines 434-473) must be modified to:

1. After calling `sampler.applyToTexture()` for WebGL1 compatibility
2. Also call `sampler.bind(textureUnitForSampler)` for WebGL2 to bind the sampler object

This ensures WebGL2 has both the texture and the sampler object properly bound to the texture unit, allowing the shader to correctly sample the texture data instead of returning black.

