from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, SocialAccount
from services.analytics_service import AnalyticsService
from services.apify_service import apify_service
from datetime import datetime, timezone
import re
import json

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/overview', methods=['GET'])
@jwt_required()
def get_analytics_overview():
    """Get user analytics overview"""
    try:
        current_user_id = get_jwt_identity()
        days = request.args.get('days', 30, type=int)
        
        # Limit days to reasonable range
        days = min(max(days, 1), 365)
        
        overview = AnalyticsService.get_user_overview(current_user_id, days)
        
        return jsonify({
            'success': True,
            'overview': overview,
            'period_days': days
        })
        
    except Exception as e:
        current_app.logger.error(f"Get analytics overview error: {str(e)}")
        return jsonify({'error': 'Failed to get analytics overview'}), 500

@analytics_bp.route('/content-performance', methods=['GET'])
@jwt_required()
def get_content_performance():
    """Get top performing content"""
    try:
        current_user_id = get_jwt_identity()
        days = request.args.get('days', 30, type=int)
        limit = request.args.get('limit', 10, type=int)
        
        # Limit parameters to reasonable ranges
        days = min(max(days, 1), 365)
        limit = min(max(limit, 1), 50)
        
        performance = AnalyticsService.get_content_performance(current_user_id, days, limit)
        
        return jsonify({
            'success': True,
            'content_performance': performance,
            'period_days': days,
            'limit': limit
        })
        
    except Exception as e:
        current_app.logger.error(f"Get content performance error: {str(e)}")
        return jsonify({'error': 'Failed to get content performance'}), 500

@analytics_bp.route('/content-distribution', methods=['GET'])
@jwt_required()
def get_content_distribution():
    """Get content type distribution"""
    try:
        current_user_id = get_jwt_identity()
        days = request.args.get('days', 30, type=int)
        
        days = min(max(days, 1), 365)
        
        distribution = AnalyticsService.get_content_type_distribution(current_user_id, days)
        
        return jsonify({
            'success': True,
            'distribution': distribution,
            'period_days': days
        })
        
    except Exception as e:
        current_app.logger.error(f"Get content distribution error: {str(e)}")
        return jsonify({'error': 'Failed to get content distribution'}), 500

@analytics_bp.route('/daily-metrics', methods=['GET'])
@jwt_required()
def get_daily_metrics():
    """Get daily metrics for charts"""
    try:
        current_user_id = get_jwt_identity()
        days = request.args.get('days', 30, type=int)
        
        days = min(max(days, 1), 90)  # Limit to 90 days for daily metrics
        
        metrics = AnalyticsService.get_daily_metrics(current_user_id, days)
        
        return jsonify({
            'success': True,
            'metrics': metrics,
            'period_days': days
        })
        
    except Exception as e:
        current_app.logger.error(f"Get daily metrics error: {str(e)}")
        return jsonify({'error': 'Failed to get daily metrics'}), 500

@analytics_bp.route('/platform-performance', methods=['GET'])
@jwt_required()
def get_platform_performance():
    """Get performance by platform"""
    try:
        current_user_id = get_jwt_identity()
        days = request.args.get('days', 30, type=int)
        
        days = min(max(days, 1), 365)
        
        performance = AnalyticsService.get_platform_performance(current_user_id, days)
        
        return jsonify({
            'success': True,
            'platform_performance': performance,
            'period_days': days
        })
        
    except Exception as e:
        current_app.logger.error(f"Get platform performance error: {str(e)}")
        return jsonify({'error': 'Failed to get platform performance'}), 500

