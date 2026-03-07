import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import apiService from '../../services/api'
import ParticlesBackground from '../../components/ParticlesBackground'

const InstagramCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [status, setStatus] = useState('processing') // processing, success, error
  const [message, setMessage] = useState('Connecting your Instagram account...')

  useEffect(() => {
    const handleCallback = async () => {
      // Check authentication first
      if (!currentUser) {
        console.log('User not authenticated, redirecting to login...')
        // Store callback URL to return after login
        sessionStorage.setItem('instagram_callback_params', window.location.search)
        navigate('/login')
        return
      }

      try {
        // Get params from URL
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        // Handle error from Instagram
        if (error) {
          setStatus('error')
          setMessage(errorDescription || 'Instagram authorization failed')
          setTimeout(() => navigate('/dashboard'), 3000)
          return
        }

        // Validate code
        if (!code) {
          setStatus('error')
          setMessage('No authorization code received')
          setTimeout(() => navigate('/dashboard'), 3000)
          return
        }

        // Validate state
        if (!state) {
          setStatus('error')
          setMessage('No state parameter received')
          setTimeout(() => navigate('/dashboard'), 3000)
          return
        }

        // Exchange code for token (backend will validate state)
        setMessage('Exchanging authorization code...')
        const response = await apiService.exchangeInstagramToken(code, state)

        if (response.success) {
          setStatus('success')
          setMessage('Instagram connected successfully!')

          // Clean up
          sessionStorage.removeItem('instagram_callback_params')

          // Redirect to dashboard with success parameter
          setTimeout(() => navigate('/dashboard?instagram=connected'), 2000)
        } else {
          setStatus('error')
          setMessage(response.error || 'Failed to connect Instagram')
          setTimeout(() => navigate('/dashboard'), 3000)
        }
      } catch (error) {
        console.error('Instagram callback error:', error)
        console.error('Error details:', {
          message: error.message,
          response: error.response,
          stack: error.stack
        })

        setStatus('error')

        // Show specific error messages
        let errorMessage = 'An error occurred while connecting Instagram'

        if (error.response?.data) {
          console.error('Backend error response:', error.response.data)
          errorMessage = error.response.data.error || errorMessage
        } else if (error.response?.status === 400) {
          errorMessage = 'Invalid or expired authorization code'
        } else if (error.response?.status === 403) {
          errorMessage = 'Authorization failed - please try again'
        } else if (error.message) {
          errorMessage = error.message
        }

        setMessage(errorMessage)

        // Don't auto-redirect on error - let user see the error
        // setTimeout(() => navigate('/dashboard'), 3000)
      }
    }

    handleCallback()
  }, [searchParams, navigate, currentUser])

  return (
    <div className="min-h-screen theme-transition relative">
      <ParticlesBackground />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center">
          {/* Status Icon */}
          <div className="mb-6">
            {status === 'processing' && (
              <div className="w-20 h-20 mx-auto">
                <div className="loading-spinner"></div>
              </div>
            )}
            {status === 'success' && (
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto">
                <span className="text-4xl text-white">✓</span>
              </div>
            )}
            {status === 'error' && (
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto">
                <span className="text-4xl text-white">✗</span>
              </div>
            )}
          </div>

          {/* Status Message */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {status === 'processing' && 'Connecting Instagram'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Connection Failed'}
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {message}
          </p>

          {/* Progress or Action */}
          {status === 'processing' && (
            <div className="text-sm text-gray-500 dark:text-gray-500">
              Please wait...
            </div>
          )}

          {(status === 'success' || status === 'error') && (
            <div className="space-y-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary px-6 py-3 rounded-2xl w-full"
              >
                Go to Dashboard
              </button>

              {status === 'error' && (
                <button
                  onClick={() => window.location.href = '/onboarding'}
                  className="btn-secondary px-6 py-3 rounded-2xl w-full"
                >
                  Try Again
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InstagramCallback
