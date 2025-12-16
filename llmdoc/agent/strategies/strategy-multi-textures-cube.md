# Strategy: Multi-Textures Plane to Cube Conversion

## Status: ✅ COMPLETED

## 1. Analysis
* **Context:** The current `multi-textures.ts` demo displays multi-texture blending on a 2D plane using procedurally generated textures (checkerboard, gradient, and noise). It uses custom vertex and fragment shaders with 5 blend modes. The vertex shader already accepts `vec3` positions, which is compatible with a cube geometry. The demo uses 3 textures (2 color textures + 1 mask texture) with various blending modes.
* **Risk:** The vertex shader is already 3D-compatible (uses `vec3 aPosition`), so geometry conversion should be straightforward. The main risks are:
  - Texture coordinates mapping correctly on cube faces
  - Image loading replacing procedural texture generation
  - Adding rotation animation to show 3D effect

## 2. Assessment
<Assessment>
**Complexity:** Medium
**Impacted Layers:** Geometry, Texture Loading, Animation
</Assessment>

## 3. The Plan
<ExecutionPlan>
**Step 1: Geometry Swap (Lines 177-184, 500-501)**
1. Replace `GeometryGenerator.plane` with `GeometryGenerator.cube` on line 178
2. Update geometry parameters from `width/height` to `size: 2` for appropriate cube dimensions
3. Ensure UVs are enabled (already true in current code)
4. Update the draw call to use `cubeGeometry.vertexCount`

**Step 2: Texture Loading Replacement (Lines 217-285)**
1. Remove `ProceduralTexture` imports and usage
2. Add `TextureLoader` import
3. Replace procedural texture creation with `TextureLoader.load` calls:
   - Replace checkerboard with `assets/texture/jade.jpg`
   - Replace gradient with `assets/texture/758px-Canestra_di_frutta_(Caravaggio).jpg`
   - Keep noise mask procedural or replace with a third image if available
4. Handle async texture loading before pipeline creation

**Step 3: Add Cube Rotation (Lines 417-419)**
1. Update the model matrix in the render loop (around line 479) to include rotation
2. Add simple rotation animation: `modelMatrix.makeRotationY(time * 0.5)` to show 3D effect
3. Optionally add slight X-axis rotation for better visualization

**Step 4: Shader Validation (No changes needed)**
1. Verify vertex shader handles `vec3` positions (already correct on line 21)
2. Confirm fragment shader logic remains unchanged
3. Check that texture coordinates are properly interpolated for cube faces

**Step 5: Cleanup (Lines 14, 217-285)**
1. Remove `ProceduralTexture` from imports on line 14
2. Remove all procedural texture generation code
3. Clean up console logs related to procedural textures
4. Update comments from "平面几何体" to "立方体几何体"
5. Update help text and descriptions to reflect cube instead of plane

**Key Notes:**
- The current vertex shader is already 3D-ready, using `vec3 aPosition`
- The blend modes and mixing logic can remain exactly the same
- UV coordinates should automatically map to each face of the cube
- The OrbitController will now rotate around a 3D object instead of a flat plane
- Consider adjusting the initial camera distance from 3 to 4 or 5 for better cube visibility
</ExecutionPlan>