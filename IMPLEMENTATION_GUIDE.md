# Social Analytics & GeneiBot Implementation Guide

## What I've Created

### ✅ Frontend Components
1. **GeneiBot Chat Widget** (`frontend/src/components/GeneiBot/ChatWidget.jsx`)
   - Floating chat button
   - Full chat interface
   - Quick action buttons
   - Theme-aware (light/dark)
   - Message history
   - Loading states

2. **Social Analytics Page** (`frontend/src/pages/SocialAnalytics.jsx`)
   - Platform selection (Instagram, LinkedIn, Twitter, YouTube)
   - Account connection via URL
   - Analytics dashboard
   - Metrics display
   - Growth insights
   - Theme support

### 📋 What You Need to Complete

## Step 1: Add API Methods to Frontend

Add these methods to `frontend/src/services/api.js`:

```javascript
// ==================== SOCIAL ANALYTICS ====================

async connectSocialAccount(data) {
  return this.request('/social-analytics/connect', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

async getSocialAccounts() {
  return this.request('/social-analytics/accounts')
}

async getSocialAnalytics(platform, username) {
  return this.request(`/social-analytics/account/${platform}/${username}`)
}

async refreshSocialAnalytics(accountId) {
  return this.request(`/social-analytics/refresh/${accountId}`, {
    method: 'POST'
  })
}

async disconnectSocialAccount(accountId) {
  return this.request(`/social-analytics/disconnect/${accountId}`, {
    method: 'DELETE'
  })
}

// ==================== GENEIBOT ====================

async chatWithGeneiBot(message) {
  return this.request('/geneibot/chat', {
    method: 'POST',
    body: JSON.stringify({ message })
  })
}

async getGeneiBotHistory() {
  return this.request('/geneibot/history')
}

async clearGeneiBotHistory() {
  return this.request('/geneibot/history', {
    method: 'DELETE'
  })
}
```

## Step 2: Create Backend Routes

Create `backend/routes/social_analytics.py`:

```python
"""Social Media Analytics Routes"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.social_analytics_service import SocialAnalyticsService
import logging

logger = logging.getLogger(__name__)

social_analytics_bp = Blueprint('social_analytics', __name__, url_prefix='/api/social-analytics')
analytics_service = SocialAnalyticsService()

@social_analytics_bp.route('/connect', methods=['POST'])
@jwt_required()
def connect_account():
    """Connect a social media account"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        platform = data.get('platform')
        url = data.get('url')
        
        if not platform or not url:
            return jsonify({
                'success': False,
                'error': 'Platform and URL are required'
            }), 400
        
        result = analytics_service.connect_account(user_id, platform, url)
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Connect account error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@social_analytics_bp.route('/accounts', methods=['GET'])
@jwt_required()
def get_accounts():
    """Get all connected accounts"""
    try:
        user_id = get_jwt_identity()
        accounts = analytics_service.get_user_accounts(user_id)
        
        return jsonify({
            'success': True,
            'accounts': accounts
        }), 200
        
    except Exception as e:
        logger.error(f"Get accounts error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@social_analytics_bp.route('/account/<platform>/<username>', methods=['GET'])
@jwt_required()
def get_analytics(platform, username):
    """Get analytics for specific account"""
    try:
        user_id = get_jwt_identity()
        analytics = analytics_service.get_analytics(user_id, platform, username)
        
        return jsonify({
            'success': True,
            'analytics': analytics
        }), 200
        
    except Exception as e:
        logger.error(f"Get analytics error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@social_analytics_bp.route('/refresh/<account_id>', methods=['POST'])
@jwt_required()
def refresh_analytics(account_id):
    """Refresh analytics data"""
    try:
        user_id = get_jwt_identity()
        result = analytics_service.refresh_analytics(user_id, account_id)
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Refresh analytics error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@social_analytics_bp.route('/disconnect/<account_id>', methods=['DELETE'])
@jwt_required()
def disconnect_account(account_id):
    """Disconnect account"""
    try:
        user_id = get_jwt_identity()
        result = analytics_service.disconnect_account(user_id, account_id)
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Disconnect account error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
```

Create `backend/routes/geneibot.py`:

