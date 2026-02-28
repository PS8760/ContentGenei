import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { useAuth } from '../contexts/AuthContext'
import ThemeToggle from './ThemeToggle'

const Header = () => {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const headerRef = useRef(null)
  const logoRef = useRef(null)
  const navRef = useRef(null)
  const dropdownRef = useRef(null)

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