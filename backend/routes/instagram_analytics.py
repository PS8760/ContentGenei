"""
Instagram Advanced Analytics Routes
Endpoints for pattern recognition, sentiment analysis, and ML predictions
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models_instagram import InstagramConnection, InstagramPost
from services.instagram_analytics_service import InstagramAnalyticsService
from datetime import datetime, timezone
import os

instagram_analytics_bp = Blueprint('instagram_analytics', __name__)
analytics_service = InstagramAnalyticsService()

@instagram_analytics_bp.route('/enhanced-metrics/<connection_id>', methods=['GET'])
@jwt_required()
def get_enhanced_metrics(connection_id):
    """Get enhanced dashboard metrics"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verify connection ownership
        connection = InstagramConnection.query.filter_by(
            id=connection_id,
            user_id=current_user_id,
            is_active=True
        ).first()
        
        if not connection:
            return jsonify({'error': 'Connection not found'}), 404
        
        # Check cache
        cache_key = analytics_service._get_cache_key('enhanced_metrics', connection_id)
        cached_data = analytics_service._get_cache(cache_key)
        if cached_data:
            return jsonify({
                'success': True,
                'metrics': cached_data,
                'cached': True
            })
        
        # Get posts
        posts = InstagramPost.query.filter_by(
            connection_id=connection_id
        ).order_by(InstagramPost.published_at.desc()).limit(50).all()
        
        if not posts:
            return jsonify({'error': 'No posts found. Please sync data first.'}), 404
        
        posts_data = [p.to_dict() for p in posts]
        
        # Calculate enhanced metrics
        metrics = analytics_service.calculate_enhanced_metrics(
            posts_data,
            connection.followers_count or 0
        )
        
        # Cache results
        analytics_service._set_cache(cache_key, metrics)
        
        return jsonify({
            'success': True,
            'metrics': metrics,
            'cached': False
        })
        
    except Exception as e:
        current_app.logger.error(f"Enhanced metrics error: {str(e)}")
        return jsonify({'error': 'Failed to calculate enhanced metrics', 'details': str(e)}), 500


@instagram_analytics_bp.route('/caption-analysis/<connection_id>', methods=['GET'])
@jwt_required()
def analyze_caption_length(connection_id):
    """Analyze caption length performance"""
    try:
        current_user_id = get_jwt_identity()
        
        connection = InstagramConnection.query.filter_by(
            id=connection_id,
            user_id=current_user_id,
            is_active=True
        ).first()
        
        if not connection:
            return jsonify({'error': 'Connection not found'}), 404
        
        # Check cache
        cache_key = analytics_service._get_cache_key('caption_analysis', connection_id)
        cached_data = analytics_service._get_cache(cache_key)
        if cached_data:
            return jsonify({
                'success': True,
                'analysis': cached_data,
                'cached': True
            })
        
        # Get posts
        posts = InstagramPost.query.filter_by(
            connection_id=connection_id
        ).order_by(InstagramPost.published_at.desc()).limit(50).all()
        
        if not posts:
            return jsonify({'error': 'No posts found'}), 404
        
        posts_data = [p.to_dict() for p in posts]
        
        # Analyze caption length
        analysis = analytics_service.analyze_caption_length_performance(posts_data)
        
        # Cache results
        analytics_service._set_cache(cache_key, analysis)
        
        return jsonify({
            'success': True,
            'analysis': analysis,
            'cached': False
        })
        
    except Exception as e:
        current_app.logger.error(f"Caption analysis error: {str(e)}")
        return jsonify({'error': 'Failed to analyze captions', 'details': str(e)}), 500


@instagram_analytics_bp.route('/posting-time-analysis/<connection_id>', methods=['GET'])
@jwt_required()
def analyze_posting_times(connection_id):
    """Analyze best posting times with heatmap"""
    try:
        current_user_id = get_jwt_identity()
        
        connection = InstagramConnection.query.filter_by(
            id=connection_id,
            user_id=current_user_id,
            is_active=True
        ).first()
        
        if not connection:
            return jsonify({'error': 'Connection not found'}), 404
        
        # Check cache
        cache_key = analytics_service._get_cache_key('posting_time_analysis', connection_id)
        cached_data = analytics_service._get_cache(cache_key)
        if cached_data:
            return jsonify({
                'success': True,
                'analysis': cached_data,
                'cached': True
            })
        
        # Get posts
        posts = InstagramPost.query.filter_by(
            connection_id=connection_id
        ).order_by(InstagramPost.published_at.desc()).limit(50).all()
        
        if not posts:
            return jsonify({'error': 'No posts found'}), 404
        
        posts_data = [p.to_dict() for p in posts]
        
        # Analyze posting times
        analysis = analytics_service.analyze_best_posting_time(posts_data)
        
        # Cache results
        analytics_service._set_cache(cache_key, analysis)
        
        return jsonify({
            'success': True,
            'analysis': analysis,
            'cached': False
        })
        
    except Exception as e:
        current_app.logger.error(f"Posting time analysis error: {str(e)}")
        return jsonify({'error': 'Failed to analyze posting times', 'details': str(e)}), 500


