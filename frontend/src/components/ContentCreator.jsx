import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAuth } from '../contexts/AuthContext'

gsap.registerPlugin(ScrollTrigger)

const ContentCreator = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [contentType, setContentType] = useState('article')
  const [prompt, setPrompt] = useState('')
  const [tone, setTone] = useState('professional')
  const [generatedContent, setGeneratedContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const sectionRef = useRef(null)
  const titleRef = useRef(null)
  const formRef = useRef(null)
  const resultRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(titleRef.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          }
        }
      )

      gsap.fromTo([formRef.current, resultRef.current],
        { y: 60, opacity: 0, scale: 0.98 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1.2,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
          }
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const handleGenerate = async () => {
    // Redirect to sign in if not authenticated
    if (!currentUser) {
      navigate('/signin')
      return
    }

    setIsLoading(true)
    
    // Enhanced loading animation
    gsap.to(resultRef.current, {
      scale: 0.99,
      opacity: 0.9,
      duration: 0.3,
      ease: "power2.out"
    })

    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: contentType,
          prompt,
          tone,
        }),
      })
      
      const data = await response.json()
      if (data.success) {
        setGeneratedContent(data.content)
        
        // Enhanced content appearance animation
        gsap.to(resultRef.current, {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          ease: "back.out(1.1)"
        })
      }
    } catch (error) {
      console.error('Error generating content:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section ref={sectionRef} className="section-gradient section-padding theme-transition bg-transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 content-layer">
        <div ref={titleRef} className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-gray-100 mb-6 leading-tight tracking-tight theme-transition">
            Effortlessly Create, Manage, and 
            <span className="gradient-text block mt-2"> Personalize Digital Content</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-900 dark:text-gray-300 font-normal max-w-2xl mx-auto leading-relaxed theme-transition">
            with the Power of AI
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Content Creator Form */}
          <div ref={formRef} className="glass-card rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10 theme-transition relative">
            {!currentUser && (
              <div className="absolute inset-0 bg-gray-900/10 dark:bg-gray-900/30 backdrop-blur-[2px] rounded-2xl md:rounded-3xl z-10 flex items-center justify-center theme-transition">
                <div className="text-center p-6">
                  <div className="text-5xl mb-4">🔒</div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2 theme-transition">
                    Sign In Required
                  </h4>
                  <p className="text-gray-800 dark:text-gray-300 mb-4 theme-transition">
                    Create an account to start generating content
                  </p>
                  <button
                    onClick={() => navigate('/signin')}
                    className="btn-primary text-white px-6 py-3 rounded-xl font-semibold btn-ripple"
                  >
                    Sign In Now
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">✏️</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 theme-transition">AI Content Creator</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-3 theme-transition">
                  Content Type
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="form-input w-full p-4 rounded-xl transition-all duration-200"
                >
                  <option value="article">Article</option>
                  <option value="social-post">Social Media Post</option>
                  <option value="email">Email</option>
                  <option value="blog">Blog Post</option>
                  <option value="caption">Caption</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-3 theme-transition">
                  Content Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what content you want to create..."
                  className="form-input w-full p-4 rounded-xl h-32 resize-none placeholder-gray-800 dark:placeholder-gray-400 theme-transition"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-3 theme-transition">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="form-input w-full p-4 rounded-xl transition-all duration-200"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="friendly">Friendly</option>
                  <option value="formal">Formal</option>
                  <option value="creative">Creative</option>
                </select>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!prompt || isLoading}
                className="w-full btn-primary btn-ripple text-white py-4 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full loading-spinner"></div>
                    <span>Generating...</span>
                  </div>
                ) : currentUser ? (
                  'Generate Content'
                ) : (
                  '🔒 Sign In to Generate'
                )}
              </button>
            </div>
          </div>

          {/* Generated Content Display */}
          <div ref={resultRef} className="glass-card rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10 theme-transition relative">
            {!currentUser && (
              <div className="absolute inset-0 bg-gray-900/10 dark:bg-gray-900/30 backdrop-blur-[2px] rounded-2xl md:rounded-3xl z-10 flex items-center justify-center theme-transition">
                <div className="text-center p-6">
                  <div className="text-5xl mb-4">🔒</div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2 theme-transition">
                    Sign In Required
                  </h4>
                  <p className="text-gray-800 dark:text-gray-300 mb-4 theme-transition">
                    View and manage your generated content
                  </p>
                  <button
                    onClick={() => navigate('/signin')}
                    className="btn-primary text-white px-6 py-3 rounded-xl font-semibold btn-ripple"
                  >
                    Sign In Now
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">📄</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 theme-transition">Generated Content</h3>
            </div>
            
            {generatedContent ? (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 theme-transition">
                  <p className="text-gray-900 dark:text-gray-200 whitespace-pre-wrap leading-relaxed theme-transition">{generatedContent}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => !currentUser && navigate('/signin')}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl transition-all duration-75 font-semibold text-sm btn-ripple"
                  >
                    Copy
                  </button>
                  <button 
                    onClick={() => !currentUser && navigate('/signin')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl transition-all duration-75 font-semibold text-sm btn-ripple"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => !currentUser && navigate('/signin')}
                    className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-xl transition-all duration-75 font-semibold text-sm btn-ripple"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6 theme-transition">
                  <span className="text-3xl">✨</span>
                </div>
                <p className="text-gray-800 dark:text-gray-400 text-lg font-normal theme-transition">Your generated content will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ContentCreator