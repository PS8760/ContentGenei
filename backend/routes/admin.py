"""
Admin Routes - Admin panel endpoints for managing the application
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, ContentItem, GeneratedContent, TeamProject, TeamMember, CollaborationRequest
from functools import wraps
from datetime import datetime, timezone, timedelta
from sqlalchemy import func
import logging

logger = logging.getLogger(__name__)

admin_bp = Blueprint('admin', __name__)

# Admin-only decorator
def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        if not user.is_admin:
            return jsonify({'success': False, 'error': 'Admin access required'}), 403
        
        return fn(*args, **kwargs)
    return wrapper

# ==================== ADMIN DASHBOARD ====================

@admin_bp.route('/dashboard/stats', methods=['GET'])
@admin_required
def get_dashboard_stats():
    """Get overall platform statistics"""
    try:
        # User statistics
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        premium_users = User.query.filter_by(is_premium=True).count()
        admin_users = User.query.filter_by(is_admin=True).count()
        
        # New users in last 30 days
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        new_users_30d = User.query.filter(User.created_at >= thirty_days_ago).count()
        
        # Content statistics
        total_content = GeneratedContent.query.count()
        saved_content = ContentItem.query.count()
        
        # Content in last 30 days
        content_30d = GeneratedContent.query.filter(GeneratedContent.created_at >= thirty_days_ago).count()
        
        # Team statistics
        total_projects = TeamProject.query.count()
        active_projects = TeamProject.query.filter_by(status='active').count()
        total_teams = TeamMember.query.count()
        
        # Collaboration statistics
        total_requests = CollaborationRequest.query.count()
        pending_requests = CollaborationRequest.query.filter_by(status='pending').count()
        accepted_requests = CollaborationRequest.query.filter_by(status='accepted').count()
        
        return jsonify({
            'success': True,
            'stats': {
                'users': {
                    'total': total_users,
                    'active': active_users,
                    'premium': premium_users,
                    'admin': admin_users,
                    'new_30d': new_users_30d
                },
                'content': {
                    'total_generated': total_content,
                    'total_saved': saved_content,
                    'generated_30d': content_30d
                },
                'teams': {
                    'total_projects': total_projects,
                    'active_projects': active_projects,
                    'total_teams': total_teams
                },
                'collaboration': {
                    'total_requests': total_requests,
                    'pending': pending_requests,
                    'accepted': accepted_requests
                }
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== USER MANAGEMENT ====================

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_all_users():
    """Get all users with pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '', type=str)
        
        query = User.query
        
        # Search filter
        if search:
            query = query.filter(
                (User.email.ilike(f'%{search}%')) |
                (User.display_name.ilike(f'%{search}%'))
            )
        
        # Pagination
        pagination = query.order_by(User.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        users = [user.to_dict() for user in pagination.items]
        
        return jsonify({
            'success': True,
            'users': users,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting users: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/users/<user_id>', methods=['GET'])
@admin_required
def get_user_details(user_id):
    """Get detailed information about a specific user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Get user's content count
        content_count = GeneratedContent.query.filter_by(user_id=user_id).count()
        saved_count = ContentItem.query.filter_by(user_id=user_id).count()
        
        # Get user's projects
        projects_owned = TeamProject.query.filter_by(owner_id=user_id).count()
        
        # Get user's team memberships
        team_memberships = TeamMember.query.filter_by(member_id=user_id).count()
        
        user_data = user.to_dict()
        user_data['statistics'] = {
            'content_generated': content_count,
            'content_saved': saved_count,
            'projects_owned': projects_owned,
            'team_memberships': team_memberships
        }
        
        return jsonify({
            'success': True,
            'user': user_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting user details: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/users/<user_id>/toggle-admin', methods=['PUT'])
@admin_required
def toggle_admin_status(user_id):
    """Toggle admin status for a user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        user.is_admin = not user.is_admin
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f"User {'promoted to' if user.is_admin else 'removed from'} admin",
            'is_admin': user.is_admin
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error toggling admin status: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/users/<user_id>/toggle-premium', methods=['PUT'])
@admin_required
def toggle_premium_status(user_id):
    """Toggle premium status for a user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        user.is_premium = not user.is_premium
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f"User {'upgraded to' if user.is_premium else 'downgraded from'} premium",
            'is_premium': user.is_premium
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error toggling premium status: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/users/<user_id>/toggle-active', methods=['PUT'])
@admin_required
def toggle_active_status(user_id):
    """Toggle active status for a user (ban/unban)"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        user.is_active = not user.is_active
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f"User {'activated' if user.is_active else 'deactivated'}",
            'is_active': user.is_active
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error toggling active status: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    """Delete a user and all their data"""
    try:
        current_user_id = get_jwt_identity()
        
        # Prevent self-deletion
        if user_id == current_user_id:
            return jsonify({'success': False, 'error': 'Cannot delete your own account'}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Delete user (cascade will handle related data)
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'User deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting user: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== CONTENT MANAGEMENT ====================

@admin_bp.route('/content/recent', methods=['GET'])
@admin_required
def get_recent_content():
    """Get recently generated content across all users"""
    try:
        limit = request.args.get('limit', 50, type=int)
        
        content = GeneratedContent.query.order_by(
            GeneratedContent.created_at.desc()
        ).limit(limit).all()
        
        content_list = []
        for item in content:
            content_dict = item.to_dict()
            # Add user info
            user = User.query.get(item.user_id)
            if user:
                content_dict['user_email'] = user.email
                content_dict['user_name'] = user.display_name or user.email
            content_list.append(content_dict)
        
        return jsonify({
            'success': True,
            'content': content_list
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting recent content: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== PROJECT MANAGEMENT ====================

@admin_bp.route('/projects', methods=['GET'])
@admin_required
def get_all_projects():
    """Get all projects across the platform"""
    try:
        projects = TeamProject.query.order_by(TeamProject.created_at.desc()).all()
        
        projects_list = []
        for project in projects:
            project_dict = project.to_dict()
            # Add owner info
            owner = User.query.get(project.owner_id)
            if owner:
                project_dict['owner_email'] = owner.email
                project_dict['owner_name'] = owner.display_name or owner.email
            projects_list.append(project_dict)
        
        return jsonify({
            'success': True,
            'projects': projects_list
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting projects: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/projects/<project_id>', methods=['DELETE'])
@admin_required
def delete_project(project_id):
    """Delete a project"""
    try:
        project = TeamProject.query.get(project_id)
        if not project:
            return jsonify({'success': False, 'error': 'Project not found'}), 404
        
        db.session.delete(project)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Project deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting project: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== SYSTEM LOGS ====================

@admin_bp.route('/logs/activity', methods=['GET'])
@admin_required
def get_activity_logs():
    """Get system activity logs"""
    try:
        limit = request.args.get('limit', 100, type=int)
        
        # Get recent user registrations
        recent_users = User.query.order_by(User.created_at.desc()).limit(20).all()
        
        # Get recent content generation
        recent_content = GeneratedContent.query.order_by(GeneratedContent.created_at.desc()).limit(20).all()
        
        # Get recent projects
        recent_projects = TeamProject.query.order_by(TeamProject.created_at.desc()).limit(20).all()
        
        logs = []
        
        # Add user registrations to logs
        for user in recent_users:
            logs.append({
                'type': 'user_registration',
                'timestamp': user.created_at.isoformat() if user.created_at else None,
                'description': f"New user registered: {user.email}",
                'user_id': user.id,
                'user_email': user.email
            })
        
        # Add content generation to logs
        for content in recent_content:
            user = User.query.get(content.user_id)
            logs.append({
                'type': 'content_generated',
                'timestamp': content.created_at.isoformat() if content.created_at else None,
                'description': f"Content generated: {content.content_type}",
                'user_id': content.user_id,
                'user_email': user.email if user else 'Unknown'
            })
        
        # Add project creation to logs
        for project in recent_projects:
            owner = User.query.get(project.owner_id)
            logs.append({
                'type': 'project_created',
                'timestamp': project.created_at.isoformat() if project.created_at else None,
                'description': f"Project created: {project.name}",
                'user_id': project.owner_id,
                'user_email': owner.email if owner else 'Unknown'
            })
        
        # Sort by timestamp
        logs.sort(key=lambda x: x['timestamp'] or '', reverse=True)
        logs = logs[:limit]
        
        return jsonify({
            'success': True,
            'logs': logs
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting activity logs: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
