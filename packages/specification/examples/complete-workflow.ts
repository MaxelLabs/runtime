/**
 * Maxellabs 全流程数据描述示例
 * 展示从设计到上线的完整工作流程
 */

import type {
  // USD 核心
  UsdStage,
  UsdLayer,
  UsdPrim,
  SpherePrim,

  // 材质
  Material,

  // 设计系统
  DesignDocument,
  DesignSystem,
  DesignIconLibrary,
  DesignElement,

  // 工作流程
  Workflow,
  WorkflowStage,

  // 包格式
  MaxellabsPackage,
  PackageMetadata,
  AssetManifest,
  PackageConfiguration,
} from '../src/index';
import {
  UsdDataType,

  // 几何体
  MeshPrim,
  PreviewSurfaceShader,
  DesignIcon,
  DesignElementType,
  WorkflowStageType,
} from '../src/index';

/**
 * 1. 创建设计系统和图标库
 */
function createDesignSystem(): DesignSystem {
  // 图标库
  const iconLibrary: DesignIconLibrary = {
    name: 'App Icons',
    version: '1.0.0',
    icons: {
      home: {
        id: 'home',
        name: 'Home',
        category: 'navigation',
        tags: ['house', 'main', 'start'],
        sizes: [16, 24, 32, 48],
        svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        variants: [
          {
            name: 'outline',
            style: 'outline',
            svg: `<svg viewBox="0 0 24 24" fill="none">...</svg>`,
          },
          {
            name: 'filled',
            style: 'filled',
            svg: `<svg viewBox="0 0 24 24" fill="currentColor">...</svg>`,
          },
        ],
      },
      user: {
        id: 'user',
        name: 'User',
        category: 'people',
        tags: ['person', 'profile', 'account'],
        sizes: [16, 24, 32, 48],
        svg: `<svg viewBox="0 0 24 24" fill="none">
          <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2"/>
          <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
        </svg>`,
      },
    },
    categories: [
      {
        id: 'navigation',
        name: 'Navigation',
        description: 'Navigation related icons',
      },
      {
        id: 'people',
        name: 'People',
        description: 'People and user related icons',
      },
    ],
  };

  return {
    name: 'Mobile App Design System',
    version: '1.0.0',
    colors: {
      primary: {
        name: 'Primary Blue',
        variants: {
          '50': { r: 0.94, g: 0.97, b: 1, a: 1 },
          '500': { r: 0.24, g: 0.58, b: 0.96, a: 1 },
          '900': { r: 0.05, g: 0.24, b: 0.56, a: 1 },
        },
      },
      neutral: {
        name: 'Neutral Gray',
        variants: {
          '50': { r: 0.98, g: 0.98, b: 0.98, a: 1 },
          '500': { r: 0.5, g: 0.5, b: 0.5, a: 1 },
          '900': { r: 0.1, g: 0.1, b: 0.1, a: 1 },
        },
      },
      semantic: {
        success: {
          name: 'Success Green',
          variants: {
            '500': { r: 0.13, g: 0.7, b: 0.27, a: 1 },
          },
        },
        warning: {
          name: 'Warning Orange',
          variants: {
            '500': { r: 0.96, g: 0.58, b: 0.24, a: 1 },
          },
        },
        error: {
          name: 'Error Red',
          variants: {
            '500': { r: 0.94, g: 0.27, b: 0.27, a: 1 },
          },
        },
        info: {
          name: 'Info Blue',
          variants: {
            '500': { r: 0.24, g: 0.58, b: 0.96, a: 1 },
          },
        },
      },
    },
    typography: {
      fontFamilies: [
        {
          name: 'Inter',
          files: [
            {
              weight: 400,
              style: 'normal',
              url: '/fonts/Inter-Regular.woff2',
              format: 'woff2',
            },
            {
              weight: 600,
              style: 'normal',
              url: '/fonts/Inter-SemiBold.woff2',
              format: 'woff2',
            },
          ],
          fallback: ['system-ui', 'sans-serif'],
        },
      ],
      scale: {
        base: 16,
        ratio: 1.25,
        sizes: {
          xs: 12,
          sm: 14,
          base: 16,
          lg: 20,
          xl: 24,
          '2xl': 32,
        },
      },
      textStyles: {
        'heading-1': {
          fontFamily: 'Inter',
          fontSize: 32,
          fontWeight: 600,
          lineHeight: 1.2,
        },
        body: {
          fontFamily: 'Inter',
          fontSize: 16,
          fontWeight: 400,
          lineHeight: 1.5,
        },
      },
    },
    spacing: {
      base: 4,
      scale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96],
      named: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
      },
    },
    components: {
      name: 'App Components',
      version: '1.0.0',
      components: {
        button: {
          id: 'button',
          name: 'Button',
          description: 'Primary button component',
          category: 'form',
          properties: [
            {
              name: 'variant',
              type: 'variant',
              defaultValue: 'primary',
              options: ['primary', 'secondary', 'outline'],
            },
            {
              name: 'size',
              type: 'variant',
              defaultValue: 'medium',
              options: ['small', 'medium', 'large'],
            },
          ],
          masterInstance: {
            id: 'button-master',
            name: 'Button',
            type: DesignElementType.Rectangle,
            bounds: { x: 0, y: 0, width: 120, height: 40 },
            visible: true,
            locked: false,
            opacity: 1,
          },
        },
      },
    },
    icons: iconLibrary,
    styles: {
      name: 'App Styles',
      version: '1.0.0',
      styles: {
        'primary-button': {
          id: 'primary-button',
          name: 'Primary Button',
          type: 'fill',
          properties: {
            fills: [
              {
                type: 'solid',
                color: { r: 0.24, g: 0.58, b: 0.96, a: 1 },
                opacity: 1,
                visible: true,
              },
            ],
            cornerRadius: 8,
          },
        },
      },
    },
  };
}

