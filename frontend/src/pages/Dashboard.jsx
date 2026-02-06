import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import ParticlesBackground from '../components/ParticlesBackground'
import FloatingEmojis from '../components/FloatingEmojis'
import Header from '../components/Header'
import Footer from '../components/Footer'
import apiService from '../services/api'

const Dashboard = () => { 
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dashboardData, setDashboardData] = useState({
    stats: {
      total_content: 0,
      total_views: 0,
      avg_engagement_rate: 0,
      avg_read_time: 0,
      content_this_week: 0,
      trending_type: 'article'
    },
    recentContent: [],
    contentByType: [],
    weeklyActivity: [],
    usageStats: {
      current_count: 0,
      monthly_limit: 500,
      percentage_used: 0
    }
  })
  
  const titleRef = useRef(null)
  const statsRef = useRef([])
  const cardsRef = useRef([])
  const chartRef = useRef(null)

  // Helper functions
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }
  
  // Generate weekly activity data
  const generateWeeklyActivity = (content) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const activity = days.map(day => ({ day, count: 0 }))
    
    content.forEach(item => {
      const date = new Date(item.created_at)
      const dayIndex = date.getDay()
      activity[dayIndex].count++
    })
    
    return activity
  }

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.3 })
    
    if (titleRef.current && statsRef.current.length > 0 && cardsRef.current.length > 0) {
      tl.fromTo(titleRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
      )
      .fromTo(statsRef.current,
        { y: 80, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 1, stagger: 0.1, ease: "back.out(1.1)" },
        "-=0.5"
      )
      .fromTo(cardsRef.current,
        { y: 100, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 1.2, stagger: 0.15, ease: "back.out(1.1)" },
        "-=0.7"
      )
    }
  }, [loading])

  useEffect(() => {
    // Fetch dashboard data
    const fetchDashboardData = async () => {
      if (!currentUser) {
        console.log('Dashboard: No current user, skipping data fetch')
        setLoading(false)
        return
      }
      
      try {
        console.log('Dashboard: Fetching data for user:', currentUser.email)
        setLoading(true)
        setError(null)
        
        const [analyticsResponse, contentStatsResponse, contentResponse, profileResponse] = await Promise.all([
          apiService.getAnalyticsOverview(30).catch((err) => {
            console.warn('Dashboard: Analytics API failed:', err.message)
            return { success: false }
          }),
          apiService.getContentStats().catch((err) => {
            console.warn('Dashboard: Content stats API failed:', err.message)
            return { success: false }
          }),
          apiService.getContent({ per_page: 5, sort_by: 'created_at', sort_order: 'desc' }).catch((err) => {
            console.warn('Dashboard: Recent content API failed:', err.message)
            return { success: false }
          }),
          apiService.getProfile().catch((err) => {
            console.warn('Dashboard: Profile API failed:', err.message)
            return { success: false }
          })
        ])

        if (analyticsResponse.success && contentStatsResponse.success) {
          console.log('Dashboard: Data fetched successfully')
          
          const stats = contentStatsResponse.stats || {}
          const overview = analyticsResponse.overview || {}
          const contentByType = stats.content_by_type || []
          const recentContent = contentResponse.success ? (contentResponse.content || []) : []
          const userProfile = profileResponse.success ? profileResponse.user : null
          
          // Calculate content this week
          const oneWeekAgo = new Date()
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
          const contentThisWeek = recentContent.filter(item => 
            new Date(item.created_at) >= oneWeekAgo
          ).length
          
          // Find trending content type
          const trendingType = contentByType.length > 0 
            ? contentByType.reduce((prev, current) => 
                (prev.count > current.count) ? prev : current
              ).type 
            : 'article'
          
          setDashboardData({
            stats: {
              total_content: stats.total_content || 0,
              total_views: overview.total_views || 0,
              avg_engagement_rate: overview.avg_engagement_rate || 0,
              avg_read_time: overview.avg_read_time || 0,
              content_this_week: contentThisWeek,
              trending_type: trendingType
            },
            recentContent: recentContent.slice(0, 5),
            contentByType: contentByType,
            weeklyActivity: generateWeeklyActivity(recentContent),
            usageStats: {
              current_count: userProfile?.content_generated_count || 0,
              monthly_limit: userProfile?.monthly_content_limit || 500,
              percentage_used: userProfile 
                ? Math.round((userProfile.content_generated_count / userProfile.monthly_content_limit) * 100)
                : 0
            }
          })
        } else {
          console.log('Dashboard: Using default values (API calls failed)')
          // Keep default values
        }
      } catch (error) {
        console.error('Dashboard: Error fetching data:', error)
        setError(error.message)
        // Use default values if API fails - don't throw error
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [currentUser])

  const stats = [
    { 
      label: 'Total Content', 
      value: dashboardData.stats.total_content.toString(), 
      icon: '📝',
      change: `+${dashboardData.stats.content_this_week} this week`,
      color: 'from-blue-500 to-blue-600'
    },
    { 
      label: 'Total Views', 
      value: formatNumber(dashboardData.stats.total_views), 
      icon: '👁️',
      change: 'All time',
      color: 'from-purple-500 to-purple-600'
    },
    { 
      label: 'Engagement', 
      value: `${dashboardData.stats.avg_engagement_rate}%`, 
      icon: '📈',
      change: 'Average rate',
      color: 'from-green-500 to-green-600'
    },
    { 
      label: 'Avg Read Time', 
      value: `${Math.round(dashboardData.stats.avg_read_time)}s`, 
      icon: '⏱️',
      change: 'Per content',
      color: 'from-orange-500 to-orange-600'
    }
  ]

  const quickActions = [
    {
      title: 'AI Content Creator',
      description: 'Generate articles, posts, and more with AI',
      icon: '✨',
      action: () => navigate('/creator'),
      color: 'from-blue-600 to-indigo-700'
    },
    {
      title: 'Content Library',
      description: 'Browse and manage your content',
      icon: '📚',
      action: () => navigate('/library'),
      color: 'from-indigo-600 to-purple-700'
    },
    {
      title: 'Social Scheduler',
      description: 'Plan and schedule social media posts',
      icon: '📅',
      action: () => navigate('/scheduler'),
      color: 'from-purple-600 to-pink-700'
    },
    {
      title: 'Analytics Dashboard',
      description: 'Track performance and insights',
      icon: '📊',
      action: () => navigate('/analytics'),
      color: 'from-pink-600 to-red-700'
    },
    {
      title: 'Content Optimizer',
      description: 'Improve SEO and readability',
      icon: '🎯',
      action: () => navigate('/optimizer'),
      color: 'from-red-600 to-orange-700'
    },
    {
      title: 'AI Writing Assistant',
      description: 'Get creative suggestions and ideas',
      icon: '💡',
      action: () => navigate('/assistant'),
      color: 'from-orange-600 to-yellow-700'
    },
    {
      title: 'Content Tagging',
      description: 'Auto-tag and organize content',
      icon: '🏷️',
      action: () => navigate('/tagging'),
      color: 'from-yellow-600 to-green-700'
    },
    {
      title: 'Team Collaboration',
      description: 'Work together with your team',
      icon: '👥',
      action: () => navigate('/team'),
      color: 'from-green-600 to-teal-700'
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
          {/* Loading State */}
          {loading && (
            <div className="text-center py-20">
              <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 rounded-full loading-spinner mx-auto mb-4"></div>
              <p className="text-white text-lg">Loading your dashboard...</p>
            </div>
          )}

          {/* Error State (non-blocking) */}
          {error && !loading && (
            <div className="glass-card rounded-2xl p-6 mb-8 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Unable to load some data
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Some features may not be available. Please check your connection and try refreshing the page.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Dashboard Content */}
          {!loading && (
            <>
              {/* Welcome Section */}
              <div ref={titleRef} className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
                  Welcome back, <span className="gradient-text">{currentUser?.displayName?.split(' ')[0] || 'Creator'}</span>
                </h1>
                <p className="text-gray-700 dark:text-blue-200 text-lg font-normal max-w-2xl mx-auto theme-transition">
                  Ready to create amazing content? Let's see what you can build today.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    ref={el => statsRef.current[index] = el}
                    className="glass-card rounded-2xl p-6 theme-transition hover:scale-105 transition-transform duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                        <span className="text-2xl">{stat.icon}</span>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1 theme-transition">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium theme-transition">
                      {stat.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      {stat.change}
                    </div>
                  </div>
                ))}
              </div>

              {/* Usage Progress & Quick Stats Row */}
              <div className="grid lg:grid-cols-3 gap-6 mb-8">
                {/* Usage Progress */}
                <div className="lg:col-span-2 glass-card rounded-2xl p-6 theme-transition">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Monthly Usage</h3>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {dashboardData.usageStats.current_count} / {dashboardData.usageStats.monthly_limit}
                    </span>
                  </div>
                  <div className="relative w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                    <div 
                      className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                        dashboardData.usageStats.percentage_used >= 90 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                        dashboardData.usageStats.percentage_used >= 70 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                        'bg-gradient-to-r from-green-500 to-green-600'
                      }`}
                      style={{ width: `${Math.min(dashboardData.usageStats.percentage_used, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {dashboardData.usageStats.percentage_used}% used
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {dashboardData.usageStats.monthly_limit - dashboardData.usageStats.current_count} remaining
                    </span>
                  </div>
                  {dashboardData.usageStats.percentage_used >= 80 && (
                    <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <p className="text-sm text-orange-800 dark:text-orange-200">
                        ⚠️ You're approaching your monthly limit. Consider upgrading for unlimited content!
                      </p>
                    </div>
                  )}
                </div>

                {/* Trending Type */}
                <div className="glass-card rounded-2xl p-6 theme-transition">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Trending Type</h3>
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mb-3">
                      <span className="text-3xl">🔥</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">
                      {dashboardData.stats.trending_type}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Most created
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Content & Content Distribution */}
              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                {/* Recent Content */}
                <div className="glass-card rounded-2xl p-6 theme-transition">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recent Content</h3>
                    <button 
                      onClick={() => navigate('/analytics')}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {dashboardData.recentContent.length > 0 ? (
                      dashboardData.recentContent.map((item, index) => (
                        <div 
                          key={index}
                          onClick={() => navigate('/analytics')}
                          className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">
                              {item.content_type === 'article' ? '📝' :
                               item.content_type === 'social-post' ? '📱' :
                               item.content_type === 'email' ? '📧' :
                               item.content_type === 'blog' ? '📰' : '✨'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {item.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(item.created_at).toLocaleDateString()} • {item.word_count} words
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">📝</div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          No content yet. Start creating!
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Distribution */}
                <div className="glass-card rounded-2xl p-6 theme-transition">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Content by Type</h3>
                  <div className="space-y-4">
                    {dashboardData.contentByType.length > 0 ? (
                      dashboardData.contentByType.map((item, index) => {
                        const total = dashboardData.stats.total_content
                        const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0
                        const colors = [
                          'from-blue-500 to-blue-600',
                          'from-purple-500 to-purple-600',
                          'from-green-500 to-green-600',
                          'from-orange-500 to-orange-600',
                          'from-pink-500 to-pink-600'
                        ]
                        return (
                          <div key={index}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                                {item.type}
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {item.count} ({percentage}%)
                              </span>
                            </div>
                            <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className={`absolute top-0 left-0 h-full bg-gradient-to-r ${colors[index % colors.length]} transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">📊</div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          Create content to see distribution
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
                  Quick Actions
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {quickActions.map((action, index) => (
                    <div
                      key={index}
                      ref={el => cardsRef.current[index] = el}
                      onClick={action.action}
                      className="glass-card rounded-xl p-4 cursor-pointer feature-card group theme-transition hover:scale-105"
                    >
                      <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                        <span className="text-xl">{action.icon}</span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 text-center theme-transition">
                        {action.title}
                      </h3>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insights & Tips */}
              <div className="glass-card rounded-2xl p-6 theme-transition">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <span className="text-xl">💡</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Quick Tips</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">🚀 Boost Productivity</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Create content in batches to maintain consistency and save time.
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">📊 Track Performance</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Check Analytics regularly to understand what content performs best.
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">✨ Use AI Features</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Try Chat Assistant and Summarize tabs for faster content creation.
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">🎯 Set Goals</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Aim to create {Math.max(5, Math.ceil(dashboardData.stats.content_this_week * 1.5))} pieces this week to grow your content library.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}

export default Dashboard
