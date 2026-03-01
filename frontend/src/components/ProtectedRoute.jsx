import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute = ({ children, requireOnboarding = true }) => {
  const { currentUser } = useAuth()
  
  // Check if user is authenticated
  if (!currentUser) {
    return <Navigate to="/signin" replace />
  }

  // Check onboarding completion (only if required)
  if (requireOnboarding) {
    const onboardingComplete = localStorage.getItem('onboarding_complete') === 'true'
    
    if (!onboardingComplete) {
      return <Navigate to="/onboarding" replace />
    }
  }

  return children
}

export default ProtectedRoute