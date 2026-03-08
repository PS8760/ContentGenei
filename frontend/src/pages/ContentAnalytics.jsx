import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import ParticlesBackground from '../components/ParticlesBackground'
import FloatingEmojis from '../components/FloatingEmojis'
import Header from '../components/Header'
import Footer from '../components/Footer'
import apiService from '../services/api'

const ContentAnalytics = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [contents, setContents] = useState([])
  const [stats, setStats] = useState({
    total_content: 0,
    total_words: 0,
    avg_word_count: 0,
    content_by_type: {}
  })
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  
  const titleRef = useRef(null)
  const statsRef = useRef([])
  const contentRef = useRef(null)

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.3 })
    
    tl.fromTo(titleRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
    )
    .fromTo(statsRef.current,
      { y: 80, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 1, stagger: 0.1, ease: "back.out(1.1)" },
      "-=0.5"
    )
  }, [loading])

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    try {
      setLoading(true)
      console.log('Loading content...')
      
      const response = await apiService.getContent({ per_page: 100 })
      console.log('Content response:', response)
      
      if (response.success) {
        const contentList = response.content || []
        console.log('Content list:', contentList.length, 'items')
        setContents(contentList)
        
        // Calculate stats
        const totalWords = contentList.reduce((sum, item) => sum + (item.word_count || 0), 0)
        const contentByType = {}
        
        contentList.forEach(item => {
          const type = item.content_type || 'other'
          contentByType[type] = (contentByType[type] || 0) + 1
        })
        
        setStats({
          total_content: contentList.length,
          total_words: totalWords,
          avg_word_count: contentList.length > 0 ? Math.round(totalWords / contentList.length) : 0,
          content_by_type: contentByType
        })
      } else {
        console.error('Failed to load content:', response.error)
        // Set empty state but don't show error
        setContents([])
      }
    } catch (error) {
      console.error('Failed to load content:', error)
      // Set empty state but don't show error
      setContents([])
    } finally {
      setLoading(false)
    }
  }

  const getFilteredContent = () => {
    let filtered = [...contents]
    
    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.content_type === selectedType)
    }
    
    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(item => item.status === selectedStatus)
    }
    
    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        break
      case 'longest':
        filtered.sort((a, b) => (b.word_count || 0) - (a.word_count || 0))
        break
      case 'shortest':
        filtered.sort((a, b) => (a.word_count || 0) - (b.word_count || 0))
        break
      default:
        break
    }
    
    return filtered
  }

  const getContentTypeIcon = (type) => {
    const icons = {
      article: '📄',
      blog: '📝',
      'social-post': '📱',
      email: '📧',
      caption: '💬',
      script: '🎬',
      'ad-copy': '📢',
      other: '📋'
    }
    return icons[type] || icons.other
  }

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
      published: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
      archived: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
    }
    return colors[status] || colors.draft
  }

  const handleViewContent = (content) => {
    // Navigate to creator with content loaded
    navigate('/creator', { state: { content } })
  }

  const handleDeleteContent = async (contentId) => {
    if (!confirm('Are you sure you want to delete this content?')) return
    
    try {
      const response = await apiService.deleteContent(contentId)
      if (response.success) {
        loadContent()
      }
    } catch (error) {
      console.error('Failed to delete content:', error)
      alert('Failed to delete content')
    }
  }

  const filteredContent = getFilteredContent()

  return (
    <div className="min-h-screen theme-transition relative">
      <ParticlesBackground />
      <FloatingEmojis />
      
      <Header />

      <main className="pt-24 pb-12 relative z-10 content-layer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title Section */}
          <div ref={titleRef} className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-700 mb-4 leading-tight tracking-tight">
              <span className="gradient-text">Content Analytics</span>
            </h1>
            <p className="text-gray-700 dark:text-blue-200 text-lg font-normal max-w-2xl mx-auto theme-transition">
              Track and manage all your AI-generated content in one place.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div ref={el => statsRef.current[0] = el} className="glass-card rounded-xl p-6 theme-transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Total Content</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total_content}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 dark:from-blue-500 dark:to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📄</span>
                </div>
              </div>
            </div>

            <div ref={el => statsRef.current[1] = el} className="glass-card rounded-xl p-6 theme-transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Total Words</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total_words.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-black dark:from-purple-500 dark:to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✍️</span>
                </div>
              </div>
            </div>

            <div ref={el => statsRef.current[2] = el} className="glass-card rounded-xl p-6 theme-transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Words/Content</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.avg_word_count}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-black to-gray-700 dark:from-green-500 dark:to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>

            <div ref={el => statsRef.current[3] = el} className="glass-card rounded-xl p-6 theme-transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Content Types</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{Object.keys(stats.content_by_type).length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-800 dark:from-orange-500 dark:to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="glass-card rounded-xl p-6 mb-8 theme-transition">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-800 dark:focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="article">Article</option>
                  <option value="blog">Blog Post</option>
                  <option value="social-post">Social Post</option>
                  <option value="email">Email</option>
                  <option value="caption">Caption</option>
                  <option value="script">Script</option>
                  <option value="ad-copy">Ad Copy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-800 dark:focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-800 dark:focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="longest">Longest First</option>
                  <option value="shortest">Shortest First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 dark:border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading content...</p>
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center theme-transition">
              <span className="text-6xl mb-4 block">📭</span>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No content found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {contents.length === 0 
                  ? "Start creating content with our AI-powered tools!"
                  : "Try adjusting your filters to see more content."}
              </p>
              {contents.length === 0 && (
                <button
                  onClick={() => navigate('/creator')}
                  className="bg-gradient-to-r from-gray-800 to-gray-900 dark:from-blue-600 dark:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Create Content →
                </button>
              )}
            </div>
          ) : (
            <div ref={contentRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContent.map((content) => (
                <div key={content.id} className="glass-card rounded-xl p-6 hover:shadow-xl transition-all theme-transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-3xl">{getContentTypeIcon(content.content_type)}</span>
                      <div>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                          {content.content_type || 'other'}
                        </span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(content.status)}`}>
                      {content.status || 'draft'}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {content.title || 'Untitled Content'}
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                    {content.content?.substring(0, 150)}...
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 mb-4">
                    <span>{content.word_count || 0} words</span>
                    <span>{new Date(content.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewContent(content)}
                      className="flex-1 bg-gray-800 hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all text-sm"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteContent(content.id)}
                      className="bg-gray-600 hover:bg-gray-700 dark:bg-red-600 dark:hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default ContentAnalytics
