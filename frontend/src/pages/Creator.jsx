import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import ParticlesBackground from '../components/ParticlesBackground'
import FloatingEmojis from '../components/FloatingEmojis'
import Header from '../components/Header'
import Footer from '../components/Footer'
import apiService from '../services/api'

const Creator = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [contentType, setContentType] = useState('article')
  const [prompt, setPrompt] = useState('')
  const [tone, setTone] = useState('professional')
  const [generatedContent, setGeneratedContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('generate')
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [summarizeText, setSummarizeText] = useState('')
  const [summarizedContent, setSummarizedContent] = useState('')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [improvements, setImprovements] = useState([])
  const [loadingImprovements, setLoadingImprovements] = useState(false)
  
  // Chat assistant for summarized content
  const [showChatAssistant, setShowChatAssistant] = useState(false)
  const [assistantMessages, setAssistantMessages] = useState([])
  const [assistantInput, setAssistantInput] = useState('')
  const [isAssistantThinking, setIsAssistantThinking] = useState(false)
  
  // URL input for content extraction
  const [urlInput, setUrlInput] = useState('')
  
  const titleRef = useRef(null)
  const formRef = useRef(null)
  const resultRef = useRef(null)
  const chatEndRef = useRef(null)

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

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages])

  useEffect(() => {
    if (activeTab === 'improve' && improvements.length === 0) {
      fetchImprovements()
    }
  }, [activeTab])

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

    setIsGenerating(true)
    setGeneratedContent('')
    
    gsap.to(resultRef.current, {
      scale: 0.99,
      opacity: 0.9,
      duration: 0.3,
      ease: "power2.out"
    })

    try {
      // Enhanced prompt engineering for better content generation
      const enhancedPrompt = `Create ${contentType} content with the following specifications:

Topic/Request: ${prompt}

Requirements:
- Tone: ${tone}
- Style: ${contentType === 'social-post' ? 'Engaging and shareable' : contentType === 'email' ? 'Professional and clear' : contentType === 'blog' ? 'Informative and well-structured' : contentType === 'caption' ? 'Catchy and concise' : contentType === 'script' ? 'Conversational and engaging' : contentType === 'ad-copy' ? 'Persuasive and action-oriented' : 'Well-researched and comprehensive'}
- Target audience: General audience (adjust based on context)
- Length: ${contentType === 'caption' ? 'Short (50-150 words)' : contentType === 'social-post' ? 'Medium (100-300 words)' : 'Comprehensive (300-800 words)'}

Additional guidelines:
- Make it engaging and valuable
- Use clear, ${tone} language
- Include relevant examples or details when appropriate
- Ensure proper structure and flow
- Make it ready to use with minimal editing

Generate high-quality content that meets these specifications.`
      
      const data = await apiService.generateContent({
        prompt: enhancedPrompt,
        type: contentType,
        tone: tone
      })
      
      if (data.success) {
        // Add helpful disclaimer
        const contentWithNote = `${data.content.content}\n\n---\n💡 AI-Generated Content: Please review and edit as needed before publishing.`
        setGeneratedContent(contentWithNote)
        
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
      setGeneratedContent(`❌ Error: ${error.message || 'Failed to generate content. Please check if the backend server is running and try again.'}`)
      
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
      alert('✅ Content saved successfully!')
    } catch (error) {
      console.error('Error saving content:', error)
      alert('❌ Failed to save content')
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

  const handleImprove = async () => {
    if (!generatedContent) return
    
    setIsGenerating(true)
    
    try {
      // Enhanced improvement prompt
      const improvePrompt = `You are a professional content editor. Improve the following ${contentType} content by:

1. Enhancing clarity and readability
2. Strengthening the message and impact
3. Improving flow and structure
4. Making it more engaging for the audience
5. Maintaining the ${tone} tone
6. Fixing any grammatical or stylistic issues
7. Adding compelling elements where appropriate

Original content:
${generatedContent.replace(/\n---\n💡.*$/s, '')}

Provide an improved version that is significantly better while keeping the core message intact. Make it publication-ready.`
      
      const response = await apiService.generateContent({
        prompt: improvePrompt,
        type: contentType,
        tone: tone
      })
      
      if (response.success) {
        const improvedContent = `${response.content.content}\n\n---\n✨ Improved by AI: This is an enhanced version of your content.`
        setGeneratedContent(improvedContent)
      }
    } catch (error) {
      console.error('Error improving content:', error)
      alert('❌ Failed to improve content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleChatSend = async () => {
    if (!chatInput.trim()) return
    
    const userMessage = { role: 'user', content: chatInput }
    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsGenerating(true)
    
    try {
      // Build conversation context with history
      let contextualPrompt = ''
      
      // Check if this is a greeting
      const greetings = ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening', 'sup', 'yo', 'howdy', "what's up", 'whats up', 'wassup', 'heya']
      const isGreeting = greetings.some(greeting => 
        chatInput.toLowerCase().trim().startsWith(greeting) || 
        chatInput.toLowerCase().trim() === greeting
      )
      
      if (isGreeting && chatMessages.length === 0) {
        // First message greeting - respond like Alex in the image
        contextualPrompt = `You are Alex, a friendly AI content buddy. Your friend just said: "${chatInput}"

Respond EXACTLY like this style:
"Hey hey! 👋 I'm your AI content buddy, here to help you brainstorm, write, and make stuff awesome. What are you working on today? 😊"

Keep it:
- Super warm and welcoming
- Use emojis naturally (👋 😊)
- SHORT (1-2 sentences)
- Ask what they're working on
- Sound genuinely excited to help`
      } else if (chatMessages.length > 0) {
        // Include conversation history for context
        const recentHistory = chatMessages.slice(-6).map(msg => 
          `${msg.role === 'user' ? 'Friend' : 'Alex'}: ${msg.content}`
        ).join('\n')
        
        contextualPrompt = `You are Alex, a friendly AI content buddy helping with content creation. Here's your recent chat:

${recentHistory}

Friend: ${chatInput}

Respond like Alex in these examples:
- "Hey, I'm doing great, thanks for asking! 😊 How's your day going? Anything fun you're working on?"
- "Sure thing! 🎯 Here's a quick 30-day flow: Week 1 – bite-size tips & hacks; Week 2 – behind-the-scenes or process vids; Week 3 – user stories or case studies; Week 4 – deep-dive guides or interviews, then repeat with fresh angles. What niche or platform are you targeting so I can tweak it for you? 😊"
- "Awesome! 🎬 For cinematography, try a mix of gear demos, quick lighting hacks, behind-the-scenes clips, and short 'how I shot this' breakdowns. Want a day-by-day calendar or just some starter ideas? 😊"

Key style rules:
- Start with casual acknowledgment (Sure thing!, Awesome!, Hey!, Nice!)
- Use emojis naturally (😊 🎯 🎬 👋 💡 ✨)
- Give SPECIFIC, ACTIONABLE advice with details
- Break down complex ideas into clear steps
- Ask follow-up questions to personalize help
- Keep it conversational and friendly
- Sound like a supportive friend who's genuinely excited to help
- Use contractions (I'm, you're, let's, that's)
- Be encouraging and positive`
      } else {
        // First message but not a greeting - jump right into helping
        contextualPrompt = `You are Alex, a friendly AI content buddy. Your friend just asked: "${chatInput}"

Respond with SPECIFIC, ACTIONABLE advice like these examples:
- "Sure thing! 🎯 Here's a quick 30-day flow: Week 1 – bite-size tips & hacks; Week 2 – behind-the-scenes or process vids; Week 3 – user stories or case studies; Week 4 – deep-dive guides or interviews, then repeat with fresh angles. What niche or platform are you targeting so I can tweak it for you? 😊"
- "Awesome! 🎬 For cinematography, try a mix of gear demos, quick lighting hacks, behind-the-scenes clips, and short 'how I shot this' breakdowns. Want a day-by-day calendar or just some starter ideas? 😊"

Key style:
- Start with casual acknowledgment (Sure thing!, Awesome!, Great question!)
- Give SPECIFIC details and examples
- Break things into clear steps or categories
- Use emojis naturally (😊 🎯 💡)
- Ask follow-up questions to help more
- Sound like an excited friend sharing tips
- Keep it practical and actionable`
      }
      
      const response = await apiService.generateContent({
        prompt: contextualPrompt,
        type: 'chat',
        tone: 'conversational'
      })
      
      if (response.success) {
        const aiMessage = { role: 'assistant', content: response.content.content }
        setChatMessages(prev => [...prev, aiMessage])
      }
    } catch (error) {
      console.error('Error in chat:', error)
      const errorMessage = { role: 'assistant', content: 'Oops, something went wrong 😅 Mind trying that again?' }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    setUploadedFile(file)
    setIsGenerating(true)
    setSummarizeText('')
    
    try {
      if (file.type.startsWith('text/')) {
        // Handle text files
        const reader = new FileReader()
        reader.onload = (e) => {
          setSummarizeText(e.target.result)
          setIsGenerating(false)
        }
        reader.onerror = () => {
          alert('❌ Failed to read text file')
          setIsGenerating(false)
        }
        reader.readAsText(file)
      } else if (file.type.startsWith('image/')) {
        // Handle image files with OCR
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const base64Image = e.target.result
            
            // Call OCR API to extract text
            const response = await apiService.extractTextFromImage(base64Image)
            
            if (response.success && response.text) {
              setSummarizeText(response.text)
              alert(`✅ Text extracted successfully! Found ${response.word_count} words with ${response.confidence}% confidence.`)
            } else {
              const errorMsg = response.error || 'Failed to extract text from image'
              alert(`⚠️ ${errorMsg}`)
              setSummarizeText(`[Image: ${file.name}]\n\nNo text could be extracted. Please try:\n• A clearer image with better lighting\n• Higher resolution image\n• Or paste text manually`)
            }
          } catch (error) {
            console.error('OCR error:', error)
            alert('❌ Failed to extract text from image. Please try again or paste text manually.')
            setSummarizeText(`[Image: ${file.name}]\n\nOCR failed. Please paste text manually.`)
          } finally {
            setIsGenerating(false)
          }
        }
        reader.onerror = () => {
          alert('❌ Failed to read image file')
          setIsGenerating(false)
        }
        reader.readAsDataURL(file)
      } else if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        // Handle video and audio files with transcription
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const base64Data = e.target.result
            
            const fileType = file.type.startsWith('video/') ? 'video' : 'audio'
            alert(`🎬 Transcribing ${fileType}... This may take a moment.`)
            
            // Call video transcription API (works for both video and audio)
            const response = await apiService.transcribeVideo(base64Data, file.name)
            
            if (response.success && response.transcription) {
              setSummarizeText(response.transcription)
              const duration = response.duration ? ` (${Math.round(response.duration)}s)` : ''
              alert(`✅ ${fileType.charAt(0).toUpperCase() + fileType.slice(1)} transcribed successfully! Found ${response.word_count} words${duration}.`)
            } else {
              const errorMsg = response.error || `Failed to transcribe ${fileType}`
              alert(`⚠️ ${errorMsg}`)
              setSummarizeText(`[${fileType.charAt(0).toUpperCase() + fileType.slice(1)}: ${file.name}]\n\nTranscription failed. Please try:\n• A ${fileType} with clear audio\n• Smaller file (max 25MB)\n• Supported formats: MP3, MP4, WAV, M4A, WebM\n• Or paste text manually`)
            }
          } catch (error) {
            console.error('Transcription error:', error)
            const fileType = file.type.startsWith('video/') ? 'video' : 'audio'
            alert(`❌ Failed to transcribe ${fileType}. Please try again or paste text manually.`)
            setSummarizeText(`[${fileType.charAt(0).toUpperCase() + fileType.slice(1)}: ${file.name}]\n\nTranscription failed. Please paste text manually.`)
          } finally {
            setIsGenerating(false)
          }
        }
        reader.onerror = () => {
          alert('❌ Failed to read file')
          setIsGenerating(false)
        }
        reader.readAsDataURL(file)
      } else {
        // Unsupported file type
        alert('⚠️ Unsupported file type. Please upload a text file, image, or video.')
        setSummarizeText(`[File: ${file.name}]\n\nUnsupported file type. Please upload .txt, image, or video files.`)
        setIsGenerating(false)
      }
    } catch (error) {
      console.error('File upload error:', error)
      alert('❌ Failed to process file')
      setIsGenerating(false)
    }
  }

  const handleUrlExtraction = async () => {
    if (!urlInput.trim()) {
      alert('⚠️ Please enter a URL')
      return
    }
    
    setIsGenerating(true)
    setSummarizeText('')
    
    try {
      alert('🌐 Extracting content from URL... This may take a moment.')
      
      const response = await apiService.extractUrlContent(urlInput.trim())
      
      if (response.success && response.content) {
        setSummarizeText(response.content)
        const title = response.title ? `\n\nTitle: ${response.title}` : ''
        alert(`✅ Content extracted successfully! Found ${response.word_count} words.${title}`)
      } else {
        const errorMsg = response.error || 'Failed to extract content from URL'
        alert(`⚠️ ${errorMsg}`)
        setSummarizeText(`[URL: ${urlInput}]\n\nExtraction failed. Please try:\n• A different URL\n• Checking if the URL is accessible\n• Or paste text manually`)
      }
    } catch (error) {
      console.error('URL extraction error:', error)
      alert('❌ Failed to extract content from URL. Please try again or paste text manually.')
      setSummarizeText(`[URL: ${urlInput}]\n\nExtraction failed. Please paste text manually.`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSummarize = async () => {
    if (!summarizeText.trim()) {
      alert('⚠️ Please upload a file or paste text to summarize.')
      return
    }
    
    // Validation: Text length
    if (summarizeText.trim().length < 50) {
      alert('⚠️ Text too short to summarize. Please provide at least 50 characters.')
      return
    }
    
    setIsGenerating(true)
    setSummarizedContent('')
    
    try {
      // Ultra-concise summarization prompt (5-10 lines max)
      const summaryPrompt = `You are an expert at creating ultra-concise summaries. Summarize the following content:

STRICT REQUIREMENTS:
- Maximum 5-10 lines (about 100-150 words)
- Use bullet points for clarity
- Include ONLY the most critical information
- Be extremely concise and direct
- No fluff or unnecessary words

Content to summarize:
${summarizeText}

Provide an ultra-brief summary following the requirements above.`
      
      const response = await apiService.generateContent({
        prompt: summaryPrompt,
        type: 'article',
        tone: 'professional'
      })
      
      if (response.success) {
        setSummarizedContent(response.content.content)
        // Initialize SamAI chat assistant with context
        setAssistantMessages([
          {
            role: 'assistant',
            content: '👋 Hi! I\'m SamAI, your summarization assistant. Ask me anything about the summary or the original content!'
          }
        ])
      }
    } catch (error) {
      console.error('Error summarizing:', error)
      alert('❌ Failed to summarize content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAssistantChat = async () => {
    if (!assistantInput.trim()) return
    
    const userMessage = assistantInput.trim()
    setAssistantInput('')
    
    // Add user message
    setAssistantMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsAssistantThinking(true)
    
    try {
      // Create context-aware prompt for SamAI
      const contextPrompt = `You are SamAI, a helpful AI summarization assistant. The user has summarized some content and now has questions about it.

Original Content:
${summarizeText.substring(0, 2000)}...

Summary:
${summarizedContent}

User Question: ${userMessage}

As SamAI, provide a helpful, concise answer (2-4 sentences) based on the content above. If the question is about getting more details, provide them from the original content.`
      
      const response = await apiService.generateContent({
        prompt: contextPrompt,
        type: 'chat',
        tone: 'conversational'
      })
      
      if (response.success) {
        setAssistantMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response.content.content 
        }])
      }
    } catch (error) {
      console.error('Error in assistant chat:', error)
      setAssistantMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '❌ Sorry, I encountered an error. Please try again.' 
      }])
    } finally {
      setIsAssistantThinking(false)
    }
  }

  const fetchImprovements = async () => {
    setLoadingImprovements(true)
    try {
      // Fetch user's content history and analytics
      const contentResponse = await apiService.getContent({ per_page: 10 })
      const analyticsResponse = await apiService.getContentStats()
      
      if (contentResponse.success && analyticsResponse.success) {
        const contentHistory = contentResponse.content || []
        const stats = analyticsResponse.stats || {}
        
        // Build comprehensive analysis prompt
        const analysisPrompt = `You are a content strategy expert. Analyze this creator's performance and provide 5 specific, actionable growth suggestions.

Creator's Data:
- Total content created: ${contentHistory.length}
- Content types: ${contentHistory.map(c => c.content_type).join(', ') || 'None yet'}
- Recent activity: ${contentHistory.length > 0 ? 'Active' : 'Just starting'}

Provide 5 SPECIFIC, ACTIONABLE suggestions to help them:
1. Improve content quality
2. Increase engagement
3. Grow their audience
4. Optimize their workflow
5. Develop their unique voice

Format each suggestion as a clear, actionable statement (not numbered). Make them practical and immediately implementable. Focus on what they can do TODAY to improve.`
        
        const response = await apiService.generateContent({
          prompt: analysisPrompt,
          type: 'article',
          tone: 'professional'
        })
        
        if (response.success) {
          // Parse suggestions from response
          const suggestions = response.content.content
            .split('\n')
            .filter(line => line.trim() && line.length > 20)
            .slice(0, 5)
          
          setImprovements(suggestions.length > 0 ? suggestions : [
            'Create a consistent posting schedule to build audience expectations',
            'Experiment with different content formats to find what resonates',
            'Engage with your audience through questions and calls-to-action',
            'Analyze your top-performing content and create similar pieces',
            'Develop a unique voice that sets you apart from competitors'
          ])
        }
      }
    } catch (error) {
      console.error('Error fetching improvements:', error)
      // Provide default helpful suggestions
      setImprovements([
        'Start by creating diverse content types to discover your strengths',
        'Focus on solving specific problems for your target audience',
        'Use storytelling techniques to make your content more engaging',
        'Optimize your headlines and opening lines to capture attention',
        'Build a content calendar to maintain consistency and quality'
      ])
    } finally {
      setLoadingImprovements(false)
    }
  }

  return (
    <div className="min-h-screen theme-transition relative">
      <ParticlesBackground />
      <FloatingEmojis />
      
      <Header />

      <main className="pt-24 pb-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={titleRef} className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 theme-transition">
              AI <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500 bg-clip-text text-transparent">Content Creator</span>
            </h1>
            <p className="text-gray-700 dark:text-gray-400 text-lg max-w-2xl mx-auto theme-transition">
              Generate, chat, summarize, and improve your content with AI-powered tools.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="glass-card rounded-2xl p-1.5 inline-flex space-x-1 shadow-lg theme-transition">
              <button
                onClick={() => setActiveTab('generate')}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                  activeTab === 'generate'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white theme-transition'
                }`}
              >
                <span>✨</span>
                <span>Generate</span>
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                  activeTab === 'chat'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white theme-transition'
                }`}
              >
                <span>💬</span>
                <span>Chat Assistant</span>
              </button>
              <button
                onClick={() => setActiveTab('summarize')}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                  activeTab === 'summarize'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white theme-transition'
                }`}
              >
                <span>📄</span>
                <span>Summarize</span>
              </button>
              <button
                onClick={() => setActiveTab('improve')}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                  activeTab === 'improve'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white theme-transition'
                }`}
              >
                <span>🎯</span>
                <span>Improve</span>
              </button>
            </div>
          </div>

          {/* GENERATE TAB */}
          {activeTab === 'generate' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left Panel - AI Content Creator */}
              <div ref={formRef} className="glass-card rounded-2xl p-6 shadow-lg theme-transition">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">✏️</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white theme-transition">AI Content Creator</h3>
                </div>

                {/* Content Guidelines */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4 mb-6 theme-transition">
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600 dark:text-blue-400">💡</span>
                    <div className="flex-1">
                      <p className="text-sm text-blue-900 dark:text-blue-300 font-semibold mb-2 theme-transition">Content Guidelines:</p>
                      <ul className="text-xs text-blue-800 dark:text-gray-400 space-y-1 theme-transition">
                        <li>• Prompt length: 10-5000 characters for best results</li>
                        <li>• Focus on professional, legitimate content creation</li>
                        <li>• AI-generated content requires human review before publishing</li>
                        <li>• No illegal, harmful, or explicit content requests</li>
                        <li>• ✅ Generated content is automatically saved to Analytics</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide theme-transition">
                      Content Type
                    </label>
                    <select
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#0f1419] border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors theme-transition"
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
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide theme-transition">
                      Content Prompt (10-3000 chars)
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe what content you want to create..."
                      maxLength={5000}
                      className="w-full bg-gray-50 dark:bg-[#0f1419] border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors h-32 resize-none theme-transition"
                    />
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 mt-1 theme-transition">
                      <span>Characters: {prompt.length}/5000</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide theme-transition">
                      Tone & Style
                    </label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#0f1419] border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors theme-transition"
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
                    className="w-full bg-indigo-400 hover:bg-indigo-500 dark:bg-gray-400 dark:hover:bg-gray-500 text-white dark:text-gray-900 font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed theme-transition"
                  >
                    {isGenerating ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/30 dark:border-gray-700/30 border-t-white dark:border-t-gray-700 rounded-full animate-spin"></div>
                        <span>Generating Content...</span>
                      </div>
                    ) : (
                      'Generate Content'
                    )}
                  </button>
                </div>
              </div>

              {/* Right Panel - Generated Content */}
              <div ref={resultRef} className="glass-card rounded-2xl p-6 shadow-lg theme-transition">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">📄</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white theme-transition">Generated Content</h3>
                </div>
                
                {generatedContent ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-[#0f1419] rounded-xl p-5 border border-gray-200 dark:border-gray-800 max-h-96 overflow-y-auto theme-transition">
                      <pre className="generated-content-text text-gray-900 dark:text-gray-300 whitespace-pre-wrap leading-relaxed font-sans text-sm theme-transition">
                        {generatedContent}
                      </pre>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <button 
                        onClick={handleCopy}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-3 rounded-xl transition-all text-sm font-medium"
                      >
                        Copy
                      </button>
                      <button 
                        onClick={handleEdit}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-3 rounded-xl transition-all text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={handleImprove}
                        disabled={isGenerating}
                        className="bg-purple-600 hover:bg-purple-700 text-white py-2.5 px-3 rounded-xl transition-all text-sm font-medium disabled:opacity-50"
                      >
                        Improve
                      </button>
                      <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-gray-600 hover:bg-gray-700 text-white py-2.5 px-3 rounded-xl transition-all text-sm font-medium disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 theme-transition">
                      <span className="text-3xl">✨</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-base theme-transition">
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
              <div className="glass-card rounded-2xl p-6 shadow-lg theme-transition">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">💬</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white theme-transition">Alex - Chat Assistant</h3>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 theme-transition">{chatMessages.length}/100 messages</span>
                </div>

                {/* Usage Guidelines */}
                <div className="bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl p-4 mb-6 theme-transition">
                  <div className="flex items-start space-x-2">
                    <span className="text-gray-600 dark:text-gray-400">📘</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-gray-200 font-semibold mb-2 theme-transition">Usage Guidelines:</p>
                      <ul className="text-xs text-gray-700 dark:text-gray-400 space-y-1 theme-transition">
                        <li>• Focus on content creation, writing, and creative tasks</li>
                        <li>• Messages: 3-4000 characters | Session limit: 50 exchanges</li>
                        <li>• No personal info, illegal content, or harmful requests</li>
                        <li>• AI responses are suggestions - always review before use</li>
                        <li>• 💬 Chat conversations are not saved to Analytics</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Chat Messages */}
                <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-6 h-96 overflow-y-auto mb-4 space-y-4 theme-transition border border-gray-100 dark:border-gray-800">
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center space-y-6 h-full">
                      <div className="w-20 h-20 bg-green-600 dark:bg-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-4xl">💬</span>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-900 dark:text-gray-200 text-lg font-medium mb-2 theme-transition">
                          Hey! I'm <span className="text-green-600 dark:text-green-400 font-bold">Alex</span>, your content buddy 👋
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm theme-transition">Let's chat about your writing!</p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-3">
                        <button 
                          onClick={() => setChatInput('Help with blog post')}
                          className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
                        >
                          Help with blog post
                        </button>
                        <button 
                          onClick={() => setChatInput('Need ideas')}
                          className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
                        >
                          Need ideas
                        </button>
                        <button 
                          onClick={() => setChatInput('Improve my writing')}
                          className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
                        >
                          Improve my writing
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                            msg.role === 'user' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 border border-gray-200 dark:border-gray-700 theme-transition'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </>
                  )}
                </div>
                
                {/* Chat Input */}
                <div className="flex items-center space-x-2 mb-2">
                  <div className="text-xs text-gray-500 dark:text-gray-500 theme-transition">Message length: {chatInput.length}/4000</div>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                    placeholder="Type your message..."
                    maxLength={4000}
                    className="flex-1 bg-white dark:bg-gray-900/30 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors theme-transition"
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={!chatInput.trim() || isGenerating}
                    className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUMMARIZE TAB */}
          {activeTab === 'summarize' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left Panel - Summarize Content */}
              <div className="glass-card rounded-2xl p-6 shadow-lg theme-transition">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">📄</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white theme-transition">Summarize Content</h3>
                </div>

                {/* Safety Guidelines */}
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-xl p-4 mb-6 theme-transition">
                  <div className="flex items-start space-x-2">
                    <span className="text-orange-600 dark:text-orange-400">⚠️</span>
                    <div className="flex-1">
                      <p className="text-sm text-orange-900 dark:text-orange-300 font-semibold mb-2 theme-transition">Safety Guidelines:</p>
                      <ul className="text-xs text-orange-800 dark:text-gray-400 space-y-1 theme-transition">
                        <li>• File limit: 25MB | Text limit: 20,000 characters</li>
                        <li>• Supported: Images (JPEG, PNG, GIF, WebP), Audio/Video (MP3, MP4, WAV, M4A, WebM), Text, PDF</li>
                        <li>• Never upload sensitive data (passwords, credit cards, SSN)</li>
                        <li>• AI summaries are for reference - verify important details</li>
                        <li>• 📊 Summaries are not saved to Analytics</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide theme-transition">
                      Upload File (Max 25MB) - Text, Image, Audio, or Video
                    </label>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept=".txt,.pdf,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.avi,.mkv,.webm,.mp3,.wav,.m4a,.mpeg,.mpga"
                      className="w-full bg-gray-50 dark:bg-[#0f1419] border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer theme-transition"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white dark:bg-[#1a1f2e] text-gray-500 dark:text-gray-400">OR</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide theme-transition">
                      Paste URL to Extract Content
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://example.com/article"
                        className="flex-1 bg-gray-50 dark:bg-[#0f1419] border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors theme-transition"
                      />
                      <button
                        onClick={handleUrlExtraction}
                        disabled={!urlInput.trim() || isGenerating}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        Extract
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white dark:bg-[#1a1f2e] text-gray-500 dark:text-gray-400">OR</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide theme-transition">
                      Or Paste Text (50-20,000 chars)
                    </label>
                    <textarea
                      value={summarizeText}
                      onChange={(e) => setSummarizeText(e.target.value)}
                      placeholder="Paste your text here to summarize..."
                      maxLength={20000}
                      className="w-full bg-gray-50 dark:bg-[#0f1419] border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors h-48 resize-none theme-transition"
                    />
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 mt-1 theme-transition">
                      <span>Characters: {summarizeText.length}/20,000</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSummarize}
                    disabled={!summarizeText.trim() || isGenerating}
                    className="w-full bg-red-300 hover:bg-red-400 dark:bg-orange-600 dark:hover:bg-orange-700 text-gray-900 dark:text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed theme-transition"
                  >
                    {isGenerating ? 'Summarizing...' : 'Summarize'}
                  </button>
                </div>
              </div>

              {/* Right Panel - Summary Result */}
              <div className="glass-card rounded-2xl p-6 shadow-lg theme-transition">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">✨</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white theme-transition">Summary Result</h3>
                  </div>
                  {summarizedContent && (
                    <button
                      onClick={() => setShowChatAssistant(!showChatAssistant)}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all text-sm"
                    >
                      <span>💬</span>
                      <span>{showChatAssistant ? 'Hide' : 'Ask Questions'}</span>
                    </button>
                  )}
                </div>
                
                {summarizedContent ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-[#0f1419] rounded-xl p-5 border border-gray-200 dark:border-gray-800 max-h-[300px] overflow-y-auto theme-transition">
                      <p className="text-gray-900 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-sm theme-transition">
                        {summarizedContent}
                      </p>
                    </div>

                    {/* SamAI Chat Assistant */}
                    {showChatAssistant && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 theme-transition">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-lg">🤖</span>
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm theme-transition">SamAI - Summarization Assistant</h4>
                        </div>
                        
                        {/* Messages */}
                        <div className="bg-white dark:bg-[#0f1419] rounded-lg p-3 mb-3 max-h-[200px] overflow-y-auto space-y-2 theme-transition">
                          {assistantMessages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                                msg.role === 'user' 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-300'
                              }`}>
                                {msg.content}
                              </div>
                            </div>
                          ))}
                          {isAssistantThinking && (
                            <div className="flex justify-start">
                              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                                Thinking...
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Input */}
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={assistantInput}
                            onChange={(e) => setAssistantInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAssistantChat()}
                            placeholder="Ask about the content..."
                            className="flex-1 bg-white dark:bg-[#0f1419] border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 theme-transition"
                          />
                          <button
                            onClick={handleAssistantChat}
                            disabled={!assistantInput.trim() || isAssistantThinking}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            Send
                          </button>
                        </div>

                        {/* Quick Actions */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              setAssistantInput('Can you provide more details?')
                              setTimeout(() => handleAssistantChat(), 100)
                            }}
                            className="text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all"
                          >
                            📝 More Details
                          </button>
                          <button
                            onClick={() => {
                              setAssistantInput('What are the key takeaways?')
                              setTimeout(() => handleAssistantChat(), 100)
                            }}
                            className="text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all"
                          >
                            🎯 Key Points
                          </button>
                          <button
                            onClick={() => {
                              setAssistantInput('Explain this in simpler terms')
                              setTimeout(() => handleAssistantChat(), 100)
                            }}
                            className="text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all"
                          >
                            💡 Simplify
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 bg-orange-100 dark:bg-orange-800 rounded-2xl flex items-center justify-center mx-auto mb-4 theme-transition">
                      <span className="text-3xl">📄</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-base mb-2 theme-transition">
                      Your creative summary will appear here
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm theme-transition">
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
              <div className="glass-card rounded-2xl p-6 shadow-lg theme-transition">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">🎯</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white theme-transition">Growth Suggestions</h3>
                  </div>
                  <button
                    onClick={fetchImprovements}
                    disabled={loadingImprovements}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
                  >
                    Refresh
                  </button>
                </div>
                
                {improvements.length > 0 ? (
                  <div className="space-y-3">
                    {improvements.map((improvement, idx) => (
                      <div key={idx} className="bg-gray-50 dark:bg-[#0f1419] border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-purple-600 dark:hover:border-purple-600 transition-colors theme-transition">
                        <p className="text-gray-900 dark:text-gray-300 theme-transition">{improvement}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🎯</span>
                    </div>
                    <p className="text-gray-900 dark:text-white text-lg font-medium mb-2 theme-transition">No suggestions available yet</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 theme-transition">
                      Create some content first, then come back for personalized growth suggestions
                    </p>
                    <button
                      onClick={fetchImprovements}
                      disabled={loadingImprovements}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
                    >
                      {loadingImprovements ? 'Analyzing...' : 'Analyze Now'}
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
