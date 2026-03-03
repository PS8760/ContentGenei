from flask import Blueprint, request, jsonify, current_app, redirect, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User
from models_instagram import InstagramConnection, InstagramPost, InstagramCompetitor
from services.instagram_service import InstagramService
from services.ai_service import AIContentGenerator
from datetime import datetime, timezone, timedelta
import json
import uuid
import os

def parse_instagram_timestamp(timestamp_str):
    """
    Parse Instagram timestamp format: 2026-03-02T18:06:54+0000
    Python's fromisoformat() doesn't support +0000 format in Python 3.10
    """
    if not timestamp_str:
        return None
    try:
        # Instagram format: 2026-03-02T18:06:54+0000
        return datetime.strptime(timestamp_str, '%Y-%m-%dT%H:%M:%S%z')
    except ValueError:
        try:
            # Fallback: Try with Z format
            return datetime.strptime(timestamp_str.replace('Z', '+0000'), '%Y-%m-%dT%H:%M:%S%z')
        except ValueError:
            # Last resort: Try fromisoformat with Z replacement
            try:
                return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            except Exception as e:
                current_app.logger.error(f"Failed to parse timestamp '{timestamp_str}': {str(e)}")
                return None

instagram_bp = Blueprint('instagram', __name__)
instagram_service = InstagramService()
ai_service = AIContentGenerator()

@instagram_bp.route('/debug', methods=['GET'])
def debug_config():
    """Debug endpoint to verify Instagram configuration - NO AUTH REQUIRED"""
    app_id = os.environ.get('INSTAGRAM_APP_ID')
    app_secret = os.environ.get('INSTAGRAM_APP_SECRET')
    redirect_uri = os.environ.get('INSTAGRAM_REDIRECT_URI')
    scopes = os.environ.get('INSTAGRAM_SCOPES', 'instagram_business_basic,instagram_business_manage_comments,instagram_business_manage_messages')
    frontend_url = os.environ.get('INSTAGRAM_FRONTEND_URL', 'http://localhost:5173')
    
    return jsonify({
        'success': True,
        'config': {
            'app_id': 'loaded' if app_id else 'missing',
            'app_id_length': len(app_id) if app_id else 0,
            'app_id_preview': app_id[:10] + '...' if app_id and len(app_id) > 10 else app_id,
            'app_secret': 'loaded' if app_secret else 'missing',
            'redirect_uri': redirect_uri or 'missing',
            'scopes': scopes,
            'frontend_url': frontend_url
        }
    })


@instagram_bp.route('/debug-media/<connection_id>', methods=['GET'])
@jwt_required()
def debug_media(connection_id):
    """Debug endpoint to see raw media data from Instagram API"""
    try:
        current_user_id = get_jwt_identity()
        
        connection = InstagramConnection.query.filter_by(
            id=connection_id,
            user_id=current_user_id,
            is_active=True
        ).first()
        
        if not connection:
            return jsonify({'error': 'Connection not found'}), 404
        
        # Fetch raw media data
        media_list = instagram_service.get_user_media(
            connection.instagram_user_id,
            connection.access_token,
            limit=5  # Just get 5 for debugging
        )
        
        # Try to get insights for first media item
        insights_sample = None
        if media_list:
            first_media_id = media_list[0].get('id')
            insights_sample = instagram_service.get_media_insights(
                first_media_id,
                connection.access_token
            )
        
        return jsonify({
            'success': True,
            'connection': {
                'id': connection.id,
                'username': connection.instagram_username,
                'account_type': connection.instagram_account_type,
                'followers': connection.followers_count
            },
            'media_count': len(media_list),
            'media_sample': media_list[:2] if media_list else [],
            'insights_sample': insights_sample,
            'note': 'Check if like_count and comments_count are present in media_sample'
        })
        
    except Exception as e:
        current_app.logger.error(f"Debug media error: {str(e)}", exc_info=True)
        return jsonify({'error': 'Debug failed', 'details': str(e)}), 500

