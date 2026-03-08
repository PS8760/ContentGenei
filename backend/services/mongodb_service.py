"""MongoDB Service for LinkoGenei - Handles saved posts storage"""

from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, DuplicateKeyError
from datetime import datetime
from typing import Dict, List, Any, Optional
import os
import logging

# Enable logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class MockCollection:
    """Mock collection for when MongoDB is unavailable"""
    def __init__(self, name):
        self.name = name
        self._counter = 0
        self._data = {}  # Store data in memory
    
    def insert_one(self, document):
        from bson.objectid import ObjectId
        self._counter += 1
        doc_id = ObjectId()
        self._data[str(doc_id)] = {**document, '_id': doc_id}
        class MockResult:
            inserted_id = doc_id
        return MockResult()
    
    def find_one(self, query):
        # Simple query matching for token verification
        if 'token' in query:
            for doc in self._data.values():
                if doc.get('token') == query['token']:
                    return doc
        if '_id' in query:
            return self._data.get(str(query['_id']))
        return None
    
    def find(self, query=None):
        """Return a MockCursor that supports chaining"""
        if query is None:
            results = list(self._data.values())
        else:
            # Simple filtering
            results = []
            for doc in self._data.values():
                match = True
                for key, value in query.items():
                    if doc.get(key) != value:
                        match = False
                        break
                if match:
                    results.append(doc)
        return MockCursor(results)
    
    def update_one(self, query, update, upsert=False):
        # Find document
        doc = self.find_one(query)
        if doc:
            # Update existing
            if '$set' in update:
                doc.update(update['$set'])
            if '$inc' in update:
                for key, value in update['$inc'].items():
                    doc[key] = doc.get(key, 0) + value
            class MockResult:
                modified_count = 1
            return MockResult()
        elif upsert:
            # Insert new
            new_doc = {}
            if '$set' in update:
                new_doc.update(update['$set'])
            if '$setOnInsert' in update:
                new_doc.update(update['$setOnInsert'])
            self.insert_one(new_doc)
            class MockResult:
                modified_count = 1
            return MockResult()
        else:
            class MockResult:
                modified_count = 0
            return MockResult()
    
    def delete_one(self, query):
        doc = self.find_one(query)
        if doc:
            del self._data[str(doc['_id'])]
            class MockResult:
                deleted_count = 1
            return MockResult()
        class MockResult:
            deleted_count = 0
        return MockResult()
    
    def delete_many(self, query):
        docs = list(self.find(query))
        count = 0
        for doc in docs:
            del self._data[str(doc['_id'])]
            count += 1
        class MockResult:
            deleted_count = count
        return MockResult()
    
    def count_documents(self, query):
        return len(list(self.find(query)))
    
    def create_index(self, *args, **kwargs):
        pass
    
    def aggregate(self, pipeline):
        return []


class MockCursor:
    """Mock cursor that supports MongoDB cursor methods"""
    def __init__(self, results):
        self._results = results
        self._sort_key = None
        self._sort_direction = None
        self._skip_count = 0
        self._limit_count = None
    
    def sort(self, key, direction=1):
        """Sort results by key and direction"""
        self._sort_key = key
        self._sort_direction = direction
        return self
    
    def skip(self, count):
        """Skip first N results"""
        self._skip_count = count
        return self
    
    def limit(self, count):
        """Limit results to N items"""
        self._limit_count = count
        return self
    
    def __iter__(self):
        """Make cursor iterable"""
        results = self._results.copy()
        
        # Apply sorting
        if self._sort_key:
            reverse = (self._sort_direction == -1)
            try:
                results.sort(key=lambda x: x.get(self._sort_key, ''), reverse=reverse)
            except Exception:
                pass  # If sorting fails, return unsorted
        
        # Apply skip
        if self._skip_count:
            results = results[self._skip_count:]
        
        # Apply limit
        if self._limit_count:
            results = results[:self._limit_count]
        
        return iter(results)

