import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { gsap } from 'gsap'
import { UserPlus, Trash2, CheckCircle, Circle, PlayCircle, ArrowLeft, Users as UsersIcon, ListTodo, Settings, X, Link as LinkIcon, BarChart3, MessageCircle, Send, Copy, Check } from 'lucide-react'
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
  const [projectView, setProjectView] = useState('list') // 'list', 'detail', 'manage'
  const [projectTasks, setProjectTasks] = useState([]) // Tasks for selected project
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskAssignee, setNewTaskAssignee] = useState('')
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [showInviteLinkModal, setShowInviteLinkModal] = useState(false)
  const [invitationLink, setInvitationLink] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [showProjectReportModal, setShowProjectReportModal] = useState(false)
  const [projectReport, setProjectReport] = useState(null)
  const [showProjectChat, setShowProjectChat] = useState(false)
  const [projectChatMessages, setProjectChatMessages] = useState([])
  const [projectChatInput, setProjectChatInput] = useState('')
  const [userDirectory, setUserDirectory] = useState([])
  const [teamActivity, setTeamActivity] = useState([])
  const [notifications, setNotifications] = useState([])
  const [showNotificationPopup, setShowNotificationPopup] = useState(false)
  const [newNotification, setNewNotification] = useState(null)
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
    
    // Check for pending project invitations
    checkPendingInvitations()
  }, [])

  const checkPendingInvitations = async () => {
    console.log('🔍 Checking for pending invitations...')
    console.log('Current user email:', currentUser?.email)
    
    if (!currentUser?.email) {
      console.warn('⚠️ No current user email found')
      return
    }
    
    try {
      // Check for project_invitation type requests
      const requestsRes = await api.getCollaborationRequests()
      
      if (requestsRes.success) {
        const projectInvitations = requestsRes.requests.filter(r => r.request_type === 'project_invitation')
        console.log('📬 Pending project invitations found:', projectInvitations.length)
        
        if (projectInvitations.length > 0) {
          console.table(projectInvitations)
          // For now, just show count - full modal implementation would need project details
          alert(`📬 You have ${projectInvitations.length} pending project invitation(s)! Check the Requests tab.`)
        } else {
          console.log('ℹ️ No pending project invitations')
        }
      }
    } catch (error) {
      console.error('Error checking invitations:', error)
    }
  }

  const loadAllData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load all data in parallel
      const [membersRes, projectsRes, requestsRes, statsRes, conversationsRes, notifsRes, userDirRes, activityRes] = await Promise.all([
        api.getTeamMembers(),
        api.getTeamProjects(),
        api.getCollaborationRequests(),
        api.getTeamStats(),
        api.getChatConversations(),
        api.getNotifications().catch(() => ({ success: false, notifications: [] })),
        api.getUserDirectory().catch(() => ({ success: false, users: [] })),
        api.getTeamActivity(20).catch(() => ({ success: false, activities: [] }))
      ])
      
      if (membersRes.success) {
        const members = membersRes.members || []
        setTeamMembers(members)
        
        // Sync active team members to localStorage for Profile page
        const collaborators = members
          .filter(member => member.status === 'active') // Only active members
          .map(member => ({
            id: member.id,
            name: member.member_email,
            email: member.member_email,
            title: member.role === 'owner' ? 'Owner' : member.role === 'admin' ? 'Admin' : 'Collaborator',
            avatar: member.member_email[0].toUpperCase(),
            role: member.role,
            status: member.status,
            acceptedAt: member.created_at,
            acceptedDate: new Date(member.created_at).toLocaleString()
          }))
        
        // Add current user as owner if not already in list
        if (currentUser && !collaborators.some(c => c.email === currentUser.email)) {
          collaborators.unshift({
            id: 'current-user',
            name: currentUser.email,
            email: currentUser.email,
            title: 'Owner',
            avatar: currentUser.email[0].toUpperCase(),
            role: 'owner',
            status: 'active',
            acceptedAt: new Date().toISOString(),
            acceptedDate: new Date().toLocaleString()
          })
        }
        
        localStorage.setItem('content_genie_collaborators', JSON.stringify(collaborators))
        console.log('✅ Synced team members to localStorage:', collaborators)
      }
      
      if (projectsRes.success) setProjects(projectsRes.projects || [])
      if (requestsRes.success) setRequests(requestsRes.requests || [])
      if (statsRes.success) setStats(statsRes.stats)
      if (conversationsRes.success) setConversations(conversationsRes.conversations || [])
      
      // Handle notifications - show popup for new task assignments
      if (notifsRes.success && notifsRes.notifications) {
        const taskNotifs = notifsRes.notifications.filter(n => 
          n.request_type === 'task_assignment' || n.request_type === 'task_completed'
        )
        setNotifications(notifsRes.notifications)
        
        if (taskNotifs.length > 0) {
          setNewNotification(taskNotifs[0])
          setShowNotificationPopup(true)
          // Auto hide after 5 seconds
          setTimeout(() => setShowNotificationPopup(false), 5000)
        }
      }
      
      // Load user directory
      if (userDirRes.success) {
        setUserDirectory(userDirRes.users || [])
      }
      
      // Load team activity
      if (activityRes.success) {
        setTeamActivity(activityRes.activities || [])
      }
      
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
    if (!timestamp) return ''
    
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
    
    // Today - show time in 12-hour format with AM/PM (user's local timezone)
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true
      })
    }
    
    // Yesterday
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${date.toLocaleTimeString([], { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true
      })}`
    }
    
    // Older - show date and time in user's local format
    return date.toLocaleDateString([], { 
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
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

  const handleInviteUserFromDirectory = async (email) => {
    if (!email || !email.trim()) {
      alert('⚠️ Invalid email address')
      return
    }

    try {
      const response = await api.inviteTeamMember(email.trim().toLowerCase())
      
      if (response.success) {
        alert(`✅ Invitation sent to ${email}!`)
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
        alert('✅ Project created successfully! You are the Team Leader.')
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
      const request = requests.find(r => r.id === requestId)
      const response = await api.acceptRequest(requestId)
      
      if (response.success) {
        if (request?.request_type === 'project_invitation') {
          alert('✅ You have joined the project! Check the Projects tab.')
          setActiveTab('projects')
        } else {
          alert('✅ Request accepted! You are now part of the team.')
        }
        // Reload all data
        await loadAllData()
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

  const isProjectLeader = (project) => {
    if (!project || !backendUser) return false
    const fullProject = projects.find(p => p.id === project.id)
    return fullProject?.owner_id === backendUser?.id
  }

  const isProjectMember = (project) => {
    if (!project || !currentUser) return false
    const fullProject = projects.find(p => p.id === project.id)
    try {
      const membersList = typeof fullProject?.members === 'string' 
        ? JSON.parse(fullProject.members) 
        : (fullProject?.members || [])
      return membersList.includes(currentUser.email)
    } catch {
      return false
    }
  }

  const getMyProjects = () => {
    // Backend already filters projects for current user (owned + member of)
    return projects
  }

  const handleViewProject = (project) => {
    console.log('📂 Opening project:', project)
    
    try {
      setSelectedProject(project)
      // Parse tasks from project data
      try {
        const tasks = typeof project.description === 'string' && project.description.startsWith('{')
          ? JSON.parse(project.description).tasks || []
          : []
        setProjectTasks(tasks)
      } catch {
        setProjectTasks([])
      }
      setProjectView('detail')
    } catch (error) {
      console.error('❌ Error opening project:', error)
      alert('⚠️ Error opening project: ' + error.message)
    }
  }

  const handleBackToProjects = () => {
    setSelectedProject(null)
    setProjectView('list')
    setProjectTasks([])
    setShowAddMemberModal(false)
    setShowManageModal(false)
    setShowInviteLinkModal(false)
    setShowProjectReportModal(false)
    setShowProjectChat(false)
  }

  const handleGenerateInvitationLink = async () => {
    if (!selectedProject) return
    
    try {
      const response = await api.generateInvitationLink(selectedProject.id)
      if (response.success) {
        const fullLink = `${window.location.origin}/team/join/${selectedProject.id}/${response.invitation_token}`
        setInvitationLink(fullLink)
        setShowInviteLinkModal(true)
        setLinkCopied(false)
      } else {
        alert(`⚠️ ${response.error || 'Failed to generate invitation link'}`)
      }
    } catch (error) {
      console.error('❌ Error generating invitation link:', error)
      alert(`⚠️ Failed to generate invitation link: ${error.message}`)
    }
  }

  const handleCopyInvitationLink = () => {
    navigator.clipboard.writeText(invitationLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleViewProjectReport = async () => {
    if (!selectedProject) return
    
    try {
      const response = await api.getProjectReport(selectedProject.id)
      if (response.success) {
        setProjectReport(response.report)
        setShowProjectReportModal(true)
      } else {
        alert(`⚠️ ${response.error || 'Failed to load project report'}`)
      }
    } catch (error) {
      console.error('❌ Error loading project report:', error)
      alert(`⚠️ Failed to load project report: ${error.message}`)
    }
  }

  const loadProjectChat = async () => {
    if (!selectedProject) return
    
    try {
      const response = await api.getProjectChatMessages(selectedProject.id)
      if (response.success) {
        setProjectChatMessages(response.messages || [])
      }
    } catch (error) {
      console.error('❌ Error loading project chat:', error)
    }
  }

  const handleSendProjectChatMessage = async () => {
    if (!selectedProject || !projectChatInput.trim()) return
    
    try {
      const response = await api.sendProjectChatMessage(selectedProject.id, projectChatInput.trim())
      if (response.success) {
        setProjectChatInput('')
        loadProjectChat()
      } else {
        alert(`⚠️ ${response.error || 'Failed to send message'}`)
      }
    } catch (error) {
      console.error('❌ Error sending message:', error)
      alert(`⚠️ Failed to send message: ${error.message}`)
    }
  }

  const handleAddMemberToProject = async (memberEmail) => {
    if (!selectedProject) return
    
    try {
      console.log('🔄 Adding member to project:', selectedProject.id, memberEmail)
      const response = await api.addProjectMember(selectedProject.id, memberEmail)
      console.log('📡 Response:', response)
      
      if (response.success) {
        alert(`✅ ${memberEmail} added to project! They will see it in their Projects tab.`)
        setShowAddMemberModal(false)
        // Reload projects
        const projectsRes = await api.getTeamProjects()
        if (projectsRes.success) setProjects(projectsRes.projects || [])
      } else {
        alert(`⚠️ ${response.error || 'Failed to add member'}`)
      }
    } catch (error) {
      console.error('❌ Error adding member:', error)
      alert(`⚠️ Failed to fetch - ${error.message}`)
    }
  }

  const handleRemoveMemberFromProject = async (memberEmail) => {
    if (!selectedProject) return
    
    const project = projects.find(p => p.id === selectedProject.id)
    if (!project) return
    
    try {
      const response = await api.removeProjectMember(selectedProject.id, memberEmail)
      
      if (response.success) {
        alert(`✅ ${memberEmail} removed from project`)
        // Reload projects
        const projectsRes = await api.getTeamProjects()
        if (projectsRes.success) setProjects(projectsRes.projects || [])
      } else {
        alert(`⚠️ ${response.error || 'Failed to remove member'}`)
      }
    } catch (error) {
      alert(`⚠️ ${error.message || 'Failed to remove member'}`)
    }
  }

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !newTaskAssignee) {
      alert('⚠️ Please enter task title and select an assignee')
      return
    }
    
    if (!selectedProject) return
    
    const newTask = {
      id: Date.now(),
      title: newTaskTitle.trim(),
      assignee: newTaskAssignee,
      status: 'todo', // 'todo', 'doing', 'done'
      createdBy: currentUser?.email || 'you',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const updatedTasks = [...projectTasks, newTask]
    
    try {
      const response = await api.updateProjectTasks(selectedProject.id, updatedTasks)
      
      if (response.success) {
        setProjectTasks(updatedTasks)
        setNewTaskTitle('')
        setNewTaskAssignee('')
        
        // Send notification to assignee (only if not assigning to yourself)
        if (newTaskAssignee !== currentUser?.email) {
          try {
            await api.sendTaskNotification(
              newTaskAssignee,
              newTask.title,
              selectedProject.name,
              selectedProject.id,
              'task_assigned'
            )
            alert(`✅ Task created and ${newTaskAssignee} has been notified!`)
          } catch (notifErr) {
            console.warn('Could not send notification:', notifErr)
            alert('✅ Task created successfully!')
          }
        } else {
          alert('✅ Task created successfully!')
        }
        
        // Reload projects to get updated data
        const projectsRes = await api.getTeamProjects()
        if (projectsRes.success) setProjects(projectsRes.projects || [])
      } else {
        alert(`⚠️ ${response.error || 'Failed to create task'}`)
      }
    } catch (error) {
      alert(`⚠️ ${error.message || 'Failed to create task'}`)
    }
  }

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    if (!selectedProject) return
    
    const taskIndex = projectTasks.findIndex(t => t.id === taskId)
    if (taskIndex === -1) return
    
    const updatedTasks = [...projectTasks]
    const task = { ...updatedTasks[taskIndex] }
    const oldStatus = task.status
    
    task.status = newStatus
    task.updatedAt = new Date().toISOString()
    
    // Add completion info when marking as done
    if (newStatus === 'done' && oldStatus !== 'done') {
      task.completedBy = currentUser?.email
      task.completedAt = new Date().toISOString()
    }
    
    updatedTasks[taskIndex] = task
    
    try {
      const response = await api.updateProjectTasks(selectedProject.id, updatedTasks)
      
      if (response.success) {
        setProjectTasks(updatedTasks)
        
        // If task marked as done and user is NOT the leader, notify the leader
        if (newStatus === 'done' && oldStatus !== 'done' && !isProjectLeader(selectedProject)) {
          const projectData = projects.find(p => p.id === selectedProject.id)
          if (projectData) {
            // Get leader email - need to find owner
            try {
              // The project owner_id is the leader, get their email
              const leaderRes = await api.getTeamMembers()
              // Find the owner in team members or use project owner
              const ownerMember = leaderRes.members?.find(m => m.owner_id === projectData.owner_id && m.is_owner)
              
              if (ownerMember) {
                await api.sendTaskNotification(
                  ownerMember.member_email,
                  task.title,
                  selectedProject.name,
                  selectedProject.id,
                  'task_completed'
                )
              } else {
                // Fallback: notify via backend user lookup
                console.log('Notifying project owner about task completion')
              }
            } catch (err) {
              console.warn('Could not notify leader:', err)
            }
          }
        }
        
        const statusText = newStatus === 'todo' ? 'To Do' : newStatus === 'doing' ? 'In Progress' : 'Completed'
        console.log(`✅ Task "${task.title}" moved to ${statusText}`)
        
        // Reload projects
        const projectsRes = await api.getTeamProjects()
        if (projectsRes.success) setProjects(projectsRes.projects || [])
      } else {
        alert(`⚠️ ${response.error || 'Failed to update task'}`)
      }
    } catch (error) {
      alert(`⚠️ ${error.message || 'Failed to update task'}`)
    }
  }

  const handleStartTask = (task) => {
    // Update task status to 'doing'
    handleUpdateTaskStatus(task.id, 'doing')
    // Navigate to Creator page with project context
    setTimeout(() => {
      window.location.href = `/creator?project=${selectedProject.id}&task=${task.id}`
    }, 500)
  }

  const handleMarkTaskFinished = (taskId) => {
    if (!window.confirm('Mark this task as finished? The team leader will be notified.')) return
    handleUpdateTaskStatus(taskId, 'done')
    alert('✅ Task marked as finished! Team leader has been notified.')
  }

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return
    
    if (!selectedProject) return
    
    const updatedTasks = projectTasks.filter(t => t.id !== taskId)
    
    try {
      const response = await api.updateProjectTasks(selectedProject.id, updatedTasks)
      
      if (response.success) {
        setProjectTasks(updatedTasks)
        alert('✅ Task deleted')
        
        // Reload projects
        const projectsRes = await api.getTeamProjects()
        if (projectsRes.success) setProjects(projectsRes.projects || [])
      } else {
        alert(`⚠️ ${response.error || 'Failed to delete task'}`)
      }
    } catch (error) {
      alert(`⚠️ ${error.message || 'Failed to delete task'}`)
    }
  }

  const handleReviewTask = async (taskId, action) => {
    if (!selectedProject) return
    
    const actionText = action === 'approve' ? 'approve' : 'revert'
    const confirmMsg = action === 'approve' 
      ? 'Approve this completed task?' 
      : 'Revert this task back to the assignee? They will be notified to redo it.'
    
    if (!window.confirm(confirmMsg)) return
    
    // Find the task to get details
    const task = projectTasks.find(t => t.id === taskId)
    if (!task) {
      alert('⚠️ Task not found')
      return
    }
    
    // Prompt for comment if requesting changes
    let comment = ''
    if (action === 'revert') {
      comment = window.prompt('Please provide feedback for the assignee:') || ''
    }
    
    try {
      const response = await api.reviewTask(selectedProject.id, taskId, {
        status: action === 'approve' ? 'approved' : 'changes_requested',
        comment: comment,
        task_title: task.title,
        assignee_email: task.assignee
      })
      
      if (response.success) {
        alert(action === 'approve' ? '✅ Task approved!' : '🔄 Task reverted. Member has been notified.')
        
        // Reload projects and notifications
        await loadAllData()
      } else {
        alert(`⚠️ ${response.error || 'Failed to review task'}`)
      }
    } catch (error) {
      console.error('❌ Error reviewing task:', error)
      alert(`⚠️ ${error.message || 'Failed to review task'}`)
    }
  }

  const handleDeleteNotification = async (notificationId) => {
    try {
      const response = await api.deleteNotification(notificationId)
      
      if (response.success) {
        // Remove from local state
        setRequests(prev => prev.filter(r => r.id !== notificationId))
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
      } else {
        alert(`⚠️ ${response.error || 'Failed to delete notification'}`)
      }
    } catch (error) {
      console.error('❌ Error deleting notification:', error)
      alert(`⚠️ ${error.message || 'Failed to delete notification'}`)
    }
  }

  const handleClearAllNotifications = async () => {
    if (!window.confirm('Clear all notifications? This cannot be undone.')) return
    
    try {
      const response = await api.clearAllNotifications()
      
      if (response.success) {
        setRequests([])
        setNotifications([])
        alert('✅ All notifications cleared')
      } else {
        alert(`⚠️ ${response.error || 'Failed to clear notifications'}`)
      }
    } catch (error) {
      console.error('❌ Error clearing notifications:', error)
      alert(`⚠️ ${error.message || 'Failed to clear notifications'}`)
    }
  }

  const getTasksByStatus = (status) => {
    return projectTasks.filter(task => task.status === status)
  }

  const getMyTasks = () => {
    return projectTasks.filter(task => task.assignee === currentUser?.email)
  }

  const getStatusBadgeColor = (status) => {
    switch(status) {
      case 'todo':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border border-blue-300 dark:border-blue-700'
      case 'doing':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700'
      case 'done':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-300 dark:border-green-700'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
    }
  }

  const getStatusText = (status) => {
    switch(status) {
      case 'todo': return 'To Do'
      case 'doing': return 'In Progress'
      case 'done': return 'Completed'
      default: return status
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
    <>
      <Header />
      <div className="min-h-screen theme-transition relative">
        <ParticlesBackground />
        <FloatingEmojis />

      {/* Notification Popup */}
      {showNotificationPopup && newNotification && (
        <div className="fixed top-6 right-6 z-[9999] max-w-sm w-full animate-bounce-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-indigo-500 p-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl">
                  {newNotification.request_type === 'task_assignment' ? '📋' : '✅'}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1">
                  {newNotification.request_type === 'task_assignment' ? '🎯 New Task Assigned!' : '✅ Task Completed!'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {newNotification.message?.replace(/\(project_id:[^)]+\)/, '').trim()}
                </p>
              </div>
              <button
                onClick={() => setShowNotificationPopup(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="pt-24 pb-12 relative z-10 content-layer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title Section */}
          <div ref={titleRef} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-700 mb-4 leading-tight tracking-tight">
              Team <span className="gradient-text">Collaboration</span>
            </h1>
            <p className="text-gray-700 dark:text-blue-200 text-lg font-normal max-w-2xl mx-auto theme-transition">
              Work together with your team to create amazing content.
            </p>
            
            {/* Pending Invitations Alert - Now shows count from requests */}
            {requests.filter(r => r.request_type === 'project_invitation').length > 0 && (
              <div className="mt-6 max-w-2xl mx-auto">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-6 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                        <span className="text-3xl">📬</span>
                      </div>
                      <div className="text-left">
                        <h3 className="text-xl font-bold text-white mb-1">
                          You have {requests.filter(r => r.request_type === 'project_invitation').length} pending invitation{requests.filter(r => r.request_type === 'project_invitation').length !== 1 ? 's' : ''}!
                        </h3>
                        <p className="text-indigo-100 text-sm">
                          You've been invited to join {requests.filter(r => r.request_type === 'project_invitation').length} project{requests.filter(r => r.request_type === 'project_invitation').length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('requests')}
                      className="px-6 py-3 bg-white hover:bg-gray-100 text-indigo-600 rounded-2xl font-bold transition-all flex items-center space-x-2 shadow-lg"
                    >
                      <span>View Invitations</span>
                      <span className="w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {requests.filter(r => r.request_type === 'project_invitation').length}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="glass-card rounded-xl p-6 theme-transition">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 dark:from-blue-500 dark:to-blue-600 rounded-lg flex items-center justify-center">
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
                <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-black dark:from-purple-500 dark:to-purple-600 rounded-lg flex items-center justify-center">
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
                <div className="w-12 h-12 bg-gradient-to-br from-black to-gray-700 dark:from-green-500 dark:to-green-600 rounded-lg flex items-center justify-center">
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
                <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-800 dark:from-orange-500 dark:to-orange-600 rounded-lg flex items-center justify-center">
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
                onClick={() => setActiveTab('directory')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'directory'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                🌐 User Directory
              </button>
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
                className={`px-6 py-3 rounded-xl font-semibold transition-all relative ${
                  activeTab === 'projects'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                📁 Projects
                {requests.filter(r => r.request_type === 'project_invitation').length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {requests.filter(r => r.request_type === 'project_invitation').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all relative ${
                  activeTab === 'chat'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                💬 Chat
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

          {/* User Directory Tab */}
          {activeTab === 'directory' && (
            <div className="max-w-7xl mx-auto">
              <div className="glass-card rounded-3xl p-8 mb-6 theme-transition">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  🌐 User Directory
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Browse all registered users and send collaboration invitations
                </p>
                
                {userDirectory.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">👥</div>
                    <p className="text-gray-600 dark:text-gray-400">No other users found</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userDirectory.map((user) => (
                      <div key={user.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div 
                            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                            style={{ background: user.profile_color || '#6366f1' }}
                          >
                            {user.display_name[0].toUpperCase()}
                          </div>
                          <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 rounded-full text-xs font-semibold">
                            {user.category || 'Professional'}
                          </span>
                        </div>
                        
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                          {user.display_name}
                        </h3>
                        
                        {user.professional_title && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {user.professional_title}
                          </p>
                        )}
                        
                        {user.location && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mb-3 flex items-center space-x-1">
                            <span>📍</span>
                            <span>{user.location}</span>
                          </p>
                        )}
                        
                        {user.bio && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {user.bio}
                          </p>
                        )}
                        
                        {user.skills && user.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {user.skills.slice(0, 3).map((skill, idx) => (
                              <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs">
                                {skill}
                              </span>
                            ))}
                            {user.skills.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs">
                                +{user.skills.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                        
                        <button
                          onClick={() => {
                            if (confirm(`Send collaboration invitation to ${user.display_name}?`)) {
                              handleInviteUserFromDirectory(user.email)
                            }
                          }}
                          className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all flex items-center justify-center space-x-2"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Send Invitation</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

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
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border-2 border-gray-400 dark:border-purple-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 dark:from-purple-500 dark:to-indigo-600 rounded-full flex items-center justify-center">
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
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 dark:from-blue-500 dark:to-indigo-600 rounded-full flex items-center justify-center">
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
          {activeTab === 'projects' && projectView === 'list' && (
            <div className="glass-card rounded-3xl p-8 theme-transition max-w-6xl mx-auto">
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
                    className="btn-primary px-6 rounded-2xl flex items-center space-x-2"
                  >
                    <span>➕</span>
                    <span>Create</span>
                  </button>
                </div>
              </div>

              {/* Projects Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  <div className="col-span-full text-center py-8">
                    <div className="text-4xl mb-2">⏳</div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Loading projects...
                    </p>
                  </div>
                ) : getMyProjects().length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <div className="text-4xl mb-2">📁</div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      No projects yet. Create one to organize your team's content!
                    </p>
                  </div>
                ) : (
                  getMyProjects().map((project) => {
                    const isLeader = project.owner_id === backendUser?.id
                    const membersList = typeof project.members === 'string' ? JSON.parse(project.members) : (project.members || [])
                    const memberCount = membersList.length
                    
                    // Parse tasks from description
                    let tasks = []
                    try {
                      if (typeof project.description === 'string' && project.description.startsWith('{')) {
                        tasks = JSON.parse(project.description).tasks || []
                      }
                    } catch {}
                    
                    const taskCount = tasks.length
                    const myTasksCount = tasks.filter(t => t.assignee === currentUser?.email).length
                    
                    return (
                      <div
                        key={project.id}
                        className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 theme-transition hover:shadow-xl cursor-pointer group"
                        onClick={() => handleViewProject(project)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="text-2xl">📁</span>
                          </div>
                          {isLeader && (
                            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 rounded-full text-xs font-semibold">
                              Leader
                            </span>
                          )}
                        </div>
                        
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2">
                          {project.name}
                        </h3>
                        
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 flex items-center space-x-1">
                          <span>👤</span>
                          <span>Leader: {project.leader_email}</span>
                        </div>
                        
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                          Created {new Date(project.createdAt).toLocaleDateString()}
                        </div>
                        
                        <div className="flex items-center justify-between text-sm mb-2">
                          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                            <UsersIcon className="w-4 h-4" />
                            <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                            <ListTodo className="w-4 h-4" />
                            <span>{taskCount} task{taskCount !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        
                        {!isLeader && myTasksCount > 0 && (
                          <div className="mb-4 px-3 py-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                            <span className="text-xs font-semibold text-yellow-800 dark:text-yellow-400">
                              📋 {myTasksCount} task{myTasksCount !== 1 ? 's' : ''} assigned to you
                            </span>
                          </div>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewProject(project)
                          }}
                          className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-medium transition-all"
                        >
                          View Project →
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* Project Detail View */}
          {activeTab === 'projects' && projectView === 'detail' && selectedProject && (
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="glass-card rounded-3xl p-6 mb-6 theme-transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleBackToProjects}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-900 dark:text-gray-100" />
                    </button>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {selectedProject.name}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {isProjectLeader(selectedProject) ? 'You are the Team Leader' : `Project Member • Leader: ${selectedProject.leader_email}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleGenerateInvitationLink}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium transition-all flex items-center space-x-2"
                    >
                      <LinkIcon className="w-4 h-4" />
                      <span>Invite Link</span>
                    </button>
                    {isProjectLeader(selectedProject) && (
                      <>
                        <button
                          onClick={handleViewProjectReport}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-medium transition-all flex items-center space-x-2"
                        >
                          <BarChart3 className="w-4 h-4" />
                          <span>Report</span>
                        </button>
                        <button
                          onClick={() => setShowAddMemberModal(true)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-medium transition-all flex items-center space-x-2"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Add Members</span>
                        </button>
                        <button
                          onClick={() => setShowManageModal(true)}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-2xl font-medium transition-all flex items-center space-x-2"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Manage</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Team Members Section */}
              <div className="glass-card rounded-3xl p-6 mb-6 theme-transition">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                  <UsersIcon className="w-5 h-5 text-indigo-500" />
                  <span>Team Members</span>
                  <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                    ({(selectedProject.members || []).length})
                  </span>
                </h3>
                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {(selectedProject.members || []).map((member, index) => {
                    const isLeader = member === selectedProject.leader_email
                    return (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-white text-xl font-bold">{member[0].toUpperCase()}</span>
                        </div>
                        <p className="text-center font-semibold text-gray-900 dark:text-white text-sm truncate mb-1">{member}</p>
                        <div className="text-center">
                          {isLeader ? (
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 rounded-full text-xs font-semibold">
                              👑 Leader
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-xs font-semibold">
                              👤 Member
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Project Group Chat Section */}
              <div className="glass-card rounded-3xl p-6 mb-6 theme-transition">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5 text-indigo-500" />
                    <span>Project Chat: {selectedProject.name}</span>
                  </h3>
                  <button
                    onClick={() => {
                      setShowProjectChat(!showProjectChat)
                      if (!showProjectChat) loadProjectChat()
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all"
                  >
                    {showProjectChat ? 'Hide Chat' : 'Show Chat'}
                  </button>
                </div>
                
                {showProjectChat && (
                  <div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 max-h-96 overflow-y-auto border-2 border-gray-200 dark:border-gray-700">
                      {projectChatMessages.length === 0 ? (
                        <div className="text-center text-gray-600 dark:text-gray-400 py-8">
                          <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {projectChatMessages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.sender_email === currentUser?.email ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-xs px-4 py-2 rounded-2xl ${
                                msg.sender_email === currentUser?.email
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                              }`}>
                                <p className="text-xs font-semibold mb-1">{msg.sender_email}</p>
                                <p className="text-sm">{msg.message}</p>
                                <p className="text-xs opacity-70 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={projectChatInput}
                        onChange={(e) => setProjectChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendProjectChatMessage()}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleSendProjectChatMessage}
                        disabled={!projectChatInput.trim()}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <Send className="w-4 h-4" />
                        <span>Send</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* My Tasks Section (for non-leaders) */}
              {!isProjectLeader(selectedProject) && getMyTasks().length > 0 && (
                <div className="glass-card rounded-3xl p-6 mb-6 theme-transition">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                    <ListTodo className="w-5 h-5 text-indigo-500" />
                    <span>My Tasks</span>
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                      ({getMyTasks().length})
                    </span>
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {getMyTasks().map(task => (
                      <div key={task.id} className="bg-white dark:bg-gray-800 rounded-3xl p-4 border-2 border-gray-200 dark:border-gray-700">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex-1">{task.title}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(task.status)}`}>
                            {getStatusText(task.status)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                          Created {new Date(task.createdAt).toLocaleDateString()}
                        </div>
                        {task.status === 'todo' && (
                          <button
                            onClick={() => handleStartTask(task)}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium transition-all flex items-center justify-center space-x-2"
                          >
                            <PlayCircle className="w-4 h-4" />
                            <span>Start Task</span>
                          </button>
                        )}
                        {task.status === 'doing' && (
                          <div className="space-y-2">
                            <button
                              onClick={() => handleStartTask(task)}
                              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium transition-all flex items-center justify-center space-x-2"
                            >
                              <PlayCircle className="w-4 h-4" />
                              <span>Continue Working</span>
                            </button>
                            <button
                              onClick={() => handleMarkTaskFinished(task.id)}
                              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-medium transition-all flex items-center justify-center space-x-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Mark as Finished</span>
                            </button>
                          </div>
                        )}
                        {task.status === 'done' && (
                          <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-2xl text-center font-medium">
                            ✓ Completed
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Create Task (Leader Only) */}
              {isProjectLeader(selectedProject) && (
                <div className="glass-card rounded-3xl p-6 mb-6 theme-transition">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Create Task</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Task title (e.g., Write Twitter Thread for EventSnap)"
                      className="form-input md:col-span-2 p-3 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <select
                      value={newTaskAssignee}
                      onChange={(e) => setNewTaskAssignee(e.target.value)}
                      className="form-input p-3 rounded-xl text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select Assignee</option>
                      {(() => {
                        const project = projects.find(p => p.id === selectedProject.id)
                        const membersList = typeof project?.members === 'string' 
                          ? JSON.parse(project.members) 
                          : (project?.members || [])
                        
                        return membersList.map(memberEmail => (
                          <option key={memberEmail} value={memberEmail}>
                            {memberEmail}
                          </option>
                        ))
                      })()}
                    </select>
                    <button
                      onClick={handleCreateTask}
                      className="md:col-span-3 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-medium transition-all"
                    >
                      ➕ Create Task
                    </button>
                  </div>
                </div>
              )}

              {/* Kanban Board */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* To Do Column */}
                <div className="glass-card rounded-3xl p-6 theme-transition">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <Circle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      To Do
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor('todo')}`}>
                      {getTasksByStatus('todo').length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {getTasksByStatus('todo').map(task => (
                      <div key={task.id} className="bg-white dark:bg-gray-800 rounded-3xl p-4 border-2 border-blue-200 dark:border-blue-800">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex-1">{task.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor('todo')}`}>
                            To Do
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                          👤 {task.assignee}
                        </div>
                        <div className="flex flex-col space-y-2">
                          {task.assignee === currentUser?.email && (
                            <button
                              onClick={() => handleStartTask(task)}
                              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-medium transition-all flex items-center justify-center space-x-1"
                            >
                              <PlayCircle className="w-3 h-3" />
                              <span>Start Task</span>
                            </button>
                          )}
                          {isProjectLeader(selectedProject) && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUpdateTaskStatus(task.id, 'doing')}
                                className="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-2xl text-xs font-medium transition-all"
                              >
                                Move →
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-medium transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {getTasksByStatus('todo').length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                        No tasks yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Doing Column */}
                <div className="glass-card rounded-3xl p-6 theme-transition">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                      <PlayCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      In Progress
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor('doing')}`}>
                      {getTasksByStatus('doing').length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {getTasksByStatus('doing').map(task => (
                      <div key={task.id} className="bg-white dark:bg-gray-800 rounded-3xl p-4 border-2 border-yellow-400 dark:border-yellow-600">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex-1">{task.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor('doing')}`}>
                            In Progress
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                          👤 {task.assignee}
                        </div>
                        <div className="flex flex-col space-y-2">
                          {task.assignee === currentUser?.email && (
                            <>
                              <button
                                onClick={() => handleStartTask(task)}
                                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-medium transition-all flex items-center justify-center space-x-1"
                              >
                                <PlayCircle className="w-3 h-3" />
                                <span>Continue Working</span>
                              </button>
                              <button
                                onClick={() => handleMarkTaskFinished(task.id)}
                                className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-xs font-medium transition-all flex items-center justify-center space-x-1"
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span>Mark as Finished</span>
                              </button>
                            </>
                          )}
                          {isProjectLeader(selectedProject) && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUpdateTaskStatus(task.id, 'todo')}
                                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-2xl text-xs font-medium transition-all"
                              >
                                ← Back
                              </button>
                              <button
                                onClick={() => handleUpdateTaskStatus(task.id, 'done')}
                                className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-xs font-medium transition-all"
                              >
                                Done ✓
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-medium transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {getTasksByStatus('doing').length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                        No tasks in progress
                      </div>
                    )}
                  </div>
                </div>

                {/* Done Column */}
                <div className="glass-card rounded-3xl p-6 theme-transition">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      Completed
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor('done')}`}>
                      {getTasksByStatus('done').length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {getTasksByStatus('done').map(task => (
                      <div key={task.id} className="bg-white dark:bg-gray-800 rounded-3xl p-4 border-2 border-green-400 dark:border-green-600 opacity-90">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex-1 line-through">{task.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor('done')}`}>
                            Done
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          ✓ Completed by: {task.completedBy || task.assignee}
                        </div>
                        {task.completedAt && (
                          <div className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                            {new Date(task.completedAt).toLocaleString()}
                          </div>
                        )}
                        {isProjectLeader(selectedProject) && (
                          <div className="flex flex-col space-y-2">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleReviewTask(task.id, 'approve')}
                                className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-xs font-medium transition-all flex items-center justify-center space-x-1"
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleReviewTask(task.id, 'revert')}
                                className="flex-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-xs font-medium transition-all"
                              >
                                🔄 Revert
                              </button>
                            </div>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-medium transition-all flex items-center justify-center space-x-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {getTasksByStatus('done').length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                        No completed tasks
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Add Member Modal */}
              {showAddMemberModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Add Team Members</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      Select from your accepted collaborators
                    </p>
                    <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
                      {teamMembers
                        .filter(member => {
                          // Only show active members not already in project
                          if (member.status !== 'active') return false
                          const projectData = projects.find(p => p.id === selectedProject?.id)
                          try {
                            const membersList = typeof projectData?.members === 'string' 
                              ? JSON.parse(projectData.members) 
                              : (projectData?.members || [])
                            return !membersList.includes(member.member_email)
                          } catch {
                            return true
                          }
                        })
                        .map(member => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-2xl"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold">{member.member_email[0].toUpperCase()}</span>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-gray-100">{member.member_email}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">{member.role}</div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddMemberToProject(member.member_email)}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-all"
                            >
                              Add
                            </button>
                          </div>
                        ))}
                    </div>
                    <button
                      onClick={() => setShowAddMemberModal(false)}
                      className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-2xl font-medium transition-all"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* Manage Team Modal */}
              {showManageModal && selectedProject && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Manage Team</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
                      {(() => {
                        const project = projects.find(p => p.id === selectedProject.id)
                        const membersList = typeof project?.members === 'string' 
                          ? JSON.parse(project.members) 
                          : (project?.members || [])
                        
                        return membersList.map((memberEmail, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-2xl"
                          >
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-gray-100">{memberEmail}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {project.owner_id === backendUser?.id && memberEmail === currentUser?.email ? 'Team Leader' : 'Member'}
                              </div>
                            </div>
                            {memberEmail !== currentUser?.email && (
                              <button
                                onClick={() => handleRemoveMemberFromProject(memberEmail)}
                                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-all flex items-center space-x-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>
                        ))
                      })()}
                    </div>
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                            handleDeleteProject(selectedProject.id)
                            handleBackToProjects()
                          }
                        }}
                        className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-medium transition-all flex items-center justify-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Project</span>
                      </button>
                      <button
                        onClick={() => setShowManageModal(false)}
                        className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-2xl font-medium transition-all"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 dark:from-purple-500 dark:to-indigo-600 rounded-full flex items-center justify-center">
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
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 dark:from-purple-500 dark:to-indigo-600 rounded-full flex items-center justify-center">
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
                            const senderName = isSentByMe ? 'You' : (selectedChat?.other_user_name || selectedChat?.other_user_email || 'User')
                            return (
                              <div
                                key={msg.id}
                                className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'} mb-3`}
                              >
                                <div className={`flex flex-col ${isSentByMe ? 'items-end' : 'items-start'}`}>
                                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 px-2">
                                    {senderName}
                                  </span>
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
                {requests.length > 0 && (
                  <button
                    onClick={handleClearAllNotifications}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-sm font-medium transition-all flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear All</span>
                  </button>
                )}
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
                        className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border-2 border-gray-400 dark:border-blue-800 theme-transition"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 dark:from-blue-500 dark:to-indigo-600 rounded-full flex items-center justify-center">
                              <span className="text-2xl">
                                {request.request_type === 'project_invitation' ? '📁' : 
                                 request.request_type === 'task_assignment' ? '📋' :
                                 request.request_type === 'task_completed' ? '✅' :
                                 request.request_type === 'task_reverted' ? '🔄' :
                                 request.request_type === 'task_approved' ? '✅' : '👥'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                                {request.request_type === 'project_invitation' ? 'Project Invitation' :
                                 request.request_type === 'task_assignment' ? 'Task Assigned' :
                                 request.request_type === 'task_completed' ? 'Task Completed' :
                                 request.request_type === 'task_reverted' ? 'Task Reverted' :
                                 request.request_type === 'task_approved' ? 'Task Approved' :
                                 request.from_name || request.from_email}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                From: {request.from_name || request.from_email} • {new Date(request.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              request.request_type === 'project_invitation' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400' :
                              request.request_type === 'task_assignment' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                              request.request_type === 'task_reverted' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400' :
                              'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                            }`}>
                              {request.request_type === 'project_invitation' ? 'Project Invite' :
                               request.request_type === 'task_assignment' ? 'Task' :
                               request.request_type === 'task_completed' ? 'Completed' :
                               request.request_type === 'task_reverted' ? 'Reverted' :
                               request.request_type === 'task_approved' ? 'Approved' : 'Pending'}
                            </span>
                            <button
                              onClick={() => handleDeleteNotification(request.id)}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                              title="Delete notification"
                            >
                              <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        </div>

                        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
                          <p className="text-gray-900 dark:text-gray-100">
                            {request.message?.replace(/\(project_id:[^)]+\)/, '').trim() || 'Collaboration request'}
                          </p>
                        </div>

                        {(request.request_type === 'join_team' || request.request_type === 'project_invitation') && (
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleAcceptRequest(request.id)}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
                            >
                              <span>✅</span>
                              <span>{request.request_type === 'project_invitation' ? 'Join Project' : 'Accept'}</span>
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.id)}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
                            >
                              <span>❌</span>
                              <span>Decline</span>
                            </button>
                          </div>
                        )}
                        
                        {(request.request_type === 'task_assignment' || request.request_type === 'task_completed' || request.request_type === 'task_reverted' || request.request_type === 'task_approved') && (
                          <div className="flex space-x-3">
                            <button
                              onClick={() => api.markNotificationRead(request.id).then(() => loadAllData())}
                              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl font-semibold transition-colors"
                            >
                              ✓ Mark as Read
                            </button>
                            <button
                              onClick={() => handleDeleteNotification(request.id)}
                              className="px-4 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-colors"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Activity Feed */}
          <div className="mt-8 glass-card rounded-2xl p-8 theme-transition">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 theme-transition flex items-center justify-between">
              <span>📊 Team Activity</span>
              <button
                onClick={loadAllData}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all"
              >
                🔄 Refresh
              </button>
            </h2>
            
            {teamActivity.length === 0 ? (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-12 text-center theme-transition border border-gray-300 dark:border-gray-600">
                <div className="text-6xl mb-4">🚀</div>
                <p className="text-gray-600 dark:text-gray-400 theme-transition">
                  No activity yet. Start collaborating with your team!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {teamActivity.map((activity) => (
                  <div key={activity.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                        {activity.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {activity.title}
                          </h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                            {new Date(activity.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {activity.description}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            by {activity.user}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            activity.type === 'project_created' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                            activity.type === 'member_added' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                            activity.type === 'request_accepted' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400' :
                            activity.type === 'chat_message' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-400' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
                          }`}>
                            {activity.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Invitation Link Modal */}
      {showInviteLinkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <LinkIcon className="w-6 h-6 text-indigo-500" />
                <span>Project Invitation Link</span>
              </h3>
              <button
                onClick={() => setShowInviteLinkModal(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-900 dark:text-white" />
              </button>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Share this link with others to invite them to join the project. The link expires in 7 days and can be used up to 10 times.
            </p>
            
            <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 mb-4 break-all">
              <code className="text-sm text-gray-900 dark:text-white">{invitationLink}</code>
            </div>
            
            <button
              onClick={handleCopyInvitationLink}
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all flex items-center justify-center space-x-2"
            >
              {linkCopied ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Project Report Modal */}
      {showProjectReportModal && projectReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-4xl w-full shadow-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <BarChart3 className="w-6 h-6 text-purple-500" />
                <span>Project Report: {selectedProject?.name}</span>
              </h3>
              <button
                onClick={() => setShowProjectReportModal(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-900 dark:text-white" />
              </button>
            </div>
            
            {/* Project Statistics */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
                <div className="text-3xl font-bold mb-2">{projectReport.total_members}</div>
                <div className="text-sm opacity-90">Total Members</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl p-6 text-white">
                <div className="text-3xl font-bold mb-2">{projectReport.total_tasks}</div>
                <div className="text-sm opacity-90">Total Tasks</div>
              </div>
              <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-6 text-white">
                <div className="text-3xl font-bold mb-2">{projectReport.completed_tasks}</div>
                <div className="text-sm opacity-90">Completed Tasks</div>
              </div>
            </div>
            
            {/* Task Submissions */}
            {projectReport.submitted_tasks && projectReport.submitted_tasks.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Task Submissions</h4>
                <div className="space-y-3">
                  {projectReport.submitted_tasks.map((task, index) => (
                    <div key={index} className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-semibold text-gray-900 dark:text-white">{task.title}</h5>
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-xs font-semibold">
                          Submitted
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Assigned to: {task.assignee}
                      </p>
                      {task.submission_details && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mt-2">
                          <p className="text-sm text-gray-900 dark:text-white mb-1">
                            <strong>Work Details:</strong> {task.submission_details.work_details}
                          </p>
                          {task.submission_details.work_link && (
                            <p className="text-sm text-indigo-600 dark:text-indigo-400">
                              <strong>Link:</strong> <a href={task.submission_details.work_link} target="_blank" rel="noopener noreferrer" className="underline">{task.submission_details.work_link}</a>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Member Performance */}
            {projectReport.member_performance && Object.keys(projectReport.member_performance).length > 0 && (
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Member Performance</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(projectReport.member_performance).map(([member, stats]) => (
                    <div key={member} className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4">
                      <p className="font-semibold text-gray-900 dark:text-white mb-2">{member}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Assigned:</span>
                          <span className="ml-2 font-semibold text-gray-900 dark:text-white">{stats.assigned}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                          <span className="ml-2 font-semibold text-green-600 dark:text-green-400">{stats.completed}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
      </div>
    </>
  )
}

export default TeamCollaboration
