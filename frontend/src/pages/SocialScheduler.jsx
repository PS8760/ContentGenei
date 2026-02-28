import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import ParticlesBackground from '../components/ParticlesBackground'
import FloatingEmojis from '../components/FloatingEmojis'
import Header from '../components/Header'
import Footer from '../components/Footer'

const SocialScheduler = () => {
  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState({
    content: '',
    platform: 'twitter',
    scheduleDate: '',
    scheduleTime: ''
  })
  
  const titleRef = useRef(null)
  const formRef = useRef(null)

  // Load posts from localStorage on mount
  useEffect(() => {
    const savedPosts = localStorage.getItem('scheduledPosts')
    if (savedPosts) {
      try {
        setPosts(JSON.parse(savedPosts))
      } catch (error) {
        console.error('Error loading scheduled posts:', error)
      }
    }
  }, [])

  // Save posts to localStorage whenever they change
  useEffect(() => {
    if (posts.length > 0) {
      localStorage.setItem('scheduledPosts', JSON.stringify(posts))
    }
  }, [posts])

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.3 })
    
    tl.fromTo(titleRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
    )
    .fromTo(formRef.current,
      { y: 80, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, ease: "back.out(1.1)" },
      "-=0.5"
    )
  }, [])

  const handleSchedulePost = () => {
    if (!newPost.content || !newPost.scheduleDate || !newPost.scheduleTime) {
      alert('⚠️ Please fill in all fields')
      return
    }

    const post = {
      id: Date.now(),
      ...newPost,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    }

    setPosts([...posts, post])
    setNewPost({
      content: '',
      platform: 'twitter',
      scheduleDate: '',
      scheduleTime: ''
    })
    
    // Show success message
    alert('✅ Post scheduled successfully! Your post will be saved even after leaving this page.')
  }

  const getPlatformIcon = (platform) => {
    const icons = {
      twitter: '🐦',
      facebook: '📘',
      instagram: '📷',
      linkedin: '💼',
      tiktok: '🎵'
    }
    return icons[platform] || '📱'
  }

  const getPlatformColor = (platform) => {
    const colors = {
      twitter: 'from-gray-700 to-gray-900 dark:from-blue-400 dark:to-blue-600',
      facebook: 'from-gray-800 to-black dark:from-blue-600 dark:to-blue-800',
      instagram: 'from-black to-gray-800 dark:from-pink-500 dark:to-purple-600',
      linkedin: 'from-gray-900 to-gray-700 dark:from-blue-700 dark:to-blue-900',
      tiktok: 'from-black to-gray-800 dark:from-black dark:to-gray-800'
    }
    return colors[platform] || 'from-gray-600 to-gray-800 dark:from-gray-500 dark:to-gray-700'
  }

  return (
    <div className="min-h-screen theme-transition relative">
      <ParticlesBackground />
      <FloatingEmojis />
      
      <Header />

      <main className="pt-24 pb-12 relative z-10 content-layer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title Section */}
          <div ref={titleRef} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
              Social Media <span className="gradient-text">Scheduler</span>
            </h1>
            <p className="text-gray-700 dark:text-blue-200 text-lg font-normal max-w-2xl mx-auto theme-transition">
              Plan, schedule, and optimize your social media content across all platforms.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Schedule New Post */}
            <div ref={formRef} className="glass-card rounded-2xl p-8 theme-transition">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 theme-transition">
                Schedule New Post
              </h2>

              <div className="space-y-6">
                {/* Platform Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-3 theme-transition">
                    Platform
                  </label>
                  <div className="grid grid-cols-5 gap-3">
                    {['twitter', 'facebook', 'instagram', 'linkedin', 'tiktok'].map((platform) => (
                      <button
                        key={platform}
                        onClick={() => setNewPost({ ...newPost, platform })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          newPost.platform === platform
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                        }`}
                      >
                        <div className="text-3xl">{getPlatformIcon(platform)}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-3 theme-transition">
                    Post Content
                  </label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="What's on your mind?"
                    className="form-input w-full p-4 rounded-xl h-32 resize-none"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 theme-transition">
                    {newPost.content.length} characters
                  </p>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-3 theme-transition">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newPost.scheduleDate}
                      onChange={(e) => setNewPost({ ...newPost, scheduleDate: e.target.value })}
                      className="form-input w-full p-3 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-3 theme-transition">
                      Time
                    </label>
                    <input
                      type="time"
                      value={newPost.scheduleTime}
                      onChange={(e) => setNewPost({ ...newPost, scheduleTime: e.target.value })}
                      className="form-input w-full p-3 rounded-xl"
                    />
                  </div>
                </div>

                {/* Schedule Button */}
                <button
                  onClick={handleSchedulePost}
                  className="w-full btn-primary py-4 rounded-xl font-semibold"
                >
                  📅 Schedule Post
                </button>
              </div>
            </div>

            {/* Scheduled Posts */}
            <div className="glass-card rounded-2xl p-8 theme-transition">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 theme-transition">
                Scheduled Posts ({posts.length})
              </h2>

              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <p className="text-gray-600 dark:text-gray-400 theme-transition">
                    No scheduled posts yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 theme-transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${getPlatformColor(post.platform)} rounded-lg flex items-center justify-center`}>
                          <span className="text-xl">{getPlatformIcon(post.platform)}</span>
                        </div>
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-xs font-semibold">
                          {post.status}
                        </span>
                      </div>
                      <p className="text-gray-900 dark:text-gray-100 mb-3 theme-transition">
                        {post.content}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 theme-transition">
                        <span>📅 {post.scheduleDate} at {post.scheduleTime}</span>
                        <button
                          onClick={() => {
                            const updatedPosts = posts.filter(p => p.id !== post.id)
                            setPosts(updatedPosts)
                            if (updatedPosts.length === 0) {
                              localStorage.removeItem('scheduledPosts')
                            }
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-700"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Calendar View */}
          <div className="mt-8 glass-card rounded-2xl p-8 theme-transition">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 theme-transition">
              Content Calendar
            </h2>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-12 text-center theme-transition border border-gray-300 dark:border-gray-600">
              <div className="text-6xl mb-4">📆</div>
              <p className="text-gray-600 dark:text-gray-400 theme-transition">
                Interactive calendar view coming soon
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default SocialScheduler
