import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import ParticlesBackground from '../components/ParticlesBackground'
import FloatingEmojis from '../components/FloatingEmojis'
import Header from '../components/Header'
import Footer from '../components/Footer'

// SAFE VERSION - Won't crash even if APIs fail
const Dashboard = () => { 
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  
  const titleRef = useRef(null)
  const statsRef = useRef([])
  const cardsRef = useRef([])

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.3 })
    
    if (titleRef.current) {
      tl.fromTo(titleRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
      )
    }
    
    if (statsRef.current.length > 0) {
      tl.fromTo(statsRef.current,
        { y: 80, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 1, stagger: 0.1, ease: "back.out(1.1)" },
        "-=0.5"
      )
    }
    
    if (cardsRef.current.length > 0) {
      tl.fromTo(cardsRef.current,
        { y: 100, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 1.2, stagger: 0.15, ease: "back.out(1.1)" },
        "-=0.7"
      )
    }
  }, [])

  const stats = [
    { label: 'Content Created', value: '0', icon: '📝', color: 'from-blue-500 to-blue-600' },
    { label: 'Total Views', value: '0', icon: '👁️', color: 'from-purple-500 to-purple-600' },
    { label: 'Engagement', value: '0%', icon: '📈', color: 'from-green-500 to-green-600' },
    { label: 'Avg Read Time', value: '0s', icon: '⏱️', color: 'from-orange-500 to-orange-600' }
  ]

  const quickActions = [
    {
      title: 'AI Creator',
      icon: '✨',
      action: () => navigate('/creator'),
      color: 'from-blue-600 to-indigo-700'
    },
    {
      title: 'Library',
      icon: '📚',
      action: () => navigate('/library'),
      color: 'from-indigo-600 to-purple-700'
    },
    {
      title: 'Scheduler',
      icon: '📅',
      action: () => navigate('/scheduler'),
      color: 'from-purple-600 to-pink-700'
    },
    {
      title: 'Analytics',
      icon: '📊',
      action: () => navigate('/analytics'),
      color: 'from-pink-600 to-red-700'
    }
  ]

  return (
    <div className="min-h-screen theme-transition relative">
      <ParticlesBackground />
      <FloatingEmojis />
      
      <Header />

      <main className="pt-24 pb-12 relative z-10 content-layer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div ref={titleRef} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
              Welcome back, <span className="gradient-text">{currentUser?.displayName?.split(' ')[0] || 'Creator'}</span>
            </h1>
            <p className="text-gray-700 dark:text-blue-200 text-lg font-normal max-w-2xl mx-auto theme-transition">
              Ready to create amazing content? Let's get started!
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {stats.map((stat, index) => (
              <div
                key={index}
                ref={el => statsRef.current[index] = el}
                className="glass-card rounded-2xl p-6 theme-transition hover:scale-105 transition-transform duration-300"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1 text-center theme-transition">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center theme-transition">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <div
                  key={index}
                  ref={el => cardsRef.current[index] = el}
                  onClick={action.action}
                  className="glass-card rounded-2xl p-6 cursor-pointer feature-card group theme-transition"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${action.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform duration-300`}>
                    <span className="text-2xl">{action.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center theme-transition">
                    {action.title}
                  </h3>
                </div>
              ))}
            </div>
          </div>

          {/* Getting Started */}
          <div className="glass-card rounded-2xl p-8 theme-transition">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center theme-transition">
              🚀 Getting Started
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="text-4xl mb-3">✨</div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Create Content</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Use AI to generate articles, posts, and more
                </p>
              </div>
              <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Track Performance</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Monitor views, engagement, and analytics
                </p>
              </div>
              <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Grow Your Reach</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Schedule posts and optimize content
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default Dashboard
