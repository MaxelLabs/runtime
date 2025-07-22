# 贡献指南

感谢您对Maxellabs Specification项目的贡献！本指南将帮助您了解如何为项目做出贡献。

## 🎯 贡献类型

### 🐛 报告Bug

- 使用[Bug Report模板](https://github.com/maxellabs/specification/issues/new?template=bug_report.md)
- 提供最小复现示例
- 包含环境信息（Node.js版本、TypeScript版本等）

### 💡 新功能建议

- 使用[Feature Request模板](https://github.com/maxellabs/specification/issues/new?template=feature_request.md)
- 描述使用场景和预期效果
- 考虑向后兼容性

### 📚 文档改进

- 修复拼写错误或不清晰的描述
- 添加代码示例
- 改进API文档

### 🔧 代码贡献

- 修复类型定义错误
- 优化架构设计
- 添加新的规范模块

## 🚀 开发环境设置

### 前置要求

- Node.js 18.0+
- TypeScript 5.0+
- Git

### 环境配置

```bash
# 克隆仓库
git clone https://github.com/maxellabs/specification.git
cd specification

# 安装依赖
npm install

# 验证安装
npm run test
npm run lint
```

### 开发工具

推荐使用VS Code并安装以下扩展：

- TypeScript and JavaScript Language Features
- ESLint
- Prettier

## 📋 开发规范

### 1. 代码风格

```typescript
// ✅ 推荐：清晰的类型定义
export interface AnimationState {
  /** 状态ID */
  id: string;
  /** 状态名称 */
  name: string;
  /** 动画剪辑路径 */
  clip: string;
  /** 播放速度，默认为1.0 */
  speed?: number;
}

// ❌ 避免：缺少注释和默认值
export interface AnimationState {
  id: string;
  name: string;
  clip: string;
  speed: number;
}
```

### 2. 模块组织

```
src/
├── [module-name]/
│   ├── index.ts          # 统一导出
│   ├── [feature].ts      # 功能实现
│   └── types.ts          # 类型定义（如需要）
```

### 3. 命名规范

| 类型 | 规范             | 示例                      |
| ---- | ---------------- | ------------------------- |
| 接口 | PascalCase       | `AnimationState`          |
| 枚举 | PascalCase       | `AnimationType`           |
| 属性 | camelCase        | `animationState`          |
| 常量 | UPPER_SNAKE_CASE | `DEFAULT_ANIMATION_SPEED` |

### 4. 导入导出规范

```typescript
// ✅ 推荐：类型导入
import type { AnimationState } from '../animation';

// ✅ 推荐：直接导出
export { AnimationState } from './types';

// ❌ 避免：通配符导入
import * as Animation from './animation';
```

## 🔍 代码审查检查清单

### 类型定义

- [ ] 所有接口都有完整的JSDoc注释
- [ ] 类型名称清晰且符合规范
- [ ] 没有重复的类型定义
- [ ] 向后兼容性问题已考虑

### 架构规范

- [ ] 无循环依赖
- [ ] 模块边界清晰
- [ ] 类型权威来源单一
- [ ] 导入路径相对且正确

### 代码质量

- [ ] 通过所有TypeScript检查
- [ ] 通过ESLint检查
- [ ] 包含适当的测试用例
- [ ] 文档已更新

## 🧪 测试规范

### 类型测试

```typescript
// 创建测试用例
const testAnimationState: AnimationState = {
  id: 'test-id',
  name: 'Test Animation',
  clip: 'test.fbx',
  speed: 1.0,
  loop: true,
  weight: 1.0,
};

// 验证类型兼容性
expect(testAnimationState).toBeDefined();
```

### 集成测试

```typescript
// 验证模块间交互
import type { DesignElement } from '../design';
import type { AnimationState } from '../animation';

// 测试类型引用
const animatedElement: DesignElement & { animation?: AnimationState } = {
  // 组合类型定义
};
```

## 📖 文档规范

### API文档

- 每个导出的类型都需要JSDoc注释
- 包含使用示例
- 说明可能的值和默认值

````typescript
/**
 * 动画状态定义
 * @example
 * ```typescript
 * const idleState: AnimationState = {
 *   id: 'idle',
 *   name: '待机',
 *   clip: 'idle.fbx',
 *   speed: 1.0,
 *   loop: true
 * };
 * ```
 */
export interface AnimationState {
  /** 唯一标识符 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 动画资源路径 */
  clip: string;
  /** 播放速度，默认为1.0 */
  speed?: number;
}
````

## 🔄 提交规范

### 提交消息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### 类型说明

- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具

#### 示例

```
feat(animation): 添加动画混合器支持

- 新增AnimationMixer接口
- 支持多层动画混合
- 添加混合模式配置

Closes #123
```

## 🚀 发布流程

### 1. 创建功能分支

```bash
git checkout -b feat/add-animation-mixer
```

### 2. 开发并测试

```bash
npm run test
npm run lint
npm run build
```

### 3. 提交更改

```bash
git add .
git commit -m "feat(animation): 添加动画混合器支持"
```

### 4. 创建Pull Request

- 使用[PR模板](https://github.com/maxellabs/specification/compare)
- 填写PR描述
- 请求代码审查

### 5. 合并到主分支

- 通过所有检查
- 获得至少一个审查批准
- 合并到main分支

## 🆘 常见问题

### Q: 如何处理类型冲突？

A: 检查是否有重复定义，优先使用权威来源的类型。

### Q: 如何添加新的枚举值？

A: 在对应的枚举中添加值，确保向后兼容。

### Q: 如何处理跨模块依赖？

A: 使用类型导入，避免运行时依赖。

## 📞 联系方式

- **Issues**: [GitHub Issues](https://github.com/maxellabs/specification/issues)
- **Discussions**: [GitHub Discussions](https://github.com/maxellabs/specification/discussions)
- **Email**: support@maxellabs.com

## 🏆 贡献者

感谢所有为项目做出贡献的开发者！

<a href="https://github.com/maxellabs/specification/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=maxellabs/specification" />
</a>
