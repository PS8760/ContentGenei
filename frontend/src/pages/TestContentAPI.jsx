import { useState } from 'react'
import apiService from '../services/api'

const TestContentAPI = () => {
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const testAPI = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('Testing API...')
      const result = await apiService.getContent({ per_page: 100 })
      console.log('API Result:', result)
      setResponse(result)
    } catch (err) {
      console.error('API Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Content API Test
        </h1>

        <button
          onClick={testAPI}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 mb-6"
        >
          {loading ? 'Testing...' : 'Test API'}
        </button>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {response && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              API Response:
            </h2>
            
            <div className="space-y-4">
              <div>
                <strong className="text-gray-700 dark:text-gray-300">Success:</strong>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {response.success ? '✅ Yes' : '❌ No'}
                </span>
              </div>

              <div>
                <strong className="text-gray-700 dark:text-gray-300">Content Array:</strong>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {Array.isArray(response.content) ? '✅ Is Array' : '❌ Not Array'}
                </span>
              </div>

              <div>
                <strong className="text-gray-700 dark:text-gray-300">Items Count:</strong>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {response.content?.length || 0}
                </span>
              </div>

              {response.pagination && (
                <div>
                  <strong className="text-gray-700 dark:text-gray-300">Pagination:</strong>
                  <pre className="mt-2 bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(response.pagination, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <strong className="text-gray-700 dark:text-gray-300">Content Items:</strong>
                {response.content && response.content.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {response.content.map((item, idx) => (
                      <div key={idx} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {idx + 1}. {item.title}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Type: {item.content_type} | Words: {item.word_count} | Status: {item.status}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 text-gray-600 dark:text-gray-400">
                    No content items found
                  </div>
                )}
              </div>

              <div>
                <strong className="text-gray-700 dark:text-gray-300">Full Response:</strong>
                <pre className="mt-2 bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-auto max-h-96">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TestContentAPI
