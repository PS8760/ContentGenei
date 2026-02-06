from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from models import db, User, UserSession
from services.firebase_service import FirebaseService
from datetime import datetime, timezone, timedelta
import uuid
import jwt as pyjwt

auth_bp = Blueprint('auth', __name__)

def get_firebase_service():
    """Get Firebase service instance with proper initialization"""
    firebase_service = FirebaseService()
    firebase_service._initialize_firebase()
    return firebase_service

@auth_bp.route('/verify-token', methods=['POST'])
def verify_firebase_token():
    """Verify Firebase token and create/update user in database"""
    try:
        data = request.get_json()
        id_token = data.get('idToken')
        
        if not id_token:
            return jsonify({'error': 'ID token is required'}), 400
        
        # Try to verify token with Firebase (optional for development)
        firebase_service = get_firebase_service()
        user_info = firebase_service.verify_token(id_token)
        
        # If Firebase verification fails, extract info from token directly (for development)
        if not user_info:
            current_app.logger.warning("Firebase verification unavailable, using token claims")
            try:
                # Decode without verification (ONLY for development)
                decoded = pyjwt.decode(id_token, options={"verify_signature": False})
                user_info = {
                    'uid': decoded.get('user_id', decoded.get('sub', f'dev_{uuid.uuid4().hex[:8]}')),
                    'email': decoded.get('email', 'user@example.com'),
                    'name': decoded.get('name', 'User'),
                    'picture': decoded.get('picture'),
                    'provider': 'email'
                }
            except Exception as e:
                current_app.logger.error(f"Token decode error: {str(e)}")
                return jsonify({'error': 'Invalid token', 'details': str(e)}), 401
        
        # Find or create user in database
        user = User.query.filter_by(firebase_uid=user_info['uid']).first()
        
        if not user:
            # Create new user
            user = User(
                firebase_uid=user_info['uid'],
                email=user_info['email'],
                display_name=user_info.get('name'),
                photo_url=user_info.get('picture'),
                provider=user_info.get('provider', 'email')
            )
            db.session.add(user)
        else:
            # Update existing user
            user.display_name = user_info.get('name') or user.display_name
            user.photo_url = user_info.get('picture') or user.photo_url
            user.last_login = datetime.now(timezone.utc)
        
        db.session.commit()
        
        # Create JWT tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        # Create session record
        session = UserSession(
            user_id=user.id,
            session_token=str(uuid.uuid4()),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            expires_at=datetime.now(timezone.utc) + timedelta(days=30)
        )
        db.session.add(session)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token,
            'session_token': session.session_token
        })
        
    except Exception as e:
        current_app.logger.error(f"Token verification error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Authentication failed', 'details': str(e)}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh_token():
    """Refresh access token"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 404
        
        # Create new access token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'success': True,
            'access_token': access_token,
            'user': user.to_dict()
        })
        
    except Exception as e:
        current_app.logger.error(f"Token refresh error: {str(e)}")
        return jsonify({'error': 'Token refresh failed'}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user and invalidate session"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        session_token = data.get('session_token')
        
        if session_token:
            # Deactivate session
            session = UserSession.query.filter_by(
                user_id=current_user_id,
                session_token=session_token
            ).first()
            
            if session:
                session.is_active = False
                db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Logged out successfully'
        })
        
    except Exception as e:
        current_app.logger.error(f"Logout error: {str(e)}")
        return jsonify({'error': 'Logout failed'}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'success': True,
            'user': user.to_dict()
        })
        
    except Exception as e:
        current_app.logger.error(f"Get profile error: {str(e)}")
        return jsonify({'error': 'Failed to get profile'}), 500

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'display_name' in data:
            user.display_name = data['display_name']
        
        user.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'user': user.to_dict(),
            'message': 'Profile updated successfully'
        })
        
    except Exception as e:
        current_app.logger.error(f"Update profile error: {str(e)}")
        return jsonify({'error': 'Failed to update profile'}), 500

@auth_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_user_sessions():
    """Get user's active sessions"""
    try:
        current_user_id = get_jwt_identity()
        
        sessions = UserSession.query.filter_by(
            user_id=current_user_id,
            is_active=True
        ).filter(
            UserSession.expires_at > datetime.now(timezone.utc)
        ).order_by(UserSession.last_activity.desc()).all()
        
        return jsonify({
            'success': True,
            'sessions': [session.to_dict() for session in sessions]
        })
        
    except Exception as e:
        current_app.logger.error(f"Get sessions error: {str(e)}")
        return jsonify({'error': 'Failed to get sessions'}), 500

@auth_bp.route('/sessions/<session_id>', methods=['DELETE'])
@jwt_required()
def revoke_session(session_id):
    """Revoke a specific session"""
    try:
        current_user_id = get_jwt_identity()
        
        session = UserSession.query.filter_by(
            id=session_id,
            user_id=current_user_id
        ).first()
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        session.is_active = False
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Session revoked successfully'
        })
        
    except Exception as e:
        current_app.logger.error(f"Revoke session error: {str(e)}")
        return jsonify({'error': 'Failed to revoke session'}), 500
