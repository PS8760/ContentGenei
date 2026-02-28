from flask import Blueprint, request, jsonify, redirect, session
from models import db, User, PlatformConnection, AggregatedPost, PostCategory, PostCategoryAssignment
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone, timedelta
import os
import json
import requests
from cryptography.fernet import Fernet
import base64

geneilink_bp = Blueprint('geneilink', __name__)

# Encryption key for OAuth tokens (should be in environment variables)
ENCRYPTION_KEY = os.environ.get('ENCRYPTION_KEY', Fernet.generate_key())
cipher_suite = Fernet(ENCRYPTION_KEY)

def encrypt_token(token):
    """Encrypt OAuth token"""
    return cipher_suite.encrypt(token.encode()).decode()

def decrypt_token(encrypted_token):
    """Decrypt OAuth token"""
    return cipher_suite.decrypt(encrypted_token.encode()).decode()

# ==================== PLATFORM CONNECTION ENDPOINTS ====================

@geneilink_bp.route('/connect/<platform>', methods=['POST'])
@jwt_required()
def initiate_oauth(platform):
    """Initiate OAuth flow for a platform"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        # Validate platform
        valid_platforms = ['instagram', 'linkedin', 'twitter']
        if platform not in valid_platforms:
            return jsonify({'success': False, 'error': f'Invalid platform. Supported: {", ".join(valid_platforms)}'}), 400
        
        # Generate OAuth URL based on platform
        if platform == 'instagram':
            # Instagram uses Facebook OAuth
            client_id = os.environ.get('FACEBOOK_APP_ID')
            redirect_uri = os.environ.get('INSTAGRAM_REDIRECT_URI', 'http://localhost:5001/api/geneilink/callback/instagram')
            scope = 'instagram_basic,instagram_content_publish,pages_show_list'
            auth_url = f'https://www.facebook.com/v18.0/dialog/oauth?client_id={client_id}&redirect_uri={redirect_uri}&scope={scope}&response_type=code'
            
        elif platform == 'linkedin':
            client_id = os.environ.get('LINKEDIN_CLIENT_ID')
            redirect_uri = os.environ.get('LINKEDIN_REDIRECT_URI', 'http://localhost:5001/api/geneilink/callback/linkedin')
            scope = 'r_liteprofile r_emailaddress w_member_social'
            auth_url = f'https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id={client_id}&redirect_uri={redirect_uri}&scope={scope}'
            
        elif platform == 'twitter':
            # Twitter OAuth 2.0 with PKCE
            client_id = os.environ.get('TWITTER_CLIENT_ID')
            redirect_uri = os.environ.get('TWITTER_REDIRECT_URI', 'http://localhost:5001/api/geneilink/callback/twitter')
            scope = 'tweet.read users.read offline.access'
            # Generate code_challenge for PKCE (simplified for now)
            auth_url = f'https://twitter.com/i/oauth2/authorize?response_type=code&client_id={client_id}&redirect_uri={redirect_uri}&scope={scope}&state={current_user.id}'
        
        return jsonify({
            'success': True,
            'auth_url': auth_url,
            'platform': platform
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@geneilink_bp.route('/callback/<platform>', methods=['GET'])
def oauth_callback(platform):
    """Handle OAuth callback from platform"""
    try:
        code = request.args.get('code')
        error = request.args.get('error')
        
        if error:
            return jsonify({'success': False, 'error': f'OAuth error: {error}'}), 400
        
        if not code:
            return jsonify({'success': False, 'error': 'No authorization code received'}), 400
        
        # Exchange code for access token based on platform
        if platform == 'instagram':
            # Exchange code for Facebook access token
            client_id = os.environ.get('FACEBOOK_APP_ID')
            client_secret = os.environ.get('FACEBOOK_APP_SECRET')
            redirect_uri = os.environ.get('INSTAGRAM_REDIRECT_URI', 'http://localhost:5001/api/geneilink/callback/instagram')
            
            token_url = 'https://graph.facebook.com/v18.0/oauth/access_token'
            token_data = {
                'client_id': client_id,
                'client_secret': client_secret,
                'redirect_uri': redirect_uri,
                'code': code
            }
            
            token_response = requests.post(token_url, data=token_data)
            token_json = token_response.json()
            
            if 'access_token' not in token_json:
                return jsonify({'success': False, 'error': 'Failed to get access token'}), 400
            
            access_token = token_json['access_token']
            
            # Get Instagram Business Account ID
            # This is a simplified version - in production, you'd need to get the user's Facebook pages
            # and then get the Instagram Business Account connected to those pages
            
            # For now, return success with instructions
            return jsonify({
                'success': True,
                'message': 'Instagram OAuth successful. Please complete setup in dashboard.',
                'platform': platform,
                'access_token': access_token  # In production, don't return this directly
            })
            
        elif platform == 'linkedin':
            client_id = os.environ.get('LINKEDIN_CLIENT_ID')
            client_secret = os.environ.get('LINKEDIN_CLIENT_SECRET')
            redirect_uri = os.environ.get('LINKEDIN_REDIRECT_URI', 'http://localhost:5001/api/geneilink/callback/linkedin')
            
            token_url = 'https://www.linkedin.com/oauth/v2/accessToken'
            token_data = {
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': redirect_uri,
                'client_id': client_id,
                'client_secret': client_secret
            }
            
            token_response = requests.post(token_url, data=token_data)
            token_json = token_response.json()
            
            if 'access_token' not in token_json:
                return jsonify({'success': False, 'error': 'Failed to get access token'}), 400
            
            access_token = token_json['access_token']
            
            # Get LinkedIn profile
            profile_url = 'https://api.linkedin.com/v2/me'
            headers = {'Authorization': f'Bearer {access_token}'}
            profile_response = requests.get(profile_url, headers=headers)
            profile_data = profile_response.json()
            
            return jsonify({
                'success': True,
                'message': 'LinkedIn OAuth successful',
                'platform': platform,
                'profile': profile_data
            })
            
        elif platform == 'twitter':
            client_id = os.environ.get('TWITTER_CLIENT_ID')
            client_secret = os.environ.get('TWITTER_CLIENT_SECRET')
            redirect_uri = os.environ.get('TWITTER_REDIRECT_URI', 'http://localhost:5001/api/geneilink/callback/twitter')
            
            token_url = 'https://api.twitter.com/2/oauth2/token'
            token_data = {
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': redirect_uri,
                'client_id': client_id
            }
            
            # Twitter requires Basic Auth
            auth = (client_id, client_secret)
            token_response = requests.post(token_url, data=token_data, auth=auth)
            token_json = token_response.json()
            
            if 'access_token' not in token_json:
                return jsonify({'success': False, 'error': 'Failed to get access token'}), 400
            
            access_token = token_json['access_token']
            
            return jsonify({
                'success': True,
                'message': 'Twitter OAuth successful',
                'platform': platform
            })
        
        return jsonify({'success': False, 'error': 'Platform not implemented'}), 400
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@geneilink_bp.route('/connections', methods=['GET'])
@jwt_required()
def get_connections():
    """Get all platform connections for the current user"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        connections = PlatformConnection.query.filter_by(
            user_id=current_user.id,
            is_active=True
        ).all()
        
        # Group by platform
        grouped = {}
        for conn in connections:
            platform = conn.platform_name
            if platform not in grouped:
                grouped[platform] = []
            grouped[platform].append(conn.to_dict())
        
        return jsonify({
            'success': True,
            'connections': grouped,
            'total_connections': len(connections)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@geneilink_bp.route('/connections/<connection_id>', methods=['DELETE'])
@jwt_required()
def disconnect_platform( connection_id):
    """Disconnect a platform connection"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    try:
        connection = PlatformConnection.query.filter_by(
            id=connection_id,
            user_id=current_user.id
        ).first()
        
        if not connection:
            return jsonify({'success': False, 'error': 'Connection not found'}), 404
        
        # Delete all posts associated with this connection
        AggregatedPost.query.filter_by(connection_id=connection_id).delete()
        
        # Delete the connection
        db.session.delete(connection)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Platform disconnected successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== POSTS ENDPOINTS ====================

@geneilink_bp.route('/posts', methods=['GET'])
@jwt_required()
def get_posts():
    """Get aggregated posts with filters"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    try:
        # Get query parameters
        platform = request.args.get('platform')
        category_id = request.args.get('category')
        saved_only = request.args.get('saved') == 'true'
        search = request.args.get('search', '')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        # Build query
        query = AggregatedPost.query.filter_by(user_id=current_user.id)
        
        if platform:
            query = query.filter_by(platform_name=platform)
        
        if saved_only:
            query = query.filter_by(is_saved=True)
        
        if category_id:
            # Join with category assignments
            query = query.join(PostCategoryAssignment).filter(
                PostCategoryAssignment.category_id == category_id
            )
        
        if search:
            query = query.filter(AggregatedPost.content.ilike(f'%{search}%'))
        
        # Order by published date (newest first)
        query = query.order_by(AggregatedPost.published_at.desc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        posts = [post.to_dict() for post in pagination.items]
        
        return jsonify({
            'success': True,
            'posts': posts,
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'total_pages': pagination.pages
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@geneilink_bp.route('/posts/<post_id>', methods=['GET'])
@jwt_required()
def get_post( post_id):
    """Get a specific post"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    try:
        post = AggregatedPost.query.filter_by(
            id=post_id,
            user_id=current_user.id
        ).first()
        
        if not post:
            return jsonify({'success': False, 'error': 'Post not found'}), 404
        
        return jsonify({
            'success': True,
            'post': post.to_dict()
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@geneilink_bp.route('/posts/<post_id>/save', methods=['POST'])
@jwt_required()
def save_post( post_id):
    """Save a post to collection"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    try:
        post = AggregatedPost.query.filter_by(
            id=post_id,
            user_id=current_user.id
        ).first()
        
        if not post:
            return jsonify({'success': False, 'error': 'Post not found'}), 404
        
        post.is_saved = True
        post.saved_at = datetime.now(timezone.utc)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Post saved successfully',
            'post': post.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@geneilink_bp.route('/posts/<post_id>/save', methods=['DELETE'])
@jwt_required()
def unsave_post( post_id):
    """Unsave a post from collection"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    try:
        post = AggregatedPost.query.filter_by(
            id=post_id,
            user_id=current_user.id
        ).first()
        
        if not post:
            return jsonify({'success': False, 'error': 'Post not found'}), 404
        
        post.is_saved = False
        post.saved_at = None
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Post unsaved successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@geneilink_bp.route('/posts/saved', methods=['GET'])
@jwt_required()
def get_saved_posts():
    """Get all saved posts"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        pagination = AggregatedPost.query.filter_by(
            user_id=current_user.id,
            is_saved=True
        ).order_by(AggregatedPost.saved_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        posts = [post.to_dict() for post in pagination.items]
        
        return jsonify({
            'success': True,
            'posts': posts,
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'total_pages': pagination.pages
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== CATEGORY ENDPOINTS ====================

@geneilink_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    """Get all categories for the current user"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    try:
        categories = PostCategory.query.filter_by(
            user_id=current_user.id
        ).order_by(PostCategory.name).all()
        
        return jsonify({
            'success': True,
            'categories': [cat.to_dict() for cat in categories]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@geneilink_bp.route('/categories', methods=['POST'])
@jwt_required()
def create_category():
    """Create a new category"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()
        color = data.get('color', '#3B82F6')
        
        if not name:
            return jsonify({'success': False, 'error': 'Category name is required'}), 400
        
        if len(name) > 50:
            return jsonify({'success': False, 'error': 'Category name must be 50 characters or less'}), 400
        
        # Check if category already exists
        existing = PostCategory.query.filter_by(
            user_id=current_user.id,
            name=name
        ).first()
        
        if existing:
            return jsonify({'success': False, 'error': 'Category with this name already exists'}), 400
        
        # Create category
        category = PostCategory(
            user_id=current_user.id,
            name=name,
            description=description if description else None,
            color=color,
            is_default=False
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Category created successfully',
            'category': category.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@geneilink_bp.route('/categories/<category_id>', methods=['PUT'])
@jwt_required()
def update_category( category_id):
    """Update a category"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    try:
        category = PostCategory.query.filter_by(
            id=category_id,
            user_id=current_user.id
        ).first()
        
        if not category:
            return jsonify({'success': False, 'error': 'Category not found'}), 404
        
        data = request.get_json()
        
        if 'name' in data:
            name = data['name'].strip()
            if not name:
                return jsonify({'success': False, 'error': 'Category name cannot be empty'}), 400
            if len(name) > 50:
                return jsonify({'success': False, 'error': 'Category name must be 50 characters or less'}), 400
            category.name = name
        
        if 'description' in data:
            category.description = data['description'].strip() if data['description'] else None
        
        if 'color' in data:
            category.color = data['color']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Category updated successfully',
            'category': category.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@geneilink_bp.route('/categories/<category_id>', methods=['DELETE'])
@jwt_required()
def delete_category( category_id):
    """Delete a category"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    try:
        category = PostCategory.query.filter_by(
            id=category_id,
            user_id=current_user.id
        ).first()
        
        if not category:
            return jsonify({'success': False, 'error': 'Category not found'}), 404
        
        # Delete all assignments (posts won't be deleted, just uncategorized)
        PostCategoryAssignment.query.filter_by(category_id=category_id).delete()
        
        # Delete category
        db.session.delete(category)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Category deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@geneilink_bp.route('/posts/<post_id>/categories', methods=['POST'])
@jwt_required()
def assign_categories( post_id):
    """Assign categories to a post"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    try:
        post = AggregatedPost.query.filter_by(
            id=post_id,
            user_id=current_user.id
        ).first()
        
        if not post:
            return jsonify({'success': False, 'error': 'Post not found'}), 404
        
        data = request.get_json()
        category_ids = data.get('category_ids', [])
        
        if not category_ids:
            return jsonify({'success': False, 'error': 'No categories provided'}), 400
        
        # Verify all categories belong to the user
        categories = PostCategory.query.filter(
            PostCategory.id.in_(category_ids),
            PostCategory.user_id == current_user.id
        ).all()
        
        if len(categories) != len(category_ids):
            return jsonify({'success': False, 'error': 'One or more categories not found'}), 404
        
        # Assign categories (skip if already assigned)
        for category in categories:
            existing = PostCategoryAssignment.query.filter_by(
                post_id=post_id,
                category_id=category.id
            ).first()
            
            if not existing:
                assignment = PostCategoryAssignment(
                    post_id=post_id,
                    category_id=category.id
                )
                db.session.add(assignment)
                
                # Update category post count
                category.post_count += 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Categories assigned successfully',
            'post': post.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@geneilink_bp.route('/posts/<post_id>/categories/<category_id>', methods=['DELETE'])
@jwt_required()
def remove_category( post_id, category_id):
    """Remove a category from a post"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    try:
        post = AggregatedPost.query.filter_by(
            id=post_id,
            user_id=current_user.id
        ).first()
        
        if not post:
            return jsonify({'success': False, 'error': 'Post not found'}), 404
        
        assignment = PostCategoryAssignment.query.filter_by(
            post_id=post_id,
            category_id=category_id
        ).first()
        
        if not assignment:
            return jsonify({'success': False, 'error': 'Category assignment not found'}), 404
        
        # Update category post count
        category = PostCategory.query.get(category_id)
        if category and category.post_count > 0:
            category.post_count -= 1
        
        db.session.delete(assignment)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Category removed successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@geneilink_bp.route('/categories/<category_id>/posts', methods=['GET'])
@jwt_required()
def get_category_posts( category_id):
    """Get all posts in a category"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    try:
        category = PostCategory.query.filter_by(
            id=category_id,
            user_id=current_user.id
        ).first()
        
        if not category:
            return jsonify({'success': False, 'error': 'Category not found'}), 404
        
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        # Get posts through assignments
        pagination = AggregatedPost.query.join(PostCategoryAssignment).filter(
            PostCategoryAssignment.category_id == category_id,
            AggregatedPost.user_id == current_user.id
        ).order_by(AggregatedPost.published_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        posts = [post.to_dict() for post in pagination.items]
        
        return jsonify({
            'success': True,
            'category': category.to_dict(),
            'posts': posts,
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'total_pages': pagination.pages
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== SYNC ENDPOINTS ====================

@geneilink_bp.route('/connections/<connection_id>/sync', methods=['POST'])
@jwt_required()
def sync_connection( connection_id):
    """Manually trigger sync for a specific connection"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    try:
        connection = PlatformConnection.query.filter_by(
            id=connection_id,
            user_id=current_user.id
        ).first()
        
        if not connection:
            return jsonify({'success': False, 'error': 'Connection not found'}), 404
        
        # TODO: Implement actual platform API calls to fetch posts
        # For now, return success message
        
        connection.last_synced_at = datetime.now(timezone.utc)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Sync initiated for {connection.platform_name}',
            'last_synced_at': connection.last_synced_at.isoformat()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@geneilink_bp.route('/sync-all', methods=['POST'])
@jwt_required()
def sync_all():
    """Sync all connected platforms"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    try:
        connections = PlatformConnection.query.filter_by(
            user_id=current_user.id,
            is_active=True
        ).all()
        
        if not connections:
            return jsonify({'success': False, 'error': 'No platforms connected'}), 400
        
        # TODO: Implement actual platform API calls to fetch posts
        # For now, update last_synced_at for all connections
        
        for connection in connections:
            connection.last_synced_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Sync initiated for {len(connections)} platform(s)',
            'synced_platforms': [conn.platform_name for conn in connections]
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
