from models import db
from datetime import datetime, timezone, timedelta
import uuid
import json

class LinkedInConnection(db.Model):
    __tablename__ = 'linkedin_connections'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    
    # LinkedIn account details
    linkedin_user_id = db.Column(db.String(255), nullable=False)
    linkedin_name = db.Column(db.String(255), nullable=False)
    linkedin_email = db.Column(db.String(255), nullable=True)
    
    # OAuth tokens
    access_token = db.Column(db.Text, nullable=False)
    token_expires_at = db.Column(db.DateTime, nullable=True)
    
    # Profile information
    profile_picture_url = db.Column(db.String(500), nullable=True)
    headline = db.Column(db.String(500), nullable=True)
    connections_count = db.Column(db.Integer, default=0)
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    last_synced_at = db.Column(db.DateTime, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), 
                          onupdate=lambda: datetime.now(timezone.utc))
    
    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('user_id', 'linkedin_user_id', name='unique_linkedin_connection'),
    )
    
    # Relationships
    posts = db.relationship('LinkedInPost', backref='connection', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self, include_token=False):
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'linkedin_user_id': self.linkedin_user_id,
            'linkedin_name': self.linkedin_name,
            'linkedin_email': self.linkedin_email,
            'profile_picture_url': self.profile_picture_url,
            'headline': self.headline,
            'connections_count': self.connections_count,
            'is_active': self.is_active,
            'last_synced_at': self.last_synced_at.isoformat() if self.last_synced_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'token_expires_at': self.token_expires_at.isoformat() if self.token_expires_at else None
        }
        
        if include_token:
            data['access_token'] = self.access_token
        
        return data


class LinkedInPost(db.Model):
    __tablename__ = 'linkedin_posts'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    connection_id = db.Column(db.String(36), db.ForeignKey('linkedin_connections.id'), nullable=False, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    
    # LinkedIn post details
    linkedin_post_id = db.Column(db.String(255), nullable=False, unique=True, index=True)
    post_text = db.Column(db.Text, nullable=True)
    post_url = db.Column(db.String(500), nullable=True)
    
    # Media
    media_type = db.Column(db.String(50), nullable=True)  # ARTICLE, IMAGE, VIDEO, etc.
    media_url = db.Column(db.String(500), nullable=True)
    thumbnail_url = db.Column(db.String(500), nullable=True)
    
    # Engagement metrics
    likes_count = db.Column(db.Integer, default=0)
    comments_count = db.Column(db.Integer, default=0)
    shares_count = db.Column(db.Integer, default=0)
    impressions_count = db.Column(db.Integer, default=0)
    
    # Post metadata
    published_at = db.Column(db.DateTime, nullable=True)
    visibility = db.Column(db.String(50), nullable=True)  # PUBLIC, CONNECTIONS, etc.
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), 
                          onupdate=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        return {
            'id': self.id,
            'connection_id': self.connection_id,
            'user_id': self.user_id,
            'linkedin_post_id': self.linkedin_post_id,
            'post_text': self.post_text,
            'post_url': self.post_url,
            'media_type': self.media_type,
            'media_url': self.media_url,
            'thumbnail_url': self.thumbnail_url,
            'likes_count': self.likes_count,
            'comments_count': self.comments_count,
            'shares_count': self.shares_count,
            'impressions_count': self.impressions_count,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'visibility': self.visibility,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
