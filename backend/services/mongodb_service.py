"""MongoDB Service for LinkoGenei - Handles saved posts storage"""

from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, DuplicateKeyError
from datetime import datetime
from typing import Dict, List, Any, Optional
import os
import logging

logger = logging.getLogger(__name__)

class MongoDBService:
    """Service for managing saved posts in MongoDB"""
    
    def __init__(self):
        self.client = None
        self.db = None
        self.posts_collection = None
        self.categories_collection = None
        self._connect()
    
    def _connect(self):
        """Connect to MongoDB"""
        try:
            # Get MongoDB URI from environment
            mongo_uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/')
            db_name = os.environ.get('MONGODB_DB_NAME', 'linkogenei')
            
            # Connect to MongoDB
            self.client = MongoClient(
                mongo_uri,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=10000
            )
            
            # Test connection
            self.client.admin.command('ping')
            
            # Get database and collections
            self.db = self.client[db_name]
            self.posts_collection = self.db['saved_posts']
            self.categories_collection = self.db['categories']
            
            # Create indexes
            self._create_indexes()
            
            logger.info(f"Connected to MongoDB: {db_name}")
            
        except ConnectionFailure as e:
            logger.warning(f"MongoDB not available: {str(e)}")
            logger.warning("LinkoGenei features will be limited without MongoDB")
        except Exception as e:
            logger.warning(f"MongoDB connection error: {str(e)}")
            logger.warning("LinkoGenei features will be limited without MongoDB")
    
    def _create_indexes(self):
        """Create database indexes for better performance"""
        try:
            # Index on user_id and created_at for fast queries
            self.posts_collection.create_index([
                ('user_id', ASCENDING),
                ('created_at', DESCENDING)
            ])
            
            # Index on URL to prevent duplicates
            self.posts_collection.create_index([
                ('user_id', ASCENDING),
                ('url', ASCENDING)
            ], unique=True)
            
            # Index on category for filtering
            self.posts_collection.create_index([
                ('user_id', ASCENDING),
                ('category', ASCENDING)
            ])
            
            # Index on platform
            self.posts_collection.create_index([
                ('user_id', ASCENDING),
                ('platform', ASCENDING)
            ])
            
            # Categories collection indexes
            self.categories_collection.create_index([
                ('user_id', ASCENDING),
                ('name', ASCENDING)
            ], unique=True)
            
            logger.info("MongoDB indexes created successfully")
            
        except Exception as e:
            logger.warning(f"Failed to create indexes: {str(e)}")
    
    def save_post(self, user_id: str, post_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Save a post to the database
        
        Args:
            user_id: User ID
            post_data: Post data (url, platform, title, etc.)
            
        Returns:
            Saved post document
        """
        try:
            # Prepare document
            document = {
                'user_id': user_id,
                'url': post_data['url'],
                'platform': post_data.get('platform', 'Unknown'),
                'title': post_data.get('title', ''),
                'image_url': post_data.get('image_url', ''),
                'category': post_data.get('category', 'Uncategorized'),
                'notes': post_data.get('notes', ''),
                'tags': post_data.get('tags', []),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            # Insert document
            result = self.posts_collection.insert_one(document)
            document['_id'] = str(result.inserted_id)
            
            # Update category count
            self._update_category_count(user_id, document['category'])
            
            logger.info(f"Post saved: {document['url']} for user {user_id}")
            
            return {
                'success': True,
                'post_id': str(result.inserted_id),
                'post': self._serialize_post(document)
            }
            
        except DuplicateKeyError:
            logger.warning(f"Duplicate post: {post_data['url']} for user {user_id}")
            return {
                'success': False,
                'error': 'This post has already been saved'
            }
        except Exception as e:
            logger.error(f"Failed to save post: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_posts(
        self, 
        user_id: str, 
        category: Optional[str] = None,
        platform: Optional[str] = None,
        limit: int = 50,
        skip: int = 0
    ) -> Dict[str, Any]:
        """
        Get saved posts for a user
        
        Args:
            user_id: User ID
            category: Filter by category (optional)
            platform: Filter by platform (optional)
            limit: Maximum number of posts to return
            skip: Number of posts to skip (for pagination)
            
        Returns:
            List of posts
        """
        try:
            # Build query
            query = {'user_id': user_id}
            
            if category and category != 'all':
                query['category'] = category
            
            if platform and platform != 'all':
                query['platform'] = platform
            
            # Get posts
            cursor = self.posts_collection.find(query).sort('created_at', DESCENDING).skip(skip).limit(limit)
            posts = [self._serialize_post(post) for post in cursor]
            
            # Get total count
            total = self.posts_collection.count_documents(query)
            
            return {
                'success': True,
                'posts': posts,
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
    
    def get_post_by_id(self, user_id: str, post_id: str) -> Optional[Dict[str, Any]]:
        """Get a single post by ID"""
        try:
            from bson.objectid import ObjectId
            
            post = self.posts_collection.find_one({
                '_id': ObjectId(post_id),
                'user_id': user_id
            })
            
            if post:
                return self._serialize_post(post)
            return None
            
        except Exception as e:
            logger.error(f"Failed to get post: {str(e)}")
            return None
    
    def update_post(self, user_id: str, post_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a post"""
        try:
            from bson.objectid import ObjectId
            
            # Prepare update
            update = {
                '$set': {
                    **update_data,
                    'updated_at': datetime.utcnow()
                }
            }
            
            # Update document
            result = self.posts_collection.update_one(
                {'_id': ObjectId(post_id), 'user_id': user_id},
                update
            )
            
            if result.modified_count > 0:
                # If category changed, update counts
                if 'category' in update_data:
                    post = self.get_post_by_id(user_id, post_id)
                    if post:
                        self._update_category_count(user_id, update_data['category'])
                
                return {'success': True, 'message': 'Post updated successfully'}
            else:
                return {'success': False, 'error': 'Post not found or no changes made'}
                
        except Exception as e:
            logger.error(f"Failed to update post: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def delete_post(self, user_id: str, post_id: str) -> Dict[str, Any]:
        """Delete a post"""
        try:
            from bson.objectid import ObjectId
            
            # Get post before deleting to update category count
            post = self.get_post_by_id(user_id, post_id)
            
            # Delete document
            result = self.posts_collection.delete_one({
                '_id': ObjectId(post_id),
                'user_id': user_id
            })
            
            if result.deleted_count > 0:
                # Update category count
                if post:
                    self._decrement_category_count(user_id, post['category'])
                
                return {'success': True, 'message': 'Post deleted successfully'}
            else:
                return {'success': False, 'error': 'Post not found'}
                
        except Exception as e:
            logger.error(f"Failed to delete post: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_categories(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all categories for a user"""
        try:
            categories = list(self.categories_collection.find({'user_id': user_id}).sort('name', ASCENDING))
            return [self._serialize_category(cat) for cat in categories]
        except Exception as e:
            logger.error(f"Failed to get categories: {str(e)}")
            return []
    
    def create_category(self, user_id: str, name: str, color: str = '#667eea') -> Dict[str, Any]:
        """Create a new category"""
        try:
            document = {
                'user_id': user_id,
                'name': name,
                'color': color,
                'post_count': 0,
                'created_at': datetime.utcnow()
            }
            
            result = self.categories_collection.insert_one(document)
            document['_id'] = str(result.inserted_id)
            
            return {
                'success': True,
                'category': self._serialize_category(document)
            }
            
        except DuplicateKeyError:
            return {'success': False, 'error': 'Category already exists'}
        except Exception as e:
            logger.error(f"Failed to create category: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_stats(self, user_id: str) -> Dict[str, Any]:
        """Get statistics for a user"""
        try:
            total_posts = self.posts_collection.count_documents({'user_id': user_id})
            
            # Get posts by platform
            platform_pipeline = [
                {'$match': {'user_id': user_id}},
                {'$group': {'_id': '$platform', 'count': {'$sum': 1}}}
            ]
            platforms = list(self.posts_collection.aggregate(platform_pipeline))
            
            # Get posts by category
            category_pipeline = [
                {'$match': {'user_id': user_id}},
                {'$group': {'_id': '$category', 'count': {'$sum': 1}}}
            ]
            categories = list(self.posts_collection.aggregate(category_pipeline))
            
            return {
                'success': True,
                'stats': {
                    'total_posts': total_posts,
                    'total_categories': len(categories),
                    'platforms': {p['_id']: p['count'] for p in platforms},
                    'categories': {c['_id']: c['count'] for c in categories}
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get stats: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'stats': {}
            }
    
    def _update_category_count(self, user_id: str, category: str):
        """Update post count for a category"""
        try:
            self.categories_collection.update_one(
                {'user_id': user_id, 'name': category},
                {
                    '$inc': {'post_count': 1},
                    '$setOnInsert': {
                        'user_id': user_id,
                        'name': category,
                        'color': '#667eea',
                        'created_at': datetime.utcnow()
                    }
                },
                upsert=True
            )
        except Exception as e:
            logger.warning(f"Failed to update category count: {str(e)}")
    
    def _decrement_category_count(self, user_id: str, category: str):
        """Decrement post count for a category"""
        try:
            self.categories_collection.update_one(
                {'user_id': user_id, 'name': category},
                {'$inc': {'post_count': -1}}
            )
        except Exception as e:
            logger.warning(f"Failed to decrement category count: {str(e)}")
    
    def _serialize_post(self, post: Dict) -> Dict[str, Any]:
        """Convert MongoDB document to JSON-serializable dict"""
        return {
            'id': str(post['_id']),
            'url': post['url'],
            'platform': post['platform'],
            'title': post.get('title', ''),
            'image_url': post.get('image_url', ''),
            'category': post.get('category', 'Uncategorized'),
            'notes': post.get('notes', ''),
            'tags': post.get('tags', []),
            'created_at': post['created_at'].isoformat(),
            'updated_at': post.get('updated_at', post['created_at']).isoformat()
        }
    
    def _serialize_category(self, category: Dict) -> Dict[str, Any]:
        """Convert category document to JSON-serializable dict"""
        return {
            'id': str(category['_id']),
            'name': category['name'],
            'color': category.get('color', '#667eea'),
            'post_count': category.get('post_count', 0),
            'created_at': category['created_at'].isoformat()
        }

# Global instance
mongodb_service = MongoDBService()