/**
 * 2. 创建设计文档
 */
function createDesignDocument(designSystem: DesignSystem): DesignDocument {
  const homePageElements: DesignElement[] = [
    {
      id: 'header',
      name: 'Header',
      type: DesignElementType.Frame,
      bounds: { x: 0, y: 0, width: 375, height: 80 },
      visible: true,
      locked: false,
      opacity: 1,
      style: {
        fills: [
          {
            type: 'solid',
            color: { r: 1, g: 1, b: 1, a: 1 },
            opacity: 1,
            visible: true,
          },
        ],
      },
      children: [
        {
          id: 'home-icon',
          name: 'Home Icon',
          type: DesignElementType.Vector,
          bounds: { x: 20, y: 28, width: 24, height: 24 },
          visible: true,
          locked: false,
          opacity: 1,
        },
        {
          id: 'title',
          name: 'Title',
          type: DesignElementType.Text,
          bounds: { x: 60, y: 28, width: 200, height: 24 },
          visible: true,
          locked: false,
          opacity: 1,
          style: {
            textStyle: {
              fontFamily: 'Inter',
              fontSize: 18,
              fontWeight: 600,
            },
          },
        },
      ],
    },
  ];

  return {
    typeName: 'DesignDocument',
    path: '/design/mobile-app',
    active: true,
    attributes: {
      name: { type: UsdDataType.String, value: 'Mobile App UI' },
      version: { type: UsdDataType.String, value: '1.0.0' },
      createdAt: { type: UsdDataType.String, value: new Date().toISOString() },
      modifiedAt: { type: UsdDataType.String, value: new Date().toISOString() },
      author: { type: UsdDataType.String, value: 'Design Team' },
    },
    relationships: {},
    metadata: {},
    children: [],
    pages: [
      {
        id: 'home-page',
        name: 'Home Page',
        type: 'page',
        canvasSize: { width: 375, height: 812 },
        backgroundColor: '#FFFFFF',
        elements: homePageElements,
      },
    ],
    designSystem: designSystem,
  };
}

/**
 * 3. 创建 3D 场景
 */
function create3DScene(): UsdStage {
  // 创建根层
  const rootLayer: UsdLayer = {
    identifier: '/scene/root.usda',
    version: '1.0',
    subLayers: [],
    primSpecs: {},
    timeCodesPerSecond: 60,
    startTimeCode: 0,
    endTimeCode: 300,
  };

  // 创建球体几何体
  const spherePrim: SpherePrim = {
    typeName: 'Sphere',
    path: '/World/Sphere',
    active: true,
    attributes: {
      radius: { type: UsdDataType.Double, value: 1.0 },
      visible: { type: UsdDataType.Bool, value: true },
    },
    relationships: {
      'material:binding': ['/Materials/DefaultMaterial'],
    },
    metadata: {},
    children: [],
    radius: 1.0,
    purpose: 'default',
  };

  // 创建材质
  const material: Material = {
    typeName: 'Material',
    path: '/Materials/DefaultMaterial',
    active: true,
    attributes: {
      name: { type: UsdDataType.String, value: 'Default Material' },
    },
    relationships: {},
    metadata: {},
    children: [],
    shaderNetwork: {
      nodes: {
        surface: {
          id: 'surface',
          type: 'PreviewSurface',
          position: { x: 0, y: 0 },
          parameters: {
            diffuseColor: { type: UsdDataType.Color3f, value: [0.8, 0.8, 0.8] },
            metallic: { type: UsdDataType.Float, value: 0.0 },
            roughness: { type: UsdDataType.Float, value: 0.5 },
          },
        },
      },
      connections: [],
    },
  };

  // 创建根 Prim
  const rootPrim: UsdPrim = {
    path: '/',
    typeName: 'Xform',
    active: true,
    attributes: {},
    relationships: {},
    metadata: {},
    children: [
      {
        path: '/World',
        typeName: 'Xform',
        active: true,
        attributes: {},
        relationships: {},
        metadata: {},
        children: [spherePrim],
      },
      {
        path: '/Materials',
        typeName: 'Scope',
        active: true,
        attributes: {},
        relationships: {},
        metadata: {},
        children: [material],
      },
    ],
  };

  return {
    rootLayer: rootLayer,
    pseudoRoot: rootPrim,
    timeCodesPerSecond: 60,
    startTimeCode: 0,
    endTimeCode: 300,
    framesPerSecond: 60,
  };
}

