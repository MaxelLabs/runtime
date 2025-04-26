/**
 * 缓冲区性能测试套件
 */

import { GLBuffer, BufferType, BufferUsage } from '@max/rhi';

// 测试中使用的缓冲区
let testBuffer = null;
let testData = null;

/**
 * 创建测试数据
 * @param {number} size 数据大小
 * @returns {Float32Array} 测试数据
 */
function createTestData(size) {
  const data = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    data[i] = Math.random();
  }
  return data;
}

export const bufferTests = [
  {
    name: '缓冲区: 创建顶点缓冲区 (小型 4KB)',
    iterations: 200,
    setup: (renderer) => {
      // 确保清理之前的测试
      if (testBuffer) {
        testBuffer.dispose();
        testBuffer = null;
      }
      
      // 创建测试数据 (1024个float = 4KB)
      testData = createTestData(1024);
    },
    execute: (renderer) => {
      const gl = renderer.getGL();
      testBuffer = new GLBuffer(gl);
      testBuffer.create(BufferType.VERTEX, testData, gl.STATIC_DRAW);
    },
    teardown: () => {
      if (testBuffer) {
        testBuffer.dispose();
        testBuffer = null;
      }
      testData = null;
    }
  },
  
  {
    name: '缓冲区: 创建顶点缓冲区 (中型 256KB)',
    iterations: 50,
    setup: (renderer) => {
      if (testBuffer) {
        testBuffer.dispose();
        testBuffer = null;
      }
      
      // 创建测试数据 (65536个float = 256KB)
      testData = createTestData(65536);
    },
    execute: (renderer) => {
      const gl = renderer.getGL();
      testBuffer = new GLBuffer(gl);
      testBuffer.create(BufferType.VERTEX, testData, gl.STATIC_DRAW);
    },
    teardown: () => {
      if (testBuffer) {
        testBuffer.dispose();
        testBuffer = null;
      }
      testData = null;
    }
  },
  
  {
    name: '缓冲区: 创建顶点缓冲区 (大型 4MB)',
    iterations: 10,
    setup: (renderer) => {
      if (testBuffer) {
        testBuffer.dispose();
        testBuffer = null;
      }
      
      // 创建测试数据 (1048576个float = 4MB)
      testData = createTestData(1048576);
    },
    execute: (renderer) => {
      const gl = renderer.getGL();
      testBuffer = new GLBuffer(gl);
      testBuffer.create(BufferType.VERTEX, testData, gl.STATIC_DRAW);
    },
    teardown: () => {
      if (testBuffer) {
        testBuffer.dispose();
        testBuffer = null;
      }
      testData = null;
    }
  },
  
  {
    name: '缓冲区: 数据更新 (小型 4KB)',
    iterations: 100,
    setup: (renderer) => {
      const gl = renderer.getGL();
      testBuffer = new GLBuffer(gl);
      testData = createTestData(1024);
      testBuffer.create(BufferType.VERTEX, testData, gl.DYNAMIC_DRAW);
    },
    execute: () => {
      // 更新随机数据
      for (let i = 0; i < testData.length; i++) {
        testData[i] = Math.random();
      }
      testBuffer.update(testData);
    },
    teardown: () => {
      if (testBuffer) {
        testBuffer.dispose();
        testBuffer = null;
      }
      testData = null;
    }
  },
  
  {
    name: '缓冲区: 数据更新 (中型 256KB)',
    iterations: 20,
    setup: (renderer) => {
      const gl = renderer.getGL();
      testBuffer = new GLBuffer(gl);
      testData = createTestData(65536);
      testBuffer.create(BufferType.VERTEX, testData, gl.DYNAMIC_DRAW);
    },
    execute: () => {
      // 更新随机数据
      for (let i = 0; i < testData.length; i++) {
        testData[i] = Math.random();
      }
      testBuffer.update(testData);
    },
    teardown: () => {
      if (testBuffer) {
        testBuffer.dispose();
        testBuffer = null;
      }
      testData = null;
    }
  },
  
  {
    name: '缓冲区: 绑定与解绑',
    iterations: 10000,
    setup: (renderer) => {
      const gl = renderer.getGL();
      testBuffer = new GLBuffer(gl);
      testData = createTestData(1024);
      testBuffer.create(BufferType.VERTEX, testData, gl.STATIC_DRAW);
    },
    execute: () => {
      testBuffer.bind();
      testBuffer.unbind();
    },
    teardown: () => {
      if (testBuffer) {
        testBuffer.dispose();
        testBuffer = null;
      }
      testData = null;
    }
  },
  
  {
    name: '缓冲区: 索引缓冲区创建',
    iterations: 100,
    setup: (renderer) => {
      if (testBuffer) {
        testBuffer.dispose();
        testBuffer = null;
      }
      
      // 创建索引数据
      testData = new Uint16Array(10000);
      for (let i = 0; i < testData.length; i++) {
        testData[i] = i % 65536; // Uint16Array最大值为65535
      }
    },
    execute: (renderer) => {
      const gl = renderer.getGL();
      testBuffer = new GLBuffer(gl);
      testBuffer.create(BufferType.INDEX, testData, gl.STATIC_DRAW);
    },
    teardown: () => {
      if (testBuffer) {
        testBuffer.dispose();
        testBuffer = null;
      }
      testData = null;
    }
  }
]; 