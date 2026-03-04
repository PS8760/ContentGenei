"""
Profile Routes - User profile management endpoints
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.profile_service import profile_service
from models import User
import logging

logger = logging.getLogger(__name__)

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user's profile"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        profile = profile_service.get_or_create_profile(
            current_user.id,
            current_user.email,
            current_user.display_name
        )
        
        if not profile:
            return jsonify({
                'success': False,
                'error': 'Failed to retrieve profile'
            }), 500
        
        return jsonify({
            'success': True,
            'profile': profile
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting profile: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@profile_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update current user's profile - fully editable with all fields"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        data = request.get_json()
        
        # All editable fields - comprehensive list for AI-ready profile
        allowed_fields = [
            # Basic Info
            'full_name', 'professional_title', 'category', 'location', 'bio', 'tagline',
            # Professional Details
            'company', 'website', 'phone', 'timezone', 'years_of_experience',
            'education_level', 'current_role', 'industry',
            # Content Preferences
            'niche_tags', 'content_tone', 'target_audience', 'primary_goal',
            'content_types', 'posting_frequency', 'preferred_platforms',
            # Skills & Expertise
            'skills', 'expertise_areas', 'languages', 'certifications',
            # Social Platforms
            'platforms', 'platform_connections',
            # Content Strategy
            'content_pillars', 'brand_voice', 'unique_value_proposition',
            'content_goals', 'success_metrics',
            # AI Preferences
            'ai_writing_style', 'ai_content_length', 'ai_use_emojis',
            'ai_use_hashtags', 'ai_include_cta', 'ai_personalization_level',
            # Collaboration
            'open_to_collaboration', 'collaboration_interests', 'team_size',
            'management_style',
            # Analytics
            'best_performing_content_types', 'audience_demographics',
            'engagement_patterns', 'growth_rate',
            # Settings
            'language', 'notification_preferences', 'privacy_settings',
            # Customization
            'avatar_url', 'cover_image_url', 'theme_preference', 'profile_color'
        ]
        
        update_data = {
            key: value for key, value in data.items()
            if key in allowed_fields
        }
        
        if not update_data:
            return jsonify({
                'success': False,
                'error': 'No valid fields to update'
            }), 400
        
        # Calculate profile completion percentage
        if update_data:
            profile = profile_service.get_profile(current_user.id)
            if profile:
                # Count filled fields
                important_fields = [
                    'full_name', 'professional_title', 'category', 'bio',
                    'niche_tags', 'content_tone', 'target_audience', 'primary_goal'
                ]
                filled_count = sum(1 for field in important_fields if profile.get(field))
                update_data['profile_completion_percentage'] = int((filled_count / len(important_fields)) * 100)
        
        # Also update User model if display_name is provided
        if 'full_name' in update_data:
            current_user.display_name = update_data['full_name']
            from models import db
            db.session.commit()
        
        profile = profile_service.update_profile(current_user.id, update_data)
        
        if not profile:
            return jsonify({
                'success': False,
                'error': 'Failed to update profile'
            }), 500
        
        return jsonify({
            'success': True,
            'profile': profile,
            'message': 'Profile updated successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@profile_bp.route('/profile/onboarding', methods=['POST'])
@jwt_required()
def complete_onboarding():
    """Complete user onboarding"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['full_name', 'professional_title', 'location', 
                          'content_tone', 'target_audience', 'bio', 
                          'platforms', 'niche_tags', 'primary_goal']
        
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        profile = profile_service.complete_onboarding(current_user.id, data)
        
        if not profile:
            return jsonify({
                'success': False,
                'error': 'Failed to complete onboarding'
            }), 500
        
        return jsonify({
            'success': True,
            'profile': profile,
            'message': 'Onboarding completed successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error completing onboarding: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@profile_bp.route('/profile/onboarding/status', methods=['GET'])
@jwt_required()
def get_onboarding_status():
    """Check if user has completed onboarding"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        profile = profile_service.get_or_create_profile(
            current_user.id,
            current_user.email,
            current_user.display_name
        )
        
        if not profile:
            return jsonify({
                'success': False,
                'error': 'Failed to retrieve profile'
            }), 500
        
        return jsonify({
            'success': True,
            'onboarding_complete': profile.get('onboarding_complete', False),
            'profile': profile
        }), 200
        
    except Exception as e:
        logger.error(f"Error checking onboarding status: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@profile_bp.route('/profile/platform/<platform>', methods=['PUT'])
@jwt_required()
def update_platform_connection(platform):
    """Update platform connection status"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        if platform not in ['linkedin', 'twitter', 'instagram']:
            return jsonify({
                'success': False,
                'error': 'Invalid platform'
            }), 400
        
        data = request.get_json()
        connection_data = {
            'connected': data.get('connected', False),
            'username': data.get('username', '')
        }
        
        profile = profile_service.update_platform_connection(
            current_user.id,
            platform,
            connection_data
        )
        
        if not profile:
            return jsonify({
                'success': False,
                'error': 'Failed to update platform connection'
            }), 500
        
        return jsonify({
            'success': True,
            'profile': profile,
            'message': f'{platform.capitalize()} connection updated'
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating platform connection: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
