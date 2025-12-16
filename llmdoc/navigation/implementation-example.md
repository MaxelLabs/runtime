# 导航系统实现示例

> **具体代码实现参考** | 前端组件和后端服务的完整示例

## 🎯 前端实现示例

### 1. 快速跳转组件 (QuickJump)
```typescript
// components/QuickJump.tsx
import React, { useState, useEffect, useRef } from 'react'
import { Input, AutoComplete, Tag, Space } from 'antd'
import { SearchOutlined, HistoryOutlined, StarOutlined } from '@ant-design/icons'
import { debounce } from 'lodash'
import { useTranslation } from 'react-i18next'

interface QuickJumpProps {
  onJump: (target: JumpTarget) => void
  placeholder?: string
  maxResults?: number
}

interface JumpTarget {
  id: string
  title: string
  path: string
  type: 'document' | 'api' | 'example' | 'tutorial'
  category: string
  tags: string[]
  icon: React.ReactNode
  description?: string
  relevance?: number
}

export const QuickJump: React.FC<QuickJumpProps> = ({
  onJump,
  placeholder = "搜索文档、API或示例...",
  maxResults = 10
}) => {
  const [searchText, setSearchText] = useState('')
  const [suggestions, setSuggestions] = useState<JumpTarget[]>([])
  const [loading, setLoading] = useState(false)
  const [recentHistory, setRecentHistory] = useState<JumpTarget[]>([])
  const inputRef = useRef<Input>(null)
  const { t } = useTranslation()

  // 获取搜索建议
  const fetchSuggestions = debounce(async (query: string) => {
    if (!query.trim()) {
      setSuggestions(recentHistory.slice(0, 5))
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      setSuggestions(data.results.slice(0, maxResults))
    } catch (error) {
      console.error('Search failed:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, 300)

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 监听搜索输入
  useEffect(() => {
    fetchSuggestions(searchText)
  }, [searchText])

  // 渲染建议项
  const renderOption = (item: JumpTarget) => {
    return (
      <div className="quick-jump-option">
        <div className="option-header">
          <Space>
            {item.icon}
            <span className="option-title">{highlightMatch(item.title, searchText)}</span>
            <Tag size="small" color={getTypeColor(item.type)}>
              {t(`types.${item.type}`)}
            </Tag>
          </Space>
        </div>

        {item.description && (
          <div className="option-description">
            {highlightMatch(item.description, searchText)}
          </div>
        )}

        <div className="option-meta">
          <Space size="small">
            <Tag size="small" color="blue">{item.category}</Tag>
            {item.tags.slice(0, 3).map(tag => (
              <Tag key={tag} size="small">{tag}</Tag>
            ))}
          </Space>
        </div>
      </div>
    )
  }

  const handleSelect = (value: string) => {
    const target = suggestions.find(item => item.id === value)
    if (target) {
      onJump(target)
      addToHistory(target)
      setSearchText('')
    }
  }

  const addToHistory = (target: JumpTarget) => {
    setRecentHistory(prev => {
      const filtered = prev.filter(item => item.id !== target.id)
      return [target, ...filtered].slice(0, 10)
    })
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text

    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? <mark key={index}>{part}</mark> : part
    )
  }

  const getTypeColor = (type: string) => {
    const colors = {
      document: 'default',
      api: 'processing',
      example: 'success',
      tutorial: 'warning'
    }
    return colors[type] || 'default'
  }

  return (
    <div className="quick-jump-container">
      <AutoComplete
        ref={inputRef}
        style={{ width: '100%' }}
        value={searchText}
        onChange={setSearchText}
        onSelect={handleSelect}
        options={suggestions.map(item => ({
          value: item.id,
          label: renderOption(item)
        }))}
        notFoundContent={loading ? '搜索中...' : '未找到相关内容'}
        placeholder={
          <Space>
            <SearchOutlined />
            {placeholder}
            <kbd className="quick-jump-shortcut">Ctrl+K</kbd>
          </Space>
        }
      />

      {recentHistory.length > 0 && !searchText && (
        <div className="recent-history">
          <div className="history-header">
            <HistoryOutlined /> 最近访问
          </div>
          {recentHistory.map(item => (
            <div
              key={item.id}
              className="history-item"
              onClick={() => handleSelect(item.id)}
            >
              {item.icon} {item.title}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

### 2. 面包屑导航组件 (Breadcrumb)
```typescript
// components/BreadcrumbNavigation.tsx
import React, { useState, useEffect } from 'react'
import { Breadcrumb, Dropdown, Space, Menu } from 'antd'
import { HomeOutlined, RightOutlined, MoreOutlined } from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface BreadcrumbItem {
  title: string
  path: string
  icon?: React.ReactNode
  children?: BreadcrumbItem[]
  isActive?: boolean
}

