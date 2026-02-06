#!/usr/bin/env python3
"""
Database initialization script for ContentGenie
"""

from app import create_app
from models import db, User, ContentItem, Analytics, ContentTemplate, UserSession
from services.analytics_service import AnalyticsService
import os
from datetime import datetime, timezone

def init_database():
    """Initialize the database with tables and sample data"""
    app = create_app()
    
    with app.app_context():
        print("🗄️  Initializing ContentGenie database...")
        
        # Create all tables
        db.create_all()
        print("✅ Database tables created successfully")
        
        # Create sample content templates
        create_sample_templates()
        print("✅ Sample content templates created")
        
        print("🎉 Database initialization completed!")
        print("\n📋 Next steps:")
        print("1. Set up your environment variables in .env file")
        print("2. Configure Firebase credentials")
        print("3. Add OpenAI API key for AI content generation")
        print("4. Start the development server: python app.py")

def create_sample_templates():
    """Create sample content templates"""
    templates = [
        {
            'name': 'Blog Post Introduction',
            'description': 'Professional blog post introduction template',
            'content_type': 'blog',
            'template': '# {title}\n\nIn today\'s rapidly evolving {industry}, {topic} has become increasingly important. This comprehensive guide explores {main_points} and provides actionable insights for {target_audience}.\n\n## What You\'ll Learn\n\n{learning_objectives}',
            'variables': ['title', 'industry', 'topic', 'main_points', 'target_audience', 'learning_objectives']
        },
        {
            'name': 'Social Media Announcement',
            'description': 'Engaging social media announcement template',
            'content_type': 'social-post',
            'template': '🚀 Exciting news! {announcement}\n\n{details}\n\n✨ Key highlights:\n{highlights}\n\nWhat do you think? Share your thoughts below! 👇\n\n{hashtags}',
            'variables': ['announcement', 'details', 'highlights', 'hashtags']
        },
        {
            'name': 'Email Newsletter',
            'description': 'Professional email newsletter template',
            'content_type': 'email',
            'template': 'Subject: {subject}\n\nHi {name},\n\n{opening}\n\n{main_content}\n\n{call_to_action}\n\nBest regards,\n{sender_name}',
            'variables': ['subject', 'name', 'opening', 'main_content', 'call_to_action', 'sender_name']
        },
        {
            'name': 'Product Description',
            'description': 'Compelling product description template',
            'content_type': 'ad-copy',
            'template': '✨ {product_name}\n\n{problem_statement}\n\nIntroducing {product_name} - {solution_description}\n\n🎯 Key Benefits:\n{benefits}\n\n💡 Perfect for: {target_audience}\n\n{call_to_action}',
            'variables': ['product_name', 'problem_statement', 'solution_description', 'benefits', 'target_audience', 'call_to_action']
        },
        {
            'name': 'How-To Article',
            'description': 'Step-by-step how-to article template',
            'content_type': 'article',
            'template': '# How to {task}\n\n{introduction}\n\n## What You\'ll Need\n\n{requirements}\n\n## Step-by-Step Guide\n\n{steps}\n\n## Tips for Success\n\n{tips}\n\n## Conclusion\n\n{conclusion}',
            'variables': ['task', 'introduction', 'requirements', 'steps', 'tips', 'conclusion']
        }
    ]
    
    for template_data in templates:
        # Check if template already exists
        existing = ContentTemplate.query.filter_by(name=template_data['name']).first()
        if not existing:
            template = ContentTemplate(
                name=template_data['name'],
                description=template_data['description'],
                content_type=template_data['content_type'],
                template=template_data['template'],
                variables=str(template_data['variables'])  # Convert to JSON string
            )
            db.session.add(template)
    
    db.session.commit()

if __name__ == '__main__':
    init_database()