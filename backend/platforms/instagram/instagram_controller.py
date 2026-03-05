from flask import Blueprint, request, jsonify, current_app, redirect
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User
from platforms.instagram.instagram_model import InstagramConnection, OAuthState, InstagramPost, InstagramCompetitor
from platforms.instagram.instagram_service import InstagramService
from datetime import datetime, timezone, timedelta
import uuid
import os
import requests
import json

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

@instagram_bp.route('/auth', methods=['GET'])
@jwt_required()
def get_auth_url():
    """Generate Instagram OAuth URL - JWT REQUIRED"""
    try:
        current_user_id = get_jwt_identity()
        
        # Generate unique state
        state = str(uuid.uuid4())
        
        # Store state in database for server-side validation
        oauth_state = OAuthState(
            state=state,
            user_id=current_user_id,
            platform='instagram'
        )
        db.session.add(oauth_state)
        db.session.commit()
        
        current_app.logger.info(f"Created OAuth state for user {current_user_id}: {state}")
        
        # Generate OAuth URL
        oauth_url = instagram_service.get_oauth_url(state)
        
        # Debug logging
        current_app.logger.info(f"Generated OAuth URL: {oauth_url}")
        current_app.logger.info(f"App ID: {instagram_service.app_id}")
        current_app.logger.info(f"Redirect URI: {instagram_service.redirect_uri}")
        current_app.logger.info(f"Scopes: {instagram_service.scopes}")
        
        return jsonify({
            'success': True,
            'oauth_url': oauth_url,
            'state': state
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error generating OAuth URL: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@instagram_bp.route('/callback', methods=['GET'])
def oauth_callback():
    """Handle Instagram OAuth callback - NO JWT (Instagram redirects here)"""
    try:
        code = request.args.get('code')
        state = request.args.get('state')
        error = request.args.get('error')
        error_description = request.args.get('error_description')
        
        frontend_url = os.environ.get('INSTAGRAM_FRONTEND_URL', 'http://localhost:5173')
        callback_url = f"{frontend_url}/platforms/instagram/callback"
        
        # Handle errors from Instagram
        if error:
            current_app.logger.error(f"Instagram OAuth error: {error} - {error_description}")
            return redirect(f"{callback_url}?error={error}&error_description={error_description}")
        
        # Redirect to frontend with code and state
        # Frontend will call /exchange-token with JWT
        return redirect(f"{callback_url}?code={code}&state={state}")
        
    except Exception as e:
        current_app.logger.error(f"Error in OAuth callback: {str(e)}")
        frontend_url = os.environ.get('INSTAGRAM_FRONTEND_URL', 'http://localhost:5173')
        return redirect(f"{frontend_url}/platforms/instagram/callback?error=callback_error")

@instagram_bp.route('/exchange-token', methods=['POST'])
@jwt_required()
def exchange_token():
    """Exchange authorization code for access token - JWT REQUIRED"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        code = data.get('code')
        state = data.get('state')
        
        current_app.logger.info(f"=== TOKEN EXCHANGE START ===")
        current_app.logger.info(f"User ID: {current_user_id}")
        current_app.logger.info(f"Code received: {code[:20]}..." if code else "No code")
        current_app.logger.info(f"State received: {state}")
        
        if not code:
            return jsonify({'success': False, 'error': 'Authorization code is required'}), 400
        
        if not state:
            return jsonify({'success': False, 'error': 'State parameter is required'}), 400
        
        # Validate state server-side
        oauth_state = OAuthState.query.filter_by(
            state=state,
            platform='instagram'
        ).first()
        
        if not oauth_state:
            current_app.logger.error(f"Invalid state: {state} not found in database")
            return jsonify({'success': False, 'error': 'Invalid state parameter'}), 400
        
        # Ensure expires_at is timezone-aware (defensive programming for SQLite)
        if oauth_state.expires_at and oauth_state.expires_at.tzinfo is None:
            oauth_state.expires_at = oauth_state.expires_at.replace(tzinfo=timezone.utc)
            current_app.logger.warning(f"Fixed timezone-naive expires_at for state {state}")
        
        if not oauth_state.is_valid():
            current_app.logger.error(f"State expired or already used: {state}")
            return jsonify({'success': False, 'error': 'State expired or already used'}), 400
        
        if oauth_state.user_id != current_user_id:
            current_app.logger.error(f"State user mismatch: {oauth_state.user_id} != {current_user_id}")
            return jsonify({'success': False, 'error': 'State does not belong to current user'}), 403
        
        current_app.logger.info(f"✓ State validated successfully")
        
        # Exchange code for short-lived token
        current_app.logger.info(f"Step 1: Exchanging code for short-lived token...")
        current_app.logger.info(f"Redirect URI being used: {instagram_service.redirect_uri}")
        
        try:
            token_data = instagram_service.exchange_code_for_token(code)
            current_app.logger.info(f"✓ Short-lived token received")
            current_app.logger.info(f"Token data keys: {list(token_data.keys())}")
        except requests.exceptions.HTTPError as e:
            current_app.logger.error(f"❌ Instagram API error during token exchange:")
            current_app.logger.error(f"Status code: {e.response.status_code}")
            current_app.logger.error(f"Response: {e.response.text}")
            return jsonify({
                'success': False, 
                'error': f'Instagram API error: {e.response.text}'
            }), 400
        except Exception as e:
            current_app.logger.error(f"❌ Unexpected error during token exchange: {str(e)}")
            raise
        
        short_lived_token = token_data.get('access_token')
        instagram_user_id = token_data.get('user_id')
        
        if not short_lived_token:
            current_app.logger.error(f"❌ No access_token in response: {token_data}")
            return jsonify({'success': False, 'error': 'No access token received from Instagram'}), 500
        
        current_app.logger.info(f"Instagram User ID: {instagram_user_id}")
        
        # Exchange for long-lived token (60 days)
        current_app.logger.info(f"Step 2: Exchanging for long-lived token...")
        
        try:
            long_lived_data = instagram_service.get_long_lived_token(short_lived_token)
            current_app.logger.info(f"✓ Long-lived token received")
            current_app.logger.info(f"Expires in: {long_lived_data.get('expires_in')} seconds")
        except requests.exceptions.HTTPError as e:
            current_app.logger.error(f"❌ Instagram API error during long-lived token exchange:")
            current_app.logger.error(f"Status code: {e.response.status_code}")
            current_app.logger.error(f"Response: {e.response.text}")
            return jsonify({
                'success': False, 
                'error': f'Failed to get long-lived token: {e.response.text}'
            }), 400
        except Exception as e:
            current_app.logger.error(f"❌ Unexpected error during long-lived token exchange: {str(e)}")
            raise
        
        access_token = long_lived_data.get('access_token')
        expires_in = long_lived_data.get('expires_in', 5184000)  # 60 days default
        
        # Get user profile
        current_app.logger.info(f"Step 3: Fetching user profile...")
        
        try:
            profile = instagram_service.get_user_profile(access_token)
            current_app.logger.info(f"✓ Profile received: @{profile.get('username')}")
            current_app.logger.info(f"Account type: {profile.get('account_type')}")
            current_app.logger.info(f"Profile fields available: {list(profile.keys())}")
        except requests.exceptions.HTTPError as e:
            current_app.logger.error(f"❌ Instagram API error during profile fetch:")
            current_app.logger.error(f"Status code: {e.response.status_code}")
            current_app.logger.error(f"Response: {e.response.text}")
            return jsonify({
                'success': False, 
                'error': f'Failed to fetch profile: {e.response.text}'
            }), 400
        except Exception as e:
            current_app.logger.error(f"❌ Unexpected error during profile fetch: {str(e)}")
            raise
        
        # Calculate token expiration
        token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
        
        # Ensure it's timezone-aware (defensive)
        if token_expires_at.tzinfo is None:
            token_expires_at = token_expires_at.replace(tzinfo=timezone.utc)
        
        # Check if connection already exists
        existing_connection = InstagramConnection.query.filter_by(
            user_id=current_user_id,
            instagram_user_id=instagram_user_id
        ).first()
        
        if existing_connection:
            current_app.logger.info(f"Updating existing connection")
            # Update existing connection with ALL available fields
            existing_connection.access_token = access_token
            existing_connection.token_expires_at = token_expires_at
            existing_connection.instagram_username = profile.get('username')
            existing_connection.instagram_account_type = profile.get('account_type')
            existing_connection.media_count = profile.get('media_count', 0)
            existing_connection.followers_count = profile.get('followers_count', 0)
            existing_connection.follows_count = profile.get('follows_count', 0)
            existing_connection.profile_picture_url = profile.get('profile_picture_url', '')
            existing_connection.is_active = True
            existing_connection.updated_at = datetime.now(timezone.utc)
            
            connection = existing_connection
        else:
            current_app.logger.info(f"Creating new connection")
            # Create new connection with ALL available fields
            connection = InstagramConnection(
                user_id=current_user_id,
                instagram_user_id=instagram_user_id,
                instagram_username=profile.get('username'),
                instagram_account_type=profile.get('account_type'),
                access_token=access_token,
                token_expires_at=token_expires_at,
                media_count=profile.get('media_count', 0),
                followers_count=profile.get('followers_count', 0),
                follows_count=profile.get('follows_count', 0),
                profile_picture_url=profile.get('profile_picture_url', ''),
                is_active=True
            )
            db.session.add(connection)
        
        # IMPROVEMENT: Mark state as used only after successful token exchange
        oauth_state.mark_used()
        
        # Commit everything in one transaction
        db.session.commit()
        
        current_app.logger.info(f"✓ Instagram connection saved successfully")
        current_app.logger.info(f"=== TOKEN EXCHANGE COMPLETE ===")
        
        return jsonify({
            'success': True,
            'connection': connection.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"❌ FATAL ERROR in token exchange: {str(e)}")
        current_app.logger.exception(e)  # This will log the full stack trace
        return jsonify({'success': False, 'error': str(e)}), 500

@instagram_bp.route('/connections', methods=['GET'])
@jwt_required()
def get_connections():
    """Get user's Instagram connections - JWT REQUIRED"""
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
        current_app.logger.error(f"Error fetching connections: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@instagram_bp.route('/connections/<connection_id>', methods=['DELETE'])
@jwt_required()
def disconnect_account(connection_id):
    """Disconnect Instagram account - JWT REQUIRED"""
    try:
        current_user_id = get_jwt_identity()
        
        connection = InstagramConnection.query.filter_by(
            id=connection_id,
            user_id=current_user_id
        ).first()
        
        if not connection:
            return jsonify({'success': False, 'error': 'Connection not found'}), 404
        
        connection.is_active = False
        connection.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Instagram account disconnected successfully'
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error disconnecting account: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@instagram_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_instagram_profile():
    """Get connected Instagram account profile data - JWT REQUIRED"""
    try:
        current_user_id = get_jwt_identity()
        
        connection = InstagramConnection.query.filter_by(
            user_id=current_user_id,
            is_active=True
        ).first()
        
        if not connection:
            return jsonify({'success': False, 'error': 'No Instagram account connected'}), 404
        
        # Always fetch fresh data from Instagram API
        try:
            fresh_profile = instagram_service.get_user_profile(connection.access_token)
            
            # Update database with fresh data (all available fields)
            connection.media_count = fresh_profile.get('media_count', 0)
            connection.followers_count = fresh_profile.get('followers_count', 0)
            connection.follows_count = fresh_profile.get('follows_count', 0)
            connection.profile_picture_url = fresh_profile.get('profile_picture_url', '')
            connection.instagram_account_type = fresh_profile.get('account_type', connection.instagram_account_type)
            connection.updated_at = datetime.now(timezone.utc)
            connection.last_synced_at = datetime.now(timezone.utc)
            db.session.commit()
            
            current_app.logger.info(f"Instagram profile refreshed for user {current_user_id}")
            current_app.logger.info(f"Account type: {connection.instagram_account_type}")
            current_app.logger.info(f"Followers: {connection.followers_count}, Following: {connection.follows_count}, Media: {connection.media_count}")
        except Exception as e:
            current_app.logger.warning(f"Failed to refresh Instagram profile: {str(e)}")
            # Continue with stored data if API call fails
        
        # Check if account is Personal (followers_count not available)
        is_personal_account = connection.instagram_account_type and connection.instagram_account_type.upper() == 'PERSONAL'
        
        return jsonify({
            'success': True,
            'profile': {
                'username': connection.instagram_username,
                'account_type': connection.instagram_account_type,
                'media_count': connection.media_count,
                'followers_count': connection.followers_count,
                'follows_count': connection.follows_count,
                'profile_picture_url': connection.profile_picture_url,
                'connected_at': connection.created_at.isoformat() if connection.created_at else None,
                'last_synced_at': connection.last_synced_at.isoformat() if connection.last_synced_at else None,
                'is_personal_account': is_personal_account,
                'note': 'Followers count requires a Business or Creator account' if is_personal_account else None
            }
        })
    except Exception as e:
        current_app.logger.error(f"Error fetching Instagram profile: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@instagram_bp.route('/cleanup-states', methods=['POST'])
@jwt_required()
def cleanup_expired_states():
    """Cleanup expired OAuth states (can be called periodically)"""
    try:
        # Delete states older than 1 hour
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=1)
        
        deleted_count = OAuthState.query.filter(
            OAuthState.created_at < cutoff_time
        ).delete()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'deleted_count': deleted_count
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error cleaning up states: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@instagram_bp.route('/debug', methods=['GET'])
def debug_config():
    """Debug endpoint to verify Instagram configuration - NO AUTH REQUIRED"""
    app_id = os.environ.get('INSTAGRAM_APP_ID')
    app_secret = os.environ.get('INSTAGRAM_APP_SECRET')
    redirect_uri = os.environ.get('INSTAGRAM_REDIRECT_URI')
    scopes = os.environ.get('INSTAGRAM_SCOPES', 'user_profile,user_media')
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
            
            # Check if post exists for this user
            post = InstagramPost.query.filter_by(
                instagram_post_id=media_id,
                user_id=current_user_id
            ).first()
            
            if post:
                # Update existing post - ensure connection_id is correct
                post.connection_id = connection_id
                post.like_count = likes
                post.comments_count = comments
                post.reach = reach
                post.impressions = impressions
                post.saves_count = saves
                post.engagement_rate = engagement_rate
                post.updated_at = datetime.now(timezone.utc)
                current_app.logger.info(f"Updated existing post {media_id} for user {current_user_id}")
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
        
        # Get posts - IMPORTANT: Filter by both connection_id AND user_id for security
        posts = InstagramPost.query.filter_by(
            connection_id=connection_id,
            user_id=current_user_id
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
        
        # Import AI service
        from services.ai_service import AIContentGenerator
        ai_service = AIContentGenerator()
        
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
                if line and (line[0].isdigit() or line.startswith('-') or line.startswith('•')):
                    # Remove numbering and clean up
                    clean_line = line.lstrip('0123456789.-• ').strip()
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
        
        # Remove @ if present
        username = username.lstrip('@')
        
        # Check if already tracking
        existing = InstagramCompetitor.query.filter_by(
            user_id=current_user_id,
            instagram_username=username
        ).first()
        
        if existing:
            if existing.is_active:
                return jsonify({'error': 'Already tracking this competitor'}), 400
            else:
                # Reactivate existing competitor
                existing.is_active = True
                existing.last_analyzed_at = datetime.now(timezone.utc)
                db.session.commit()
                return jsonify({
                    'success': True,
                    'competitor': existing.to_dict(),
                    'message': 'Competitor reactivated successfully'
                })
        
        # Get user's Instagram connection to use their access token
        connection = InstagramConnection.query.filter_by(
            user_id=current_user_id,
            is_active=True
        ).first()
        
        if not connection:
            return jsonify({'error': 'No Instagram account connected. Connect your account first.'}), 400
        
        # Analyze competitor using user's access token (Business Discovery API)
        competitor_data = instagram_service.analyze_competitor(username, connection.access_token)
        
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
        
        note = competitor_data.get('note', '')
        if note:
            current_app.logger.warning(f"Competitor analysis note: {note}")
        
        return jsonify({
            'success': True,
            'competitor': competitor.to_dict(),
            'note': note,
            'message': 'Competitor added successfully' if not note else f'Competitor added with note: {note}'
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
            connection_id=connection_id,
            user_id=current_user_id
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


# ============================================================================
# AI-POWERED FEATURES - The WOW Factor 🚀
# ============================================================================

@instagram_bp.route('/ai/content-gaps/<connection_id>', methods=['GET'])
@jwt_required()
def analyze_content_gaps(connection_id):
    """AI-powered content gap analysis"""
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
        
        # Get user's posts
        user_posts = InstagramPost.query.filter_by(
            connection_id=connection_id,
            user_id=current_user_id
        ).order_by(InstagramPost.published_at.desc()).limit(30).all()
        
        # Get competitor posts
        competitors = InstagramCompetitor.query.filter_by(
            user_id=current_user_id,
            is_active=True
        ).all()
        
        # For now, use competitor data we have
        competitor_posts_data = []
        for comp in competitors:
            # Simulate competitor posts based on their metrics
            for i in range(min(comp.media_count, 30)):
                competitor_posts_data.append({
                    'media_type': 'IMAGE',
                    'engagement_rate': comp.avg_engagement_rate,
                    'caption': '',
                    'published_at': datetime.now(timezone.utc) - timedelta(days=i)
                })
        
        # Import AI service
        from services.instagram_ai_service import InstagramAIService
        ai_service = InstagramAIService()
        
        # Analyze gaps
        user_posts_data = [p.to_dict() for p in user_posts]
        analysis = ai_service.analyze_content_gaps(user_posts_data, competitor_posts_data)
        
        return jsonify({
            'success': True,
            'analysis': analysis
        })
        
    except Exception as e:
        current_app.logger.error(f"Content gap analysis error: {str(e)}")
        return jsonify({'error': 'Failed to analyze content gaps', 'details': str(e)}), 500


@instagram_bp.route('/ai/optimize-caption', methods=['POST'])
@jwt_required()
def optimize_caption():
    """AI-powered caption optimization"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        original_caption = data.get('caption')
        connection_id = data.get('connection_id')
        
        if not original_caption:
            return jsonify({'error': 'Caption is required'}), 400
        
        # Get user's top posts for pattern analysis
        posts = InstagramPost.query.filter_by(
            connection_id=connection_id,
            user_id=current_user_id
        ).order_by(InstagramPost.engagement_rate.desc()).limit(10).all()
        
        if not posts:
            return jsonify({'error': 'Not enough historical data. Create more posts first.'}), 400
        
        # Import AI service
        from services.instagram_ai_service import InstagramAIService
        import asyncio
        ai_service = InstagramAIService()
        
        # Optimize caption
        top_posts_data = [p.to_dict() for p in posts]
        result = asyncio.run(ai_service.optimize_caption(original_caption, top_posts_data))
        
        return jsonify(result)
        
    except Exception as e:
        current_app.logger.error(f"Caption optimization error: {str(e)}")
        return jsonify({'error': 'Failed to optimize caption', 'details': str(e)}), 500


@instagram_bp.route('/ai/predict-performance', methods=['POST'])
@jwt_required()
def predict_performance():
    """AI-powered performance prediction"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        post_data = data.get('post')
        connection_id = data.get('connection_id')
        
        if not post_data:
            return jsonify({'error': 'Post data is required'}), 400
        
        # Get historical posts
        historical_posts = InstagramPost.query.filter_by(
            connection_id=connection_id,
            user_id=current_user_id
        ).order_by(InstagramPost.published_at.desc()).limit(50).all()
        
        if len(historical_posts) < 5:
            return jsonify({'error': 'Not enough historical data. Need at least 5 posts.'}), 400
        
        # Import AI service
        from services.instagram_ai_service import InstagramAIService
        import asyncio
        ai_service = InstagramAIService()
        
        # Predict performance
        historical_data = [p.to_dict() for p in historical_posts]
        prediction = asyncio.run(ai_service.predict_performance(post_data, historical_data))
        
        return jsonify({
            'success': True,
            'prediction': prediction
        })
        
    except Exception as e:
        current_app.logger.error(f"Performance prediction error: {str(e)}")
        return jsonify({'error': 'Failed to predict performance', 'details': str(e)}), 500


@instagram_bp.route('/ai/content-ideas/<connection_id>', methods=['GET'])
@jwt_required()
def generate_content_ideas(connection_id):
    """AI-powered content idea generation"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get niche from query params
        niche = request.args.get('niche', 'general')
        
        # Get user's connection
        connection = InstagramConnection.query.filter_by(
            id=connection_id,
            user_id=current_user_id,
            is_active=True
        ).first()
        
        if not connection:
            return jsonify({'error': 'Connection not found'}), 404
        
        # Get user's posts
        user_posts = InstagramPost.query.filter_by(
            connection_id=connection_id,
            user_id=current_user_id
        ).order_by(InstagramPost.published_at.desc()).limit(30).all()
        
        # Get competitor posts (simulated for now)
        # Get competitor posts (simulated for now)
        competitors = InstagramCompetitor.query.filter_by(
            user_id=current_user_id,
            is_active=True
        ).all()
        
        competitor_posts_data = []
        for comp in competitors:
            for i in range(min(comp.media_count, 10)):
                competitor_posts_data.append({
                    'media_type': 'IMAGE',
                    'engagement_rate': comp.avg_engagement_rate,
                    'caption': f'Sample post from @{comp.instagram_username}',
                    'published_at': datetime.now(timezone.utc) - timedelta(days=i)
                })
        
        # Import AI service
        from services.instagram_ai_service import InstagramAIService
        import asyncio
        ai_service = InstagramAIService()
        
        # Generate ideas
        user_posts_data = [p.to_dict() for p in user_posts]
        result = asyncio.run(ai_service.generate_content_ideas(user_posts_data, competitor_posts_data, niche))
        
        return jsonify(result)
        
    except Exception as e:
        current_app.logger.error(f"Content ideas generation error: {str(e)}")
        return jsonify({'error': 'Failed to generate content ideas', 'details': str(e)}), 500


# ==================== ADVANCED ML FEATURES ====================

@instagram_bp.route('/ml/analyze-patterns/<connection_id>', methods=['GET'])
@jwt_required()
def analyze_patterns(connection_id):
    """
    Pattern Recognition: Analyze best caption length, posting time, and format
    Uses statistical correlation for data-driven insights
    """
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
        
        # Get user's posts
        posts = InstagramPost.query.filter_by(
            connection_id=connection_id,
            user_id=current_user_id
        ).order_by(InstagramPost.published_at.desc()).all()
        
        if len(posts) < 5:
            return jsonify({
                'error': 'Need at least 5 posts for pattern analysis',
                'current_posts': len(posts)
            }), 400
        
        # Import ML service
        from services.instagram_ml_service import InstagramMLService
        ml_service = InstagramMLService()
        
        # Analyze patterns - convert posts to dict format
        posts_data = []
        for p in posts:
            posts_data.append({
                'media_type': p.media_type,
                'caption': p.caption or '',
                'engagement_rate': p.engagement_rate or 0,
                'published_at': p.published_at,  # Keep as datetime object
                'like_count': p.like_count or 0,
                'comments_count': p.comments_count or 0
            })
        
        result = ml_service.analyze_patterns(posts_data)
        
        return jsonify(result)
        
    except Exception as e:
        current_app.logger.error(f"Pattern analysis error: {str(e)}")
        return jsonify({'error': 'Failed to analyze patterns', 'details': str(e)}), 500


@instagram_bp.route('/ml/sentiment-analysis/<connection_id>', methods=['POST'])
@jwt_required()
def analyze_sentiment(connection_id):
    """
    Sentiment Analysis: Analyze comments to identify emotional triggers
    Provides insights on audience emotional responses
    """
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
        
        # Get comments from request body
        data = request.get_json()
        comments = data.get('comments', [])
        
        if not comments:
            # If no comments provided, fetch from recent posts
            posts = InstagramPost.query.filter_by(
                connection_id=connection_id,
                user_id=current_user_id
            ).order_by(InstagramPost.published_at.desc()).limit(10).all()
            
            # Simulate comments (in production, fetch from Instagram API)
            comments = []
            for post in posts:
                if post.comments_count > 0:
                    # Add simulated comments based on engagement
                    for i in range(min(post.comments_count, 5)):
                        comments.append({
                            'text': f'Sample comment {i+1} for post',
                            'post_id': post.instagram_post_id
                        })
        
        if not comments:
            return jsonify({
                'error': 'No comments available for analysis',
                'suggestion': 'Provide comments in request body or ensure posts have comments'
            }), 400
        
        # Import ML service
        from services.instagram_ml_service import InstagramMLService
        ml_service = InstagramMLService()
        
        # Analyze sentiment
        result = ml_service.analyze_sentiment(comments)
        
        return jsonify(result)
        
    except Exception as e:
        current_app.logger.error(f"Sentiment analysis error: {str(e)}")
        return jsonify({'error': 'Failed to analyze sentiment', 'details': str(e)}), 500


@instagram_bp.route('/ml/train-model/<connection_id>', methods=['POST'])
@jwt_required()
def train_engagement_model(connection_id):
    """
    Train ML model for engagement prediction
    Uses historical data to build predictive model
    """
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
        
        # Get user's posts
        posts = InstagramPost.query.filter_by(
            connection_id=connection_id,
            user_id=current_user_id
        ).order_by(InstagramPost.published_at.desc()).all()
        
        if len(posts) < 10:
            return jsonify({
                'error': 'Need at least 10 posts to train model',
                'current_posts': len(posts)
            }), 400
        
        # Import ML service
        from services.instagram_ml_service import InstagramMLService
        ml_service = InstagramMLService()
        
        # Train model - convert posts to dict format
        posts_data = []
        for p in posts:
            posts_data.append({
                'media_type': p.media_type,
                'caption': p.caption or '',
                'engagement_rate': p.engagement_rate or 0,
                'published_at': p.published_at,  # Keep as datetime object
                'like_count': p.like_count or 0,
                'comments_count': p.comments_count or 0
            })
        
        result = ml_service.train_engagement_model(posts_data)
        
        # Store model in session or cache (for production, use Redis or database)
        # For now, we'll return the result
        
        return jsonify(result)
        
    except Exception as e:
        current_app.logger.error(f"Model training error: {str(e)}")
        return jsonify({'error': 'Failed to train model', 'details': str(e)}), 500


@instagram_bp.route('/ml/predict-engagement/<connection_id>', methods=['POST'])
@jwt_required()
def predict_engagement_ml(connection_id):
    """
    ML-based engagement prediction
    More accurate than rule-based prediction
    """
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
        
        # Get post data from request
        data = request.get_json()
        post_data = data.get('post', {})
        
        if not post_data:
            return jsonify({'error': 'Post data required'}), 400
        
        # Import ML service
        from services.instagram_ml_service import InstagramMLService
        ml_service = InstagramMLService()
        
        # First, train model if not already trained
        posts = InstagramPost.query.filter_by(
            connection_id=connection_id,
            user_id=current_user_id
        ).order_by(InstagramPost.published_at.desc()).all()
        
        if len(posts) >= 10:
            posts_data = []
            for p in posts:
                posts_data.append({
                    'media_type': p.media_type,
                    'caption': p.caption or '',
                    'engagement_rate': p.engagement_rate or 0,
                    'published_at': p.published_at,  # Keep as datetime object
                    'like_count': p.like_count or 0,
                    'comments_count': p.comments_count or 0
                })
            ml_service.train_engagement_model(posts_data)
        
        # Predict engagement
        result = ml_service.predict_engagement_ml(post_data)
        
        return jsonify(result)
        
    except Exception as e:
        current_app.logger.error(f"ML prediction error: {str(e)}")
        return jsonify({'error': 'Failed to predict engagement', 'details': str(e)}), 500


@instagram_bp.route('/ml/optimal-posting-time/<connection_id>', methods=['GET'])
@jwt_required()
def get_optimal_posting_time(connection_id):
    """
    Recommend optimal posting time based on ML analysis
    Considers historical performance and day/time patterns
    """
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
        
        # Get target date from query params
        target_date_str = request.args.get('date')
        target_date = None
        
        if target_date_str:
            try:
                target_date = datetime.fromisoformat(target_date_str)
            except:
                return jsonify({'error': 'Invalid date format. Use ISO format (YYYY-MM-DD)'}), 400
        
        # Get user's posts
        posts = InstagramPost.query.filter_by(
            connection_id=connection_id,
            user_id=current_user_id
        ).order_by(InstagramPost.published_at.desc()).all()
        
        if len(posts) < 5:
            return jsonify({
                'error': 'Need at least 5 posts for time recommendation',
                'current_posts': len(posts)
            }), 400
        
        # Import ML service
        from services.instagram_ml_service import InstagramMLService
        ml_service = InstagramMLService()
        
        # Get optimal posting time - convert posts to dict format
        posts_data = []
        for p in posts:
            posts_data.append({
                'media_type': p.media_type,
                'caption': p.caption or '',
                'engagement_rate': p.engagement_rate or 0,
                'published_at': p.published_at,  # Keep as datetime object
                'like_count': p.like_count or 0,
                'comments_count': p.comments_count or 0
            })
        
        result = ml_service.recommend_optimal_posting_time(posts_data, target_date)
        
        return jsonify(result)
        
    except Exception as e:
        current_app.logger.error(f"Optimal time recommendation error: {str(e)}")
        return jsonify({'error': 'Failed to recommend posting time', 'details': str(e)}), 500


@instagram_bp.route('/ml/cross-platform-analysis/<connection_id>', methods=['GET'])
@jwt_required()
def analyze_cross_platform(connection_id):
    """
    Multi-platform analysis foundation
    Currently supports Instagram, ready for expansion to TikTok, YouTube, Twitter
    """
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
        
        # Get Instagram posts
        instagram_posts = InstagramPost.query.filter_by(
            connection_id=connection_id,
            user_id=current_user_id
        ).order_by(InstagramPost.published_at.desc()).all()
        
        # Import ML service
        from services.instagram_ml_service import InstagramMLService
        ml_service = InstagramMLService()
        
        # Analyze cross-platform (currently only Instagram)
        instagram_posts_data = [p.to_dict() for p in instagram_posts]
        result = ml_service.analyze_cross_platform_performance(instagram_posts_data)
        
        return jsonify(result)
        
    except Exception as e:
        current_app.logger.error(f"Cross-platform analysis error: {str(e)}")
        return jsonify({'error': 'Failed to analyze cross-platform', 'details': str(e)}), 500
