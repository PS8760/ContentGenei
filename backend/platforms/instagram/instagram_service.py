import os
import requests
from platforms.base_platform import BasePlatform
from urllib.parse import urlencode

class InstagramService(BasePlatform):
    """Instagram OAuth and API service - Instagram Basic Display API"""
    
    def __init__(self):
        super().__init__()
        self.platform_name = 'instagram'
        self.app_id = os.environ.get('INSTAGRAM_APP_ID')
        self.app_secret = os.environ.get('INSTAGRAM_APP_SECRET')
        self.redirect_uri = os.environ.get('INSTAGRAM_REDIRECT_URI')
        
        # Instagram Basic Display API scopes (works for personal accounts)
        # Valid scopes: user_profile, user_media
        self.scopes = os.environ.get('INSTAGRAM_SCOPES', 'user_profile,user_media')
        
        # API endpoints - Instagram Basic Display API
        self.oauth_url = 'https://api.instagram.com/oauth/authorize'
        self.token_url = 'https://api.instagram.com/oauth/access_token'
        self.graph_url = 'https://graph.instagram.com'
    
    def get_oauth_url(self, state):
        """Generate Instagram OAuth URL"""
        params = {
            'client_id': self.app_id,
            'redirect_uri': self.redirect_uri,
            'scope': self.scopes,
            'response_type': 'code',
            'state': state
        }
        
        return f"{self.oauth_url}?{urlencode(params)}"
    
    def exchange_code_for_token(self, code):
        """Exchange authorization code for short-lived access token"""
        data = {
            'client_id': self.app_id,
            'client_secret': self.app_secret,
            'grant_type': 'authorization_code',
            'redirect_uri': self.redirect_uri,
            'code': code
        }
        
        response = requests.post(self.token_url, data=data)
        response.raise_for_status()
        
        return response.json()
    
    def get_long_lived_token(self, short_lived_token):
        """Exchange short-lived token for long-lived token (60 days)"""
        url = f"{self.graph_url}/access_token"
        params = {
            'grant_type': 'ig_exchange_token',
            'client_secret': self.app_secret,
            'access_token': short_lived_token
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        return response.json()
    
    def get_user_profile(self, access_token):
        """Get Instagram user profile with extended fields"""
        url = f"{self.graph_url}/me"
        params = {
            'fields': 'id,username,account_type,media_count,followers_count,follows_count',
            'access_token': access_token
        }
        
        # Note: followers_count and follows_count are available for Business/Creator accounts
        # Personal accounts using Instagram Basic Display API will only get basic fields
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        profile_data = response.json()
        
        # Log what we received
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Instagram profile data received: {list(profile_data.keys())}")
        logger.info(f"Account type: {profile_data.get('account_type')}")
        logger.info(f"Followers: {profile_data.get('followers_count', 'N/A')}, Follows: {profile_data.get('follows_count', 'N/A')}")
        
        return profile_data
    
    def refresh_token(self, access_token):
        """Refresh long-lived token (extends by 60 days)"""
        url = f"{self.graph_url}/refresh_access_token"
        params = {
            'grant_type': 'ig_refresh_token',
            'access_token': access_token
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        return response.json()

    
    def get_user_insights(self, instagram_user_id, access_token):
        """Get account-level insights (followers, reach, impressions, profile_views)"""
        url = f"{self.graph_url}/{instagram_user_id}/insights"
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
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Could not fetch insights: {str(e)}")
            return {'data': []}
    
    def get_user_media(self, instagram_user_id, access_token, limit=30):
        """Get user's recent media posts with engagement metrics"""
        url = f"{self.graph_url}/{instagram_user_id}/media"
        params = {
            'fields': 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
            'limit': limit,
            'access_token': access_token
        }
        
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Fetching media from: {url}")
        logger.info(f"Fields requested: {params['fields']}")
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            media_list = data.get('data', [])
            
            logger.info(f"Received {len(media_list)} media items")
            if media_list:
                # Log first item as sample
                sample = media_list[0]
                logger.info(f"Sample media: id={sample.get('id')}, like_count={sample.get('like_count')}, comments_count={sample.get('comments_count')}")
            
            return media_list
            
        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error fetching media: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Error fetching media: {str(e)}")
            raise
    
    def get_media_insights(self, media_id, access_token):
        """Get insights for a specific media post (reach, impressions, saves)"""
        url = f"{self.graph_url}/{media_id}/insights"
        
        # Try different metric combinations based on media type
        # Some metrics may not be available for all post types
        params = {
            'metric': 'impressions,reach,saved',
            'access_token': access_token
        }
        
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Fetching insights for media {media_id}")
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            insights = data.get('data', [])
            
            logger.info(f"Received {len(insights)} insights for media {media_id}")
            for insight in insights:
                logger.info(f"  {insight.get('name')}: {insight.get('values', [{}])[0].get('value', 0)}")
            
            return data
            
        except requests.exceptions.HTTPError as e:
            error_data = {}
            try:
                error_data = e.response.json()
            except:
                pass
            
            logger.warning(f"Could not fetch insights for media {media_id}: {e.response.status_code}")
            logger.warning(f"Error details: {error_data}")
            
            # Check if it's a permissions issue
            if e.response.status_code == 403:
                logger.warning("Insights require instagram_manage_insights permission")
            elif e.response.status_code == 400:
                error_message = error_data.get('error', {}).get('message', '')
                if 'Unsupported get request' in error_message:
                    logger.warning("This media type may not support insights")
            
            return {'data': []}
        except Exception as e:
            logger.warning(f"Error fetching insights for media {media_id}: {str(e)}")
            return {'data': []}
    
    def calculate_engagement_rate(self, likes, comments, followers):
        """Calculate engagement rate as percentage"""
        if followers == 0:
            return 0.0
        
        engagement = likes + comments
        return round((engagement / followers) * 100, 2)
    
    def detect_underperforming_posts(self, posts, threshold=0.7):
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
    
    def get_public_profile_data(self, username, access_token=None):
        """
        Get public profile data for competitor analysis using Business Discovery API
        Requires: Business or Creator Instagram account with valid access token
        """
        if not access_token:
            return {
                'username': username,
                'followers_count': 0,
                'follows_count': 0,
                'media_count': 0,
                'note': 'Requires Business/Creator account to fetch competitor data'
            }
        
        try:
            # Use Instagram Business Discovery API
            # This allows business accounts to get public data of other business accounts
            url = f"{self.graph_api_url}/me"
            params = {
                'fields': f'business_discovery.username({username}){{followers_count,follows_count,media_count,media{{like_count,comments_count,timestamp}}}}',
                'access_token': access_token
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            business_discovery = data.get('business_discovery', {})
            
            # Calculate average engagement from recent media
            media_data = business_discovery.get('media', {}).get('data', [])
            avg_likes = 0
            avg_comments = 0
            
            if media_data:
                total_likes = sum(m.get('like_count', 0) for m in media_data)
                total_comments = sum(m.get('comments_count', 0) for m in media_data)
                avg_likes = total_likes / len(media_data)
                avg_comments = total_comments / len(media_data)
            
            followers = business_discovery.get('followers_count', 0)
            avg_engagement_rate = 0
            if followers > 0 and media_data:
                avg_engagement_rate = ((avg_likes + avg_comments) / followers) * 100
            
            return {
                'username': username,
                'followers_count': followers,
                'follows_count': business_discovery.get('follows_count', 0),
                'media_count': business_discovery.get('media_count', 0),
                'avg_likes': round(avg_likes, 1),
                'avg_comments': round(avg_comments, 1),
                'avg_engagement_rate': round(avg_engagement_rate, 2),
                'note': ''
            }
            
        except requests.exceptions.HTTPError as e:
            error_data = e.response.json() if e.response else {}
            error_message = error_data.get('error', {}).get('message', str(e))
            
            # Check for specific errors
            if 'business account' in error_message.lower():
                note = f'@{username} must be a Business or Creator account to fetch data'
            elif 'not found' in error_message.lower():
                note = f'@{username} not found or account is private'
            else:
                note = f'Unable to fetch data: {error_message}'
            
            return {
                'username': username,
                'followers_count': 0,
                'follows_count': 0,
                'media_count': 0,
                'avg_likes': 0,
                'avg_comments': 0,
                'avg_engagement_rate': 0,
                'note': note
            }
        except Exception as e:
            return {
                'username': username,
                'followers_count': 0,
                'follows_count': 0,
                'media_count': 0,
                'avg_likes': 0,
                'avg_comments': 0,
                'avg_engagement_rate': 0,
                'note': f'Error fetching data: {str(e)}'
            }
    
    def analyze_competitor(self, username, access_token=None):
        """
        Analyze competitor account using Business Discovery API
        Requires: Business or Creator Instagram account
        """
        profile_data = self.get_public_profile_data(username, access_token)
        
        return {
            'username': username,
            'followers_count': profile_data.get('followers_count', 0),
            'follows_count': profile_data.get('follows_count', 0),
            'media_count': profile_data.get('media_count', 0),
            'avg_likes': profile_data.get('avg_likes', 0),
            'avg_comments': profile_data.get('avg_comments', 0),
            'avg_engagement_rate': profile_data.get('avg_engagement_rate', 0),
            'posting_frequency': 0,  # Would need historical data to calculate
            'note': profile_data.get('note', '')
        }
