/**
 * 基础测试，验证测试环境配置
 */

import { expect } from '@jest/globals';

describe('基础测试', () => {
  test('Jest 配置正常工作', () => {
    expect(1 + 1).toBe(2);
  });

  test('自定义匹配器应该可用', () => {
    (expect({ x: 1, y: 2, z: 3 }) as any).toEqualVector3({ x: 1, y: 2, z: 3 });
  });
});
