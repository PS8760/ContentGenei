import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'

export default function InstagramCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('processing')
  const [message, setMessage] = useState('Connecting your Instagram account...')

  useEffect(() => {
    handleCallback()
  }, [])

  const handleCallback = async () => {
    try {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      // Check for errors from URL params
      if (error) {
        setStatus('error')
        setMessage(errorDescription || 'Instagram authorization failed')
        setTimeout(() => navigate('/instagram-analytics'), 3000)
        return
      }

      // Check for code
      if (!code) {
        setStatus('error')
        setMessage('No authorization code received')
        setTimeout(() => navigate('/instagram-analytics'), 3000)
        return
      }

      // Verify state
      const storedState = localStorage.getItem('instagram_oauth_state')
      if (state !== storedState) {
        setStatus('error')
        setMessage('Invalid state parameter. Please try again.')
        setTimeout(() => navigate('/instagram-analytics'), 3000)
        return
      }

      // Exchange code for token
      const response = await api.exchangeInstagramToken(code, state)

      if (response.success) {
        setStatus('success')
        setMessage('Instagram account connected successfully!')
        localStorage.removeItem('instagram_oauth_state')
        setTimeout(() => navigate('/instagram-analytics'), 2000)
      } else {
        throw new Error(response.error || 'Failed to connect account')
      }
    } catch (error) {
      console.error('Callback error:', error)
      setStatus('error')
      setMessage(error.message || 'Failed to connect Instagram account')
      setTimeout(() => navigate('/instagram-analytics'), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 max-w-md text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Connecting...
            </h2>
            <p className="text-gray-600 dark:text-gray-300">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Success!
            </h2>
            <p className="text-gray-600 dark:text-gray-300">{message}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Redirecting to analytics...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-6">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Connection Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-300">{message}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Redirecting back...
            </p>
          </>
        )}
      </div>
    </div>
  )
}
