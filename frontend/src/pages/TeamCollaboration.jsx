import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { gsap } from 'gsap'
import ParticlesBackground from '../components/ParticlesBackground'
import FloatingEmojis from '../components/FloatingEmojis'
import Header from '../components/Header'
import Footer from '../components/Footer'
import api from '../services/api'

const TeamCollaboration = () => {
  const { currentUser, backendUser } = useAuth()
  const [teamMembers, setTeamMembers] = useState([])
  const [projects, setProjects] = useState([])
  const [requests, setRequests] = useState([])
  const [conversations, setConversations] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [stats, setStats] = useState({
    team_members: 1,
    active_projects: 0,
    shared_content: 0,
    pending_requests: 0
  })
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newProjectName, setNewProjectName] = useState('')
  const [selectedProject, setSelectedProject] = useState(null)
  const [activeTab, setActiveTab] = useState('team') // 'team', 'projects', 'requests', 'chat'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [chatPollingInterval, setChatPollingInterval] = useState(null)
  const [showChatSettings, setShowChatSettings] = useState(false)
  const [chatSettings, setChatSettings] = useState({
    notifications: true,
    soundEnabled: true,
    enterToSend: true
  })
  
  const titleRef = useRef(null)
  const cardsRef = useRef([])
  const chatEndRef = useRef(null)

  // Load data from backend
  useEffect(() => {
    loadAllData()
    // Load chat settings from localStorage
    const savedSettings = localStorage.getItem('chatSettings')
    if (savedSettings) {
      try {
        setChatSettings(JSON.parse(savedSettings))
      } catch (error) {
        console.error('Error loading chat settings:', error)
      }
    }
  }, [])

  const loadAllData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load all data in parallel
      const [membersRes, projectsRes, requestsRes, statsRes, conversationsRes] = await Promise.all([
        api.getTeamMembers(),
        api.getTeamProjects(),
        api.getCollaborationRequests(),
        api.getTeamStats(),
        api.getChatConversations()
      ])
      
      if (membersRes.success) setTeamMembers(membersRes.members || [])
      if (projectsRes.success) setProjects(projectsRes.projects || [])
      if (requestsRes.success) setRequests(requestsRes.requests || [])
      if (statsRes.success) setStats(statsRes.stats)
      if (conversationsRes.success) setConversations(conversationsRes.conversations || [])
      
    } catch (error) {
      console.error('Error loading team data:', error)
      setError('Failed to load team data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (titleRef.current) {
      const tl = gsap.timeline({ delay: 0.3 })
      
      tl.fromTo(titleRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
      )
    }
  }, []) // Empty dependency array - only run once on mount

  // Auto-scroll chat to bottom (only when chat is active and selected)
  useEffect(() => {
    if (chatEndRef.current && selectedChat && activeTab === 'chat') {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, selectedChat, activeTab])

  // Poll for new messages when chat is open
  useEffect(() => {
    if (selectedChat && activeTab === 'chat') {
      // Load messages immediately
      loadChatMessages(selectedChat.user_id)
      
      // Set up polling every 3 seconds
      const interval = setInterval(() => {
        loadChatMessages(selectedChat.user_id, true) // silent reload
      }, 3000)
      
      setChatPollingInterval(interval)
      
      // Cleanup on unmount or when chat changes
      return () => {
        if (interval) clearInterval(interval)
      }
    } else {
      // Clear interval when leaving chat
      if (chatPollingInterval) {
        clearInterval(chatPollingInterval)
        setChatPollingInterval(null)
      }
    }
  }, [selectedChat, activeTab])

  // Reload conversations periodically to update unread counts (only on chat tab)
  useEffect(() => {
    if (activeTab === 'chat') {
      // Load immediately
      loadConversations()
      
      const interval = setInterval(() => {
        loadConversations()
      }, 5000) // Every 5 seconds
      
      return () => clearInterval(interval)
    }
  }, [activeTab])

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showChatSettings && !event.target.closest('.chat-settings-dropdown')) {
        setShowChatSettings(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showChatSettings])

  const loadConversations = async () => {
    try {
      const convRes = await api.getChatConversations()
      if (convRes.success) {
        setConversations(convRes.conversations || [])
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  const loadChatMessages = async (userId, silent = false) => {
    try {
      const response = await api.getChatMessages(userId)
      if (response.success) {
        setChatMessages(response.messages || [])
        if (!silent) {
          // Reload conversations to update unread count
          loadConversations()
        }
      }
    } catch (error) {
      if (!silent) {
        console.error('Error loading chat messages:', error)
      }
    }
  }

  const handleSelectChat = async (conversation) => {
    setSelectedChat(conversation)
    await loadChatMessages(conversation.user_id)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return
    
    try {
      const response = await api.sendChatMessage(selectedChat.user_id, newMessage.trim())
      if (response.success) {
        // Add message to local state immediately for instant feedback
        setChatMessages([...chatMessages, response.message])
        setNewMessage('')
        // Reload conversations to update last message
        loadConversations()
      }
    } catch (error) {
      alert(`⚠️ ${error.message || 'Failed to send message'}`)
    }
  }

  const handleClearChat = async () => {
    if (!selectedChat) return
    
    if (window.confirm(`Are you sure you want to clear all messages with ${selectedChat.user_name}? This action cannot be undone.`)) {
      try {
        const response = await api.clearChat(selectedChat.user_id)
        if (response.success) {
          setChatMessages([])
          loadConversations()
          alert('✅ Chat cleared successfully')
        }
      } catch (error) {
        alert(`⚠️ ${error.message || 'Failed to clear chat'}`)
      }
    }
  }

  const handleExportChat = async () => {
    if (!selectedChat) return
    
    try {
      const response = await api.exportChat(selectedChat.user_id)
      if (response.success) {
        // Create downloadable JSON file
        const dataStr = JSON.stringify(response.data, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `chat_${selectedChat.user_name}_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        alert('✅ Chat exported successfully')
      }
    } catch (error) {
      alert(`⚠️ ${error.message || 'Failed to export chat'}`)
    }
  }

  const handleToggleSetting = (setting) => {
    const newSettings = {
      ...chatSettings,
      [setting]: !chatSettings[setting]
    }
    setChatSettings(newSettings)
    localStorage.setItem('chatSettings', JSON.stringify(newSettings))
  }

  // Helper function to format timestamp in user's local timezone
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    // Just now (less than 60 seconds)
    if (diffInSeconds < 60) {
      return 'Just now'
    }
    
    // Minutes ago (less than 60 minutes)
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}m ago`
    }
    
    // Today - show time in 12-hour format with AM/PM
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-IN', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      })
    }
    
    // Yesterday
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${date.toLocaleTimeString('en-IN', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      })}`
    }
    
    // Older - show date and time in Indian format
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    })
  }

  const handleInviteMember = async () => {
    if (!newMemberEmail.trim()) {
      alert('⚠️ Please enter an email address')
      return
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newMemberEmail)) {
      alert('⚠️ Please enter a valid email address')
      return
    }

    try {
      const response = await api.inviteTeamMember(newMemberEmail.trim().toLowerCase())
      
      if (response.success) {
        setNewMemberEmail('')
        alert('✅ Invitation sent successfully!')
        // Reload data
        loadAllData()
      }
    } catch (error) {
      alert(`⚠️ ${error.message || 'Failed to send invitation'}`)
    }
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      alert('⚠️ Please enter a project name')
      return
    }

    try {
      const response = await api.createTeamProject({ name: newProjectName.trim() })
      
      if (response.success) {
        setNewProjectName('')
        alert('✅ Project created successfully!')
        // Reload data
        loadAllData()
      }
    } catch (error) {
      alert(`⚠️ ${error.message || 'Failed to create project'}`)
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      try {
        const response = await api.removeTeamMember(memberId)
        
        if (response.success) {
          alert('✅ Member removed successfully')
          // Reload data
          loadAllData()
        }
      } catch (error) {
        alert(`⚠️ ${error.message || 'Failed to remove member'}`)
      }
    }
  }

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        const response = await api.deleteTeamProject(projectId)
        
        if (response.success) {
          alert('✅ Project deleted successfully')
          // Reload data
          loadAllData()
        }
      } catch (error) {
        alert(`⚠️ ${error.message || 'Failed to delete project'}`)
      }
    }
  }

  const handleAcceptRequest = async (requestId) => {
    try {
      const response = await api.acceptRequest(requestId)
      
      if (response.success) {
        alert('✅ Request accepted! You are now part of the team.')
        // Reload data
        loadAllData()
      }
    } catch (error) {
      alert(`⚠️ ${error.message || 'Failed to accept request'}`)
    }
  }

  const handleRejectRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to reject this request?')) {
      try {
        const response = await api.rejectRequest(requestId)
        
        if (response.success) {
          alert('❌ Request rejected.')
          // Reload data
          loadAllData()
        }
      } catch (error) {
        alert(`⚠️ ${error.message || 'Failed to reject request'}`)
      }
    }
  }

  const getRoleColor = (role) => {
    const colors = {
      owner: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400',
      admin: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
      member: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
    }
    return colors[role] || colors.member
  }

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
      pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
      inactive: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
    }
    return colors[status] || colors.pending
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
              Team <span className="gradient-text">Collaboration</span>
            </h1>
            <p className="text-gray-700 dark:text-blue-200 text-lg font-normal max-w-2xl mx-auto theme-transition">
              Work together with your team to create amazing content.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="glass-card rounded-xl p-6 theme-transition">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.team_members}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Team Members</div>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-6 theme-transition">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📁</span>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.active_projects}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active Projects</div>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-6 theme-transition">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.shared_content}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Shared Content</div>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-6 theme-transition">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📬</span>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.pending_requests}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Pending Requests</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="glass-card rounded-2xl p-2 inline-flex space-x-2 theme-transition">
              <button
                onClick={() => setActiveTab('team')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'team'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                👥 Team Members
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'projects'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                📁 Projects
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all relative ${
                  activeTab === 'chat'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                � Chat
                {conversations.reduce((sum, c) => sum + c.unread_count, 0) > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {conversations.reduce((sum, c) => sum + c.unread_count, 0)}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all relative ${
                  activeTab === 'requests'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                📬 Requests
                {requests.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {requests.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Team Members Tab */}
          {activeTab === 'team' && (
            <div className="glass-card rounded-2xl p-8 theme-transition max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 theme-transition">
                Team Members
              </h2>

              {/* Invite Member */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-3 theme-transition">
                  Invite New Member
                </label>
                <div className="flex space-x-3">
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleInviteMember()}
                    placeholder="email@example.com"
                    className="form-input flex-1 p-3 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <button
                    onClick={handleInviteMember}
                    className="btn-primary px-6 rounded-xl"
                  >
                    ➕ Invite
                  </button>
                </div>
              </div>

              {/* Current User */}
              <div className="mb-4">
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {currentUser?.email?.[0].toUpperCase() || 'Y'}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {currentUser?.email || 'You'}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Owner</div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor('owner')}`}>
                      Owner
                    </span>
                  </div>
                </div>
              </div>

              {/* Team Members List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">⏳</div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Loading team members...
                    </p>
                  </div>
                ) : teamMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">👥</div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      No team members yet. Invite someone to collaborate!
                    </p>
                  </div>
                ) : (
                  teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 theme-transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">
                              {member.member_email[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {member.member_email}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              Invited {new Date(member.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(member.status)}`}>
                            {member.status}
                          </span>
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 p-2"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="glass-card rounded-2xl p-8 theme-transition max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 theme-transition">
                Projects
              </h2>

              {/* Create Project */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-3 theme-transition">
                  Create New Project
                </label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                    placeholder="Project name..."
                    className="form-input flex-1 p-3 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <button
                    onClick={handleCreateProject}
                    className="btn-primary px-6 rounded-xl"
                  >
                    ➕ Create
                  </button>
                </div>
              </div>

              {/* Projects List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">⏳</div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Loading projects...
                    </p>
                  </div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📁</div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      No projects yet. Create one to organize your team's content!
                    </p>
                  </div>
                ) : (
                  projects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 theme-transition hover:shadow-lg cursor-pointer"
                      onClick={() => setSelectedProject(project)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                            <span className="text-xl">📁</span>
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-gray-100">
                              {project.name}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              Created {new Date(project.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteProject(project.id)
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 p-2"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {project.members?.length || 0} member{(project.members?.length || 0) !== 1 ? 's' : ''}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="glass-card rounded-2xl p-8 theme-transition max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 theme-transition">
                Team Chat
              </h2>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Conversations List */}
                <div className="md:col-span-1 space-y-3 max-h-[600px] overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">⏳</div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Loading chats...</p>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">💬</div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        No team members to chat with yet.
                      </p>
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <div
                        key={conv.user_id}
                        onClick={() => handleSelectChat(conv)}
                        className={`p-4 rounded-xl cursor-pointer transition-all ${
                          selectedChat?.user_id === conv.user_id
                            ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg'
                        }`}
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">
                              {conv.user_name[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {conv.user_name}
                              </div>
                              {conv.last_message_time && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                  {formatMessageTime(conv.last_message_time)}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {conv.last_message || 'No messages yet'}
                            </div>
                          </div>
                          {conv.unread_count > 0 && (
                            <span className="w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Chat Messages */}
                <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col h-[600px] overflow-hidden">
                  {selectedChat ? (
                    <>
                      {/* Chat Header */}
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold">
                                {selectedChat.user_name[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 dark:text-gray-100">
                                {selectedChat.user_name}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {selectedChat.user_email}
                              </div>
                            </div>
                          </div>
                          
                          {/* Settings Button */}
                          <div className="relative chat-settings-dropdown">
                            <button
                              onClick={() => setShowChatSettings(!showChatSettings)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="Chat Settings"
                            >
                              <span className="text-xl">⚙️</span>
                            </button>
                            
                            {/* Settings Dropdown */}
                            {showChatSettings && (
                              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                                <div className="p-4">
                                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">Chat Settings</h3>
                                  
                                  {/* Settings Options */}
                                  <div className="space-y-3">
                                    <label className="flex items-center justify-between cursor-pointer">
                                      <span className="text-sm text-gray-700 dark:text-gray-300">Notifications</span>
                                      <input
                                        type="checkbox"
                                        checked={chatSettings.notifications}
                                        onChange={() => handleToggleSetting('notifications')}
                                        className="w-4 h-4 text-blue-600 rounded"
                                      />
                                    </label>
                                    
                                    <label className="flex items-center justify-between cursor-pointer">
                                      <span className="text-sm text-gray-700 dark:text-gray-300">Sound</span>
                                      <input
                                        type="checkbox"
                                        checked={chatSettings.soundEnabled}
                                        onChange={() => handleToggleSetting('soundEnabled')}
                                        className="w-4 h-4 text-blue-600 rounded"
                                      />
                                    </label>
                                    
                                    <label className="flex items-center justify-between cursor-pointer">
                                      <span className="text-sm text-gray-700 dark:text-gray-300">Enter to Send</span>
                                      <input
                                        type="checkbox"
                                        checked={chatSettings.enterToSend}
                                        onChange={() => handleToggleSetting('enterToSend')}
                                        className="w-4 h-4 text-blue-600 rounded"
                                      />
                                    </label>
                                  </div>
                                  
                                  <div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-3 space-y-2">
                                    <button
                                      onClick={handleExportChat}
                                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                      📥 Export Chat
                                    </button>
                                    
                                    <button
                                      onClick={handleClearChat}
                                      className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                      🗑️ Clear Chat
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {chatMessages.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="text-4xl mb-2">💬</div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                              No messages yet. Start the conversation!
                            </p>
                          </div>
                        ) : (
                          chatMessages.map((msg) => {
                            const isSentByMe = msg.sender_id === backendUser?.id
                            return (
                              <div
                                key={msg.id}
                                className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                    isSentByMe
                                      ? 'bg-blue-600 text-white rounded-br-sm'
                                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm'
                                  }`}
                                >
                                  <p className="break-words">{msg.message}</p>
                                  <div className={`text-xs mt-1 ${
                                    isSentByMe
                                      ? 'text-blue-100'
                                      : 'text-gray-500 dark:text-gray-400'
                                  }`}>
                                    {formatMessageTime(msg.created_at)}
                                  </div>
                                </div>
                              </div>
                            )
                          })
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Message Input */}
                      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex space-x-3">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && chatSettings.enterToSend) {
                                handleSendMessage()
                              }
                            }}
                            placeholder="Type a message..."
                            className="form-input flex-1 p-3 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                          />
                          <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            className="btn-primary px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Send
                          </button>
                        </div>
                        {chatSettings.enterToSend && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Press Enter to send • Shift+Enter for new line
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="text-6xl mb-4">💬</div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Select a conversation to start chatting
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="glass-card rounded-2xl p-8 theme-transition max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 theme-transition">
                  Collaboration Requests
                </h2>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">⏳</div>
                  <p className="text-gray-600 dark:text-gray-400">Loading requests...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📬</div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        No Pending Requests
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        You don't have any collaboration requests at the moment.
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        When someone invites you to their team, the request will appear here.
                      </p>
                    </div>
                  ) : (
                    requests.map((request) => (
                      <div
                        key={request.id}
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800 theme-transition"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-lg">
                                {(request.from_email || request.from_name || '?')[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                                {request.from_name || request.from_email}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                Requested {new Date(request.created_at).toLocaleDateString()} at {new Date(request.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 rounded-full text-xs font-semibold">
                            Pending
                          </span>
                        </div>

                        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
                          <p className="text-gray-900 dark:text-gray-100">
                            {request.message || 'Would like to collaborate with you on content creation.'}
                          </p>
                        </div>

                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
                          >
                            <span>✅</span>
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
                          >
                            <span>❌</span>
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Activity Feed */}
          <div className="mt-8 glass-card rounded-2xl p-8 theme-transition">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 theme-transition">
              📊 Team Activity
            </h2>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-12 text-center theme-transition">
              <div className="text-6xl mb-4">🚀</div>
              <p className="text-gray-600 dark:text-gray-400 theme-transition">
                Activity feed coming soon - track your team's content creation and collaboration
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default TeamCollaboration
