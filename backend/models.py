from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
import uuid
import json

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    firebase_uid = db.Column(db.String(128), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    display_name = db.Column(db.String(100), nullable=True)
    photo_url = db.Column(db.String(500), nullable=True)
    provider = db.Column(db.String(50), nullable=False, default='email')  # email, google
    is_active = db.Column(db.Boolean, default=True)
    is_premium = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_login = db.Column(db.DateTime, nullable=True)
    
    # Usage tracking
    content_generated_count = db.Column(db.Integer, default=0)
    monthly_content_limit = db.Column(db.Integer, default=500)  # Increased from 50 to 500 for generous free tier
    
    # Relationships
    content_items = db.relationship('ContentItem', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    analytics = db.relationship('Analytics', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'firebase_uid': self.firebase_uid,
            'email': self.email,
            'display_name': self.display_name,
            'photo_url': self.photo_url,
            'provider': self.provider,
            'is_active': self.is_active,
            'is_premium': self.is_premium,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'content_generated_count': self.content_generated_count,
            'monthly_content_limit': self.monthly_content_limit
        }

class ContentItem(db.Model):
    __tablename__ = 'content_items'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Content details
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    content_type = db.Column(db.String(50), nullable=False)  # article, social-post, email, blog, caption, script, ad-copy
    tone = db.Column(db.String(50), nullable=False)  # professional, casual, friendly, formal, creative, persuasive, informative, conversational
    prompt = db.Column(db.Text, nullable=False)
    
    # Metadata
    word_count = db.Column(db.Integer, default=0)
    character_count = db.Column(db.Integer, default=0)
    tags = db.Column(db.Text, nullable=True)  # JSON array of tags
    
    # Status and workflow
    status = db.Column(db.String(20), default='draft')  # draft, published, archived
    is_favorite = db.Column(db.Boolean, default=False)
    
    # AI generation details
    ai_model_used = db.Column(db.String(50), nullable=True)
    generation_time = db.Column(db.Float, nullable=True)  # Time taken to generate in seconds
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    published_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    analytics = db.relationship('Analytics', backref='content_item', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'content': self.content,
            'content_type': self.content_type,
            'tone': self.tone,
            'prompt': self.prompt,
            'word_count': self.word_count,
            'character_count': self.character_count,
            'tags': json.loads(self.tags) if self.tags else [],
            'status': self.status,
            'is_favorite': self.is_favorite,
            'ai_model_used': self.ai_model_used,
            'generation_time': self.generation_time,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'published_at': self.published_at.isoformat() if self.published_at else None
        }

class Analytics(db.Model):
    __tablename__ = 'analytics'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    content_item_id = db.Column(db.String(36), db.ForeignKey('content_items.id'), nullable=True, index=True)
    
    # Metrics
    metric_type = db.Column(db.String(50), nullable=False)  # views, clicks, shares, likes, comments, engagement_rate
    metric_value = db.Column(db.Float, nullable=False, default=0)
    
    # Platform and source
    platform = db.Column(db.String(50), nullable=True)  # facebook, twitter, linkedin, instagram, email, website
    source = db.Column(db.String(100), nullable=True)  # organic, paid, referral
    
    # Time-based data
    date = db.Column(db.Date, nullable=False, default=lambda: datetime.now(timezone.utc).date(), index=True)
    hour = db.Column(db.Integer, nullable=True)  # 0-23 for hourly analytics
    
    # Additional metadata
    extra_data = db.Column(db.Text, nullable=True)  # JSON for additional data
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'content_item_id': self.content_item_id,
            'metric_type': self.metric_type,
            'metric_value': self.metric_value,
            'platform': self.platform,
            'source': self.source,
            'date': self.date.isoformat() if self.date else None,
            'hour': self.hour,
            'extra_data': json.loads(self.extra_data) if self.extra_data else {},
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ContentTemplate(db.Model):
    __tablename__ = 'content_templates'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    content_type = db.Column(db.String(50), nullable=False)
    template = db.Column(db.Text, nullable=False)
    variables = db.Column(db.Text, nullable=True)  # JSON array of template variables
    is_active = db.Column(db.Boolean, default=True)
    usage_count = db.Column(db.Integer, default=0)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'content_type': self.content_type,
            'template': self.template,
            'variables': json.loads(self.variables) if self.variables else [],
            'is_active': self.is_active,
            'usage_count': self.usage_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class UserSession(db.Model):
    __tablename__ = 'user_sessions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    session_token = db.Column(db.String(255), nullable=False, unique=True, index=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = db.Column(db.DateTime, nullable=False)
    last_activity = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'ip_address': self.ip_address,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'last_activity': self.last_activity.isoformat() if self.last_activity else None
        }

class TeamMember(db.Model):
    __tablename__ = 'team_members'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    member_email = db.Column(db.String(120), nullable=False, index=True)
    member_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True, index=True)  # Null until user accepts
    role = db.Column(db.String(20), default='member')  # owner, admin, member
    status = db.Column(db.String(20), default='pending')  # pending, active, inactive
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        return {
            'id': self.id,
            'owner_id': self.owner_id,
            'member_email': self.member_email,
            'member_id': self.member_id,
            'role': self.role,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class TeamProject(db.Model):
    __tablename__ = 'team_projects'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='active')  # active, archived, completed
    members = db.Column(db.Text, nullable=True)  # JSON array of member IDs
    content_count = db.Column(db.Integer, default=0)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        return {
            'id': self.id,
            'owner_id': self.owner_id,
            'name': self.name,
            'description': self.description,
            'status': self.status,
            'members': json.loads(self.members) if self.members else [],
            'content_count': self.content_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class CollaborationRequest(db.Model):
    __tablename__ = 'collaboration_requests'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    from_user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    to_email = db.Column(db.String(120), nullable=False, index=True)
    to_user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True, index=True)  # Set when recipient is found
    message = db.Column(db.Text, nullable=True)
    request_type = db.Column(db.String(20), default='join_team')  # join_team, project_invite
    project_id = db.Column(db.String(36), db.ForeignKey('team_projects.id'), nullable=True)
    status = db.Column(db.String(20), default='pending')  # pending, accepted, rejected, expired
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    responded_at = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'from_user_id': self.from_user_id,
            'to_email': self.to_email,
            'to_user_id': self.to_user_id,
            'message': self.message,
            'request_type': self.request_type,
            'project_id': self.project_id,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'responded_at': self.responded_at.isoformat() if self.responded_at else None
        }

class TeamChat(db.Model):
    __tablename__ = 'team_chats'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    receiver_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'receiver_id': self.receiver_id,
            'message': self.message,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }