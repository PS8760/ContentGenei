"""Base class for platform integrations"""

class BasePlatform:
    """Base class for social media platform integrations"""
    
    def __init__(self):
        self.platform_name = None
    
    def get_oauth_url(self, state):
        """Generate OAuth URL for the platform"""
        raise NotImplementedError("Subclasses must implement get_oauth_url")
    
    def exchange_code_for_token(self, code):
        """Exchange authorization code for access token"""
        raise NotImplementedError("Subclasses must implement exchange_code_for_token")
    
    def get_user_profile(self, access_token):
        """Get user profile from the platform"""
        raise NotImplementedError("Subclasses must implement get_user_profile")
    
    def refresh_token(self, refresh_token):
        """Refresh access token"""
        raise NotImplementedError("Subclasses must implement refresh_token")
