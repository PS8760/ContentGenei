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
        """Create a new user profile with comprehensive AI-ready fields"""
        if self.collection is None:
            logger.warning("MongoDB not available - cannot create profile")
            return None
            
        try:
            profile = {
                'user_id': user_id,
                'email': email,
                
                # ===== BASIC INFORMATION =====
                'full_name': display_name or email.split('@')[0],
                'professional_title': '',
                'category': 'professional',  # student, professional, freelancer, entrepreneur, creator
                'location': '',
                'bio': '',
                'tagline': '',  # Short one-liner
                
                # ===== PROFESSIONAL DETAILS =====
                'company': '',
                'website': '',
                'phone': '',
                'timezone': 'UTC',
                'years_of_experience': 0,
                'education_level': '',  # high_school, bachelors, masters, phd, self_taught
                'current_role': '',
                'industry': '',  # tech, marketing, design, business, education, etc.
                
                # ===== CONTENT PREFERENCES (AI-Ready) =====
                'niche_tags': [],  # Array of interests/niches
                'content_tone': 'professional',  # casual, professional, friendly, authoritative, humorous
                'target_audience': '',
                'primary_goal': '',  # grow_audience, generate_leads, build_brand, educate, entertain
                'content_types': [],  # blog, video, social, newsletter, podcast
                'posting_frequency': 'weekly',  # daily, weekly, bi-weekly, monthly
                'preferred_platforms': [],  # linkedin, twitter, instagram, youtube, etc.
                
                # ===== SKILLS & EXPERTISE (AI Analysis) =====
                'skills': [],  # Array of skills
                'expertise_areas': [],  # Areas of deep knowledge
                'languages': ['English'],  # Spoken languages
                'certifications': [],  # Professional certifications
                
                # ===== SOCIAL PLATFORMS =====
                'platforms': {
                    'instagram': False,
                    'twitter': False,
                    'linkedin': False,
                    'youtube': False,
                    'facebook': False,
                    'tiktok': False,
                    'medium': False,
                    'substack': False
                },
                'platform_connections': {
                    'linkedin': {'connected': False, 'username': '', 'followers': 0},
                    'twitter': {'connected': False, 'username': '', 'followers': 0},
                    'instagram': {'connected': False, 'username': '', 'followers': 0},
                    'youtube': {'connected': False, 'username': '', 'subscribers': 0},
                    'facebook': {'connected': False, 'username': '', 'followers': 0},
                    'tiktok': {'connected': False, 'username': '', 'followers': 0},
                    'medium': {'connected': False, 'username': '', 'followers': 0},
                    'substack': {'connected': False, 'username': '', 'subscribers': 0}
                },
                
                # ===== CONTENT STRATEGY (AI Insights) =====
                'content_pillars': [],  # Main content themes
                'brand_voice': '',  # Description of brand voice
                'unique_value_proposition': '',  # What makes them unique
                'content_goals': [],  # Specific measurable goals
                'success_metrics': [],  # How they measure success
                
                # ===== AI PREFERENCES =====
                'ai_writing_style': 'balanced',  # creative, balanced, factual
                'ai_content_length': 'medium',  # short, medium, long
                'ai_use_emojis': True,
                'ai_use_hashtags': True,
                'ai_include_cta': True,
                'ai_personalization_level': 'medium',  # low, medium, high
                
                # ===== COLLABORATION =====
                'open_to_collaboration': True,
                'collaboration_interests': [],  # Types of collaborations interested in
                'team_size': 1,  # Number of team members
                'management_style': '',  # For team leaders
                
                # ===== ANALYTICS & INSIGHTS =====
                'best_performing_content_types': [],
                'audience_demographics': {},
                'engagement_patterns': {},
                'growth_rate': 0,
                
                # ===== SETTINGS =====
                'language': 'en',
                'notification_preferences': {
                    'email_notifications': True,
                    'push_notifications': True,
                    'task_reminders': True,
                    'daily_updates': True,
                    'team_invites': True,
                    'content_suggestions': True,
                    'weekly_reports': True
                },
                'privacy_settings': {
                    'profile_visibility': 'team',  # public, team, private
                    'show_email': False,
                    'show_phone': False,
                    'show_social_stats': True,
                    'allow_ai_analysis': True
                },
                
                # ===== PROFILE CUSTOMIZATION =====
                'avatar_url': '',
                'cover_image_url': '',
                'theme_preference': 'system',  # light, dark, system
                'profile_color': '#6366f1',  # Brand color
                
                # ===== METADATA (AI Training Data) =====
                'onboarding_complete': False,
                'profile_completion_percentage': 0,
                'last_active': datetime.now(timezone.utc),
                'total_content_generated': 0,
                'total_projects': 0,
                'total_collaborations': 0,
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
