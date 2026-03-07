from flask import Blueprint, request, jsonify, current_app, redirect
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, OAuthState
from platforms.linkedin.linkedin_model import LinkedInConnection, LinkedInPost
from platforms.linkedin.linkedin_service import LinkedInService
from datetime import datetime, timezone, timedelta
import uuid
import os
import requests
import json

linkedin_bp = Blueprint('linkedin', __name__)
linkedin_service = LinkedInService()

@linkedin_bp.route('/auth', methods=['GET'])
@jwt_required()
def get_auth_url():
    """Generate LinkedIn OAuth URL - JWT REQUIRED"""
    try:
        current_user_id = get_jwt_identity()
        
        # Generate unique state
        state = str(uuid.uuid4())
        
        # Store state in database for server-side validation
        oauth_state = OAuthState(
            state=state,
            user_id=current_user_id,
            platform='linkedin'
        )
        db.session.add(oauth_state)
        db.session.commit()
        
        current_app.logger.info(f"Created OAuth state for user {current_user_id}: {state}")
        
        # Generate OAuth URL
        oauth_url = linkedin_service.get_oauth_url(state)
        
        current_app.logger.info(f"Generated LinkedIn OAuth URL: {oauth_url}")
        
        return jsonify({
            'success': True,
            'oauth_url': oauth_url,
            'state': state
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error generating OAuth URL: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@linkedin_bp.route('/exchange-token', methods=['POST'])
@jwt_required()
def exchange_token():
    """Exchange authorization code for access token - JWT REQUIRED"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        code = data.get('code')
        state = data.get('state')
        
        current_app.logger.info(f"=== LINKEDIN TOKEN EXCHANGE START ===")
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
            platform='linkedin'
        ).first()
        
        if not oauth_state:
            current_app.logger.error(f"Invalid state: {state} not found in database")
            return jsonify({'success': False, 'error': 'Invalid state parameter'}), 400
        
        # Ensure expires_at is timezone-aware
        if oauth_state.expires_at and oauth_state.expires_at.tzinfo is None:
            oauth_state.expires_at = oauth_state.expires_at.replace(tzinfo=timezone.utc)
        
        if not oauth_state.is_valid():
            current_app.logger.error(f"State expired or already used: {state}")
            return jsonify({'success': False, 'error': 'State expired or already used'}), 400
        
        if oauth_state.user_id != current_user_id:
            current_app.logger.error(f"State user mismatch: {oauth_state.user_id} != {current_user_id}")
            return jsonify({'success': False, 'error': 'State does not belong to current user'}), 403
        
        current_app.logger.info(f"✓ State validated successfully")
        
        # Exchange code for access token
        token_response = linkedin_service.exchange_code_for_token(code)
        access_token = token_response.get('access_token')
        expires_in = token_response.get('expires_in', 5184000)  # Default 60 days
        
        current_app.logger.info(f"✓ Access token received, expires in {expires_in} seconds")
        
        # Get user profile
        profile = linkedin_service.get_user_profile(access_token)
        
        linkedin_user_id = profile.get('sub')
        linkedin_name = profile.get('name', '')
        linkedin_email = profile.get('email', '')
        profile_picture_url = profile.get('picture', '')
        
        current_app.logger.info(f"✓ Profile retrieved: {linkedin_name} ({linkedin_user_id})")
        
        # Try to get connection count
        try:
            connections_count = linkedin_service.get_connection_count(access_token)
            current_app.logger.info(f"✓ Connections count: {connections_count}")
        except Exception as conn_error:
            current_app.logger.warning(f"Could not fetch connections count: {str(conn_error)}")
            connections_count = 0
        
        # Calculate token expiration
        token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
        
        # Check if connection already exists
        existing_connection = LinkedInConnection.query.filter_by(
            user_id=current_user_id,
            linkedin_user_id=linkedin_user_id
        ).first()
        
        if existing_connection:
            # Update existing connection
            existing_connection.access_token = access_token
            existing_connection.token_expires_at = token_expires_at
            existing_connection.linkedin_name = linkedin_name
            existing_connection.linkedin_email = linkedin_email
            existing_connection.profile_picture_url = profile_picture_url
            existing_connection.connections_count = connections_count
            existing_connection.is_active = True
            existing_connection.updated_at = datetime.now(timezone.utc)
            
            connection = existing_connection
            current_app.logger.info(f"✓ Updated existing connection: {connection.id}")
        else:
            # Create new connection
            connection = LinkedInConnection(
                user_id=current_user_id,
                linkedin_user_id=linkedin_user_id,
                linkedin_name=linkedin_name,
                linkedin_email=linkedin_email,
                access_token=access_token,
                token_expires_at=token_expires_at,
                profile_picture_url=profile_picture_url,
                connections_count=connections_count
            )
            db.session.add(connection)
            current_app.logger.info(f"✓ Created new connection")
        
        # Mark state as used
        oauth_state.is_used = True
        oauth_state.used_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        current_app.logger.info(f"=== LINKEDIN TOKEN EXCHANGE SUCCESS ===")
        
        return jsonify({
            'success': True,
            'connection': connection.to_dict(),
            'message': 'LinkedIn connected successfully'
        })
        
    except requests.exceptions.HTTPError as e:
        db.session.rollback()
        current_app.logger.error(f"LinkedIn API error: {str(e)}")
        current_app.logger.error(f"Response: {e.response.text if hasattr(e, 'response') else 'No response'}")
        return jsonify({'success': False, 'error': 'Failed to connect to LinkedIn'}), 500
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error exchanging token: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@linkedin_bp.route('/connections', methods=['GET'])
@jwt_required()
def get_connections():
    """Get user's LinkedIn connections"""
    try:
        current_user_id = get_jwt_identity()
        
        connections = LinkedInConnection.query.filter_by(
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

@linkedin_bp.route('/connections/<connection_id>', methods=['DELETE'])
@jwt_required()
def disconnect(connection_id):
    """Disconnect LinkedIn account"""
    try:
        current_user_id = get_jwt_identity()
        
        connection = LinkedInConnection.query.filter_by(
            id=connection_id,
            user_id=current_user_id
        ).first()
        
        if not connection:
            return jsonify({'success': False, 'error': 'Connection not found'}), 404
        
        # Soft delete - mark as inactive
        connection.is_active = False
        connection.updated_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'LinkedIn disconnected successfully'
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error disconnecting: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@linkedin_bp.route('/sync/<connection_id>', methods=['POST'])
@jwt_required()
def sync_data(connection_id):
    """Sync LinkedIn posts and data"""
    try:
        current_user_id = get_jwt_identity()
        
        connection = LinkedInConnection.query.filter_by(
            id=connection_id,
            user_id=current_user_id
        ).first()
        
        if not connection:
            return jsonify({'success': False, 'error': 'Connection not found'}), 404
        
        # Get user posts
        posts_data = linkedin_service.get_user_posts(
            connection.access_token,
            connection.linkedin_user_id
        )
        
        posts_synced = 0
        
        for post_element in posts_data.get('elements', []):
            try:
                linkedin_post_id = post_element.get('id', '')
                
                # Extract post text
                specific_content = post_element.get('specificContent', {})
                share_content = specific_content.get('com.linkedin.ugc.ShareContent', {})
                share_commentary = share_content.get('shareCommentary', {})
                post_text = share_commentary.get('text', '')
                
                # Extract media
                media = share_content.get('media', [])
                media_url = media[0].get('originalUrl', '') if media else None
                
                # Extract metrics
                created_time = post_element.get('created', {}).get('time', 0)
                published_at = datetime.fromtimestamp(created_time / 1000, tz=timezone.utc) if created_time else None
                
                # Check if post already exists
                existing_post = LinkedInPost.query.filter_by(
                    linkedin_post_id=linkedin_post_id
                ).first()
                
                if existing_post:
                    # Update existing post
                    existing_post.post_text = post_text
                    existing_post.media_url = media_url
                    existing_post.updated_at = datetime.now(timezone.utc)
                else:
                    # Create new post
                    new_post = LinkedInPost(
                        connection_id=connection.id,
                        user_id=current_user_id,
                        linkedin_post_id=linkedin_post_id,
                        post_text=post_text,
                        media_url=media_url,
                        published_at=published_at
                    )
                    db.session.add(new_post)
                
                posts_synced += 1
                
            except Exception as post_error:
                current_app.logger.error(f"Error processing post: {str(post_error)}")
                continue
        
        # Update last synced time
        connection.last_synced_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'posts_synced': posts_synced,
            'message': f'Synced {posts_synced} posts'
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error syncing data: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@linkedin_bp.route('/dashboard/<connection_id>', methods=['GET'])
@jwt_required()
def get_dashboard(connection_id):
    """Get LinkedIn analytics dashboard data"""
    try:
        current_user_id = get_jwt_identity()
        
        connection = LinkedInConnection.query.filter_by(
            id=connection_id,
            user_id=current_user_id
        ).first()
        
        if not connection:
            return jsonify({'success': False, 'error': 'Connection not found'}), 404
        
        # Get posts
        posts = LinkedInPost.query.filter_by(
            connection_id=connection.id,
            user_id=current_user_id
        ).order_by(LinkedInPost.published_at.desc()).all()
        
        # Calculate metrics
        total_posts = len(posts)
        total_likes = sum(post.likes_count for post in posts)
        total_comments = sum(post.comments_count for post in posts)
        total_shares = sum(post.shares_count for post in posts)
        total_impressions = sum(post.impressions_count for post in posts)
        
        avg_engagement = (total_likes + total_comments + total_shares) / total_posts if total_posts > 0 else 0
        
        return jsonify({
            'success': True,
            'connection': connection.to_dict(),
            'stats': {
                'connections_count': connection.connections_count,
                'total_posts': total_posts,
                'total_likes': total_likes,
                'total_comments': total_comments,
                'total_shares': total_shares,
                'total_impressions': total_impressions,
                'avg_engagement': round(avg_engagement, 2)
            },
            'posts': [post.to_dict() for post in posts[:20]],  # Return latest 20 posts
            'last_synced_at': connection.last_synced_at.isoformat() if connection.last_synced_at else None
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fetching dashboard: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
