export class GLDevice {
    private gl: WebGL2RenderingContext | WebGLRenderingContext;
    private extensions: Record<string, any> = {};
    private capabilities: {
      maxTextureSize: number;
      maxCubeMapSize: number;
      maxRenderTextureSize: number;
      maxVertexAttribs: number;
      supportInstancedArrays: boolean;
      supportMultiRenderTargets: boolean;
      // 更多设备能力指标
    };
    private contextLost: boolean = false;
    
    constructor(canvas: HTMLCanvasElement, options?: WebGLContextAttributes) {
      // 尝试创建 WebGL2 上下文，如果不支持则回退到 WebGL1
      this.gl = canvas.getContext('webgl2', options) || 
               canvas.getContext('webgl', options) ||
               canvas.getContext('experimental-webgl', options) as WebGLRenderingContext;
               
      if (!this.gl) {
        throw new Error('WebGL not supported');
      }
      
      // 初始化设备能力参数
      this.detectCapabilities();
      this.loadExtensions();
      canvas.addEventListener('webglcontextlost', this.handleContextLost.bind(this));
    }
    
    private detectCapabilities(): void {
      const gl = this.gl;
      this.capabilities = {
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxCubeMapSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
        maxRenderTextureSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
        maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
        supportInstancedArrays: (gl instanceof WebGL2RenderingContext) || 
                               !!this.getExtension('ANGLE_instanced_arrays'),
        supportMultiRenderTargets: (gl instanceof WebGL2RenderingContext) ||
                                  !!this.getExtension('WEBGL_draw_buffers')
      };
    }
    
    private loadExtensions(): void {
      // 加载关键扩展
      const extensionsToLoad = [
        'EXT_texture_filter_anisotropic',
        'OES_texture_float',
        'OES_texture_half_float',
        'WEBGL_compressed_texture_s3tc',
        'WEBGL_depth_texture'
      ];
      
      extensionsToLoad.forEach(ext => {
        try {
          const extension = this.gl.getExtension(ext);
          if (extension) {
            this.extensions[ext] = extension;
          }
        } catch (e) {
          console.warn(`Extension ${ext} not supported`);
        }
      });
    }
    
    // 获取WebGL上下文
    getContext(): WebGL2RenderingContext | WebGLRenderingContext {
      return this.gl;
    }
    
    // 检查是否支持特定扩展
    isExtensionSupported(extensionName: string): boolean {
      return !!this.extensions[extensionName];
    }
    
    // 获取特定扩展
    getExtension(extensionName: string): any {
      if (!this.extensions[extensionName]) {
        this.extensions[extensionName] = this.gl.getExtension(extensionName);
      }
      return this.extensions[extensionName];
    }
    
    // 获取设备能力
    getCapabilities() {
      return { ...this.capabilities };
    }
    
    // 检查是否为WebGL2
    isWebGL2(): boolean {
      return this.gl instanceof WebGL2RenderingContext;
    }

    private handleContextLost(_ignore: Event) {
      this.contextLost = true;
    }
  }