/**
 * 4. 创建工作流程
 */
function createWorkflow(): Workflow {
  const designStage: WorkflowStage = {
    name: 'Design',
    type: WorkflowStageType.Design,
    description: '设计阶段：创建 UI 设计和交互原型',
    tasks: [
      {
        id: 'ui-design',
        name: 'UI 设计',
        description: '创建应用界面设计',
        type: 'design',
        status: 'pending',
        assignees: ['designer@company.com'],
        estimatedHours: 40,
        dependencies: [],
      },
      {
        id: 'icon-design',
        name: '图标设计',
        description: '设计应用图标库',
        type: 'design',
        status: 'pending',
        assignees: ['icon-designer@company.com'],
        estimatedHours: 16,
        dependencies: [],
      },
    ],
    approvers: ['design-lead@company.com'],
    gates: [
      {
        name: 'Design Review',
        type: 'approval',
        criteria: ['UI 设计完成', '图标库完成', '设计规范确认'],
        required: true,
      },
    ],
  };

  const developmentStage: WorkflowStage = {
    name: 'Development',
    type: WorkflowStageType.Development,
    description: '开发阶段：实现 UI 和 3D 功能',
    tasks: [
      {
        id: 'frontend-dev',
        name: '前端开发',
        description: '实现用户界面',
        type: 'development',
        status: 'pending',
        assignees: ['frontend-dev@company.com'],
        estimatedHours: 80,
        dependencies: ['ui-design'],
      },
      {
        id: '3d-integration',
        name: '3D 集成',
        description: '集成 3D 场景和渲染',
        type: 'development',
        status: 'pending',
        assignees: ['3d-dev@company.com'],
        estimatedHours: 60,
        dependencies: [],
      },
    ],
    approvers: ['tech-lead@company.com'],
    dependencies: ['Design'],
  };

  return {
    name: 'Mobile App Development',
    description: '从设计到上线的完整移动应用开发流程',
    version: '1.0.0',
    stages: [designStage, developmentStage],
    triggers: [
      {
        name: 'Design Completion',
        type: 'stage_completion',
        condition: {
          stage: 'Design',
          allTasksCompleted: true,
        },
        actions: [
          {
            type: 'start_stage',
            target: 'Development',
          },
          {
            type: 'send_notification',
            recipients: ['tech-lead@company.com'],
            message: '设计阶段已完成，开发阶段可以开始',
          },
        ],
      },
    ],
    notifications: {
      channels: [
        {
          type: 'email',
          enabled: true,
          settings: {
            smtp: 'smtp.company.com',
          },
        },
        {
          type: 'slack',
          enabled: true,
          settings: {
            webhook: 'https://hooks.slack.com/...',
          },
        },
      ],
      events: ['task_assigned', 'task_completed', 'stage_completed'],
    },
  };
}

/**
 * 5. 创建完整的 Maxellabs 包
 */
