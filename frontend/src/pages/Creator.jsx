import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { gsap } from 'gsap'
import ParticlesBackground from '../components/ParticlesBackground'
import FloatingEmojis from '../components/FloatingEmojis'
import Header from '../components/Header'
import Footer from '../components/Footer'
import apiService from '../services/api'

const Creator = () => {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [contentType, setContentType] = useState('article')
  const [prompt, setPrompt] = useState('')
  const [tone, setTone] = useState('professional')
  const [generatedContent, setGeneratedContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('generate')
  
  // Chat Assistant state
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = useRef(null)
  const chatContainerRef = useRef(null)
  
  // Summarize state
  const [uploadedFile, setUploadedFile] = useState(null)
  const [summarizeText, setSummarizeText] = useState('')
  const [summarizedContent, setSummarizedContent] = useState('')
  const [fileType, setFileType] = useState(null)
  
  // Improve state
  const [improvements, setImprovements] = useState([])
  const [loadingImprovements, setLoadingImprovements] = useState(false)
  
  // Usage stats state
  const [usageStats, setUsageStats] = useState({
    current_count: 0,
    monthly_limit: 500,
    percentage_used: 0
  })
  
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
      { y: 80, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 1.2, stagger: 0.2, ease: "back.out(1.1)" },
      "-=0.5"
    )
  }, [])

  // Scroll to bottom of chat smoothly without causing layout shift
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current
      // Use requestAnimationFrame to ensure smooth scroll after render
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight
      })
    }
  }, [chatMessages])

  // Fetch improvements when Improve tab is activated
  useEffect(() => {
    if (activeTab === 'improve' && improvements.length === 0) {
      fetchImprovements()
    }
  }, [activeTab])

  // Fetch usage stats on mount
  useEffect(() => {
    const fetchUsageStats = async () => {
      try {
        const response = await apiService.getProfile()
        if (response.success && response.user) {
          setUsageStats({
            current_count: response.user.content_generated_count || 0,
            monthly_limit: response.user.monthly_content_limit || 500,
            percentage_used: Math.round((response.user.content_generated_count / response.user.monthly_content_limit) * 100)
          })
        }
      } catch (error) {
        console.error('Error fetching usage stats:', error)
      }
    }
    
    if (currentUser) {
      fetchUsageStats()
    }
  }, [currentUser])

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setGeneratedContent('⚠️ Please enter a prompt to generate content.')
      return
    }

    // Validation: Prompt length
    if (prompt.length < 10) {
      setGeneratedContent('⚠️ Prompt too short. Please provide at least 10 characters for better results.')
      return
    }

    if (prompt.length > 5000) {
      setGeneratedContent('⚠️ Prompt too long. Please limit to 5000 characters.')
      return
    }

    // Validation: Check for inappropriate requests
    const inappropriatePatterns = [
      /\b(illegal|harmful|violence|explicit|adult)\b/i,
      /\b(hack|crack|pirate|steal)\b/i
    ]
    
    for (const pattern of inappropriatePatterns) {
      if (pattern.test(prompt)) {
        setGeneratedContent('⚠️ I cannot assist with that request. I\'m designed to help with professional content creation only. Please provide a different prompt focused on legitimate content needs.')
        return
      }
    }

    setIsGenerating(true)
    setGeneratedContent('')
    
    gsap.to(resultRef.current, {
      scale: 0.99,
      opacity: 0.9,
      duration: 0.3,
      ease: "power2.out"
    })

    try {
      const data = await apiService.generateContent({
        prompt: prompt,
        type: contentType,
        tone: tone,
        skip_save: false  // Explicitly set to false for Generate tab
      })
      
      if (data.success) {
        // Add disclaimer for AI-generated content
        const contentWithDisclaimer = data.content.content + '\n\n---\n💡 AI-Generated Content: Please review and edit as needed before publishing.'
        setGeneratedContent(contentWithDisclaimer)
        
        // Update usage stats
        setUsageStats(prev => ({
          ...prev,
          current_count: prev.current_count + 1,
          percentage_used: Math.round(((prev.current_count + 1) / prev.monthly_limit) * 100)
        }))
        
        gsap.to(resultRef.current, {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          ease: "back.out(1.1)"
        })
      } else {
        throw new Error(data.error || 'Content generation failed')
      }
    } catch (error) {
      console.error('Error generating content:', error)
      const errorMessage = error.message || 'Failed to generate content'
      
      // Check if it's a limit error
      if (errorMessage.includes('Monthly content limit reached') || errorMessage.includes('limit reached')) {
        setGeneratedContent(`❌ Error: Monthly content limit reached\n\nYou've reached your monthly content generation limit. Your generated content is automatically saved to Analytics.\n\nTo continue:\n• Wait for your limit to reset next month\n• Upgrade to premium for unlimited content\n\nNote: Chat, Summarize, and Improve tabs don't count toward your limit!`)
      } else {
        setGeneratedContent(`❌ Error: ${errorMessage}\n\nPlease check if the backend server is running and try again.`)
      }
      
      gsap.to(resultRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.3
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!generatedContent) return
    
    try {
      await navigator.clipboard.writeText(generatedContent)
      const button = document.activeElement
      const originalText = button.textContent
      button.textContent = '✓ Copied!'
      button.classList.add('bg-green-600')
      
      setTimeout(() => {
        button.textContent = originalText
        button.classList.remove('bg-green-600')
      }, 2000)
    } catch (error) {
      console.error('Error copying content:', error)
      alert('Failed to copy content')
    }
  }

  const handleSave = async () => {
    if (!generatedContent) return
    
    try {
      setLoading(true)
      
      // Note: Content is already saved to database when generated
      // This button just confirms and shows success message
      alert('✅ Content saved successfully! You can view and manage it in the Analytics page.')
      
    } catch (error) {
      console.error('Error saving content:', error)
      alert('❌ Failed to save content: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    if (!generatedContent) return
    
    const contentElement = document.querySelector('.generated-content-text')
    if (contentElement) {
      contentElement.contentEditable = true
      contentElement.focus()
      contentElement.classList.add('border-2', 'border-blue-500')
      
      contentElement.addEventListener('blur', () => {
        setGeneratedContent(contentElement.textContent)
        contentElement.contentEditable = false
        contentElement.classList.remove('border-2', 'border-blue-500')
      }, { once: true })
    }
  }

  const handleChatSend = async () => {
    if (!chatInput.trim()) return
    
    // Validation: Check message length
    if (chatInput.length < 3) {
      alert('⚠️ Message too short. Please provide at least 3 characters.')
      return
    }
    
    if (chatInput.length > 4000) {
      alert('⚠️ Message too long. Please limit to 4000 characters.')
      return
    }
    
    // Validation: Check for inappropriate content
    const inappropriatePatterns = [
      /\b(hate|violence|harm|illegal|explicit)\b/i,
      /\b(personal\s+info|credit\s+card|password)\b/i
    ]
    
    for (const pattern of inappropriatePatterns) {
      if (pattern.test(chatInput)) {
        const warningMessage = { 
          role: 'assistant', 
          content: '⚠️ I cannot assist with that request. I\'m designed to help with content creation, writing, and creative tasks only. Please keep our conversation professional and focused on content-related topics.' 
        }
        setChatMessages(prev => [...prev, warningMessage])
        setChatInput('')
        return
      }
    }
    
    // Validation: Rate limiting (max 50 messages per session - increased from 20)
    if (chatMessages.length >= 100) { // 50 exchanges = 100 messages
      const limitMessage = { 
        role: 'assistant', 
        content: '⚠️ Chat session limit reached. Please refresh the page to start a new conversation. This helps ensure quality responses and fair usage.' 
      }
      setChatMessages(prev => [...prev, limitMessage])
      return
    }
    
    const userMessage = { role: 'user', content: chatInput }
    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsGenerating(true)
    
    try {
      // Build conversation context with history
      let contextualPrompt = ''
      
      // Check if this is a greeting
      const greetings = ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening', 'sup', 'yo', 'howdy', 'what\'s up', 'whats up']
      const isGreeting = greetings.some(greeting => 
        chatInput.toLowerCase().trim().startsWith(greeting) || 
        chatInput.toLowerCase().trim() === greeting
      )
      
      if (isGreeting && chatMessages.length === 0) {
        // First message greeting - respond like a friendly buddy
        contextualPrompt = `Your friend just said: "${chatInput}"

This is your first message to them! Respond super casually and warmly like you're texting a close friend. Say hi back, introduce yourself as Alex, their AI content buddy, and ask what they're working on today. Keep it SHORT (2-3 sentences max), friendly, and use 1-2 emojis naturally. Sound excited to help them!

Example vibe: "Hey! 👋 I'm Alex, your AI content buddy - I love helping with writing, brainstorming ideas, and making content awesome. What're you working on today?"`
      } else if (chatMessages.length > 0) {
        // Include conversation history for context
        const recentHistory = chatMessages.slice(-6).map(msg => 
          `${msg.role === 'user' ? 'Friend' : 'You'}: ${msg.content}`
        ).join('\n')
        
        contextualPrompt = `You're texting with a friend about content and writing. Here's your recent chat:

${recentHistory}

Friend: ${chatInput}

Respond naturally like you're texting! Keep it SHORT (2-4 sentences) unless they specifically ask for detailed help. Use contractions (you're, let's, I'd), be encouraging, and match their energy. If they're excited, be excited! If they need help, jump in with specific advice. Sound human and friendly, not like a formal assistant.`
      } else {
        // First message but not a greeting
        contextualPrompt = `Your friend just messaged: "${chatInput}"

This is your first response! If it's about content/writing, jump right in with helpful, specific advice. If it's something else, answer briefly and ask what they're working on. Keep it casual and SHORT (2-4 sentences). Sound like a helpful friend texting back, not a formal assistant.`
      }
      
      const response = await apiService.generateContent({
        prompt: contextualPrompt,
        type: 'chat',
        tone: 'conversational',
        skip_save: true  // Explicitly set - chat messages should never be saved
      })
      
      if (response.success) {
        const aiMessage = { role: 'assistant', content: response.content.content }
        setChatMessages(prev => [...prev, aiMessage])
      }
    } catch (error) {
      console.error('Error in chat:', error)
      const errorMessage = { 
        role: 'assistant', 
        content: 'Oops, something went wrong on my end 😅 Mind trying that again?' 
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    // Validation: File size limit (10MB - increased from 5MB)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
      alert('⚠️ File too large. Please upload a file smaller than 10MB.')
      event.target.value = '' // Reset input
      return
    }
    
    // Validation: File type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'text/plain', 'text/csv', 'text/html',
      'application/pdf'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      alert('⚠️ Unsupported file type. Please upload: Images (JPEG, PNG, GIF, WebP), Text files, or PDFs.')
      event.target.value = '' // Reset input
      return
    }
    
    setUploadedFile(file)
    setFileType(file.type)
    setIsGenerating(true) // Show loading for OCR
    
    if (file.type.startsWith('image/')) {
      try {
        // Convert image to base64
        const reader = new FileReader()
        reader.onload = async (e) => {
          const base64Image = e.target.result
          
          try {
            // Extract text from image using OCR
            const ocrResponse = await apiService.extractTextFromImage(base64Image)
            
            if (ocrResponse.success && ocrResponse.text && ocrResponse.text.trim().length > 0) {
              setSummarizeText(ocrResponse.text)
              alert(`✅ Text extracted from image!\n\nConfidence: ${ocrResponse.confidence}%\nWords found: ${ocrResponse.word_count}\n\nThe extracted text has been pasted in the text area. You can now summarize it.`)
            } else {
              // Clear the file input and uploaded file state
              event.target.value = ''
              setUploadedFile(null)
              setSummarizeText('')
              alert('❌ Text extraction failed. The image may not contain readable text or the text quality is too low.\n\nPlease try:\n- A clearer image with better contrast\n- Higher resolution image\n- Better lighting\n- Or paste text manually in the text area below')
            }
          } catch (ocrError) {
            console.error('OCR error:', ocrError)
            // Clear the file input and uploaded file state
            event.target.value = ''
            setUploadedFile(null)
            setSummarizeText('')
            alert('❌ Failed to extract text from image. Please paste text manually in the text area below.')
          } finally {
            setIsGenerating(false)
          }
        }
        reader.readAsDataURL(file)
      } catch (error) {
        console.error('File read error:', error)
        setSummarizeText(`[Image File: ${file.name}]\nError reading file.`)
        setIsGenerating(false)
      }
    } else if (file.type === 'application/pdf') {
      setSummarizeText(`[PDF File: ${file.name}]\nNote: PDF text extraction is limited. For best results, please copy and paste the text directly.`)
      setIsGenerating(false)
    } else if (file.type.startsWith('text/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target.result
        
        // Validation: Text length
        if (text.length > 20000) {
          setSummarizeText(text.substring(0, 20000) + '\n\n[Text truncated to 20,000 characters for processing]')
          alert('⚠️ Text file is very large. Only the first 20,000 characters will be processed.')
        } else {
          setSummarizeText(text)
        }
        setIsGenerating(false)
      }
      reader.readAsText(file)
    }
  }

  const handleSummarizeFile = async () => {
    if (!uploadedFile && !summarizeText.trim()) {
      alert('⚠️ Please upload a file or paste text to summarize.')
      return
    }
    
    // Check if text extraction failed (error message in textarea)
    if (summarizeText.includes('❌ Text extraction failed') || summarizeText.includes('⚠️ Could not extract text')) {
      alert('⚠️ Cannot summarize - text extraction failed. Please paste text manually or try a different image.')
      return
    }
    
    // Validation: Text length for pasted content
    if (!uploadedFile && summarizeText.trim().length < 50) {
      alert('⚠️ Text too short to summarize. Please provide at least 50 characters.')
      return
    }
    
    if (summarizeText.length > 20000) {
      alert('⚠️ Text too long. Please limit to 20,000 characters for optimal results.')
      return
    }
    
    // Validation: Check for sensitive content patterns
    const sensitivePatterns = [
      /\b(password|credit\s*card|ssn|social\s*security)\b/i,
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/ // Credit card pattern
    ]
    
    for (const pattern of sensitivePatterns) {
      if (pattern.test(summarizeText)) {
        alert('⚠️ Your text appears to contain sensitive information (passwords, credit cards, etc.). Please remove any personal or sensitive data before summarizing.')
        return
      }
    }
    
    setIsGenerating(true)
    setSummarizedContent('') // Clear previous summary
    
    try {
      let promptText = summarizeText
      
      if (uploadedFile) {
        promptText = `Summarize this ${fileType} content creatively and professionally. Focus on key points and main ideas:\n\n${summarizeText}`
      }
      
      const response = await apiService.generateContent({
        prompt: `Provide a creative, professional, and insightful summary. Focus on main ideas, key points, and actionable insights. Keep it concise and valuable:\n\n${promptText}`,
        type: 'article',
        tone: 'creative',
        max_tokens: 12000,  // Increased from 6000 to 12000 for more comprehensive summaries
        skip_save: true  // Don't save to database or count toward usage limits
      })
      
      if (response.success) {
        // Add disclaimer to summary
        const summaryWithDisclaimer = response.content.content + '\n\n---\n💡 Note: This is an AI-generated summary. Please verify important details from the original source.'
        setSummarizedContent(summaryWithDisclaimer)
      } else {
        throw new Error(response.error || 'Summarization failed')
      }
    } catch (error) {
      console.error('Error summarizing:', error)
      const errorMessage = error.message || 'Unknown error'
      
      // Check if it's a limit error
      if (errorMessage.includes('Monthly content limit reached') || errorMessage.includes('limit reached')) {
        alert('❌ This shouldn\'t happen! Summaries should not count toward your limit. Please refresh the page and try again.')
      } else {
        alert(`❌ Failed to summarize content: ${errorMessage}\n\nThis could be due to:\n- Network connectivity issues\n- API rate limits\n- Content restrictions\n\nPlease try again in a moment.`)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const fetchImprovements = async () => {
    if (!currentUser) return
    
    setLoadingImprovements(true)
    try {
      const contentResponse = await apiService.getContent({ per_page: 10 })
      const analyticsResponse = await apiService.getAnalyticsOverview(30)
      
      if (contentResponse.success && analyticsResponse.success) {
        const contentHistory = contentResponse.content || []
        const analytics = analyticsResponse.overview || {}
        
        const analysisPrompt = `Based on this content creation history:
- Total content created: ${analytics.total_content || 0}
- Average engagement: ${analytics.avg_engagement_rate || 0}%
- Content types: ${contentHistory.map(c => c.content_type).join(', ')}

Provide 5 specific, actionable suggestions to improve content creation and grow as a creator.`
        
        const response = await apiService.generateContent({
          prompt: analysisPrompt,
          type: 'article',
          tone: 'professional',
          skip_save: true  // Don't save to database or count toward usage limits
        })
        
        if (response.success) {
          const suggestions = response.content.content.split('\n').filter(line => line.trim())
          setImprovements(suggestions.slice(0, 5))
        }
      }
    } catch (error) {
      console.error('Error fetching improvements:', error)
    } finally {
      setLoadingImprovements(false)
    }
  }

  return (
    <div className="min-h-screen theme-transition relative">
      <ParticlesBackground />
      <FloatingEmojis />
      
      <Header />

      <main className="pt-24 pb-12 relative z-10 content-layer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={titleRef} className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
              AI <span className="gradient-text">Content Creator</span>
            </h1>
            <p className="text-gray-700 dark:text-blue-200 text-lg font-normal max-w-2xl mx-auto theme-transition">
              Generate, chat, summarize, and improve your content with AI-powered tools.
            </p>
          </div>

          {/* Usage Stats Widget */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="glass-card rounded-xl p-4 theme-transition">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📊</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Monthly Usage</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {usageStats.current_count} / {usageStats.monthly_limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    usageStats.percentage_used >= 90 ? 'bg-red-500' :
                    usageStats.percentage_used >= 70 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(usageStats.percentage_used, 100)}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>{usageStats.percentage_used}% used</span>
                <span className="flex items-center space-x-1">
                  <span>💡</span>
                  <span>Chat & Summarize don't count!</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center mb-8">
            <div className="glass-card rounded-2xl p-2 inline-flex space-x-2 theme-transition">
              <button
                onClick={() => setActiveTab('generate')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'generate'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                ✨ Generate
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'chat'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                💬 Chat Assistant
              </button>
              <button
                onClick={() => setActiveTab('summarize')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'summarize'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                📄 Summarize
              </button>
              <button
                onClick={() => setActiveTab('improve')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'improve'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                🎯 Improve
              </button>
            </div>
          </div>

          {/* GENERATE TAB */}
          {activeTab === 'generate' && (
            <div className="grid lg:grid-cols-2 gap-12">
              <div ref={formRef} className="glass-card rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10 theme-transition">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">✏️</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 theme-transition">AI Content Creator</h3>
                </div>

                {/* Usage Guidelines */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 mb-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start space-x-2">
                    <span className="text-lg">💡</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 dark:text-gray-200 font-semibold mb-1">Content Guidelines:</p>
                      <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                        <li>• Prompt length: 10-5000 characters for best results</li>
                        <li>• Focus on professional, legitimate content creation</li>
                        <li>• AI-generated content requires human review before publishing</li>
                        <li>• No illegal, harmful, or explicit content requests</li>
                        <li>• ✅ Generated content is automatically saved to Analytics</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-3 theme-transition">
                      Content Type
                    </label>
                    <select
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value)}
                      className="form-input w-full p-4 rounded-xl transition-all duration-200 text-gray-900 dark:text-gray-100"
                    >
                      <option value="article">Article</option>
                      <option value="social-post">Social Media Post</option>
                      <option value="email">Email</option>
                      <option value="blog">Blog Post</option>
                      <option value="caption">Caption</option>
                      <option value="script">Video Script</option>
                      <option value="ad-copy">Ad Copy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-3 theme-transition">
                      Content Prompt (10-3000 chars)
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe what content you want to create..."
                      maxLength={5000}
                      className="form-input w-full p-4 rounded-xl h-32 resize-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 theme-transition"
                    />
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
                      <span>Characters: {prompt.length}/5000</span>
                      {prompt.length > 4500 && (
                        <span className="text-orange-600 dark:text-orange-400">⚠️ Approaching limit</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-3 theme-transition">
                      Tone & Style
                    </label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="form-input w-full p-4 rounded-xl transition-all duration-200 text-gray-900 dark:text-gray-100"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="friendly">Friendly</option>
                      <option value="formal">Formal</option>
                      <option value="creative">Creative</option>
                      <option value="persuasive">Persuasive</option>
                      <option value="informative">Informative</option>
                      <option value="conversational">Conversational</option>
                    </select>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={!prompt || isGenerating}
                    className="w-full btn-primary btn-ripple text-white py-4 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isGenerating ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full loading-spinner"></div>
                        <span>Generating...</span>
                      </div>
                    ) : (
                      'Generate Content'
                    )}
                  </button>
                </div>
              </div>

              <div ref={resultRef} className="glass-card rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10 theme-transition">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">📄</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 theme-transition">Generated Content</h3>
                </div>
                
                {generatedContent ? (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 theme-transition max-h-96 overflow-y-auto">
                      <pre className="generated-content-text text-gray-900 dark:text-gray-200 whitespace-pre-wrap leading-relaxed theme-transition font-sans text-sm">
                        {generatedContent}
                      </pre>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <button 
                        onClick={handleCopy}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl transition-all duration-75 font-semibold text-sm btn-ripple"
                      >
                        Copy
                      </button>
                      <button 
                        onClick={handleEdit}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl transition-all duration-75 font-semibold text-sm btn-ripple"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-xl transition-all duration-75 font-semibold text-sm btn-ripple disabled:opacity-50"
                      >
                        Regenerate
                      </button>
                      <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-xl transition-all duration-75 font-semibold text-sm btn-ripple disabled:opacity-50"
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
                    <p className="text-gray-800 dark:text-gray-400 text-lg font-normal theme-transition">
                      Your generated content will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CHAT ASSISTANT TAB */}
          {activeTab === 'chat' && (
            <div className="max-w-5xl mx-auto">
              <div ref={formRef} className="glass-card rounded-2xl md:rounded-3xl p-6 md:p-8 theme-transition">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-teal-700 rounded-xl flex items-center justify-center">
                      <span className="text-white text-xl">💬</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 theme-transition">Alex - Chat Assistant</h3>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {chatMessages.length}/100 messages
                  </div>
                </div>

                {/* Usage Guidelines */}
                <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl p-4 mb-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-start space-x-2">
                    <span className="text-lg">ℹ️</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 dark:text-gray-200 font-semibold mb-1">Usage Guidelines:</p>
                      <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                        <li>• Focus on content creation, writing, and creative tasks</li>
                        <li>• Messages: 3-4000 characters | Session limit: 50 exchanges</li>
                        <li>• No personal info, illegal content, or harmful requests</li>
                        <li>• AI responses are suggestions - always review before use</li>
                        <li>• ℹ️ Chat conversations are not saved to Analytics</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div 
                  ref={chatContainerRef}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 theme-transition h-96 overflow-y-auto mb-4 scroll-smooth"
                >
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900 dark:to-teal-900 rounded-2xl flex items-center justify-center mx-auto mb-6 theme-transition">
                        <span className="text-3xl">💬</span>
                      </div>
                      <p className="text-gray-800 dark:text-gray-400 text-lg font-normal mb-2 theme-transition">
                        Hey! I'm <span className="font-bold text-green-600 dark:text-green-400">Alex</span>, your content buddy 👋
                      </p>
                      <p className="text-gray-600 dark:text-gray-500 text-sm mb-4 theme-transition">
                        Let's chat about your writing!
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <button
                          onClick={() => setChatInput('Hey Alex! Can you help me write a blog post?')}
                          className="px-4 py-2 bg-green-100 dark:bg-green-900 text-gray-900 dark:text-gray-100 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-800 transition-all"
                        >
                          Help with blog post
                        </button>
                        <button
                          onClick={() => setChatInput('I need some content ideas!')}
                          className="px-4 py-2 bg-teal-100 dark:bg-teal-900 text-gray-900 dark:text-gray-100 rounded-lg text-sm hover:bg-teal-200 dark:hover:bg-teal-800 transition-all"
                        >
                          Need ideas
                        </button>
                        <button
                          onClick={() => setChatInput('How can I make my writing better?')}
                          className="px-4 py-2 bg-green-100 dark:bg-green-900 text-gray-900 dark:text-gray-100 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-800 transition-all"
                        >
                          Improve my writing
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 min-h-full">
                      {chatMessages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className="flex items-start space-x-2 max-w-[80%]">
                            {message.role === 'assistant' && (
                              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-bold">A</span>
                              </div>
                            )}
                            <div className="flex-1">
                              {message.role === 'assistant' && (
                                <div className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1 ml-1">
                                  Alex
                                </div>
                              )}
                              <div
                                className={`p-4 rounded-2xl ${
                                  message.role === 'user'
                                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-600 dark:to-indigo-700 text-gray-900 dark:text-white border border-blue-200 dark:border-transparent'
                                    : 'bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-600 dark:to-teal-700 text-gray-900 dark:text-white border border-green-200 dark:border-transparent'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              </div>
                            </div>
                            {message.role === 'user' && (
                              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">You</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} className="h-0" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Message length: {chatInput.length}/4000</span>
                    {chatInput.length > 3600 && (
                      <span className="text-orange-600 dark:text-orange-400">⚠️ Approaching limit</span>
                    )}
                  </div>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                      placeholder="Type your message..."
                      maxLength={4000}
                      className="form-input flex-1 p-4 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <button
                      onClick={handleChatSend}
                      disabled={!chatInput.trim() || isGenerating || chatMessages.length >= 100}
                      className="bg-gradient-to-br from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800 text-white py-4 px-8 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-ripple"
                    >
                      {isGenerating ? '...' : 'Send'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUMMARIZE TAB */}
          {activeTab === 'summarize' && (
            <div className="grid lg:grid-cols-2 gap-12">
              <div ref={formRef} className="glass-card rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10 theme-transition">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-700 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">📄</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 theme-transition">Summarize Content</h3>
                </div>

                {/* Usage Guidelines */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 mb-6 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-start space-x-2">
                    <span className="text-lg">⚠️</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 dark:text-gray-200 font-semibold mb-1">Safety Guidelines:</p>
                      <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                        <li>• File limit: 10MB | Text limit: 20,000 characters</li>
                        <li>• Supported: JPEG, PNG, GIF, WebP, Text, PDF</li>
                        <li>• Never upload sensitive data (passwords, credit cards, SSN)</li>
                        <li>• AI summaries are for reference - verify important details</li>
                        <li>• ℹ️ Summaries are not saved to Analytics</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-3 theme-transition">
                      Upload File (Max 10MB)
                    </label>
                    <input
                      type="file"
                      accept="image/*,text/*,.pdf"
                      onChange={handleFileUpload}
                      className="form-input w-full p-4 rounded-xl transition-all duration-200 text-gray-900 dark:text-gray-100"
                    />
                    {uploadedFile && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                        ✓ Uploaded: {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-3 theme-transition">
                      Or Paste Text (50-20,000 chars)
                    </label>
                    <textarea
                      value={summarizeText}
                      onChange={(e) => setSummarizeText(e.target.value)}
                      placeholder="Paste your text here to summarize..."
                      maxLength={20000}
                      className="form-input w-full p-4 rounded-xl h-48 resize-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 theme-transition"
                    />
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
                      <span>Characters: {summarizeText.length}/20,000</span>
                      {summarizeText.length > 18000 && (
                        <span className="text-orange-600 dark:text-orange-400">⚠️ Approaching limit</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleSummarizeFile}
                    disabled={(!uploadedFile && !summarizeText.trim()) || isGenerating}
                    className="w-full bg-gradient-to-br from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800 text-white py-4 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-ripple"
                  >
                    {isGenerating ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full loading-spinner"></div>
                        <span>Summarizing...</span>
                      </div>
                    ) : (
                      'Summarize'
                    )}
                  </button>
                </div>
              </div>

              <div ref={resultRef} className="glass-card rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10 theme-transition">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-orange-700 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">✨</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 theme-transition">Summary Result</h3>
                </div>
                
                {summarizedContent ? (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 theme-transition max-h-96 overflow-y-auto">
                      <pre className="text-gray-900 dark:text-gray-200 whitespace-pre-wrap leading-relaxed theme-transition font-sans text-sm">
                        {summarizedContent}
                      </pre>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={async () => {
                          await navigator.clipboard.writeText(summarizedContent)
                          alert('Summary copied!')
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-xl transition-all duration-75 font-semibold text-sm btn-ripple"
                      >
                        Copy Summary
                      </button>
                      <button 
                        onClick={() => {
                          setSummarizedContent('')
                          setSummarizeText('')
                          setUploadedFile(null)
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-xl transition-all duration-75 font-semibold text-sm btn-ripple"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 rounded-2xl flex items-center justify-center mx-auto mb-6 theme-transition">
                      <span className="text-3xl">📝</span>
                    </div>
                    <p className="text-gray-800 dark:text-gray-400 text-lg font-normal theme-transition">
                      Your creative summary will appear here
                    </p>
                    <p className="text-gray-600 dark:text-gray-500 text-sm mt-2 theme-transition">
                      Upload a file or paste text to get started
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* IMPROVE TAB */}
          {activeTab === 'improve' && (
            <div className="max-w-5xl mx-auto">
              <div ref={formRef} className="glass-card rounded-2xl md:rounded-3xl p-6 md:p-8 theme-transition">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center">
                      <span className="text-white text-xl">🎯</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 theme-transition">Growth Suggestions</h3>
                  </div>
                  <button
                    onClick={fetchImprovements}
                    disabled={loadingImprovements}
                    className="bg-gradient-to-br from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white py-2 px-6 rounded-xl font-semibold disabled:opacity-50 transition-all btn-ripple"
                  >
                    {loadingImprovements ? 'Analyzing...' : 'Refresh'}
                  </button>
                </div>

                {loadingImprovements ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600 rounded-full loading-spinner mx-auto mb-4"></div>
                    <p className="text-gray-800 dark:text-gray-400 text-lg font-normal theme-transition">
                      Analyzing your content history...
                    </p>
                  </div>
                ) : improvements.length > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800 theme-transition mb-6">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                        📊 Content Analysis Complete
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        Based on your content history and performance metrics, here are personalized suggestions to help you grow:
                      </p>
                    </div>

                    {improvements.map((suggestion, index) => (
                      <div
                        key={index}
                        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 theme-transition hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                              {suggestion}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-200 dark:border-indigo-800 theme-transition mt-6">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                        💡 Pro Tip
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        Implement these suggestions gradually and track your progress. Click "Refresh" to get updated recommendations based on your latest content.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 rounded-2xl flex items-center justify-center mx-auto mb-6 theme-transition">
                      <span className="text-3xl">🎯</span>
                    </div>
                    <p className="text-gray-800 dark:text-gray-400 text-lg font-normal mb-4 theme-transition">
                      No suggestions available yet
                    </p>
                    <p className="text-gray-600 dark:text-gray-500 text-sm mb-6 theme-transition">
                      Create some content first, then come back for personalized growth suggestions
                    </p>
                    <button
                      onClick={fetchImprovements}
                      className="bg-gradient-to-br from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white py-3 px-8 rounded-xl font-semibold transition-all btn-ripple"
                    >
                      Analyze Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default Creator
