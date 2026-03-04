import { useEffect, useState, useRef } from 'react'
import { gsap } from 'gsap'

const PageLoader = () => {
  const [isLoading, setIsLoading] = useState(true)
  const loaderRef = useRef(null)
  const cloudsRef = useRef([])
  const particlesRef = useRef([])
  const logoRef = useRef(null)
  const textRef = useRef(null)

  useEffect(() => {
    // Animate clouds
    cloudsRef.current.forEach((cloud, index) => {
      if (cloud) {
        gsap.fromTo(cloud,
          { x: -200, opacity: 0 },
          {
            x: window.innerWidth + 200,
            opacity: 0.3,
            duration: 8 + index * 2,
            repeat: -1,
            ease: 'none',
            delay: index * 1.5
          }
        )
        
        gsap.to(cloud, {
          y: '+=30',
          duration: 3 + index * 0.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        })
      }
    })

    // Animate particles
    particlesRef.current.forEach((particle, index) => {
      if (particle) {
        gsap.to(particle, {
          y: -window.innerHeight - 100,
          x: `+=${Math.random() * 100 - 50}`,
          opacity: 0,
          duration: 3 + Math.random() * 2,
          repeat: -1,
          ease: 'none',
          delay: Math.random() * 2
        })
      }
    })

    // Animate logo
    if (logoRef.current) {
      gsap.fromTo(logoRef.current,
        { scale: 0, rotation: -180, opacity: 0 },
        { scale: 1, rotation: 0, opacity: 1, duration: 1, ease: 'back.out(1.7)' }
      )
      
      gsap.to(logoRef.current, {
        y: -10,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      })
    }

    // Animate text
    if (textRef.current) {
      gsap.fromTo(textRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay: 0.5, ease: 'power3.out' }
      )
    }

    // Hide loader after page loads
    const timer = setTimeout(() => {
      if (loaderRef.current) {
        gsap.to(loaderRef.current, {
          opacity: 0,
          scale: 1.1,
          duration: 0.8,
          ease: 'power3.inOut',
          onComplete: () => setIsLoading(false)
        })
      }
    }, 2500) // Show for 2.5 seconds

    return () => clearTimeout(timer)
  }, [])

  if (!isLoading) return null

  return (
    <div
      ref={loaderRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-hidden"
    >
      {/* Animated Clouds */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={`cloud-${i}`}
            ref={el => cloudsRef.current[i] = el}
            className="absolute"
            style={{
              top: `${20 + i * 15}%`,
              left: '-200px'
            }}
          >
            <svg
              width={150 + i * 30}
              height={60 + i * 10}
              viewBox="0 0 200 80"
              fill="none"
              className="text-gray-300 dark:text-gray-700"
            >
              <ellipse cx="50" cy="50" rx="40" ry="25" fill="currentColor" opacity="0.6" />
              <ellipse cx="90" cy="45" rx="50" ry="30" fill="currentColor" opacity="0.7" />
              <ellipse cx="140" cy="50" rx="45" ry="28" fill="currentColor" opacity="0.6" />
            </svg>
          </div>
        ))}
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={`particle-${i}`}
            ref={el => particlesRef.current[i] = el}
            className="absolute w-2 h-2 bg-gradient-to-br from-indigo-400 to-purple-500 dark:from-indigo-600 dark:to-purple-700 rounded-full opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${100 + Math.random() * 20}%`,
              width: `${4 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 8}px`
            }}
          />
        ))}
      </div>

      {/* Center Content */}
      <div className="relative z-10 text-center">
        {/* Animated Logo */}
        <div ref={logoRef} className="mb-8">
          <div className="relative inline-block">
            {/* Outer glow ring */}
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
            
            {/* Logo container */}
            <div className="relative w-32 h-32 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-700 dark:via-purple-700 dark:to-pink-700 rounded-3xl flex items-center justify-center shadow-2xl">
              {/* Inner glow */}
              <div className="absolute inset-2 bg-white/10 rounded-2xl"></div>
              
              {/* Letter C */}
              <span className="relative text-6xl font-black text-white drop-shadow-2xl">
                C
              </span>
              
              {/* Rotating ring */}
              <div className="absolute inset-0 border-4 border-white/30 rounded-3xl animate-spin" style={{ animationDuration: '3s' }}></div>
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div ref={textRef}>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Content<span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Genie</span>
          </h2>
          
          {/* Loading Dots */}
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-pink-600 dark:bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">
            Loading your experience...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mt-8 w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-full animate-progress"></div>
        </div>
      </div>

      {/* Corner Decorations */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-pink-500/20 to-transparent rounded-full blur-3xl"></div>
    </div>
  )
}

export default PageLoader
