import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProfileProvider } from './contexts/ProfileContext'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'

// Pages
import LandingPage from './pages/LandingPage'
import SignIn from './pages/SignIn'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Creator from './pages/Creator'
import Analytics from './pages/Analytics'
import ContentLibrary from './pages/ContentLibrary'
import SocialScheduler from './pages/SocialScheduler'
import ContentOptimizer from './pages/ContentOptimizer'
import TeamCollaboration from './pages/TeamCollaboration'
import AboutUs from './pages/AboutUs'
import ContactUs from './pages/ContactUs'
import LinkoGenei from './pages/LinkoGenei'
import Profile from './pages/Profile'
import Onboarding from './pages/Onboarding'

import './index.css'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ProfileProvider>
          <ThemeProvider>
            <Router>
              <AppContent />
            </Router>
          </ThemeProvider>
        </ProfileProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

// Separate component to use hooks inside Router context
function AppContent() {
  const { currentUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Hard Route Guard - Check onboarding status
  useEffect(() => {
    // Only check if user is authenticated and not on public routes
    const publicRoutes = ['/', '/signin', '/login', '/about', '/contact']
    const isPublicRoute = publicRoutes.includes(location.pathname)
    const isOnboardingRoute = location.pathname === '/onboarding'
    
    if (currentUser && !isPublicRoute && !isOnboardingRoute) {
      // Check if onboarding is complete
      const onboardingComplete = localStorage.getItem('onboarding_complete')
      
      if (onboardingComplete !== 'true') {
        console.log('Onboarding not complete, redirecting to /onboarding')
        navigate('/onboarding', { replace: true })
      }
    }
  }, [currentUser, location.pathname, navigate])

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        
        {/* Onboarding Route - Protected but doesn't require onboarding completion */}
        <Route path="/onboarding" element={
          <ProtectedRoute requireOnboarding={false}>
            <Onboarding />
          </ProtectedRoute>
        } />
        
        {/* Protected Routes - Require onboarding completion */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/creator" element={
          <ProtectedRoute>
            <Creator />
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        } />
        <Route path="/content-library" element={
          <ProtectedRoute>
            <ContentLibrary />
          </ProtectedRoute>
        } />
        <Route path="/scheduler" element={
          <ProtectedRoute>
            <SocialScheduler />
          </ProtectedRoute>
        } />
        <Route path="/optimizer" element={
          <ProtectedRoute>
            <ContentOptimizer />
          </ProtectedRoute>
        } />
        <Route path="/team" element={
          <ProtectedRoute>
            <TeamCollaboration />
          </ProtectedRoute>
        } />
        <Route path="/linkogenei" element={
          <ProtectedRoute>
            <LinkoGenei />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        
        {/* Redirect any unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App