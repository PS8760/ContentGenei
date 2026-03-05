import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { gsap } from 'gsap'
import {
  User, Briefcase, MapPin, Target, Users, FileText,
  Instagram, Twitter, Linkedin, Youtube, Check, ArrowRight, ArrowLeft,
  Sparkles, Code, Palette, Hotel, Brain
} from 'lucide-react'
import ParticlesBackground from '../components/ParticlesBackground'
import FloatingEmojis from '../components/FloatingEmojis'
import ThemeToggle from '../components/ThemeToggle'
import apiService from '../services/api'

const Onboarding = () => {
  const { currentUser } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [isAnimating, setIsAnimating] = useState(false)
  
  const stepRef = useRef(null)
  const progressRef = useRef(null)

  // Form data state - 9 questions organized in 4 steps
  const [formData, setFormData] = useState({
    // Step 1: Professional Identity (Q1-3)
    full_name: '',
    professional_title: '',
    location: '',
    
    // Step 2: Brand Voice & Persona (Q4-6)
    brand_voice: 'professional',
    target_audience: '',
    bio: '',
    
    // Step 3: Platform Permissions (Q7)
    platforms: {
      instagram: false,
      twitter: false,
      linkedin: false,
      youtube: false
    },
    
    // Step 4: Niche Expertise (Q8-9)
    expertise_tags: [],
    primary_goal: ''
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    // Don't redirect if already complete - let the route guard handle it
    // This prevents the double-reload issue
  }, [navigate])

  useEffect(() => {
    // Animate step transition
    if (stepRef.current) {
      gsap.fromTo(stepRef.current,
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" }
      )
    }
    
    // Animate progress bar
    if (progressRef.current) {
      gsap.to(progressRef.current, {
        width: `${(currentStep / 4) * 100}%`,
        duration: 0.5,
        ease: "power2.out"
      })
    }
  }, [currentStep])

  const expertiseTags = [
    { id: 'dijkstra', label: "Dijkstra's Algorithm", icon: Brain },
    { id: 'nqueens', label: 'N-Queens Problem', icon: Brain },
    { id: 'rabin-karp', label: 'Rabin-Karp Algorithm', icon: Brain },
    { id: 'html-css', label: 'HTML/CSS', icon: Code },
    { id: 'javascript', label: 'JavaScript', icon: Code },
    { id: 'react', label: 'React', icon: Code },
    { id: 'design-thinking', label: 'Design Thinking', icon: Palette },
    { id: 'hotel-management', label: 'Hotel Management Systems', icon: Hotel }
  ]

  const platforms = [
    {
      id: 'instagram',
      name: 'Instagram',
      description: 'Captions & Hashtags',
      icon: Instagram,
      color: 'from-pink-500 to-purple-600'
    },
    {
      id: 'twitter',
      name: 'Twitter/X',
      description: 'Threads & Short Updates',
      icon: Twitter,
      color: 'from-sky-400 to-blue-600'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      description: 'Professional Articles & Thoughts',
      icon: Linkedin,
      color: 'from-blue-600 to-blue-700'
    },
    {
      id: 'youtube',
      name: 'YouTube',
      description: 'Scripts & Descriptions',
      icon: Youtube,
      color: 'from-red-500 to-red-600'
    }
  ]

  const validateStep = (step) => {
    const newErrors = {}
    
    switch(step) {
      case 1:
        if (!formData.full_name.trim()) {
          newErrors.full_name = 'Full name is required'
        }
        if (!formData.professional_title.trim()) {
          newErrors.professional_title = 'Professional title is required'
        }
        if (!formData.location.trim()) {
          newErrors.location = 'Location is required'
        }
        break
        
      case 2:
        if (!formData.target_audience.trim()) {
          newErrors.target_audience = 'Target audience is required'
        }
        if (!formData.bio.trim()) {
          newErrors.bio = 'Bio is required'
        }
        if (formData.bio.trim().length < 50) {
          newErrors.bio = 'Bio must be at least 50 characters (2-3 sentences)'
        }
        break
        
      case 3:
        const selectedPlatforms = Object.values(formData.platforms).filter(Boolean).length
        if (selectedPlatforms === 0) {
          newErrors.platforms = 'Please select at least one platform'
        }
        break
        
      case 4:
        if (formData.expertise_tags.length === 0) {
          newErrors.expertise_tags = 'Please select at least one area of expertise'
        }
        if (!formData.primary_goal.trim()) {
          newErrors.primary_goal = 'Primary goal is required'
        }
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setIsAnimating(true)
        setTimeout(() => {
          setCurrentStep(currentStep + 1)
          setIsAnimating(false)
        }, 300)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(currentStep - 1)
        setIsAnimating(false)
        setErrors({})
      }, 300)
    }
  }

  const handleFinish = async () => {
    if (validateStep(4)) {
      setIsAnimating(true)
      
      try {
        console.log('Starting onboarding completion...')
        
        // Prepare onboarding data for backend
        const onboardingData = {
          full_name: formData.full_name,
          professional_title: formData.professional_title,
          location: formData.location,
          content_tone: formData.brand_voice,
          target_audience: formData.target_audience,
          bio: formData.bio,
          platforms: formData.platforms,
          niche_tags: formData.expertise_tags,
          primary_goal: formData.primary_goal
        }
        
        console.log('Onboarding data:', onboardingData)
        
        // Prepare user profile for localStorage
        const userProfile = {
          ...onboardingData,
          onboarding_completed_at: new Date().toISOString()
        }
        
        // Try to save to backend
        try {
          console.log('Calling API to complete onboarding...')
          const response = await apiService.completeOnboarding(onboardingData)
          console.log('API response:', response)
          
          if (response.success) {
            console.log('Onboarding saved to backend successfully!')
          } else {
            console.warn('Backend save failed, but continuing with localStorage:', response.error)
          }
        } catch (apiError) {
          console.error('Backend API error (continuing with localStorage):', apiError)
          // Continue anyway - we'll save to localStorage
        }
        
        // Always save to localStorage (works even if backend fails)
        localStorage.setItem('user_profile', JSON.stringify(userProfile))
        localStorage.setItem('onboarding_complete', 'true')
        console.log('Saved to localStorage')
        
        // Check if Instagram was selected
        if (formData.platforms.instagram) {
          console.log('Instagram selected - triggering OAuth...')
          
          try {
            // Get Instagram OAuth URL from backend
            const oauthResponse = await apiService.getInstagramAuthUrl()
            
            if (oauthResponse.success && oauthResponse.oauth_url) {
              console.log('Redirecting to Instagram OAuth...')
              // Redirect to Instagram OAuth
              window.location.href = oauthResponse.oauth_url
              return // Stop here, Instagram will redirect back
            } else {
              console.error('Failed to get Instagram OAuth URL:', oauthResponse)
              navigate('/dashboard')
            }
          } catch (oauthError) {
            console.error('Instagram OAuth error:', oauthError)
            navigate('/dashboard')
          }
        } else {
          console.log('No Instagram selected, navigating to dashboard...')
          navigate('/dashboard')
        }
        
      } catch (error) {
        console.error('Critical error completing onboarding:', error)
        
        // Show error to user
        alert(`Error: ${error.message}\n\nTrying to continue anyway...`)
        
        // Try to continue anyway with localStorage
        try {
          const userProfile = {
            full_name: formData.full_name,
            professional_title: formData.professional_title,
            location: formData.location,
            content_tone: formData.brand_voice,
            target_audience: formData.target_audience,
            bio: formData.bio,
            platforms: formData.platforms,
            niche_tags: formData.expertise_tags,
            primary_goal: formData.primary_goal,
            onboarding_completed_at: new Date().toISOString()
          }
          localStorage.setItem('user_profile', JSON.stringify(userProfile))
          localStorage.setItem('onboarding_complete', 'true')
          navigate('/dashboard')
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError)
          setErrors({ general: 'Failed to save onboarding data. Please try again.' })
          setIsAnimating(false)
        }
      }
    } else {
      console.log('Validation failed for step 4')
    }
  }

  const toggleExpertiseTag = (tagId) => {
    setFormData(prev => ({
      ...prev,
      expertise_tags: prev.expertise_tags.includes(tagId)
        ? prev.expertise_tags.filter(id => id !== tagId)
        : [...prev.expertise_tags, tagId]
    }))
  }

  const togglePlatform = (platformId) => {
    setFormData(prev => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [platformId]: !prev.platforms[platformId]
      }
    }))
  }

  const steps = [
    { number: 1, title: 'Identity', icon: User },
    { number: 2, title: 'Voice', icon: Sparkles },
    { number: 3, title: 'Platforms', icon: Target },
    { number: 4, title: 'Expertise', icon: Brain }
  ]

  return (
    <div className="min-h-screen theme-transition relative overflow-hidden">
      <ParticlesBackground />
      <FloatingEmojis />
      
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      
      <div className="relative z-10 min-h-screen flex flex-col py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <span className="text-white font-bold text-3xl">C</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-3 theme-transition">
                Welcome to <span className="gradient-text">ContentGenie</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg theme-transition">
                Let's personalize your content creation experience
              </p>
            </div>

            {/* Modern Progress Stepper */}
            <div className="mb-10">
              {/* Progress Dots */}
              <div className="flex items-center justify-center mb-6">
                {steps.map((step, index) => {
                  const isActive = currentStep === step.number
                  const isCompleted = currentStep > step.number
                  
                  return (
                    <div key={step.number} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div className={`relative w-3 h-3 rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-green-500 shadow-lg shadow-green-500/50' :
                          isActive ? 'bg-indigo-600 shadow-lg shadow-indigo-500/50 scale-150' :
                          'bg-gray-300 dark:bg-gray-700'
                        }`}>
                          {isActive && (
                            <div className="absolute inset-0 rounded-full bg-indigo-600 animate-ping opacity-75"></div>
                          )}
                        </div>
                        <span className={`text-xs mt-3 font-medium transition-all duration-300 ${
                          isActive ? 'text-gray-900 dark:text-white font-bold' : 
                          isCompleted ? 'text-green-600 dark:text-green-400' :
                          'text-gray-500 dark:text-gray-500'
                        }`}>
                          {step.title}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`h-0.5 w-16 sm:w-24 mx-2 transition-all duration-500 ${
                          currentStep > step.number ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'
                        }`} />
                      )}
                    </div>
                  )
                })}
              </div>
              
              {/* Slim Progress Bar */}
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                <div 
                  ref={progressRef}
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 shadow-lg"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 pb-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div ref={stepRef} className="glass-card rounded-3xl p-8 md:p-10 shadow-2xl theme-transition border border-gray-200 dark:border-gray-800">
              
              {/* Error Display */}
              {errors.general && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
                  <div className="flex items-start space-x-3">
                    <span className="text-red-500 text-xl">⚠️</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        {errors.general}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 1: Professional Identity (Q1-3) */}
              {currentStep === 1 && (
                <div className="space-y-8">
                  <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 theme-transition">Professional Identity</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-lg theme-transition">Tell us about yourself</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide theme-transition">
                      1. What is your full name? <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-3xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all theme-transition shadow-sm"
                        placeholder="Enter your full name"
                      />
                    </div>
                    {errors.full_name && <p className="text-red-500 text-sm mt-2 font-medium">{errors.full_name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide theme-transition">
                      2. What is your professional title? <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        value={formData.professional_title}
                        onChange={(e) => setFormData({ ...formData, professional_title: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-3xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all theme-transition shadow-sm"
                        placeholder="e.g., Full Stack Developer, Student"
                      />
                    </div>
                    {errors.professional_title && <p className="text-red-500 text-sm mt-2 font-medium">{errors.professional_title}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide theme-transition">
                      3. Where are you located? <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-3xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all theme-transition shadow-sm"
                        placeholder="e.g., Dombivli, Maharashtra"
                      />
                    </div>
                    {errors.location && <p className="text-red-500 text-sm mt-2 font-medium">{errors.location}</p>}
                  </div>
                </div>
              )}

              {/* Step 2: Brand Voice & Persona (Q4-6) */}
              {currentStep === 2 && (
                <div className="space-y-8">
                  <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                      <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 theme-transition">Brand Voice & Persona</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-lg theme-transition">Define your unique content style</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide theme-transition">
                      4. How would you describe your brand voice? <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.brand_voice}
                      onChange={(e) => setFormData({ ...formData, brand_voice: e.target.value })}
                      className="w-full px-4 py-4 bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-3xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all theme-transition shadow-sm"
                    >
                      <option value="professional">Professional</option>
                      <option value="witty">Witty</option>
                      <option value="casual">Casual</option>
                      <option value="technical">Technical</option>
                      <option value="minimalist">Minimalist</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide theme-transition">
                      5. Who is your primary target audience? <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        value={formData.target_audience}
                        onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-3xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all theme-transition shadow-sm"
                        placeholder="e.g., Recruiters, Tech Enthusiasts, Small Business Owners"
                      />
                    </div>
                    {errors.target_audience && <p className="text-red-500 text-sm mt-2 font-medium">{errors.target_audience}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide theme-transition">
                      6. Write a short bio (2-3 sentences) for AI context <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        rows={5}
                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-3xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all theme-transition shadow-sm"
                        placeholder="Tell us about yourself in 2-3 sentences. This helps AI understand your story and create personalized content."
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      {errors.bio && <p className="text-red-500 text-sm font-medium">{errors.bio}</p>}
                      <p className="text-gray-500 dark:text-gray-500 text-sm ml-auto theme-transition">{formData.bio.length} characters</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Platform Permissions (Q7) */}
              {currentStep === 3 && (
                <div className="space-y-8">
                  <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                      <Target className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 theme-transition">Platform Access & Permissions</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-lg theme-transition">Select the platforms you want ContentGenie to access</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide theme-transition">
                      7. Which platforms do you want ContentGenie to access? <span className="text-red-500">*</span>
                    </label>
                    <div className="grid md:grid-cols-2 gap-6">
                      {platforms.map((platform) => {
                        const Icon = platform.icon
                        const isSelected = formData.platforms[platform.id]
                        
                        return (
                          <button
                            key={platform.id}
                            onClick={() => togglePlatform(platform.id)}
                            className={`group relative p-8 rounded-3xl border-2 transition-all duration-300 text-left transform hover:scale-105 ${
                              isSelected
                                ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 shadow-2xl shadow-indigo-500/20'
                                : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/30 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-lg hover:shadow-xl'
                            } theme-transition`}
                          >
                            {isSelected && (
                              <div className="absolute top-6 right-6 w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                <Check className="w-5 h-5 text-white" />
                              </div>
                            )}
                            
                            <div className={`w-20 h-20 bg-gradient-to-br ${platform.color} rounded-3xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                              <Icon className="w-10 h-10 text-white" />
                            </div>
                            
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 theme-transition">{platform.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 theme-transition">{platform.description}</p>
                          </button>
                        )
                      })}
                    </div>
                    
                    {errors.platforms && (
                      <p className="text-red-500 text-sm text-center font-medium mt-4">{errors.platforms}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Niche Expertise (Q8-9) */}
              {currentStep === 4 && (
                <div className="space-y-8">
                  <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                      <Brain className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 theme-transition">Niche Expertise</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-lg theme-transition">Share your areas of expertise</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide theme-transition">
                      8. What are your primary areas of expertise? <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {expertiseTags.map((tag) => {
                        const Icon = tag.icon
                        const isSelected = formData.expertise_tags.includes(tag.id)
                        
                        return (
                          <button
                            key={tag.id}
                            onClick={() => toggleExpertiseTag(tag.id)}
                            className={`inline-flex items-center space-x-2 px-5 py-3 rounded-3xl font-medium transition-all duration-300 transform hover:scale-105 ${
                              isSelected
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 shadow-md'
                            } theme-transition`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm">{tag.label}</span>
                            {isSelected && <Check className="w-4 h-4" />}
                          </button>
                        )
                      })}
                    </div>
                    {errors.expertise_tags && <p className="text-red-500 text-sm mt-3 font-medium">{errors.expertise_tags}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide theme-transition">
                      9. What is your primary goal for using ContentGenie? <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.primary_goal}
                      onChange={(e) => setFormData({ ...formData, primary_goal: e.target.value })}
                      className="w-full px-4 py-4 bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-3xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all theme-transition shadow-sm"
                    >
                      <option value="">Select your primary goal</option>
                      <option value="build-brand">Build a personal brand</option>
                      <option value="save-time">Save time on content creation</option>
                      <option value="network">Network with professionals</option>
                      <option value="showcase-work">Showcase my work</option>
                      <option value="learn-grow">Learn and grow</option>
                      <option value="monetize">Monetize my content</option>
                    </select>
                    {errors.primary_goal && <p className="text-red-500 text-sm mt-2 font-medium">{errors.primary_goal}</p>}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-10 pt-8 border-t border-gray-200 dark:border-gray-800 theme-transition">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 1 || isAnimating}
                  className="flex items-center space-x-2 px-8 py-4 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-3xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 theme-transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back</span>
                </button>

                {currentStep < 4 ? (
                  <button
                    onClick={handleNext}
                    disabled={isAnimating}
                    className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-3xl font-bold transition-all shadow-xl shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-2xl transform hover:scale-105"
                  >
                    <span>Next Step</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={handleFinish}
                    disabled={isAnimating}
                    className="flex items-center space-x-2 px-10 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-3xl font-bold transition-all shadow-xl shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-2xl transform hover:scale-105"
                  >
                    <Check className="w-5 h-5" />
                    <span>Finish & Start Creating</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Onboarding
