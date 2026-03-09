import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { useAuth } from '../contexts/AuthContext'
import ThemeToggle from './ThemeToggle'
import NotificationBell from './NotificationBell'

const Header = () => {
  const { currentUser, logout, backendUser } = useAuth()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
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
          <Link to="/" ref={logoRef} className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black dark:bg-gray-100 rounded-lg flex items-center justify-center logo transition-all duration-300" tabIndex="0">
              <span className="text-white dark:text-gray-900 font-bold text-base sm:text-lg">C</span>
            </div>
            <span className="text-black dark:text-gray-100 font-bold text-lg sm:text-xl tracking-tight theme-transition">ContentGenie</span>
          </Link>
          
          <nav ref={navRef} className="hidden lg:flex space-x-6 xl:space-x-8">
            {currentUser ? (
              <>
                <Link to="/dashboard" className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium text-sm xl:text-base">
                  Dashboard
                </Link>
                <Link to="/creator" className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium text-sm xl:text-base">
                  Creator
                </Link>
                <Link to="/analytics" className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium text-sm xl:text-base">
                  Analytics
                </Link>
                <Link to="/linkogenei" className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium text-sm xl:text-base">
                  LinkoGenei
                </Link>
                <Link to="/about" className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium text-sm xl:text-base">
                  About Us
                </Link>
                <Link to="/contact" className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium text-sm xl:text-base">
                  Contact
                </Link>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/signin')} className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium text-sm xl:text-base">
                  Dashboard
                </button>
                <button onClick={() => navigate('/signin')} className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium text-sm xl:text-base">
                  Creator
                </button>
                <button onClick={() => navigate('/signin')} className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium text-sm xl:text-base">
                  Analytics
                </button>
                <Link to="/about" className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium text-sm xl:text-base">
                  About Us
                </Link>
                <Link to="/contact" className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium text-sm xl:text-base">
                  Contact
                </Link>
              </>
            )}
          </nav>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {currentUser && <NotificationBell />}
            <ThemeToggle />
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showMobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            
            {currentUser ? (
              <div className="relative hidden lg:block" ref={dropdownRef}>
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
                      to="/profile"
                      onClick={() => setShowDropdown(false)}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors theme-transition"
                    >
                      <span className="flex items-center space-x-2">
                        <span>👤</span>
                        <span>Profile</span>
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
                    
                    {backendUser?.is_admin && (
                      <Link
                        to="/admin"
                        onClick={() => setShowDropdown(false)}
                        className="block px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors theme-transition font-semibold"
                      >
                        <span className="flex items-center space-x-2">
                          <span>🛡️</span>
                          <span>Admin Panel</span>
                        </span>
                      </Link>
                    )}
                    
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
              <div className="hidden lg:flex items-center space-x-3">
                <Link to="/login" className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium px-3 py-2 text-sm btn-ripple">
                  Sign In
                </Link>
                <Link to="/signin" className="btn-primary btn-ripple text-white px-4 sm:px-5 py-2 rounded-lg font-semibold text-sm">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <nav className="flex flex-col space-y-3">
              {currentUser ? (
                <>
                  <Link 
                    to="/dashboard" 
                    onClick={() => setShowMobileMenu(false)}
                    className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium py-2"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/creator" 
                    onClick={() => setShowMobileMenu(false)}
                    className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium py-2"
                  >
                    Creator
                  </Link>
                  <Link 
                    to="/analytics" 
                    onClick={() => setShowMobileMenu(false)}
                    className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium py-2"
                  >
                    Analytics
                  </Link>
                  <Link 
                    to="/linkogenei" 
                    onClick={() => setShowMobileMenu(false)}
                    className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium py-2"
                  >
                    LinkoGenei
                  </Link>
                  <Link 
                    to="/about" 
                    onClick={() => setShowMobileMenu(false)}
                    className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium py-2"
                  >
                    About Us
                  </Link>
                  <Link 
                    to="/contact" 
                    onClick={() => setShowMobileMenu(false)}
                    className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium py-2"
                  >
                    Contact
                  </Link>
                  <Link 
                    to="/profile" 
                    onClick={() => setShowMobileMenu(false)}
                    className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium py-2"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      setShowMobileMenu(false)
                      handleLogout()
                    }}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all duration-300 font-medium py-2 text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      setShowMobileMenu(false)
                      navigate('/signin')
                    }}
                    className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium py-2 text-left"
                  >
                    Dashboard
                  </button>
                  <button 
                    onClick={() => {
                      setShowMobileMenu(false)
                      navigate('/signin')
                    }}
                    className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium py-2 text-left"
                  >
                    Creator
                  </button>
                  <button 
                    onClick={() => {
                      setShowMobileMenu(false)
                      navigate('/signin')
                    }}
                    className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium py-2 text-left"
                  >
                    Analytics
                  </button>
                  <Link 
                    to="/about" 
                    onClick={() => setShowMobileMenu(false)}
                    className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium py-2"
                  >
                    About Us
                  </Link>
                  <Link 
                    to="/contact" 
                    onClick={() => setShowMobileMenu(false)}
                    className="text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium py-2"
                  >
                    Contact
                  </Link>
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <Link 
                      to="/login" 
                      onClick={() => setShowMobileMenu(false)}
                      className="block text-black dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all duration-300 font-medium py-2"
                    >
                      Sign In
                    </Link>
                    <Link 
                      to="/signin" 
                      onClick={() => setShowMobileMenu(false)}
                      className="block btn-primary text-white px-5 py-2 rounded-lg font-semibold text-center"
                    >
                      Get Started
                    </Link>
                  </div>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header