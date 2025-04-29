/**
 * 着色器性能测试套件
 */

import { GLShader, GLRenderer } from '@max/rhi';

// 样本着色器代码
const basicVertexShader = `
  attribute vec3 aPosition;
  attribute vec2 aTexCoord;
  
  uniform mat4 uModelMatrix;
  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;
  
  varying vec2 vTexCoord;
  
  void main() {
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
    vTexCoord = aTexCoord;
  }
`;

const basicFragmentShader = `
  precision mediump float;
  
  varying vec2 vTexCoord;
  
  uniform sampler2D uTexture;
  
  void main() {
    gl_FragColor = texture2D(uTexture, vTexCoord);
  }
`;

const complexVertexShader = `
  attribute vec3 aPosition;
  attribute vec3 aNormal;
  attribute vec2 aTexCoord;
  attribute vec4 aTangent;
  
  uniform mat4 uModelMatrix;
  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;
  uniform mat4 uNormalMatrix;
  uniform vec3 uCameraPosition;
  
  varying vec2 vTexCoord;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;
  varying mat3 vTBN;
  
  void main() {
    vec4 worldPos = uModelMatrix * vec4(aPosition, 1.0);
    vWorldPos = worldPos.xyz;
    vViewDir = normalize(uCameraPosition - worldPos.xyz);
    
    vNormal = normalize((uNormalMatrix * vec4(aNormal, 0.0)).xyz);
    
    vec3 T = normalize((uModelMatrix * vec4(aTangent.xyz, 0.0)).xyz);
    vec3 N = vNormal;
    vec3 B = normalize(cross(N, T) * aTangent.w);
    vTBN = mat3(T, B, N);
    
    vTexCoord = aTexCoord;
    
    gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
  }
`;

const complexFragmentShader = `
  precision highp float;
  
  varying vec2 vTexCoord;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;
  varying mat3 vTBN;
  
  uniform sampler2D uAlbedoMap;
  uniform sampler2D uNormalMap;
  uniform sampler2D uMetallicMap;
  uniform sampler2D uRoughnessMap;
  uniform sampler2D uAOMap;
  
  uniform vec3 uLightPositions[4];
  uniform vec3 uLightColors[4];
  
  const float PI = 3.14159265359;
  
  void main() {
    vec3 albedo = vec3(0.5);
    float metallic = 0.5;
    float roughness = 0.5;
    float ao = 1.0;
    
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewDir);
    
    vec3 F0 = vec3(0.04); 
    F0 = mix(F0, albedo, metallic);
    
    vec3 Lo = vec3(0.0);
    
    for(int i = 0; i < 1; ++i) {
      vec3 L = normalize(uLightPositions[i] - vWorldPos);
      vec3 H = normalize(V + L);
      
      float distance = length(uLightPositions[i] - vWorldPos);
      float attenuation = 1.0 / (distance * distance);
      vec3 radiance = uLightColors[i] * attenuation;
      
      vec3 color = albedo * 0.5 + radiance * 0.5;
      Lo += color;
    }
    
    gl_FragColor = vec4(Lo, 1.0);
  }
`;

// 保存着色器引用
let testShader: GLShader | null = null;
let testMatrix: Float32Array | null = null;

export const shaderTests = [
  {
    name: '着色器: 编译基本着色器',
    iterations: 50,
    setup: (renderer: GLRenderer) => {
      // 确保之前的着色器被清理
      if (testShader) {
        testShader.dispose();
        testShader = null;
      }
    },
    execute: (renderer: GLRenderer) => {
      const gl = renderer.getGL();
      const shader = new GLShader(gl);
      shader.create(basicVertexShader, basicFragmentShader);
      
      // 确保清理之前的着色器
      if (testShader) {
        testShader.dispose();
      }
      testShader = shader;
    },
    teardown: () => {
      if (testShader) {
        testShader.dispose();
        testShader = null;
      }
    }
  },
  
  {
    name: '着色器: 编译复杂PBR着色器',
    iterations: 20,
    setup: (renderer: GLRenderer) => {
      // 确保之前的着色器被清理
      if (testShader) {
        testShader.dispose();
        testShader = null;
      }
    },
    execute: (renderer: GLRenderer) => {
      const gl = renderer.getGL();
      const shader = new GLShader(gl);
      shader.create(complexVertexShader, complexFragmentShader);
      
      // 确保清理之前的着色器
      if (testShader) {
        testShader.dispose();
      }
      testShader = shader;
    },
    teardown: () => {
      if (testShader) {
        testShader.dispose();
        testShader = null;
      }
    }
  },
  
  {
    name: '着色器: 绑定与解绑',
    iterations: 2000,
    setup: (renderer: any) => {
      const gl = renderer.getGL();
      testShader = new GLShader(gl);
      testShader.create(basicVertexShader, basicFragmentShader);
    },
    execute: (renderer: any) => {
      testShader.bind();
      testShader.unbind();
    },
    teardown: () => {
      if (testShader) {
        testShader.dispose();
        testShader = null;
      }
    }
  },
  
  {
    name: '着色器: 设置Uniform (矩阵)',
    iterations: 1000,
    setup: (renderer: any) => {
      const gl = renderer.getGL();
      testShader = new GLShader(gl);
      testShader.create(basicVertexShader, basicFragmentShader);
      
      // 创建测试矩阵
      testMatrix = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
      ]);
    },
    execute: () => {
      testShader.bind();
      testShader.setUniformMatrix4fv('uModelMatrix', testMatrix);
      testShader.unbind();
    },
    teardown: () => {
      if (testShader) {
        testShader.dispose();
        testShader = null;
      }
      testMatrix = null;
    }
  },
  
  {
    name: '着色器: 设置多个Uniform',
    iterations: 1000,
    setup: (renderer: GLRenderer) => {
      const gl = renderer.getGL();
      testShader = new GLShader(gl);
      testShader.create(basicVertexShader, basicFragmentShader);
      
      // 创建测试矩阵
      testMatrix = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
      ]);
    },
    execute: (renderer: GLRenderer) => {
      testShader.bind();
      testShader.setUniformMatrix4fv('uModelMatrix', testMatrix);
      testShader.setUniformMatrix4fv('uViewMatrix', testMatrix);
      testShader.setUniformMatrix4fv('uProjectionMatrix', testMatrix);
      testShader.setUniform1i('uTexture', 0);
      testShader.unbind();
    },
    teardown: () => {
      if (testShader) {
        testShader.dispose();
        testShader = null;
      }
      testMatrix = null;
    }
  }
]; 