@instagram_analytics_bp.route('/format-analysis/<connection_id>', methods=['GET'])
@jwt_required()
def analyze_content_format(connection_id):
    """Analyze best content format"""
    try:
        current_user_id = get_jwt_identity()
        
        connection = InstagramConnection.query.filter_by(
            id=connection_id,
            user_id=current_user_id,
            is_active=True
        ).first()
        
        if not connection:
            return jsonify({'error': 'Connection not found'}), 404
        
        # Check cache
        cache_key = analytics_service._get_cache_key('format_analysis', connection_id)
        cached_data = analytics_service._get_cache(cache_key)
        if cached_data:
            return jsonify({
                'success': True,
                'analysis': cached_data,
                'cached': True
            })
        
        # Get posts
        posts = InstagramPost.query.filter_by(
            connection_id=connection_id
        ).order_by(InstagramPost.published_at.desc()).limit(50).all()
        
        if not posts:
            return jsonify({'error': 'No posts found'}), 404
        
        posts_data = [p.to_dict() for p in posts]
        
        # Analyze format
        analysis = analytics_service.analyze_best_format(posts_data)
        
        # Cache results
        analytics_service._set_cache(cache_key, analysis)
        
        return jsonify({
            'success': True,
            'analysis': analysis,
            'cached': False
        })
        
    except Exception as e:
        current_app.logger.error(f"Format analysis error: {str(e)}")
        return jsonify({'error': 'Failed to analyze formats', 'details': str(e)}), 500


@instagram_analytics_bp.route('/sentiment-analysis/<connection_id>', methods=['POST'])
@jwt_required()
def analyze_sentiment(connection_id):
    """Analyze comment sentiment for posts"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        connection = InstagramConnection.query.filter_by(
            id=connection_id,
            user_id=current_user_id,
            is_active=True
        ).first()
        
        if not connection:
            return jsonify({'error': 'Connection not found'}), 404
        
        # Get comments from request (frontend should fetch from Instagram API)
        comments = data.get('comments', [])
        use_groq = data.get('use_groq', False)
        
        if not comments:
            return jsonify({'error': 'No comments provided'}), 400
        
        # Analyze sentiment
        groq_api_key = os.environ.get('GROQ_API_KEY') if use_groq else None
        sentiment_analysis = analytics_service.analyze_comment_sentiment(
            comments,
            use_groq=use_groq,
            groq_api_key=groq_api_key
        )
        
        return jsonify({
            'success': True,
            'sentiment': sentiment_analysis
        })
        
    except Exception as e:
        current_app.logger.error(f"Sentiment analysis error: {str(e)}")
        return jsonify({'error': 'Failed to analyze sentiment', 'details': str(e)}), 500


@instagram_analytics_bp.route('/emotional-triggers/<connection_id>', methods=['POST'])
@jwt_required()
def identify_triggers(connection_id):
    """Identify emotional triggers from posts and comments"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        connection = InstagramConnection.query.filter_by(
            id=connection_id,
            user_id=current_user_id,
            is_active=True
        ).first()
        
        if not connection:
            return jsonify({'error': 'Connection not found'}), 404
        
        # Get posts
        posts = InstagramPost.query.filter_by(
            connection_id=connection_id
        ).order_by(InstagramPost.published_at.desc()).limit(30).all()
        
        if not posts:
            return jsonify({'error': 'No posts found'}), 404
        
        posts_data = [p.to_dict() for p in posts]
        
        # Get comments by post (from request)
        comments_by_post = data.get('comments_by_post', {})
        
        # Identify triggers
        triggers = analytics_service.identify_emotional_triggers(posts_data, comments_by_post)
        
        return jsonify({
            'success': True,
            'triggers': triggers
        })
        
    except Exception as e:
        current_app.logger.error(f"Emotional triggers error: {str(e)}")
        return jsonify({'error': 'Failed to identify triggers', 'details': str(e)}), 500


