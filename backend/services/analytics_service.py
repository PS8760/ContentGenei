from datetime import datetime, timedelta, timezone
from sqlalchemy import func, and_, or_
from models import db, Analytics, ContentItem, User
from typing import Dict, List, Any, Optional
import json

class AnalyticsService:
    
    @staticmethod
    def record_metric(user_id: str, metric_type: str, metric_value: float, 
                     content_item_id: Optional[str] = None, platform: Optional[str] = None,
                     source: Optional[str] = None, extra_data: Optional[Dict] = None) -> bool:
        """Record a new analytics metric"""
        try:
            analytics_entry = Analytics(
                user_id=user_id,
                content_item_id=content_item_id,
                metric_type=metric_type,
                metric_value=metric_value,
                platform=platform,
                source=source,
                extra_data=json.dumps(extra_data) if extra_data else None,
                date=datetime.now(timezone.utc).date(),
                hour=datetime.now(timezone.utc).hour
            )
            
            db.session.add(analytics_entry)
            db.session.commit()
            return True
            
        except Exception as e:
            db.session.rollback()
            return False
    
    @staticmethod
    def get_user_overview(user_id: str, days: int = 30) -> Dict[str, Any]:
        """Get user analytics overview for the specified number of days"""
        end_date = datetime.now(timezone.utc).date()
        start_date = end_date - timedelta(days=days)
        
        # Total content created
        total_content = ContentItem.query.filter_by(user_id=user_id).count()
        
        # Content created in period
        period_content = ContentItem.query.filter(
            and_(
                ContentItem.user_id == user_id,
                ContentItem.created_at >= start_date,
                ContentItem.created_at <= end_date
            )
        ).count()
        
        # Total views
        total_views = db.session.query(func.sum(Analytics.metric_value)).filter(
            and_(
                Analytics.user_id == user_id,
                Analytics.metric_type == 'views',
                Analytics.date >= start_date,
                Analytics.date <= end_date
            )
        ).scalar() or 0
        
        # Average engagement rate
        avg_engagement = db.session.query(func.avg(Analytics.metric_value)).filter(
            and_(
                Analytics.user_id == user_id,
                Analytics.metric_type == 'engagement_rate',
                Analytics.date >= start_date,
                Analytics.date <= end_date
            )
        ).scalar() or 0
        
        # Total read time
        total_read_time = db.session.query(func.sum(Analytics.metric_value)).filter(
            and_(
                Analytics.user_id == user_id,
                Analytics.metric_type == 'read_time',
                Analytics.date >= start_date,
                Analytics.date <= end_date
            )
        ).scalar() or 0
        
        # Calculate average read time
        avg_read_time = total_read_time / max(total_views, 1) if total_views > 0 else 0
        
        # Previous period comparison
        prev_start_date = start_date - timedelta(days=days)
        prev_end_date = start_date
        
        prev_views = db.session.query(func.sum(Analytics.metric_value)).filter(
            and_(
                Analytics.user_id == user_id,
                Analytics.metric_type == 'views',
                Analytics.date >= prev_start_date,
                Analytics.date < prev_end_date
            )
        ).scalar() or 0
        
        prev_content = ContentItem.query.filter(
            and_(
                ContentItem.user_id == user_id,
                ContentItem.created_at >= prev_start_date,
                ContentItem.created_at < prev_end_date
            )
        ).count()
        
        # Calculate changes
        views_change = ((total_views - prev_views) / max(prev_views, 1)) * 100 if prev_views > 0 else 0
        content_change = ((period_content - prev_content) / max(prev_content, 1)) * 100 if prev_content > 0 else 0
        
        return {
            'total_content': total_content,
            'period_content': period_content,
            'total_views': int(total_views),
            'avg_engagement_rate': round(avg_engagement, 2),
            'avg_read_time': round(avg_read_time, 2),
            'views_change': round(views_change, 1),
            'content_change': round(content_change, 1),
            'engagement_change': 0,  # Placeholder for engagement change calculation
            'read_time_change': 0   # Placeholder for read time change calculation
        }
    
    @staticmethod
    def get_content_performance(user_id: str, days: int = 30, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top performing content for user"""
        end_date = datetime.now(timezone.utc).date()
        start_date = end_date - timedelta(days=days)
        
        # Query to get content with their analytics - simplified approach
        content_performance = db.session.query(
            ContentItem.id,
            ContentItem.title,
            ContentItem.content_type,
            ContentItem.created_at,
            func.coalesce(
                func.sum(Analytics.metric_value).filter(Analytics.metric_type == 'views'),
                0
            ).label('total_views'),
            func.avg(Analytics.metric_value).filter(Analytics.metric_type == 'engagement_rate').label('avg_engagement')
        ).outerjoin(
            Analytics, 
            and_(
                ContentItem.id == Analytics.content_item_id,
                Analytics.date >= start_date,
                Analytics.date <= end_date
            )
        ).filter(
            ContentItem.user_id == user_id
        ).group_by(
            ContentItem.id, ContentItem.title, ContentItem.content_type, ContentItem.created_at
        ).order_by(
            func.coalesce(
                func.sum(Analytics.metric_value).filter(Analytics.metric_type == 'views'),
                0
            ).desc()
        ).limit(limit).all()
        
        return [
            {
                'id': item.id,
                'title': item.title,
                'content_type': item.content_type,
                'created_at': item.created_at.isoformat() if item.created_at else None,
                'total_views': int(item.total_views or 0),
                'avg_engagement': round(item.avg_engagement or 0, 2)
            }
            for item in content_performance
        ]
    
    @staticmethod
    def get_content_type_distribution(user_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """Get distribution of content types created by user"""
        end_date = datetime.now(timezone.utc).date()
        start_date = end_date - timedelta(days=days)
        
        distribution = db.session.query(
            ContentItem.content_type,
            func.count(ContentItem.id).label('count')
        ).filter(
            and_(
                ContentItem.user_id == user_id,
                ContentItem.created_at >= start_date,
                ContentItem.created_at <= end_date
            )
        ).group_by(ContentItem.content_type).all()
        
        total_count = sum(item.count for item in distribution)
        
        return [
            {
                'content_type': item.content_type,
                'count': item.count,
                'percentage': round((item.count / max(total_count, 1)) * 100, 1)
            }
            for item in distribution
        ]
    
    @staticmethod
    def get_daily_metrics(user_id: str, days: int = 30) -> Dict[str, List[Dict[str, Any]]]:
        """Get daily metrics for charts"""
        end_date = datetime.now(timezone.utc).date()
        start_date = end_date - timedelta(days=days)
        
        # Views by day
        daily_views = db.session.query(
            Analytics.date,
            func.sum(Analytics.metric_value).label('total_views')
        ).filter(
            and_(
                Analytics.user_id == user_id,
                Analytics.metric_type == 'views',
                Analytics.date >= start_date,
                Analytics.date <= end_date
            )
        ).group_by(Analytics.date).order_by(Analytics.date).all()
        
        # Content created by day
        daily_content = db.session.query(
            func.date(ContentItem.created_at).label('date'),
            func.count(ContentItem.id).label('count')
        ).filter(
            and_(
                ContentItem.user_id == user_id,
                ContentItem.created_at >= start_date,
                ContentItem.created_at <= end_date
            )
        ).group_by(func.date(ContentItem.created_at)).order_by(func.date(ContentItem.created_at)).all()
        
        # Engagement by day
        daily_engagement = db.session.query(
            Analytics.date,
            func.avg(Analytics.metric_value).label('avg_engagement')
        ).filter(
            and_(
                Analytics.user_id == user_id,
                Analytics.metric_type == 'engagement_rate',
                Analytics.date >= start_date,
                Analytics.date <= end_date
            )
        ).group_by(Analytics.date).order_by(Analytics.date).all()
        
        return {
            'views': [
                {
                    'date': item.date.isoformat(),
                    'value': int(item.total_views)
                }
                for item in daily_views
            ],
            'content_created': [
                {
                    'date': item.date.isoformat(),
                    'value': item.count
                }
                for item in daily_content
            ],
            'engagement': [
                {
                    'date': item.date.isoformat(),
                    'value': round(item.avg_engagement, 2)
                }
                for item in daily_engagement
            ]
        }
    
    @staticmethod
    def get_platform_performance(user_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """Get performance metrics by platform"""
        end_date = datetime.now(timezone.utc).date()
        start_date = end_date - timedelta(days=days)
        
        platform_metrics = db.session.query(
            Analytics.platform,
            func.coalesce(
                func.sum(Analytics.metric_value).filter(Analytics.metric_type == 'views'),
                0
            ).label('total_views'),
            func.avg(Analytics.metric_value).filter(Analytics.metric_type == 'engagement_rate').label('avg_engagement'),
            func.coalesce(
                func.sum(Analytics.metric_value).filter(Analytics.metric_type == 'clicks'),
                0
            ).label('total_clicks')
        ).filter(
            and_(
                Analytics.user_id == user_id,
                Analytics.date >= start_date,
                Analytics.date <= end_date,
                Analytics.platform.isnot(None)
            )
        ).group_by(Analytics.platform).all()
        
        return [
            {
                'platform': item.platform,
                'total_views': int(item.total_views),
                'avg_engagement': round(item.avg_engagement or 0, 2),
                'total_clicks': int(item.total_clicks)
            }
            for item in platform_metrics
        ]
    
    @staticmethod
    def generate_sample_data(user_id: str, days: int = 30):
        """Generate sample analytics data for demonstration"""
        import random
        from datetime import date
        
        end_date = datetime.now(timezone.utc).date()
        start_date = end_date - timedelta(days=days)
        
        # Get user's content items
        content_items = ContentItem.query.filter_by(user_id=user_id).all()
        
        if not content_items:
            return
        
        platforms = ['facebook', 'twitter', 'linkedin', 'instagram', 'email', 'website']
        sources = ['organic', 'paid', 'referral', 'direct']
        
        current_date = start_date
        while current_date <= end_date:
            for content_item in content_items[:5]:  # Limit to first 5 items
                # Generate views
                views = random.randint(10, 500)
                AnalyticsService.record_metric(
                    user_id=user_id,
                    content_item_id=content_item.id,
                    metric_type='views',
                    metric_value=views,
                    platform=random.choice(platforms),
                    source=random.choice(sources)
                )
                
                # Generate engagement rate
                engagement_rate = random.uniform(2.0, 15.0)
                AnalyticsService.record_metric(
                    user_id=user_id,
                    content_item_id=content_item.id,
                    metric_type='engagement_rate',
                    metric_value=engagement_rate,
                    platform=random.choice(platforms),
                    source=random.choice(sources)
                )
                
                # Generate clicks
                clicks = random.randint(1, int(views * 0.1))
                AnalyticsService.record_metric(
                    user_id=user_id,
                    content_item_id=content_item.id,
                    metric_type='clicks',
                    metric_value=clicks,
                    platform=random.choice(platforms),
                    source=random.choice(sources)
                )
                
                # Generate read time
                read_time = random.uniform(30, 300)  # 30 seconds to 5 minutes
                AnalyticsService.record_metric(
                    user_id=user_id,
                    content_item_id=content_item.id,
                    metric_type='read_time',
                    metric_value=read_time,
                    platform=random.choice(platforms),
                    source=random.choice(sources)
                )
            
            current_date += timedelta(days=1)