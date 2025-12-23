/**
 * Maxellabs 工作流程规范
 * 从设计到上线的全流程数据描述
 */

import type { AssetType, Permission, UsdPrim, UsdValue, Nameable, Describable } from '../core';

/**
 * 工作流程基础接口
 */
export interface WorkflowPrim extends UsdPrim {
  typeName: 'Workflow';
}

/**
 * 工作流程
 */
export interface Workflow extends WorkflowPrim {
  attributes: {
    /**
     * 工作流程名称
     */
    name: UsdValue; // string
    /**
     * 工作流程版本
     */
    version: UsdValue; // string
    /**
     * 创建时间
     */
    createdAt: UsdValue; // string (ISO 8601)
    /**
     * 修改时间
     */
    modifiedAt: UsdValue; // string (ISO 8601)
    /**
     * 创建者
     */
    creator: UsdValue; // string
    /**
     * 描述
     */
    description?: UsdValue; // string
    /**
     * 状态
     */
    status: UsdValue; // WorkflowStatus
  };
  /**
   * 工作流程阶段
   */
  stages: WorkflowStage[];
  /**
   * 工作流程配置
   */
  configuration: WorkflowConfiguration;
  /**
   * 资产管理
   */
  assetManagement: AssetManagement;
  /**
   * 版本控制
   */
  versionControl: VersionControl;
  /**
   * 部署配置
   */
  deployment: DeploymentConfiguration;
}

/**
 * 工作流程状态
 */
export enum WorkflowStatus {
  /**
   * 草稿状态
   */
  Draft = 'draft',
  /**
   * 等待中
   */
  Pending = 'pending',
  /**
   * 运行中
   */
  Running = 'running',
  /**
   * 已完成
   */
  Completed = 'completed',
  /**
   * 失败
   */
  Failed = 'failed',
  /**
   * 已取消
   */
  Cancelled = 'cancelled',
  /**
   * 已暂停
   */
  Paused = 'paused',
  /**
   * 已终止
   */
  Terminated = 'terminated',
}

/**
 * 工作流程阶段
 *
 * @description 组合 Nameable, Describable traits
 */
export interface WorkflowStage extends Nameable, Describable {
  /**
   * 阶段 ID
   */
  id: string;
  /**
   * 阶段类型
   */
  type: WorkflowStageType;
  /**
   * 阶段状态
   */
  status: WorkflowStageStatus;
  /**
   * 依赖阶段
   */
  dependencies: string[];
  /**
   * 阶段任务
   */
  tasks: WorkflowTask[];
  /**
   * 阶段配置
   */
  configuration: StageConfiguration;
  /**
   * 输入资产
   */
  inputs: AssetReference[];
  /**
   * 输出资产
   */
  outputs: AssetReference[];
  /**
   * 质量检查
   */
  qualityChecks: QualityCheck[];
}

/**
 * 工作流程阶段类型
 */
export enum WorkflowStageType {
  /**
   * 设计阶段
   */
  Design = 'design',
  /**
   * 开发阶段
   */
  Development = 'development',
  /**
   * 测试阶段
   */
  Testing = 'testing',
  /**
   * 审查阶段
   */
  Review = 'review',
  /**
   * 构建阶段
   */
  Build = 'build',
  /**
   * 部署阶段
   */
  Deployment = 'deployment',
  /**
   * 发布阶段
   */
  Release = 'release',
  /**
   * 监控阶段
   */
  Monitoring = 'monitoring',
}

/**
 * 工作流程阶段状态
 */
export enum WorkflowStageStatus {
  Pending = 'pending',
  InProgress = 'in-progress',
  Completed = 'completed',
  Failed = 'failed',
  Skipped = 'skipped',
}

/**
 * 工作流程任务
 *
 * @description 组合 Nameable, Describable traits
 */
