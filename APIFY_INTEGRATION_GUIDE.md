# Apify Integration Guide for Social Analytics

## Overview
This guide explains how to integrate Apify APIs for real social media data scraping in the ContentGenei Social Analytics feature.

## Required Apify Actors

### 1. Instagram Profile Scraper
**Actor ID**: `apify/instagram-profile-scraper`
**Purpose**: Scrape Instagram profile data including followers, posts, engagement metrics
**Pricing**: Pay-as-you-go (approximately $0.25 per 1000 profiles)

**Key Features**:
- Profile information (username, bio, followers, following)
- Post count and recent posts
- Engagement metrics (likes, comments)
- Profile picture and verification status

**API Endpoint**:
```
POST https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs
```

**Request Body Example**:
```json
{
  "usernames": ["instagram_username"],
  "resultsLimit": 10
}
```

### 2. LinkedIn Profile Scraper (Coming Soon)
**Actor ID**: `apify/linkedin-profile-scraper`
**Purpose**: Extract LinkedIn profile data
**Note**: Requires LinkedIn login credentials

### 3. Twitter/X Scraper (Coming Soon)
**Actor ID**: `apify/twitter-scraper`
**Purpose**: Scrape Twitter/X profile and tweet data

### 4. YouTube Channel Scraper (Coming Soon)
**Actor ID**: `apify/youtube-scraper`
**Purpose**: Extract YouTube channel statistics

## Setup Instructions

### Step 1: Get Apify API Key
1. Sign up at https://apify.com
2. Go to Settings → Integrations → API tokens
3. Create a new API token
4. Copy the token (format: `apify_api_XXXXXXXXXXXXX`)

### Step 2: Add API Key to Backend
Add to `ContentGenei/backend/.env`:
```bash
APIFY_API_KEY=apify_api_XXXXXXXXXXXXX
```

### Step 3: Update Backend Configuration
Add to `ContentGenei/backend/config.py`:
```python
APIFY_API_KEY = os.getenv('APIFY_API_KEY')
APIFY_BASE_URL = 'https://api.apify.com/v2'
```

### Step 4: Create Apify Service
Create `ContentGenei/backend/services/apify_service.py`:

```python
import requests
import time
from config import APIFY_API_KEY, APIFY_BASE_URL

class ApifyService:
    def __init__(self):
        self.api_key = APIFY_API_KEY
        self.base_url = APIFY_BASE_URL
        
    def scrape_instagram_profile(self, username):
        """Scrape Instagram profile data"""
        actor_id = 'apify/instagram-profile-scraper'
        
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
        
        # Start the run
        response = requests.post(run_url, json=payload, headers=headers)
        run_data = response.json()
        run_id = run_data['data']['id']
        
        # Wait for completion (poll every 2 seconds)
        max_wait = 60  # 60 seconds timeout
        waited = 0
        while waited < max_wait:
            status_url = f'{self.base_url}/actor-runs/{run_id}'
            status_response = requests.get(status_url, headers=headers)
            status_data = status_response.json()
            
            if status_data['data']['status'] == 'SUCCEEDED':
                # Get results
                dataset_id = status_data['data']['defaultDatasetId']
                results_url = f'{self.base_url}/datasets/{dataset_id}/items'
                results_response = requests.get(results_url, headers=headers)
                results = results_response.json()
                
                if results:
                    profile = results[0]
                    return {
                        'success': True,
                        'data': {
                            'username': profile.get('username'),
                            'full_name': profile.get('fullName'),
                            'bio': profile.get('biography'),
                            'followers': profile.get('followersCount', 0),
                            'following': profile.get('followsCount', 0),
                            'posts': profile.get('postsCount', 0),
                            'profile_pic': profile.get('profilePicUrl'),
                            'is_verified': profile.get('verified', False),
                            'is_private': profile.get('private', False)
                        }
                    }
            elif status_data['data']['status'] == 'FAILED':
                return {'success': False, 'error': 'Scraping failed'}
            
            time.sleep(2)
            waited += 2
        
        return {'success': False, 'error': 'Timeout waiting for results'}
    
    def calculate_engagement_rate(self, profile_data, recent_posts):
        """Calculate engagement rate from profile and posts data"""
        if not recent_posts or profile_data['followers'] == 0:
            return 0
        
        total_engagement = sum(
            post.get('likesCount', 0) + post.get('commentsCount', 0)
            for post in recent_posts
        )
        avg_engagement = total_engagement / len(recent_posts)
        engagement_rate = (avg_engagement / profile_data['followers']) * 100
        
        return round(engagement_rate, 2)

apify_service = ApifyService()
```

### Step 5: Update Analytics Routes
Update `ContentGenei/backend/routes/analytics.py`:

```python
from services.apify_service import apify_service

@analytics_bp.route('/social-accounts', methods=['POST'])
@jwt_required()
def connect_social_account():
    try:
        data = request.get_json()
        platform = data.get('platform')
        url = data.get('url')
        
        # Extract username from URL
        username = extract_username_from_url(url, platform)
        
        if platform == 'instagram':
            # Use Apify to scrape real data
            result = apify_service.scrape_instagram_profile(username)
            
            if result['success']:
                profile_data = result['data']
                
                # Save to database
                account = SocialAccount(
                    user_id=current_user.id,
                    platform=platform,
                    username=username,
                    profile_url=url,
                    metrics={
                        'followers': profile_data['followers'],
                        'following': profile_data['following'],
                        'posts': profile_data['posts']
                    }
                )
                db.session.add(account)
                db.session.commit()
                
                return jsonify({
                    'success': True,
                    'account': account.to_dict(),
                    'analytics': generate_analytics(profile_data)
                })
            else:
                return jsonify({'success': False, 'error': result['error']}), 400
        else:
            return jsonify({'success': False, 'error': 'Platform not yet supported'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def extract_username_from_url(url, platform):
    """Extract username from social media URL"""
    if platform == 'instagram':
        # https://instagram.com/username or https://www.instagram.com/username
        parts = url.rstrip('/').split('/')
        return parts[-1]
    # Add other platforms as needed
    return None
```

## Cost Estimation

### Instagram Scraping
- **Profile scraping**: ~$0.25 per 1000 profiles
- **Post scraping**: ~$0.50 per 1000 posts
- **Estimated monthly cost** (100 users, 10 refreshes/month): ~$2.50

### Recommendations
1. Implement caching to reduce API calls
2. Set refresh limits (e.g., once per day per account)
3. Use webhooks for real-time updates instead of polling
4. Monitor usage in Apify dashboard

## Testing

### Test Instagram Scraping
```bash
# In backend directory
python -c "
from services.apify_service import apify_service
result = apify_service.scrape_instagram_profile('instagram')
print(result)
"
```

## Error Handling

Common errors and solutions:
1. **Rate limiting**: Implement exponential backoff
2. **Invalid credentials**: Check Apify API key
3. **Private profiles**: Show appropriate message to user
4. **Timeout**: Increase max_wait or use webhooks

## Next Steps

1. ✅ Get Apify API key
2. ✅ Add key to `.env` file
3. ✅ Create `apify_service.py`
4. ✅ Update analytics routes
5. ✅ Test with real Instagram profile
6. ✅ Deploy to AWS
7. ⏳ Add LinkedIn support (requires additional setup)
8. ⏳ Add Twitter/X support
9. ⏳ Add YouTube support

## Support

- Apify Documentation: https://docs.apify.com
- Apify Discord: https://discord.com/invite/jyEM2PRvMU
- Instagram Scraper Docs: https://apify.com/apify/instagram-profile-scraper
