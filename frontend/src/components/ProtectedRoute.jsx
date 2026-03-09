import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PageLoader from './PageLoader'

const ProtectedRoute = ({ children, requireOnboarding = true }) => {
  const { currentUser, loading } = useAuth()
  
  // Show loading while checking authentication
  if (loading) {
    return <PageLoader />
  }
  
  if (!currentUser) {
    return <Navigate to="/signin" />
  }
  
  // If onboarding is required, check if it's complete
  if (requireOnboarding) {
    const onboardingComplete = localStorage.getItem('onboarding_complete')
    if (onboardingComplete !== 'true') {
      return <Navigate to="/onboarding" />
    }
  }
  
  return children
}

export default ProtectedRoute