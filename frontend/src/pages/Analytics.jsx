import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import ParticlesBackground from '../components/ParticlesBackground'
import FloatingEmojis from '../components/FloatingEmojis'
import Header from '../components/Header'
import Footer from '../components/Footer'

const Analytics = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('content')
  const titleRef = useRef(null)
  const tabsRef = useRef(null)

  useEffect(() => {
    // Determine active tab based on route
    if (location.pathname === '/social-analytics') {
      setActiveTab('social')
    } else {
      setActiveTab('content')
    }
  }, [location])

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.3 })
    
    tl.fromTo(titleRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
    )
    .fromTo(tabsRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
      "-=0.5"
    )
  }, [])

  const handleTabChange = (tab) => {
    if (tab === 'content') {
      navigate('/content-analytics')
    } else {
      navigate('/social-analytics')
    }
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
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-700 mb-4 leading-tight tracking-tight">
              <span className="gradient-text">Analytics</span> Dashboard
            </h1>
            <p className="text-gray-700 dark:text-blue-200 text-lg font-normal max-w-2xl mx-auto theme-transition">
              Track your content performance and social media analytics in one place.
            </p>
          </div>

          {/* Tab Navigation */}
          <div ref={tabsRef} className="flex justify-center mb-8">
            <div className="glass-card rounded-2xl p-1.5 inline-flex space-x-1 shadow-lg theme-transition">
              <button
                onClick={() => handleTabChange('content')}
                className={`px-8 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 ${
                  activeTab === 'content'
                    ? 'bg-gray-800 dark:bg-blue-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white theme-transition'
                }`}
              >
                <span>📊</span>
                <span>Content Analytics</span>
              </button>
              <button
                onClick={() => handleTabChange('social')}
                className={`px-8 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 ${
                  activeTab === 'social'
                    ? 'bg-gray-800 dark:bg-blue-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white theme-transition'
                }`}
              >
                <span>📱</span>
                <span>Social Analytics</span>
              </button>
            </div>
          </div>

          {/* Message to redirect */}
          <div className="text-center py-12">
            <div className="glass-card rounded-2xl p-8 max-w-2xl mx-auto">
              <div className="text-6xl mb-4">
                {activeTab === 'content' ? '📊' : '📱'}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {activeTab === 'content' ? 'Content Analytics' : 'Social Media Analytics'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {activeTab === 'content' 
                  ? 'View your content performance metrics, distribution, and top performing content.'
                  : 'Connect and analyze your social media accounts across multiple platforms.'}
              </p>
              <button
                onClick={() => handleTabChange(activeTab)}
                className="bg-gradient-to-r from-gray-800 to-gray-900 dark:from-blue-600 dark:to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                View {activeTab === 'content' ? 'Content' : 'Social'} Analytics →
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default Analytics