```python
"""GeneiBot Chat Routes"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.geneibot_service import GeneiBotService
import logging

logger = logging.getLogger(__name__)

geneibot_bp = Blueprint('geneibot', __name__, url_prefix='/api/geneibot')
bot_service = GeneiBotService()

@geneibot_bp.route('/chat', methods=['POST'])
@jwt_required()
def chat():
    """Chat with GeneiBot"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        message = data.get('message')
        if not message:
            return jsonify({
                'success': False,
                'error': 'Message is required'
            }), 400
        
        response = bot_service.get_response(user_id, message)
        
        return jsonify({
            'success': True,
            'message': response
        }), 200
        
    except Exception as e:
        logger.error(f"GeneiBot chat error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get response'
        }), 500

@geneibot_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    """Get chat history"""
    try:
        user_id = get_jwt_identity()
        history = bot_service.get_history(user_id)
        
        return jsonify({
            'success': True,
            'history': history
        }), 200
        
    except Exception as e:
        logger.error(f"Get history error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@geneibot_bp.route('/history', methods=['DELETE'])
@jwt_required()
def clear_history():
    """Clear chat history"""
    try:
        user_id = get_jwt_identity()
        bot_service.clear_history(user_id)
        
        return jsonify({
            'success': True,
            'message': 'History cleared'
        }), 200
        
    except Exception as e:
        logger.error(f"Clear history error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
```

## Step 3: Create Backend Services

Create `backend/services/social_analytics_service.py`:

```python
"""Social Media Analytics Service"""

from services.mongodb_service import mongodb_service
from datetime import datetime
import re
import requests
import os

class SocialAnalyticsService:
    """Service for fetching and analyzing social media data"""
    
    def __init__(self):
        self.collection = mongodb_service.db['social_accounts']
    
    def connect_account(self, user_id, platform, url):
        """Connect and analyze social media account"""
        try:
            # Extract username from URL
            username = self._extract_username(platform, url)
            
            if not username:
                return {
                    'success': False,
                    'error': 'Invalid URL format'
                }
            
            # Check if already connected
            existing = self.collection.find_one({
                'user_id': user_id,
                'platform': platform,
                'username': username
            })
            
            if existing:
                return {
                    'success': False,
                    'error': 'Account already connected'
                }
            
            # Fetch analytics
            analytics = self._fetch_analytics(platform, username)
            
            if not analytics:
                return {
                    'success': False,
                    'error': 'Failed to fetch account data'
                }
            
            # Store account
            account = {
                'user_id': user_id,
                'platform': platform,
                'username': username,
                'profile_url': url,
                'connected_at': datetime.utcnow(),
                'last_updated': datetime.utcnow(),
                'metrics': analytics['metrics']
            }
            
            result = self.collection.insert_one(account)
            account['_id'] = str(result.inserted_id)
            
            return {
                'success': True,
                'account': self._serialize_account(account),
                'analytics': analytics
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _extract_username(self, platform, url):
        """Extract username from social media URL"""
        patterns = {
            'instagram': r'instagram\.com/([^/?]+)',
            'linkedin': r'linkedin\.com/in/([^/?]+)',
            'twitter': r'twitter\.com/([^/?]+)|x\.com/([^/?]+)',
            'youtube': r'youtube\.com/@([^/?]+)|youtube\.com/c/([^/?]+)'
        }
        
        pattern = patterns.get(platform)
        if not pattern:
            return None
        
        match = re.search(pattern, url)
        if match:
            return match.group(1) or match.group(2)
        
        return None
    
    def _fetch_analytics(self, platform, username):
        """Fetch analytics from platform (placeholder - implement with real APIs)"""
        # This is a placeholder. In production, use real APIs:
        # - Instagram Graph API
        # - LinkedIn API
        # - Twitter API v2
        # - YouTube Data API v3
        
        # For now, return mock data
        mock_data = {
            'instagram': {
                'metrics': {
                    'followers': 12500,
                    'following': 850,
                    'posts': 342,
                    'engagement_rate': 4.2,
                    'avg_likes': 520,
                    'avg_comments': 45
                },
                'insights': [
                    '📈 Your engagement rate is above average!',
                    '⏰ Best posting time: 6-8 PM',
                    '📸 Photo posts perform 30% better than videos',
                    '💡 Try using more carousel posts'
                ]
            },
            'linkedin': {
                'metrics': {
                    'connections': 2340,
                    'followers': 5600,
                    'posts': 156,
                    'engagement_rate': 3.8,
                    'profile_views': 890
                },
                'insights': [
                    '📊 Your profile views increased 15% this month',
                    '💼 Professional content gets 2x engagement',
                    '🕐 Post on Tuesday-Thursday for best reach',
                    '📝 Long-form posts (1300+ chars) perform best'
                ]
            },
            'twitter': {
                'metrics': {
                    'followers': 8900,
                    'following': 1200,
                    'tweets': 4560,
                    'engagement_rate': 2.1,
                    'avg_retweets': 12,
                    'avg_likes': 45
                },
                'insights': [
                    '🐦 Tweet frequency: 3-5 times per day optimal',
                    '🔥 Threads get 3x more engagement',
                    '📸 Tweets with images get 150% more retweets',
                    '⏰ Best time to tweet: 8-10 AM'
                ]
            },
            'youtube': {
                'metrics': {
                    'subscribers': 45000,
                    'total_views': 2340000,
                    'videos': 234,
                    'avg_views': 10000,
                    'engagement_rate': 5.6
                },
                'insights': [
                    '🎥 Upload consistency is key - stick to schedule',
                    '⏱️ Videos 8-12 minutes perform best',
                    '👍 Your like ratio is excellent (95%)',
                    '📈 Thumbnails with faces get 30% more clicks'
                ]
            }
        }
        
        return mock_data.get(platform, {
            'metrics': {},
            'insights': []
        })
    
    def get_user_accounts(self, user_id):
        """Get all connected accounts for user"""
        accounts = list(self.collection.find({'user_id': user_id}))
        return [self._serialize_account(acc) for acc in accounts]
    
    def get_analytics(self, user_id, platform, username):
        """Get analytics for specific account"""
        account = self.collection.find_one({
            'user_id': user_id,
            'platform': platform,
            'username': username
        })
        
        if not account:
            return None
        
        # Fetch fresh analytics
        analytics = self._fetch_analytics(platform, username)
        
        return analytics
    
    def refresh_analytics(self, user_id, account_id):
        """Refresh analytics data"""
        from bson.objectid import ObjectId
        
        account = self.collection.find_one({
            '_id': ObjectId(account_id),
            'user_id': user_id
        })
        
        if not account:
            return {
                'success': False,
                'error': 'Account not found'
            }
        
        # Fetch fresh data
        analytics = self._fetch_analytics(account['platform'], account['username'])
        
        # Update stored metrics
        self.collection.update_one(
            {'_id': ObjectId(account_id)},
            {
                '$set': {
                    'metrics': analytics['metrics'],
                    'last_updated': datetime.utcnow()
                }
            }
        )
        
        return {
            'success': True,
            'analytics': analytics
        }
    
    def disconnect_account(self, user_id, account_id):
        """Disconnect account"""
        from bson.objectid import ObjectId
        
        result = self.collection.delete_one({
            '_id': ObjectId(account_id),
            'user_id': user_id
        })
        
        if result.deleted_count > 0:
            return {
                'success': True,
                'message': 'Account disconnected'
            }
        
        return {
            'success': False,
            'error': 'Account not found'
        }
    
    def _serialize_account(self, account):
        """Convert account to JSON-serializable dict"""
        return {
            '_id': str(account['_id']),
            'platform': account['platform'],
            'username': account['username'],
            'profile_url': account['profile_url'],
            'connected_at': account['connected_at'].isoformat(),
            'last_updated': account['last_updated'].isoformat(),
            'metrics': account.get('metrics', {})
        }
```

