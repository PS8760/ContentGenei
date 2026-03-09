"""
Apify Service for Social Media Scraping
Handles Instagram, LinkedIn, Twitter, and YouTube data scraping
"""

import requests
import time
from config import Config

class ApifyService:
    def __init__(self):
        self.api_key = Config.APIFY_API_KEY
        self.base_url = 'https://api.apify.com/v2'
        
        if not self.api_key:
            print("WARNING: APIFY_API_KEY not configured")
    
    def scrape_instagram_profile(self, username):
        """
        Scrape Instagram profile data using Apify
        
        Args:
            username (str): Instagram username (without @)
            
        Returns:
            dict: Profile data or error
        """
        if not self.api_key:
            return {
                'success': False,
                'error': 'Apify API key not configured'
            }
        
        try:
            # Use Instagram Profile Scraper actor
            actor_id = 'apify~instagram-profile-scraper'
            
            # Start the actor run
            run_url = f'{self.base_url}/acts/{actor_id}/runs'
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'usernames': [username],
                'resultsLimit': 1
            }
            
            print(f"Starting Apify scrape for Instagram user: {username}")
            
            # Start the run
            response = requests.post(run_url, json=payload, headers=headers, timeout=10)
            
            if response.status_code != 201:
                return {
                    'success': False,
                    'error': f'Failed to start scraper: {response.status_code}'
                }
            
            run_data = response.json()
            run_id = run_data['data']['id']
            
            print(f"Apify run started: {run_id}")
            
            # Wait for completion (poll every 3 seconds)
            max_wait = 90  # 90 seconds timeout
            waited = 0
            
            while waited < max_wait:
                status_url = f'{self.base_url}/actor-runs/{run_id}'
                status_response = requests.get(status_url, headers=headers, timeout=10)
                status_data = status_response.json()
                
                status = status_data['data']['status']
                print(f"Apify run status: {status} (waited {waited}s)")
                
                if status == 'SUCCEEDED':
                    # Get results
                    dataset_id = status_data['data']['defaultDatasetId']
                    results_url = f'{self.base_url}/datasets/{dataset_id}/items'
                    results_response = requests.get(results_url, headers=headers, timeout=10)
                    results = results_response.json()
                    
                    if results and len(results) > 0:
                        profile = results[0]
                        
                        # Extract recent posts data
                        recent_posts = profile.get('latestPosts', [])[:12]  # Get last 12 posts
                        
                        # Calculate additional metrics
                        total_likes = sum(post.get('likesCount', 0) for post in recent_posts)
                        total_comments = sum(post.get('commentsCount', 0) for post in recent_posts)
                        avg_likes = total_likes / len(recent_posts) if recent_posts else 0
                        avg_comments = total_comments / len(recent_posts) if recent_posts else 0
                        
                        # Extract and format data
                        return {
                            'success': True,
                            'data': {
                                'username': profile.get('username'),
                                'full_name': profile.get('fullName'),
                                'bio': profile.get('biography', ''),
                                'followers': profile.get('followersCount', 0),
                                'following': profile.get('followsCount', 0),
                                'posts': profile.get('postsCount', 0),
                                'profile_pic': profile.get('profilePicUrl'),
                                'is_verified': profile.get('verified', False),
                                'is_private': profile.get('private', False),
                                'external_url': profile.get('externalUrl'),
                                'engagement_rate': self._calculate_engagement_rate(profile),
                                'extra_data': {
                                    'avg_likes': round(avg_likes, 2),
                                    'avg_comments': round(avg_comments, 2),
                                    'total_likes': total_likes,
                                    'total_comments': total_comments,
                                    'recent_posts_count': len(recent_posts),
                                    'category': profile.get('category'),
                                    'business_category': profile.get('businessCategoryName'),
                                    'is_business': profile.get('isBusinessAccount', False),
                                    'is_professional': profile.get('isProfessionalAccount', False)
                                }
                            }
                        }
                    else:
                        return {
                            'success': False,
                            'error': 'No data returned from scraper'
                        }
                
                elif status == 'FAILED':
                    return {
                        'success': False,
                        'error': 'Scraping failed - profile may be private or not found'
                    }
                
                elif status == 'ABORTED':
                    return {
                        'success': False,
                        'error': 'Scraping was aborted'
                    }
                
                # Still running, wait and check again
                time.sleep(3)
                waited += 3
            
            # Timeout
            return {
                'success': False,
                'error': 'Timeout waiting for scraper results'
            }
            
        except requests.exceptions.Timeout:
            return {
                'success': False,
                'error': 'Request timeout - please try again'
            }
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': f'Network error: {str(e)}'
            }
        except Exception as e:
            print(f"Apify error: {str(e)}")
            return {
                'success': False,
                'error': f'Unexpected error: {str(e)}'
            }
    
    def _calculate_engagement_rate(self, profile):
        """
        Calculate engagement rate from profile data
        
        Args:
            profile (dict): Instagram profile data
            
        Returns:
            float: Engagement rate percentage
        """
        try:
            followers = profile.get('followersCount', 0)
            if followers == 0:
                return 0.0
            
            # Get recent posts data if available
            posts = profile.get('latestPosts', [])
            if not posts:
                return 0.0
            
            total_engagement = 0
            for post in posts[:12]:  # Use last 12 posts
                likes = post.get('likesCount', 0)
                comments = post.get('commentsCount', 0)
                total_engagement += likes + comments
            
            if len(posts) == 0:
                return 0.0
            
            avg_engagement = total_engagement / len(posts)
            engagement_rate = (avg_engagement / followers) * 100
            
            return round(engagement_rate, 2)
        except:
            return 0.0
    
    def generate_insights(self, profile_data):
        """
        Generate AI-powered insights from profile data
        
        Args:
            profile_data (dict): Profile metrics
            
        Returns:
            list: List of insight strings
        """
        insights = []
        
        try:
            followers = profile_data.get('followers', 0)
            following = profile_data.get('following', 0)
            posts = profile_data.get('posts', 0)
            engagement_rate = profile_data.get('engagement_rate', 0)
            
            # Follower/Following ratio
            if following > 0:
                ratio = followers / following
                if ratio > 2:
                    insights.append(f"🎯 Great follower-to-following ratio ({ratio:.1f}:1)! Your content is attracting organic followers.")
                elif ratio < 0.5:
                    insights.append(f"💡 Consider unfollowing inactive accounts to improve your ratio (currently {ratio:.1f}:1).")
            
            # Post frequency
            if followers > 0:
                posts_per_follower = posts / followers * 1000
                if posts_per_follower > 10:
                    insights.append("📈 You're posting consistently! Keep up the great content creation.")
                elif posts_per_follower < 1:
                    insights.append("📝 Increase your posting frequency to boost engagement and reach.")
            
            # Engagement rate
            if engagement_rate > 5:
                insights.append(f"🔥 Excellent engagement rate ({engagement_rate}%)! Your audience loves your content.")
            elif engagement_rate > 2:
                insights.append(f"✅ Good engagement rate ({engagement_rate}%). Try interactive content to boost it further.")
            elif engagement_rate > 0:
                insights.append(f"💪 Engagement rate is {engagement_rate}%. Focus on creating more engaging content and using relevant hashtags.")
            
            # Follower count milestones
            if followers >= 100000:
                insights.append("🌟 You've reached 100K+ followers! Consider monetization opportunities.")
            elif followers >= 10000:
                insights.append("🎉 10K+ followers unlocked! You can now add links to your stories.")
            elif followers >= 1000:
                insights.append("🚀 1K+ followers! You're building a solid community.")
            else:
                insights.append("🌱 Growing your audience! Focus on consistent posting and engagement.")
            
            # Content strategy
            if posts < 50:
                insights.append("📸 Build your content library! Aim for at least 50 quality posts.")
            elif posts > 500:
                insights.append("🎨 Impressive content library! Consider creating highlight reels of your best posts.")
            
            # If no insights generated, add default
            if not insights:
                insights.append("📊 Keep posting consistently and engaging with your audience to grow!")
            
        except Exception as e:
            print(f"Error generating insights: {str(e)}")
            insights.append("📊 Continue creating great content and engaging with your audience!")
        
        return insights

# Create singleton instance
apify_service = ApifyService()
