/**
 * Maxellabs 设计协作定义
 * 包含协作者、权限和共享相关类型
 */

import type { Permission, SharingSettings } from '../core';

/**
 * 协作信息
 */
export interface CollaborationInfo {
  /**
   * 协作者列表
   */
  collaborators: Collaborator[];
  /**
   * 权限设置
   */
  permissions?: PermissionSettings;
  /**
   * 共享设置
   */
  sharing?: SharingSettings;
  /**
   * 协作历史
   */
  history?: CollaborationHistory[];
}

/**
 * 协作者
 */
export interface Collaborator {
  /**
   * 用户 ID
   */
  userId: string;
  /**
   * 用户名
   */
  username: string;
  /**
   * 显示名称
   */
  displayName?: string;
  /**
   * 头像URL
   */
  avatar?: string;
  /**
   * 角色
   */
  role: CollaboratorRole;
  /**
   * 权限
   */
  permissions: Permission[];
  /**
   * 邀请时间
   */
  invitedAt?: string;
  /**
   * 最后活动时间
   */
  lastActiveAt?: string;
  /**
   * 状态
   */
  status?: CollaboratorStatus;
}

/**
 * 协作者角色
 */
export enum CollaboratorRole {
  Owner = 'owner',
  Editor = 'editor',
  Viewer = 'viewer',
  Commenter = 'commenter',
  Guest = 'guest',
}

/**
 * 协作者状态
 */
export enum CollaboratorStatus {
  Active = 'active',
  Pending = 'pending',
  Inactive = 'inactive',
  Banned = 'banned',
}

/**
 * 权限设置
 */
export interface PermissionSettings {
  /**
   * 默认权限
   */
  default: Permission[];
  /**
   * 自定义权限
   */
  custom?: Record<string, Permission[]>;
  /**
   * 权限继承
   */
  inheritance?: boolean;
  /**
   * 权限过期时间
   */
  expiresAt?: Record<string, string>;
}

/**
 * 协作历史
 */
export interface CollaborationHistory {
  /**
   * 历史 ID
   */
  id: string;
  /**
   * 操作类型
   */
  action: CollaborationAction;
  /**
   * 操作者
   */
  actor: string;
  /**
   * 目标对象
   */
  target?: string;
  /**
   * 操作时间
   */
  timestamp: string;
  /**
   * 操作描述
   */
  description?: string;
  /**
   * 元数据
   */
  metadata?: Record<string, any>;
}

/**
 * 协作操作
 */
export enum CollaborationAction {
  Invite = 'invite',
  Join = 'join',
  Leave = 'leave',
  PermissionChange = 'permission_change',
  RoleChange = 'role_change',
  Share = 'share',
  Unshare = 'unshare',
  Comment = 'comment',
  Edit = 'edit',
  Delete = 'delete',
  Export = 'export',
}