@instagram_analytics_bp.route('/predict-engagement/<connection_id>', methods=['POST'])
@jwt_required()
def predict_engagement(connection_id):
    """Predict engagement for a new post"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        connection = InstagramConnection.query.filter_by(
            id=connection_id,
            user_id=current_user_id,
            is_active=True
        ).first()
        
        if not connection:
            return jsonify({'error': 'Connection not found'}), 404
        
        # Get historical posts for training
        posts = InstagramPost.query.filter_by(
            connection_id=connection_id
        ).order_by(InstagramPost.published_at.desc()).limit(50).all()
        
        if not posts:
            return jsonify({'error': 'No posts found for training'}), 404
        
        posts_data = [p.to_dict() for p in posts]
        
        # Get new post features from request
        new_post_features = {
            'caption': data.get('caption', ''),
            'media_type': data.get('media_type', 'IMAGE'),
            'published_at': data.get('published_at', datetime.now(timezone.utc).isoformat())
        }
        
        # Predict engagement
        prediction = analytics_service.predict_engagement_range(posts_data, new_post_features)
        
        return jsonify({
            'success': True,
            'prediction': prediction
        })
        
    except Exception as e:
        current_app.logger.error(f"Engagement prediction error: {str(e)}")
        return jsonify({'error': 'Failed to predict engagement', 'details': str(e)}), 500


@instagram_analytics_bp.route('/optimal-posting-times/<connection_id>', methods=['GET'])
@jwt_required()
def get_optimal_times(connection_id):
    """Get optimal posting time suggestions"""
    try:
        current_user_id = get_jwt_identity()
        
        connection = InstagramConnection.query.filter_by(
            id=connection_id,
            user_id=current_user_id,
            is_active=True
        ).first()
        
        if not connection:
            return jsonify({'error': 'Connection not found'}), 404
        
        # Check cache
        cache_key = analytics_service._get_cache_key('optimal_times', connection_id)
        cached_data = analytics_service._get_cache(cache_key)
        if cached_data:
            return jsonify({
                'success': True,
                'suggestions': cached_data,
                'cached': True
            })
        
        # Get posts
        posts = InstagramPost.query.filter_by(
            connection_id=connection_id
        ).order_by(InstagramPost.published_at.desc()).limit(50).all()
        
        if not posts:
            return jsonify({'error': 'No posts found'}), 404
        
        posts_data = [p.to_dict() for p in posts]
        
        # Get suggestions
        suggestions = analytics_service.suggest_optimal_posting_times(posts_data)
        
        # Cache results
        analytics_service._set_cache(cache_key, suggestions)
        
        return jsonify({
            'success': True,
            'suggestions': suggestions,
            'cached': False
        })
        
    except Exception as e:
        current_app.logger.error(f"Optimal times error: {str(e)}")
        return jsonify({'error': 'Failed to get optimal times', 'details': str(e)}), 500


@instagram_analytics_bp.route('/enhanced-competitor-compare/<connection_id>/<competitor_id>', methods=['GET'])
@jwt_required()
def enhanced_competitor_compare(connection_id, competitor_id):
    """Enhanced competitor comparison"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get user connection
        connection = InstagramConnection.query.filter_by(
            id=connection_id,
            user_id=current_user_id,
            is_active=True
        ).first()
        
        if not connection:
            return jsonify({'error': 'Connection not found'}), 404
        
        # Get user posts
        user_posts = InstagramPost.query.filter_by(
            connection_id=connection_id
        ).order_by(InstagramPost.published_at.desc()).limit(30).all()
        
        # For now, return placeholder for competitor data
        # In production, you'd fetch competitor posts from their connected account
        # or use third-party API
        
        comparison = {
            'user': {
                'followers': connection.followers_count or 0,
                'post_count': len(user_posts),
                'message': 'User data loaded'
            },
            'competitor': {
                'message': 'Competitor must connect their account for detailed comparison'
            },
            'note': 'Full competitor comparison requires competitor to authorize access'
        }
        
        return jsonify({
            'success': True,
            'comparison': comparison
        })
        
    except Exception as e:
        current_app.logger.error(f"Enhanced comparison error: {str(e)}")
        return jsonify({'error': 'Failed to compare accounts', 'details': str(e)}), 500
