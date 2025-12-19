# ECS架构重组策略文档

**文档ID**: `strategy-ecs-reorganization`
**版本**: 1.0
**创建时间**: 2025-12-19
**任务类型**: 架构重构 (Phase 1)

---

## 一、执行摘要

### 1.1 重组目标
将现有的GameObject+Component模式重构为标准ECS架构，保持向后兼容性，同时为Phase 2的性能优化奠定基础。

### 1.2 范围统计
- **源文件迁移**: 18个文件 (base/ → ecs/)
- **测试文件更新**: 14个测试文件
- **新增ECS组件**: 6个核心模块
- **测试基线**: 169个通过测试(必须保持)
- **工期估算**: 3-5天

### 1.3 风险等级
- **整体风险**: 🟡 中等
- **测试覆盖**: ✅ 完整
- **回滚能力**: ✅ 支持

---

## 二、迁移执行计划概要

### Phase 1: 文件迁移 (1-2天)
- 创建 `src/ecs/` 目录结构（5个子目录）
- 迁移18个源文件到新位置
- 迁移14个测试文件

### Phase 2: 导入路径转换 (0.5天)
- 自动化脚本更新所有import语句
- 验证TypeScript编译通过

### Phase 3: 向后兼容层 (0.5天)
- 重写 `src/base/index.ts` 为重导出层
- 创建 `src/ecs/index.ts` 统一导出

### Phase 4: ECS核心组件开发 (1-2天)
实现6大核心组件：
1. **EntityManager** - Entity ID生成与回收
2. **ComponentRegistry** - 组件注册表
3. **Archetype** - 内存布局管理
4. **World** - ECS调度器（God Object）
5. **Query** - 实体查询系统
6. **CommandBuffer** - 延迟命令队列

### Phase 5: 测试验证 (0.5天)
- 确保169个现有测试全部通过
- 为6个新组件编写单元测试
- 性能基线验证

### Phase 6: 文档更新 (0.5天)
- 更新 CHANGELOG.md
- 创建迁移指南
- 更新 README.md 示例

---

## 三、关键技术决策

### 3.1 目录结构设计
```
src/ecs/
├── core/          # ECS内核（6个新组件）
├── base/          # 基础类（Entity, Component等）
├── utils/         # 工具模块（BitSet, SparseSet等）
├── events/        # 事件系统
└── infrastructure/ # 基础设施（IOC, Canvas）
```

### 3.2 向后兼容策略
保留 `src/base/` 目录，通过 `index.ts` 重导出 `ecs/*` 模块，确保现有代码无需修改。

### 3.3 ECS架构核心
- **Entity**: 纯数字ID（不再是类实例）
- **Component**: 数据容器（POD类型）
- **Archetype**: 相同组件组合的Entity分组
- **World**: 中央调度器，管理所有Entity和Component

---

## 四、成功标准

✅ **必须满足的条件**：
1. 所有169个现有测试100%通过
2. TypeScript编译零错误
3. 完整构建成功（pnpm build）
4. 性能基线达标（Entity创建 < 5ms/10k entities）
5. 向后兼容层正常工作

⚠️ **如果失败触发回滚**：
- 测试失败率 > 5%
- 编译错误 > 0
- 性能下降 > 20%

---

## 五、关键文件清单

**必须修改的核心文件**：
1. `/src/base/index.ts` - 向后兼容层
2. `/src/ecs/core/world.ts` - ECS核心调度器
3. `/src/ecs/core/archetype.ts` - 内存布局管理
4. `/test/ecs/base/entity.test.ts` - 45+测试用例
5. `/scripts/fix-imports.ts` - 自动化导入修复

**详细实施步骤请参见完整策略文档**。

---

## 六、回滚方案

如遇到以下情况立即回滚：
- 测试失败 > 5%
- 编译错误
- 不可修复的性能问题

回滚步骤：
```bash
git checkout <commit-before-migration>
git checkout -b rollback/ecs-migration
pnpm test  # 验证基线状态
```

---

**策略状态**: ✅ 就绪
**预计工期**: 3-5天
**建议执行模式**: Standard（默认）或 TDD（测试驱动）