export interface WorkflowTask extends Nameable, Describable {
  /**
   * 任务 ID
   */
  id: string;
  /**
   * 任务类型
   */
  type: WorkflowTaskType;
  /**
   * 任务状态
   */
  status: WorkflowTaskStatus;
  /**
   * 分配给
   */
  assignee?: string;
  /**
   * 预计时间
   */
  estimatedTime?: number;
  /**
   * 实际时间
   */
  actualTime?: number;
  /**
   * 开始时间
   */
  startTime?: string;
  /**
   * 结束时间
   */
  endTime?: string;
  /**
   * 任务配置
   */
  configuration: TaskConfiguration;
  /**
   * 任务依赖
   */
  dependencies: string[];
  /**
   * 任务输入
   */
  inputs: AssetReference[];
  /**
   * 任务输出
   */
  outputs: AssetReference[];
}

/**
 * 工作流程任务类型
 */
export enum WorkflowTaskType {
  /**
   * 设计任务
   */
  DesignTask = 'design-task',
  /**
   * 开发任务
   */
  DevelopmentTask = 'development-task',
  /**
   * 测试任务
   */
  TestingTask = 'testing-task',
  /**
   * 审查任务
   */
  ReviewTask = 'review-task',
  /**
   * 构建任务
   */
  BuildTask = 'build-task',
  /**
   * 部署任务
   */
  DeploymentTask = 'deployment-task',
  /**
   * 质量检查任务
   */
  QualityCheckTask = 'quality-check-task',
  /**
   * 自动化任务
   */
  AutomationTask = 'automation-task',
  /**
   * 手动任务
   */
  ManualTask = 'manual-task',
}

/**
 * 工作流程任务状态
 */
export enum WorkflowTaskStatus {
  NotStarted = 'not-started',
  InProgress = 'in-progress',
  Completed = 'completed',
  Failed = 'failed',
  Blocked = 'blocked',
  Cancelled = 'cancelled',
}

/**
 * 阶段配置
 */
export interface StageConfiguration {
  /**
   * 自动执行
   */
  autoExecute: boolean;
  /**
   * 并行执行
   */
  parallel: boolean;
  /**
   * 超时时间
   */
  timeout?: number;
  /**
   * 重试次数
   */
  retryCount?: number;
  /**
   * 环境变量
   */
  environment?: Record<string, string>;
  /**
   * 工具配置
   */
  tools?: ToolConfiguration[];
}

/**
 * 任务配置
 */
export interface TaskConfiguration {
  /**
   * 自动执行
   */
  autoExecute: boolean;
  /**
   * 超时时间
   */
  timeout?: number;
  /**
   * 重试次数
   */
  retryCount?: number;
  /**
   * 环境变量
   */
  environment?: Record<string, string>;
  /**
   * 工具配置
   */
  tools?: ToolConfiguration[];
  /**
   * 脚本
   */
  scripts?: ScriptConfiguration[];
}

/**
 * 工具配置
 *
 * @description 组合 Nameable trait
 */
export interface ToolConfiguration extends Nameable {
  /**
   * 工具版本
   */
  version: string;
  /**
   * 工具配置
   */
  config: Record<string, any>;
  /**
   * 工具参数
   */
  parameters?: Record<string, any>;
}

/**
 * 脚本配置
 *
 * @description 组合 Nameable trait
 */
export interface ScriptConfiguration extends Nameable {
  /**
   * 脚本类型
   */
  type: 'shell' | 'node' | 'python' | 'custom';
  /**
   * 脚本内容
   */
  content: string;
  /**
   * 脚本参数
   */
  parameters?: Record<string, any>;
}

/**
 * 工作流程配置
 */
export interface WorkflowConfiguration {
  /**
   * 触发器
   */
  triggers: WorkflowTrigger[];
  /**
   * 通知配置
   */
  notifications: NotificationConfiguration[];
  /**
   * 权限配置
   */
  permissions: PermissionConfiguration;
  /**
   * 集成配置
   */
  integrations: IntegrationConfiguration[];
}

