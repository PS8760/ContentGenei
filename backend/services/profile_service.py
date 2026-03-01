"""
Profile Service - MongoDB-based user profile management
"""
from datetime import datetime, timezone
from services.mongodb_service import mongodb_service
import logging

logger = logging.getLogger(__name__)

# Try to import bson, but make it optional
try:
    from bson import ObjectId
    BSON_AVAILABLE = True
except ImportError:
    BSON_AVAILABLE = False
    logger.warning("bson module not available - MongoDB features will be limited")

class ProfileService:
    def __init__(self):
        # Use the mongodb_service's db attribute to get the collection
        # If MongoDB is not available, this will be None
        if mongodb_service.db is not None:
            self.collection = mongodb_service.db['user_profiles']
        else:
            self.collection = None
            logger.warning("Profile service initialized without MongoDB - features will be limited")
    
    def get_profile(self, user_id):
        """Get user profile from MongoDB"""
        if self.collection is None:
            logger.warning("MongoDB not available - cannot get profile")
            return None
            
        try:
            profile = self.collection.find_one({'user_id': user_id})
            if profile:
                profile['_id'] = str(profile['_id'])
                return profile
            return None
        except Exception as e:
            logger.error(f"Error getting profile: {str(e)}")
            return None
    
    def create_profile(self, user_id, email, display_name=None):
        """Create a new user profile"""
        if self.collection is None:
            logger.warning("MongoDB not available - cannot create profile")
            return None
            
        try:
            profile = {
                'user_id': user_id,
                'email': email,
                'full_name': display_name or email.split('@')[0],
                'professional_title': '',
                'location': '',
                'bio': '',
                'niche_tags': [],
                'content_tone': 'professional',
                'target_audience': '',
                'primary_goal': '',
                'platforms': {
                    'instagram': False,
                    'twitter': False,
                    'linkedin': False,
                    'youtube': False
                },
                'platform_connections': {
                    'linkedin': {'connected': False, 'username': ''},
                    'twitter': {'connected': False, 'username': ''},
                    'instagram': {'connected': False, 'username': ''}
                },
                'onboarding_complete': False,
                'created_at': datetime.now(timezone.utc),
                'updated_at': datetime.now(timezone.utc)
            }
            
            result = self.collection.insert_one(profile)
            profile['_id'] = str(result.inserted_id)
            return profile
        except Exception as e:
            logger.error(f"Error creating profile: {str(e)}")
            return None
    
    def update_profile(self, user_id, update_data):
        """Update user profile"""
        if self.collection is None:
            logger.warning("MongoDB not available - cannot update profile")
            return None
            
        try:
            # Add updated_at timestamp
            update_data['updated_at'] = datetime.now(timezone.utc)
            
            result = self.collection.update_one(
                {'user_id': user_id},
                {'$set': update_data}
            )
            
            if result.modified_count > 0 or result.matched_count > 0:
                return self.get_profile(user_id)
            return None
        except Exception as e:
            logger.error(f"Error updating profile: {str(e)}")
            return None
    
    def update_platform_connection(self, user_id, platform, connection_data):
        """Update platform connection status"""
        if self.collection is None:
            logger.warning("MongoDB not available - cannot update platform connection")
            return None
            
        try:
            update_data = {
                f'platform_connections.{platform}': connection_data,
                'updated_at': datetime.now(timezone.utc)
            }
            
            result = self.collection.update_one(
                {'user_id': user_id},
                {'$set': update_data}
            )
            
            if result.modified_count > 0 or result.matched_count > 0:
                return self.get_profile(user_id)
            return None
        except Exception as e:
            logger.error(f"Error updating platform connection: {str(e)}")
            return None
    
    def get_or_create_profile(self, user_id, email, display_name=None):
        """Get existing profile or create new one"""
        profile = self.get_profile(user_id)
        if not profile:
            profile = self.create_profile(user_id, email, display_name)
        return profile
    
    def complete_onboarding(self, user_id, onboarding_data):
        """Complete user onboarding and save all data"""
        if self.collection is None:
            logger.warning("MongoDB not available - cannot complete onboarding")
            return None
            
        try:
            # Prepare update data with all onboarding fields
            update_data = {
                'full_name': onboarding_data.get('full_name', ''),
                'professional_title': onboarding_data.get('professional_title', ''),
                'location': onboarding_data.get('location', ''),
                'content_tone': onboarding_data.get('content_tone', 'professional'),
                'target_audience': onboarding_data.get('target_audience', ''),
                'bio': onboarding_data.get('bio', ''),
                'platforms': onboarding_data.get('platforms', {}),
                'niche_tags': onboarding_data.get('niche_tags', []),
                'primary_goal': onboarding_data.get('primary_goal', ''),
                'onboarding_complete': True,
                'onboarding_completed_at': datetime.now(timezone.utc),
                'updated_at': datetime.now(timezone.utc)
            }
            
            result = self.collection.update_one(
                {'user_id': user_id},
                {'$set': update_data}
            )
            
            if result.modified_count > 0 or result.matched_count > 0:
                return self.get_profile(user_id)
            return None
        except Exception as e:
            logger.error(f"Error completing onboarding: {str(e)}")
            return None

profile_service = ProfileService()
