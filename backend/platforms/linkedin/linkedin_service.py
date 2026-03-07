import os
import requests
from platforms.base_platform import BasePlatform
from urllib.parse import urlencode

class LinkedInService(BasePlatform):
    """LinkedIn OAuth and API service"""
    
    def __init__(self):
        super().__init__()
        self.platform_name = 'linkedin'
        self.client_id = os.environ.get('LINKEDIN_CLIENT_ID')
        self.client_secret = os.environ.get('LINKEDIN_CLIENT_SECRET')
        self.redirect_uri = os.environ.get('LINKEDIN_REDIRECT_URI')
        
        # LinkedIn OAuth scopes
        # Note: Most data requires LinkedIn Partner Program access
        # Available scopes: openid, profile, email, w_member_social
        # Limited scopes: r_liteprofile (deprecated), r_basicprofile (requires partner access)
        self.scopes = os.environ.get('LINKEDIN_SCOPES', 'openid,profile,email,w_member_social,r_liteprofile')
        
        # API endpoints
        self.oauth_url = 'https://www.linkedin.com/oauth/v2/authorization'
        self.token_url = 'https://www.linkedin.com/oauth/v2/accessToken'
        self.api_base_url = 'https://api.linkedin.com/v2'
    
    def get_oauth_url(self, state):
        """Generate LinkedIn OAuth URL"""
        params = {
            'response_type': 'code',
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'scope': self.scopes,
            'state': state
        }
        
        return f"{self.oauth_url}?{urlencode(params)}"
    
    def exchange_code_for_token(self, code):
        """Exchange authorization code for access token"""
        print(f"Using redirect_uri: {self.redirect_uri}")
        
        data = {
            'grant_type': 'authorization_code',
            'code': code,
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'redirect_uri': self.redirect_uri
        }
        
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        response = requests.post(self.token_url, data=data, headers=headers)
        
        # Add detailed error logging
        print(f"LinkedIn token response status: {response.status_code}")
        print(f"LinkedIn token response body: {response.text}")
        
        response.raise_for_status()
        
        return response.json()
    
    def get_user_profile(self, access_token):
        """Get user profile from LinkedIn using OpenID Connect userinfo endpoint"""
        headers = {
            'Authorization': f'Bearer {access_token}'
        }
        
        profile_data = {}
        
        # Use OpenID Connect userinfo endpoint (basic profile)
        try:
            response = requests.get('https://api.linkedin.com/v2/userinfo', headers=headers)
            response.raise_for_status()
            profile_data = response.json()
            print(f"LinkedIn userinfo response: {profile_data}")
        except Exception as e:
            print(f"Error fetching userinfo: {str(e)}")
        
        # Try to get additional profile data from v2 API
        try:
            me_response = requests.get(
                'https://api.linkedin.com/v2/me',
                headers={
                    'Authorization': f'Bearer {access_token}',
                    'X-Restli-Protocol-Version': '2.0.0'
                }
            )
            if me_response.status_code == 200:
                me_data = me_response.json()
                print(f"LinkedIn /me response: {me_data}")
                # Merge additional data
                profile_data['linkedin_id'] = me_data.get('id')
                profile_data['firstName'] = me_data.get('localizedFirstName')
                profile_data['lastName'] = me_data.get('localizedLastName')
        except Exception as e:
            print(f"Error fetching /me: {str(e)}")
        
        return profile_data
    
    def get_connection_count(self, access_token):
        """
        Get user's connection count
        Note: This requires r_basicprofile or r_liteprofile scope
        Most apps won't have access without LinkedIn Partner Program
        """
        headers = {
            'Authorization': f'Bearer {access_token}',
            'X-Restli-Protocol-Version': '2.0.0'
        }
        
        # Try multiple approaches to get connection count
        try:
            # Try v2 connections endpoint
            response = requests.get(
                'https://api.linkedin.com/v2/connections?q=viewer&count=0',
                headers=headers
            )
            print(f"Connections endpoint status: {response.status_code}")
            print(f"Connections response: {response.text[:500]}")
            
            if response.status_code == 200:
                data = response.json()
                total = data.get('paging', {}).get('total', 0)
                print(f"✓ Connections count: {total}")
                return total
            elif response.status_code == 403:
                print("403 Forbidden - r_basicprofile scope required for connections")
            elif response.status_code == 401:
                print("401 Unauthorized - Token may be invalid")
                
        except Exception as e:
            print(f"Error fetching connections: {str(e)}")
        
        # Try alternative: Get profile with connection count (if available)
        try:
            # Some LinkedIn API versions include connection count in profile
            response = requests.get(
                'https://api.linkedin.com/v2/me?projection=(id,vanityName,localizedFirstName,localizedLastName,numConnections)',
                headers=headers
            )
            print(f"Profile with connections status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                num_connections = data.get('numConnections', 0)
                if num_connections > 0:
                    print(f"✓ Found connections in profile: {num_connections}")
                    return num_connections
                    
        except Exception as e:
            print(f"Error fetching profile connections: {str(e)}")
        
        print("Unable to fetch connection count - returning 0")
        return 0
    
    def get_follower_statistics(self, access_token, linkedin_user_id):
        """
        Get follower statistics for organization/creator accounts
        Note: Requires specific permissions and account type
        """
        headers = {
            'Authorization': f'Bearer {access_token}',
            'X-Restli-Protocol-Version': '2.0.0'
        }
        
        stats = {
            'followers_count': 0,
            'post_impressions': 0,
            'engagement_rate': 0
        }
        
        try:
            # Try organization statistics endpoint (for company pages)
            response = requests.get(
                f'https://api.linkedin.com/v2/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:{linkedin_user_id}',
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"Follower stats response: {data}")
                # Parse follower statistics
                elements = data.get('elements', [])
                if elements:
                    stats['followers_count'] = elements[0].get('followerCounts', {}).get('organicFollowerCount', 0)
                    
        except Exception as e:
            print(f"Error fetching follower stats: {str(e)}")
        
        return stats
    
    def get_user_posts(self, access_token, linkedin_user_id, count=50):
        """
        Get user's LinkedIn posts
        Note: Requires w_member_social scope (write only) or r_organization_social (partner access)
        Most apps won't have access to read posts without LinkedIn Partner Program
        """
        headers = {
            'Authorization': f'Bearer {access_token}',
            'X-Restli-Protocol-Version': '2.0.0',
            'LinkedIn-Version': '202405'
        }
        
        posts_data = {'elements': []}
        
        # Try multiple endpoints to get posts
        endpoints_to_try = [
            # UGC Posts API (requires partner access or w_member_social for own posts)
            {
                'url': f'{self.api_base_url}/ugcPosts',
                'params': {
                    'q': 'authors',
                    'authors': f'urn:li:person:{linkedin_user_id}',
                    'count': count
                }
            },
            # Try shares endpoint
            {
                'url': f'{self.api_base_url}/shares',
                'params': {
                    'q': 'owners',
                    'owners': f'urn:li:person:{linkedin_user_id}',
                    'count': count
                }
            }
        ]
        
        for endpoint in endpoints_to_try:
            try:
                print(f"Trying LinkedIn endpoint: {endpoint['url']}")
                response = requests.get(
                    endpoint['url'],
                    headers=headers,
                    params=endpoint['params']
                )
                
                print(f"Response status: {response.status_code}")
                print(f"Response body: {response.text[:500]}")
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('elements'):
                        print(f"✓ Found {len(data['elements'])} posts")
                        return data
                elif response.status_code == 403:
                    print(f"403 Forbidden - Missing required permissions")
                elif response.status_code == 401:
                    print(f"401 Unauthorized - Token may be invalid")
                    
            except Exception as e:
                print(f"Error trying endpoint {endpoint['url']}: {str(e)}")
                continue
        
        print("No posts found from any endpoint - returning empty")
        return posts_data
    
    def refresh_token(self, refresh_token):
        """LinkedIn doesn't provide refresh tokens in the basic OAuth flow"""
        raise NotImplementedError("LinkedIn OAuth 2.0 doesn't support refresh tokens")
