"""LinkoGenei API Routes - Chrome Extension Backend"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from services.mongodb_service import mongodb_service
from datetime import datetime, timedelta
import secrets
import logging

logger = logging.getLogger(__name__)

linkogenei_bp = Blueprint('linkogenei', __name__, url_prefix='/api/linkogenei')

# Helper function to verify token from MongoDB
def verify_extension_token(token):
    """Verify token exists in MongoDB and return user_id"""
    try:
        result = mongodb_service.verify_extension_token(token)
        if result and result.get('success'):
            return result.get('user_id')
        return None
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}")
        return None

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
    """Generate an access token for the Chrome extension
    
    Note: Generating a new token does NOT delete your saved posts.
    All your previously saved posts will remain accessible with the new token.
    """
    try:
        user_id = get_jwt_identity()
        
        # Generate a secure random token
        token = secrets.token_urlsafe(32)
        
        # Store token in MongoDB (expires in 30 days)
        expires_at = datetime.utcnow() + timedelta(days=30)
        mongodb_service.store_extension_token(user_id, token, expires_at)
        
        logger.info(f"Generated extension token for user: {user_id}")
        
        # Get existing post count to inform user
        stats = mongodb_service.get_stats(user_id)
        post_count = stats.get('stats', {}).get('total_posts', 0)
        
        message = 'Token generated successfully. Copy this token to your Chrome extension.'
        if post_count > 0:
            message += f' Your {post_count} saved post(s) are still available.'
        
        return jsonify({
            'success': True,
            'token': token,
            'message': message,
            'existing_posts': post_count
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
        
        # Verify token from MongoDB
        user_id = verify_extension_token(token)
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
        return jsonify({
            'success': True,
            'user_id': user_id,
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
        logger.info('POST /save-post - Request received')
        
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            logger.warning('No authorization header')
            return jsonify({
                'success': False,
                'error': 'Unauthorized'
            }), 401
        
        token = auth_header.split(' ')[1]
        logger.info(f'Token: {token[:10]}...')
        
        # Verify token from MongoDB
        user_id = verify_extension_token(token)
        logger.info(f'User ID from token: {user_id}')
        
        if not user_id:
            logger.warning('Token verification failed')
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
        # Get post data
        data = request.get_json()
        logger.info(f'Post data: {data}')
        
        if not data or 'url' not in data:
            logger.warning('No URL in request')
            return jsonify({
                'success': False,
                'error': 'URL is required'
            }), 400
        
        # Save post to MongoDB
        result = mongodb_service.save_post(user_id, data)
        logger.info(f'Save result: {result}')
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Save post error: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': 'Failed to save post'
        }), 500

@linkogenei_bp.route('/posts', methods=['GET'])
def get_posts():
    """Get saved posts"""
    try:
        logger.info('GET /posts - Request received')
        
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        logger.info(f'Authorization header: {auth_header[:20]}...' if auth_header else 'No auth header')
        
        if not auth_header.startswith('Bearer '):
            logger.warning('Invalid authorization header format')
            return jsonify({
                'success': False,
                'error': 'Unauthorized'
            }), 401
        
        token = auth_header.split(' ')[1]
        logger.info(f'Token extracted: {token[:10]}...')
        
        # Verify token from MongoDB
        user_id = verify_extension_token(token)
        logger.info(f'Token verification result: user_id={user_id}')
        
        if not user_id:
            logger.warning('Token verification failed')
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
        # Get query parameters
        category = request.args.get('category')
        platform = request.args.get('platform')
        limit = int(request.args.get('limit', 50))
        skip = int(request.args.get('skip', 0))
        
        logger.info(f'Query params: category={category}, platform={platform}, limit={limit}, skip={skip}')
        
        # Get posts from MongoDB
        result = mongodb_service.get_posts(
            user_id=user_id,
            category=category,
            platform=platform,
            limit=limit,
            skip=skip
        )
        
        logger.info(f'Posts retrieved: {len(result.get("posts", []))} posts')
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Get posts error: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
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
        
        # Verify token from MongoDB
        user_id = verify_extension_token(token)
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
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
        
        # Verify token from MongoDB
        user_id = verify_extension_token(token)
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
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
        
        # Verify token from MongoDB
        user_id = verify_extension_token(token)
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
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
        
        # Verify token from MongoDB
        user_id = verify_extension_token(token)
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
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
        
        # Verify token from MongoDB
        user_id = verify_extension_token(token)
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
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
        
        # Verify token from MongoDB
        user_id = verify_extension_token(token)
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
        # Get stats from MongoDB
        result = mongodb_service.get_stats(user_id)
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Get stats error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get stats'
        }), 500
