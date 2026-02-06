import { auth } from '../config/firebase'

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-domain.com/api'  // Replace with your production backend URL
  : 'http://localhost:5000/api'

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  async getAuthHeaders() {
    // Try to get stored access token first
    const accessToken = localStorage.getItem('access_token')
    if (accessToken) {
      return {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
    
    // Fallback to Firebase token
    const user = auth.currentUser
    if (user) {
      const token = await user.getIdToken()
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
    
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
    return this.request('/auth/profile')
  }

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
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
}

export default new ApiService()