@instagram_bp.route('/auth', methods=['GET'])
@jwt_required()
def get_auth_url():
    """Generate Instagram OAuth URL - backend builds the URL"""
    try:
        state = str(uuid.uuid4())
        
        # Store state for verification (in production, use Redis or database)
        # For now, we'll verify it in the callback
        
        oauth_url = instagram_service.get_oauth_url(state)
        
        return jsonify({
            'success': True,
            'oauth_url': oauth_url,
            'state': state
        })
        
    except ValueError as e:
        current_app.logger.error(f"OAuth URL generation error: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"OAuth URL generation error: {str(e)}")
        return jsonify({'error': 'Failed to generate OAuth URL', 'details': str(e)}), 500

@instagram_bp.route('/callback', methods=['GET'])
def oauth_callback_handler():
    """Handle Instagram OAuth callback - this receives the code from Instagram"""
    try:
        code = request.args.get('code')
        state = request.args.get('state')
        error = request.args.get('error')
        error_reason = request.args.get('error_reason')
        error_description = request.args.get('error_description')
        
        frontend_url = os.environ.get('INSTAGRAM_FRONTEND_URL', 'http://localhost:5173')
        
        # Handle errors from Instagram
        if error:
            current_app.logger.error(f"Instagram OAuth error: {error} - {error_description}")
            html_content = f"""
            <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Instagram Authorization Failed</title>
                </head>
                <body>
                    <h1>Instagram Authorization Failed</h1>
                    <p>Error: {error}</p>
                    <p>Reason: {error_reason}</p>
                    <p>Description: {error_description}</p>
                    <p>Redirecting back to app...</p>
                    <script>
                        setTimeout(function() {{
                            window.location.href = '{frontend_url}/instagram-analytics?error=' + encodeURIComponent('{error_description}');
                        }}, 3000);
                    </script>
                </body>
            </html>
            """
            response = make_response(html_content)
            response.headers['Content-Type'] = 'text/html'
            response.headers['ngrok-skip-browser-warning'] = 'true'
            return response
        
        if not code:
            error_html = """
            <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Error</title>
                </head>
                <body>
                    <h1>Error</h1>
                    <p>Authorization code is required</p>
                </body>
            </html>
            """
            response = make_response(error_html, 400)
            response.headers['Content-Type'] = 'text/html'
            response.headers['ngrok-skip-browser-warning'] = 'true'
            return response
        
        # Store code and state in session or pass to frontend
        # Redirect to frontend with code and state
        redirect_url = f"{frontend_url}/instagram/callback?code={code}&state={state}"
        
        html_content = f"""
        <html>
            <head>
                <meta charset="UTF-8">
                <title>Authorization Successful</title>
            </head>
            <body>
                <h1>Authorization Successful!</h1>
                <p>Redirecting back to ContentGenie...</p>
                <script>
                    window.location.href = '{redirect_url}';
                </script>
            </body>
        </html>
        """
        response = make_response(html_content)
        response.headers['Content-Type'] = 'text/html'
        response.headers['ngrok-skip-browser-warning'] = 'true'
        return response
        
    except Exception as e:
        current_app.logger.error(f"OAuth callback error: {str(e)}")
        frontend_url = os.environ.get('INSTAGRAM_FRONTEND_URL', 'http://localhost:5173')
        html_content = f"""
        <html>
            <head>
                <meta charset="UTF-8">
                <title>Error Processing Authorization</title>
            </head>
            <body>
                <h1>Error Processing Authorization</h1>
                <p>{str(e)}</p>
                <p>Redirecting back to app...</p>
                <script>
                    setTimeout(function() {{
                        window.location.href = '{frontend_url}/instagram-analytics?error=' + encodeURIComponent('{str(e)}');
                    }}, 3000);
                </script>
            </body>
        </html>
        """
        response = make_response(html_content, 500)
        response.headers['Content-Type'] = 'text/html'
        response.headers['ngrok-skip-browser-warning'] = 'true'
        return response

@instagram_bp.route('/exchange-token', methods=['POST'])
@jwt_required()
def exchange_token():
    """Exchange authorization code for access token"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        code = data.get('code')
        state = data.get('state')
        
        if not code:
            return jsonify({'error': 'Authorization code is required'}), 400
        
        # TODO: Verify state matches what we stored
        
        # Exchange code for token
        token_data = instagram_service.exchange_code_for_token(code)
        short_lived_token = token_data.get('access_token')
        instagram_user_id = token_data.get('user_id')
        
        current_app.logger.info(f"Received token for Instagram user: {instagram_user_id}")
        
        # Get long-lived token (60 days)
        long_lived_data = instagram_service.get_long_lived_token(short_lived_token)
        access_token = long_lived_data.get('access_token')
        expires_in = long_lived_data.get('expires_in', 5184000)  # 60 days default
        
        # Get user profile
        profile = instagram_service.get_user_profile(access_token)
        
        # Check if connection already exists
        connection = InstagramConnection.query.filter_by(
            user_id=current_user_id,
            instagram_user_id=instagram_user_id
        ).first()
        
        if connection:
            # Update existing connection
            connection.access_token = access_token
            connection.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
            connection.instagram_username = profile.get('username')
            connection.instagram_account_type = profile.get('account_type')
            connection.media_count = profile.get('media_count', 0)
            connection.followers_count = profile.get('followers_count', 0)
            connection.is_active = True
            connection.updated_at = datetime.now(timezone.utc)
        else:
            # Create new connection
            connection = InstagramConnection(
                user_id=current_user_id,
                instagram_user_id=instagram_user_id,
                instagram_username=profile.get('username'),
                instagram_account_type=profile.get('account_type'),
                access_token=access_token,
                token_expires_at=datetime.now(timezone.utc) + timedelta(seconds=expires_in),
                media_count=profile.get('media_count', 0),
                followers_count=profile.get('followers_count', 0)
            )
            db.session.add(connection)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'connection': connection.to_dict(),
            'message': 'Instagram account connected successfully'
        })
        
    except Exception as e:
        current_app.logger.error(f"Token exchange error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to connect Instagram account', 'details': str(e)}), 500

# Keep the old endpoint for backward compatibility but mark as deprecated
@instagram_bp.route('/oauth/url', methods=['GET'])
@jwt_required()
def get_oauth_url():
    """DEPRECATED: Use /auth instead. Generate Instagram OAuth URL"""
    try:
        redirect_uri = request.args.get('redirect_uri', 'http://localhost:5173/instagram/callback')
        state = str(uuid.uuid4())
        
        # Store state in session or cache for verification
        oauth_url = instagram_service.get_oauth_url(state)
        
        return jsonify({
            'success': True,
            'oauth_url': oauth_url,
            'state': state
        })
        
    except Exception as e:
        current_app.logger.error(f"OAuth URL generation error: {str(e)}")
        return jsonify({'error': 'Failed to generate OAuth URL', 'details': str(e)}), 500


@instagram_bp.route('/oauth/callback', methods=['POST'])
@jwt_required()
def oauth_callback():
    """DEPRECATED: Use /exchange-token instead. Handle Instagram OAuth callback"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        code = data.get('code')
        
        if not code:
            return jsonify({'error': 'Authorization code is required'}), 400
        
        # Exchange code for token
        token_data = instagram_service.exchange_code_for_token(code)
        short_lived_token = token_data.get('access_token')
        instagram_user_id = token_data.get('user_id')
        
        # Get long-lived token (60 days)
        long_lived_data = instagram_service.get_long_lived_token(short_lived_token)
        access_token = long_lived_data.get('access_token')
        expires_in = long_lived_data.get('expires_in', 5184000)  # 60 days default
        
        # Get user profile
        profile = instagram_service.get_user_profile(access_token)
        
        # Check if connection already exists
        connection = InstagramConnection.query.filter_by(
            user_id=current_user_id,
            instagram_user_id=instagram_user_id
        ).first()
        
        if connection:
            # Update existing connection
            connection.access_token = access_token
            connection.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
            connection.instagram_username = profile.get('username')
            connection.instagram_account_type = profile.get('account_type')
            connection.media_count = profile.get('media_count', 0)
            connection.followers_count = profile.get('followers_count', 0)
            connection.is_active = True
            connection.updated_at = datetime.now(timezone.utc)
        else:
            # Create new connection
            connection = InstagramConnection(
                user_id=current_user_id,
                instagram_user_id=instagram_user_id,
                instagram_username=profile.get('username'),
                instagram_account_type=profile.get('account_type'),
                access_token=access_token,
                token_expires_at=datetime.now(timezone.utc) + timedelta(seconds=expires_in),
                media_count=profile.get('media_count', 0),
                followers_count=profile.get('followers_count', 0)
            )
            db.session.add(connection)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'connection': connection.to_dict(),
            'message': 'Instagram account connected successfully'
        })
        
    except Exception as e:
        current_app.logger.error(f"OAuth callback error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to connect Instagram account', 'details': str(e)}), 500


@instagram_bp.route('/connections', methods=['GET'])
@jwt_required()
def get_connections():
    """Get user's Instagram connections"""
    try:
        current_user_id = get_jwt_identity()
        
        connections = InstagramConnection.query.filter_by(
            user_id=current_user_id,
            is_active=True
        ).all()
        
        return jsonify({
            'success': True,
            'connections': [conn.to_dict() for conn in connections]
        })
        
    except Exception as e:
        current_app.logger.error(f"Get connections error: {str(e)}")
        return jsonify({'error': 'Failed to get connections'}), 500


@instagram_bp.route('/connections/<connection_id>', methods=['DELETE'])
@jwt_required()
def disconnect_account(connection_id):
    """Disconnect Instagram account"""
    try:
        current_user_id = get_jwt_identity()
        
        connection = InstagramConnection.query.filter_by(
            id=connection_id,
            user_id=current_user_id
        ).first()
        
        if not connection:
            return jsonify({'error': 'Connection not found'}), 404
        
        connection.is_active = False
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Instagram account disconnected'
        })
        
    except Exception as e:
        current_app.logger.error(f"Disconnect error: {str(e)}")
        return jsonify({'error': 'Failed to disconnect account'}), 500


