import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import ParticlesBackground from '../components/ParticlesBackground'
import FloatingEmojis from '../components/FloatingEmojis'
import Header from '../components/Header'
import Footer from '../components/Footer'
import apiService from '../services/api'
import ToastManager from '../utils/ToastManager'

const ContentLibrary = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [analytics, setAnalytics] = useState({})
  const [stats, setStats] = useState({
    total_content: 0,
    total_views: 0,
    avg_engagement: 0,
    top_performing: null
  })
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [searchSuggestions, setSearchSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [allContent, setAllContent] = useState([]) // Store all content for suggestions
  const [selectedItems, setSelectedItems] = useState(new Set()) // Bulk selection
  const [showExportMenu, setShowExportMenu] = useState(null) // Export menu for specific item
  const [viewMode, setViewMode] = useState('all') // 'all' or 'favorites'
  const [selectMode, setSelectMode] = useState(false) // Toggle select mode
  
  const titleRef = useRef(null)
  const cardsRef = useRef([])
  const searchInputRef = useRef(null)

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.3 })
    
    tl.fromTo(titleRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
    )
  }, [])

  useEffect(() => {
    fetchContent()
    fetchAnalytics()
  }, [filter, sortBy, viewMode])

  // Real-time search with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch()
      } else {
        // If search is empty, show all content
        fetchContent()
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, filter, sortBy])

  // Listen for library updates from Creator page
  useEffect(() => {
    const handleLibraryUpdate = () => {
      console.log('ContentLibrary: Library updated, reloading content')
      fetchContent()
    }
    
    window.addEventListener('content_library_updated', handleLibraryUpdate)
    
    return () => {
      window.removeEventListener('content_library_updated', handleLibraryUpdate)
    }
  }, [filter, sortBy, searchQuery])

  const fetchAnalytics = async () => {
    try {
      const [overviewResponse, performanceResponse] = await Promise.all([
        apiService.getAnalyticsOverview(30).catch(() => ({ success: false })),
        apiService.getContentPerformance(30, 10).catch(() => ({ success: false }))
      ])

      if (overviewResponse.success) {
        setStats({
          total_content: overviewResponse.overview?.total_content || 0,
          total_views: overviewResponse.overview?.total_views || 0,
          avg_engagement: overviewResponse.overview?.avg_engagement_rate || 0,
          top_performing: performanceResponse.success && performanceResponse.performance?.length > 0
            ? performanceResponse.performance[0]
            : null
        })
      }

      // Create analytics map for each content item
      if (performanceResponse.success && performanceResponse.performance) {
        const analyticsMap = {}
        performanceResponse.performance.forEach(item => {
          analyticsMap[item.content_id] = {
            views: item.total_views || 0,
            engagement: item.engagement_rate || 0,
            clicks: item.total_clicks || 0
          }
        })
        setAnalytics(analyticsMap)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const fetchContent = async () => {
    try {
      setLoading(true)
      
      // Load from localStorage first
      const libraryContent = JSON.parse(localStorage.getItem('content_genie_library') || '[]')
      console.log('ContentLibrary: Loaded from localStorage:', libraryContent.length, 'items')
      
      // Try to fetch from backend
      const response = await apiService.getContent({
        type: filter !== 'all' ? filter : undefined,
        sort_by: sortBy,
        sort_order: 'desc',
        search: searchQuery || undefined
      }).catch(() => ({ success: false }))
      
      let backendContent = []
      if (response.success) {
        backendContent = response.content || []
      }
      
      // Merge localStorage content with backend content
      // Convert localStorage format to match backend format
      const formattedLibraryContent = libraryContent.map(item => ({
        id: item.id,
        title: item.title,
        content_type: item.category,
        word_count: item.word_count,
        created_at: item.timestamp,
        status: 'draft',
        is_favorite: item.is_favorite === true, // Ensure is_favorite is boolean
        tone: item.tone,
        image: item.image,
        content: item.content
      }))
      
      // Combine and remove duplicates (prefer localStorage version)
      const backendIds = new Set(backendContent.map(item => item.id))
      const uniqueLibraryContent = formattedLibraryContent.filter(item => !backendIds.has(item.id))
      
      // Merge arrays - ONLY use localStorage content to avoid duplicates
      const mergedContent = formattedLibraryContent
      
      console.log('ContentLibrary: localStorage items:', libraryContent.length)
      console.log('ContentLibrary: Backend items:', backendContent.length)
      console.log('ContentLibrary: Total merged (no duplicates):', mergedContent.length)
      
      // Store all content for suggestions
      setAllContent(mergedContent)
      
      // Apply filters
      let filteredContent = mergedContent
      if (filter !== 'all') {
        filteredContent = mergedContent.filter(item => item.content_type === filter)
      }
      
      // Apply favorites filter
      if (viewMode === 'favorites') {
        filteredContent = filteredContent.filter(item => item.is_favorite === true)
      }
      
      // Apply sorting
      filteredContent.sort((a, b) => {
        if (sortBy === 'created_at') {
          return new Date(b.created_at) - new Date(a.created_at)
        } else if (sortBy === 'title') {
          return (a.title || '').localeCompare(b.title || '')
        } else if (sortBy === 'word_count') {
          return (b.word_count || 0) - (a.word_count || 0)
        }
        return 0
      })
      
      setContent(filteredContent)
      
      // Update stats to include localStorage content
      const favoritesCount = mergedContent.filter(item => item.is_favorite === true).length
      
      console.log('ContentLibrary Stats Update:')
      console.log('- Total items:', mergedContent.length)
      console.log('- Favorites:', favoritesCount)
      console.log('- View mode:', viewMode)
      console.log('- Filtered content:', filteredContent.length)
      
      setStats(prev => ({
        ...prev,
        total_content: mergedContent.length,
        favorites_count: favoritesCount
      }))
      
    } catch (error) {
      console.error('Error fetching content:', error)
      setContent([])
    } finally {
      setLoading(false)
    }
  }

  const performSearch = () => {
    if (!searchQuery.trim()) {
      setContent(allContent)
      setShowSuggestions(false)
      return
    }

    const query = searchQuery.toLowerCase().trim()
    
    // Filter content based on search query
    let filteredContent = allContent.filter(item => {
      const titleMatch = item.title?.toLowerCase().includes(query)
      const contentMatch = item.content?.toLowerCase().includes(query)
      const typeMatch = item.content_type?.toLowerCase().includes(query)
      const toneMatch = item.tone?.toLowerCase().includes(query)
      
      return titleMatch || contentMatch || typeMatch || toneMatch
    })

    // Apply type filter
    if (filter !== 'all') {
      filteredContent = filteredContent.filter(item => item.content_type === filter)
    }

    // Apply sorting
    filteredContent.sort((a, b) => {
      if (sortBy === 'created_at') {
        return new Date(b.created_at) - new Date(a.created_at)
      } else if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '')
      } else if (sortBy === 'word_count') {
        return (b.word_count || 0) - (a.word_count || 0)
      }
      return 0
    })

    setContent(filteredContent)
  }

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)

    if (value.trim().length >= 2) {
      // Generate suggestions
      const query = value.toLowerCase().trim()
      const suggestions = []
      const seenSuggestions = new Set()

      allContent.forEach(item => {
        // Title suggestions
        if (item.title?.toLowerCase().includes(query) && !seenSuggestions.has(item.title)) {
          suggestions.push({
            type: 'title',
            text: item.title,
            icon: '📄',
            contentType: item.content_type
          })
          seenSuggestions.add(item.title)
        }

        // Content type suggestions
        if (item.content_type?.toLowerCase().includes(query) && !seenSuggestions.has(item.content_type)) {
          suggestions.push({
            type: 'content_type',
            text: item.content_type,
            icon: '🏷️',
            contentType: item.content_type
          })
          seenSuggestions.add(item.content_type)
        }

        // Tone suggestions
        if (item.tone?.toLowerCase().includes(query) && !seenSuggestions.has(item.tone)) {
          suggestions.push({
            type: 'tone',
            text: item.tone,
            icon: '🎨',
            contentType: item.content_type
          })
          seenSuggestions.add(item.tone)
        }

        // Content snippet suggestions (first 50 chars)
        if (item.content?.toLowerCase().includes(query)) {
          const index = item.content.toLowerCase().indexOf(query)
          const start = Math.max(0, index - 20)
          const end = Math.min(item.content.length, index + 50)
          const snippet = item.content.substring(start, end)
          const suggestionText = `...${snippet}...`
          
          if (!seenSuggestions.has(suggestionText)) {
            suggestions.push({
              type: 'content',
              text: suggestionText,
              icon: '💬',
              contentType: item.content_type,
              fullTitle: item.title
            })
            seenSuggestions.add(suggestionText)
          }
        }
      })

      // Limit to 8 suggestions
      setSearchSuggestions(suggestions.slice(0, 8))
      setShowSuggestions(suggestions.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.text)
    setShowSuggestions(false)
    // Trigger search immediately
    setTimeout(() => performSearch(), 100)
  }

  const handleSearchClear = () => {
    setSearchQuery('')
    setShowSuggestions(false)
    fetchContent()
  }

  // Bulk selection functions
  const toggleSelect = (id) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  const selectAll = () => {
    if (selectedItems.size === content.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(content.map(item => item.id)))
    }
  }

  const toggleSelectMode = () => {
    setSelectMode(!selectMode)
    if (selectMode) {
      // Exiting select mode, clear selections
      setSelectedItems(new Set())
    }
  }

  const bulkDelete = async () => {
    if (selectedItems.size === 0) return
    
    try {
      const library = JSON.parse(localStorage.getItem('content_genie_library') || '[]')
      const updatedLibrary = library.filter(item => !selectedItems.has(item.id))
      localStorage.setItem('content_genie_library', JSON.stringify(updatedLibrary))
      
      // Update state
      setContent(content.filter(item => !selectedItems.has(item.id)))
      setAllContent(allContent.filter(item => !selectedItems.has(item.id)))
      
      // Clear selection and exit select mode
      setSelectedItems(new Set())
      setSelectMode(false)
      setSelectedItems(new Set())
      
      // Dispatch event
      window.dispatchEvent(new Event('content_library_updated'))
      
      ToastManager.success(
        'Bulk Delete Complete',
        `Deleted ${selectedItems.size} item${selectedItems.size > 1 ? 's' : ''} from your library.`,
        [],
        3000
      )
    } catch (error) {
      console.error('Error bulk deleting:', error)
      ToastManager.error('Bulk Delete Failed', 'Failed to delete items. Please try again.')
    }
  }

  const bulkFavorite = () => {
    if (selectedItems.size === 0) return
    
    try {
      const library = JSON.parse(localStorage.getItem('content_genie_library') || '[]')
      const updatedLibrary = library.map(item => 
        selectedItems.has(item.id) ? { ...item, is_favorite: true } : item
      )
      localStorage.setItem('content_genie_library', JSON.stringify(updatedLibrary))
      
      fetchContent()
      setSelectedItems(new Set())
      setSelectMode(false)
      
      ToastManager.success(
        'Added to Favorites',
        `${selectedItems.size} item${selectedItems.size > 1 ? 's' : ''} added to favorites.`,
        [],
        3000
      )
    } catch (error) {
      console.error('Error bulk favoriting:', error)
      ToastManager.error('Favorite Failed', 'Failed to favorite items. Please try again.')
    }
  }

  const bulkUnfavorite = () => {
    if (selectedItems.size === 0) return
    
    try {
      const library = JSON.parse(localStorage.getItem('content_genie_library') || '[]')
      const updatedLibrary = library.map(item => 
        selectedItems.has(item.id) ? { ...item, is_favorite: false } : item
      )
      localStorage.setItem('content_genie_library', JSON.stringify(updatedLibrary))
      
      fetchContent()
      setSelectedItems(new Set())
      setSelectMode(false)
      
      ToastManager.success(
        'Removed from Favorites',
        `${selectedItems.size} item${selectedItems.size > 1 ? 's' : ''} removed from favorites.`,
        [],
        3000
      )
    } catch (error) {
      console.error('Error bulk unfavoriting:', error)
      ToastManager.error('Unfavorite Failed', 'Failed to unfavorite items. Please try again.')
    }
  }

  // Favorite toggle function
  const toggleFavorite = (e, id) => {
    e.stopPropagation()
    
    try {
      // Get library from localStorage
      const library = JSON.parse(localStorage.getItem('content_genie_library') || '[]')
      
      // Find the item and get current favorite status
      const itemIndex = library.findIndex(i => i.id === id)
      
      if (itemIndex === -1) {
        console.error('Item not found in library:', id)
        ToastManager.error('Error', 'Content not found in library.')
        return
      }
      
      const currentItem = library[itemIndex]
      const isFavorite = currentItem.is_favorite === true
      const newFavoriteStatus = !isFavorite
      
      // Update the item
      library[itemIndex] = {
        ...currentItem,
        is_favorite: newFavoriteStatus
      }
      
      // Save back to localStorage
      localStorage.setItem('content_genie_library', JSON.stringify(library))
      
      console.log('Toggled favorite for:', id)
      console.log('- Previous status:', isFavorite)
      console.log('- New status:', newFavoriteStatus)
      console.log('- Item title:', currentItem.title)
      
      // Refresh content to show changes
      fetchContent()
      
      ToastManager.success(
        newFavoriteStatus ? 'Added to Favorites' : 'Removed from Favorites',
        newFavoriteStatus ? 'Content added to favorites.' : 'Content removed from favorites.',
        [],
        2000
      )
    } catch (error) {
      console.error('Error toggling favorite:', error)
      ToastManager.error('Favorite Failed', 'Failed to update favorite status.')
    }
  }

  // Export functions
  const exportToClipboard = async (item) => {
    try {
      const exportText = `${item.title}\n\n${item.content}\n\n---\nType: ${item.content_type}\nTone: ${item.tone}\nWords: ${item.word_count}\nCreated: ${new Date(item.created_at).toLocaleDateString()}`
      await navigator.clipboard.writeText(exportText)
      ToastManager.copySuccess()
    } catch (error) {
      console.error('Error copying:', error)
      ToastManager.error('Copy Failed', 'Failed to copy to clipboard.')
    }
  }

  const exportToTXT = (item) => {
    const content = `${item.title}\n\n${item.content}\n\n---\nType: ${item.content_type}\nTone: ${item.tone}\nWords: ${item.word_count}\nCreated: ${new Date(item.created_at).toLocaleDateString()}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${item.title.substring(0, 50)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    ToastManager.success('Export Complete', 'Content exported as TXT file.', [], 2000)
  }

  const exportToMarkdown = (item) => {
    const content = `# ${item.title}\n\n${item.content}\n\n---\n\n**Type:** ${item.content_type}  \n**Tone:** ${item.tone}  \n**Words:** ${item.word_count}  \n**Created:** ${new Date(item.created_at).toLocaleDateString()}`
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${item.title.substring(0, 50)}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    ToastManager.success('Export Complete', 'Content exported as Markdown file.', [], 2000)
  }

  const bulkExport = () => {
    if (selectedItems.size === 0) return
    
    try {
      const selectedContent = content.filter(item => selectedItems.has(item.id))
      let exportText = ''
      
      selectedContent.forEach((item, index) => {
        exportText += `${'='.repeat(80)}\n`
        exportText += `CONTENT ${index + 1} of ${selectedContent.length}\n`
        exportText += `${'='.repeat(80)}\n\n`
        exportText += `${item.title}\n\n`
        exportText += `${item.content}\n\n`
        exportText += `---\n`
        exportText += `Type: ${item.content_type} | Tone: ${item.tone} | Words: ${item.word_count}\n`
        exportText += `Created: ${new Date(item.created_at).toLocaleDateString()}\n\n\n`
      })
      
      const blob = new Blob([exportText], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `content-library-export-${Date.now()}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setSelectedItems(new Set())
      setSelectMode(false)
      
      ToastManager.success(
        'Bulk Export Complete',
        `Exported ${selectedContent.length} item${selectedContent.length > 1 ? 's' : ''} to TXT file.`,
        [],
        3000
      )
    } catch (error) {
      console.error('Error bulk exporting:', error)
      ToastManager.error('Export Failed', 'Failed to export items. Please try again.')
    }
  }

  const handleDelete = async (id) => {
    try {
      // Try to delete from backend
      await apiService.deleteContent(id).catch(() => {
        console.log('Content not in backend, deleting from localStorage only')
      })
      
      // Also delete from localStorage
      const library = JSON.parse(localStorage.getItem('content_genie_library') || '[]')
      const updatedLibrary = library.filter(item => item.id !== id)
      localStorage.setItem('content_genie_library', JSON.stringify(updatedLibrary))
      
      // Update local state
      setContent(content.filter(item => item.id !== id))
      
      // Dispatch event to update Dashboard
      window.dispatchEvent(new Event('content_library_updated'))
      
      // Close modal and show success toast
      setDeleteConfirmId(null)
      ToastManager.success(
        'Content Deleted',
        'The content has been removed from your library.',
        [],
        3000
      )
    } catch (error) {
      console.error('Error deleting content:', error)
      ToastManager.error(
        'Delete Failed',
        'Failed to delete content. Please try again.',
        [],
        4000
      )
    }
  }

  const handleContinueGenerating = (item) => {
    // Store the content data in sessionStorage to load in Creator
    const continueData = {
      content: item.content,
      contentType: item.content_type,
      tone: item.tone || 'professional',
      prompt: item.title,
      timestamp: Date.now()
    }
    
    sessionStorage.setItem('continue_generating', JSON.stringify(continueData))
    
    // Navigate to Creator page
    navigate('/creator')
  }

  const getTypeIcon = (type) => {
    const icons = {
      'article': '📄',
      'social-post': '📱',
      'email': '📧',
      'blog': '📝',
      'caption': '💬',
      'script': '🎬',
      'ad-copy': '📢'
    }
    return icons[type] || '📄'
  }

  const getStatusColor = (status) => {
    const colors = {
      'draft': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
      'published': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
      'archived': 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
    }
    return colors[status] || colors.draft
  }

  return (
    <div className="min-h-screen theme-transition relative">
      <ParticlesBackground />
      <FloatingEmojis />
      
      <Header />

      <main className="pt-24 pb-12 relative z-10 content-layer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title Section */}
          <div ref={titleRef} className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
              Content <span className="gradient-text">Library</span>
            </h1>
            <p className="text-gray-700 dark:text-blue-200 text-lg font-normal max-w-2xl mx-auto theme-transition">
              Manage, organize, and discover all your AI-generated content in one place.
            </p>
          </div>

          {/* Analytics Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-card rounded-xl p-4 theme-transition">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-lg">📝</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_content}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Total Items</div>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 theme-transition cursor-pointer hover:shadow-lg" onClick={() => setViewMode('favorites')}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-lg">⭐</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.favorites_count || 0}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Favorites</div>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 theme-transition">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-lg">📈</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.avg_engagement}%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Avg Engagement</div>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 theme-transition">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🔥</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                    {stats.top_performing ? stats.top_performing.title.substring(0, 15) + '...' : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Top Content</div>
                </div>
              </div>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  viewMode === 'all'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                📚 All Content
              </button>
              <button
                onClick={() => setViewMode('favorites')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  viewMode === 'favorites'
                    ? 'bg-yellow-600 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                ⭐ Favorites ({stats.favorites_count || 0})
              </button>
            </div>
            
            {content.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={toggleSelectMode}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    selectMode
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {selectMode ? '✓ Select Mode' : '☐ Select'}
                </button>
                {selectMode && (
                  <button
                    onClick={selectAll}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all"
                  >
                    {selectedItems.size === content.length ? '☑️ Deselect All' : '☐ Select All'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bulk Actions Bar */}
          {selectedItems.size > 0 && selectMode && (
            <div className="glass-card rounded-2xl p-4 mb-6 theme-transition border-2 border-blue-500 dark:border-blue-400 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{selectedItems.size}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex space-x-2">
                  {viewMode === 'favorites' ? (
                    <button
                      onClick={bulkUnfavorite}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition-all flex items-center space-x-2"
                    >
                      <span>☆</span>
                      <span>Remove from Favorites</span>
                    </button>
                  ) : (
                    <button
                      onClick={bulkFavorite}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-medium transition-all flex items-center space-x-2"
                    >
                      <span>⭐</span>
                      <span>Favorite</span>
                    </button>
                  )}
                  <button
                    onClick={bulkExport}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all flex items-center space-x-2"
                  >
                    <span>📥</span>
                    <span>Export</span>
                  </button>
                  <button
                    onClick={bulkDelete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all flex items-center space-x-2"
                  >
                    <span>🗑️</span>
                    <span>Delete</span>
                  </button>
                  <button
                    onClick={() => setSelectedItems(new Set())}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="glass-card rounded-2xl p-6 mb-8 theme-transition relative z-30">
            <div className="grid md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2 relative z-40">
                <div className="flex space-x-2">
                  <div className="relative flex-1 z-50">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder="Search by title, content, type, or tone..."
                      className="form-input w-full p-3 rounded-xl pr-10"
                    />
                    {searchQuery && (
                      <button
                        onClick={handleSearchClear}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    )}
                    
                    {/* Search Suggestions Dropdown */}
                    {showSuggestions && searchSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-[100] animate-fadeIn">
                        <div className="p-2">
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2 uppercase tracking-wide">
                            Suggestions
                          </div>
                          {searchSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                            >
                              <div className="flex items-start space-x-3">
                                <span className="text-xl flex-shrink-0 mt-0.5">{suggestion.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                    {suggestion.text}
                                  </div>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                      {suggestion.type === 'content_type' ? 'Type' : 
                                       suggestion.type === 'tone' ? 'Tone' : 
                                       suggestion.type === 'content' ? 'Content' : 'Title'}
                                    </span>
                                    {suggestion.contentType && (
                                      <>
                                        <span className="text-xs text-gray-400">•</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                          {suggestion.contentType}
                                        </span>
                                      </>
                                    )}
                                    {suggestion.fullTitle && (
                                      <>
                                        <span className="text-xs text-gray-400">•</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                          {suggestion.fullTitle}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={performSearch}
                    className="btn-primary px-6 rounded-xl flex items-center space-x-2"
                  >
                    <span>🔍</span>
                    <span className="hidden sm:inline">Search</span>
                  </button>
                </div>
                
                {/* Search Results Count */}
                {searchQuery && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Found {content.length} result{content.length !== 1 ? 's' : ''} for "{searchQuery}"
                  </div>
                )}
              </div>

              {/* Filter by Type */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="form-input p-3 rounded-xl"
              >
                <option value="all">All Types</option>
                <option value="article">Articles</option>
                <option value="social-post">Social Posts</option>
                <option value="email">Emails</option>
                <option value="blog">Blogs</option>
                <option value="caption">Captions</option>
                <option value="script">Scripts</option>
                <option value="ad-copy">Ad Copy</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-input p-3 rounded-xl"
              >
                <option value="created_at">Latest First</option>
                <option value="title">Title A-Z</option>
                <option value="word_count">Word Count</option>
              </select>
            </div>
          </div>

          {/* Content Grid */}
          {loading ? (
            <div className="text-center py-20">
              <div className="loading-spinner mx-auto mb-4"></div>
              <p className="text-white">Loading content...</p>
            </div>
          ) : content.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center theme-transition">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 theme-transition">
                No content yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 theme-transition">
                Start creating amazing content with AI
              </p>
              <button
                onClick={() => navigate('/creator')}
                className="btn-primary px-8 py-3 rounded-xl"
              >
                Create Content
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
              {content.map((item, index) => {
                const itemAnalytics = analytics[item.id] || { views: 0, engagement: 0, clicks: 0 }
                return (
                  <div
                    key={item.id}
                    ref={el => cardsRef.current[index] = el}
                    className="glass-card rounded-3xl p-6 theme-transition hover:shadow-lg cursor-pointer group relative"
                    onClick={() => !selectedItems.has(item.id) && navigate(`/content/${item.id}`)}
                  >
                    {/* Selection Checkbox - Only show in select mode */}
                    {selectMode && (
                      <div className="absolute top-4 left-4 z-10">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={(e) => {
                            e.stopPropagation()
                            toggleSelect(item.id)
                          }}
                          className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                        />
                      </div>
                    )}

                    {/* Favorite Star */}
                    <div className="absolute top-4 right-4 z-10">
                      <button
                        onClick={(e) => toggleFavorite(e, item.id)}
                        className="text-2xl hover:scale-110 transition-transform"
                      >
                        {item.is_favorite ? '⭐' : '☆'}
                      </button>
                    </div>

                    <div className="flex items-start justify-between mb-4 mt-8">
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl">{getTypeIcon(item.content_type)}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 dark:text-gray-100 theme-transition truncate">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 theme-transition">
                            {item.word_count} words
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Analytics Metrics */}
                    {(itemAnalytics.views > 0 || itemAnalytics.engagement > 0) && (
                      <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{itemAnalytics.views}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Views</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">{itemAnalytics.engagement}%</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Engage</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{itemAnalytics.clicks}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Clicks</div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {item.content && (
                      <div className="mb-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleContinueGenerating(item)
                          }}
                          className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl font-medium transition-all flex items-center justify-center space-x-2"
                        >
                          <span>✨</span>
                          <span>Continue Generating</span>
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)} theme-transition`}>
                        {item.status}
                      </span>
                      <div className="flex space-x-2 relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowExportMenu(showExportMenu === item.id ? null : item.id)
                          }}
                          className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                          title="Export"
                        >
                          📥
                        </button>
                        
                        {/* Export Menu */}
                        {showExportMenu === item.id && (
                          <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50 min-w-[160px] animate-fadeIn">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                exportToClipboard(item)
                                setShowExportMenu(null)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                            >
                              📋 Copy
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                exportToTXT(item)
                                setShowExportMenu(null)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                            >
                              📄 Export TXT
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                exportToMarkdown(item)
                                setShowExportMenu(null)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                            >
                              📝 Export MD
                            </button>
                          </div>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/content/${item.id}/edit`)
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirmId(item.id)
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 theme-transition">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Created {new Date(item.created_at).toLocaleDateString()}</span>
                        {itemAnalytics.views > 0 && (
                          <span className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span>Active</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-md mx-4 animate-fadeIn">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">🗑️</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Delete Content?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">This action cannot be undone.</p>
              </div>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete this content from your library? This will permanently remove it.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-2xl font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-2xl font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default ContentLibrary
