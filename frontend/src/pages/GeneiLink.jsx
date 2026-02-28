import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import ParticlesBackground from '../components/ParticlesBackground'
import FloatingEmojis from '../components/FloatingEmojis'
import Header from '../components/Header'
import Footer from '../components/Footer'
import apiService from '../services/api'

const GeneiLink = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('connections')
  const [connections, setConnections] = useState({})
  const [posts, setPosts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showSavedOnly, setShowSavedOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: '', description: '', color: '#3B82F6' })
  
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
    if (activeTab === 'connections') {
      fetchConnections()
    } else if (activeTab === 'feed') {
      fetchPosts()
      fetchCategories()
    } else if (activeTab === 'saved') {
      fetchSavedPosts()
      fetchCategories()
    } else if (activeTab === 'categories') {
      fetchCategories()
    }
  }, [activeTab])

  const fetchConnections = async () => {
    try {
      setLoading(true)
      const response = await apiService.getConnections()
      if (response.success) {
        setConnections(response.connections)
      }
    } catch (error) {
      console.error('Error fetching connections:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = {}
      if (selectedPlatform !== 'all') params.platform = selectedPlatform
      if (selectedCategory !== 'all') params.category = selectedCategory
      if (showSavedOnly) params.saved = 'true'
      if (searchQuery) params.search = searchQuery
      
      const response = await apiService.getAggregatedPosts(params)
      if (response.success) {
        setPosts(response.posts)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSavedPosts = async () => {
    try {
      setLoading(true)
      const response = await apiService.getSavedPosts()
      if (response.success) {
        setPosts(response.posts)
      }
    } catch (error) {
      console.error('Error fetching saved posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await apiService.getCategories()
      if (response.success) {
        setCategories(response.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleConnectPlatform = async (platform) => {
    try {
      const response = await apiService.initiateOAuth(platform)
      if (response.success && response.auth_url) {
        // Open OAuth URL in popup
        window.open(response.auth_url, 'OAuth', 'width=600,height=700')
      }
    } catch (error) {
      console.error('Error connecting platform:', error)
      alert('Failed to connect platform. Please try again.')
    }
  }

  const handleDisconnect = async (connectionId) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return
    
    try {
      const response = await apiService.disconnectPlatform(connectionId)
      if (response.success) {
        fetchConnections()
      }
    } catch (error) {
      console.error('Error disconnecting:', error)
      alert('Failed to disconnect. Please try again.')
    }
  }

  const handleSavePost = async (postId) => {
    try {
      const response = await apiService.savePost(postId)
      if (response.success) {
        fetchPosts()
      }
    } catch (error) {
      console.error('Error saving post:', error)
    }
  }

  const handleUnsavePost = async (postId) => {
    try {
      const response = await apiService.unsavePost(postId)
      if (response.success) {
        if (activeTab === 'saved') {
          fetchSavedPosts()
        } else {
          fetchPosts()
        }
      }
    } catch (error) {
      console.error('Error unsaving post:', error)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      alert('Please enter a category name')
      return
    }
    
    try {
      const response = await apiService.createCategory(newCategory)
      if (response.success) {
        setShowCategoryModal(false)
        setNewCategory({ name: '', description: '', color: '#3B82F6' })
        fetchCategories()
      }
    } catch (error) {
      console.error('Error creating category:', error)
      alert(error.message || 'Failed to create category')
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Are you sure? Posts will not be deleted, just uncategorized.')) return
    
    try {
      const response = await apiService.deleteCategory(categoryId)
      if (response.success) {
        fetchCategories()
      }
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const getPlatformIcon = (platform) => {
    const icons = {
      instagram: '📷',
      linkedin: '💼',
      twitter: '🐦',
      facebook: '👥'
    }
    return icons[platform] || '🔗'
  }

  const getPlatformColor = (platform) => {
    const colors = {
      instagram: 'from-pink-500 to-purple-600',
      linkedin: 'from-blue-600 to-blue-700',
      twitter: 'from-blue-400 to-blue-500',
      facebook: 'from-blue-600 to-indigo-600'
    }
    return colors[platform] || 'from-gray-500 to-gray-600'
  }

  return (
    <div className="min-h-screen theme-transition relative">
      <ParticlesBackground />
      <FloatingEmojis />
      
      <Header />

      <main className="pt-24 pb-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={titleRef} className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 theme-transition">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500 bg-clip-text text-transparent">GeneiLink</span>
            </h1>
            <p className="text-gray-700 dark:text-gray-400 text-lg max-w-2xl mx-auto theme-transition">
              Aggregate and manage your social media posts from all platforms in one place
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="glass-card rounded-2xl p-1.5 inline-flex space-x-1 shadow-lg theme-transition">
              <button
                onClick={() => setActiveTab('connections')}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                  activeTab === 'connections'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white theme-transition'
                }`}
              >
                <span>🔗</span>
                <span>Connections</span>
              </button>
              <button
                onClick={() => setActiveTab('feed')}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                  activeTab === 'feed'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white theme-transition'
                }`}
              >
                <span>📱</span>
                <span>Feed</span>
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                  activeTab === 'saved'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white theme-transition'
                }`}
              >
                <span>⭐</span>
                <span>Saved</span>
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                  activeTab === 'categories'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white theme-transition'
                }`}
              >
                <span>🏷️</span>
                <span>Categories</span>
              </button>
            </div>
          </div>

          <div ref={contentRef}>
            {/* CONNECTIONS TAB */}
            {activeTab === 'connections' && (
              <div className="max-w-5xl mx-auto">
                <div className="glass-card rounded-2xl p-6 shadow-lg theme-transition mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 theme-transition">
                    Connect Your Platforms
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 theme-transition">
                    Connect your social media accounts to start aggregating your posts
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    {['instagram', 'linkedin', 'twitter'].map((platform) => (
                      <button
                        key={platform}
                        onClick={() => handleConnectPlatform(platform)}
                        className={`glass-card p-6 rounded-xl hover:scale-105 transition-all theme-transition bg-gradient-to-br ${getPlatformColor(platform)} text-white`}
                      >
                        <div className="text-4xl mb-3">{getPlatformIcon(platform)}</div>
                        <h3 className="text-lg font-semibold capitalize">{platform}</h3>
                        <p className="text-sm opacity-90 mt-1">Connect Account</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Connected Accounts */}
                {Object.keys(connections).length > 0 && (
                  <div className="glass-card rounded-2xl p-6 shadow-lg theme-transition">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 theme-transition">
                      Connected Accounts
                    </h2>
                    
                    {Object.entries(connections).map(([platform, accounts]) => (
                      <div key={platform} className="mb-6 last:mb-0">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 capitalize theme-transition flex items-center">
                          <span className="mr-2">{getPlatformIcon(platform)}</span>
                          {platform}
                        </h3>
                        <div className="space-y-3">
                          {accounts.map((account) => (
                            <div key={account.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 flex items-center justify-between theme-transition">
                              <div className="flex items-center space-x-3">
                                {account.profile_image_url && (
                                  <img src={account.profile_image_url} alt={account.platform_username} className="w-10 h-10 rounded-full" />
                                )}
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white theme-transition">
                                    @{account.platform_username}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 theme-transition">
                                    Last synced: {account.last_synced_at ? new Date(account.last_synced_at).toLocaleDateString() : 'Never'}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDisconnect(account.id)}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                              >
                                Disconnect
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* FEED TAB */}
            {activeTab === 'feed' && (
              <div className="max-w-6xl mx-auto">
                {/* Filters */}
                <div className="glass-card rounded-2xl p-4 shadow-lg theme-transition mb-6">
                  <div className="flex flex-wrap gap-4">
                    <select
                      value={selectedPlatform}
                      onChange={(e) => setSelectedPlatform(e.target.value)}
                      className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white theme-transition"
                    >
                      <option value="all">All Platforms</option>
                      <option value="instagram">Instagram</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="twitter">Twitter</option>
                    </select>
                    
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white theme-transition"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    
                    <input
                      type="text"
                      placeholder="Search posts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white theme-transition"
                    />
                    
                    <button
                      onClick={fetchPosts}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>

                {/* Posts Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <div key={post.id} className="glass-card rounded-2xl p-4 shadow-lg theme-transition">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getPlatformColor(post.platform_name)} text-white`}>
                          {getPlatformIcon(post.platform_name)} {post.platform_name}
                        </span>
                        <button
                          onClick={() => post.is_saved ? handleUnsavePost(post.id) : handleSavePost(post.id)}
                          className="text-2xl hover:scale-110 transition-transform"
                        >
                          {post.is_saved ? '⭐' : '☆'}
                        </button>
                      </div>
                      
                      <p className="text-gray-900 dark:text-white mb-3 line-clamp-3 theme-transition">
                        {post.content}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 theme-transition">
                        <span>❤️ {post.likes_count}</span>
                        <span>💬 {post.comments_count}</span>
                        <span>🔄 {post.shares_count}</span>
                      </div>
                      
                      {post.categories && post.categories.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {post.categories.map((cat) => (
                            <span
                              key={cat.id}
                              className="px-2 py-1 rounded-lg text-xs font-medium"
                              style={{ backgroundColor: cat.color + '20', color: cat.color }}
                            >
                              {cat.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {posts.length === 0 && !loading && (
                  <div className="text-center py-20">
                    <p className="text-gray-600 dark:text-gray-400 text-lg theme-transition">
                      No posts found. Connect your platforms to start aggregating posts.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* SAVED TAB */}
            {activeTab === 'saved' && (
              <div className="max-w-6xl mx-auto">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <div key={post.id} className="glass-card rounded-2xl p-4 shadow-lg theme-transition">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getPlatformColor(post.platform_name)} text-white`}>
                          {getPlatformIcon(post.platform_name)} {post.platform_name}
                        </span>
                        <button
                          onClick={() => handleUnsavePost(post.id)}
                          className="text-2xl hover:scale-110 transition-transform"
                        >
                          ⭐
                        </button>
                      </div>
                      
                      <p className="text-gray-900 dark:text-white mb-3 line-clamp-3 theme-transition">
                        {post.content}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 theme-transition">
                        <span>❤️ {post.likes_count}</span>
                        <span>💬 {post.comments_count}</span>
                        <span>🔄 {post.shares_count}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {posts.length === 0 && !loading && (
                  <div className="text-center py-20">
                    <p className="text-gray-600 dark:text-gray-400 text-lg theme-transition">
                      No saved posts yet. Save posts from your feed to see them here.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* CATEGORIES TAB */}
            {activeTab === 'categories' && (
              <div className="max-w-5xl mx-auto">
                <div className="glass-card rounded-2xl p-6 shadow-lg theme-transition mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white theme-transition">
                      Manage Categories
                    </h2>
                    <button
                      onClick={() => setShowCategoryModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      + New Category
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 theme-transition"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <h3 className="font-semibold text-gray-900 dark:text-white theme-transition">
                              {category.name}
                            </h3>
                          </div>
                          {!category.is_default && (
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 theme-transition">
                            {category.description}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-500 theme-transition">
                          {category.post_count} posts
                        </p>
                      </div>
                    ))}
                  </div>

                  {categories.length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-gray-600 dark:text-gray-400 theme-transition">
                        No categories yet. Create your first category to organize posts.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Category Modal */}
          {showCategoryModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="glass-card rounded-2xl p-6 max-w-md w-full theme-transition">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 theme-transition">
                  Create New Category
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 theme-transition">
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      maxLength={50}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white theme-transition"
                      placeholder="e.g., Inspiration"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 theme-transition">
                      Description (Optional)
                    </label>
                    <textarea
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white theme-transition h-20 resize-none"
                      placeholder="Brief description..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 theme-transition">
                      Color
                    </label>
                    <input
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowCategoryModal(false)}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors theme-transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCategory}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default GeneiLink
