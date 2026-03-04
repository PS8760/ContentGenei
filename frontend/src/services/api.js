import { auth } from '../config/firebase'

// Backend API URL - Update this after deploying your backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://contentgenei.onrender.com'  // Production backend URL (no /api)
    : 'http://localhost:5001')  // Local backend URL (no /api)

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
    console.log('API Base URL:', this.baseURL)  // Debug log
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
    // Ensure endpoint starts with /api if not already
    const apiEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`
    const url = `${this.baseURL}${apiEndpoint}`
    const headers = await this.getAuthHeaders()
    
    console.log('API Request:', url)  // Debug log
    
    const config = {
      headers,
      ...options
    }

    try {
      const response = await fetch(url, config)
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Endpoint not found`)
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
  
  async getTeamChatConversations() {
    return this.request('/team/chat/conversations')
  }

  async getTeamChatMessages(otherUserId) {
    return this.request(`/team/chat/${otherUserId}`)
  }

  async sendTeamChatMessage(otherUserId, message) {
    return this.request(`/team/chat/${otherUserId}`, {
      method: 'POST',
      body: JSON.stringify({ message })
    })
  }

  async clearTeamChat(otherUserId) {
    return this.request(`/team/chat/${otherUserId}/clear`, {
      method: 'DELETE'
    })
  }

  async exportTeamChat(otherUserId) {
    return this.request(`/team/chat/${otherUserId}/export`)
  }

  // ==================== LINKOGENEI ====================
  
  async generateLinkoGeneiToken() {
    return this.request('/linkogenei/generate-token', {
      method: 'POST'
    })
  }

  async getAggregatedPosts(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/linkogenei/posts?${queryString}` : '/linkogenei/posts'
    return this.request(endpoint)
  }

  async getSavedPosts(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/linkogenei/posts?${queryString}` : '/linkogenei/posts'
    return this.request(endpoint)
  }

  async getCategories() {
    return this.request('/linkogenei/categories')
  }

  async createCategory(categoryData) {
    return this.request('/linkogenei/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    })
  }

  async deleteCategory(categoryId) {
    return this.request(`/linkogenei/categories/${categoryId}`, {
      method: 'DELETE'
    })
  }

  async savePost(postData) {
    return this.request('/linkogenei/save-post', {
      method: 'POST',
      body: JSON.stringify(postData)
    })
  }

  async initiateOAuth(platform) {
    return this.request(`/geneilink/oauth/${platform}`)
  }

  async getConnections() {
    return this.request('/geneilink/connections')
  }

  async disconnectPlatform(connectionId) {
    return this.request(`/geneilink/connections/${connectionId}`, {
      method: 'DELETE'
    })
  }

  // ==================== ALEX CHAT ====================
  
  async getAlexChatConversations() {
    return this.request('/chat/conversations')
  }

  async getAlexChatMessages(conversationId) {
    return this.request(`/chat/conversations/${conversationId}/messages`)
  }

  async createAlexChatConversation(title) {
    return this.request('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ title })
    })
  }

  async sendAlexChatMessage(conversationId, role, content) {
    return this.request(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ role, content })
    })
  }

  async deleteAlexChatConversation(conversationId) {
    return this.request(`/chat/conversations/${conversationId}`, {
      method: 'DELETE'
    })
  }

  async updateAlexChatConversation(conversationId, title) {
    return this.request(`/chat/conversations/${conversationId}`, {
      method: 'PUT',
      body: JSON.stringify({ title })
    })
  }

  // ==================== NOTIFICATIONS ====================
  
  async getNotifications(unreadOnly = false) {
    return this.request(`/notifications?unread_only=${unreadOnly}`)
  }

  async markNotificationRead(notificationId) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    })
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', {
      method: 'PUT'
    })
  }

  async deleteNotification(notificationId) {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE'
    })
  }

  async clearAllNotifications() {
    return this.request('/notifications/clear-all', {
      method: 'DELETE'
    })
  }

  // ==================== TEAM COLLABORATION - ADDITIONAL ENDPOINTS ====================
  
  // Review task (approve or request changes)
  async reviewTask(projectId, taskId, reviewData) {
    return this.request(`/team/projects/${projectId}/tasks/${taskId}/review`, {
      method: 'POST',
      body: JSON.stringify(reviewData)
    })
  }

  // Add project member
  async addProjectMember(projectId, memberEmail) {
    return this.request(`/team/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify({ member_email: memberEmail })
    })
  }

  // Remove project member
  async removeProjectMember(projectId, memberEmail) {
    return this.request(`/team/projects/${projectId}/members`, {
      method: 'DELETE',
      body: JSON.stringify({ member_email: memberEmail })
    })
  }

  // Update project tasks
  async updateProjectTasks(projectId, tasks) {
    return this.request(`/team/projects/${projectId}/tasks`, {
      method: 'PUT',
      body: JSON.stringify({ tasks })
    })
  }

  // Send task notification
  async sendTaskNotification(assigneeEmail, taskTitle, projectName, projectId, notificationType) {
    return this.request('/team/notifications/task', {
      method: 'POST',
      body: JSON.stringify({
        assignee_email: assigneeEmail,
        task_title: taskTitle,
        project_name: projectName,
        project_id: projectId,
        notification_type: notificationType
      })
    })
  }

  // Chat aliases for team chat (for compatibility)
  async getChatConversations() {
    return this.getTeamChatConversations()
  }

  async getChatMessages(otherUserId) {
    return this.getTeamChatMessages(otherUserId)
  }

  async sendChatMessage(otherUserId, message) {
    return this.sendTeamChatMessage(otherUserId, message)
  }

  async clearChat(otherUserId) {
    return this.clearTeamChat(otherUserId)
  }

  async exportChat(otherUserId) {
    return this.exportTeamChat(otherUserId)
  }

  // ==================== ROLE MANAGEMENT ====================
  
  // Update member role in project
  async updateMemberRole(projectId, memberEmail, role) {
    return this.request(`/team/projects/${projectId}/members/${memberEmail}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    })
  }

  // Transfer project leadership
  async transferLeadership(projectId, newLeaderEmail) {
    return this.request(`/team/projects/${projectId}/transfer-leadership`, {
      method: 'POST',
      body: JSON.stringify({ new_leader_email: newLeaderEmail })
    })
  }

  // Accept leadership transfer
  async acceptLeadershipTransfer(requestId) {
    return this.request(`/team/requests/${requestId}/accept-leadership`, {
      method: 'POST'
    })
  }

  // ==================== TASK SUBMISSIONS ====================
  
  // Submit task with work details
  async submitTask(projectId, taskId, submissionData) {
    return this.request(`/team/projects/${projectId}/tasks/${taskId}/submit`, {
      method: 'POST',
      body: JSON.stringify(submissionData)
    })
  }

  // ==================== DAILY UPDATES ====================
  
  // Post daily update to project
  async postDailyUpdate(projectId, updateText) {
    return this.request(`/team/projects/${projectId}/daily-update`, {
      method: 'POST',
      body: JSON.stringify({ update_text: updateText })
    })
  }

  // Get daily updates for project
  async getDailyUpdates(projectId) {
    return this.request(`/team/projects/${projectId}/daily-updates`)
  }

  // ==================== PROJECT INVITATION LINKS ====================
  
  // Generate invitation link
  async generateInvitationLink(projectId) {
    return this.request(`/team/projects/${projectId}/invitation-link`, {
      method: 'POST'
    })
  }

  // Join project via invitation link
  async joinProjectViaLink(projectId, invitationToken) {
    return this.request(`/team/projects/join/${projectId}/${invitationToken}`, {
      method: 'POST'
    })
  }

  // ==================== PROJECT REPORTS ====================
  
  // Get project report (for leaders)
  async getProjectReport(projectId) {
    return this.request(`/team/projects/${projectId}/report`)
  }

  // ==================== PROJECT GROUP CHAT ====================
  
  // Get project chat messages
  async getProjectChatMessages(projectId) {
    return this.request(`/team/projects/${projectId}/chat/messages`)
  }

  // Send project chat message
  async sendProjectChatMessage(projectId, message) {
    return this.request(`/team/projects/${projectId}/chat/messages`, {
      method: 'POST',
      body: JSON.stringify({ message })
    })
  }

  // ==================== PUBLIC USER DIRECTORY ====================
  
  // Get all registered users (public directory)
  async getUserDirectory() {
    return this.request('/team/users/directory')
  }

  // ==================== TEAM ACTIVITY ====================
  
  // Get team activity feed
  async getTeamActivity(limit = 50) {
    return this.request(`/team/activity?limit=${limit}`)
  }

  // ==================== ADMIN ENDPOINTS ====================
  
  // Get admin dashboard stats
  async getAdminDashboardStats() {
    return this.request('/api/admin/dashboard/stats')
  }

  // Get all users (admin only)
  async getAdminUsers(page = 1, perPage = 20, search = '') {
    return this.request(`/api/admin/users?page=${page}&per_page=${perPage}&search=${encodeURIComponent(search)}`)
  }

  // Get user details (admin only)
  async getAdminUserDetails(userId) {
    return this.request(`/api/admin/users/${userId}`)
  }

  // Toggle admin status
  async toggleAdminStatus(userId) {
    return this.request(`/api/admin/users/${userId}/toggle-admin`, {
      method: 'PUT'
    })
  }

  // Toggle premium status
  async togglePremiumStatus(userId) {
    return this.request(`/api/admin/users/${userId}/toggle-premium`, {
      method: 'PUT'
    })
  }

  // Toggle active status (ban/unban)
  async toggleActiveStatus(userId) {
    return this.request(`/api/admin/users/${userId}/toggle-active`, {
      method: 'PUT'
    })
  }

  // Delete user (admin only)
  async deleteUser(userId) {
    return this.request(`/api/admin/users/${userId}`, {
      method: 'DELETE'
    })
  }

  // Get recent content (admin only)
  async getAdminRecentContent(limit = 50) {
    return this.request(`/api/admin/content/recent?limit=${limit}`)
  }

  // Get all projects (admin only)
  async getAdminProjects() {
    return this.request('/api/admin/projects')
  }

  // Delete project (admin only)
  async deleteAdminProject(projectId) {
    return this.request(`/api/admin/projects/${projectId}`, {
      method: 'DELETE'
    })
  }

  // Get activity logs (admin only)
  async getAdminActivityLogs(limit = 100) {
    return this.request(`/api/admin/logs/activity?limit=${limit}`)
  }
}

export default new ApiService()
