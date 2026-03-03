import requests
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from flask import current_app
import os
import json

class InstagramService:
    """Service for interacting with Instagram Graph API"""
    
    def __init__(self):
        self.graph_api_base = "https://graph.instagram.com"
        self.graph_api_v2_base = "https://graph.facebook.com/v21.0"
        
    def get_oauth_url(self, state: str) -> str:
        """Generate Instagram OAuth URL using environment variables"""
        app_id = os.environ.get('INSTAGRAM_APP_ID')
        redirect_uri = os.environ.get('INSTAGRAM_REDIRECT_URI')
        scopes = os.environ.get('INSTAGRAM_SCOPES', 'instagram_business_basic,instagram_business_manage_comments,instagram_business_manage_messages')
        
        # Debug logging
        if current_app:
            current_app.logger.info(f"Building OAuth URL with:")
            current_app.logger.info(f"  App ID: {app_id[:10]}... (length: {len(app_id) if app_id else 0})")
            current_app.logger.info(f"  Redirect URI: {redirect_uri}")
            current_app.logger.info(f"  Scopes: {scopes}")
        
        if not app_id:
            raise ValueError("INSTAGRAM_APP_ID not configured in environment variables")
        if not redirect_uri:
            raise ValueError("INSTAGRAM_REDIRECT_URI not configured in environment variables")
        
        params = {
            'client_id': app_id,
            'redirect_uri': redirect_uri,
            'scope': scopes,
            'response_type': 'code',
            'state': state
        }
        
        query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        oauth_url = f"https://api.instagram.com/oauth/authorize?{query_string}"
        
        if current_app:
            current_app.logger.info(f"Generated OAuth URL: {oauth_url[:100]}...")
        
        return oauth_url
    
    def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        app_id = os.environ.get('INSTAGRAM_APP_ID')
        app_secret = os.environ.get('INSTAGRAM_APP_SECRET')
        redirect_uri = os.environ.get('INSTAGRAM_REDIRECT_URI')
        
        if current_app:
            current_app.logger.info(f"Exchanging code for token with redirect_uri: {redirect_uri}")
        
        url = "https://api.instagram.com/oauth/access_token"
        data = {
            'client_id': app_id,
            'client_secret': app_secret,
            'grant_type': 'authorization_code',
            'redirect_uri': redirect_uri,
            'code': code
        }
        
        response = requests.post(url, data=data)
        response.raise_for_status()
        
        return response.json()
    
    def get_long_lived_token(self, short_lived_token: str) -> Dict[str, Any]:
        """Exchange short-lived token for long-lived token (60 days)"""
        app_secret = os.environ.get('INSTAGRAM_APP_SECRET')
        
        url = f"{self.graph_api_base}/access_token"
        params = {
            'grant_type': 'ig_exchange_token',
            'client_secret': app_secret,
            'access_token': short_lived_token
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        return response.json()
    
    def get_user_profile(self, access_token: str) -> Dict[str, Any]:
        """Get Instagram user profile information including followers"""
        url = f"{self.graph_api_base}/me"
        params = {
            'fields': 'id,username,account_type,media_count,followers_count',
            'access_token': access_token
        }
        
        if current_app:
            current_app.logger.info(f"Fetching profile with fields: {params['fields']}")
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        profile_data = response.json()
        
        if current_app:
            current_app.logger.info(f"Profile data: username={profile_data.get('username')}, followers={profile_data.get('followers_count', 'N/A')}")
        
        return profile_data
    
    def get_user_insights(self, instagram_user_id: str, access_token: str) -> Dict[str, Any]:
        """Get account-level insights (followers, reach, etc.)"""
        url = f"{self.graph_api_base}/{instagram_user_id}/insights"
        params = {
            'metric': 'follower_count,reach,impressions,profile_views',
            'period': 'day',
            'access_token': access_token
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            current_app.logger.warning(f"Could not fetch insights: {str(e)}")
            return {'data': []}
    
    def get_user_media(self, instagram_user_id: str, access_token: str, limit: int = 30) -> List[Dict[str, Any]]:
        """Get user's recent media posts with engagement metrics"""
        url = f"{self.graph_api_base}/{instagram_user_id}/media"
        params = {
            'fields': 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
            'limit': limit,
            'access_token': access_token
        }
        
        if current_app:
            current_app.logger.info(f"Fetching media from: {url}")
            current_app.logger.info(f"Fields requested: {params['fields']}")
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            media_list = data.get('data', [])
            
            if current_app:
                current_app.logger.info(f"Received {len(media_list)} media items")
                if media_list:
                    # Log first item as sample
                    sample = media_list[0]
                    current_app.logger.info(f"Sample media: id={sample.get('id')}, like_count={sample.get('like_count')}, comments_count={sample.get('comments_count')}")
            
            return media_list
            
        except requests.exceptions.HTTPError as e:
            if current_app:
                current_app.logger.error(f"HTTP error fetching media: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            if current_app:
                current_app.logger.error(f"Error fetching media: {str(e)}")
            raise
    
    def get_media_insights(self, media_id: str, access_token: str) -> Dict[str, Any]:
        """Get insights for a specific media post"""
        url = f"{self.graph_api_base}/{media_id}/insights"
        
        # Try different metric combinations based on media type
        # Some metrics may not be available for all post types
        params = {
            'metric': 'impressions,reach,saved',
            'access_token': access_token
        }
        
        if current_app:
            current_app.logger.info(f"Fetching insights for media {media_id}")
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            insights = data.get('data', [])
            
            if current_app:
                current_app.logger.info(f"Received {len(insights)} insights for media {media_id}")
                for insight in insights:
                    current_app.logger.info(f"  {insight.get('name')}: {insight.get('values', [{}])[0].get('value', 0)}")
            
            return data
            
        except requests.exceptions.HTTPError as e:
            error_data = {}
            try:
                error_data = e.response.json()
            except:
                pass
            
            if current_app:
                current_app.logger.warning(f"Could not fetch insights for media {media_id}: {e.response.status_code}")
                current_app.logger.warning(f"Error details: {error_data}")
                
                # Check if it's a permissions issue
                if e.response.status_code == 403:
                    current_app.logger.warning("Insights require instagram_manage_insights permission")
                elif e.response.status_code == 400:
                    error_message = error_data.get('error', {}).get('message', '')
                    if 'Unsupported get request' in error_message:
                        current_app.logger.warning("This media type may not support insights")
            
            return {'data': []}
        except Exception as e:
            if current_app:
                current_app.logger.warning(f"Error fetching insights for media {media_id}: {str(e)}")
            return {'data': []}
    
    def calculate_engagement_rate(self, likes: int, comments: int, followers: int) -> float:
        """Calculate engagement rate as percentage"""
        if followers == 0:
            return 0.0
        
        engagement = likes + comments
        return round((engagement / followers) * 100, 2)
    
    def detect_underperforming_posts(self, posts: List[Dict[str, Any]], threshold: float = 0.7) -> List[Dict[str, Any]]:
        """
        Detect underperforming posts based on engagement rate
        threshold: posts below (average * threshold) are flagged
        """
        if not posts:
            return []
        
        # Calculate average engagement rate
        engagement_rates = [p.get('engagement_rate', 0) for p in posts if p.get('engagement_rate', 0) > 0]
        
        if not engagement_rates:
            return []
        
        avg_engagement = sum(engagement_rates) / len(engagement_rates)
        threshold_value = avg_engagement * threshold
        
        underperforming = []
        for post in posts:
            post_engagement = post.get('engagement_rate', 0)
            if post_engagement > 0 and post_engagement < threshold_value:
                post['is_underperforming'] = True
                post['performance_score'] = round((post_engagement / avg_engagement) * 100, 1)
                post['avg_engagement_rate'] = round(avg_engagement, 2)
                underperforming.append(post)
        
        return underperforming
    
    def get_public_profile_data(self, username: str) -> Optional[Dict[str, Any]]:
        """
        Get public profile data for competitor analysis
        Note: This requires Instagram Basic Display API or scraping (limited)
        For production, you'd use official APIs or third-party services
        """
        # This is a placeholder - in production, you'd use:
        # 1. Instagram Basic Display API (requires user auth)
        # 2. Instagram Graph API (for business accounts)
        # 3. Third-party services like RapidAPI
        
        # For now, return mock data structure
        return {
            'username': username,
            'followers_count': 0,
            'follows_count': 0,
            'media_count': 0,
            'note': 'Public API access limited - connect competitor account or use third-party service'
        }
    
    def analyze_competitor(self, username: str, access_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze competitor account
        Limited to public data or requires competitor to grant access
        """
        profile_data = self.get_public_profile_data(username)
        
        return {
            'username': username,
            'followers_count': profile_data.get('followers_count', 0),
            'follows_count': profile_data.get('follows_count', 0),
            'media_count': profile_data.get('media_count', 0),
            'avg_likes': 0,
            'avg_comments': 0,
            'avg_engagement_rate': 0,
            'posting_frequency': 0,
            'note': profile_data.get('note', '')
        }