export const BreadcrumbNavigation: React.FC = () => {
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>([])
  const [responsiveItems, setResponsiveItems] = useState<BreadcrumbItem[]>([])
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  // 生成面包屑数据
  useEffect(() => {
    const items = generateBreadcrumbFromPath(location.pathname)
    setBreadcrumbItems(items)

    // 响应式处理
    const screenWidth = window.innerWidth
    if (screenWidth < 768) {
      setResponsiveItems(optimizeForMobile(items))
    } else {
      setResponsiveItems(items)
    }
  }, [location.pathname])

  const generateBreadcrumbFromPath = (path: string): BreadcrumbItem[] => {
    const pathSegments = path.split('/').filter(Boolean)
    const items: BreadcrumbItem[] = []

    // 首页
    items.push({
      title: t('navigation.home'),
      path: '/',
      icon: <HomeOutlined />
    })

    // 构建层级
    let currentPath = ''
    for (let i = 0; i < pathSegments.length; i++) {
      currentPath += '/' + pathSegments[i]
      const segment = pathSegments[i]

      const item: BreadcrumbItem = {
        title: getTitleFromSegment(segment),
        path: currentPath,
        icon: getIconForSegment(segment),
        children: i < pathSegments.length - 1 ? getChildPages(segment) : undefined,
        isActive: i === pathSegments.length - 1
      }

      items.push(item)
    }

    return items
  }

  const optimizeForMobile = (items: BreadcrumbItem[]): BreadcrumbItem[] => {
    if (items.length <= 3) return items

    // 移动端智能截断
    return [
      items[0], // 首页
      {
        title: '...',
        path: '',
        icon: <MoreOutlined />,
        children: items.slice(1, -2),
        isActive: false
      },
      items[items.length - 2],
      items[items.length - 1]
    ]
  }

  const handleBreadcrumbClick = (item: BreadcrumbItem) => {
    if (item.path) {
      navigate(item.path)
    }
  }

  const renderBreadcrumbItem = (item: BreadcrumbItem, index: number) => {
    if (item.children && item.children.length > 0) {
      // 有子菜单的面包屑项
      const menu = (
        <Menu>
          {item.children.map((child, childIndex) => (
            <Menu.Item
              key={childIndex}
              icon={child.icon}
              onClick={() => handleBreadcrumbClick(child)}
            >
              {child.title}
            </Menu.Item>
          ))}
        </Menu>
      )

      return (
        <Dropdown overlay={menu} placement="bottomLeft" key={index}>
          <Breadcrumb.Item>
            <Space>
              {item.icon}
              <span className={item.isActive ? 'active' : ''}>
                {item.title}
              </span>
            </Space>
          </Breadcrumb.Item>
        </Dropdown>
      )
    }

    return (
      <Breadcrumb.Item
        key={index}
        className={item.isActive ? 'active' : ''}
        onClick={() => !item.isActive && handleBreadcrumbClick(item)}
      >
        <Space>
          {item.icon}
          {item.title}
        </Space>
      </Breadcrumb.Item>
    )
  }

  return (
    <div className="breadcrumb-navigation">
      <Breadcrumb
        separator={<RightOutlined />}
        items={responsiveItems.map((item, index) => ({
          key: index,
          title: renderBreadcrumbItem(item, index)
        }))}
      />
    </div>
  )
}
```

### 3. 智能推荐组件 (SmartRecommendations)
```typescript
// components/SmartRecommendations.tsx
import React, { useState, useEffect } from 'react'
import { Card, List, Avatar, Button, Tag, Space, Progress, Tooltip } from 'antd'
import {
  BookOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  StarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

interface RecommendationItem {
  id: string
  title: string
  description: string
  type: 'tutorial' | 'reference' | 'example' | 'theory'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number
  relevanceScore: number
  reasons: RecommendationReason[]
  relatedDocuments?: string[]
  userCount?: number
  rating?: number
}

interface RecommendationReason {
  type: 'topic_match' | 'difficulty_match' | 'popular' | 'recent'
  explanation: string
  confidence: number
}

interface SmartRecommendationsProps {
  currentDocument?: string
  maxItems?: number
  showReasons?: boolean
  variant?: 'card' | 'list' | 'sidebar'
}

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  currentDocument,
  maxItems = 5,
  showReasons = true,
  variant = 'card'
}) => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([])
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    fetchRecommendations()
  }, [currentDocument])

  const fetchRecommendations = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentDocument,
          maxItems,
          context: {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            sessionId: getSessionId()
          }
        })
      })

      const data = await response.json()
      setRecommendations(data.recommendations)
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      tutorial: <BookOutlined />,
      reference: <BookOutlined />,
      example: <ThunderboltOutlined />,
      theory: <BulbOutlined />
    }
    return icons[type] || <BookOutlined />
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: 'green',
      intermediate: 'orange',
      advanced: 'red'
    }
    return colors[difficulty] || 'default'
  }

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return '#52c41a'
    if (score >= 0.6) return '#faad14'
    return '#f5222d'
  }

  const renderRecommendationItem = (item: RecommendationItem) => {
    const commonContent = (
      <div className="recommendation-content">
        <div className="recommendation-header">
          <Space>
            <Avatar icon={getTypeIcon(item.type)} />
            <span className="recommendation-title">{item.title}</span>
            <Tag color={getDifficultyColor(item.difficulty)}>
              {t(`difficulty.${item.difficulty}`)}
            </Tag>
          </Space>

          <div className="recommendation-meta">
            <Space size="small">
              <ClockCircleOutlined />
              <span>{item.estimatedTime}分钟</span>
              {item.rating && (
                <>
                  <StarOutlined />
                  <span>{item.rating.toFixed(1)}</span>
                </>
              )}
            </Space>
          </div>
        </div>

        <div className="recommendation-description">
          {item.description}
        </div>

        {showReasons && item.reasons.length > 0 && (
          <div className="recommendation-reasons">
            <div className="reasons-title">推荐理由：</div>
            {item.reasons.map((reason, index) => (
              <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
                {reason.explanation}
              </Tag>
            ))}
          </div>
        )}

        <div className="recommendation-footer">
          <div className="relevance-indicator">
            <span>相关度：</span>
            <Progress
              percent={Math.round(item.relevanceScore * 100)}
              size="small"
              strokeColor={getRelevanceColor(item.relevanceScore)}
              showInfo={false}
            />
            <span>{Math.round(item.relevanceScore * 100)}%</span>
          </div>

          <Button type="primary" size="small">
            查看详情
          </Button>
        </div>
      </div>
    )

    switch (variant) {
      case 'list':
        return (
          <List.Item key={item.id}>
            {commonContent}
          </List.Item>
        )

      case 'sidebar':
        return (
          <Card key={item.id} size="small" className="sidebar-recommendation">
            {commonContent}
          </Card>
        )

      default: // card
        return (
          <Card
            key={item.id}
            className="recommendation-card"
            hoverable
            actions={[
              <Tooltip title="收藏">
                <StarOutlined />
              </Tooltip>,
              <Tooltip title="分享">
                <span>分享</span>
              </Tooltip>
            ]}
          >
            {commonContent}
          </Card>
        )
    }
  }

  if (loading) {
    return <div>加载推荐内容...</div>
  }

  if (recommendations.length === 0) {
    return (
      <div className="no-recommendations">
        <p>暂无推荐内容</p>
        <Button onClick={fetchRecommendations}>刷新</Button>
      </div>
    )
  }

  return (
    <div className={`smart-recommendations variant-${variant}`}>
      <div className="recommendations-header">
        <h3>为您推荐</h3>
        <Tooltip title="基于您的阅读历史和偏好智能推荐">
          <BulbOutlined />
        </Tooltip>
      </div>

      {variant === 'list' ? (
        <List
          dataSource={recommendations}
          renderItem={renderRecommendationItem}
          pagination={false}
        />
      ) : (
        <div className="recommendations-grid">
          {recommendations.map(renderRecommendationItem)}
        </div>
      )}
    </div>
  )
}
```

## 🛠️ 后端API实现

### 1. 搜索服务 API
```typescript
// api/search.ts
import express from 'express'
import { SearchService } from '../services/SearchService'
import { validateSearchQuery } from '../middleware/validation'