/**
 * 工作流程触发器
 */
export interface WorkflowTrigger {
  /**
   * 触发器类型
   */
  type: WorkflowTriggerType;
  /**
   * 触发条件
   */
  condition: TriggerCondition;
  /**
   * 触发配置
   */
  configuration: Record<string, any>;
}

/**
 * 工作流程触发器类型
 */
export enum WorkflowTriggerType {
  Manual = 'manual',
  Schedule = 'schedule',
  FileChange = 'file-change',
  GitPush = 'git-push',
  GitPullRequest = 'git-pull-request',
  DesignUpdate = 'design-update',
  AssetUpdate = 'asset-update',
  Webhook = 'webhook',
}

/**
 * 触发条件
 */
export interface TriggerCondition {
  /**
   * 条件表达式
   */
  expression: string;
  /**
   * 条件参数
   */
  parameters?: Record<string, any>;
}

/**
 * 通知配置
 */
export interface NotificationConfiguration {
  /**
   * 通知类型
   */
  type: NotificationType;
  /**
   * 通知目标
   */
  targets: string[];
  /**
   * 通知事件
   */
  events: NotificationEvent[];
  /**
   * 通知模板
   */
  template?: string;
  /**
   * 通知配置
   */
  configuration: Record<string, any>;
}

/**
 * 通知类型
 */
export enum NotificationType {
  Email = 'email',
  Slack = 'slack',
  Teams = 'teams',
  Discord = 'discord',
  Webhook = 'webhook',
  SMS = 'sms',
}

/**
 * 通知事件
 */
export enum NotificationEvent {
  WorkflowStarted = 'workflow-started',
  WorkflowCompleted = 'workflow-completed',
  WorkflowFailed = 'workflow-failed',
  StageStarted = 'stage-started',
  StageCompleted = 'stage-completed',
  StageFailed = 'stage-failed',
  TaskStarted = 'task-started',
  TaskCompleted = 'task-completed',
  TaskFailed = 'task-failed',
}

/**
 * 权限配置
 */
export interface PermissionConfiguration {
  /**
   * 角色权限
   */
  roles: RolePermission[];
  /**
   * 用户权限
   */
  users: UserPermission[];
  /**
   * 团队权限
   */
  teams: TeamPermission[];
}

/**
 * 角色权限
 */
export interface RolePermission {
  /**
   * 角色名称
   */
  role: string;
  /**
   * 权限列表
   */
  permissions: Permission[];
}

/**
 * 用户权限
 */
export interface UserPermission {
  /**
   * 用户 ID
   */
  userId: string;
  /**
   * 权限列表
   */
  permissions: Permission[];
}

/**
 * 团队权限
 */
export interface TeamPermission {
  /**
   * 团队 ID
   */
  teamId: string;
  /**
   * 权限列表
   */
  permissions: Permission[];
}

/**
 * 集成配置
 *
 * @description 组合 Nameable trait
 */
export interface IntegrationConfiguration extends Nameable {
  /**
   * 集成类型
   */
  type: IntegrationType;
  /**
   * 集成配置
   */
  configuration: Record<string, any>;
  /**
   * 认证信息
   */
  authentication?: AuthenticationConfiguration;
}

/**
 * 集成类型
 */
export enum IntegrationType {
  Figma = 'figma',
  Sketch = 'sketch',
  AdobeXD = 'adobe-xd',
  Git = 'git',
  GitHub = 'github',
  GitLab = 'gitlab',
  Bitbucket = 'bitbucket',
  Jira = 'jira',
  Trello = 'trello',
  Asana = 'asana',
  Slack = 'slack',
  Teams = 'teams',
  AWS = 'aws',
  Azure = 'azure',
  GCP = 'gcp',
  Vercel = 'vercel',
  Netlify = 'netlify',
}

/**
 * 认证配置
 */
