import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import ParticlesBackground from '../components/ParticlesBackground'
import FloatingEmojis from '../components/FloatingEmojis'
import Header from '../components/Header'
import Footer from '../components/Footer'
import apiService from '../services/api'

const ContentOptimizer = () => {
  const [content, setContent] = useState('')
  const [optimizedContent, setOptimizedContent] = useState('')
  const [optimizationType, setOptimizationType] = useState('seo')
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  
  const titleRef = useRef(null)
  const formRef = useRef(null)
  const resultRef = useRef(null)

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.3 })
    
    tl.fromTo(titleRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
    )
    .fromTo([formRef.current, resultRef.current],
      { y: 80, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, stagger: 0.2, ease: "back.out(1.1)" },
      "-=0.5"
    )
  }, [])

  const analyzeContent = () => {
    if (!content.trim()) return null

    const words = content.trim().split(/\s+/).length
    const sentences = content.split(/[.!?]+/).filter(s => s.trim()).length
    const avgWordsPerSentence = sentences > 0 ? (words / sentences).toFixed(1) : 0
    const readingTime = Math.ceil(words / 200) // 200 words per minute
    
    // Simple readability score (Flesch Reading Ease approximation)
    const syllables = content.split(/\s+/).reduce((count, word) => {
      return count + Math.max(1, word.length / 3)
    }, 0)
    const readabilityScore = Math.max(0, Math.min(100, 
      206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
    )).toFixed(0)

    return {
      words,
      sentences,
      avgWordsPerSentence,
      readingTime,
      readabilityScore,
      characters: content.length
    }
  }

  const handleOptimize = async () => {
    if (!content.trim()) {
      alert('⚠️ Please enter content to optimize')
      return
    }

    if (content.length < 50) {
      alert('⚠️ Content too short. Please provide at least 50 characters.')
      return
    }

    setIsOptimizing(true)
    setAnalysis(analyzeContent())

    try {
      const optimizationPrompts = {
        seo: `Optimize this content for SEO. Add relevant keywords naturally, improve headings, and make it more search-engine friendly while keeping the core message:\n\n${content}`,
        readability: `Improve the readability of this content. Make sentences clearer, shorter, and easier to understand:\n\n${content}`,
        engagement: `Make this content more engaging and compelling. Add hooks, improve flow, and make it more interesting to read:\n\n${content}`,
        grammar: `Fix grammar, spelling, and punctuation errors in this content. Improve sentence structure:\n\n${content}`
      }

      const response = await apiService.generateContent({
        prompt: optimizationPrompts[optimizationType],
        type: 'article',
        tone: 'professional',
        skip_save: true
      })

      if (response.success) {
        setOptimizedContent(response.content.content)
        
        gsap.to(resultRef.current, {
          scale: 1.02,
          duration: 0.3,
          yoyo: true,
          repeat: 1,
          ease: "power2.inOut"
        })
      }
    } catch (error) {
      console.error('Error optimizing content:', error)
      alert('❌ Failed to optimize content. Please try again.')
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(optimizedContent)
    alert('✅ Optimized content copied to clipboard!')
  }

  const getOptimizationIcon = (type) => {
    const icons = {
      seo: '🔍',
      readability: '📖',
      engagement: '🎯',
      grammar: '✍️'
    }
    return icons[type] || '✨'
  }

  return (
    <div className="min-h-screen theme-transition relative">
      <ParticlesBackground />
      <FloatingEmojis />
      
      <Header />

      <main className="pt-24 pb-12 relative z-10 content-layer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title Section */}
          <div ref={titleRef} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
              Content <span className="gradient-text">Optimizer</span>
            </h1>
            <p className="text-gray-700 dark:text-blue-200 text-lg font-normal max-w-2xl mx-auto theme-transition">
              Enhance your content with AI-powered optimization for SEO, readability, and engagement.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div ref={formRef} className="glass-card rounded-2xl p-8 theme-transition">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 theme-transition">
                Original Content
              </h2>

              {/* Optimization Type */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-3 theme-transition">
                  Optimization Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'seo', label: 'SEO Optimization', icon: '🔍' },
                    { value: 'readability', label: 'Readability', icon: '📖' },
                    { value: 'engagement', label: 'Engagement', icon: '🎯' },
                    { value: 'grammar', label: 'Grammar & Style', icon: '✍️' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setOptimizationType(type.value)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        optimizationType === type.value
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{type.icon}</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {type.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Input */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-3 theme-transition">
                  Your Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your content here to optimize..."
                  className="form-input w-full p-4 rounded-xl h-64 resize-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
                  <span>{content.length} characters</span>
                  <span>{content.trim().split(/\s+/).filter(w => w).length} words</span>
                </div>
              </div>

              {/* Content Analysis */}
              {content.length > 50 && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Quick Analysis</h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Reading Time:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                        {Math.ceil(content.trim().split(/\s+/).length / 200)} min
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Sentences:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                        {content.split(/[.!?]+/).filter(s => s.trim()).length}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Optimize Button */}
              <button
                onClick={handleOptimize}
                disabled={isOptimizing || !content.trim()}
                className="w-full btn-primary py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOptimizing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Optimizing...</span>
                  </div>
                ) : (
                  `${getOptimizationIcon(optimizationType)} Optimize Content`
                )}
              </button>
            </div>

            {/* Output Section */}
            <div ref={resultRef} className="glass-card rounded-2xl p-8 theme-transition">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 theme-transition">
                  Optimized Content
                </h2>
                {optimizedContent && (
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    📋 Copy
                  </button>
                )}
              </div>

              {!optimizedContent ? (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">✨</div>
                  <p className="text-gray-600 dark:text-gray-400 theme-transition">
                    Your optimized content will appear here
                  </p>
                </div>
              ) : (
                <div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 theme-transition h-64 overflow-y-auto mb-6">
                    <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap theme-transition">
                      {optimizedContent}
                    </p>
                  </div>

                  {/* Analysis Comparison */}
                  {analysis && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-gray-300 dark:border-blue-800">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Words</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analysis.words}</div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl border border-gray-300 dark:border-green-800">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Reading Time</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analysis.readingTime} min</div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-gray-300 dark:border-purple-800">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Readability</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analysis.readabilityScore}/100</div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-gray-300 dark:border-orange-800">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Words/Sentence</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analysis.avgWordsPerSentence}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tips Section */}
          <div className="mt-8 glass-card rounded-2xl p-8 theme-transition">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 theme-transition">
              💡 Optimization Tips
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-blue-900/20 rounded-xl border border-gray-300 dark:border-blue-800">
                <div className="text-2xl mb-2">🔍</div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">SEO</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Use relevant keywords naturally throughout your content
                </p>
              </div>
              <div className="p-4 bg-gray-100 dark:bg-green-900/20 rounded-xl border border-gray-300 dark:border-green-800">
                <div className="text-2xl mb-2">📖</div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Readability</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Keep sentences short and use simple language
                </p>
              </div>
              <div className="p-4 bg-gray-200 dark:bg-purple-900/20 rounded-xl border border-gray-300 dark:border-purple-800">
                <div className="text-2xl mb-2">🎯</div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Engagement</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Start with a hook and maintain reader interest
                </p>
              </div>
              <div className="p-4 bg-gray-300 dark:bg-orange-900/20 rounded-xl border border-gray-300 dark:border-orange-800">
                <div className="text-2xl mb-2">✍️</div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Grammar</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Ensure proper grammar and punctuation
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default ContentOptimizer
