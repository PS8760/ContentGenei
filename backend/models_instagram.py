from models import db
from datetime import datetime, timezone
import uuid
import json

class InstagramConnection(db.Model):
    __tablename__ = 'instagram_connections'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Instagram account details
    instagram_user_id = db.Column(db.String(255), nullable=False)
    instagram_username = db.Column(db.String(255), nullable=False)
    instagram_account_type = db.Column(db.String(50), nullable=True)  # BUSINESS, CREATOR, PERSONAL
    
    # OAuth tokens (encrypted in production)
    access_token = db.Column(db.Text, nullable=False)
    token_expires_at = db.Column(db.DateTime, nullable=True)
    
    # Profile information
    profile_picture_url = db.Column(db.String(500), nullable=True)
    followers_count = db.Column(db.Integer, default=0)
    follows_count = db.Column(db.Integer, default=0)
    media_count = db.Column(db.Integer, default=0)
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    last_synced_at = db.Column(db.DateTime, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('user_id', 'instagram_user_id', name='unique_instagram_connection'),
    )
    
    # Relationships
    posts = db.relationship('InstagramPost', backref='connection', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self, include_token=False):
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'instagram_user_id': self.instagram_user_id,
            'instagram_username': self.instagram_username,
            'instagram_account_type': self.instagram_account_type,
            'profile_picture_url': self.profile_picture_url,
            'followers_count': self.followers_count,
            'follows_count': self.follows_count,
            'media_count': self.media_count,
            'is_active': self.is_active,
            'last_synced_at': self.last_synced_at.isoformat() if self.last_synced_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'token_expires_at': self.token_expires_at.isoformat() if self.token_expires_at else None
        }
        
        if include_token:
            data['access_token'] = self.access_token
        
        return data


class InstagramPost(db.Model):
    __tablename__ = 'instagram_posts'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    connection_id = db.Column(db.String(36), db.ForeignKey('instagram_connections.id'), nullable=False, index=True)
    
    # Instagram post details
    instagram_post_id = db.Column(db.String(255), nullable=False, unique=True)
    media_type = db.Column(db.String(50), nullable=True)  # IMAGE, VIDEO, CAROUSEL_ALBUM, REELS
    media_url = db.Column(db.String(500), nullable=True)
    permalink = db.Column(db.String(500), nullable=True)
    caption = db.Column(db.Text, nullable=True)
    
    # Engagement metrics
    like_count = db.Column(db.Integer, default=0)
    comments_count = db.Column(db.Integer, default=0)
    shares_count = db.Column(db.Integer, default=0)
    saves_count = db.Column(db.Integer, default=0)
    reach = db.Column(db.Integer, default=0)
    impressions = db.Column(db.Integer, default=0)
    engagement_rate = db.Column(db.Float, default=0.0)
    
    # Performance flags
    is_underperforming = db.Column(db.Boolean, default=False, index=True)
    performance_score = db.Column(db.Float, default=0.0)
    
    # AI suggestions
    ai_suggestions = db.Column(db.Text, nullable=True)  # JSON array of suggestions
    suggestions_generated_at = db.Column(db.DateTime, nullable=True)
    
    # Timestamps
    published_at = db.Column(db.DateTime, nullable=True, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'connection_id': self.connection_id,
            'instagram_post_id': self.instagram_post_id,
            'media_type': self.media_type,
            'media_url': self.media_url,
            'permalink': self.permalink,
            'caption': self.caption,
            'like_count': self.like_count,
            'comments_count': self.comments_count,
            'shares_count': self.shares_count,
            'saves_count': self.saves_count,
            'reach': self.reach,
            'impressions': self.impressions,
            'engagement_rate': self.engagement_rate,
            'is_underperforming': self.is_underperforming,
            'performance_score': self.performance_score,
            'ai_suggestions': json.loads(self.ai_suggestions) if self.ai_suggestions else [],
            'suggestions_generated_at': self.suggestions_generated_at.isoformat() if self.suggestions_generated_at else None,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class InstagramCompetitor(db.Model):
    __tablename__ = 'instagram_competitors'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Competitor details
    instagram_username = db.Column(db.String(255), nullable=False)
    instagram_user_id = db.Column(db.String(255), nullable=True)
    
    # Profile metrics
    followers_count = db.Column(db.Integer, default=0)
    follows_count = db.Column(db.Integer, default=0)
    media_count = db.Column(db.Integer, default=0)
    avg_likes = db.Column(db.Float, default=0.0)
    avg_comments = db.Column(db.Float, default=0.0)
    avg_engagement_rate = db.Column(db.Float, default=0.0)
    posting_frequency = db.Column(db.Float, default=0.0)  # posts per week
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    last_analyzed_at = db.Column(db.DateTime, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('user_id', 'instagram_username', name='unique_competitor'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'instagram_username': self.instagram_username,
            'instagram_user_id': self.instagram_user_id,
            'followers_count': self.followers_count,
            'follows_count': self.follows_count,
            'media_count': self.media_count,
            'avg_likes': self.avg_likes,
            'avg_comments': self.avg_comments,
            'avg_engagement_rate': self.avg_engagement_rate,
            'posting_frequency': self.posting_frequency,
            'is_active': self.is_active,
            'last_analyzed_at': self.last_analyzed_at.isoformat() if self.last_analyzed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
