import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { useTheme } from '../contexts/ThemeContext'

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme()
  const toggleRef = useRef(null)
  const sunRef = useRef(null)
  const moonRef = useRef(null)
  const sliderRef = useRef(null)

  useEffect(() => {
    const tl = gsap.timeline()
    
    if (isDark) {
      tl.to(sliderRef.current, {
        x: 28,
        duration: 0.3,
        ease: "power2.out"
      })
      .to(sunRef.current, {
        scale: 0,
        rotation: 180,
        duration: 0.2,
        ease: "power2.out"
      }, 0)
      .to(moonRef.current, {
        scale: 1,
        rotation: 0,
        duration: 0.3,
        ease: "back.out(1.7)"
      }, 0.1)
    } else {
      tl.to(sliderRef.current, {
        x: 0,
        duration: 0.3,
        ease: "power2.out"
      })
      .to(moonRef.current, {
        scale: 0,
        rotation: -180,
        duration: 0.2,
        ease: "power2.out"
      }, 0)
      .to(sunRef.current, {
        scale: 1,
        rotation: 0,
        duration: 0.3,
        ease: "back.out(1.7)"
      }, 0.1)
    }
  }, [isDark])

  const handleToggle = () => {
    // Add a nice click animation
    gsap.to(toggleRef.current, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power2.out"
    })
    
    toggleTheme()
  }

  return (
    <button
      ref={toggleRef}
      onClick={handleToggle}
      className="relative w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 group"
      aria-label="Toggle theme"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
      
      {/* Slider */}
      <div
        ref={sliderRef}
        className="relative w-6 h-6 bg-white dark:bg-gray-800 rounded-full shadow-lg transform transition-transform duration-300 flex items-center justify-center"
      >
        {/* Sun icon */}
        <div
          ref={sunRef}
          className="absolute inset-0 flex items-center justify-center text-yellow-500"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
          </svg>
        </div>
        
        {/* Moon icon */}
        <div
          ref={moonRef}
          className="absolute inset-0 flex items-center justify-center text-blue-400 scale-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" />
          </svg>
        </div>
      </div>
    </button>
  )
}

export default ThemeToggle