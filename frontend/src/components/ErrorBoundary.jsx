import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
          <div className="glass-card rounded-2xl p-8 max-w-md mx-4 text-center">
            <div className="text-6xl mb-4">🚨</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              There was an error loading the application. This might be due to Firebase configuration.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary text-white px-6 py-3 rounded-xl font-semibold"
            >
              Reload Page
            </button>
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Check the console for more details
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary