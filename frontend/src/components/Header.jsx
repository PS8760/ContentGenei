import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import ThemeToggle from './ThemeToggle'

const Header = () => {
  const headerRef = useRef(null)
  const logoRef = useRef(null)
  const navRef = useRef(null)

  useEffect(() => {
    const tl = gsap.timeline()
    
    tl.fromTo(headerRef.current, 
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
    )
    .fromTo(logoRef.current,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.8, ease: "power2.out" },
      "-=0.5"
    )
    .fromTo(navRef.current.children,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" },
      "-=0.4"
    )
  }, [])

  return (
    <header ref={headerRef} className="fixed top-0 w-full z-50 glass-header theme-transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div ref={logoRef} className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-900 dark:bg-gray-100 rounded-lg flex items-center justify-center logo" tabIndex="0">
              <span className="text-white dark:text-gray-900 font-bold text-lg">C</span>
            </div>
            <span className="text-gray-900 dark:text-gray-100 font-bold text-xl tracking-tight theme-transition">ContentGenie</span>
          </div>
          
          <nav ref={navRef} className="hidden md:flex space-x-8">
            <a href="#" className="text-gray-900 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-100 font-medium">
              Dashboard
            </a>
            <a href="#" className="text-gray-900 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-100 font-medium">
              Creator
            </a>
            <a href="#" className="text-gray-900 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-100 font-medium">
              Analytics
            </a>
          </nav>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button className="text-gray-900 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-100 font-medium px-3 py-2 text-sm btn-ripple">
              Sign In
            </button>
            <button className="btn-primary btn-ripple text-white px-5 py-2 rounded-lg font-semibold text-sm">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header