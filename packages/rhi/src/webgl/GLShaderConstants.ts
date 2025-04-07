export const GLShaderConstants = {
  // 顶点着色器
  VERTEX_SHADER: `
    attribute vec3 aPosition;
    attribute vec2 aTexCoord;
    attribute vec4 aColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform vec4 uColor;

    varying vec2 vTexCoord;
    varying vec4 vColor;

    void main() {
      vTexCoord = aTexCoord;
      vColor = aColor * uColor;
      gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
    }
  `,

  // 片段着色器
  FRAGMENT_SHADER: `
    precision mediump float;

    uniform sampler2D uTexture;
    uniform vec4 uColor;

    varying vec2 vTexCoord;
    varying vec4 vColor;

    void main() {
      vec4 texColor = texture2D(uTexture, vTexCoord);
      gl_FragColor = texColor * vColor * uColor;
    }
  `,

  // 后处理顶点着色器
  POST_PROCESS_VERTEX_SHADER: `
    attribute vec2 aPosition;
    attribute vec2 aTexCoord;

    varying vec2 vTexCoord;

    void main() {
      vTexCoord = aTexCoord;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `,

  // 后处理片段着色器
  POST_PROCESS_FRAGMENT_SHADER: `
    precision mediump float;

    uniform sampler2D uTexture;
    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uIntensity;

    varying vec2 vTexCoord;

    void main() {
      vec4 color = texture2D(uTexture, vTexCoord);
      gl_FragColor = color;
    }
  `,
} as const; 