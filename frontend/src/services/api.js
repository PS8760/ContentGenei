import { auth } from '../config/firebase'

// Backend API URL - Update this after deploying your backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://contentgenei.onrender.com/api'  // Production backend URL
    : 'http://localhost:5000/api')

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  async getAuthHeaders() {
    // Try to get stored access token first
    const accessToken = localStorage.getItem('access_token')
    if (accessToken) {
      console.log('🔑 Using stored access token')
      return {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
    
    console.log('⚠️ No stored token, attempting to get fresh token...')
    
    // Fallback: try to get fresh Firebase token and exchange it
    try {
      const user = auth.currentUser
      if (user) {
        console.log('👤 Current user found, getting Firebase token...')
        const idToken = await user.getIdToken(true) // force refresh
        console.log('✅ Got Firebase token, exchanging for JWT...')
        
        // Try to exchange for JWT
        const response = await fetch(`${this.baseURL}/auth/verify-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        })
        
        const data = await response.json()
        console.log('📡 Token exchange response:', data)
        
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token)
          if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token)
          }
          if (data.session_token) {
            localStorage.setItem('session_token', data.session_token)
          }
          
          console.log('✅ JWT token stored successfully')
          
          return {
            'Authorization': `Bearer ${data.access_token}`,
            'Content-Type': 'application/json'
          }
        } else {
          console.error('❌ No access_token in response:', data)
        }
      } else {
        console.warn('⚠️ No current user found')
      }
    } catch (err) {
      console.error('❌ Token refresh failed:', err)
    }
    
    console.log('⚠️ Returning headers without auth token')
    return {
      'Content-Type': 'application/json'
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const headers = await this.getAuthHeaders()
    
    const config = {
      headers,
      ...options
    }

    try {
      const response = await fetch(url, config)
      
      // If 401, clear token and try once more with fresh token
      if (response.status === 401) {
        console.warn('Token expired or invalid, attempting refresh...')
        localStorage.removeItem('access_token')
        
        const freshHeaders = await this.getAuthHeaders()
        const retryResponse = await fetch(url, { ...config, headers: freshHeaders })
        
        // Handle non-JSON responses
        const contentType = retryResponse.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Server returned non-JSON response: ${retryResponse.status} ${retryResponse.statusText}`)
        }
        
        const retryData = await retryResponse.json()
        
        if (!retryResponse.ok) {
          throw new Error(retryData.error || `HTTP error! status: ${retryResponse.status}`)
        }
        
        return retryData
      }
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Authentication endpoints
  async verifyFirebaseToken(idToken) {
    return this.request('/auth/verify-token', {
      method: 'POST',
      body: JSON.stringify({ idToken })
    })
  }

  async refreshToken() {
    return this.request('/auth/refresh', {
      method: 'POST'
    })
  }

  async logout(sessionToken) {
    return this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ session_token: sessionToken })
    })
  }

  async getProfile() {
    return this.request('/profile')
  }

  async updateProfile(profileData) {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    })
  }

  async completeOnboarding(onboardingData) {
    return this.request('/profile/onboarding', {
      method: 'POST',
      body: JSON.stringify(onboardingData)
    })
  }

  async getOnboardingStatus() {
    return this.request('/profile/onboarding/status')
  }

  async updatePlatformConnection(platform, connectionData) {
    return this.request(`/profile/platform/${platform}`, {
      method: 'PUT',
      body: JSON.stringify(connectionData)
    })
  }

  // Content endpoints
  async generateContent(contentData) {
    return this.request('/content/generate', {
      method: 'POST',
      body: JSON.stringify(contentData)
    })
  }

  async getContent(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/content?${queryString}` : '/content'
    return this.request(endpoint)
  }

  async createContent(contentData) {
    return this.request('/content', {
      method: 'POST',
      body: JSON.stringify(contentData)
    })
  }

  async getContentItem(contentId) {
    return this.request(`/content/${contentId}`)
  }

  async updateContent(contentId, updateData) {
    return this.request(`/content/${contentId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    })
  }

  async deleteContent(contentId) {
    return this.request(`/content/${contentId}`, {
      method: 'DELETE'
    })
  }

  async improveContent(contentId, improvementType) {
    return this.request(`/content/${contentId}/improve`, {
      method: 'POST',
      body: JSON.stringify({ type: improvementType })
    })
  }

  async getContentStats() {
    return this.request('/content/stats')
  }

  // Analytics endpoints
  async getAnalyticsOverview(days = 30) {
    return this.request(`/analytics/overview?days=${days}`)
  }

  async getContentPerformance(days = 30, limit = 10) {
    return this.request(`/analytics/content-performance?days=${days}&limit=${limit}`)
  }

  async getContentDistribution(days = 30) {
    return this.request(`/analytics/content-distribution?days=${days}`)
  }

  async getDailyMetrics(days = 30) {
    return this.request(`/analytics/daily-metrics?days=${days}`)
  }

  async getPlatformPerformance(days = 30) {
    return this.request(`/analytics/platform-performance?days=${days}`)
  }

  async recordMetric(metricData) {
    return this.request('/analytics/record-metric', {
      method: 'POST',
      body: JSON.stringify(metricData)
    })
  }

  async generateSampleData(days = 30) {
    return this.request(`/analytics/generate-sample-data?days=${days}`, {
      method: 'POST'
    })
  }

  async exportAnalytics(days = 30, format = 'json') {
    return this.request(`/analytics/export?days=${days}&format=${format}`)
  }

  // Health check
  async healthCheck() {
    return this.request('/health')
  }

  // OCR - Extract text from image
  async extractTextFromImage(imageBase64) {
    return this.request('/content/extract-text', {
      method: 'POST',
      body: JSON.stringify({ image: imageBase64 })
    })
  }

  // Video Transcription - Extract text from video
  async transcribeVideo(videoBase64, filename) {
    return this.request('/content/transcribe-video', {
      method: 'POST',
      body: JSON.stringify({ video: videoBase64, filename })
    })
  }

  // URL Content Extraction - Extract text from URL
  async extractUrlContent(url) {
    return this.request('/content/extract-url', {
      method: 'POST',
      body: JSON.stringify({ url })
    })
  }

  // ==================== TEAM COLLABORATION ====================
  
  // Team Members
  async getTeamMembers() {
    return this.request('/team/members')
  }

  async inviteTeamMember(email) {
    return this.request('/team/members/invite', {
      method: 'POST',
      body: JSON.stringify({ email })
    })
  }

  async removeTeamMember(memberId) {
    return this.request(`/team/members/${memberId}`, {
      method: 'DELETE'
    })
  }

  // Projects
  async getTeamProjects() {
    return this.request('/team/projects')
  }

  async createTeamProject(projectData) {
    return this.request('/team/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    })
  }

  async deleteTeamProject(projectId) {
    return this.request(`/team/projects/${projectId}`, {
      method: 'DELETE'
    })
  }

  async addProjectMember(projectId, email) {
    return this.request(`/team/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email })
    })
  }

  async removeProjectMember(projectId, memberEmail) {
    return this.request(`/team/projects/${projectId}/members/${memberEmail}`, {
      method: 'DELETE'
    })
  }

  async updateProjectTasks(projectId, tasks) {
    return this.request(`/team/projects/${projectId}/tasks`, {
      method: 'PUT',
      body: JSON.stringify({ tasks })
    })
  }

  // Send task notification
  async sendTaskNotification(assigneeEmail, taskTitle, projectName, projectId, type = 'task_assigned') {
    return this.request('/team/notifications/task', {
      method: 'POST',
      body: JSON.stringify({
        assignee_email: assigneeEmail,
        task_title: taskTitle,
        project_name: projectName,
        project_id: projectId,
        type: type
      })
    })
  }

  // Get all notifications
  async getNotifications() {
    return this.request('/team/notifications')
  }

  // Mark notification as read
  async markNotificationRead(notificationId) {
    return this.request(`/team/notifications/${notificationId}/read`, {
      method: 'POST'
    })
  }

  // Collaboration Requests
  async getCollaborationRequests() {
    return this.request('/team/requests')
  }

  async getSentRequests() {
    return this.request('/team/requests/sent')
  }

  async acceptRequest(requestId) {
    return this.request(`/team/requests/${requestId}/accept`, {
      method: 'POST'
    })
  }

  async rejectRequest(requestId) {
    return this.request(`/team/requests/${requestId}/reject`, {
      method: 'POST'
    })
  }

  // Team Stats
  async getTeamStats() {
    return this.request('/team/stats')
  }

  // ==================== TEAM CHAT ====================
  
  async getChatConversations() {
    return this.request('/team/chat/conversations')
  }

  async getChatMessages(otherUserId) {
    return this.request(`/team/chat/${otherUserId}`)
  }

  async sendChatMessage(otherUserId, message) {
    return this.request(`/team/chat/${otherUserId}`, {
      method: 'POST',
      body: JSON.stringify({ message })
    })
  }

  async clearChat(otherUserId) {
    return this.request(`/team/chat/${otherUserId}/clear`, {
      method: 'DELETE'
    })
  }

  async exportChat(otherUserId) {
    return this.request(`/team/chat/${otherUserId}/export`)
  }

  // ==================== LINKOGENEI ====================
  
  async generateLinkoGeneiToken() {
    return this.request('/linkogenei/generate-token', {
      method: 'POST'
    })
  }
}

export default new ApiService()
