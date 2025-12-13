#!/bin/bash
cd /Users/mac/Desktop/project/max/runtime

# 设置项目根目录的路径
export NODE_OPTIONS="--max-old-space-size=8192"

# 首先检查类型定义
echo "=== Checking MSpec type definitions ==="
find packages -name "*.d.ts" -type f | head -10

echo -e "\n=== Running TypeScript check on cubemap-skybox.ts ==="
npx tsc --noEmit packages/rhi/demo/src/cubemap-skybox.ts \
  --moduleResolution node \
  --esModuleInterop \
  --skipLibCheck \
  --target ES2020 \
  --lib ES2020,DOM \
  --types node