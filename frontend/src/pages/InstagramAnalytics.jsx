import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSearchParams } from 'react-router-dom'
import { gsap } from 'gsap'
import api from '../services/api'
import Header from '../components/Header'
import ParticlesBackground from '../components/ParticlesBackground'
import FloatingEmojis from '../components/FloatingEmojis'
import ToastManager from '../utils/ToastManager'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f97316', '#06b6d4']

export default function InstagramAnalytics() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [connections, setConnections] = useState([])
  const [selectedConnection, setSelectedConnection] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [competitors, setCompetitors] = useState([])
  const [comparisonData, setComparisonData] = useState(null)
  const [newCompetitor, setNewCompetitor] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [generatingSuggestions, setGeneratingSuggestions] = useState({})
  const [activeTab, setActiveTab] = useState('dashboard')
  const [timeRange, setTimeRange] = useState('30') // 7, 30, 90, all
  
  // AI Features State
  const [contentGaps, setContentGaps] = useState(null)
  const [loadingGaps, setLoadingGaps] = useState(false)
  const [captionToOptimize, setCaptionToOptimize] = useState('')
  const [optimizedCaption, setOptimizedCaption] = useState(null)
  const [optimizingCaption, setOptimizingCaption] = useState(false)
  const [postToPredict, setPostToPredict] = useState({ media_type: 'IMAGE', caption: '' })
  const [prediction, setPrediction] = useState(null)
  const [predicting, setPredicting] = useState(false)
  const [contentIdeas, setContentIdeas] = useState(null)
  const [generatingIdeas, setGeneratingIdeas] = useState(false)
  const [niche, setNiche] = useState('general')
  
  // ML Features State
  const [patterns, setPatterns] = useState(null)
  const [loadingPatterns, setLoadingPatterns] = useState(false)
  const [sentiment, setSentiment] = useState(null)
  const [loadingSentiment, setLoadingSentiment] = useState(false)
  const [mlModel, setMlModel] = useState(null)
  const [trainingModel, setTrainingModel] = useState(false)
  const [mlPrediction, setMlPrediction] = useState(null)
  const [predictingML, setPredictingML] = useState(false)
  const [mlPostData, setMlPostData] = useState({ media_type: 'IMAGE', caption: '' })
  const [optimalTiming, setOptimalTiming] = useState(null)
  const [loadingTiming, setLoadingTiming] = useState(false)
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0])
  
  // Refs for GSAP animations
  const titleRef = useRef(null)
  const statsRef = useRef([])
  const cardsRef = useRef([])
  const tabsRef = useRef(null)

  // GSAP animations on mount
  useEffect(() => {
    if (!loading && dashboardData) {
      const tl = gsap.timeline({ delay: 0.2 })
      
      if (titleRef.current) {
        tl.fromTo(titleRef.current,
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
        )
      }
      
      if (tabsRef.current) {
        tl.fromTo(tabsRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
          "-=0.6"
        )
      }
      
      if (statsRef.current.length > 0) {
        tl.fromTo(statsRef.current,
          { y: 80, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 1, stagger: 0.1, ease: "back.out(1.1)" },
          "-=0.5"
        )
      }
      
      if (cardsRef.current.length > 0) {
        tl.fromTo(cardsRef.current,
          { y: 100, opacity: 0, scale: 0.9 },
          { y: 0, opacity: 1, scale: 1, duration: 1.2, stagger: 0.15, ease: "back.out(1.1)" },
          "-=0.7"
        )
      }
    }
  }, [loading, dashboardData])

  useEffect(() => {
    loadConnections()
    loadCompetitors()
    
    // Check for connection success
    if (searchParams.get('instagram') === 'connected') {
      ToastManager.success(
        'Instagram Connected!',
        'Your Instagram account has been connected successfully.',
        [],
        5000
      )
    }
  }, [])

  useEffect(() => {
    if (selectedConnection) {
      loadDashboardData()
      loadComparisonData()
    }
  }, [selectedConnection])

  const loadConnections = async () => {
    try {
      setLoading(true)
      const response = await api.getInstagramConnections()
      if (response.success) {
        setConnections(response.connections)
        if (response.connections.length > 0 && !selectedConnection) {
          setSelectedConnection(response.connections[0])
        }
      }
    } catch (error) {
      console.error('Failed to load connections:', error)
      ToastManager.error(
        'Connection Error',
        'Failed to load Instagram connections. Please try again.',
        [],
        5000
      )
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async () => {
    if (!selectedConnection) return

    setLoading(true)
    try {
      const response = await api.getInstagramDashboard(selectedConnection.id)
      if (response.success) {
        setDashboardData(response)
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCompetitors = async () => {
    try {
      const response = await api.getInstagramCompetitors()
      if (response.success) {
        setCompetitors(response.competitors)
      }
    } catch (error) {
      console.error('Failed to load competitors:', error)
    }
  }

  const loadComparisonData = async () => {
    if (!selectedConnection) return

    try {
      const response = await api.compareInstagramAccounts(selectedConnection.id)
      if (response.success) {
        setComparisonData(response.comparison)
      }
    } catch (error) {
      console.error('Failed to load comparison:', error)
    }
  }

  const handleConnectInstagram = async () => {
    try {
      console.log('[Instagram] Requesting OAuth URL from backend...')
      const response = await api.getInstagramAuthUrl()
      console.log('[Instagram] OAuth URL response:', response)

      if (response.success) {
        console.log('[Instagram] Redirecting to:', response.oauth_url)
        localStorage.setItem('instagram_oauth_state', response.state)
        window.location.href = response.oauth_url
      } else {
        console.error('[Instagram] Failed to get OAuth URL:', response)
        ToastManager.error(
          'OAuth Error',
          'Failed to generate OAuth URL. Check backend configuration.',
          [],
          6000
        )
      }
    } catch (error) {
      console.error('[Instagram] Error getting OAuth URL:', error)
      ToastManager.error(
        'Connection Failed',
        `Failed to connect Instagram: ${error.message}`,
        [],
        6000
      )
    }
  }

  const handleSync = async () => {
    if (!selectedConnection) return

    setSyncing(true)
    const loadingToastId = ToastManager.loading(
      'Syncing Data',
      'Fetching latest Instagram data. This may take a moment...'
    )
    
    try {
      const response = await api.syncInstagramData(selectedConnection.id)
      ToastManager.removeToast(loadingToastId)
      
      if (response.success) {
        ToastManager.success(
          'Sync Complete!',
          `Successfully synced ${response.synced_posts} posts from Instagram.`,
          [],
          5000
        )
        await loadDashboardData()
      }
    } catch (error) {
      console.error('Sync failed:', error)
      ToastManager.removeToast(loadingToastId)
      ToastManager.error(
        'Sync Failed',
        'Failed to sync data. Please try again.',
        [],
        5000
      )
    } finally {
      setSyncing(false)
    }
  }

  const handleGenerateSuggestions = async (postId) => {
    setGeneratingSuggestions(prev => ({ ...prev, [postId]: true }))
    const loadingToastId = ToastManager.loading(
      'Generating Suggestions',
      'AI is analyzing your post performance...'
    )
    
    try {
      const response = await api.generateInstagramSuggestions(postId)
      ToastManager.removeToast(loadingToastId)
      
      if (response.success) {
        setDashboardData(prev => ({
          ...prev,
          posts: prev.posts.map(p =>
            p.id === postId ? response.post : p
          )
        }))
        ToastManager.success(
          'Suggestions Generated!',
          'AI suggestions have been added to your post.',
          [],
          4000
        )
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
      ToastManager.removeToast(loadingToastId)
      ToastManager.error(
        'Generation Failed',
        'Failed to generate suggestions. Please try again.',
        [],
        5000
      )
    } finally {
      setGeneratingSuggestions(prev => ({ ...prev, [postId]: false }))
    }
  }

  const handleAddCompetitor = async (e) => {
    e.preventDefault()
    if (!newCompetitor.trim()) {
      ToastManager.validationError('Username', 'Please enter an Instagram username.')
      return
    }

    const loadingToastId = ToastManager.loading(
      'Adding Competitor',
      'Fetching competitor data from Instagram...'
    )
    
    try {
      const response = await api.addInstagramCompetitor(newCompetitor.trim())
      ToastManager.removeToast(loadingToastId)
      
      if (response.success) {
        setCompetitors([...competitors, response.competitor])
        setNewCompetitor('')
        
        if (response.note) {
          ToastManager.info(
            'Competitor Added',
            response.note,
            [],
            5000
          )
        } else {
          ToastManager.success(
            'Competitor Added!',
            `@${newCompetitor.trim()} has been added to your tracking list.`,
            [],
            4000
          )
        }
        
        await loadComparisonData()
      }
    } catch (error) {
      console.error('Failed to add competitor:', error)
      ToastManager.removeToast(loadingToastId)
      ToastManager.error(
        'Failed to Add',
        error.message || 'Failed to add competitor. Please try again.',
        [],
        5000
      )
    }
  }

  const handleRemoveCompetitor = async (competitorId) => {
    try {
      const response = await api.removeInstagramCompetitor(competitorId)
      if (response.success) {
        setCompetitors(competitors.filter(c => c.id !== competitorId))
        await loadComparisonData()
        ToastManager.success(
          'Competitor Removed',
          'Competitor has been removed from tracking.',
          [],
          3000
        )
      }
    } catch (error) {
      console.error('Failed to remove competitor:', error)
      ToastManager.error(
        'Removal Failed',
        'Failed to remove competitor. Please try again.',
        [],
        4000
      )
    }
  }

  // AI Feature Handlers
  const handleAnalyzeContentGaps = async () => {
    if (!selectedConnection) return
    
    setLoadingGaps(true)
    const loadingToastId = ToastManager.loading(
      'Analyzing Content',
      'AI is analyzing your content strategy...'
    )
    
    try {
      const response = await api.analyzeContentGaps(selectedConnection.id)
      ToastManager.removeToast(loadingToastId)
      
      if (response.success) {
        setContentGaps(response.analysis)
        ToastManager.success(
          'Analysis Complete!',
          `Found ${response.analysis.summary.total_gaps} content gaps to improve.`,
          [],
          4000
        )
      }
    } catch (error) {
      console.error('Failed to analyze gaps:', error)
      ToastManager.removeToast(loadingToastId)
      ToastManager.error(
        'Analysis Failed',
        'Failed to analyze content gaps. Please try again.',
        [],
        5000
      )
    } finally {
      setLoadingGaps(false)
    }
  }

  const handleOptimizeCaption = async () => {
    if (!selectedConnection || !captionToOptimize.trim()) {
      ToastManager.validationError('Caption', 'Please enter a caption to optimize.')
      return
    }
    
    setOptimizingCaption(true)
    const loadingToastId = ToastManager.loading(
      'Optimizing Caption',
      'AI is rewriting your caption for better engagement...'
    )
    
    try {
      const response = await api.optimizeCaption(captionToOptimize, selectedConnection.id)
      ToastManager.removeToast(loadingToastId)
      
      if (response.success) {
        setOptimizedCaption(response)
        ToastManager.success(
          'Caption Optimized!',
          'Your caption has been optimized with proven patterns.',
          [],
          4000
        )
      }
    } catch (error) {
      console.error('Failed to optimize caption:', error)
      ToastManager.removeToast(loadingToastId)
      ToastManager.error(
        'Optimization Failed',
        error.message || 'Failed to optimize caption. Please try again.',
        [],
        5000
      )
    } finally {
      setOptimizingCaption(false)
    }
  }

  const handlePredictPerformance = async () => {
    if (!selectedConnection || !postToPredict.caption.trim()) {
      ToastManager.validationError('Post Data', 'Please enter post details to predict performance.')
      return
    }
    
    setPredicting(true)
    const loadingToastId = ToastManager.loading(
      'Predicting Performance',
      'AI is analyzing similar posts to predict engagement...'
    )
    
    try {
      const response = await api.predictPerformance(postToPredict, selectedConnection.id)
      ToastManager.removeToast(loadingToastId)
      
      if (response.success) {
        setPrediction(response.prediction)
        ToastManager.success(
          'Prediction Complete!',
          `Predicted engagement: ${response.prediction.predicted_engagement}%`,
          [],
          4000
        )
      }
    } catch (error) {
      console.error('Failed to predict performance:', error)
      ToastManager.removeToast(loadingToastId)
      ToastManager.error(
        'Prediction Failed',
        error.message || 'Failed to predict performance. Please try again.',
        [],
        5000
      )
    } finally {
      setPredicting(false)
    }
  }

  const handleGenerateContentIdeas = async () => {
    if (!selectedConnection) return
    
    setGeneratingIdeas(true)
    const loadingToastId = ToastManager.loading(
      'Generating Ideas',
      'AI is creating personalized content ideas for you...'
    )
    
    try {
      const response = await api.generateContentIdeas(selectedConnection.id, niche)
      ToastManager.removeToast(loadingToastId)
      
      if (response.success) {
        setContentIdeas(response)
        ToastManager.success(
          'Ideas Generated!',
          `Created ${response.ideas.length} content ideas for you.`,
          [],
          4000
        )
      }
    } catch (error) {
      console.error('Failed to generate ideas:', error)
      ToastManager.removeToast(loadingToastId)
      ToastManager.error(
        'Generation Failed',
        error.message || 'Failed to generate content ideas. Please try again.',
        [],
        5000
      )
    } finally {
      setGeneratingIdeas(false)
    }
  }

  // ==================== ML FEATURE HANDLERS ====================
  
  const handleAnalyzePatterns = async () => {
    if (!selectedConnection) return
    
    setLoadingPatterns(true)
    const loadingToastId = ToastManager.loading('Analyzing Patterns', 'Running statistical analysis on your posts...')
    
    try {
      const response = await api.analyzePatterns(selectedConnection.id)
      ToastManager.removeToast(loadingToastId)
      
      if (response.success) {
        setPatterns(response)
        ToastManager.success(
          'Analysis Complete!',
          `Found ${response.recommendations.length} pattern-based recommendations.`,
          [],
          4000
        )
      }
    } catch (error) {
      console.error('Failed to analyze patterns:', error)
      ToastManager.removeToast(loadingToastId)
      ToastManager.error(
        'Analysis Failed',
        error.message || 'Failed to analyze patterns. Need at least 5 posts.',
        [],
        5000
      )
    } finally {
      setLoadingPatterns(false)
    }
  }

  const handleAnalyzeSentiment = async () => {
    if (!selectedConnection) return
    
    setLoadingSentiment(true)
    const loadingToastId = ToastManager.loading('Analyzing Sentiment', 'Processing comments with NLP...')
    
    try {
      const response = await api.analyzeSentiment(selectedConnection.id, [])
      ToastManager.removeToast(loadingToastId)
      
      if (response.success) {
        setSentiment(response)
        ToastManager.success(
          'Sentiment Analyzed!',
          `Analyzed ${response.total_comments_analyzed} comments.`,
          [],
          4000
        )
      }
    } catch (error) {
      console.error('Failed to analyze sentiment:', error)
      ToastManager.removeToast(loadingToastId)
      ToastManager.error(
        'Analysis Failed',
        error.message || 'Failed to analyze sentiment. Please try again.',
        [],
        5000
      )
    } finally {
      setLoadingSentiment(false)
    }
  }

  const handleTrainModel = async () => {
    if (!selectedConnection) return
    
    setTrainingModel(true)
    const loadingToastId = ToastManager.loading('Training Model', 'Training ML model on your data...')
    
    try {
      const response = await api.trainEngagementModel(selectedConnection.id)
      ToastManager.removeToast(loadingToastId)
      
      if (response.success) {
        setMlModel(response)
        ToastManager.success(
          'Model Trained!',
          `R² Score: ${response.r2_score} | Samples: ${response.training_samples}`,
          [],
          4000
        )
      }
    } catch (error) {
      console.error('Failed to train model:', error)
      ToastManager.removeToast(loadingToastId)
      ToastManager.error(
        'Training Failed',
        error.message || 'Failed to train model. Need at least 10 posts.',
        [],
        5000
      )
    } finally {
      setTrainingModel(false)
    }
  }

  const handlePredictML = async () => {
    if (!selectedConnection) return
    
    setPredictingML(true)
    const loadingToastId = ToastManager.loading('Predicting', 'Using ML model to predict engagement...')
    
    try {
      const response = await api.predictEngagementML(selectedConnection.id, mlPostData)
      ToastManager.removeToast(loadingToastId)
      
      if (response.success) {
        setMlPrediction(response)
        ToastManager.success(
          'Prediction Complete!',
          `Predicted: ${response.predicted_engagement}% engagement`,
          [],
          4000
        )
      }
    } catch (error) {
      console.error('Failed to predict:', error)
      ToastManager.removeToast(loadingToastId)
      ToastManager.error(
        'Prediction Failed',
        error.message || 'Failed to predict engagement. Train model first.',
        [],
        5000
      )
    } finally {
      setPredictingML(false)
    }
  }

  const handleGetOptimalTiming = async () => {
    if (!selectedConnection) return
    
    setLoadingTiming(true)
    const loadingToastId = ToastManager.loading('Analyzing Timing', 'Finding optimal posting times...')
    
    try {
      const response = await api.getOptimalPostingTime(selectedConnection.id, targetDate)
      ToastManager.removeToast(loadingToastId)
      
      if (response.success) {
        setOptimalTiming(response)
        ToastManager.success(
          'Timing Analyzed!',
          `Best time: ${response.best_time} on ${response.day_of_week}`,
          [],
          4000
        )
      }
    } catch (error) {
      console.error('Failed to get timing:', error)
      ToastManager.removeToast(loadingToastId)
      ToastManager.error(
        'Analysis Failed',
        error.message || 'Failed to analyze timing. Need at least 5 posts.',
        [],
        5000
      )
    } finally {
      setLoadingTiming(false)
    }
  }

  // Export functionality
  const handleExportCSV = () => {
    if (!dashboardData || !dashboardData.posts) {
      ToastManager.warning('No Data', 'No data available to export.', [], 3000)
      return
    }

    const csvContent = [
      ['Post ID', 'Caption', 'Type', 'Likes', 'Comments', 'Reach', 'Engagement Rate', 'Published Date'],
      ...dashboardData.posts.map(post => [
        post.id,
        `"${(post.caption || '').replace(/"/g, '""')}"`,
        post.media_type,
        post.like_count,
        post.comments_count,
        post.reach,
        post.engagement_rate,
        post.published_at
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `instagram-analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    ToastManager.success('Export Complete!', 'Your data has been exported to CSV.', [], 3000)
  }

  // Prepare chart data
  const getEngagementChartData = () => {
    if (!dashboardData?.posts) return []

    return dashboardData.posts
      .slice(0, 10)
      .reverse()
      .map((post, idx) => ({
        name: `Post ${idx + 1}`,
        engagement: post.engagement_rate,
        likes: post.like_count,
        comments: post.comments_count
      }))
  }

  const getPostTypeDistribution = () => {
    if (!dashboardData?.posts) return []

    const types = {}
    dashboardData.posts.forEach(post => {
      const type = post.media_type || 'UNKNOWN'
      types[type] = (types[type] || 0) + 1
    })

    return Object.entries(types).map(([name, value]) => ({ name, value }))
  }

  // Skeleton loader component
  const SkeletonLoader = () => (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-2xl w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded-xl w-1/2 mb-6"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass-card rounded-3xl p-6">
            <div className="h-12 w-12 bg-gray-300 dark:bg-gray-700 rounded-2xl mb-4"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-xl w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded-lg w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  )

  // No connection state
  if (connections.length === 0) {
    return (
      <div className="min-h-screen theme-transition relative">
        <ParticlesBackground />
        <FloatingEmojis />
        <Header />
        
        <div className="container mx-auto px-4 py-20 relative z-10 content-layer">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
              Connect Your Instagram Account
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed">
              Get powerful analytics, AI-powered suggestions, and competitor insights to grow your Instagram presence
            </p>
            <button
              onClick={handleConnectInstagram}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-4 rounded-3xl text-lg font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              Connect Instagram
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen theme-transition relative">
        <ParticlesBackground />
        <FloatingEmojis />
        <Header />
        
        <div className="container mx-auto px-4 py-20 relative z-10 content-layer">
          <SkeletonLoader />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen theme-transition relative overflow-hidden">
      <ParticlesBackground />
      <FloatingEmojis />
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 relative z-10 content-layer max-w-7xl">
        {/* Professional Header Section with Breadcrumb */}
        <div ref={titleRef} className="mb-10">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <a href="/dashboard" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Dashboard</a>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900 dark:text-white font-medium">Instagram Analytics</span>
          </nav>
          
          {/* Title Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl">
                <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
                  Instagram Analytics
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  @{selectedConnection?.instagram_username || 'Not Connected'}
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExportCSV}
                className="group flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-lg transition-all duration-300"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export</span>
              </button>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300"
              >
                <svg className={`w-5 h-5 ${syncing ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{syncing ? 'Syncing...' : 'Sync Data'}</span>
              </button>
            </div>
          </div>
          
          {/* Last Synced Info */}
          {selectedConnection?.last_synced_at && (
            <div className="mt-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-xl w-fit">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Last synced: {new Date(selectedConnection.last_synced_at).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Professional Tab Navigation */}
        <div ref={tabsRef} className="mb-8">
          <div className="glass-card rounded-2xl p-2 inline-flex gap-2">
            {[
              { id: 'dashboard', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
              { id: 'ai-insights', label: 'AI Insights', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
              { id: 'ml-insights', label: 'ML Insights', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z', badge: 'ML' },
              { id: 'posts', label: 'Posts', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
              { id: 'competitors', label: 'Competitors', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span>{tab.label}</span>
                {tab.id === 'ai-insights' && (
                  <span className="ml-1 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                    NEW
                  </span>
                )}
                {tab.badge && (
                  <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {/* AI Insights Tab */}
        {activeTab === 'ai-insights' && (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="glass-card rounded-3xl p-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    AI Strategy Engine
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    AI-powered insights that generate content and predict performance
                  </p>
                </div>
              </div>
            </div>

            {/* Content Gap Analysis */}
            <div className="glass-card rounded-3xl p-8 theme-transition">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Content Gap Analysis</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Discover what's missing in your content strategy</p>
                  </div>
                </div>
                <button onClick={handleAnalyzeContentGaps} disabled={loadingGaps} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-2xl hover:scale-105 disabled:opacity-50 transition-all duration-300 flex items-center gap-2">
                  <svg className={`w-5 h-5 ${loadingGaps ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loadingGaps ? 'Analyzing...' : 'Analyze Gaps'}
                </button>
              </div>
              {contentGaps ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-700">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{contentGaps.summary.total_gaps}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Gaps</div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-200 dark:border-red-700">
                      <div className="text-3xl font-bold text-red-600 dark:text-red-400">{contentGaps.summary.high_priority}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">High Priority</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-700">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">{contentGaps.summary.user_avg_engagement}%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Your Engagement</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border border-purple-200 dark:border-purple-700">
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{contentGaps.summary.competitor_avg_engagement}%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Competitor Avg</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {contentGaps.gaps.map((gap, idx) => (
                      <div key={idx} className={`rounded-2xl p-5 border-2 ${gap.severity === 'high' ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' : gap.severity === 'medium' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'}`}>
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${gap.severity === 'high' ? 'bg-red-500' : gap.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`}>{gap.priority}</div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{gap.title}</h4>
                            <p className="text-gray-700 dark:text-gray-300 mb-2">{gap.description}</p>
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">Recommendation: </span>
                              <span className="text-sm text-gray-700 dark:text-gray-300">{gap.recommendation}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400">Click "Analyze Gaps" to discover content opportunities</p>
                </div>
              )}
            </div>

            {/* Caption Optimizer */}
            <div className="glass-card rounded-3xl p-8 theme-transition">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">AI Caption Optimizer</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Rewrite captions based on your top-performing patterns</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Original Caption</label>
                  <textarea value={captionToOptimize} onChange={(e) => setCaptionToOptimize(e.target.value)} placeholder="Enter your caption here..." rows={4} className="w-full px-4 py-3 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
                </div>
                <button onClick={handleOptimizeCaption} disabled={optimizingCaption || !captionToOptimize.trim()} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-2xl font-semibold hover:shadow-2xl hover:scale-105 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2">
                  <svg className={`w-5 h-5 ${optimizingCaption ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {optimizingCaption ? 'Optimizing...' : 'Optimize Caption'}
                </button>
                {optimizedCaption && (
                  <div className="space-y-4 mt-6">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-5 border-2 border-green-300 dark:border-green-700">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Optimized Caption
                      </h4>
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">{optimizedCaption.optimized_caption}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 border border-blue-200 dark:border-blue-700">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Improvements Made:</h4>
                      <ul className="space-y-2">
                        {optimizedCaption.improvements.map((improvement, idx) => (
                          <li key={idx} className="flex gap-2 text-gray-700 dark:text-gray-300">
                            <span className="text-blue-500 font-semibold">{idx + 1}.</span>
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-5 border border-purple-200 dark:border-purple-700">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Predicted Impact:</h4>
                      <p className="text-gray-700 dark:text-gray-300">{optimizedCaption.predicted_improvement}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Predictor */}
            <div className="glass-card rounded-3xl p-8 theme-transition">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Performance Predictor</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Predict engagement before you post</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Post Type</label>
                    <select value={postToPredict.media_type} onChange={(e) => setPostToPredict({...postToPredict, media_type: e.target.value})} className="w-full px-4 py-3 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all">
                      <option value="IMAGE">Image</option>
                      <option value="VIDEO">Video</option>
                      <option value="CAROUSEL_ALBUM">Carousel</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Caption</label>
                  <textarea value={postToPredict.caption} onChange={(e) => setPostToPredict({...postToPredict, caption: e.target.value})} placeholder="Enter your post caption..." rows={4} className="w-full px-4 py-3 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all" />
                </div>
                <button onClick={handlePredictPerformance} disabled={predicting || !postToPredict.caption.trim()} className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-4 rounded-2xl font-semibold hover:shadow-2xl hover:scale-105 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2">
                  <svg className={`w-5 h-5 ${predicting ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {predicting ? 'Predicting...' : 'Predict Performance'}
                </button>
                {prediction && (
                  <div className="space-y-4 mt-6">
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border-2 border-orange-300 dark:border-orange-700">
                      <div className="text-center mb-4">
                        <div className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">{prediction.predicted_engagement}%</div>
                        <div className="text-lg text-gray-600 dark:text-gray-400 mt-2">Predicted Engagement Rate</div>
                        <div className={`inline-block mt-3 px-4 py-2 rounded-full font-semibold ${prediction.confidence === 'high' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : prediction.confidence === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>{prediction.confidence.toUpperCase()} Confidence</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">{prediction.similar_posts_analyzed}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Similar Posts</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">{prediction.multiplier}x</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Multiplier</div>
                        </div>
                      </div>
                    </div>
                    {prediction.reasoning && prediction.reasoning.length > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 border border-blue-200 dark:border-blue-700">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Why This Prediction:</h4>
                        <ul className="space-y-2">
                          {prediction.reasoning.map((reason, idx) => (
                            <li key={idx} className="flex gap-2 text-gray-700 dark:text-gray-300">
                              <span className="text-blue-500 font-semibold">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Content Ideas Generator */}
            <div className="glass-card rounded-3xl p-8 theme-transition">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">AI Content Ideas</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Generate personalized content ideas based on your data</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <input type="text" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Enter your niche (e.g., fitness, fashion, tech)" className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all" />
                  <button onClick={handleGenerateContentIdeas} disabled={generatingIdeas} className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-8 py-3 rounded-2xl font-semibold hover:shadow-2xl hover:scale-105 disabled:opacity-50 transition-all duration-300 flex items-center gap-2">
                    <svg className={`w-5 h-5 ${generatingIdeas ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {generatingIdeas ? 'Generating...' : 'Generate Ideas'}
                  </button>
                </div>
                {contentIdeas && contentIdeas.ideas && (
                  <div className="space-y-3 mt-6">
                    {contentIdeas.ideas.map((idea, idx) => (
                      <div key={idx} className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-2xl p-5 border-2 border-pink-200 dark:border-pink-700 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0">{idx + 1}</div>
                          <div className="flex-1">
                            <p className="text-gray-900 dark:text-white leading-relaxed">{idea}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!contentIdeas && !generatingIdeas && (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <p className="text-gray-600 dark:text-gray-400">Enter your niche and click "Generate Ideas" to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ML Insights Tab */}
        {activeTab === 'ml-insights' && (
          <div className="space-y-8">
            
            {/* Hero Section */}
            <div className="glass-card rounded-3xl p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    Machine Learning Insights
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    Statistical analysis, sentiment detection, and ML-powered predictions
                  </p>
                </div>
              </div>
            </div>

            {/* Pattern Recognition */}
            <div className="glass-card rounded-3xl p-8 theme-transition">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Pattern Recognition</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Statistical analysis of your content patterns</p>
                  </div>
                </div>
                <button 
                  onClick={handleAnalyzePatterns} 
                  disabled={loadingPatterns}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-xl hover:scale-105 disabled:opacity-50 transition-all duration-300 flex items-center gap-2"
                >
                  <svg className={`w-5 h-5 ${loadingPatterns ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {loadingPatterns ? 'Analyzing...' : 'Analyze Patterns'}
                </button>
              </div>
              
              {patterns && patterns.patterns && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-700 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">📝 Caption Length</h4>
                    <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{patterns.patterns.caption_length.optimal_length}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">characters</p>
                    <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Correlation: {patterns.patterns.caption_length.correlation.toFixed(3)}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Confidence: {patterns.patterns.caption_length.confidence}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border-2 border-indigo-200 dark:border-indigo-700 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">⏰ Best Posting Time</h4>
                    <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">{patterns.patterns.posting_time.peak_time}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">on {patterns.patterns.posting_time.peak_day}</p>
                    <div className="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Best hours: {patterns.patterns.posting_time.best_hours.join(', ')}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Confidence: {patterns.patterns.posting_time.confidence}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-700 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">🎬 Best Format</h4>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">{patterns.patterns.format.best_format}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{patterns.patterns.format.avg_engagement}% avg engagement</p>
                    <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400">{patterns.patterns.format.recommendation}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {!patterns && !loadingPatterns && (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400">Click "Analyze Patterns" to discover optimal content patterns</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Requires at least 5 posts</p>
                </div>
              )}
            </div>

            {/* ML Prediction */}
            <div className="glass-card rounded-3xl p-8 theme-transition">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">ML Engagement Prediction</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Train model and predict post performance using Linear Regression</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <button 
                  onClick={handleTrainModel} 
                  disabled={trainingModel}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-xl hover:scale-105 disabled:opacity-50 transition-all duration-300 flex items-center gap-2"
                >
                  <svg className={`w-5 h-5 ${trainingModel ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {trainingModel ? 'Training Model...' : 'Train ML Model'}
                </button>
                
                {mlModel && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4 border-2 border-green-200 dark:border-green-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">✅ Model Trained Successfully!</p>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">R² Score</p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">{mlModel.r2_score.toFixed(3)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Training Samples</p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">{mlModel.training_samples}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <select 
                    value={mlPostData.media_type} 
                    onChange={(e) => setMlPostData({...mlPostData, media_type: e.target.value})} 
                    className="px-4 py-3 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  >
                    <option value="IMAGE">📷 Image</option>
                    <option value="VIDEO">🎥 Video</option>
                    <option value="CAROUSEL_ALBUM">🎠 Carousel</option>
                  </select>
                  <button 
                    onClick={handlePredictML} 
                    disabled={predictingML || !mlModel}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-xl hover:scale-105 disabled:opacity-50 transition-all duration-300 flex items-center gap-2 justify-center"
                  >
                    <svg className={`w-5 h-5 ${predictingML ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {predictingML ? 'Predicting...' : 'Predict Engagement'}
                  </button>
                </div>
                
                <textarea 
                  value={mlPostData.caption} 
                  onChange={(e) => setMlPostData({...mlPostData, caption: e.target.value})} 
                  placeholder="Enter your caption here to predict engagement..." 
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" 
                  rows="4"
                />
                
                {mlPrediction && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-700 hover:shadow-lg transition-all duration-300">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Predicted Engagement</h4>
                    <p className="text-5xl font-bold text-green-600 dark:text-green-400 mb-3">{mlPrediction.predicted_engagement}%</p>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 mb-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Confidence Range: <span className="font-semibold text-gray-900 dark:text-white">{mlPrediction.confidence_range.min}% - {mlPrediction.confidence_range.max}%</span></p>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white">{mlPrediction.recommendation}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Optimal Timing */}
            <div className="glass-card rounded-3xl p-8 theme-transition">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Optimal Posting Time</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Find the best time to post based on historical data</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <input 
                    type="date" 
                    value={targetDate} 
                    onChange={(e) => setTargetDate(e.target.value)} 
                    className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all" 
                  />
                  <button 
                    onClick={handleGetOptimalTiming} 
                    disabled={loadingTiming}
                    className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-xl hover:scale-105 disabled:opacity-50 transition-all duration-300 flex items-center gap-2"
                  >
                    <svg className={`w-5 h-5 ${loadingTiming ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {loadingTiming ? 'Analyzing...' : 'Get Best Times'}
                  </button>
                </div>
                
                {optimalTiming && optimalTiming.recommendations && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    {optimalTiming.recommendations.slice(0, 3).map((rec, idx) => (
                      <div key={idx} className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border-2 border-orange-200 dark:border-orange-700 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">#{idx + 1} Best Time</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${rec.confidence === 'high' ? 'bg-green-500 text-white' : rec.confidence === 'medium' ? 'bg-yellow-500 text-white' : 'bg-gray-500 text-white'}`}>
                            {rec.confidence}
                          </span>
                        </div>
                        <p className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">{rec.time}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Expected: {rec.expected_engagement.toFixed(2)}% engagement</p>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
                          <p className="text-xs text-gray-600 dark:text-gray-400">{rec.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {!optimalTiming && !loadingTiming && (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-600 dark:text-gray-400">Select a date and click "Get Best Times" to find optimal posting times</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Requires at least 5 posts</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'dashboard' && dashboardData && (
          <div className="space-y-8">
            {/* Professional Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  label: 'Followers', 
                  value: dashboardData.metrics.followers_count.toLocaleString(), 
                  change: '+12.5%',
                  trend: 'up',
                  gradient: 'from-blue-500 to-indigo-600', 
                  icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' 
                },
                { 
                  label: 'Engagement Rate', 
                  value: `${dashboardData.metrics.avg_engagement_rate}%`, 
                  change: '+3.2%',
                  trend: 'up',
                  gradient: 'from-green-500 to-emerald-600', 
                  icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' 
                },
                { 
                  label: 'Total Reach', 
                  value: dashboardData.metrics.total_reach.toLocaleString(), 
                  change: '+8.1%',
                  trend: 'up',
                  gradient: 'from-purple-500 to-pink-600', 
                  icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' 
                },
                { 
                  label: 'Total Posts', 
                  value: dashboardData.metrics.total_posts, 
                  change: '+5',
                  trend: 'up',
                  gradient: 'from-orange-500 to-red-600', 
                  icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' 
                }
              ].map((stat, index) => (
                <div
                  key={index}
                  ref={el => statsRef.current[index] = el}
                  className="group glass-card rounded-3xl p-6 theme-transition hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden"
                >
                  {/* Background Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                        </svg>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        stat.trend === 'up' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        <svg className={`w-3 h-3 ${stat.trend === 'up' ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        <span>{stat.change}</span>
                      </div>
                    </div>
                    <div className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2 group-hover:scale-105 transition-transform duration-300">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div
                ref={el => cardsRef.current[0] = el}
                className="glass-card rounded-3xl p-6 theme-transition hover:shadow-2xl transition-all duration-300"
              >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Engagement Trends
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={getEngagementChartData()}>
                    <defs>
                      <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                        border: 'none', 
                        borderRadius: '12px',
                        color: '#fff'
                      }} 
                    />
                    <Area type="monotone" dataKey="engagement" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorEngagement)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div
                ref={el => cardsRef.current[1] = el}
                className="glass-card rounded-3xl p-6 theme-transition hover:shadow-2xl transition-all duration-300"
              >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Post Type Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getPostTypeDistribution()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getPostTypeDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                        border: 'none', 
                        borderRadius: '12px',
                        color: '#fff'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Underperforming Posts Section */}
            {dashboardData.underperforming_posts && dashboardData.underperforming_posts.length > 0 && (
              <div
                ref={el => cardsRef.current[2] = el}
                className="glass-card rounded-3xl p-8 mb-8 theme-transition border-2 border-red-200 dark:border-red-800"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Underperforming Posts ({dashboardData.underperforming_posts.length})
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                      These posts are performing below your average engagement rate
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {dashboardData.underperforming_posts.map(post => (
                    <div key={post.id} className="border-2 border-red-200 dark:border-red-800 rounded-2xl p-5 bg-red-50 dark:bg-red-900/20 hover:shadow-lg transition-all duration-300">
                      <div className="flex gap-4">
                        {post.media_url && (
                          <img
                            src={post.media_url}
                            alt="Post"
                            className="w-28 h-28 object-cover rounded-xl shadow-md"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                              {post.performance_score}% of avg
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full">
                              {post.media_type}
                            </span>
                          </div>
                          <p className="text-gray-900 dark:text-white mb-3 line-clamp-2 leading-relaxed">
                            {post.caption || 'No caption'}
                          </p>
                          <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400 mb-4">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                              </svg>
                              {post.like_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                              </svg>
                              {post.comments_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                              {post.engagement_rate}%
                            </span>
                          </div>

                          {post.ai_suggestions && post.ai_suggestions.length > 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mt-3 border border-gray-200 dark:border-gray-700">
                              <p className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                AI Suggestions:
                              </p>
                              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                {post.ai_suggestions.map((suggestion, idx) => (
                                  <li key={idx} className="flex gap-2">
                                    <span className="text-purple-500 font-semibold">{idx + 1}.</span>
                                    <span>{suggestion}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleGenerateSuggestions(post.id)}
                              disabled={generatingSuggestions[post.id]}
                              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2.5 rounded-2xl text-sm font-semibold hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                              {generatingSuggestions[post.id] ? 'Generating...' : 'Get AI Suggestions'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Posts Grid */}
            <div
              ref={el => cardsRef.current[3] = el}
              className="glass-card rounded-3xl p-8 theme-transition"
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Recent Posts
              </h3>
              {dashboardData.posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {dashboardData.posts.slice(0, 12).map(post => (
                    <div key={post.id} className="border-2 border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer bg-white dark:bg-gray-800">
                      {post.media_url && (
                        <img
                          src={post.media_url}
                          alt="Post"
                          className="w-full h-52 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full font-semibold">
                            {post.media_type}
                          </span>
                          {post.is_underperforming && (
                            <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Low
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2 leading-relaxed">
                          {post.caption || 'No caption'}
                        </p>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                            {post.like_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                            </svg>
                            {post.comments_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            {post.engagement_rate}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    No posts yet. Sync your data to see analytics.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && dashboardData && (
          <div className="glass-card rounded-3xl p-8 theme-transition">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              All Posts ({dashboardData.posts.length})
            </h3>
            {dashboardData.posts.length > 0 ? (
              <div className="space-y-5">
                {dashboardData.posts.map(post => (
                  <div key={post.id} className="border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-5 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 bg-white dark:bg-gray-800">
                    <div className="flex gap-5">
                      {post.media_url && (
                        <img
                          src={post.media_url}
                          alt="Post"
                          className="w-36 h-36 object-cover rounded-xl shadow-md"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full font-semibold">
                            {post.media_type}
                          </span>
                          {post.is_underperforming && (
                            <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Underperforming
                            </span>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                            {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Unknown date'}
                          </span>
                        </div>
                        <p className="text-gray-900 dark:text-white mb-4 leading-relaxed">
                          {post.caption || 'No caption'}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block text-xs">Likes</span>
                              <span className="font-bold text-gray-900 dark:text-white">{post.like_count}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block text-xs">Comments</span>
                              <span className="font-bold text-gray-900 dark:text-white">{post.comments_count}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block text-xs">Reach</span>
                              <span className="font-bold text-gray-900 dark:text-white">{post.reach}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block text-xs">Engagement</span>
                              <span className="font-bold text-gray-900 dark:text-white">{post.engagement_rate}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-xl">
                  No posts available. Sync your data to see posts.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Competitors Tab */}
        {activeTab === 'competitors' && (
          <div>
            {/* Add Competitor Form */}
            <div className="glass-card rounded-3xl p-8 mb-8 theme-transition">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Add Competitor
              </h3>
              <form onSubmit={handleAddCompetitor} className="flex gap-3">
                <input
                  type="text"
                  value={newCompetitor}
                  onChange={(e) => setNewCompetitor(e.target.value)}
                  placeholder="Enter Instagram username"
                  className="flex-1 px-6 py-4 rounded-3xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-3xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  Add
                </button>
              </form>
            </div>

            {/* Competitors List */}
            <div className="glass-card rounded-3xl p-8 mb-8 theme-transition">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Tracked Competitors ({competitors.length})
              </h3>
              {competitors.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-xl">
                    No competitors tracked yet. Add one above to start comparing.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {competitors.map(comp => (
                    <div key={comp.id} className="border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex justify-between items-center hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 bg-white dark:bg-gray-800">
                      <div>
                        <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                          @{comp.instagram_username}
                        </h4>
                        <div className="flex gap-6 text-sm">
                          <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="font-semibold">{comp.followers_count}</span> followers
                          </span>
                          <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-semibold">{comp.media_count}</span> posts
                          </span>
                          <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span className="font-semibold">{comp.avg_engagement_rate}%</span> engagement
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveCompetitor(comp.id)}
                        className="text-red-600 hover:text-white hover:bg-red-600 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 border-2 border-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comparison Chart */}
            {comparisonData && (
              <div className="glass-card rounded-3xl p-8 theme-transition">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                  Performance Comparison
                </h3>
                <ResponsiveContainer width="100%" height={450}>
                  <BarChart
                    data={[
                      comparisonData.user_account,
                      ...comparisonData.competitors
                    ].map(acc => ({
                      name: acc.username,
                      followers: acc.followers || acc.followers_count,
                      engagement: acc.avg_engagement_rate,
                      posts: acc.total_posts || acc.media_count
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                        border: 'none', 
                        borderRadius: '12px',
                        color: '#fff'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="followers" fill="#8b5cf6" name="Followers" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="engagement" fill="#ec4899" name="Engagement %" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