function createMaxellabsPackage(): MaxellabsPackage {
  const designSystem = createDesignSystem();
  const designDocument = createDesignDocument(designSystem);
  const stage = create3DScene();
  const workflow = createWorkflow();

  const metadata: PackageMetadata = {
    name: 'mobile-app-ui',
    version: '1.0.0',
    description: '移动应用 UI 设计和 3D 场景包',
    author: {
      name: 'Maxellabs Design Team',
      email: 'design@maxellabs.com',
      organization: 'Maxellabs',
    },
    license: 'MIT',
    keywords: ['mobile', 'ui', '3d', 'design-system'],
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    size: 1024 * 1024, // 1MB
    fileCount: 15,
    checksum: 'sha256:abc123...',
    compatibility: {
      minEngineVersion: '1.0.0',
      platforms: ['web', 'ios', 'android'],
      browsers: [
        {
          name: 'Chrome',
          minVersion: '90',
        },
        {
          name: 'Safari',
          minVersion: '14',
        },
      ],
    },
  };

  const assetManifest: AssetManifest = {
    assets: [
      {
        id: 'design-doc',
        name: 'Mobile App Design',
        type: 'design',
        path: '/design/mobile-app.usda',
        size: 256 * 1024,
        mimeType: 'application/usd',
        checksum: 'sha256:def456...',
      },
      {
        id: 'home-icon',
        name: 'Home Icon',
        type: 'icon',
        path: '/icons/home.svg',
        size: 2048,
        mimeType: 'image/svg+xml',
        checksum: 'sha256:ghi789...',
        tags: ['navigation', 'home'],
      },
    ],
    statistics: {
      totalFiles: 15,
      totalSize: 1024 * 1024,
      byType: {
        design: { count: 1, size: 256 * 1024, averageSize: 256 * 1024 },
        icon: { count: 10, size: 20480, averageSize: 2048 },
        usd: { count: 3, size: 512 * 1024, averageSize: 170 * 1024 },
        image: { count: 1, size: 235 * 1024, averageSize: 235 * 1024 },
      },
      byExtension: {
        '.usda': { count: 4, size: 768 * 1024, mimeType: 'application/usd' },
        '.svg': { count: 10, size: 20480, mimeType: 'image/svg+xml' },
        '.png': { count: 1, size: 235 * 1024, mimeType: 'image/png' },
      },
    },
    index: {
      byId: {
        'design-doc': '/design/mobile-app.usda',
        'home-icon': '/icons/home.svg',
      },
      byName: {
        'Mobile App Design': ['design-doc'],
        'Home Icon': ['home-icon'],
      },
      byType: {
        design: ['design-doc'],
        icon: ['home-icon'],
      },
      byTag: {
        navigation: ['home-icon'],
        home: ['home-icon'],
      },
      dependencyGraph: {
        nodes: [
          { id: 'design-doc', assetId: 'design-doc', type: 'design' },
          { id: 'home-icon', assetId: 'home-icon', type: 'icon' },
        ],
        edges: [{ from: 'design-doc', to: 'home-icon', type: 'uses' }],
      },
    },
  };

  const configuration: PackageConfiguration = {
    build: {
      target: 'es2020',
      mode: 'production',
      outputDir: './dist',
      sourceMap: false,
      minify: true,
      codeSplitting: true,
      treeShaking: true,
      env: {
        NODE_ENV: 'production',
      },
    },
    runtime: {
      renderer: {
        type: 'webgl2',
        antialias: true,
        alpha: true,
        depth: true,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance',
      },
      loader: {
        concurrency: 4,
        timeout: 30000,
        retries: 3,
        preload: true,
        lazyLoad: true,
        cacheStrategy: 'hybrid',
      },
      cache: {
        enabled: true,
        maxSize: 100,
        ttl: 3600,
        strategy: 'hybrid',
        keyPrefix: 'maxellabs:',
      },
      performance: {
        targetFPS: 60,
        maxMemory: 512,
        gpuMemoryLimit: 256,
        adaptiveQuality: true,
        monitoring: true,
      },
    },
    optimization: {
      texture: {
        compression: ['astc', 'etc', 'dxt'],
        maxSize: 2048,
        generateMipmaps: true,
        formatConversion: true,
      },
      geometry: {
        mergeVertices: true,
        optimizeIndices: true,
        simplification: true,
        compression: true,
      },
      material: {
        mergeMaterials: true,
        removeUnused: true,
        shaderOptimization: true,
      },
      animation: {
        keyframeOptimization: true,
        compression: true,
        sampleRateOptimization: true,
      },
    },
    security: {
      csp: {
        enabled: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'", "'unsafe-inline'"],
          'style-src': ["'self'", "'unsafe-inline'"],
        },
      },
      sri: {
        enabled: true,
        algorithm: 'sha384',
        crossorigin: 'anonymous',
      },
      accessControl: {
        allowedOrigins: ['https://app.maxellabs.com'],
        allowedMethods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: false,
      },
    },
    debug: {
      enabled: false,
      logLevel: 'warn',
      profiling: false,
      stats: false,
      debugPanel: false,
    },
  };

  return {
    version: '1.0.0',
    metadata: metadata,
    stage: stage,
    designDocuments: [designDocument],
    workflows: [workflow],
    assetManifest: assetManifest,
    configuration: configuration,
  };
}

/**
 * 主函数：创建完整的示例
 */
export function createCompleteWorkflowExample(): MaxellabsPackage {
  console.log('创建 Maxellabs 全流程数据描述示例...');

  const package = createMaxellabsPackage();

  console.log('✅ 示例创建完成！');
  console.log(`📦 包名称: ${package.metadata.name}`);
  console.log(`📋 设计文档数量: ${package.designDocuments.length}`);
  console.log(`🔄 工作流程数量: ${package.workflows.length}`);
  console.log(`📁 资产数量: ${package.assetManifest.assets.length}`);
  console.log(`🎨 图标数量: ${Object.keys(package.designDocuments[0].designSystem?.icons?.icons || {}).length}`);

  return package;
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  createCompleteWorkflowExample();
}
