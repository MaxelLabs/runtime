#!/bin/bash
cd /Users/mac/Desktop/project/max/runtime

# 设置项目根目录的路径
export NODE_OPTIONS="--max-old-space-size=8192"

# 首先检查类型定义
echo "=== Checking MSpec type definitions ==="
find packages -name "*.d.ts" -type f | head -10

echo -e "\n=== Running TypeScript check on rhi demo ==="
# 使用项目的 tsconfig 进行类型检查
cd packages/rhi/demo && npx tsc --noEmit -p tsconfig.json