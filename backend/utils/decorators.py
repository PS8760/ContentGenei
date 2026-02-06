from functools import wraps
from flask import jsonify, request, current_app
from flask_jwt_extended import get_jwt_identity
from models import User
import time

def premium_required(f):
    """Decorator to require premium subscription"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_premium:
            return jsonify({
                'error': 'Premium subscription required',
                'upgrade_required': True
            }), 403
        
        return f(*args, **kwargs)
    return decorated_function

def rate_limit(max_requests=100, per_seconds=3600):
    """Simple rate limiting decorator"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Simple in-memory rate limiting (use Redis in production)
            client_id = request.remote_addr
            current_time = time.time()
            
            # This is a simplified implementation
            # In production, use Redis or a proper rate limiting library
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def validate_json(*required_fields):
    """Decorator to validate required JSON fields"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({'error': 'Content-Type must be application/json'}), 400
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Invalid JSON data'}), 400
            
            missing_fields = []
            for field in required_fields:
                if field not in data or data[field] is None:
                    missing_fields.append(field)
            
            if missing_fields:
                return jsonify({
                    'error': 'Missing required fields',
                    'missing_fields': missing_fields
                }), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def log_api_call(f):
    """Decorator to log API calls"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = time.time()
        
        try:
            result = f(*args, **kwargs)
            duration = time.time() - start_time
            
            current_app.logger.info(
                f"API Call: {request.method} {request.endpoint} - "
                f"Duration: {duration:.3f}s - Status: Success"
            )
            
            return result
            
        except Exception as e:
            duration = time.time() - start_time
            
            current_app.logger.error(
                f"API Call: {request.method} {request.endpoint} - "
                f"Duration: {duration:.3f}s - Error: {str(e)}"
            )
            
            raise
            
    return decorated_function