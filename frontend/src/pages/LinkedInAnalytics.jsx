import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSearchParams } from 'react-router-dom'
import { gsap } from 'gsap'
import api from '../services/api'
import ParticlesBackground from '../components/ParticlesBackground'
import FloatingEmojis from '../components/FloatingEmojis'
import ToastManager from '../utils/ToastManager'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#0077B5', '#00A0DC', '#0E76A8', '#313335', '#86888A', '#00A0DC']

export default function LinkedInAnalytics() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [connections, setConnections] = useState([])
  const [selectedConnection, setSelectedConnection] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // Refs for GSAP animations
  const titleRef = useRef(null)
  const statsRef = useRef([])
  const cardsRef = useRef([])
  const tabsRef = useRef(null)

  // GSAP animations on mount
  useEffect(() => {
    if (!loading && dashboardData) {
      const tl = gsap.timeline({ delay: 0.2 })
      
      if (titleRef.current) {
        tl.fromTo(titleRef.current,
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
        )
      }
      
      if (tabsRef.current) {
        tl.fromTo(tabsRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
          "-=0.6"
        )
      }
      
      if (statsRef.current.length > 0) {
        tl.fromTo(statsRef.current,
          { y: 80, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 1, stagger: 0.1, ease: "back.out(1.1)" },
          "-=0.5"
        )
      }
    }
  }, [loading, dashboardData])

  // Load connections on mount
  useEffect(() => {
    loadConnections()
  }, [])

  // Load dashboard when connection selected
  useEffect(() => {
    if (selectedConnection) {
      loadDashboard(selectedConnection.id)
    }
  }, [selectedConnection])

  const loadConnections = async () => {
    try {
      setLoading(true)
      const response = await api.getLinkedInConnections()
      
      if (response.success && response.connections.length > 0) {
        setConnections(response.connections)
        setSelectedConnection(response.connections[0])
      } else {
        setConnections([])
        setLoading(false)
      }
    } catch (error) {
      console.error('Error loading connections:', error)
      ToastManager.error('Error', 'Failed to load LinkedIn connections')
      setLoading(false)
    }
  }

  const loadDashboard = async (connectionId) => {
    try {
      setLoading(true)
      const response = await api.getLinkedInDashboard(connectionId)
      
      if (response.success) {
        setDashboardData(response)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
      ToastManager.error('Error', 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    if (!selectedConnection) return
    
    try {
      setSyncing(true)
      const response = await api.syncLinkedInData(selectedConnection.id)
      
      if (response.success) {
        ToastManager.success('Synced!', `Synced ${response.posts_synced} posts`)
        await loadDashboard(selectedConnection.id)
      }
    } catch (error) {
      console.error('Error syncing:', error)
      ToastManager.error('Sync Failed', 'Failed to sync LinkedIn data')
    } finally {
      setSyncing(false)
    }
  }

  const handleConnectLinkedIn = async () => {
    try {
      console.log('[LinkedIn] Requesting OAuth URL from backend...')
      const response = await api.getLinkedInAuthUrl()
      
      console.log('[LinkedIn] OAuth URL response:', response)
      
      if (response.success && response.oauth_url) {
        console.log('[LinkedIn] Redirecting to:', response.oauth_url)
        window.location.href = response.oauth_url
      } else {
        ToastManager.error('Error', 'Failed to get LinkedIn authorization URL')
      }
    } catch (error) {
      console.error('[LinkedIn] Error getting auth URL:', error)
      ToastManager.error('Error', 'Failed to connect to LinkedIn')
    }
  }

  // No connection state
  if (connections.length === 0) {
    return (
      <div className="min-h-screen theme-transition relative">
        <ParticlesBackground />
        <FloatingEmojis />
        
        <div className="container mx-auto px-4 py-20 relative z-10 content-layer">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Connect Your LinkedIn Account
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Connect your LinkedIn account to access analytics, track engagement, and optimize your professional content.
            </p>
            
            <button
              onClick={handleConnectLinkedIn}
              className="btn-primary px-8 py-4 rounded-2xl text-lg font-semibold inline-flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span>Connect LinkedIn</span>
            </button>
            
            <div className="mt-12 glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                What you'll get:
              </h3>
              <ul className="space-y-3 text-left">
                <li className="flex items-start space-x-3">
                  <span className="text-blue-600 dark:text-blue-400 text-xl">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Track post engagement and reach</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-blue-600 dark:text-blue-400 text-xl">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Analyze your professional network growth</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-blue-600 dark:text-blue-400 text-xl">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Optimize content strategy with insights</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen theme-transition relative">
        <ParticlesBackground />
        <FloatingEmojis />
        
        <div className="container mx-auto px-4 py-20 relative z-10 content-layer">
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 rounded-full loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-900 dark:text-white text-lg">Loading LinkedIn analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen theme-transition relative overflow-hidden">
      <ParticlesBackground />
      <FloatingEmojis />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 relative z-10 content-layer max-w-7xl">
        {/* Header Section */}
        <div ref={titleRef} className="mb-10">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <a href="/dashboard" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Dashboard</a>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900 dark:text-gray-100 font-medium">LinkedIn Analytics</span>
          </nav>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">LinkedIn Analytics</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {dashboardData?.connection?.linkedin_name || 'Professional Insights'}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleSync}
              disabled={syncing}
              className="btn-primary px-6 py-3 rounded-2xl inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50"
            >
              {syncing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Sync Data</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div ref={tabsRef} className="mb-8">
          <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 font-medium transition-all rounded-t-xl ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-6 py-3 font-medium transition-all rounded-t-xl ${
                activeTab === 'posts'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Posts
            </button>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && dashboardData && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Connections', value: dashboardData.stats.connections_count, icon: '👥', color: 'from-blue-500 to-blue-600' },
                { label: 'Total Posts', value: dashboardData.stats.total_posts, icon: '📝', color: 'from-purple-500 to-purple-600' },
                { label: 'Total Likes', value: dashboardData.stats.total_likes, icon: '👍', color: 'from-pink-500 to-pink-600' },
                { label: 'Avg Engagement', value: dashboardData.stats.avg_engagement, icon: '📊', color: 'from-green-500 to-green-600' }
              ].map((stat, index) => (
                <div
                  key={stat.label}
                  ref={el => statsRef.current[index] = el}
                  className="glass-card rounded-3xl p-6 hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg`}>
                      {stat.icon}
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value.toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* API Limitations Notice */}
            {dashboardData.stats.total_posts === 0 && (
              <div className="glass-card rounded-3xl p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Limited Data Access
                    </h3>
                    <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
                      LinkedIn's API has restricted access to post data and analytics. To access full analytics including posts, engagement metrics, and detailed insights, your LinkedIn app needs to be approved for the LinkedIn Partner Program.
                    </p>
                    <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                      <p>✓ Basic profile information is available</p>
                      <p>✓ You can post content using this connection</p>
                      <p>✗ Post history requires partner access</p>
                      <p>✗ Detailed analytics require partner access</p>
                    </div>
                    <a 
                      href="https://learn.microsoft.com/en-us/linkedin/marketing/getting-started" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                    >
                      <span>Learn about LinkedIn Partner Program</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Posts Preview */}
            <div className="glass-card rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h3>
              <div className="space-y-4">
                {dashboardData.posts.slice(0, 5).map(post => (
                  <div key={post.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                    <p className="text-gray-900 dark:text-white font-medium mb-2 line-clamp-2">
                      {post.post_text || 'No caption'}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>👍 {post.likes_count}</span>
                      <span>💬 {post.comments_count}</span>
                      <span>🔄 {post.shares_count}</span>
                      <span className="ml-auto">{new Date(post.published_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && dashboardData && (
          <div className="space-y-6">
            {dashboardData.posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardData.posts.map(post => (
                  <div key={post.id} className="glass-card rounded-3xl p-6 hover:shadow-2xl transition-all duration-300">
                    {post.media_url && (
                      <img src={post.media_url} alt="Post" className="w-full h-48 object-cover rounded-2xl mb-4" />
                    )}
                    <p className="text-gray-900 dark:text-white mb-4 line-clamp-3">
                      {post.post_text || 'No caption'}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-3">
                        <span>👍 {post.likes_count}</span>
                        <span>💬 {post.comments_count}</span>
                        <span>🔄 {post.shares_count}</span>
                      </div>
                      <span>{new Date(post.published_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-3xl p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  No Posts Available
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  LinkedIn's API requires partner program access to retrieve post history and analytics. Your connection is active and can be used for posting content.
                </p>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="btn-primary px-6 py-3 rounded-2xl inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50"
                >
                  {syncing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Try Sync Again</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
