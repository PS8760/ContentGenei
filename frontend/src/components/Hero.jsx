import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { useAuth } from '../contexts/AuthContext'

const Hero = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const titleRef = useRef(null)
  const subtitleRef = useRef(null)
  const cardRef = useRef(null)
  const floatingRefs = useRef([])

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.6 })
    
    tl.fromTo(titleRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, ease: "power3.out" }
    )
    .fromTo(subtitleRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power2.out" },
      "-=0.7"
    )
    .fromTo(cardRef.current,
      { y: 80, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 1.2, ease: "back.out(1.1)" },
      "-=0.5"
    )

    // Animate floating elements with stagger
    floatingRefs.current.forEach((el, index) => {
      if (el) {
        gsap.fromTo(el,
          { y: 80, opacity: 0, scale: 0.8 },
          { 
            y: 0, 
            opacity: 1, 
            scale: 1,
            duration: 1, 
            delay: 1 + index * 0.2,
            ease: "back.out(1.2)"
          }
        )
      }
    })
  }, [])

  return (
    <section ref={heroRef} className="hero-gradient section-padding-lg pt-32 md:pt-40 min-h-screen flex items-center relative overflow-hidden theme-transition bg-transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 content-layer">
        <div className="mb-16">
          <h1 ref={titleRef} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-black dark:text-white mb-6 leading-tight tracking-tight">
            Create. Personalize. Distribute.
            <br />
            <span className="bg-gradient-to-r from-gray-700 via-gray-500 to-gray-400 dark:from-blue-200 dark:via-blue-300 dark:to-blue-400 bg-clip-text text-transparent block mt-2 theme-transition">Instantly.</span>
          </h1>
          
          <p ref={subtitleRef} className="text-base sm:text-lg md:text-xl text-gray-700 dark:text-blue-200 mb-12 max-w-2xl mx-auto font-normal leading-relaxed theme-transition">
            AI-powered content creation and management platform for modern creators
          </p>
        </div>
        
        {/* Main Content Card */}
        <div ref={cardRef} className="glass-card rounded-2xl md:rounded-3xl p-4 md:p-8 max-w-4xl mx-auto relative theme-transition">
          <div className="flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-8">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-black to-gray-700 dark:from-blue-600 dark:to-indigo-700 rounded-2xl md:rounded-3xl flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl md:text-2xl">✨</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-gray-900 dark:text-gray-200 text-base md:text-lg mb-6 font-normal leading-relaxed theme-transition">
                Transform your content creation workflow with intelligent AI assistance and seamless management tools.
              </p>
              <div className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl p-4 md:p-6 border border-gray-200 dark:border-gray-700 theme-transition">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base md:text-lg mb-2 sm:mb-0 theme-transition">Content Creator</h3>
                  <span className="text-xs text-black dark:text-blue-400 bg-gray-100 dark:bg-blue-900/30 px-3 py-1 rounded-full font-semibold theme-transition">
                    AI Powered
                  </span>
                </div>
                <h4 className="gradient-text font-bold mb-3 text-base md:text-lg">Top 5 Eco-Friendly Travel Destinations</h4>
                <p className="text-gray-800 dark:text-gray-300 mb-4 leading-relaxed text-sm theme-transition">
                  Exploring the world sustainably is not only good for the planet but also provides unique experiences that create lasting memories and inspire others to travel responsibly...
                </p>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                  <span className="text-xs text-gray-800 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full font-medium theme-transition">
                    Style: Informative, Inspiring
                  </span>
                  <button 
                    onClick={() => currentUser ? navigate('/creator') : navigate('/signin')}
                    className="btn-primary text-white px-4 py-2 rounded-xl font-semibold text-sm btn-ripple"
                  >
                    {currentUser ? 'Go to Creator' : 'Sign In to Generate'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Floating Elements with Emojis */}
      <div 
        ref={el => floatingRefs.current[0] = el}
        className="absolute top-32 left-8 md:left-16 w-12 h-12 md:w-14 md:h-14 bg-white/20 dark:bg-white/10 rounded-2xl flex items-center justify-center floating-element backdrop-blur-sm border border-gray-300 dark:border-white/30 theme-transition"
      >
        <span className="text-lg md:text-xl">👍</span>
      </div>
      <div 
        ref={el => floatingRefs.current[1] = el}
        className="absolute top-40 right-8 md:right-20 w-10 h-10 md:w-12 md:h-12 bg-white/20 dark:bg-white/10 rounded-2xl flex items-center justify-center floating-element backdrop-blur-sm border border-gray-300 dark:border-white/30 theme-transition"
      >
        <span className="text-base md:text-lg">❤️</span>
      </div>
      <div 
        ref={el => floatingRefs.current[2] = el}
        className="absolute bottom-32 left-12 md:left-24 w-14 h-14 md:w-16 md:h-16 bg-white/20 dark:bg-white/10 rounded-2xl flex items-center justify-center floating-element backdrop-blur-sm border border-gray-300 dark:border-white/30 theme-transition"
      >
        <span className="text-lg md:text-xl">💡</span>
      </div>
    </section>
  )
}

export default Hero