@instagram_bp.route('/profile/<connection_id>', methods=['GET'])
@jwt_required()
def get_profile(connection_id):
    """Get connected Instagram account's profile info"""
    try:
        current_user_id = get_jwt_identity()
        
        connection = InstagramConnection.query.filter_by(
            id=connection_id,
            user_id=current_user_id,
            is_active=True
        ).first()
        
        if not connection:
            return jsonify({'error': 'Connection not found'}), 404
        
        # Get fresh profile data from Instagram
        try:
            profile = instagram_service.get_user_profile(connection.access_token)
            
            # Update connection with latest data
            connection.instagram_username = profile.get('username')
            connection.instagram_account_type = profile.get('account_type')
            connection.media_count = profile.get('media_count', 0)
            connection.followers_count = profile.get('followers_count', 0)
            
            db.session.commit()
            
        except Exception as api_error:
            current_app.logger.warning(f"Could not fetch fresh profile data: {str(api_error)}")
            # Continue with cached data from database
        
        return jsonify({
            'success': True,
            'profile': {
                'id': connection.id,
                'instagram_user_id': connection.instagram_user_id,
                'username': connection.instagram_username,
                'account_type': connection.instagram_account_type,
                'followers_count': connection.followers_count,
                'media_count': connection.media_count,
                'profile_picture_url': connection.profile_picture_url,
                'last_synced_at': connection.last_synced_at.isoformat() if connection.last_synced_at else None,
                'token_expires_at': connection.token_expires_at.isoformat() if connection.token_expires_at else None
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Get profile error: {str(e)}")
        return jsonify({'error': 'Failed to get profile', 'details': str(e)}), 500
    except Exception as e:
        current_app.logger.error(f"Disconnect error: {str(e)}")
        return jsonify({'error': 'Failed to disconnect account'}), 500


@instagram_bp.route('/sync/<connection_id>', methods=['POST'])
@jwt_required()
def sync_instagram_data(connection_id):
    """Sync Instagram data (posts and insights)"""
    try:
        current_user_id = get_jwt_identity()
        
        connection = InstagramConnection.query.filter_by(
            id=connection_id,
            user_id=current_user_id,
            is_active=True
        ).first()
        
        if not connection:
            return jsonify({'error': 'Connection not found'}), 404
        
        access_token = connection.access_token
        instagram_user_id = connection.instagram_user_id
        
        current_app.logger.info(f"Starting sync for connection {connection_id}, user {instagram_user_id}")
        
        # Get account insights
        insights = instagram_service.get_user_insights(instagram_user_id, access_token)
        
        # Update follower count from insights
        for insight in insights.get('data', []):
            if insight.get('name') == 'follower_count':
                values = insight.get('values', [])
                if values:
                    connection.followers_count = values[0].get('value', 0)
                    current_app.logger.info(f"Updated follower count: {connection.followers_count}")
        
        # Get recent media with all fields
        current_app.logger.info(f"Fetching media for user {instagram_user_id}")
        media_list = instagram_service.get_user_media(instagram_user_id, access_token, limit=30)
        current_app.logger.info(f"Fetched {len(media_list)} media items")
        
        synced_posts = []
        posts_with_insights = 0
        posts_without_insights = 0
        
        for media in media_list:
            media_id = media.get('id')
            
            # Log what we got from the media endpoint
            likes = media.get('like_count', 0)
            comments = media.get('comments_count', 0)
            current_app.logger.info(f"Media {media_id}: likes={likes}, comments={comments}")
            
            # Get media insights (reach, impressions, saves)
            media_insights = instagram_service.get_media_insights(media_id, access_token)
            
            # Parse insights
            reach = 0
            impressions = 0
            saves = 0
            
            insights_data = media_insights.get('data', [])
            if insights_data:
                posts_with_insights += 1
                current_app.logger.info(f"Media {media_id} insights: {insights_data}")
                
                for insight in insights_data:
                    name = insight.get('name')
                    values = insight.get('values', [])
                    if values:
                        value = values[0].get('value', 0)
                        if name == 'reach':
                            reach = value
                        elif name == 'impressions':
                            impressions = value
                        elif name == 'saved':
                            saves = value
            else:
                posts_without_insights += 1
                current_app.logger.warning(f"No insights available for media {media_id}")
            
            # Calculate engagement rate
            engagement_rate = instagram_service.calculate_engagement_rate(
                likes, comments, connection.followers_count
            )
            
            current_app.logger.info(f"Media {media_id} final: likes={likes}, comments={comments}, reach={reach}, impressions={impressions}, saves={saves}, engagement_rate={engagement_rate}")
            
            # Check if post exists
            post = InstagramPost.query.filter_by(
                instagram_post_id=media_id
            ).first()
            
            if post:
                # Update existing post
                post.like_count = likes
                post.comments_count = comments
                post.reach = reach
                post.impressions = impressions
                post.saves_count = saves
                post.engagement_rate = engagement_rate
                post.updated_at = datetime.now(timezone.utc)
            else:
                # Create new post
                post = InstagramPost(
                    user_id=current_user_id,
                    connection_id=connection_id,
                    instagram_post_id=media_id,
                    media_type=media.get('media_type'),
                    media_url=media.get('media_url'),
                    permalink=media.get('permalink'),
                    caption=media.get('caption'),
                    like_count=likes,
                    comments_count=comments,
                    reach=reach,
                    impressions=impressions,
                    saves_count=saves,
                    engagement_rate=engagement_rate,
                    published_at=parse_instagram_timestamp(media.get('timestamp'))
                )
                db.session.add(post)
            
            synced_posts.append(post)
        
        # Update last synced time
        connection.last_synced_at = datetime.now(timezone.utc)
        db.session.commit()
        
        current_app.logger.info(f"Sync complete: {len(synced_posts)} posts, {posts_with_insights} with insights, {posts_without_insights} without insights")
        
        return jsonify({
            'success': True,
            'synced_posts': len(synced_posts),
            'posts_with_insights': posts_with_insights,
            'posts_without_insights': posts_without_insights,
            'message': f'Synced {len(synced_posts)} posts successfully'
        })
        
    except Exception as e:
        current_app.logger.error(f"Sync error: {str(e)}", exc_info=True)
        db.session.rollback()
        return jsonify({'error': 'Failed to sync Instagram data', 'details': str(e)}), 500


@instagram_bp.route('/dashboard/<connection_id>', methods=['GET'])
@jwt_required()
def get_dashboard_data(connection_id):
    """Get Instagram analytics dashboard data"""
    try:
        current_user_id = get_jwt_identity()
        
        connection = InstagramConnection.query.filter_by(
            id=connection_id,
            user_id=current_user_id,
            is_active=True
        ).first()
        
        if not connection:
            return jsonify({'error': 'Connection not found'}), 404
        
        # Get posts
        posts = InstagramPost.query.filter_by(
            connection_id=connection_id
        ).order_by(InstagramPost.published_at.desc()).limit(30).all()
        
        # Calculate account-level metrics
        total_posts = len(posts)
        total_likes = sum(p.like_count for p in posts)
        total_comments = sum(p.comments_count for p in posts)
        total_reach = sum(p.reach for p in posts)
        total_impressions = sum(p.impressions for p in posts)
        
        avg_engagement_rate = sum(p.engagement_rate for p in posts) / total_posts if total_posts > 0 else 0
        
        # Detect underperforming posts
        posts_data = [p.to_dict() for p in posts]
        underperforming = instagram_service.detect_underperforming_posts(posts_data)
        
        # Mark posts as underperforming in database
        underperforming_ids = [p['instagram_post_id'] for p in underperforming]
        for post in posts:
            if post.instagram_post_id in underperforming_ids:
                post.is_underperforming = True
                perf_post = next(p for p in underperforming if p['instagram_post_id'] == post.instagram_post_id)
                post.performance_score = perf_post.get('performance_score', 0)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'connection': connection.to_dict(),
            'posts': posts_data,
            'metrics': {
                'total_posts': total_posts,
                'total_likes': total_likes,
                'total_comments': total_comments,
                'total_reach': total_reach,
                'total_impressions': total_impressions,
                'avg_engagement_rate': round(avg_engagement_rate, 2),
                'followers_count': connection.followers_count
            },
            'underperforming_posts': underperforming
        })
        
    except Exception as e:
        current_app.logger.error(f"Dashboard error: {str(e)}")
        return jsonify({'error': 'Failed to get dashboard data', 'details': str(e)}), 500


@instagram_bp.route('/posts/<post_id>/suggestions', methods=['POST'])
@jwt_required()
def generate_suggestions(post_id):
    """Generate AI suggestions for underperforming post"""
    try:
        current_user_id = get_jwt_identity()
        
        post = InstagramPost.query.filter_by(
            id=post_id,
            user_id=current_user_id
        ).first()
        
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        # Create prompt for AI
        prompt = f"""Analyze this Instagram post and provide 2-3 specific, actionable suggestions to improve engagement:

Post Type: {post.media_type}
Caption: {post.caption[:500] if post.caption else 'No caption'}
Current Engagement Rate: {post.engagement_rate}%
Likes: {post.like_count}
Comments: {post.comments_count}
Reach: {post.reach}
Performance Score: {post.performance_score}%

Provide suggestions in this format:
1. [Specific issue] - [Actionable solution]
2. [Specific issue] - [Actionable solution]
3. [Specific issue] - [Actionable solution]

Focus on: caption optimization, posting time, hashtags, call-to-action, content format, and audience engagement tactics."""
        
        # Generate suggestions using AI
        result = ai_service.generate_content(
            prompt=prompt,
            content_type='chat',
            tone='professional',
            max_tokens=500
        )
        
        if result.get('success'):
            suggestions_text = result.get('content', '')
            
            # Parse suggestions into array
            suggestions = []
            lines = suggestions_text.strip().split('\n')
            for line in lines:
                line = line.strip()
                if line and (line[0].isdigit() or line.startswith('-') or line.startswith('â€¢')):
                    # Remove numbering and clean up
                    clean_line = line.lstrip('0123456789.-â€¢) ').strip()
                    if clean_line:
                        suggestions.append(clean_line)
            
            # Store suggestions
            post.ai_suggestions = json.dumps(suggestions)
            post.suggestions_generated_at = datetime.now(timezone.utc)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'suggestions': suggestions,
                'post': post.to_dict()
            })
        else:
            return jsonify({'error': 'Failed to generate suggestions', 'details': result.get('error')}), 500
        
    except Exception as e:
        current_app.logger.error(f"Generate suggestions error: {str(e)}")
        return jsonify({'error': 'Failed to generate suggestions', 'details': str(e)}), 500


