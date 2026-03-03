import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import Header from '../components/Header'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']

export default function InstagramAnalytics() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [connections, setConnections] = useState([])
  const [selectedConnection, setSelectedConnection] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [competitors, setCompetitors] = useState([])
  const [comparisonData, setComparisonData] = useState(null)
  const [newCompetitor, setNewCompetitor] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [generatingSuggestions, setGeneratingSuggestions] = useState({})
  
  // Advanced analytics state
  const [activeTab, setActiveTab] = useState('dashboard')
  const [enhancedMetrics, setEnhancedMetrics] = useState(null)
  const [captionAnalysis, setCaptionAnalysis] = useState(null)
  const [postingTimeAnalysis, setPostingTimeAnalysis] = useState(null)
  const [formatAnalysis, setFormatAnalysis] = useState(null)
  const [optimalTimes, setOptimalTimes] = useState(null)
  const [loadingAdvanced, setLoadingAdvanced] = useState({})

  useEffect(() => {
    loadConnections()
    loadCompetitors()
  }, [])

  useEffect(() => {
    if (selectedConnection) {
      loadDashboardData()
      loadComparisonData()
      // Load advanced analytics based on active tab
      if (activeTab === 'patterns') {
        loadPatternAnalysis()
      } else if (activeTab === 'ml') {
        loadMLRecommendations()
      }
    }
  }, [selectedConnection, activeTab])

  const loadConnections = async () => {
    try {
      const response = await api.getInstagramConnections()
      if (response.success) {
        setConnections(response.connections)
        if (response.connections.length > 0 && !selectedConnection) {
          setSelectedConnection(response.connections[0])
        }
      }
    } catch (error) {
      console.error('Failed to load connections:', error)
    }
  }

  const loadDashboardData = async () => {
    if (!selectedConnection) return
    
    setLoading(true)
    try {
      const response = await api.getInstagramDashboard(selectedConnection.id)
      if (response.success) {
        setDashboardData(response)
      }
      
      // Also load enhanced metrics for dashboard
      const metricsResponse = await api.getEnhancedMetrics(selectedConnection.id)
      if (metricsResponse.success) {
        setEnhancedMetrics(metricsResponse.metrics)
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const loadPatternAnalysis = async () => {
    if (!selectedConnection) return
    
    setLoadingAdvanced({ ...loadingAdvanced, patterns: true })
    try {
      const [captionRes, timeRes, formatRes] = await Promise.all([
        api.getCaptionAnalysis(selectedConnection.id),
        api.getPostingTimeAnalysis(selectedConnection.id),
        api.getFormatAnalysis(selectedConnection.id)
      ])
      
      if (captionRes.success) setCaptionAnalysis(captionRes.analysis)
      if (timeRes.success) setPostingTimeAnalysis(timeRes.analysis)
      if (formatRes.success) setFormatAnalysis(formatRes.analysis)
    } catch (error) {
      console.error('Failed to load pattern analysis:', error)
    } finally {
      setLoadingAdvanced({ ...loadingAdvanced, patterns: false })
    }
  }
  
  const loadMLRecommendations = async () => {
    if (!selectedConnection) return
    
    setLoadingAdvanced({ ...loadingAdvanced, ml: true })
    try {
      const response = await api.getOptimalPostingTimes(selectedConnection.id)
      if (response.success) {
        setOptimalTimes(response.suggestions)
      }
    } catch (error) {
      console.error('Failed to load ML recommendations:', error)
    } finally {
      setLoadingAdvanced({ ...loadingAdvanced, ml: false })
    }
  }

  const loadCompetitors = async () => {
    try {
      const response = await api.getInstagramCompetitors()
      if (response.success) {
        setCompetitors(response.competitors)
      }
    } catch (error) {
      console.error('Failed to load competitors:', error)
    }
  }

  const loadComparisonData = async () => {
    if (!selectedConnection) return
    
    try {
      const response = await api.compareInstagramAccounts(selectedConnection.id)
      if (response.success) {
        setComparisonData(response.comparison)
      }
    } catch (error) {
      console.error('Failed to load comparison:', error)
    }
  }

  const handleConnectInstagram = async () => {
    try {
      console.log('[Instagram] Requesting OAuth URL from backend...')
      
      // Backend builds the OAuth URL with proper config
      const response = await api.getInstagramAuthUrl()
      
      console.log('[Instagram] OAuth URL response:', response)
      
      if (response.success) {
        console.log('[Instagram] Redirecting to:', response.oauth_url)
        // Store state for verification
        localStorage.setItem('instagram_oauth_state', response.state)
        // Redirect to Instagram OAuth
        window.location.href = response.oauth_url
      } else {
        console.error('[Instagram] Failed to get OAuth URL:', response)
        alert('Failed to generate OAuth URL. Check backend configuration.')
      }
    } catch (error) {
      console.error('[Instagram] Error getting OAuth URL:', error)
      
      // More detailed error message
      let errorMsg = `Failed to connect Instagram: ${error.message}\n\n`
      errorMsg += 'Troubleshooting steps:\n'
      errorMsg += '1. Check backend is running: http://localhost:5001/api/health\n'
      errorMsg += '2. Check Instagram config: http://localhost:5001/api/instagram/debug\n'
      errorMsg += '3. Check browser console for detailed errors\n'
      errorMsg += '4. Make sure you are logged in to ContentGenie\n'
      
      alert(errorMsg)
    }
  }

  const handleSync = async () => {
    if (!selectedConnection) return
    
    setSyncing(true)
    try {
      const response = await api.syncInstagramData(selectedConnection.id)
      if (response.success) {
        alert(`Synced ${response.synced_posts} posts successfully!`)
        await loadDashboardData()
      }
    } catch (error) {
      console.error('Sync failed:', error)
      alert('Failed to sync data. Please try again.')
    } finally {
      setSyncing(false)
    }
  }

  const handleGenerateSuggestions = async (postId) => {
    setGeneratingSuggestions(prev => ({ ...prev, [postId]: true }))
    try {
      const response = await api.generateInstagramSuggestions(postId)
      if (response.success) {
        // Update the post in dashboard data
        setDashboardData(prev => ({
          ...prev,
          posts: prev.posts.map(p => 
            p.id === postId ? response.post : p
          )
        }))
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
      alert('Failed to generate suggestions. Please try again.')
    } finally {
      setGeneratingSuggestions(prev => ({ ...prev, [postId]: false }))
    }
  }

  const handleAddCompetitor = async (e) => {
    e.preventDefault()
    if (!newCompetitor.trim()) return
    
    try {
      const response = await api.addInstagramCompetitor(newCompetitor.trim())
      if (response.success) {
        setCompetitors([...competitors, response.competitor])
        setNewCompetitor('')
        if (response.note) {
          alert(response.note)
        }
        await loadComparisonData()
      }
    } catch (error) {
      console.error('Failed to add competitor:', error)
      alert(error.message || 'Failed to add competitor')
    }
  }

  const handleRemoveCompetitor = async (competitorId) => {
    if (!confirm('Remove this competitor?')) return
    
    try {
      const response = await api.removeInstagramCompetitor(competitorId)
      if (response.success) {
        setCompetitors(competitors.filter(c => c.id !== competitorId))
        await loadComparisonData()
      }
    } catch (error) {
      console.error('Failed to remove competitor:', error)
    }
  }

  // Prepare chart data
  const getEngagementChartData = () => {
    if (!dashboardData?.posts) return []
    
    return dashboardData.posts
      .slice(0, 10)
      .reverse()
      .map((post, idx) => ({
        name: `Post ${idx + 1}`,
        engagement: post.engagement_rate,
        likes: post.like_count,
        comments: post.comments_count
      }))
  }

  const getPostTypeDistribution = () => {
    if (!dashboardData?.posts) return []
    
    const types = {}
    dashboardData.posts.forEach(post => {
      const type = post.media_type || 'UNKNOWN'
      types[type] = (types[type] || 0) + 1
    })
    
    return Object.entries(types).map(([name, value]) => ({ name, value }))
  }

  // Render Dashboard Tab
  const renderDashboardTab = () => (
    <>
      {/* Last Synced Info */}
      {selectedConnection?.last_synced_at && (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 text-right">
          Last synced: {new Date(selectedConnection.last_synced_at).toLocaleString()}
        </div>
      )}

      {/* Account Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-300">Followers</span>
            <span className="text-2xl">ðŸ‘¥</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {dashboardData.metrics.followers_count.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-300">Avg Engagement</span>
            <span className="text-2xl">ðŸ“ˆ</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {dashboardData.metrics.avg_engagement_rate}%
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-300">Avg Reach</span>
            <span className="text-2xl">ðŸŽ¯</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {enhancedMetrics?.avg_reach ? Math.round(enhancedMetrics.avg_reach).toLocaleString() : dashboardData.metrics.total_reach.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-300">Total Posts</span>
            <span className="text-2xl">ðŸ“¸</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {dashboardData.metrics.total_posts}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Engagement Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getEngagementChartData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="engagement" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Post Type Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getPostTypeDistribution()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {getPostTypeDistribution().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Growth Trend Chart */}
      {enhancedMetrics?.growth_trend && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Growth Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={enhancedMetrics.growth_trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="engagement" stroke="#ec4899" strokeWidth={2} name="Engagement Rate" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Underperforming Posts Section */}
      {dashboardData.underperforming_posts && dashboardData.underperforming_posts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-red-500">âš ï¸</span>
            Underperforming Posts ({dashboardData.underperforming_posts.length})
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            These posts are performing below your average engagement rate
          </p>

          <div className="space-y-4">
            {dashboardData.underperforming_posts.map(post => (
              <div key={post.id} className="border border-red-200 dark:border-red-800 rounded-xl p-4 bg-red-50 dark:bg-red-900/20">
                <div className="flex gap-4">
                  {post.media_url && (
                    <img 
                      src={post.media_url} 
                      alt="Post" 
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                        {post.performance_score}% of avg
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {post.media_type}
                      </span>
                    </div>
                    <p className="text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {post.caption || 'No caption'}
                    </p>
                    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <span>â¤ï¸ {post.like_count}</span>
                      <span>ðŸ’¬ {post.comments_count}</span>
                      <span>ðŸ“Š {post.engagement_rate}%</span>
                    </div>

                    {post.ai_suggestions && post.ai_suggestions.length > 0 ? (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mt-3">
                        <p className="font-semibold text-gray-900 dark:text-white mb-2">
                          ðŸ’¡ AI Suggestions:
                        </p>
                        <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                          {post.ai_suggestions.map((suggestion, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span>{idx + 1}.</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGenerateSuggestions(post.id)}
                        disabled={generatingSuggestions[post.id]}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {generatingSuggestions[post.id] ? 'Generating...' : 'âœ¨ Get AI Suggestions'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Posts Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Recent Posts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboardData.posts.slice(0, 12).map(post => (
            <div key={post.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              {post.media_url && (
                <img 
                  src={post.media_url} 
                  alt="Post" 
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                    {post.media_type}
                  </span>
                  {post.is_underperforming && (
                    <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                      âš ï¸ Low
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                  {post.caption || 'No caption'}
                </p>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>â¤ï¸ {post.like_count}</span>
                  <span>ðŸ’¬ {post.comments_count}</span>
                  <span>ðŸ“Š {post.engagement_rate}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )

  // Render Pattern Recognition Tab
  const renderPatternsTab = () => {
    if (loadingAdvanced.patterns) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Analyzing patterns...</p>
        </div>
      )
    }

    if (!captionAnalysis && !postingTimeAnalysis && !formatAnalysis) {
      return (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <p className="text-gray-600 dark:text-gray-300">Not enough data for pattern analysis. Need at least 3 posts.</p>
        </div>
      )
    }

    return (
      <>
        {/* Recommendation Box */}
        {postingTimeAnalysis?.recommendation && formatAnalysis?.best_format && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <span className="text-3xl">ðŸ’¡</span>
              <div>
                <h3 className="text-xl font-bold mb-2">Top Recommendation</h3>
                <p className="text-lg">
                  Post {formatAnalysis.best_format.format}s on {postingTimeAnalysis.recommendation.day} at {postingTimeAnalysis.recommendation.hour}:00 for best results
                </p>
                <p className="text-sm mt-2 opacity-90">
                  Based on your historical engagement patterns
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Caption Length Analysis */}
          {captionAnalysis && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Best Caption Length
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={captionAnalysis.by_length}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bucket" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avg_engagement_rate" fill="#8b5cf6" name="Avg Engagement %" />
                </BarChart>
              </ResponsiveContainer>
              {captionAnalysis.best_length && (
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                  âœ¨ Best performing: {captionAnalysis.best_length.bucket} captions with {captionAnalysis.best_length.avg_engagement_rate.toFixed(2)}% engagement
                </p>
              )}
            </div>
          )}

          {/* Format Analysis */}
          {formatAnalysis && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Best Content Format
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formatAnalysis.by_format}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="format" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avg_engagement_rate" fill="#ec4899" name="Avg Engagement %" />
                </BarChart>
              </ResponsiveContainer>
              {formatAnalysis.best_format && (
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                  âœ¨ Best performing: {formatAnalysis.best_format.format} with {formatAnalysis.best_format.avg_engagement_rate.toFixed(2)}% engagement
                </p>
              )}
            </div>
          )}
        </div>

        {/* Posting Time Heatmap */}
        {postingTimeAnalysis && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Best Posting Times
            </h3>
            
            {/* By Hour */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">By Hour of Day</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={postingTimeAnalysis.by_hour}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" label={{ value: 'Hour', position: 'insideBottom', offset: -5 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avg_engagement_rate" fill="#10b981" name="Avg Engagement %" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* By Day */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">By Day of Week</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={postingTimeAnalysis.by_day}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avg_engagement_rate" fill="#f59e0b" name="Avg Engagement %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </>
    )
  }

  // Render Sentiment Analysis Tab
  const renderSentimentTab = () => (
    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
      <span className="text-6xl mb-4 block">ðŸ’¬</span>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Sentiment Analysis Coming Soon
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        This feature requires comment data from Instagram API.
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Instagram's Basic Display API doesn't provide comment access. 
        You'll need Instagram Business API with additional permissions.
      </p>
    </div>
  )

  // Render ML Recommendations Tab
  const renderMLTab = () => {
    if (loadingAdvanced.ml) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading ML recommendations...</p>
        </div>
      )
    }

    return (
      <>
        {/* Optimal Posting Times */}
        {optimalTimes && optimalTimes.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              ðŸ¤– Optimal Posting Times
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Based on machine learning analysis of your historical engagement patterns
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {optimalTimes.slice(0, 3).map((slot, idx) => (
                <div key={idx} className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      #{idx + 1}
                    </span>
                    <span className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full">
                      {slot.confidence}% confidence
                    </span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {slot.day}
                  </p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {slot.hour}:00
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Avg engagement: {slot.avg_engagement_rate.toFixed(2)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
            <p className="text-gray-600 dark:text-gray-300">
              Not enough data for ML predictions. Need at least 3 posts.
              <br />
              <span className="text-sm mt-2 block">{'\u{1F4A1}'} Predictions improve with more posts!</span>
            </p>
          </div>
        )}

        {/* Engagement Predictor */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            ðŸ“Š Engagement Predictor
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Predict engagement for your next post based on content characteristics
          </p>
          
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
            <p className="text-center text-gray-700 dark:text-gray-300">
              <span className="text-4xl mb-3 block">ðŸ”®</span>
              This feature requires training a model on your historical data.
              <br />
              <span className="text-sm">Keep posting and syncing to unlock predictions!</span>
            </p>
          </div>
        </div>
      </>
    )
  }

  // Render Competitor Compare Tab
  const renderCompetitorTab = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Competitor Comparison
      </h3>

      {/* Add Competitor Form */}
      <form onSubmit={handleAddCompetitor} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newCompetitor}
            onChange={(e) => setNewCompetitor(e.target.value)}
            placeholder="Enter competitor's Instagram username"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            className="bg-purple-600 text-white px-6 py-2 rounded-xl hover:bg-purple-700 transition-all"
          >
            Add Competitor
          </button>
        </div>
      </form>

      {/* Comparison Table */}
      {comparisonData ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-900 dark:text-white">Account</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-white">Followers</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-white">Avg Engagement</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-white">Posts/Week</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-purple-50 dark:bg-purple-900/20">
                <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  @{comparisonData.user_account.username} (You)
                </td>
                <td className="text-right py-3 px-4 text-gray-900 dark:text-white">
                  {comparisonData.user_account.followers.toLocaleString()}
                </td>
                <td className="text-right py-3 px-4 text-gray-900 dark:text-white">
                  {comparisonData.user_account.avg_engagement_rate}%
                </td>
                <td className="text-right py-3 px-4 text-gray-900 dark:text-white">
                  {comparisonData.user_account.posting_frequency}
                </td>
                <td></td>
              </tr>
              {comparisonData.competitors.map(comp => (
                <tr key={comp.id} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-3 px-4 text-gray-900 dark:text-white">
                    @{comp.instagram_username}
                  </td>
                  <td className="text-right py-3 px-4 text-gray-900 dark:text-white">
                    {comp.followers_count > 0 ? comp.followers_count.toLocaleString() : (
                      <span className="text-gray-400 dark:text-gray-500" title="Public data not available. Competitor must connect their account.">
                        N/A
                      </span>
                    )}
                  </td>
                  <td className="text-right py-3 px-4 text-gray-900 dark:text-white">
                    {comp.avg_engagement_rate > 0 ? `${comp.avg_engagement_rate}%` : (
                      <span className="text-gray-400 dark:text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="text-right py-3 px-4 text-gray-900 dark:text-white">
                    {comp.posting_frequency > 0 ? comp.posting_frequency : (
                      <span className="text-gray-400 dark:text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="text-right py-3 px-4">
                    <button
                      onClick={() => handleRemoveCompetitor(comp.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-600 dark:text-gray-300">
          Add competitors to see comparison data
        </div>
      )}
    </div>
  )

  if (connections.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12">
              <div className="text-6xl mb-6">ðŸ“Š</div>
              <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                Instagram Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Connect your Instagram account to unlock powerful analytics, 
                underperformance detection, and AI-powered suggestions.
              </p>
              <button
                onClick={handleConnectInstagram}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
              >
                Connect Instagram Account
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Instagram Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Track performance, detect issues, and get AI-powered insights
            </p>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={handleSync}
              disabled={syncing || !selectedConnection}
              className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {syncing ? 'Syncing...' : 'ðŸ”„ Sync Data'}
            </button>
            <button
              onClick={handleConnectInstagram}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              + Add Account
            </button>
          </div>
        </div>

        {/* Account Selector */}
        {connections.length > 1 && (
          <div className="mb-6">
            <select
              value={selectedConnection?.id || ''}
              onChange={(e) => setSelectedConnection(connections.find(c => c.id === e.target.value))}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
            >
              {connections.map(conn => (
                <option key={conn.id} value={conn.id}>
                  @{conn.instagram_username}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-2">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'dashboard', label: 'ðŸ“Š Dashboard', icon: 'ðŸ“Š' },
              { id: 'patterns', label: 'ðŸ” Pattern Recognition', icon: 'ðŸ”' },
              { id: 'sentiment', label: 'ðŸ’¬ Sentiment Analysis', icon: 'ðŸ’¬' },
              { id: 'ml', label: 'ðŸ¤– ML Recommendations', icon: 'ðŸ¤–' },
              { id: 'competitor', label: 'ðŸ† Competitor Compare', icon: 'ðŸ†' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading analytics...</p>
          </div>
        ) : dashboardData ? (
          <>
            {/* Tab Content */}
            {activeTab === 'dashboard' && renderDashboardTab()}
            {activeTab === 'patterns' && renderPatternsTab()}
            {activeTab === 'sentiment' && renderSentimentTab()}
            {activeTab === 'ml' && renderMLTab()}
            {activeTab === 'competitor' && renderCompetitorTab()}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-300">No data available. Click "Sync Data" to fetch your Instagram analytics.</p>
          </div>
        )}
      </div>
    </div>
  )
}
