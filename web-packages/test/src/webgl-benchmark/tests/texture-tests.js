/**
 * 纹理性能测试套件
 */

import { GLTexture, TextureFormat, TextureFilter, TextureWrap } from '@max/rhi';

// 测试中使用的纹理
let testTexture = null;
let testData = null;

/**
 * 创建测试纹理数据
 * @param {number} width 纹理宽度
 * @param {number} height 纹理高度
 * @returns {Uint8Array} 测试数据
 */
function createTextureData(width, height) {
  const size = width * height * 4; // RGBA数据
  const data = new Uint8Array(size);
  
  for (let i = 0; i < size; i += 4) {
    // 随机RGBA值
    data[i] = Math.floor(Math.random() * 256);     // R
    data[i + 1] = Math.floor(Math.random() * 256); // G
    data[i + 2] = Math.floor(Math.random() * 256); // B
    data[i + 3] = 255;                             // A (完全不透明)
  }
  
  return data;
}

export const textureTests = [
  {
    name: '纹理: 创建2D纹理 (小型 256x256)',
    iterations: 100,
    setup: (renderer) => {
      // 确保清理之前的纹理
      if (testTexture) {
        testTexture.dispose();
        testTexture = null;
      }
      
      // 创建测试数据 (256x256 RGBA)
      testData = createTextureData(256, 256);
    },
    execute: (renderer) => {
      const gl = renderer.getGL();
      testTexture = new GLTexture(gl);
      testTexture.create2D({
        width: 256,
        height: 256,
        format: TextureFormat.RGBA,
        data: testData,
        filter: TextureFilter.LINEAR,
        wrap: TextureWrap.CLAMP
      });
    },
    teardown: () => {
      if (testTexture) {
        testTexture.dispose();
        testTexture = null;
      }
      testData = null;
    }
  },
  
  {
    name: '纹理: 创建2D纹理 (中型 1024x1024)',
    iterations: 20,
    setup: (renderer) => {
      if (testTexture) {
        testTexture.dispose();
        testTexture = null;
      }
      
      // 创建测试数据 (1024x1024 RGBA)
      testData = createTextureData(1024, 1024);
    },
    execute: (renderer) => {
      const gl = renderer.getGL();
      testTexture = new GLTexture(gl);
      testTexture.create2D({
        width: 1024,
        height: 1024,
        format: TextureFormat.RGBA,
        data: testData,
        filter: TextureFilter.LINEAR,
        wrap: TextureWrap.CLAMP
      });
    },
    teardown: () => {
      if (testTexture) {
        testTexture.dispose();
        testTexture = null;
      }
      testData = null;
    }
  },
  
  {
    name: '纹理: 数据更新 (256x256)',
    iterations: 50,
    setup: (renderer) => {
      const gl = renderer.getGL();
      testTexture = new GLTexture(gl);
      testData = createTextureData(256, 256);
      
      testTexture.create2D({
        width: 256,
        height: 256,
        format: TextureFormat.RGBA,
        data: testData,
        filter: TextureFilter.LINEAR,
        wrap: TextureWrap.CLAMP
      });
    },
    execute: () => {
      // 更新随机数据
      for (let i = 0; i < testData.length; i += 4) {
        testData[i] = Math.floor(Math.random() * 256);     // R
        testData[i + 1] = Math.floor(Math.random() * 256); // G
        testData[i + 2] = Math.floor(Math.random() * 256); // B
      }
      
      testTexture.update({
        width: 256,
        height: 256,
        data: testData
      });
    },
    teardown: () => {
      if (testTexture) {
        testTexture.dispose();
        testTexture = null;
      }
      testData = null;
    }
  },
  
  {
    name: '纹理: 绑定与解绑',
    iterations: 5000,
    setup: (renderer) => {
      const gl = renderer.getGL();
      testTexture = new GLTexture(gl);
      testData = createTextureData(64, 64);
      
      testTexture.create2D({
        width: 64,
        height: 64,
        format: TextureFormat.RGBA,
        data: testData,
        filter: TextureFilter.LINEAR,
        wrap: TextureWrap.CLAMP
      });
    },
    execute: () => {
      testTexture.bind(0); // 绑定到纹理单元0
      testTexture.unbind();
    },
    teardown: () => {
      if (testTexture) {
        testTexture.dispose();
        testTexture = null;
      }
      testData = null;
    }
  },
  
  {
    name: '纹理: Mipmaps生成',
    iterations: 30,
    setup: (renderer) => {
      if (testTexture) {
        testTexture.dispose();
        testTexture = null;
      }
      
      testData = createTextureData(512, 512);
    },
    execute: (renderer) => {
      const gl = renderer.getGL();
      testTexture = new GLTexture(gl);
      
      testTexture.create2D({
        width: 512,
        height: 512,
        format: TextureFormat.RGBA,
        data: testData,
        filter: TextureFilter.LINEAR_MIPMAP,
        wrap: TextureWrap.CLAMP,
        generateMipmaps: true
      });
    },
    teardown: () => {
      if (testTexture) {
        testTexture.dispose();
        testTexture = null;
      }
      testData = null;
    }
  }
]; 