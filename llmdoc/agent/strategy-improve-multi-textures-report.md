**Status:** COMPLETED

**Mode:** Standard

**Changes:**
- Modified `packages/rhi/demo/src/multi-textures.ts`:
    - Updated `BlendParams` Uniform Block to include `uTime`.
    - Added `getProceduralMask` function to shader for dynamic spotlight effect.
    - Updated `BLEND_MASK` mode to use procedural mask instead of texture.
    - Updated JavaScript buffer size to 16 bytes (4 floats).
    - Updated render loop to pass `time` to the shader.
    - Removed unused `maskTexture` loading and binding logic.
    - Cleaned up shader unused uniforms (`uMaskTexture`).
- Fixed lint errors in `packages/rhi/demo/src/compressed-texture.ts` and `packages/rhi/demo/src/texture-array.ts`.
- Fixed type error in `test-skybox.ts` to pass pre-commit checks.

**Verification:**
- Command: `pnpm build:others`
- Result: ✅ Passed
- Command: `eslint` and `tsc` (via pre-commit hook)
- Result: ✅ Passed

**Notes for Recorder:**
- Switched "Mask" blend mode from using a static noise texture to a dynamic procedural spotlight mask driven by `uTime`.
- Simplified resource management by removing the mask texture.
- Ensured `std140` alignment for the Uniform Block.