@analytics_bp.route('/record-metric', methods=['POST'])
@jwt_required()
def record_metric():
    """Record a new analytics metric"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        required_fields = ['metric_type', 'metric_value']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        success = AnalyticsService.record_metric(
            user_id=current_user_id,
            metric_type=data['metric_type'],
            metric_value=float(data['metric_value']),
            content_item_id=data.get('content_item_id'),
            platform=data.get('platform'),
            source=data.get('source'),
            extra_data=data.get('extra_data')
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Metric recorded successfully'
            })
        else:
            return jsonify({'error': 'Failed to record metric'}), 500
        
    except ValueError:
        return jsonify({'error': 'Invalid metric value'}), 400
    except Exception as e:
        current_app.logger.error(f"Record metric error: {str(e)}")
        return jsonify({'error': 'Failed to record metric'}), 500

@analytics_bp.route('/generate-sample-data', methods=['POST'])
@jwt_required()
def generate_sample_data():
    """Generate sample analytics data for demonstration"""
    try:
        current_user_id = get_jwt_identity()
        days = request.args.get('days', 30, type=int)
        
        days = min(max(days, 1), 90)
        
        AnalyticsService.generate_sample_data(current_user_id, days)
        
        return jsonify({
            'success': True,
            'message': f'Sample data generated for {days} days'
        })
        
    except Exception as e:
        current_app.logger.error(f"Generate sample data error: {str(e)}")
        return jsonify({'error': 'Failed to generate sample data'}), 500

@analytics_bp.route('/export', methods=['GET'])
@jwt_required()
def export_analytics():
    """Export analytics data"""
    try:
        current_user_id = get_jwt_identity()
        days = request.args.get('days', 30, type=int)
        format_type = request.args.get('format', 'json')  # json, csv
        
        days = min(max(days, 1), 365)
        
        # Get all analytics data
        overview = AnalyticsService.get_user_overview(current_user_id, days)
        content_performance = AnalyticsService.get_content_performance(current_user_id, days, 50)
        distribution = AnalyticsService.get_content_type_distribution(current_user_id, days)
        daily_metrics = AnalyticsService.get_daily_metrics(current_user_id, days)
        platform_performance = AnalyticsService.get_platform_performance(current_user_id, days)
        
        export_data = {
            'export_date': datetime.now(timezone.utc).isoformat(),
            'period_days': days,
            'user_id': current_user_id,
            'overview': overview,
            'content_performance': content_performance,
            'content_distribution': distribution,
            'daily_metrics': daily_metrics,
            'platform_performance': platform_performance
        }
        
        if format_type == 'csv':
            # For CSV format, you would implement CSV conversion here
            # For now, return JSON with a note
            return jsonify({
                'success': True,
                'message': 'CSV export not implemented yet',
                'data': export_data
            })
        
        return jsonify({
            'success': True,
            'data': export_data
        })
        
    except Exception as e:
        current_app.logger.error(f"Export analytics error: {str(e)}")
        return jsonify({'error': 'Failed to export analytics'}), 500


# ==================== SOCIAL ANALYTICS ENDPOINTS ====================

@analytics_bp.route('/social-accounts', methods=['GET'])
@jwt_required()
def get_social_accounts():
    """Get connected social media accounts"""
    try:
        current_user_id = get_jwt_identity()
        
        # Fetch accounts from database
        accounts = SocialAccount.query.filter_by(user_id=current_user_id).order_by(SocialAccount.connected_at.desc()).all()
        
        return jsonify({
            'success': True,
            'accounts': [account.to_dict() for account in accounts]
        })
        
    except Exception as e:
        current_app.logger.error(f"Get social accounts error: {str(e)}")
        return jsonify({'error': 'Failed to get social accounts'}), 500


@analytics_bp.route('/social-accounts', methods=['POST'])
@jwt_required()
def connect_social_account():
    """Connect a social media account using Apify"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        platform = data.get('platform')
        url = data.get('url')
        
        if not platform or not url:
            return jsonify({'error': 'Platform and URL are required'}), 400
        
        # Extract username from URL
        username = extract_username_from_url(url, platform)
        if not username:
            return jsonify({'error': 'Invalid URL format'}), 400
        
        # Check if account already connected
        existing_account = SocialAccount.query.filter_by(
            user_id=current_user_id,
            platform=platform,
            username=username
        ).first()
        
        if existing_account:
            return jsonify({
                'success': False,
                'error': 'This account is already connected'
            }), 400
        
        # Only Instagram is supported for now
        if platform == 'instagram':
            # Use Apify to scrape real data
            result = apify_service.scrape_instagram_profile(username)
            
            if result['success']:
                profile_data = result['data']
                
                # Generate insights
                insights = apify_service.generate_insights(profile_data)
                
                # Create account in database
                account = SocialAccount(
                    user_id=current_user_id,
                    platform=platform,
                    username=username,
                    profile_url=url,
                    full_name=profile_data.get('full_name'),
                    bio=profile_data.get('bio'),
                    profile_pic=profile_data.get('profile_pic'),
                    is_verified=profile_data.get('is_verified', False),
                    is_private=profile_data.get('is_private', False),
                    metrics=json.dumps({
                        'followers': profile_data.get('followers', 0),
                        'following': profile_data.get('following', 0),
                        'posts': profile_data.get('posts', 0),
                        'engagement_rate': profile_data.get('engagement_rate', 0)
                    }),
                    extra_data=json.dumps(profile_data.get('extra_data', {})),
                    last_updated=datetime.now(timezone.utc),
                    connected_at=datetime.now(timezone.utc)
                )
                
                db.session.add(account)
                db.session.commit()
                
                # Create analytics object
                analytics_data = {
                    'metrics': json.loads(account.metrics),
                    'insights': insights,
                    'profile': {
                        'username': username,
                        'full_name': profile_data.get('full_name'),
                        'bio': profile_data.get('bio'),
                        'is_verified': profile_data.get('is_verified', False),
                        'is_private': profile_data.get('is_private', False)
                    }
                }
                
                return jsonify({
                    'success': True,
                    'account': account.to_dict(),
                    'analytics': analytics_data,
                    'message': 'Account connected successfully'
                })
            else:
                return jsonify({
                    'success': False,
                    'error': result.get('error', 'Failed to fetch profile data')
                }), 400
        else:
            return jsonify({
                'success': False,
                'error': f'{platform.title()} integration coming soon!'
            }), 400
            
    except Exception as e:
        current_app.logger.error(f"Connect social account error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Failed to connect account: {str(e)}'
        }), 500


