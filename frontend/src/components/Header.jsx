import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { useAuth } from '../contexts/AuthContext'
import ThemeToggle from './ThemeToggle'

const Header = () => {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showPlatformsDropdown, setShowPlatformsDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const headerRef = useRef(null)
  const logoRef = useRef(null)
  const navRef = useRef(null)
  const dropdownRef = useRef(null)
  const platformsDropdownRef = useRef(null)

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
      if (platformsDropdownRef.current && !platformsDropdownRef.current.contains(event.target)) {
        setShowPlatformsDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      setLoading(true)
      await logout()
      setShowDropdown(false)
      navigate('/')
    } catch (error) {
      console.error('Failed to log out:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <header ref={headerRef} className="fixed top-0 w-full z-50 glass-header theme-transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link to="/" ref={logoRef} className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-black dark:bg-gray-100 rounded-lg flex items-center justify-center logo transition-all duration-300" tabIndex="0">
              <span className="text-white dark:text-gray-900 font-bold text-lg">C</span>
            </div>
            <span className="text-black dark:text-gray-100 font-bold text-xl tracking-tight theme-transition">ContentGenie</span>
          </Link>
          
          <nav ref={navRef} className="hidden md:flex space-x-8">
            {currentUser ? (
              <>
                <Link to="/dashboard" className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium">
                  Dashboard
                </Link>
                <Link to="/creator" className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium">
                  Creator
                </Link>
                <Link to="/analytics" className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium">
                  Analytics
                </Link>
                
                {/* Platforms Dropdown */}
                <div className="relative" ref={platformsDropdownRef}>
                  <button
                    onClick={() => setShowPlatformsDropdown(!showPlatformsDropdown)}
                    className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium flex items-center space-x-1"
                  >
                    <span>Platforms</span>
                    <svg 
                      className={`w-4 h-4 transition-transform duration-200 ${showPlatformsDropdown ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showPlatformsDropdown && (
                    <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 theme-transition animate-fadeIn">
                      <Link
                        to="/instagram-analytics"
                        onClick={() => setShowPlatformsDropdown(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors theme-transition"
                      >
                        <span className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                          <span>Instagram</span>
                        </span>
                      </Link>
                      
                      <Link
                        to="/linkedin-analytics"
                        onClick={() => setShowPlatformsDropdown(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors theme-transition"
                      >
                        <span className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                          <span>LinkedIn</span>
                        </span>
                      </Link>
                    </div>
                  )}
                </div>
                
                <Link to="/linkogenei" className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium">
                  LinkoGenei
                </Link>
                <Link to="/about" className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium">
                  About Us
                </Link>
                <Link to="/contact" className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium">
                  Contact
                </Link>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/signin')} className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium">
                  Dashboard
                </button>
                <button onClick={() => navigate('/signin')} className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium">
                  Creator
                </button>
                <button onClick={() => navigate('/signin')} className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium">
                  Analytics
                </button>
                <Link to="/about" className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium">
                  About Us
                </Link>
                <Link to="/contact" className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium">
                  Contact
                </Link>
              </>
            )}
          </nav>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {currentUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-black to-gray-700 dark:from-blue-600 dark:to-indigo-700 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="text-black dark:text-gray-300 font-medium theme-transition hidden sm:block">
                    {currentUser.displayName?.split(' ')[0] || 'User'}
                  </span>
                  <svg 
                    className={`w-4 h-4 text-black dark:text-gray-300 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 theme-transition animate-fadeIn">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 theme-transition">
                        {currentUser.displayName || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate theme-transition">
                        {currentUser.email}
                      </p>
                    </div>
                    
                    <Link
                      to="/dashboard"
                      onClick={() => setShowDropdown(false)}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors theme-transition"
                    >
                      <span className="flex items-center space-x-2">
                        <span>📊</span>
                        <span>Dashboard</span>
                      </span>
                    </Link>
                    
                    <Link
                      to="/creator"
                      onClick={() => setShowDropdown(false)}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors theme-transition"
                    >
                      <span className="flex items-center space-x-2">
                        <span>✏️</span>
                        <span>Creator</span>
                      </span>
                    </Link>
                    
                    <Link
                      to="/analytics"
                      onClick={() => setShowDropdown(false)}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors theme-transition"
                    >
                      <span className="flex items-center space-x-2">
                        <span>📈</span>
                        <span>Analytics</span>
                      </span>
                    </Link>
                    
                    <Link
                      to="/instagram-analytics"
                      onClick={() => setShowDropdown(false)}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors theme-transition"
                    >
                      <span className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        <span>Instagram</span>
                      </span>
                    </Link>
                    
                    <Link
                      to="/linkedin-analytics"
                      onClick={() => setShowDropdown(false)}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors theme-transition"
                    >
                      <span className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        <span>LinkedIn</span>
                      </span>
                    </Link>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        disabled={loading}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors theme-transition disabled:opacity-50"
                      >
                        <span className="flex items-center space-x-2">
                          <span>🚪</span>
                          <span>{loading ? 'Logging out...' : 'Logout'}</span>
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium px-3 py-2 text-sm btn-ripple">
                  Sign In
                </Link>
                <Link to="/signin" className="btn-primary btn-ripple text-white px-5 py-2 rounded-lg font-semibold text-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header