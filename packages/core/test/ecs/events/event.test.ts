/**
 * Event 测试
 * 测试基本事件对象功能
 */
import { describe, it, expect } from '@jest/globals';
import { Event } from '../../../src/ecs/events/event';

describe('Event', () => {
  describe('构造函数', () => {
    it('应该创建带类型的事件', () => {
      const event = new Event('click');

      expect(event.type).toBe('click');
      expect(event.bubbles).toBe(false);
      expect(event.data).toBeUndefined();
    });

    it('应该创建带冒泡的事件', () => {
      const event = new Event('click', true);

      expect(event.type).toBe('click');
      expect(event.bubbles).toBe(true);
    });

    it('应该创建带数据的事件', () => {
      const data = { x: 10, y: 20 };
      const event = new Event('click', false, data);

      expect(event.type).toBe('click');
      expect(event.data).toBe(data);
    });

    it('应该设置时间戳', () => {
      const before = Date.now();
      const event = new Event('click');
      const after = Date.now();

      expect(event.timestamp).toBeGreaterThanOrEqual(before);
      expect(event.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('target 和 currentTarget', () => {
    it('应该允许设置 target', () => {
      const event = new Event('click');
      const target = { name: 'button' };

      event.target = target;

      expect(event.target).toBe(target);
    });

    it('应该允许设置 currentTarget', () => {
      const event = new Event('click');
      const currentTarget = { name: 'container' };

      event.currentTarget = currentTarget;

      expect(event.currentTarget).toBe(currentTarget);
    });
  });

  describe('stopPropagation 方法', () => {
    it('应该停止事件传播', () => {
      const event = new Event('click');

      expect(event.isPropagationStopped()).toBe(false);

      event.stopPropagation();

      expect(event.isPropagationStopped()).toBe(true);
    });

    it('应该不影响立即停止状态', () => {
      const event = new Event('click');

      event.stopPropagation();

      expect(event.isImmediatelyStopped()).toBe(false);
    });
  });

  describe('stopImmediatePropagation 方法', () => {
    it('应该立即停止事件传播', () => {
      const event = new Event('click');

      expect(event.isImmediatelyStopped()).toBe(false);

      event.stopImmediatePropagation();

      expect(event.isImmediatelyStopped()).toBe(true);
    });

    it('应该同时设置普通停止状态', () => {
      const event = new Event('click');

      event.stopImmediatePropagation();

      expect(event.isPropagationStopped()).toBe(true);
    });
  });

  describe('isPropagationStopped 方法', () => {
    it('应该返回 false 对于新事件', () => {
      const event = new Event('click');

      expect(event.isPropagationStopped()).toBe(false);
    });

    it('应该返回 true 在调用 stopPropagation 后', () => {
      const event = new Event('click');
      event.stopPropagation();

      expect(event.isPropagationStopped()).toBe(true);
    });

    it('应该返回 true 在调用 stopImmediatePropagation 后', () => {
      const event = new Event('click');
      event.stopImmediatePropagation();

      expect(event.isPropagationStopped()).toBe(true);
    });
  });

  describe('isImmediatelyStopped 方法', () => {
    it('应该返回 false 对于新事件', () => {
      const event = new Event('click');

      expect(event.isImmediatelyStopped()).toBe(false);
    });

    it('应该返回 false 在调用 stopPropagation 后', () => {
      const event = new Event('click');
      event.stopPropagation();

      expect(event.isImmediatelyStopped()).toBe(false);
    });

    it('应该返回 true 在调用 stopImmediatePropagation 后', () => {
      const event = new Event('click');
      event.stopImmediatePropagation();

      expect(event.isImmediatelyStopped()).toBe(true);
    });
  });

  describe('reset 方法', () => {
    it('应该重置所有属性', () => {
      const event = new Event('click', true, { x: 10 });
      event.target = { name: 'button' };
      event.currentTarget = { name: 'container' };
      event.stopImmediatePropagation();

      event.reset();

      expect(event.type).toBeNull();
      expect(event.target).toBeNull();
      expect(event.currentTarget).toBeNull();
      expect(event.bubbles).toBe(false);
      expect(event.data).toBeNull();
      expect(event.timestamp).toBe(0);
      expect(event.isPropagationStopped()).toBe(false);
      expect(event.isImmediatelyStopped()).toBe(false);
    });

    it('应该允许重置后重新使用', () => {
      const event = new Event('click');
      event.stopPropagation();

      event.reset();

      // 重新设置属性
      event.type = 'mouseover';
      event.bubbles = true;
      event.data = { newData: true };

      expect(event.type).toBe('mouseover');
      expect(event.bubbles).toBe(true);
      expect(event.data).toEqual({ newData: true });
      expect(event.isPropagationStopped()).toBe(false);
    });
  });

  describe('事件池模式', () => {
    it('应该支持事件池复用', () => {
      // 模拟事件池
      const eventPool: Event[] = [];

      // 获取或创建事件
      function getEvent(type: string, bubbles: boolean = false, data?: any): Event {
        let event = eventPool.pop();
        if (!event) {
          event = new Event(type, bubbles, data);
        } else {
          event.type = type;
          event.bubbles = bubbles;
          event.data = data;
          event.timestamp = Date.now();
        }
        return event;
      }

      // 回收事件
      function releaseEvent(event: Event): void {
        event.reset();
        eventPool.push(event);
      }

      // 使用事件
      const event1 = getEvent('click', false, { x: 10 });
      expect(event1.type).toBe('click');

      // 回收
      releaseEvent(event1);
      expect(eventPool.length).toBe(1);

      // 复用
      const event2 = getEvent('mouseover', true);
      expect(event2).toBe(event1); // 同一个对象
      expect(event2.type).toBe('mouseover');
      expect(event2.bubbles).toBe(true);
      expect(eventPool.length).toBe(0);
    });
  });

  describe('实际使用场景', () => {
    it('应该支持事件冒泡模拟', () => {
      const event = new Event('click', true);
      const path: string[] = [];

      // 模拟事件路径
      const elements = [
        { name: 'button', handler: () => path.push('button') },
        { name: 'div', handler: () => path.push('div') },
        { name: 'body', handler: () => path.push('body') },
      ];

      // 触发事件
      for (const element of elements) {
        if (event.isPropagationStopped()) {
          break;
        }
        event.currentTarget = element;
        element.handler();
      }

      expect(path).toEqual(['button', 'div', 'body']);
    });

    it('应该支持停止冒泡', () => {
      const event = new Event('click', true);
      const path: string[] = [];

      const elements = [
        {
          name: 'button',
          handler: () => {
            path.push('button');
            event.stopPropagation();
          },
        },
        { name: 'div', handler: () => path.push('div') },
        { name: 'body', handler: () => path.push('body') },
      ];

      for (const element of elements) {
        if (event.isPropagationStopped()) {
          break;
        }
        event.currentTarget = element;
        element.handler();
      }

      expect(path).toEqual(['button']);
    });

    it('应该支持立即停止传播', () => {
      const event = new Event('click', true);
      const calls: string[] = [];

      // 模拟同一元素上的多个监听器
      const listeners = [
        () => {
          calls.push('listener1');
          event.stopImmediatePropagation();
        },
        () => calls.push('listener2'),
        () => calls.push('listener3'),
      ];

      for (const listener of listeners) {
        if (event.isImmediatelyStopped()) {
          break;
        }
        listener();
      }

      expect(calls).toEqual(['listener1']);
    });

    it('应该支持携带自定义数据', () => {
      interface MouseEventData {
        x: number;
        y: number;
        button: number;
      }

      const data: MouseEventData = { x: 100, y: 200, button: 0 };
      const event = new Event('mousedown', false, data);

      expect(event.data.x).toBe(100);
      expect(event.data.y).toBe(200);
      expect(event.data.button).toBe(0);
    });
  });
});