const router = express.Router()

// 搜索建议接口
router.get('/suggestions', async (req, res) => {
  try {
    const { q: query, limit = 10, filters = {} } = req.query

    const suggestions = await SearchService.getSuggestions({
      query: query as string,
      limit: parseInt(limit as string),
      filters: JSON.parse(filters as string || '{}'),
      userId: req.user?.id,
      sessionId: req.sessionId
    })

    res.json({
      success: true,
      results: suggestions,
      query,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// 全文搜索接口
router.post('/fulltext', validateSearchQuery, async (req, res) => {
  try {
    const {
      query,
      filters = {},
      pagination = { page: 1, limit: 20 },
      sort = { by: 'relevance', order: 'desc' }
    } = req.body

    const searchResults = await SearchService.fullTextSearch({
      query,
      filters,
      pagination,
      sort,
      userId: req.user?.id,
      context: {
        timestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    })

    // 记录搜索行为
    await SearchService.recordSearchBehavior({
      userId: req.user?.id,
      sessionId: req.sessionId,
      query,
      resultCount: searchResults.total,
      clickedResults: []
    })

    res.json({
      success: true,
      ...searchResults,
      query,
      filters,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// 智能补全接口
router.get('/autocomplete', async (req, res) => {
  try {
    const { q: query, limit = 5 } = req.query

    const completions = await SearchService.getAutocompleteSuggestions({
      query: query as string,
      limit: parseInt(limit as string),
      userId: req.user?.id
    })

    res.json({
      success: true,
      suggestions: completions
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router
```

### 2. 推荐服务
```typescript
// services/RecommendationService.ts
import { User, Document, RecommendationItem } from '../types'
import { UserProfiler } from './UserProfiler'
import { ContentAnalyzer } from './ContentAnalyzer'
import { CollaborativeFiltering } from './algorithms/CollaborativeFiltering'
import { ContentBasedFiltering } from './algorithms/ContentBasedFiltering'

export class RecommendationService {
  private userProfiler: UserProfiler
  private contentAnalyzer: ContentAnalyzer
  private collaborativeFiltering: CollaborativeFiltering
  private contentBasedFiltering: ContentBasedFiltering

  constructor() {
    this.userProfiler = new UserProfiler()
    this.contentAnalyzer = new ContentAnalyzer()
    this.collaborativeFiltering = new CollaborativeFiltering()
    this.contentBasedFiltering = new ContentBasedFiltering()
  }

  async getRecommendations(params: {
    userId?: string
    currentDocument?: string
    maxItems: number
    context: any
  }): Promise<RecommendationItem[]> {
    const { userId, currentDocument, maxItems, context } = params

    // 1. 获取用户画像
    const userProfile = userId
      ? await this.userProfiler.getUserProfile(userId)
      : this.userProfiler.getAnonymousProfile(context)

    // 2. 多策略推荐
    const recommendations = await this.generateMultiStrategyRecommendations({
      userProfile,
      currentDocument,
      maxItems: maxItems * 2, // 获取更多候选，后续筛选
      context
    })

    // 3. 结果融合和排序
    const finalRecommendations = this.mergeAndRankRecommendations(
      recommendations,
      userProfile,
      maxItems
    )

    // 4. 增强推荐信息
    return this.enhanceRecommendations(finalRecommendations, userProfile)
  }

  private async generateMultiStrategyRecommendations(params: {
    userProfile: User
    currentDocument?: string
    maxItems: number
    context: any
  }): Promise<Array<{ item: RecommendationItem, source: string, score: number }>> {
    const { userProfile, currentDocument, maxItems, context } = params
    const allRecommendations = []

    // 基于内容的推荐
    if (currentDocument) {
      const contentBasedRecs = await this.contentBasedFiltering.recommend(
        currentDocument,
        userProfile,
        Math.floor(maxItems * 0.4)
      )
      allRecommendations.push(
        ...contentBasedRecs.map(item => ({
          item,
          source: 'content_based',
          score: item.relevanceScore
        }))
      )
    }

    // 协同过滤推荐
    if (userProfile.id) {
      const collaborativeRecs = await this.collaborativeFiltering.recommend(
        userProfile,
        Math.floor(maxItems * 0.4)
      )
      allRecommendations.push(
        ...collaborativeRecs.map(item => ({
          item,
          source: 'collaborative',
          score: item.confidenceScore
        }))
      )
    }

    // 基于用户画像的推荐
    const profileBasedRecs = await this.getProfileBasedRecommendations(
      userProfile,
      Math.floor(maxItems * 0.2)
    )
    allRecommendations.push(
      ...profileBasedRecs.map(item => ({
        item,
        source: 'profile_based',
        score: this.calculateProfileScore(item, userProfile)
      }))
    )

    // 热门内容推荐
    const popularRecs = await this.getPopularRecommendations(
      userProfile,
      Math.floor(maxItems * 0.2)
    )
    allRecommendations.push(
      ...popularRecs.map(item => ({
        item,
        source: 'popular',
        score: item.popularityScore
      }))
    )

    return allRecommendations
  }

  private mergeAndRankRecommendations(
    recommendations: Array<{ item: RecommendationItem, source: string, score: number }>,
    userProfile: User,
    maxItems: number
  ): RecommendationItem[] {
    // 合并相同项目的推荐
    const mergedMap = new Map<string, RecommendationItem>()

    recommendations.forEach(({ item, source, score }) => {
      const existing = mergedMap.get(item.id)

      if (!existing) {
        // 合并评分和理由
        const enhancedItem = {
          ...item,
          relevanceScore: score,
          sources: [source],
          reasons: this.generateRecommendationReasons(item, userProfile, source)
        }
        mergedMap.set(item.id, enhancedItem)
      } else {
        // 加权平均评分
        const newScore = (existing.relevanceScore + score) / 2
        existing.relevanceScore = newScore
        existing.sources.push(source)
        existing.reasons.push(...this.generateRecommendationReasons(item, userProfile, source))
      }
    })

    // 排序并返回
    return Array.from(mergedMap.values())
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxItems)
  }

  private generateRecommendationReasons(
    item: RecommendationItem,
    userProfile: User,
    source: string
  ): RecommendationReason[] {
    const reasons = []

    switch (source) {
      case 'content_based':
        reasons.push({
          type: 'topic_match',
          explanation: '与当前阅读内容相关',
          confidence: 0.9
        })
        break

      case 'collaborative':
        reasons.push({
          type: 'popular',
          explanation: '相似用户也喜欢',
          confidence: 0.8
        })
        break

      case 'profile_based':
        reasons.push({
          type: 'difficulty_match',
          explanation: '适合您的技能水平',
          confidence: 0.85
        })
        break

      case 'popular':
        reasons.push({
          type: 'popular',
          explanation: '热门推荐',
          confidence: 0.7
        })
        break
    }

    return reasons
  }

  private async getProfileBasedRecommendations(
    userProfile: User,
    limit: number
  ): Promise<RecommendationItem[]> {
    // 基于用户兴趣标签和难度偏好推荐
    const { interests, difficulty, role } = userProfile

    const query = {
      tags: interests,
      difficulty: difficulty,
      type: this.getPreferredContentTypes(role),
      limit
    }

    return await this.searchByProfile(query)
  }

  private async getPopularRecommendations(
    userProfile: User,
    limit: number
  ): Promise<RecommendationItem[]> {
    // 获取热门内容，根据用户角色过滤
    return await this.getTrendingContent({
      role: userProfile.role,
      difficulty: userProfile.difficulty,
      limit,
      timeWindow: '7d' // 最近7天
    })
  }

  private calculateProfileScore(item: RecommendationItem, userProfile: User): number {
    let score = 0.5 // 基础分数

    // 兴趣匹配
    const matchingTags = item.tags.filter(tag =>
      userProfile.interests.includes(tag)
    )
    score += matchingTags.length * 0.1

    // 难度匹配
    if (item.difficulty === userProfile.difficulty) {
      score += 0.2
    }

    // 内容类型偏好
    if (userProfile.preferredContentTypes?.includes(item.type)) {
      score += 0.15
    }

    return Math.min(score, 1.0)
  }

  private getPreferredContentTypes(role: string): string[] {
    const rolePreferences = {
      developer: ['reference', 'example', 'tutorial'],
      researcher: ['theory', 'reference', 'tutorial'],
      student: ['tutorial', 'example', 'reference'],
      architect: ['theory', 'reference', 'implementation']
    }

    return rolePreferences[role] || ['tutorial', 'reference']
  }

  private async enhanceRecommendations(
    recommendations: RecommendationItem[],
    userProfile: User
  ): Promise<RecommendationItem[]> {
    // 增强推荐信息的详细程度
    for (const rec of recommendations) {
      // 添加学习时间预估
      rec.estimatedTime = this.estimateReadingTime(rec, userProfile)

      // 添加相关统计
      rec.userCount = await this.getUserCount(rec.id)
      rec.rating = await this.getAverageRating(rec.id)

      // 添加相关文档
      rec.relatedDocuments = await this.getRelatedDocuments(rec.id)
    }

    return recommendations
  }

  private estimateReadingTime(item: RecommendationItem, userProfile: User): number {
    // 基于内容长度和用户阅读速度估算
    const baseTime = item.wordCount / 200 // 假设200字/分钟
    const difficultyMultiplier = {
      beginner: 0.8,
      intermediate: 1.0,
      advanced: 1.3
    }

    return Math.round(baseTime * difficultyMultiplier[item.difficulty])
  }

  private async getUserCount(documentId: string): Promise<number> {
    // 获取阅读该文档的用户数量
    // 实际实现中会查询数据库
    return Math.floor(Math.random() * 1000) + 50
  }

  private async getAverageRating(documentId: string): Promise<number> {
    // 获取文档平均评分
    // 实际实现中会查询数据库
    return 4.0 + Math.random() // 4.0-5.0
  }

  private async getRelatedDocuments(documentId: string): Promise<string[]> {
    // 获取相关文档ID列表
    // 实际实现中会使用文档相似度计算
    return []
  }
}
```

## 📊 数据模型定义

### 类型定义
```typescript
// types/navigation.ts
export interface User {
  id: string
  email?: string
  role: 'developer' | 'researcher' | 'student' | 'architect'
  experience: 'beginner' | 'intermediate' | 'advanced'
  interests: string[]
  preferredContentTypes: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  createdAt: Date
  lastActive: Date
}

export interface Document {
  id: string
  title: string
  description: string
  content: string
  type: 'tutorial' | 'reference' | 'example' | 'theory' | 'implementation'
  category: string
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number
  wordCount: number
  author?: string
  createdAt: Date
  updatedAt: Date
  path: string
  parentDocument?: string
  childDocuments?: string[]
}

export interface SearchQuery {
  query: string
  filters: {
    type?: string[]
    difficulty?: string[]
    category?: string[]
    tags?: string[]
    dateRange?: {
      start: Date
      end: Date
    }
  }
  pagination: {
    page: number
    limit: number
  }
  sort: {
    by: 'relevance' | 'date' | 'popularity' | 'rating'
    order: 'asc' | 'desc'
  }
}

export interface SearchResult {
  document: Document
  score: number
  highlights: Highlight[]
  matchType: 'exact' | 'fuzzy' | 'semantic'
}

export interface Highlight {
  field: string
  snippet: string
  indices: [number, number][]
}

export interface RecommendationItem {
  id: string
  title: string
  description: string
  type: string
  difficulty: string
  estimatedTime: number
  relevanceScore: number
  reasons: RecommendationReason[]
  sources: string[]
  tags: string[]
  userCount?: number
  rating?: number
  relatedDocuments?: string[]
}

export interface RecommendationReason {
  type: 'topic_match' | 'difficulty_match' | 'popular' | 'recent' | 'collaborative'
  explanation: string
  confidence: number
}

export interface UserBehavior {
  userId?: string
  sessionId: string
  action: 'view' | 'search' | 'bookmark' | 'share' | 'download'
  targetId: string
  targetType: 'document' | 'api' | 'example'
  metadata?: Record<string, any>
  timestamp: Date
}
```

## 🚀 部署配置

### Docker配置
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
```

### 环境配置
```yaml
# docker-compose.yml
version: '3.8'

services:
  navigation-frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8080
      - REACT_APP_SEARCH_ENDPOINT=http://elasticsearch:9200
    depends_on:
      - navigation-backend

  navigation-backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - MONGODB_URL=mongodb://mongodb:27017/navigation
      - REDIS_URL=redis://redis:6379
      - ELASTICSEARCH_URL=http://elasticsearch:9200
    depends_on:
      - mongodb
      - redis
      - elasticsearch

  mongodb:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  elasticsearch:
    image: elasticsearch:8.5.0
    ports:
      - "9200:9200"
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

volumes:
  mongodb_data:
  redis_data:
  elasticsearch_data:
```

---

这个实现示例展示了智能导航系统的核心组件和实现细节，包括前端React组件、后端Node.js服务、数据模型和部署配置。通过这些代码示例，开发者可以快速搭建一个功能完整的文档导航系统。