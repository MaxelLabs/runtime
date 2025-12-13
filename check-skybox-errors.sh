#!/bin/bash
cd /Users/mac/Desktop/project/max/runtime

# 运行TypeScript检查
echo "=== Checking TypeScript errors in cubemap-skybox.ts ==="
npx tsc packages/rhi/demo/src/cubemap-skybox.ts --noEmit --target esnext --moduleResolution node --esModuleInterop --skipLibCheck --strict