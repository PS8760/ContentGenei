"""LinkoGenei API Routes - Chrome Extension Backend"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from services.mongodb_service import mongodb_service
from datetime import datetime
import secrets
import logging

logger = logging.getLogger(__name__)

linkogenei_bp = Blueprint('linkogenei', __name__, url_prefix='/api/linkogenei')

# In-memory token storage (in production, use Redis or database)
extension_tokens = {}

@linkogenei_bp.route('/test', methods=['GET'])
def test():
    """Test endpoint to verify routes are working"""
    return jsonify({
        'success': True,
        'message': 'LinkoGenei API is working!'
    }), 200

@linkogenei_bp.route('/generate-token', methods=['POST'])
@jwt_required()
def generate_token():
    """Generate an access token for the Chrome extension"""
    try:
        user_id = get_jwt_identity()
        
        # Generate a secure random token
        token = secrets.token_urlsafe(32)
        
        # Store token with user_id (expires in 30 days)
        extension_tokens[token] = {
            'user_id': user_id,
            'created_at': datetime.utcnow().isoformat()
        }
        
        logger.info(f"Generated extension token for user: {user_id}")
        
        return jsonify({
            'success': True,
            'token': token,
            'message': 'Token generated successfully. Copy this token to your Chrome extension.'
        }), 200
        
    except Exception as e:
        logger.error(f"Token generation error: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': f'Failed to generate token: {str(e)}'
        }), 500

@linkogenei_bp.route('/verify-token', methods=['POST'])
def verify_token():
    """Verify extension token"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Invalid authorization header'
            }), 401
        
        token = auth_header.split(' ')[1]
        
        # Check if token exists
        if token not in extension_tokens:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
        user_data = extension_tokens[token]
        
        return jsonify({
            'success': True,
            'user_id': user_data['user_id'],
            'message': 'Token verified successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Token verification failed'
        }), 500

@linkogenei_bp.route('/save-post', methods=['POST'])
def save_post():
    """Save a post from social media"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Unauthorized'
            }), 401
        
        token = auth_header.split(' ')[1]
        
        # Verify token
        if token not in extension_tokens:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
        user_id = extension_tokens[token]['user_id']
        
        # Get post data
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({
                'success': False,
                'error': 'URL is required'
            }), 400
        
        # Save post to MongoDB
        result = mongodb_service.save_post(user_id, data)
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Save post error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to save post'
        }), 500

@linkogenei_bp.route('/posts', methods=['GET'])
def get_posts():
    """Get saved posts"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Unauthorized'
            }), 401
        
        token = auth_header.split(' ')[1]
        
        # Verify token
        if token not in extension_tokens:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
        user_id = extension_tokens[token]['user_id']
        
        # Get query parameters
        category = request.args.get('category')
        platform = request.args.get('platform')
        limit = int(request.args.get('limit', 50))
        skip = int(request.args.get('skip', 0))
        
        # Get posts from MongoDB
        result = mongodb_service.get_posts(
            user_id=user_id,
            category=category,
            platform=platform,
            limit=limit,
            skip=skip
        )
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Get posts error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get posts'
        }), 500

@linkogenei_bp.route('/posts/<post_id>', methods=['GET'])
def get_post(post_id):
    """Get a single post"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Unauthorized'
            }), 401
        
        token = auth_header.split(' ')[1]
        
        # Verify token
        if token not in extension_tokens:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
        user_id = extension_tokens[token]['user_id']
        
        # Get post from MongoDB
        post = mongodb_service.get_post_by_id(user_id, post_id)
        
        if post:
            return jsonify({
                'success': True,
                'post': post
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Post not found'
            }), 404
            
    except Exception as e:
        logger.error(f"Get post error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get post'
        }), 500

@linkogenei_bp.route('/posts/<post_id>', methods=['PUT'])
def update_post(post_id):
    """Update a post (category, notes, tags)"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Unauthorized'
            }), 401
        
        token = auth_header.split(' ')[1]
        
        # Verify token
        if token not in extension_tokens:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
        user_id = extension_tokens[token]['user_id']
        
        # Get update data
        data = request.get_json()
        
        # Update post in MongoDB
        result = mongodb_service.update_post(user_id, post_id, data)
        
        return jsonify(result), 200 if result['success'] else 400
        
    except Exception as e:
        logger.error(f"Update post error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to update post'
        }), 500

@linkogenei_bp.route('/posts/<post_id>', methods=['DELETE'])
def delete_post(post_id):
    """Delete a post"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Unauthorized'
            }), 401
        
        token = auth_header.split(' ')[1]
        
        # Verify token
        if token not in extension_tokens:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
        user_id = extension_tokens[token]['user_id']
        
        # Delete post from MongoDB
        result = mongodb_service.delete_post(user_id, post_id)
        
        return jsonify(result), 200 if result['success'] else 404
        
    except Exception as e:
        logger.error(f"Delete post error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to delete post'
        }), 500

@linkogenei_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all categories"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Unauthorized'
            }), 401
        
        token = auth_header.split(' ')[1]
        
        # Verify token
        if token not in extension_tokens:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
        user_id = extension_tokens[token]['user_id']
        
        # Get categories from MongoDB
        categories = mongodb_service.get_categories(user_id)
        
        return jsonify({
            'success': True,
            'categories': categories
        }), 200
        
    except Exception as e:
        logger.error(f"Get categories error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get categories'
        }), 500

@linkogenei_bp.route('/categories', methods=['POST'])
def create_category():
    """Create a new category"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Unauthorized'
            }), 401
        
        token = auth_header.split(' ')[1]
        
        # Verify token
        if token not in extension_tokens:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
        user_id = extension_tokens[token]['user_id']
        
        # Get category data
        data = request.get_json()
        
        if not data or 'name' not in data:
            return jsonify({
                'success': False,
                'error': 'Category name is required'
            }), 400
        
        # Create category in MongoDB
        result = mongodb_service.create_category(
            user_id=user_id,
            name=data['name'],
            color=data.get('color', '#667eea')
        )
        
        return jsonify(result), 201 if result['success'] else 400
        
    except Exception as e:
        logger.error(f"Create category error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to create category'
        }), 500

@linkogenei_bp.route('/stats', methods=['GET'])
def get_stats():
    """Get user statistics"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Unauthorized'
            }), 401
        
        token = auth_header.split(' ')[1]
        
        # Verify token
        if token not in extension_tokens:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
        user_id = extension_tokens[token]['user_id']
        
        # Get stats from MongoDB
        result = mongodb_service.get_stats(user_id)
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Get stats error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get stats'
        }), 500
