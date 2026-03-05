import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { useAuth } from '../contexts/AuthContext'
import { ChevronDown, User, LayoutDashboard, Sparkles, TrendingUp, LogOut } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const Navbar = () => {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const headerRef = useRef(null)
  const logoRef = useRef(null)
  const navRef = useRef(null)
  const dropdownRef = useRef(null)

  // Hide navbar on onboarding page
  if (location.pathname === '/onboarding') {
    return null
  }

  // Get user data from localStorage
  const getUserData = () => {
    const savedProfile = localStorage.getItem('user_profile')
    if (savedProfile) {
      const profile = JSON.parse(savedProfile)
      return {
        name: profile.full_name || currentUser?.displayName || 'User',
        email: currentUser?.email || 'user@example.com'
      }
    }
    return {
      name: currentUser?.displayName || 'User',
      email: currentUser?.email || 'user@example.com'
    }
  }

  const userData = currentUser ? getUserData() : { name: 'User', email: '' }
  const initials = userData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  useEffect(() => {
    if (headerRef.current && logoRef.current && navRef.current) {
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
      
      if (navRef.current.children.length > 0) {
        tl.fromTo(navRef.current.children,
          { y: -20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" },
          "-=0.4"
        )
      }
    }
  }, [currentUser])

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

  const isActive = (path) => location.pathname === path

  return (
    <header ref={headerRef} className="fixed top-0 w-full z-50 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-lg transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left Side - Logo */}
          <Link 
            to={currentUser ? "/dashboard" : "/"} 
            ref={logoRef} 
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-gray-900 dark:text-white font-bold text-xl tracking-tight transition-colors duration-300">
              ContentGenie
            </span>
          </Link>
          
          {/* Center - Navigation Links */}
          {currentUser && (
            <nav ref={navRef} className="hidden md:flex space-x-6">
              <Link 
                to="/dashboard" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/dashboard') 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              <Link 
                to="/creator" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/creator') 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Creator
              </Link>
              <Link 
                to="/analytics" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/analytics') 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Analytics
              </Link>
              <Link 
                to="/linkogenei" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/linkogenei') 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                LinkoGenie
              </Link>
              <Link 
                to="/about" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/about') 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                About Us
              </Link>
            </nav>
          )}
          
          {/* Right Side - Theme Toggle & User Profile */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* User Profile or Auth Buttons */}
            {currentUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">{initials}</span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-gray-900 dark:text-white text-sm font-medium transition-colors duration-300">
                      {userData.name}
                    </p>
                  </div>
                  <ChevronDown 
                    className={`w-4 h-4 text-gray-600 dark:text-slate-400 transition-all duration-200 ${
                      showDropdown ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 py-2 animate-fadeIn transition-colors duration-300">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                        {userData.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate transition-colors duration-300">
                        {userData.email}
                      </p>
                    </div>
                    
                    <Link
                      to="/profile"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    
                    <Link
                      to="/dashboard"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>
                    
                    <Link
                      to="/creator"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Creator</span>
                    </Link>
                    
                    <Link
                      to="/analytics"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>Analytics</span>
                    </Link>
                    
                    <div className="border-t border-gray-200 dark:border-slate-700 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        disabled={loading}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{loading ? 'Logging out...' : 'Logout'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium px-3 py-2 text-sm"
                >
                  Sign In
                </Link>
                <Link 
                  to="/signin" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-semibold text-sm transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
