import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProfileProvider } from './contexts/ProfileContext'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import PageLoader from './components/PageLoader'

// Eager load only essential pages
import LandingPage from './pages/LandingPage'
import SignIn from './pages/SignIn'
import Login from './pages/Login'

// Lazy load heavy pages
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Creator = lazy(() => import('./pages/Creator'))
const Analytics = lazy(() => import('./pages/Analytics'))
const ContentLibrary = lazy(() => import('./pages/ContentLibrary'))
const SocialScheduler = lazy(() => import('./pages/SocialScheduler'))
const ContentOptimizer = lazy(() => import('./pages/ContentOptimizer'))
const TeamCollaboration = lazy(() => import('./pages/TeamCollaboration'))
const AboutUs = lazy(() => import('./pages/AboutUs'))
const ContactUs = lazy(() => import('./pages/ContactUs'))
const LinkoGenei = lazy(() => import('./pages/LinkoGenei'))
const Profile = lazy(() => import('./pages/Profile'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))

import './index.css'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ProfileProvider>
          <ThemeProvider>
            <Router>
              <PageLoader />
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
      <Suspense fallback={<PageLoader />}>
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
          <Route path="/library" element={
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
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App