Create `backend/services/geneibot_service.py`:

```python
"""GeneiBot AI Assistant Service"""

from services.mongodb_service import mongodb_service
from datetime import datetime
import os
import requests

class GeneiBotService:
    """AI-powered chatbot for ContentGenei"""
    
    def __init__(self):
        self.collection = mongodb_service.db['geneibot_chats']
        self.groq_api_key = os.environ.get('GROQ_API_KEY')
        
        # System prompt with ContentGenei knowledge
        self.system_prompt = """You are GeneiBot, an AI assistant for ContentGenei - a content generation and social media management platform.

ContentGenei Features:
1. Content Generation (Creator page) - Generate AI-powered content for social media
2. Dashboard - View and manage saved content
3. Social Media Analytics - Analyze Instagram, LinkedIn, Twitter, YouTube accounts
4. Team Collaboration - Work with team members on projects
5. LinkoGenei - Aggregate and save posts from social media
6. Profile Management - Manage user settings and preferences
7. Admin Panel - For administrators to manage users and content

Your role:
- Help users understand and use ContentGenei features
- Answer questions about the platform
- Provide tips and best practices
- Guide users through workflows
- Be friendly, helpful, and concise

Keep responses short and actionable. Use emojis occasionally to be friendly."""
    
    def get_response(self, user_id, message):
        """Get AI response to user message"""
        try:
            # Get conversation history
            conversation = self.collection.find_one({'user_id': user_id})
            
            if not conversation:
                conversation = {
                    'user_id': user_id,
                    'messages': [],
                    'created_at': datetime.utcnow()
                }
            
            # Add user message
            conversation['messages'].append({
                'role': 'user',
                'content': message,
                'timestamp': datetime.utcnow()
            })
            
            # Get AI response
            ai_response = self._get_ai_response(conversation['messages'])
            
            # Add AI response
            conversation['messages'].append({
                'role': 'assistant',
                'content': ai_response,
                'timestamp': datetime.utcnow()
            })
            
            conversation['updated_at'] = datetime.utcnow()
            
            # Save conversation
            if '_id' in conversation:
                self.collection.update_one(
                    {'_id': conversation['_id']},
                    {'$set': conversation}
                )
            else:
                self.collection.insert_one(conversation)
            
            return ai_response
            
        except Exception as e:
            return "I'm having trouble connecting right now. Please try again in a moment!"
    
    def _get_ai_response(self, messages):
        """Get response from AI service"""
        if not self.groq_api_key:
            # Fallback responses if no API key
            return self._get_fallback_response(messages[-1]['content'])
        
        try:
            # Use Groq API (fast and cheap)
            response = requests.post(
                'https://api.groq.com/openai/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {self.groq_api_key}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': 'mixtral-8x7b-32768',
                    'messages': [
                        {'role': 'system', 'content': self.system_prompt}
                    ] + [
                        {'role': msg['role'], 'content': msg['content']}
                        for msg in messages[-10:]  # Last 10 messages for context
                    ],
                    'temperature': 0.7,
                    'max_tokens': 500
                },
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()['choices'][0]['message']['content']
            else:
                return self._get_fallback_response(messages[-1]['content'])
                
        except Exception as e:
            return self._get_fallback_response(messages[-1]['content'])
    
    def _get_fallback_response(self, message):
        """Fallback responses when AI is unavailable"""
        message_lower = message.lower()
        
        if 'content' in message_lower or 'generate' in message_lower:
            return """To generate content:
1. Go to the Creator page
2. Enter your topic or paste existing content
3. Choose content type and platform
4. Click Generate!

You can also upload images or videos for AI analysis. 📝"""
        
        elif 'analytics' in message_lower or 'analyze' in message_lower:
            return """Social Media Analytics lets you:
📊 Connect Instagram, LinkedIn, Twitter, or YouTube
📈 View real-time metrics and engagement
🚀 Get AI-powered growth insights
💡 Receive actionable recommendations

Just paste your profile URL to get started!"""
        
        elif 'team' in message_lower or 'collab' in message_lower:
            return """Team Collaboration features:
👥 Invite team members
📁 Create shared projects
✅ Assign tasks
💬 Team chat
📊 Track progress

Perfect for agencies and content teams!"""
        
        elif 'linkogenei' in message_lower or 'save' in message_lower:
            return """LinkoGenei helps you:
🔗 Save posts from social media
📱 Organize with categories
⭐ Mark favorites
📊 Track saved content

Use the Chrome extension to save posts while browsing!"""
        
        else:
            return """I can help you with:
• Content Generation 📝
• Social Media Analytics 📊
• Team Collaboration 👥
• LinkoGenei Features 🔗
• Profile Settings ⚙️

What would you like to know more about?"""
    
    def get_history(self, user_id):
        """Get chat history for user"""
        conversation = self.collection.find_one({'user_id': user_id})
        
        if not conversation:
            return []
        
        return conversation.get('messages', [])
    
    def clear_history(self, user_id):
        """Clear chat history"""
        self.collection.delete_one({'user_id': user_id})
```

