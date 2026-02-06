from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User
from services.analytics_service import AnalyticsService
from datetime import datetime, timezone

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