@instagram_bp.route('/competitors', methods=['GET'])
@jwt_required()
def get_competitors():
    """Get user's tracked competitors"""
    try:
        current_user_id = get_jwt_identity()
        
        competitors = InstagramCompetitor.query.filter_by(
            user_id=current_user_id,
            is_active=True
        ).all()
        
        return jsonify({
            'success': True,
            'competitors': [comp.to_dict() for comp in competitors]
        })
        
    except Exception as e:
        current_app.logger.error(f"Get competitors error: {str(e)}")
        return jsonify({'error': 'Failed to get competitors'}), 500


@instagram_bp.route('/competitors', methods=['POST'])
@jwt_required()
def add_competitor():
    """Add competitor for tracking"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        username = data.get('username')
        if not username:
            return jsonify({'error': 'Username is required'}), 400
        
        # Check if already tracking
        existing = InstagramCompetitor.query.filter_by(
            user_id=current_user_id,
            instagram_username=username
        ).first()
        
        if existing:
            return jsonify({'error': 'Already tracking this competitor'}), 400
        
        # Analyze competitor
        competitor_data = instagram_service.analyze_competitor(username)
        
        # Create competitor record
        competitor = InstagramCompetitor(
            user_id=current_user_id,
            instagram_username=username,
            followers_count=competitor_data.get('followers_count', 0),
            follows_count=competitor_data.get('follows_count', 0),
            media_count=competitor_data.get('media_count', 0),
            avg_likes=competitor_data.get('avg_likes', 0),
            avg_comments=competitor_data.get('avg_comments', 0),
            avg_engagement_rate=competitor_data.get('avg_engagement_rate', 0),
            posting_frequency=competitor_data.get('posting_frequency', 0),
            last_analyzed_at=datetime.now(timezone.utc)
        )
        
        db.session.add(competitor)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'competitor': competitor.to_dict(),
            'note': competitor_data.get('note', ''),
            'message': 'Competitor added successfully'
        })
        
    except Exception as e:
        current_app.logger.error(f"Add competitor error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to add competitor', 'details': str(e)}), 500


@instagram_bp.route('/competitors/<competitor_id>', methods=['DELETE'])
@jwt_required()
def remove_competitor(competitor_id):
    """Remove competitor from tracking"""
    try:
        current_user_id = get_jwt_identity()
        
        competitor = InstagramCompetitor.query.filter_by(
            id=competitor_id,
            user_id=current_user_id
        ).first()
        
        if not competitor:
            return jsonify({'error': 'Competitor not found'}), 404
        
        competitor.is_active = False
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Competitor removed successfully'
        })
        
    except Exception as e:
        current_app.logger.error(f"Remove competitor error: {str(e)}")
        return jsonify({'error': 'Failed to remove competitor'}), 500


@instagram_bp.route('/compare/<connection_id>', methods=['GET'])
@jwt_required()
def compare_with_competitors(connection_id):
    """Compare user's account with competitors"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get user's connection
        connection = InstagramConnection.query.filter_by(
            id=connection_id,
            user_id=current_user_id,
            is_active=True
        ).first()
        
        if not connection:
            return jsonify({'error': 'Connection not found'}), 404
        
        # Get user's posts for metrics
        posts = InstagramPost.query.filter_by(
            connection_id=connection_id
        ).all()
        
        user_avg_engagement = sum(p.engagement_rate for p in posts) / len(posts) if posts else 0
        user_avg_likes = sum(p.like_count for p in posts) / len(posts) if posts else 0
        user_avg_comments = sum(p.comments_count for p in posts) / len(posts) if posts else 0
        
        # Calculate posting frequency (posts per week)
        if posts:
            oldest_post = min(p.published_at for p in posts if p.published_at)
            newest_post = max(p.published_at for p in posts if p.published_at)
            days_diff = (newest_post - oldest_post).days or 1
            user_posting_frequency = (len(posts) / days_diff) * 7
        else:
            user_posting_frequency = 0
        
        # Get competitors
        competitors = InstagramCompetitor.query.filter_by(
            user_id=current_user_id,
            is_active=True
        ).all()
        
        comparison_data = {
            'user_account': {
                'username': connection.instagram_username,
                'followers': connection.followers_count,
                'avg_engagement_rate': round(user_avg_engagement, 2),
                'avg_likes': round(user_avg_likes, 1),
                'avg_comments': round(user_avg_comments, 1),
                'posting_frequency': round(user_posting_frequency, 1),
                'total_posts': len(posts)
            },
            'competitors': [comp.to_dict() for comp in competitors]
        }
        
        return jsonify({
            'success': True,
            'comparison': comparison_data
        })
        
    except Exception as e:
        current_app.logger.error(f"Compare error: {str(e)}")
        return jsonify({'error': 'Failed to compare accounts', 'details': str(e)}), 500
