"""LinkoGenei Service - SQLite-based storage for saved posts"""

from models import db, ExtensionToken, SavedPost, SavedPostCategory
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
import json
import logging

logger = logging.getLogger(__name__)

class LinkoGeneiService:
    """Service for managing LinkoGenei extension data"""
    
    @staticmethod
    def store_extension_token(user_id: str, token: str, expires_at: datetime) -> Dict[str, Any]:
        """Store extension token"""
        try:
            # Check if token already exists
            existing = ExtensionToken.query.filter_by(token=token).first()
            
            if existing:
                # Update existing token
                existing.user_id = user_id
                existing.expires_at = expires_at
            else:
                # Create new token
                new_token = ExtensionToken(
                    user_id=user_id,
                    token=token,
                    expires_at=expires_at
                )
                db.session.add(new_token)
            
            db.session.commit()
            return {'success': True, 'message': 'Token stored successfully'}
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to store token: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def verify_extension_token(token: str) -> Dict[str, Any]:
        """Verify extension token and return user_id if valid"""
        try:
            token_obj = ExtensionToken.query.filter_by(token=token).first()
            
            if not token_obj:
                return {'success': False, 'error': 'Token not found'}
            
            # Check if expired
            if token_obj.expires_at < datetime.now(timezone.utc):
                return {'success': False, 'error': 'Token expired'}
            
            return {
                'success': True,
                'user_id': token_obj.user_id
            }
            
        except Exception as e:
            logger.error(f"Failed to verify token: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def save_post(user_id: str, post_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save a post"""
        try:
            # Check if post already exists
            existing = SavedPost.query.filter_by(
                user_id=user_id,
                url=post_data['url']
            ).first()
            
            if existing:
                return {
                    'success': False,
                    'error': 'This post has already been saved'
                }
            
            # Create new post
            post = SavedPost(
                user_id=user_id,
                url=post_data['url'],
                platform=post_data.get('platform', 'Unknown'),
                title=post_data.get('title', ''),
                image_url=post_data.get('image_url', ''),
                category=post_data.get('category', 'Uncategorized'),
                notes=post_data.get('notes', ''),
                tags=json.dumps(post_data.get('tags', []))
            )
            
            db.session.add(post)
            db.session.commit()
            
            # Update category count
            LinkoGeneiService._update_category_count(user_id, post.category)
            
            return {
                'success': True,
                'post_id': post.id,
                'post': post.to_dict()
            }
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to save post: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def get_posts(
        user_id: str,
        category: Optional[str] = None,
        platform: Optional[str] = None,
        limit: int = 50,
        skip: int = 0
    ) -> Dict[str, Any]:
        """Get saved posts"""
        try:
            query = SavedPost.query.filter_by(user_id=user_id)
            
            if category and category != 'all':
                query = query.filter_by(category=category)
            
            if platform and platform != 'all':
                query = query.filter_by(platform=platform)
            
            # Get total count
            total = query.count()
            
            # Get posts with pagination
            posts = query.order_by(SavedPost.created_at.desc()).offset(skip).limit(limit).all()
            
            return {
                'success': True,
                'posts': [post.to_dict() for post in posts],
                'total': total,
                'limit': limit,
                'skip': skip
            }
            
        except Exception as e:
            logger.error(f"Failed to get posts: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'posts': []
            }
    
    @staticmethod
    def get_post_by_id(user_id: str, post_id: str) -> Optional[Dict[str, Any]]:
        """Get a single post by ID"""
        try:
            post = SavedPost.query.filter_by(id=post_id, user_id=user_id).first()
            return post.to_dict() if post else None
        except Exception as e:
            logger.error(f"Failed to get post: {str(e)}")
            return None
    
    @staticmethod
    def update_post(user_id: str, post_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a post"""
        try:
            post = SavedPost.query.filter_by(id=post_id, user_id=user_id).first()
            
            if not post:
                return {'success': False, 'error': 'Post not found'}
            
            # Track old category for count update
            old_category = post.category
            
            # Update fields
            if 'category' in update_data:
                post.category = update_data['category']
            if 'notes' in update_data:
                post.notes = update_data['notes']
            if 'tags' in update_data:
                post.tags = json.dumps(update_data['tags'])
            if 'title' in update_data:
                post.title = update_data['title']
            
            post.updated_at = datetime.now(timezone.utc)
            
            db.session.commit()
            
            # Update category counts if category changed
            if 'category' in update_data and old_category != update_data['category']:
                LinkoGeneiService._decrement_category_count(user_id, old_category)
                LinkoGeneiService._update_category_count(user_id, update_data['category'])
            
            return {'success': True, 'message': 'Post updated successfully'}
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to update post: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def delete_post(user_id: str, post_id: str) -> Dict[str, Any]:
        """Delete a post"""
        try:
            post = SavedPost.query.filter_by(id=post_id, user_id=user_id).first()
            
            if not post:
                return {'success': False, 'error': 'Post not found'}
            
            category = post.category
            
            db.session.delete(post)
            db.session.commit()
            
            # Update category count
            LinkoGeneiService._decrement_category_count(user_id, category)
            
            return {'success': True, 'message': 'Post deleted successfully'}
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to delete post: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def get_categories(user_id: str) -> List[Dict[str, Any]]:
        """Get all categories"""
        try:
            categories = SavedPostCategory.query.filter_by(user_id=user_id).order_by(SavedPostCategory.name).all()
            return [cat.to_dict() for cat in categories]
        except Exception as e:
            logger.error(f"Failed to get categories: {str(e)}")
            return []
    
    @staticmethod
    def create_category(user_id: str, name: str, color: str = '#667eea') -> Dict[str, Any]:
        """Create a new category"""
        try:
            # Check if category exists
            existing = SavedPostCategory.query.filter_by(user_id=user_id, name=name).first()
            
            if existing:
                return {'success': False, 'error': 'Category already exists'}
            
            category = SavedPostCategory(
                user_id=user_id,
                name=name,
                color=color
            )
            
            db.session.add(category)
            db.session.commit()
            
            return {
                'success': True,
                'category': category.to_dict()
            }
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to create category: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def get_stats(user_id: str) -> Dict[str, Any]:
        """Get statistics"""
        try:
            total_posts = SavedPost.query.filter_by(user_id=user_id).count()
            
            # Get posts by platform
            platforms = db.session.query(
                SavedPost.platform,
                db.func.count(SavedPost.id)
            ).filter_by(user_id=user_id).group_by(SavedPost.platform).all()
            
            # Get posts by category
            categories = db.session.query(
                SavedPost.category,
                db.func.count(SavedPost.id)
            ).filter_by(user_id=user_id).group_by(SavedPost.category).all()
            
            return {
                'success': True,
                'stats': {
                    'total_posts': total_posts,
                    'total_categories': len(categories),
                    'platforms': {p[0]: p[1] for p in platforms},
                    'categories': {c[0]: c[1] for c in categories}
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get stats: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'stats': {}
            }
    
    @staticmethod
    def _update_category_count(user_id: str, category_name: str):
        """Update post count for a category"""
        try:
            category = SavedPostCategory.query.filter_by(user_id=user_id, name=category_name).first()
            
            if category:
                category.post_count += 1
            else:
                # Create category if it doesn't exist
                category = SavedPostCategory(
                    user_id=user_id,
                    name=category_name,
                    color='#667eea',
                    post_count=1
                )
                db.session.add(category)
            
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to update category count: {str(e)}")
    
    @staticmethod
    def _decrement_category_count(user_id: str, category_name: str):
        """Decrement post count for a category"""
        try:
            category = SavedPostCategory.query.filter_by(user_id=user_id, name=category_name).first()
            
            if category and category.post_count > 0:
                category.post_count -= 1
                db.session.commit()
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to decrement category count: {str(e)}")

# Create singleton instance
linkogenei_service = LinkoGeneiService()
