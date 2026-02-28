from flask import Blueprint, request, jsonify
from models import db, User, PlatformConnection, AggregatedPost, PostCategory, PostCategoryAssignment
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone
import os
import json
from cryptography.fernet import Fernet

geneilink_bp = Blueprint('geneilink', __name__)

# Encryption key for OAuth tokens
ENCRYPTION_KEY = os.environ.get('ENCRYPTION_KEY', Fernet.generate_key())
cipher_suite = Fernet(ENCRYPTION_KEY)

def encrypt_token(token):
    """Encrypt API token"""
    return cipher_suite.encrypt(token.encode()).decode()

def decrypt_token(encrypted_token):
    """Decrypt API token"""
    return cipher_suite.decrypt(encrypted_token.encode()).decode()

# ==================== PLATFORM CONNECTION ENDPOINTS ====================

@geneilink_bp.route('/connect/<platform>', methods=['POST'])
@jwt_required()
def connect_platform(platform):
    """Connect platform using manual API token"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        # Validate platform
        valid_platforms = ['instagram', 'linkedin', 'twitter']
        if platform not in valid_platforms:
            return jsonify({'success': False, 'error': f'Invalid platform. Supported: {", ".join(valid_platforms)}'}), 400
        
        # Get data from request
        data = request.get_json()
        access_token = data.get('access_token', '').strip()
        platform_username = data.get('username', '').strip()
        
        if not access_token:
            return jsonify({'success': False, 'error': 'API token is required'}), 400
        
        if not platform_username:
            return jsonify({'success': False, 'error': 'Username is required'}), 400
        
        # Encrypt the token
        encrypted_token = encrypt_token(access_token)
        
        # Check if connection already exists
        existing = PlatformConnection.query.filter_by(
            user_id=current_user.id,
            platform_name=platform,
            platform_username=platform_username
        ).first()
        
        if existing:
            # Update existing connection
            existing.access_token = encrypted_token
            existing.is_active = True
            existing.updated_at = datetime.now(timezone.utc)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': f'{platform.capitalize()} connection updated successfully',
                'connection': existing.to_dict()
            })
        
        # Create new connection
        connection = PlatformConnection(
            user_id=current_user.id,
            platform_name=platform,
            platform_user_id=platform_username,
            platform_username=platform_username,
            platform_display_name=data.get('display_name', platform_username),
            access_token=encrypted_token,
            profile_url=data.get('profile_url', ''),
            profile_image_url=data.get('profile_image_url', ''),
            is_active=True
        )
        
        db.session.add(connection)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'{platform.capitalize()} connected successfully',
            'connection': connection.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@geneilink_bp.route('/connections', methods=['GET'])
@jwt_required()
def get_connections():
    """Get all platform connections for the current user"""
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
def disconnect_platform(connection_id):
    """Disconnect a platform connection"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
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
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
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
def get_post(post_id):
    """Get a specific post"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
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
def save_post(post_id):
    """Save a post to collection"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
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
def unsave_post(post_id):
    """Unsave a post from collection"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
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
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
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
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
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
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
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
def update_category(category_id):
    """Update a category"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
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
def delete_category(category_id):
    """Delete a category"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        category = PostCategory.query.filter_by(
            id=category_id,
            user_id=current_user.id
        ).first()
        
        if not category:
            return jsonify({'success': False, 'error': 'Category not found'}), 404
        
        # Delete all assignments
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
def assign_categories(post_id):
    """Assign categories to a post"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
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
        
        # Assign categories
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
def remove_category(post_id, category_id):
    """Remove a category from a post"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
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
def get_category_posts(category_id):
    """Get all posts in a category"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
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
def sync_connection(connection_id):
    """Manually trigger sync for a specific connection"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
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
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
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