## Step 4: Register Routes in app.py

Add to `backend/app.py`:

```python
# Import new blueprints
from routes.social_analytics import social_analytics_bp
from routes.geneibot import geneibot_bp

# Register blueprints
app.register_blueprint(social_analytics_bp)
app.register_blueprint(geneibot_bp)
```

## Step 5: Add GeneiBot to App.jsx

Add to `frontend/src/App.jsx`:

```javascript
import ChatWidget from './components/GeneiBot/ChatWidget'

// Inside the App component, before closing div:
<ChatWidget />
```

## Step 6: Update Navigation

Add Social Analytics to navigation in `Header.jsx`:

```javascript
<Link to="/social-analytics">Social Analytics</Link>
```

Add route in `App.jsx`:

```javascript
<Route path="/social-analytics" element={<SocialAnalytics />} />
```

## Step 7: Environment Variables

Add to `.env` (backend):

```bash
# AI Service (choose one)
GROQ_API_KEY=your_groq_api_key_here

# Optional: Social Media APIs (for real data)
INSTAGRAM_ACCESS_TOKEN=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
TWITTER_BEARER_TOKEN=
YOUTUBE_API_KEY=
```

## Step 8: Install Dependencies

Backend:
```bash
pip install requests
```

Frontend:
```bash
# No new dependencies needed
```

## Step 9: Test

1. Start backend: `python app.py`
2. Start frontend: `npm run dev`
3. Test GeneiBot chat widget
4. Test social analytics connection
5. Verify theme switching works

## Step 10: Deploy

1. Commit all changes
2. Push to GitHub
3. Render will auto-deploy backend
4. Vercel will auto-deploy frontend

---

## Summary

✅ Created GeneiBot chat widget
✅ Created Social Analytics page
✅ Provided complete backend implementation
✅ Theme-aware (light/dark mode)
✅ Mock data for testing (replace with real APIs later)

**Next Steps:**
1. Copy the code from this guide
2. Test locally
3. Get API keys for real social media data
4. Deploy to production

The system is designed to work with mock data initially, so you can test everything before getting real API keys!
