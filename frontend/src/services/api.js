import { auth } from '../config/firebase'

// Backend API URL - Update this after deploying your backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://contentgenei.onrender.com/api'  // Production backend URL
    : 'http://localhost:5001/api')

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
    
    // Log the request for debugging
    console.log(`[API] ${options.method || 'GET'} ${url}`)
    
    const config = {
      headers,
      ...options
    }

    try {
      const response = await fetch(url, config)
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error(`[API] Non-JSON response from ${url}:`, response.status, response.statusText)
        throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()

      if (!response.ok) {
        console.error(`[API] Error response from ${url}:`, data)
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error(`[API] Request failed for ${url}:`, error)
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

  // ==================== INSTAGRAM ANALYTICS ====================
  
  async getInstagramAuthUrl() {
    return this.request('/instagram/auth')
  }

  async getInstagramDebugConfig() {
    return this.request('/instagram/debug')
  }

  async debugInstagramMedia(connectionId) {
    return this.request(`/instagram/debug-media/${connectionId}`)
  }

  async exchangeInstagramToken(code, state) {
    return this.request('/instagram/exchange-token', {
      method: 'POST',
      body: JSON.stringify({ code, state })
    })
  }

  // Deprecated - use getInstagramAuthUrl instead
  async getInstagramOAuthUrl(redirectUri) {
    return this.request(`/instagram/oauth/url?redirect_uri=${encodeURIComponent(redirectUri)}`)
  }

  async handleInstagramCallback(code, redirectUri) {
    return this.request('/instagram/oauth/callback', {
      method: 'POST',
      body: JSON.stringify({ code, redirect_uri: redirectUri })
    })
  }

  async getInstagramConnections() {
    return this.request('/instagram/connections')
  }

  async getInstagramProfile(connectionId) {
    return this.request(`/instagram/profile/${connectionId}`)
  }

  async disconnectInstagram(connectionId) {
    return this.request(`/instagram/connections/${connectionId}`, {
      method: 'DELETE'
    })
  }

  async syncInstagramData(connectionId) {
    return this.request(`/instagram/sync/${connectionId}`, {
      method: 'POST'
    })
  }

  async getInstagramDashboard(connectionId) {
    return this.request(`/instagram/dashboard/${connectionId}`)
  }

  async generateInstagramSuggestions(postId) {
    return this.request(`/instagram/posts/${postId}/suggestions`, {
      method: 'POST'
    })
  }

  async getInstagramCompetitors() {
    return this.request('/instagram/competitors')
  }

  async addInstagramCompetitor(username) {
    return this.request('/instagram/competitors', {
      method: 'POST',
      body: JSON.stringify({ username })
    })
  }

  async removeInstagramCompetitor(competitorId) {
    return this.request(`/instagram/competitors/${competitorId}`, {
      method: 'DELETE'
    })
  }

  async compareInstagramAccounts(connectionId) {
    return this.request(`/instagram/compare/${connectionId}`)
  }

  // ==================== INSTAGRAM ADVANCED ANALYTICS ====================
  
  async getEnhancedMetrics(connectionId) {
    return this.request(`/instagram/analytics/enhanced-metrics/${connectionId}`)
  }

  async getCaptionAnalysis(connectionId) {
    return this.request(`/instagram/analytics/caption-analysis/${connectionId}`)
  }

  async getPostingTimeAnalysis(connectionId) {
    return this.request(`/instagram/analytics/posting-time-analysis/${connectionId}`)
  }

  async getFormatAnalysis(connectionId) {
    return this.request(`/instagram/analytics/format-analysis/${connectionId}`)
  }

  async analyzeSentiment(connectionId, comments, useGroq = false) {
    return this.request(`/instagram/analytics/sentiment-analysis/${connectionId}`, {
      method: 'POST',
      body: JSON.stringify({ comments, use_groq: useGroq })
    })
  }

  async identifyEmotionalTriggers(connectionId, commentsByPost) {
    return this.request(`/instagram/analytics/emotional-triggers/${connectionId}`, {
      method: 'POST',
      body: JSON.stringify({ comments_by_post: commentsByPost })
    })
  }

  async predictEngagement(connectionId, caption, mediaType, publishedAt) {
    return this.request(`/instagram/analytics/predict-engagement/${connectionId}`, {
      method: 'POST',
      body: JSON.stringify({ caption, media_type: mediaType, published_at: publishedAt })
    })
  }

  async getOptimalPostingTimes(connectionId) {
    return this.request(`/instagram/analytics/optimal-posting-times/${connectionId}`)
  }

  async getEnhancedCompetitorCompare(connectionId, competitorId) {
    return this.request(`/instagram/analytics/enhanced-competitor-compare/${connectionId}/${competitorId}`)
  }
}

export default new ApiService()
