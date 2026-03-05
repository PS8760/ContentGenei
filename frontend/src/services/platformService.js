import apiService from './api'

/**
 * Platform orchestration service
 * Handles multi-platform OAuth flows and connection management
 */
class PlatformService {
  /**
   * Trigger OAuth for selected platforms after onboarding
   * @param {Object} selectedPlatforms - Object with platform names as keys and boolean values
   * @returns {Promise<Object>} - OAuth URL or null if no platforms selected
   */
  async triggerPlatformOAuth(selectedPlatforms) {
    try {
      // Check which platforms are selected
      const platforms = Object.keys(selectedPlatforms).filter(
        platform => selectedPlatforms[platform] === true
      )

      if (platforms.length === 0) {
        console.log('No platforms selected for OAuth')
        return { success: true, requiresOAuth: false }
      }

      // For now, we only support Instagram
      // In the future, this can be extended to handle multiple platforms
      if (platforms.includes('instagram')) {
        console.log('Instagram selected - getting OAuth URL...')
        const response = await apiService.getInstagramAuthUrl()
        
        if (response.success && response.oauth_url) {
          return {
            success: true,
            requiresOAuth: true,
            platform: 'instagram',
            oauthUrl: response.oauth_url
          }
        } else {
          console.error('Failed to get Instagram OAuth URL:', response)
          return { success: false, error: 'Failed to get Instagram OAuth URL' }
        }
      }

      // Future platforms can be added here
      // if (platforms.includes('twitter')) { ... }
      // if (platforms.includes('linkedin')) { ... }

      return { success: true, requiresOAuth: false }
    } catch (error) {
      console.error('Error triggering platform OAuth:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get all connected platforms for the current user
   * @returns {Promise<Array>} - Array of connected platforms
   */
  async getConnectedPlatforms() {
    try {
      const connections = []

      // Get Instagram connections
      try {
        const instagramResponse = await apiService.getInstagramConnections()
        if (instagramResponse.success && instagramResponse.connections) {
          connections.push(...instagramResponse.connections.map(conn => ({
            ...conn,
            platform: 'instagram'
          })))
        }
      } catch (error) {
        console.error('Error fetching Instagram connections:', error)
      }

      // Future platforms can be added here
      // const twitterResponse = await apiService.getTwitterConnections()
      // const linkedinResponse = await apiService.getLinkedInConnections()

      return connections
    } catch (error) {
      console.error('Error getting connected platforms:', error)
      return []
    }
  }

  /**
   * Disconnect a platform account
   * @param {string} platform - Platform name (instagram, twitter, etc.)
   * @param {string} connectionId - Connection ID to disconnect
   * @returns {Promise<Object>} - Success response
   */
  async disconnectPlatform(platform, connectionId) {
    try {
      if (platform === 'instagram') {
        return await apiService.disconnectInstagram(connectionId)
      }

      // Future platforms can be added here
      // if (platform === 'twitter') { ... }
      // if (platform === 'linkedin') { ... }

      return { success: false, error: 'Unsupported platform' }
    } catch (error) {
      console.error(`Error disconnecting ${platform}:`, error)
      return { success: false, error: error.message }
    }
  }
}

export default new PlatformService()