export interface AuthenticationConfiguration {
  /**
   * 认证类型
   */
  type: AuthenticationType;
  /**
   * 认证参数
   */
  parameters: Record<string, any>;
}

/**
 * 认证类型
 */
export enum AuthenticationType {
  ApiKey = 'api-key',
  OAuth = 'oauth',
  Token = 'token',
  BasicAuth = 'basic-auth',
  Certificate = 'certificate',
}

/**
 * 资产管理
 */
export interface AssetManagement {
  /**
   * 资产存储
   */
  storage: AssetStorage;
  /**
   * 资产转换
   */
  transformation: AssetTransformation;
  /**
   * 资产优化
   */
  optimization: AssetOptimization;
  /**
   * 资产分发
   */
  distribution: AssetDistribution;
}

/**
 * 资产存储
 */
export interface AssetStorage {
  /**
   * 存储类型
   */
  type: StorageType;
  /**
   * 存储配置
   */
  configuration: Record<string, any>;
  /**
   * 存储路径
   */
  basePath: string;
  /**
   * 版本控制
   */
  versioning: boolean;
}

/**
 * 存储类型
 */
export enum StorageType {
  Local = 'local',
  S3 = 's3',
  GCS = 'gcs',
  Azure = 'azure',
  CDN = 'cdn',
}

/**
 * 资产转换
 */
export interface AssetTransformation {
  /**
   * 转换规则
   */
  rules: TransformationRule[];
  /**
   * 转换工具
   */
  tools: ToolConfiguration[];
}

/**
 * 转换规则
 *
 * @description 组合 Nameable trait
 */
export interface TransformationRule extends Nameable {
  /**
   * 源格式
   */
  sourceFormat: string;
  /**
   * 目标格式
   */
  targetFormat: string;
  /**
   * 转换配置
   */
  configuration: Record<string, any>;
  /**
   * 条件
   */
  condition?: string;
}

/**
 * 资产优化
 */
export interface AssetOptimization {
  /**
   * 优化规则
   */
  rules: OptimizationRule[];
  /**
   * 优化工具
   */
  tools: ToolConfiguration[];
}

/**
 * 优化规则
 *
 * @description 组合 Nameable trait
 */
export interface OptimizationRule extends Nameable {
  /**
   * 资产类型
   */
  assetType: string;
  /**
   * 优化配置
   */
  configuration: Record<string, any>;
  /**
   * 条件
   */
  condition?: string;
}

/**
 * 资产分发
 */
export interface AssetDistribution {
  /**
   * 分发目标
   */
  targets: DistributionTarget[];
  /**
   * 分发策略
   */
  strategy: DistributionStrategy;
}

/**
 * 分发目标
 *
 * @description 组合 Nameable trait
 */
export interface DistributionTarget extends Nameable {
  /**
   * 目标类型
   */
  type: DistributionTargetType;
  /**
   * 目标配置
   */
  configuration: Record<string, any>;
}

/**
 * 分发目标类型
 */
export enum DistributionTargetType {
  CDN = 'cdn',
  S3 = 's3',
  GCS = 'gcs',
  Azure = 'azure',
  FTP = 'ftp',
  HTTP = 'http',
}

/**
 * 分发策略
 */
export interface DistributionStrategy {
  /**
   * 策略类型
   */
  type: DistributionStrategyType;
  /**
   * 策略配置
   */
  configuration: Record<string, any>;
}

/**
 * 分发策略类型
 */
export enum DistributionStrategyType {
  Immediate = 'immediate',
  Scheduled = 'scheduled',
  OnDemand = 'on-demand',
  Conditional = 'conditional',
}

/**
 * 版本控制
 */
export interface VersionControl {
  /**
   * 版本控制系统
   */
  system: VersionControlSystem;
  /**
   * 分支策略
   */
  branchStrategy: BranchStrategy;
  /**
   * 合并策略
   */
  mergeStrategy: MergeStrategy;
  /**
   * 标签策略
   */
  tagStrategy: TagStrategy;
}