class MockDatabase:
    """Mock database for when MongoDB is unavailable"""
    def __init__(self):
        self._collections = {}
    
    def __getitem__(self, name):
        if name not in self._collections:
            self._collections[name] = MockCollection(name)
        return self._collections[name]

class MongoDBService:
    """Service for managing saved posts in MongoDB"""
    
    def __init__(self):
        self.client = None
        self.db = None
        self.posts_collection = None
        self.categories_collection = None
        self.chat_conversations_collection = None
        self.chat_messages_collection = None
        self.notifications_collection = None
        self._connect()
    
    def _connect(self):
        """Connect to MongoDB with logging"""
        try:
            mongo_uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/')
            db_name = os.environ.get('MONGODB_DB_NAME', 'linkogenei')
            
            logger.info(f'Connecting to MongoDB: {db_name}...')
            
            self.client = MongoClient(
                mongo_uri,
                serverSelectionTimeoutMS=3000,
                connectTimeoutMS=3000,
                socketTimeoutMS=3000
            )
            
            self.client.admin.command('ping')
            
            self.db = self.client[db_name]
            self.posts_collection = self.db['saved_posts']
            self.categories_collection = self.db['categories']
            self.chat_conversations_collection = self.db['chat_conversations']
            self.chat_messages_collection = self.db['chat_messages']
            self.notifications_collection = self.db['notifications']
            
            self._create_indexes()
            
            logger.info('✅ MongoDB connected successfully')
            
        except Exception as e:
            logger.warning(f'⚠️ MongoDB unavailable: {str(e)}')
            logger.info('Using in-memory mock database (data will not persist)')
            
            # Use mock database
            self.db = MockDatabase()
            self.posts_collection = self.db['saved_posts']
            self.categories_collection = self.db['categories']
            self.chat_conversations_collection = self.db['chat_conversations']
            self.chat_messages_collection = self.db['chat_messages']
            self.notifications_collection = self.db['notifications']
    
    def _create_indexes(self):
        """Create database indexes with logging"""
        try:
            logger.info('Creating MongoDB indexes...')
            
            self.posts_collection.create_index([
                ('user_id', ASCENDING),
                ('created_at', DESCENDING)
            ])
            
            self.posts_collection.create_index([
                ('user_id', ASCENDING),
                ('url', ASCENDING)
            ], unique=True)
            
            self.posts_collection.create_index([
                ('user_id', ASCENDING),
                ('category', ASCENDING)
            ])
            
            self.posts_collection.create_index([
                ('user_id', ASCENDING),
                ('platform', ASCENDING)
            ])
            
            self.categories_collection.create_index([
                ('user_id', ASCENDING),
                ('name', ASCENDING)
            ], unique=True)
            
            self.chat_conversations_collection.create_index([
                ('user_id', ASCENDING),
                ('updated_at', DESCENDING)
            ])
            
            self.chat_messages_collection.create_index([
                ('conversation_id', ASCENDING),
                ('created_at', ASCENDING)
            ])
            self.chat_messages_collection.create_index([
                ('user_id', ASCENDING)
            ])
            
            self.notifications_collection.create_index([
                ('user_id', ASCENDING),
                ('created_at', DESCENDING)
            ])
            self.notifications_collection.create_index([
                ('user_id', ASCENDING),
                ('read', ASCENDING)
            ])
            
            logger.info('✅ MongoDB indexes created')
            
        except Exception as e:
            logger.warning(f'⚠️ Failed to create indexes: {str(e)}')
    
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
            logger.info(f'Saving post for user {user_id}: {post_data.get("url")}')
            
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
            
            logger.info(f'Document prepared: {document}')
            
            # Insert document
            result = self.posts_collection.insert_one(document)
            document['_id'] = str(result.inserted_id)
            
            logger.info(f'Post inserted with ID: {result.inserted_id}')
            
            # Update category count
            self._update_category_count(user_id, document['category'])
            
            logger.info(f'✅ Post saved successfully: {post_data.get("url")}')
            
            return {
                'success': True,
                'post_id': str(result.inserted_id),
                'post': self._serialize_post(document)
            }
            
        except DuplicateKeyError:
            logger.warning(f'Duplicate post: {post_data.get("url")}')
            return {
                'success': False,
                'error': 'This post has already been saved'
            }
        except Exception as e:
            logger.error(f"Failed to save post: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
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
            logger.info(f'Getting posts for user {user_id}: category={category}, platform={platform}')
            
            # Build query
            query = {'user_id': user_id}
            
            if category and category != 'all':
                query['category'] = category
            
            if platform and platform != 'all':
                query['platform'] = platform
            
            logger.info(f'Query: {query}')
            
            # Get posts
            cursor = self.posts_collection.find(query).sort('created_at', DESCENDING).skip(skip).limit(limit)
            posts = [self._serialize_post(post) for post in cursor]
            
            logger.info(f'Found {len(posts)} posts')
            
            # Get total count
            total = self.posts_collection.count_documents(query)
            
            logger.info(f'Total posts in DB: {total}')
            
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
        except Exception:
            pass
    
    def _decrement_category_count(self, user_id: str, category: str):
        """Decrement post count for a category"""
        try:
            self.categories_collection.update_one(
                {'user_id': user_id, 'name': category},
                {'$inc': {'post_count': -1}}
            )
        except Exception:
            pass
    
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
    
    # ==================== CHAT METHODS ====================
    
    def get_chat_conversations(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all chat conversations for a user"""
        try:
            conversations = list(
                self.chat_conversations_collection.find({'user_id': user_id})
                .sort('updated_at', DESCENDING)
            )
            return [self._serialize_conversation(conv) for conv in conversations]
        except Exception as e:
            logger.error(f"Failed to get chat conversations: {str(e)}")
            return []
    
    def get_chat_messages(self, user_id: str, conversation_id: str) -> List[Dict[str, Any]]:
        """Get messages for a specific conversation"""
        try:
            from bson.objectid import ObjectId
            
            messages = list(
                self.chat_messages_collection.find({
                    'user_id': user_id,
                    'conversation_id': ObjectId(conversation_id)
                }).sort('created_at', ASCENDING)
            )
            return [self._serialize_message(msg) for msg in messages]
        except Exception as e:
            logger.error(f"Failed to get chat messages: {str(e)}")
            return []
    
    def create_chat_conversation(self, user_id: str, title: str) -> Dict[str, Any]:
        """Create a new chat conversation"""
        try:
            document = {
                'user_id': user_id,
                'title': title,
                'message_count': 0,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            result = self.chat_conversations_collection.insert_one(document)
            document['_id'] = result.inserted_id
            
            return {
                'success': True,
                'conversation': self._serialize_conversation(document)
            }
        except Exception as e:
            logger.error(f"Failed to create conversation: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def save_chat_message(self, user_id: str, conversation_id: str, role: str, content: str) -> Dict[str, Any]:
        """Save a chat message"""
        try:
            from bson.objectid import ObjectId
            
            document = {
                'user_id': user_id,
                'conversation_id': ObjectId(conversation_id),
                'role': role,
                'content': content,
                'created_at': datetime.utcnow()
            }
            
            result = self.chat_messages_collection.insert_one(document)
            document['_id'] = result.inserted_id
            
            # Update conversation
            self.chat_conversations_collection.update_one(
                {'_id': ObjectId(conversation_id)},
                {
                    '$inc': {'message_count': 1},
                    '$set': {'updated_at': datetime.utcnow()}
                }
            )
            
            return {
                'success': True,
                'message': self._serialize_message(document)
            }
        except Exception as e:
            logger.error(f"Failed to save message: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def delete_chat_conversation(self, user_id: str, conversation_id: str) -> Dict[str, Any]:
        """Delete a conversation and its messages"""
        try:
            from bson.objectid import ObjectId
            
            # Delete messages
            self.chat_messages_collection.delete_many({
                'user_id': user_id,
                'conversation_id': ObjectId(conversation_id)
            })
            
            # Delete conversation
            result = self.chat_conversations_collection.delete_one({
                '_id': ObjectId(conversation_id),
                'user_id': user_id
            })
            
            if result.deleted_count > 0:
                return {'success': True, 'message': 'Conversation deleted'}
            return {'success': False, 'error': 'Conversation not found'}
        except Exception as e:
            logger.error(f"Failed to delete conversation: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def update_chat_conversation(self, user_id: str, conversation_id: str, title: str) -> Dict[str, Any]:
        """Update conversation title"""
        try:
            from bson.objectid import ObjectId
            
            result = self.chat_conversations_collection.update_one(
                {'_id': ObjectId(conversation_id), 'user_id': user_id},
                {'$set': {'title': title, 'updated_at': datetime.utcnow()}}
            )
            
            if result.modified_count > 0:
                return {'success': True, 'message': 'Conversation updated'}
            return {'success': False, 'error': 'Conversation not found'}
        except Exception as e:
            logger.error(f"Failed to update conversation: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _serialize_conversation(self, conversation: Dict) -> Dict[str, Any]:
        """Convert conversation document to JSON-serializable dict"""
        return {
            'id': str(conversation['_id']),
            'title': conversation['title'],
            'message_count': conversation.get('message_count', 0),
            'created_at': conversation['created_at'].isoformat(),
            'updated_at': conversation.get('updated_at', conversation['created_at']).isoformat()
        }
    
    def _serialize_message(self, message: Dict) -> Dict[str, Any]:
        """Convert message document to JSON-serializable dict"""
        return {
            'id': str(message['_id']),
            'conversation_id': str(message['conversation_id']),
            'role': message['role'],
            'content': message['content'],
            'created_at': message['created_at'].isoformat()
        }
    
    # ==================== NOTIFICATION METHODS ====================
    
    def get_notifications(self, user_id: str, unread_only: bool = False, limit: int = 50) -> List[Dict[str, Any]]:
        """Get notifications for a user"""
        try:
            query = {'user_id': user_id}
            if unread_only:
                query['read'] = False
            
            notifications = list(
                self.notifications_collection.find(query)
                .sort('created_at', DESCENDING)
                .limit(limit)
            )
            return [self._serialize_notification(notif) for notif in notifications]
        except Exception as e:
            logger.error(f"Failed to get notifications: {str(e)}")
            return []
    
    def get_unread_notification_count(self, user_id: str) -> int:
        """Get count of unread notifications"""
        try:
            return self.notifications_collection.count_documents({
                'user_id': user_id,
                'read': False
            })
        except Exception as e:
            logger.error(f"Failed to get unread count: {str(e)}")
            return 0
    
    def mark_notification_read(self, user_id: str, notification_id: str) -> Dict[str, Any]:
        """Mark a notification as read"""
        try:
            from bson.objectid import ObjectId
            
            result = self.notifications_collection.update_one(
                {'_id': ObjectId(notification_id), 'user_id': user_id},
                {'$set': {'read': True}}
            )
            
            if result.modified_count > 0:
                return {'success': True, 'message': 'Notification marked as read'}
            return {'success': False, 'error': 'Notification not found'}
        except Exception as e:
            logger.error(f"Failed to mark notification read: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def mark_all_notifications_read(self, user_id: str) -> Dict[str, Any]:
        """Mark all notifications as read"""
        try:
            result = self.notifications_collection.update_many(
                {'user_id': user_id, 'read': False},
                {'$set': {'read': True}}
            )
            
            return {
                'success': True,
                'message': f'{result.modified_count} notifications marked as read'
            }
        except Exception as e:
            logger.error(f"Failed to mark all notifications read: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def delete_notification(self, user_id: str, notification_id: str) -> Dict[str, Any]:
        """Delete a notification"""
        try:
            from bson.objectid import ObjectId
            
            result = self.notifications_collection.delete_one({
                '_id': ObjectId(notification_id),
                'user_id': user_id
            })
            
            if result.deleted_count > 0:
                return {'success': True, 'message': 'Notification deleted'}
            return {'success': False, 'error': 'Notification not found'}
        except Exception as e:
            logger.error(f"Failed to delete notification: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def clear_all_notifications(self, user_id: str) -> Dict[str, Any]:
        """Clear all notifications"""
        try:
            result = self.notifications_collection.delete_many({'user_id': user_id})
            
            return {
                'success': True,
                'message': f'{result.deleted_count} notifications cleared'
            }
        except Exception as e:
            logger.error(f"Failed to clear notifications: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def create_notification(
        self,
        user_id: str,
        notification_type: str,
        title: str,
        message: str,
        link: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Create a notification"""
        try:
            document = {
                'user_id': user_id,
                'type': notification_type,
                'title': title,
                'message': message,
                'link': link,
                'metadata': metadata or {},
                'read': False,
                'created_at': datetime.utcnow()
            }
            
            result = self.notifications_collection.insert_one(document)
            document['_id'] = result.inserted_id
            
            return {
                'success': True,
                'notification': self._serialize_notification(document)
            }
        except Exception as e:
            logger.error(f"Failed to create notification: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _serialize_notification(self, notification: Dict) -> Dict[str, Any]:
        """Convert notification document to JSON-serializable dict"""
        return {
            'id': str(notification['_id']),
            'type': notification['type'],
            'title': notification['title'],
            'message': notification['message'],
            'link': notification.get('link'),
            'metadata': notification.get('metadata', {}),
            'read': notification.get('read', False),
            'created_at': notification['created_at'].isoformat()
        }
    
    # ==================== EXTENSION TOKEN METHODS ====================
    
    def store_extension_token(self, user_id: str, token: str, expires_at: datetime) -> Dict[str, Any]:
        """Store extension token in MongoDB"""
        try:
            # Create extension_tokens collection if not exists
            if not hasattr(self, 'extension_tokens_collection'):
                self.extension_tokens_collection = self.db['extension_tokens']
                # Create indexes
                try:
                    self.extension_tokens_collection.create_index('token', unique=True)
                    self.extension_tokens_collection.create_index([('user_id', ASCENDING)])
                    self.extension_tokens_collection.create_index([('expires_at', ASCENDING)])
                except Exception:
                    pass
            
            document = {
                'user_id': user_id,
                'token': token,
                'expires_at': expires_at,
                'created_at': datetime.utcnow()
            }
            
            # Insert or update token
            self.extension_tokens_collection.update_one(
                {'token': token},
                {'$set': document},
                upsert=True
            )
            
            return {'success': True, 'message': 'Token stored successfully'}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def verify_extension_token(self, token: str) -> Dict[str, Any]:
        """Verify extension token and return user_id if valid"""
        try:
            # Create collection if not exists
            if not hasattr(self, 'extension_tokens_collection'):
                self.extension_tokens_collection = self.db['extension_tokens']
            
            # Find token
            token_doc = self.extension_tokens_collection.find_one({'token': token})
            
            if not token_doc:
                return {'success': False, 'error': 'Token not found'}
            
            # Check if expired
            if token_doc.get('expires_at') and token_doc['expires_at'] < datetime.utcnow():
                return {'success': False, 'error': 'Token expired'}
            
            return {
                'success': True,
                'user_id': token_doc['user_id']
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def delete_extension_token(self, token: str) -> Dict[str, Any]:
        """Delete extension token"""
        try:
            if not hasattr(self, 'extension_tokens_collection'):
                self.extension_tokens_collection = self.db['extension_tokens']
            
            result = self.extension_tokens_collection.delete_one({'token': token})
            
            if result.deleted_count > 0:
                return {'success': True, 'message': 'Token deleted'}
            return {'success': False, 'error': 'Token not found'}
            
        except Exception as e:
            logger.error(f"Failed to delete extension token: {str(e)}")
            return {'success': False, 'error': str(e)}

# Global instance
mongodb_service = MongoDBService()
