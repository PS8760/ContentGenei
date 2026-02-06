import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import ParticlesBackground from '../components/ParticlesBackground'
import FloatingEmojis from '../components/FloatingEmojis'
import Header from '../components/Header'
import Footer from '../components/Footer'
import apiService from '../services/api'

const ContentLibrary = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [analytics, setAnalytics] = useState({})
  const [stats, setStats] = useState({
    total_content: 0,
    total_views: 0,
    avg_engagement: 0,
    top_performing: null
  })
  
  const titleRef = useRef(null)
  const cardsRef = useRef([])

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.3 })
    
    tl.fromTo(titleRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
    )
  }, [])

  useEffect(() => {
    fetchContent()
    fetchAnalytics()
  }, [filter, sortBy])

  const fetchAnalytics = async () => {
    try {
      const [overviewResponse, performanceResponse] = await Promise.all([
        apiService.getAnalyticsOverview(30).catch(() => ({ success: false })),
        apiService.getContentPerformance(30, 10).catch(() => ({ success: false }))
      ])

      if (overviewResponse.success) {
        setStats({
          total_content: overviewResponse.overview?.total_content || 0,
          total_views: overviewResponse.overview?.total_views || 0,
          avg_engagement: overviewResponse.overview?.avg_engagement_rate || 0,
          top_performing: performanceResponse.success && performanceResponse.performance?.length > 0
            ? performanceResponse.performance[0]
            : null
        })
      }

      // Create analytics map for each content item
      if (performanceResponse.success && performanceResponse.performance) {
        const analyticsMap = {}
        performanceResponse.performance.forEach(item => {
          analyticsMap[item.content_id] = {
            views: item.total_views || 0,
            engagement: item.engagement_rate || 0,
            clicks: item.total_clicks || 0
          }
        })
        setAnalytics(analyticsMap)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const fetchContent = async () => {
    try {
      setLoading(true)
      const response = await apiService.getContent({
        type: filter !== 'all' ? filter : undefined,
        sort_by: sortBy,
        sort_order: 'desc',
        search: searchQuery || undefined
      })
      
      if (response.success) {
        setContent(response.content || [])
      } else {
        console.error('Failed to fetch content:', response.error)
        setContent([])
      }
    } catch (error) {
      console.error('Error fetching content:', error)
      // Show empty state instead of fake data
      setContent([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchContent()
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        await apiService.deleteContent(id)
        setContent(content.filter(item => item.id !== id))
      } catch (error) {
        console.error('Error deleting content:', error)
      }
    }
  }

  const getTypeIcon = (type) => {
    const icons = {
      'article': '📄',
      'social-post': '📱',
      'email': '📧',
      'blog': '📝',
      'caption': '💬',
      'script': '🎬',
      'ad-copy': '📢'
    }
    return icons[type] || '📄'
  }

  const getStatusColor = (status) => {
    const colors = {
      'draft': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
      'published': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
      'archived': 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
    }
    return colors[status] || colors.draft
  }

  return (
    <div className="min-h-screen theme-transition relative">
      <ParticlesBackground />
      <FloatingEmojis />
      
      <Header />

      <main className="pt-24 pb-12 relative z-10 content-layer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title Section */}
          <div ref={titleRef} className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
              Content <span className="gradient-text">Library</span>
            </h1>
            <p className="text-gray-700 dark:text-blue-200 text-lg font-normal max-w-2xl mx-auto theme-transition">
              Manage, organize, and discover all your AI-generated content in one place.
            </p>
          </div>

          {/* Analytics Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-card rounded-xl p-4 theme-transition">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-lg">📝</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_content}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Total Items</div>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 theme-transition">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-lg">👁️</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_views}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Total Views</div>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 theme-transition">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-lg">📈</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.avg_engagement}%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Avg Engagement</div>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 theme-transition">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🔥</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                    {stats.top_performing ? stats.top_performing.title.substring(0, 15) + '...' : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Top Content</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="glass-card rounded-2xl p-6 mb-8 theme-transition">
            <div className="grid md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search content..."
                    className="form-input flex-1 p-3 rounded-xl"
                  />
                  <button
                    onClick={handleSearch}
                    className="btn-primary px-6 rounded-xl"
                  >
                    🔍
                  </button>
                </div>
              </div>

              {/* Filter by Type */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="form-input p-3 rounded-xl"
              >
                <option value="all">All Types</option>
                <option value="article">Articles</option>
                <option value="social-post">Social Posts</option>
                <option value="email">Emails</option>
                <option value="blog">Blogs</option>
                <option value="caption">Captions</option>
                <option value="script">Scripts</option>
                <option value="ad-copy">Ad Copy</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-input p-3 rounded-xl"
              >
                <option value="created_at">Latest First</option>
                <option value="title">Title A-Z</option>
                <option value="word_count">Word Count</option>
              </select>
            </div>
          </div>

          {/* Content Grid */}
          {loading ? (
            <div className="text-center py-20">
              <div className="loading-spinner mx-auto mb-4"></div>
              <p className="text-white">Loading content...</p>
            </div>
          ) : content.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center theme-transition">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 theme-transition">
                No content yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 theme-transition">
                Start creating amazing content with AI
              </p>
              <button
                onClick={() => navigate('/creator')}
                className="btn-primary px-8 py-3 rounded-xl"
              >
                Create Content
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.map((item, index) => {
                const itemAnalytics = analytics[item.id] || { views: 0, engagement: 0, clicks: 0 }
                return (
                  <div
                    key={item.id}
                    ref={el => cardsRef.current[index] = el}
                    className="glass-card rounded-2xl p-6 theme-transition hover:shadow-lg cursor-pointer group"
                    onClick={() => navigate(`/content/${item.id}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl">{getTypeIcon(item.content_type)}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 dark:text-gray-100 theme-transition truncate">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 theme-transition">
                            {item.word_count} words
                          </p>
                        </div>
                      </div>
                      {item.is_favorite && <span className="text-xl">⭐</span>}
                    </div>

                    {/* Analytics Metrics */}
                    {(itemAnalytics.views > 0 || itemAnalytics.engagement > 0) && (
                      <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{itemAnalytics.views}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Views</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">{itemAnalytics.engagement}%</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Engage</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{itemAnalytics.clicks}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Clicks</div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)} theme-transition`}>
                        {item.status}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/content/${item.id}/edit`)
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(item.id)
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 theme-transition">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Created {new Date(item.created_at).toLocaleDateString()}</span>
                        {itemAnalytics.views > 0 && (
                          <span className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span>Active</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default ContentLibrary