/**
 * 版本控制系统
 */
export interface VersionControlSystem {
  /**
   * 系统类型
   */
  type: 'git' | 'svn' | 'mercurial';
  /**
   * 仓库 URL
   */
  repositoryUrl: string;
  /**
   * 认证配置
   */
  authentication: AuthenticationConfiguration;
}

/**
 * 分支策略
 */
export interface BranchStrategy {
  /**
   * 策略类型
   */
  type: BranchStrategyType;
  /**
   * 主分支
   */
  mainBranch: string;
  /**
   * 开发分支
   */
  developBranch?: string;
  /**
   * 功能分支前缀
   */
  featureBranchPrefix?: string;
  /**
   * 发布分支前缀
   */
  releaseBranchPrefix?: string;
  /**
   * 热修复分支前缀
   */
  hotfixBranchPrefix?: string;
}

/**
 * 分支策略类型
 */
export enum BranchStrategyType {
  GitFlow = 'git-flow',
  GitHubFlow = 'github-flow',
  GitLabFlow = 'gitlab-flow',
  Custom = 'custom',
}

/**
 * 合并策略
 */
export interface MergeStrategy {
  /**
   * 策略类型
   */
  type: MergeStrategyType;
  /**
   * 自动合并
   */
  autoMerge: boolean;
  /**
   * 合并检查
   */
  checks: MergeCheck[];
}

/**
 * 合并策略类型
 */
export enum MergeStrategyType {
  Merge = 'merge',
  Squash = 'squash',
  Rebase = 'rebase',
}

/**
 * 合并检查
 */
export interface MergeCheck {
  /**
   * 检查类型
   */
  type: MergeCheckType;
  /**
   * 检查配置
   */
  configuration: Record<string, any>;
}

/**
 * 合并检查类型
 */
export enum MergeCheckType {
  StatusCheck = 'status-check',
  ReviewRequired = 'review-required',
  ConflictResolution = 'conflict-resolution',
  TestPassing = 'test-passing',
}

/**
 * 标签策略
 */
export interface TagStrategy {
  /**
   * 自动标签
   */
  autoTag: boolean;
  /**
   * 标签模式
   */
  pattern: string;
  /**
   * 标签前缀
   */
  prefix?: string;
}

/**
 * 部署配置
 */
export interface DeploymentConfiguration {
  /**
   * 部署环境
   */
  environments: DeploymentEnvironment[];
  /**
   * 部署策略
   */
  strategy: DeploymentStrategy;
  /**
   * 回滚配置
   */
  rollback: RollbackConfiguration;
}

/**
 * 部署环境
 *
 * @description 组合 Nameable trait
 */
export interface DeploymentEnvironment extends Nameable {
  /**
   * 环境类型
   */
  type: EnvironmentType;
  /**
   * 环境配置
   */
  configuration: Record<string, any>;
  /**
   * 部署目标
   */
  targets: DeploymentTarget[];
}

/**
 * 环境类型
 */
export enum EnvironmentType {
  Development = 'development',
  Testing = 'testing',
  Staging = 'staging',
  Production = 'production',
}

/**
 * 部署目标
 *
 * @description 组合 Nameable trait
 */
export interface DeploymentTarget extends Nameable {
  /**
   * 目标类型
   */
  type: DeploymentTargetType;
  /**
   * 目标配置
   */
  configuration: Record<string, any>;
}

/**
 * 部署目标类型
 */
export enum DeploymentTargetType {
  /**
   * Kubernetes
   */
  Kubernetes = 'kubernetes',
  /**
   * Docker
   */
  Docker = 'docker',
  /**
   * AWS
   */
  AWS = 'aws',
  /**
   * Azure
   */
  Azure = 'azure',
  /**
   * Google Cloud
   */
  GCP = 'gcp',
  /**
   * Vercel
   */
  Vercel = 'vercel',
  /**
   * Netlify
   */
  Netlify = 'netlify',
  /**
   * FTP服务器
   */
  FTP = 'ftp',
  /**
   * 自定义服务器
   */
  Custom = 'custom',
}

