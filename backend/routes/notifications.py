"""Notification API Routes - User Notifications System"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.mongodb_service import mongodb_service
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get all notifications for the current user"""
    try:
        user_id = get_jwt_identity()
        
        # Get query parameters
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        limit = int(request.args.get('limit', 50))
        
        # Get notifications from MongoDB
        notifications = mongodb_service.get_notifications(
            user_id=user_id,
            unread_only=unread_only,
            limit=limit
        )
        
        # Get unread count
        unread_count = mongodb_service.get_unread_notification_count(user_id)
        
        return jsonify({
            'success': True,
            'notifications': notifications,
            'unread_count': unread_count
        }), 200
        
    except Exception as e:
        logger.error(f"Get notifications error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get notifications'
        }), 500

@notifications_bp.route('/<notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_as_read(notification_id):
    """Mark a notification as read"""
    try:
        user_id = get_jwt_identity()
        
        # Mark notification as read in MongoDB
        result = mongodb_service.mark_notification_read(user_id, notification_id)
        
        return jsonify(result), 200 if result['success'] else 404
        
    except Exception as e:
        logger.error(f"Mark notification read error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to mark notification as read'
        }), 500

@notifications_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_as_read():
    """Mark all notifications as read"""
    try:
        user_id = get_jwt_identity()
        
        # Mark all notifications as read in MongoDB
        result = mongodb_service.mark_all_notifications_read(user_id)
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Mark all notifications read error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to mark all notifications as read'
        }), 500

@notifications_bp.route('/<notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Delete a notification"""
    try:
        user_id = get_jwt_identity()
        
        # Delete notification from MongoDB
        result = mongodb_service.delete_notification(user_id, notification_id)
        
        return jsonify(result), 200 if result['success'] else 404
        
    except Exception as e:
        logger.error(f"Delete notification error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to delete notification'
        }), 500

@notifications_bp.route('/clear-all', methods=['DELETE'])
@jwt_required()
def clear_all_notifications():
    """Clear all notifications"""
    try:
        user_id = get_jwt_identity()
        
        # Clear all notifications from MongoDB
        result = mongodb_service.clear_all_notifications(user_id)
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Clear all notifications error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to clear all notifications'
        }), 500

@notifications_bp.route('/create', methods=['POST'])
@jwt_required()
def create_notification():
    """Create a notification (for system use)"""
    try:
        data = request.get_json()
        
        user_id = data.get('user_id')
        notification_type = data.get('type')
        title = data.get('title')
        message = data.get('message')
        link = data.get('link')
        metadata = data.get('metadata', {})
        
        if not all([user_id, notification_type, title, message]):
            return jsonify({
                'success': False,
                'error': 'Missing required fields'
            }), 400
        
        # Create notification in MongoDB
        result = mongodb_service.create_notification(
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            message=message,
            link=link,
            metadata=metadata
        )
        
        return jsonify(result), 201 if result['success'] else 400
        
    except Exception as e:
        logger.error(f"Create notification error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to create notification'
        }), 500
