import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { gsap } from 'gsap'
import ParticlesBackground from '../components/ParticlesBackground'
import FloatingEmojis from '../components/FloatingEmojis'
import Header from '../components/Header'
import Footer from '../components/Footer'
import apiService from '../services/api'

const SocialAnalytics = () => {
  const { currentUser } = useAuth()
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [accountUrl, setAccountUrl] = useState('')
  const [connectedAccounts, setConnectedAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const titleRef = useRef(null)
  const contentRef = useRef(null)

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.3 })
    
    tl.fromTo(titleRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
    )
    .fromTo(contentRef.current,
      { y: 80, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 1.2, ease: "back.out(1.1)" },
      "-=0.5"
    )
  }, [])

  useEffect(() => {
    fetchConnectedAccounts()
  }, [])

  const fetchConnectedAccounts = async () => {
    try {
      const response = await apiService.getSocialAccounts()
      if (response.success) {
        setConnectedAccounts(response.accounts)
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  const platforms = [
    {
      id: 'instagram',
      name: 'Instagram',
      icon: '📷',
      color: 'from-pink-500 to-purple-600',
      placeholder: 'https://instagram.com/username',
      available: true
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      color: 'from-blue-600 to-blue-700',
      placeholder: 'https://linkedin.com/in/username',
      available: false,
      comingSoon: true
    },
    {
      id: 'twitter',
      name: 'Twitter/X',
      icon: '🐦',
      color: 'from-blue-400 to-blue-500',
      placeholder: 'https://twitter.com/username',
      available: false,
      comingSoon: true
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: '🎥',
      color: 'from-red-600 to-red-700',
      placeholder: 'https://youtube.com/@username',
      available: false,
      comingSoon: true
    }
  ]

  const handleConnect = async () => {
    if (!selectedPlatform || !accountUrl.trim()) {
      setError('Please select a platform and enter a valid URL')
      return
    }

    // Check if platform is available
    if (!selectedPlatform.available) {
      setError(`${selectedPlatform.name} integration coming soon!`)
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await apiService.connectSocialAccount({
        platform: selectedPlatform.id,
        url: accountUrl
      })

      if (response.success) {
        const newAccount = {
          ...response.account,
          account_url: response.account.profile_url || accountUrl  // Use profile_url from backend or fallback to input
        }
        setConnectedAccounts([...connectedAccounts, newAccount])
        setSelectedAccount(newAccount)
        setAnalytics(response.analytics)
        setAccountUrl('')
        setSelectedPlatform(null)
      } else {
        setError(response.error || 'Failed to connect account')
      }
    } catch (error) {
      setError(error.message || 'Failed to connect account')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAccount = async (account) => {
    setSelectedAccount(account)
    setLoading(true)

    try {
      const response = await apiService.getSocialAnalytics(account.platform, account.username)
      if (response.success) {
        setAnalytics(response.analytics)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (!selectedAccount) return

    setLoading(true)
    try {
      const response = await apiService.refreshSocialAnalytics(selectedAccount._id)
      if (response.success) {
        setAnalytics(response.analytics)
      }
    } catch (error) {
      console.error('Error refreshing analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num?.toString() || '0'
  }

  return (
    <div className="min-h-screen theme-transition relative">
      <ParticlesBackground />
      <FloatingEmojis />
      
      <Header />

      <main className="pt-24 pb-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={titleRef} className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 theme-transition">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500 bg-clip-text text-transparent">
                Social Media Analytics
              </span>
            </h1>
            <p className="text-base sm:text-lg text-gray-700 dark:text-gray-400 max-w-2xl mx-auto theme-transition px-4">
              Analyze your social media accounts and get AI-powered growth insights
            </p>
          </div>

          <div ref={contentRef}>
            {/* Platform Selection */}
            {!selectedAccount && (
              <div className="glass-card rounded-2xl p-8 shadow-lg theme-transition mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 theme-transition">
                  Connect Your Account
                </h2>

                {/* Platform Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {platforms.map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => platform.available && setSelectedPlatform(platform)}
                      disabled={!platform.available}
                      className={`glass-card p-6 rounded-xl transition-all theme-transition relative ${
                        selectedPlatform?.id === platform.id
                          ? `bg-gradient-to-br ${platform.color} text-white`
                          : platform.available 
                            ? 'hover:shadow-lg hover:scale-105' 
                            : 'opacity-60 cursor-not-allowed'
                      }`}
                    >
                      {platform.comingSoon && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          Soon
                        </div>
                      )}
                      <div className="text-4xl mb-3">{platform.icon}</div>
                      <h3 className="text-lg font-semibold">{platform.name}</h3>
                      {platform.comingSoon && (
                        <p className="text-xs mt-2 opacity-75">Coming Soon</p>
                      )}
                    </button>
                  ))}
                </div>

                {/* URL Input */}
                {selectedPlatform && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 theme-transition">
                        {selectedPlatform.name} Profile URL
                      </label>
                      <input
                        type="url"
                        value={accountUrl}
                        onChange={(e) => setAccountUrl(e.target.value)}
                        placeholder={selectedPlatform.placeholder}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white theme-transition"
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 theme-transition">
                        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                      </div>
                    )}

                    <button
                      onClick={handleConnect}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-all"
                    >
                      {loading ? 'Connecting...' : 'Connect & Analyze'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Connected Accounts - Always Show */}
            {connectedAccounts.length > 0 && (
              <div className="glass-card rounded-2xl p-8 shadow-lg theme-transition mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white theme-transition">
                    🔗 Connected Accounts ({connectedAccounts.length})
                  </h2>
                  {selectedAccount && (
                    <button
                      onClick={() => {
                        setSelectedAccount(null)
                        setAnalytics(null)
                      }}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      View All Accounts →
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {connectedAccounts.map((account) => {
                    const platform = platforms.find(p => p.id === account.platform)
                    const isSelected = selectedAccount?._id === account._id
                    
                    return (
                      <div
                        key={account._id}
                        className={`glass-card p-6 rounded-xl transition-all ${
                          isSelected 
                            ? 'ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg scale-105' 
                            : 'hover:scale-105 hover:shadow-lg'
                        }`}
                      >
                        <button
                          onClick={() => handleSelectAccount(account)}
                          className="w-full text-left"
                        >
                          <div className="flex items-center space-x-3 mb-3">
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${platform?.color} flex items-center justify-center text-2xl`}>
                              {platform?.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 dark:text-white theme-transition truncate">
                                {platform?.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 theme-transition truncate">
                                @{account.username}
                              </p>
                            </div>
                          </div>
                          
                          {/* Quick Stats */}
                          {account.metrics && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-600 dark:text-gray-400">
                                  👥 {formatNumber(account.metrics.followers || 0)}
                                </span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  📝 {formatNumber(account.metrics.posts || 0)}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500 dark:text-gray-500 theme-transition mt-2">
                            Updated: {account.last_updated ? new Date(account.last_updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                          </div>
                          
                          {isSelected && (
                            <div className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                              ✓ Currently Viewing
                            </div>
                          )}
                        </button>
                        
                        {/* Account URL Link */}
                        {(account.account_url || account.profile_url) && (
                          <a
                            href={account.account_url || account.profile_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="mt-3 flex items-center justify-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                          >
                            🔗 View Profile
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Analytics Dashboard */}
            {selectedAccount && analytics && (
              <div className="space-y-6">
                {/* Account Header */}
                <div className="glass-card rounded-2xl p-4 sm:p-6 shadow-lg theme-transition">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <span className="text-3xl sm:text-4xl">
                        {platforms.find(p => p.id === selectedAccount.platform)?.icon}
                      </span>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white theme-transition break-all">
                          @{selectedAccount.username}
                        </h2>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 theme-transition">
                          {platforms.find(p => p.id === selectedAccount.platform)?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
                      >
                        🔄 Refresh
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAccount(null)
                          setAnalytics(null)
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
                      >
                        ← Back
                      </button>
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {analytics.metrics && Object.entries(analytics.metrics).map(([key, value]) => {
                    // Get emoji for each metric
                    const getMetricEmoji = (metricKey) => {
                      const emojiMap = {
                        followers: '👥',
                        following: '➕',
                        posts: '📝',
                        likes: '❤️',
                        comments: '💬',
                        shares: '🔄',
                        views: '👁️',
                        engagement: '📊',
                        reach: '🌐',
                        impressions: '👀',
                        saves: '🔖',
                        clicks: '🖱️',
                        subscribers: '🔔',
                        videos: '🎥',
                        connections: '🤝',
                        reactions: '😊',
                        reposts: '♻️',
                        mentions: '📢'
                      }
                      return emojiMap[metricKey] || '📈'
                    }
                    
                    return (
                      <div key={key} className="glass-card rounded-xl p-6 theme-transition hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize theme-transition font-medium">
                            {key.replace(/_/g, ' ')}
                          </p>
                          <span className="text-2xl">{getMetricEmoji(key)}</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white theme-transition">
                          {typeof value === 'number' ? formatNumber(value) : value}
                        </p>
                      </div>
                    )
                  })}
                </div>

                {/* Growth Insights */}
                {analytics.insights && (
                  <div className="glass-card rounded-2xl p-8 shadow-lg theme-transition">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 theme-transition">
                      🚀 Growth Insights
                    </h3>
                    <div className="space-y-4">
                      {analytics.insights.map((insight, index) => (
                        <div key={index} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 theme-transition">
                          <p className="text-gray-900 dark:text-white theme-transition">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default SocialAnalytics
