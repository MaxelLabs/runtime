/**
 * Time 模块测试
 * 测试时间管理系统
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { Time } from '../../../src/ecs/utils/time';

describe('Time - 时间管理', () => {
  let time: Time;

  beforeEach(() => {
    time = new Time();
  });

  describe('构造函数和reset', () => {
    it('应该初始化为0', () => {
      expect(time.currentTime).toBe(0);
      expect(time.deltaTime).toBe(0);
      expect(time.timeSinceStartup).toBe(0);
      expect(time.frame).toBe(0);
    });

    it('reset应该重置所有时间', () => {
      time.update(16);
      time.update(16);

      time.reset();

      expect(time.currentTime).toBe(0);
      expect(time.deltaTime).toBe(0);
      expect(time.frame).toBe(0);
    });
  });

  describe('update - 时间更新', () => {
    it('应该更新deltaTime', () => {
      time.update(16); // 16ms

      expect(time.deltaTime).toBeCloseTo(0.016, 3); // 约0.016秒
    });

    it('应该累积currentTime', () => {
      time.update(16);
      time.update(16);
      time.update(16);

      expect(time.currentTime).toBeCloseTo(0.048, 3); // 3帧 * 0.016秒
    });

    it('应该累积timeSinceStartup', () => {
      time.update(16);
      time.update(16);

      expect(time.timeSinceStartup).toBeGreaterThan(0);
    });

    it('应该更新帧数', () => {
      time.update(16);
      time.update(16);
      time.update(16);

      expect(time.frame).toBe(3);
    });

    it('应该限制最大时间步长', () => {
      time.maximumDeltaTime = 0.1; // 设置最大时间步长为0.1秒
      time.update(1000); // 传入1秒

      expect(time.unscaledDelta).toBeLessThanOrEqual(0.1);
    });
  });

  describe('timeScale - 时间缩放', () => {
    it('应该支持时间缩放', () => {
      time.timeScale = 0.5; // 半速
      time.update(16);

      expect(time.deltaTime).toBeCloseTo(0.008, 3); // 0.016 * 0.5
    });

    it('时间缩放不应该影响unscaledDelta', () => {
      time.timeScale = 0.5;
      time.update(16);

      expect(time.unscaledDelta).toBeCloseTo(0.016, 3);
      expect(time.deltaTime).toBeCloseTo(0.008, 3);
    });

    it('应该支持时间加速', () => {
      time.timeScale = 2.0; // 双速
      time.update(16);

      expect(time.deltaTime).toBeCloseTo(0.032, 3); // 0.016 * 2
    });

    it('应该支持暂停（timeScale = 0）', () => {
      time.timeScale = 0;
      time.update(16);
      time.update(16);

      expect(time.deltaTime).toBe(0);
      expect(time.currentTime).toBe(0);
    });
  });

  describe('fixedUpdate - 固定更新', () => {
    it('应该检测需要固定更新', () => {
      time.fixedDeltaTime = 0.02; // 50Hz

      time.update(16);

      expect(time.needFixedUpdate()).toBe(false); // 0.016 < 0.02

      time.update(8);

      expect(time.needFixedUpdate()).toBe(true); // 0.016 + 0.008 > 0.02
    });

    it('执行固定更新应该消耗累积器', () => {
      time.fixedDeltaTime = 0.02;

      time.update(40); // 0.04秒

      expect(time.needFixedUpdate()).toBe(true);

      time.performFixedUpdate();

      expect(time.fixedTimeAccumulator).toBeCloseTo(0.02, 3); // 0.04 - 0.02

      time.performFixedUpdate();

      expect(time.fixedTimeAccumulator).toBeCloseTo(0, 3);
    });

    it('应该支持多次固定更新', () => {
      time.fixedDeltaTime = 0.016; // ~60Hz

      time.update(80); // 0.08秒

      let fixedUpdateCount = 0;
      while (time.needFixedUpdate()) {
        time.performFixedUpdate();
        fixedUpdateCount++;
      }

      expect(fixedUpdateCount).toBe(5); // 0.08 / 0.016 = 5（避免浮点数精度问题）
    });
  });

  describe('fps - 帧率计算', () => {
    it('应该计算当前帧率', () => {
      time.update(16); // 16ms = 60fps

      expect(time.fps).toBeCloseTo(62.5, 0); // 1 / 0.016 ≈ 62.5
    });

    it('deltaTime为0时fps应该为0', () => {
      expect(time.fps).toBe(0);
    });

    it('应该反映不同帧率', () => {
      time.update(33.33); // ~30fps

      expect(time.fps).toBeCloseTo(30, 0);
    });
  });

  describe('复杂场景', () => {
    it('应该支持典型游戏循环', () => {
      time.fixedDeltaTime = 0.02; // 50Hz物理更新

      // 模拟游戏循环
      for (let i = 0; i < 60; i++) {
        time.update(16); // 60FPS

        // 处理固定更新
        while (time.needFixedUpdate()) {
          // 物理更新
          time.performFixedUpdate();
        }

        // 渲染更新
        // ...
      }

      expect(time.frame).toBe(60);
      expect(time.currentTime).toBeCloseTo(0.96, 1); // 约1秒
    });

    it('应该处理帧率波动', () => {
      const frameTimes = [16, 20, 15, 18, 16, 25, 14]; // 不稳定帧时间

      frameTimes.forEach((ft) => {
        time.update(ft);
      });

      expect(time.frame).toBe(frameTimes.length);
      expect(time.currentTime).toBeGreaterThan(0);
    });

    it('应该支持慢动作效果', () => {
      time.timeScale = 0.2; // 慢动作

      const before = time.currentTime;
      time.update(16);
      const after = time.currentTime;

      const actualDelta = after - before;
      expect(actualDelta).toBeLessThan(0.016);
    });
  });
});
