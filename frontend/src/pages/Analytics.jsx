import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { gsap } from 'gsap'
import ParticlesBackground from '../components/ParticlesBackground'
import FloatingEmojis from '../components/FloatingEmojis'
import Header from '../components/Header'
import Footer from '../components/Footer'
import apiService from '../services/api'

const Analytics = () => {
  const { currentUser } = useAuth()
  const [timeRange, setTimeRange] = useState('7d')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingContent, setEditingContent] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingContent, setDeletingContent] = useState(null)
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      total_views: 0,
      avg_engagement_rate: 0,
      total_content: 0,
      avg_read_time: 0,
      period_content: 0,
      views_change: 0,
      content_change: 0,
      engagement_change: 0
    },
    contentPerformance: [],
    contentDistribution: [],
    dailyMetrics: {
      views: [],
      content_created: [],
      engagement: []
    },
    platformPerformance: []
  })
  const [allContent, setAllContent] = useState([])
  const [loadingAllContent, setLoadingAllContent] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredContent, setFilteredContent] = useState([])
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)
  
  const titleRef = useRef(null)
  const chartsRef = useRef([])
  const metricsRef = useRef([])

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.3 })
    
    tl.fromTo(titleRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
    )
    .fromTo(metricsRef.current,
      { y: 80, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 1, stagger: 0.1, ease: "back.out(1.1)" },
      "-=0.5"
    )
    .fromTo(chartsRef.current,
      { y: 100, opacity: 0, scale: 0.9 },
      { y: 0, opacity: 1, scale: 1, duration: 1.2, stagger: 0.15, ease: "back.out(1.1)" },
      "-=0.7"
    )
  }, [])

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const days = parseInt(timeRange.replace('d', ''))
        
        // Fetch analytics data
        const [overviewResponse, performanceResponse, distributionResponse, dailyMetricsResponse, platformResponse] = await Promise.all([
          apiService.getAnalyticsOverview(days),
          apiService.getContentPerformance(days, 10),
          apiService.getContentDistribution(days),
          apiService.getDailyMetrics(days).catch(() => ({ success: false })),
          apiService.getPlatformPerformance(days).catch(() => ({ success: false }))
        ])

        if (overviewResponse.success) {
          setAnalyticsData({
            overview: overviewResponse.overview || {
              total_views: 0,
              avg_engagement_rate: 0,
              total_content: 0,
              avg_read_time: 0,
              period_content: 0,
              views_change: 0,
              content_change: 0,
              engagement_change: 0
            },
            contentPerformance: performanceResponse.success ? performanceResponse.content_performance : [],
            contentDistribution: distributionResponse.success ? distributionResponse.distribution : [],
            dailyMetrics: dailyMetricsResponse.success ? dailyMetricsResponse.metrics : {
              views: [],
              content_created: [],
              engagement: []
            },
            platformPerformance: platformResponse.success ? platformResponse.platform_performance : []
          })
        } else {
          setError('Failed to load analytics data')
        }

        // Fetch all content separately (don't fail if this fails)
        try {
          const allContentResponse = await apiService.getContent({ per_page: 50 })
          if (allContentResponse.success) {
            setAllContent(allContentResponse.content || [])
          }
        } catch (contentError) {
          console.error('Error fetching all content:', contentError)
          // Don't set error state, just log it
          setAllContent([])
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error)
        setError(error.message || 'Failed to connect to backend. Please ensure the server is running.')
      } finally {
        setLoading(false)
      }
    }

    if (currentUser) {
      fetchAnalyticsData()
    }
  }, [currentUser, timeRange])

  // Filter content based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContent(analyticsData.contentPerformance)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = analyticsData.contentPerformance.filter(content => {
        return (
          content.title?.toLowerCase().includes(query) ||
          content.content_type?.toLowerCase().includes(query) ||
          content.total_views?.toString().includes(query) ||
          content.avg_engagement?.toString().includes(query)
        )
      })
      setFilteredContent(filtered)
    }
  }, [searchQuery, analyticsData.contentPerformance])

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const handleEdit = (content) => {
    setEditingContent(content)
    setShowEditModal(true)
  }

  const handleDelete = (content) => {
    setDeletingContent(content)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deletingContent) return
    
    try {
      await apiService.deleteContent(deletingContent.id)
      // Refresh all data
      const days = parseInt(timeRange.replace('d', ''))
      const [performanceResponse, allContentResponse] = await Promise.all([
        apiService.getContentPerformance(days, 10),
        apiService.getContent({ per_page: 50 })
      ])
      
      if (performanceResponse.success) {
        setAnalyticsData(prev => ({
          ...prev,
          contentPerformance: performanceResponse.content_performance
        }))
      }
      
      if (allContentResponse.success) {
        setAllContent(allContentResponse.content || [])
      }
      
      setShowDeleteModal(false)
      setDeletingContent(null)
      alert('✅ Content deleted successfully!')
    } catch (error) {
      console.error('Error deleting content:', error)
      alert('❌ Failed to delete content')
    }
  }

  const handleSaveEdit = async () => {
    if (!editingContent) return
    
    try {
      // Update with all editable fields
      const updateData = {
        title: editingContent.title,
        content: editingContent.content,
        content_type: editingContent.content_type,
        tone: editingContent.tone,
        status: editingContent.status
      }
      
      await apiService.updateContent(editingContent.id, updateData)
      
      // Refresh all data
      const days = parseInt(timeRange.replace('d', ''))
      const [performanceResponse, allContentResponse] = await Promise.all([
        apiService.getContentPerformance(days, 10),
        apiService.getContent({ per_page: 50 })
      ])
      
      if (performanceResponse.success) {
        setAnalyticsData(prev => ({
          ...prev,
          contentPerformance: performanceResponse.content_performance
        }))
      }
      
      if (allContentResponse.success) {
        setAllContent(allContentResponse.content || [])
      }
      
      setShowEditModal(false)
      setEditingContent(null)
      alert('✅ Content updated successfully!')
    } catch (error) {
      console.error('Error updating content:', error)
      alert('❌ Failed to update content')
    }
  }

  const handleView = async (contentId) => {
    try {
      const response = await apiService.getContentItem(contentId)
      if (response.success) {
        // Open in new modal or navigate to detail page
        alert(`Content: ${response.content.content}`)
      }
    } catch (error) {
      console.error('Error viewing content:', error)
    }
  }

  const handleDeleteAll = async () => {
    setDeletingAll(true)
    try {
      // Get all content IDs
      const allContentIds = [
        ...analyticsData.contentPerformance.map(c => c.id),
        ...allContent.map(c => c.id)
      ]
      
      // Remove duplicates
      const uniqueIds = [...new Set(allContentIds)]
      
      if (uniqueIds.length === 0) {
        alert('⚠️ No content to delete')
        setShowDeleteAllModal(false)
        setDeletingAll(false)
        return
      }
      
      // Delete all content
      const deletePromises = uniqueIds.map(id => apiService.deleteContent(id))
      await Promise.all(deletePromises)
      
      // Refresh all data
      const days = parseInt(timeRange.replace('d', ''))
      const [overviewResponse, performanceResponse, distributionResponse, allContentResponse] = await Promise.all([
        apiService.getAnalyticsOverview(days),
        apiService.getContentPerformance(days, 10),
        apiService.getContentDistribution(days),
        apiService.getContent({ per_page: 50 })
      ])
      
      if (overviewResponse.success) {
        setAnalyticsData({
          overview: overviewResponse.overview || {
            total_views: 0,
            avg_engagement_rate: 0,
            total_content: 0,
            avg_read_time: 0,
            period_content: 0,
            views_change: 0,
            content_change: 0,
            engagement_change: 0
          },
          contentPerformance: performanceResponse.success ? performanceResponse.content_performance : [],
          contentDistribution: distributionResponse.success ? distributionResponse.distribution : [],
          dailyMetrics: {
            views: [],
            content_created: [],
            engagement: []
          },
          platformPerformance: []
        })
      }
      
      if (allContentResponse.success) {
        setAllContent(allContentResponse.content || [])
      }
      
      setShowDeleteAllModal(false)
      alert(`✅ Successfully deleted ${uniqueIds.length} content item${uniqueIds.length !== 1 ? 's' : ''}!`)
    } catch (error) {
      console.error('Error deleting all content:', error)
      alert('❌ Failed to delete all content. Some items may have been deleted.')
    } finally {
      setDeletingAll(false)
    }
  }

  const getTrendIcon = (change) => {
    if (change > 0) return '📈'
    if (change < 0) return '📉'
    return '➡️'
  }

  const getTrendColor = (change) => {
    if (change > 0) return 'text-green-600 dark:text-green-400'
    if (change < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const metrics = [
    { 
      label: 'Total Views', 
      value: formatNumber(analyticsData.overview.total_views), 
      icon: '👁️',
      change: analyticsData.overview.views_change || 0,
      changeLabel: 'vs previous period'
    },
    { 
      label: 'Engagement Rate', 
      value: `${analyticsData.overview.avg_engagement_rate?.toFixed(1) || 0}%`, 
      icon: '❤️',
      change: analyticsData.overview.engagement_change || 0,
      changeLabel: 'vs previous period'
    },
    { 
      label: 'Content Created', 
      value: analyticsData.overview.period_content?.toString() || '0', 
      icon: '📝',
      change: analyticsData.overview.content_change || 0,
      changeLabel: 'vs previous period'
    },
    { 
      label: 'Avg. Read Time', 
      value: `${Math.round(analyticsData.overview.avg_read_time || 0)}s`, 
      icon: '⏱️',
      change: 0,
      changeLabel: 'per content'
    }
  ]

  return (
    <div className="min-h-screen theme-transition relative">
      <ParticlesBackground />
      <FloatingEmojis />
      
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="pt-24 pb-12 relative z-10 content-layer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title Section */}
          <div ref={titleRef} className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
               <span className="gradient-text">Content Analytics</span>
            </h1>
            <p className="text-gray-700 dark:text-blue-200 text-lg font-normal max-w-2xl mx-auto theme-transition">
              Track your content performance and gain insights to optimize your strategy.
            </p>
            
            {/* Time Range Selector and Delete All Button */}
            <div className="flex justify-center items-center gap-4 mt-6 flex-wrap">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="form-input px-4 py-2 rounded-xl text-sm border-gray-300 dark:border-gray-600 theme-transition bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              
              {/* Delete All History Button */}
              {(analyticsData.contentPerformance.length > 0 || allContent.length > 0) && (
                <button
                  onClick={() => setShowDeleteAllModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl text-sm font-semibold transition-all btn-ripple flex items-center gap-2"
                >
                  <span>🗑️</span>
                  <span>Delete All History</span>
                </button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full loading-spinner mb-4"></div>
              <p className="text-gray-900 dark:text-gray-100 text-lg theme-transition">Loading analytics...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="glass-card rounded-2xl p-8 mb-12 text-center theme-transition">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 theme-transition">
                Unable to Load Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-400 theme-transition">{error}</p>
            </div>
          )}

          {/* Metrics Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              {metrics.map((metric, index) => (
                <div
                  key={index}
                  ref={el => metricsRef.current[index] = el}
                  className="glass-card rounded-2xl p-6 theme-transition hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="text-3xl">{metric.icon}</div>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1 text-center theme-transition">
                    {metric.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center mb-2 theme-transition">
                    {metric.label}
                  </div>
                  {metric.change !== 0 && (
                    <div className={`flex items-center justify-center space-x-1 text-xs ${getTrendColor(metric.change)}`}>
                      <span>{getTrendIcon(metric.change)}</span>
                      <span className="font-semibold">{metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-500 text-center mt-1">
                    {metric.changeLabel}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Content Distribution */}
          {!loading && !error && analyticsData.contentDistribution.length > 0 && (
            <div className="mb-12">
              <div ref={el => chartsRef.current[0] = el} className="glass-card rounded-2xl md:rounded-3xl p-8 theme-transition">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 theme-transition">
                  Content Distribution by Type
                </h3>
                <div className="space-y-4">
                  {analyticsData.contentDistribution.map((item, index) => {
                    const colors = ['bg-gray-800 dark:bg-blue-500', 'bg-gray-700 dark:bg-indigo-500', 'bg-gray-600 dark:bg-purple-500', 'bg-black dark:bg-pink-500', 'bg-gray-900 dark:bg-cyan-500', 'bg-gray-500 dark:bg-teal-500']
                    const color = colors[index % colors.length]
                    
                    return (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-900 dark:text-gray-100 font-medium theme-transition capitalize">
                              {item.content_type}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400 text-sm theme-transition">
                              {item.count} ({item.percentage?.toFixed(1) || 0}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 theme-transition">
                            <div 
                              className={`${color} h-2 rounded-full transition-all duration-1000`}
                              style={{ width: `${item.percentage || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Empty State for Distribution */}
          {!loading && !error && analyticsData.contentDistribution.length === 0 && (
            <div className="glass-card rounded-2xl md:rounded-3xl p-12 mb-12 text-center theme-transition">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 theme-transition">
                No Content Distribution Data
              </h3>
              <p className="text-gray-600 dark:text-gray-400 theme-transition">
                Start creating content to see your distribution analytics
              </p>
            </div>
          )}

          {/* Platform Performance */}
          {!loading && !error && analyticsData.platformPerformance && analyticsData.platformPerformance.length > 0 && (
            <div className="mb-12">
              <div ref={el => chartsRef.current[2] = el} className="glass-card rounded-2xl md:rounded-3xl p-8 theme-transition">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 theme-transition">
                  Performance by Platform
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analyticsData.platformPerformance.map((platform, index) => {
                    const platformIcons = {
                      facebook: '📘',
                      twitter: '🐦',
                      linkedin: '💼',
                      instagram: '📸',
                      email: '📧',
                      website: '🌐'
                    }
                    const icon = platformIcons[platform.platform] || '📱'
                    
                    return (
                      <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-gray-300 dark:border-blue-800">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="text-2xl">{icon}</div>
                          <div className="font-bold text-gray-900 dark:text-gray-100 capitalize">
                            {platform.platform}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Views</span>
                            <span className="font-bold text-gray-900 dark:text-gray-100">{formatNumber(platform.total_views)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Engagement</span>
                            <span className="font-bold text-gray-900 dark:text-gray-100">{platform.avg_engagement}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Clicks</span>
                            <span className="font-bold text-gray-900 dark:text-gray-100">{formatNumber(platform.total_clicks)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Daily Activity Chart */}
          {!loading && !error && analyticsData.dailyMetrics && analyticsData.dailyMetrics.views && analyticsData.dailyMetrics.views.length > 0 && (
            <div className="mb-12">
              <div ref={el => chartsRef.current[3] = el} className="glass-card rounded-2xl md:rounded-3xl p-8 theme-transition">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 theme-transition">
                  Daily Activity Trends
                </h3>
                <div className="space-y-6">
                  {/* Views Trend */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Views Over Time</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{analyticsData.dailyMetrics.views.length} days</span>
                    </div>
                    <div className="flex items-end space-x-1 h-32">
                      {analyticsData.dailyMetrics.views.slice(-14).map((item, index) => {
                        const maxValue = Math.max(...analyticsData.dailyMetrics.views.slice(-14).map(v => v.value), 1)
                        const height = (item.value / maxValue) * 100
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center group">
                            <div className="relative w-full">
                              <div 
                                className="w-full bg-gradient-to-t from-gray-700 to-gray-600 dark:from-blue-500 dark:to-blue-400 rounded-t transition-all duration-300 group-hover:from-gray-800 group-hover:to-gray-700 dark:group-hover:from-blue-600 dark:group-hover:to-blue-500"
                                style={{ height: `${height}%`, minHeight: '4px' }}
                                title={`${item.value} views on ${new Date(item.date).toLocaleDateString()}`}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-500 mt-1 hidden group-hover:block">
                              {new Date(item.date).getDate()}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Content Created Trend */}
                  {analyticsData.dailyMetrics.content_created && analyticsData.dailyMetrics.content_created.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Content Created</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{analyticsData.dailyMetrics.content_created.length} days</span>
                      </div>
                      <div className="flex items-end space-x-1 h-24">
                        {analyticsData.dailyMetrics.content_created.slice(-14).map((item, index) => {
                          const maxValue = Math.max(...analyticsData.dailyMetrics.content_created.slice(-14).map(v => v.value), 1)
                          const height = (item.value / maxValue) * 100
                          return (
                            <div key={index} className="flex-1 flex flex-col items-center group">
                              <div className="relative w-full">
                                <div 
                                  className="w-full bg-gradient-to-t from-gray-800 to-gray-700 dark:from-green-500 dark:to-green-400 rounded-t transition-all duration-300 group-hover:from-black group-hover:to-gray-800 dark:group-hover:from-green-600 dark:group-hover:to-green-500"
                                  style={{ height: `${height}%`, minHeight: '4px' }}
                                  title={`${item.value} content on ${new Date(item.date).toLocaleDateString()}`}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-500 mt-1 hidden group-hover:block">
                                {new Date(item.date).getDate()}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Top Performing Content */}
          {!loading && !error && analyticsData.contentPerformance.length > 0 && (
            <div ref={el => chartsRef.current[1] = el} className="glass-card rounded-2xl md:rounded-3xl p-8 theme-transition mb-12">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 theme-transition">
                  Top Performing Content
                </h3>
                
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, type, views, engagement..."
                    className="form-input w-full pl-10 pr-4 py-2 rounded-xl text-sm"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Results count */}
              {searchQuery && (
                <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Found {filteredContent.length} result{filteredContent.length !== 1 ? 's' : ''}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 theme-transition">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 theme-transition">Content</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 theme-transition">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 theme-transition">Views</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 theme-transition">Engagement</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 theme-transition">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(searchQuery ? filteredContent : analyticsData.contentPerformance).map((content, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors theme-transition">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900 dark:text-gray-100 theme-transition">
                            {content.title}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 theme-transition capitalize">
                            {content.content_type}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-900 dark:text-gray-100 font-medium theme-transition">
                          {formatNumber(content.total_views)}
                        </td>
                        <td className="py-4 px-4 text-gray-900 dark:text-gray-100 font-medium theme-transition">
                          {content.avg_engagement?.toFixed(1) || 0}%
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleView(content.id)}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="View"
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => handleEdit(content)}
                              className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(content)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* No results message */}
              {searchQuery && filteredContent.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🔍</div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                    No results found
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your search terms
                  </p>
                </div>
              )}
            </div>
          )}

          {/* All Content Library - Full CRUD Operations */}
          {!loading && !error && allContent.length > 0 && (
            <div className="glass-card rounded-2xl md:rounded-3xl p-8 theme-transition mb-12">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 theme-transition">
                  All Generated Content
                </h3>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {allContent.length} items
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 theme-transition">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 theme-transition">Title</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 theme-transition">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 theme-transition">Tone</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 theme-transition">Words</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 theme-transition">Created</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 theme-transition">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allContent.map((content, index) => (
                      <tr key={content.id || index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors theme-transition">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900 dark:text-gray-100 theme-transition max-w-xs truncate">
                            {content.title}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 theme-transition capitalize">
                            {content.content_type}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {content.tone}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-900 dark:text-gray-100 font-medium theme-transition">
                          {content.word_count || 0}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {content.created_at ? new Date(content.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleView(content.id)}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="View"
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => handleEdit(content)}
                              className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(content)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State for All Content */}
          {!loading && !error && allContent.length === 0 && (
            <div className="glass-card rounded-2xl md:rounded-3xl p-12 mb-12 text-center theme-transition">
              <div className="text-5xl mb-4">📝</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 theme-transition">
                No Content Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 theme-transition">
                Start creating content in the Generate tab to see it here
              </p>
              <button
                onClick={() => window.location.href = '/creator'}
                className="btn-primary text-white px-6 py-3 rounded-xl font-semibold btn-ripple"
              >
                Create Content
              </button>
            </div>
          )}

          {/* Edit Modal */}
          {showEditModal && editingContent && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="glass-card rounded-2xl p-8 max-w-2xl w-full theme-transition max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 theme-transition">
                  Edit Content
                </h3>
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-2 theme-transition">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editingContent.title || ''}
                      onChange={(e) => setEditingContent({...editingContent, title: e.target.value})}
                      className="form-input w-full p-3 rounded-xl"
                      placeholder="Enter content title"
                    />
                  </div>

                  {/* Content Type */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-2 theme-transition">
                      Content Type
                    </label>
                    <select
                      value={editingContent.content_type || 'article'}
                      onChange={(e) => setEditingContent({...editingContent, content_type: e.target.value})}
                      className="form-input w-full p-3 rounded-xl"
                    >
                      <option value="article">Article</option>
                      <option value="blog">Blog Post</option>
                      <option value="social-post">Social Media Post</option>
                      <option value="email">Email</option>
                      <option value="caption">Caption</option>
                      <option value="script">Video Script</option>
                      <option value="ad-copy">Ad Copy</option>
                    </select>
                  </div>

                  {/* Tone */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-2 theme-transition">
                      Tone
                    </label>
                    <select
                      value={editingContent.tone || 'professional'}
                      onChange={(e) => setEditingContent({...editingContent, tone: e.target.value})}
                      className="form-input w-full p-3 rounded-xl"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="friendly">Friendly</option>
                      <option value="formal">Formal</option>
                      <option value="creative">Creative</option>
                      <option value="persuasive">Persuasive</option>
                      <option value="informative">Informative</option>
                      <option value="conversational">Conversational</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-2 theme-transition">
                      Status
                    </label>
                    <select
                      value={editingContent.status || 'draft'}
                      onChange={(e) => setEditingContent({...editingContent, status: e.target.value})}
                      className="form-input w-full p-3 rounded-xl"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-2 theme-transition">
                      Content
                    </label>
                    <textarea
                      value={editingContent.content || ''}
                      onChange={(e) => setEditingContent({...editingContent, content: e.target.value})}
                      className="form-input w-full p-3 rounded-xl h-48 resize-none"
                      placeholder="Enter content text"
                    />
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {editingContent.content?.length || 0} characters
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 btn-primary text-white py-3 rounded-xl font-semibold btn-ripple"
                    >
                      💾 Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setShowEditModal(false)
                        setEditingContent(null)
                      }}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && deletingContent && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="glass-card rounded-2xl p-8 max-w-md w-full theme-transition">
                <div className="text-center">
                  <div className="text-5xl mb-4">⚠️</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 theme-transition">
                    Delete Content?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 theme-transition">
                    Are you sure you want to delete "{deletingContent.title}"? This action cannot be undone.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={confirmDelete}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteModal(false)
                        setDeletingContent(null)
                      }}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete All History Modal */}
          {showDeleteAllModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="glass-card rounded-2xl p-8 max-w-md w-full theme-transition">
                <div className="text-center">
                  <div className="text-5xl mb-4">🚨</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 theme-transition">
                    Delete All History?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-2 theme-transition">
                    This will permanently delete <strong>ALL</strong> your content history including:
                  </p>
                  <ul className="text-left text-gray-600 dark:text-gray-400 mb-6 space-y-1 theme-transition">
                    <li>• All generated content</li>
                    <li>• All analytics data</li>
                    <li>• All performance metrics</li>
                    <li>• All content distribution data</li>
                  </ul>
                  <p className="text-red-600 dark:text-red-400 font-bold mb-6">
                    ⚠️ This action cannot be undone!
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleDeleteAll}
                      disabled={deletingAll}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingAll ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full loading-spinner"></div>
                          <span>Deleting...</span>
                        </div>
                      ) : (
                        'Yes, Delete Everything'
                      )}
                    </button>
                    <button
                      onClick={() => setShowDeleteAllModal(false)}
                      disabled={deletingAll}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty State for Performance */}
          {!loading && !error && analyticsData.contentPerformance.length === 0 && (
            <div className="glass-card rounded-2xl md:rounded-3xl p-12 text-center theme-transition">
              <div className="text-5xl mb-4">📈</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 theme-transition">
                No Performance Data Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 theme-transition">
                Create and publish content to track performance metrics
              </p>
            </div>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}

export default Analytics