def extract_username_from_url(url, platform):
    """Extract username from social media URL"""
    try:
        if platform == 'instagram':
            # https://instagram.com/username or https://www.instagram.com/username
            # Remove trailing slash and query parameters
            url = url.rstrip('/').split('?')[0]
            parts = url.split('/')
            # Get the last part which should be the username
            username = parts[-1]
            # Remove @ if present
            username = username.lstrip('@')
            return username if username else None
        
        elif platform == 'linkedin':
            # https://linkedin.com/in/username
            match = re.search(r'linkedin\.com/in/([^/?]+)', url)
            return match.group(1) if match else None
        
        elif platform == 'twitter':
            # https://twitter.com/username or https://x.com/username
            match = re.search(r'(?:twitter|x)\.com/([^/?]+)', url)
            username = match.group(1) if match else None
            return username.lstrip('@') if username else None
        
        elif platform == 'youtube':
            # https://youtube.com/@username or https://youtube.com/c/username
            match = re.search(r'youtube\.com/(?:@|c/|channel/)([^/?]+)', url)
            return match.group(1) if match else None
        
        return None
    except:
        return None


@analytics_bp.route('/social-accounts/<account_id>', methods=['DELETE'])
@jwt_required()
def disconnect_social_account(account_id):
    """Disconnect a social media account"""
    try:
        current_user_id = get_jwt_identity()
        
        # Find account
        account = SocialAccount.query.filter_by(
            id=account_id,
            user_id=current_user_id
        ).first()
        
        if not account:
            return jsonify({
                'success': False,
                'error': 'Account not found'
            }), 404
        
        # Delete account
        db.session.delete(account)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Account disconnected successfully'
        })
        
    except Exception as e:
        current_app.logger.error(f"Disconnect social account error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to disconnect account'}), 500


@analytics_bp.route('/social-accounts/<account_id>/analytics', methods=['GET'])
@jwt_required()
def get_social_analytics(account_id):
    """Get analytics for a specific social account"""
    try:
        current_user_id = get_jwt_identity()
        
        # Find account
        account = SocialAccount.query.filter_by(
            id=account_id,
            user_id=current_user_id
        ).first()
        
        if not account:
            return jsonify({
                'success': False,
                'error': 'Account not found'
            }), 404
        
        # Get metrics and generate insights
        metrics = json.loads(account.metrics) if account.metrics else {}
        
        # Generate fresh insights
        profile_data = {
            'followers': metrics.get('followers', 0),
            'following': metrics.get('following', 0),
            'posts': metrics.get('posts', 0),
            'engagement_rate': metrics.get('engagement_rate', 0)
        }
        insights = apify_service.generate_insights(profile_data)
        
        analytics_data = {
            'account_id': account_id,
            'metrics': metrics,
            'insights': insights,
            'profile': {
                'username': account.username,
                'full_name': account.full_name,
                'bio': account.bio,
                'is_verified': account.is_verified,
                'is_private': account.is_private
            }
        }
        
        return jsonify({
            'success': True,
            'analytics': analytics_data
        })
        
    except Exception as e:
        current_app.logger.error(f"Get social analytics error: {str(e)}")
        return jsonify({'error': 'Failed to get social analytics'}), 500


@analytics_bp.route('/social-accounts/<account_id>/refresh', methods=['POST'])
@jwt_required()
def refresh_social_analytics(account_id):
    """Refresh analytics data for a social account"""
    try:
        current_user_id = get_jwt_identity()
        
        # Find account
        account = SocialAccount.query.filter_by(
            id=account_id,
            user_id=current_user_id
        ).first()
        
        if not account:
            return jsonify({
                'success': False,
                'error': 'Account not found'
            }), 404
        
        # Refresh data from Apify
        if account.platform == 'instagram':
            result = apify_service.scrape_instagram_profile(account.username)
            
            if result['success']:
                profile_data = result['data']
                
                # Update account data
                account.full_name = profile_data.get('full_name')
                account.bio = profile_data.get('bio')
                account.profile_pic = profile_data.get('profile_pic')
                account.is_verified = profile_data.get('is_verified', False)
                account.is_private = profile_data.get('is_private', False)
                account.metrics = json.dumps({
                    'followers': profile_data.get('followers', 0),
                    'following': profile_data.get('following', 0),
                    'posts': profile_data.get('posts', 0),
                    'engagement_rate': profile_data.get('engagement_rate', 0)
                })
                account.extra_data = json.dumps(profile_data.get('extra_data', {}))
                account.last_updated = datetime.now(timezone.utc)
                
                db.session.commit()
                
                # Generate fresh insights
                insights = apify_service.generate_insights(profile_data)
                
                return jsonify({
                    'success': True,
                    'message': 'Analytics refreshed successfully',
                    'account': account.to_dict(),
                    'analytics': {
                        'metrics': json.loads(account.metrics),
                        'insights': insights
                    },
                    'last_updated': account.last_updated.isoformat()
                })
            else:
                return jsonify({
                    'success': False,
                    'error': result.get('error', 'Failed to refresh data')
                }), 400
        else:
            return jsonify({
                'success': False,
                'error': 'Platform not supported for refresh'
            }), 400
        
    except Exception as e:
        current_app.logger.error(f"Refresh social analytics error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to refresh analytics'}), 500