/**
 * 部署策略
 */
export interface DeploymentStrategy {
  /**
   * 策略类型
   */
  type: DeploymentStrategyType;
  /**
   * 策略配置
   */
  configuration: Record<string, any>;
}

/**
 * 部署策略类型
 */
export enum DeploymentStrategyType {
  BlueGreen = 'blue-green',
  Canary = 'canary',
  Rolling = 'rolling',
  Recreate = 'recreate',
}

/**
 * 回滚配置
 */
export interface RollbackConfiguration {
  /**
   * 自动回滚
   */
  autoRollback: boolean;
  /**
   * 回滚条件
   */
  conditions: RollbackCondition[];
  /**
   * 回滚策略
   */
  strategy: RollbackStrategy;
}

/**
 * 回滚条件
 */
export interface RollbackCondition {
  /**
   * 条件类型
   */
  type: RollbackConditionType;
  /**
   * 条件配置
   */
  configuration: Record<string, any>;
}

/**
 * 回滚条件类型
 */
export enum RollbackConditionType {
  HealthCheck = 'health-check',
  ErrorRate = 'error-rate',
  ResponseTime = 'response-time',
  Manual = 'manual',
}

/**
 * 回滚策略
 */
export interface RollbackStrategy {
  /**
   * 策略类型
   */
  type: RollbackStrategyType;
  /**
   * 策略配置
   */
  configuration: Record<string, any>;
}

/**
 * 回滚策略类型
 */
export enum RollbackStrategyType {
  Immediate = 'immediate',
  Gradual = 'gradual',
  Manual = 'manual',
}

/**
 * 资产引用
 */
export interface AssetReference {
  /**
   * 资产 ID
   */
  id: string;
  /**
   * 资产类型
   */
  type: AssetType;
  /**
   * 资产路径
   */
  path: string;
  /**
   * 资产版本
   */
  version?: string;
  /**
   * 资产元数据
   */
  metadata?: Record<string, any>;
}

/**
 * 质量检查
 *
 * @description 组合 Nameable trait
 */
export interface QualityCheck extends Nameable {
  /**
   * 检查类型
   */
  type: QualityCheckType;
  /**
   * 检查配置
   */
  configuration: Record<string, any>;
  /**
   * 检查结果
   */
  result?: QualityCheckResult;
}

/**
 * 质量检查类型
 */
export enum QualityCheckType {
  DesignConsistency = 'design-consistency',
  AccessibilityCompliance = 'accessibility-compliance',
  PerformanceTest = 'performance-test',
  CodeQuality = 'code-quality',
  SecurityScan = 'security-scan',
  UnitTest = 'unit-test',
  IntegrationTest = 'integration-test',
  E2ETest = 'e2e-test',
  VisualRegression = 'visual-regression',
}

/**
 * 质量检查结果
 */
export interface QualityCheckResult {
  /**
   * 检查状态
   */
  status: QualityCheckStatus;
  /**
   * 检查分数
   */
  score?: number;
  /**
   * 检查消息
   */
  message?: string;
  /**
   * 检查详情
   */
  details?: QualityCheckDetail[];
  /**
   * 检查时间
   */
  timestamp: string;
}

/**
 * 质量检查状态
 */
export enum QualityCheckStatus {
  Passed = 'passed',
  Failed = 'failed',
  Warning = 'warning',
  Skipped = 'skipped',
}

/**
 * 质量检查详情
 */
export interface QualityCheckDetail {
  /**
   * 详情类型
   */
  type: 'error' | 'warning' | 'info';
  /**
   * 详情消息
   */
  message: string;
  /**
   * 详情位置
   */
  location?: string;
  /**
   * 详情建议
   */
  suggestion?: string;
}
