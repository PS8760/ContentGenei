#!/usr/bin/env python3
"""
Diagnostic script to check content library and analytics issues
"""

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import User, ContentItem, GeneratedContent
from datetime import datetime, timezone

def diagnose():
    with app.app_context():
        print("="*60)
        print("Content Library & Analytics Diagnostic")
        print("="*60)
        
        # Check users
        print("\n1. USERS IN DATABASE")
        print("-"*60)
        users = User.query.all()
        print(f"Total users: {len(users)}")
        for user in users:
            print(f"  - ID: {user.id}")
            print(f"    Firebase UID: {user.firebase_uid}")
            print(f"    Email: {user.email}")
            print(f"    Content generated count: {user.content_generated_count}")
        
        if not users:
            print("❌ No users found in database!")
            return
        
        # Check each user's content
        for user in users:
            print(f"\n2. CONTENT FOR USER: {user.email}")
            print("-"*60)
            
            # Check content_items (saved content)
            saved_content = ContentItem.query.filter_by(user_id=user.id).all()
            print(f"Saved content (content_items table): {len(saved_content)}")
            if saved_content:
                for item in saved_content[:5]:  # Show first 5
                    print(f"  - ID: {item.id}")
                    print(f"    Title: {item.title}")
                    print(f"    Type: {item.content_type}")
                    print(f"    Status: {item.status}")
                    print(f"    Created: {item.created_at}")
            else:
                print("  ❌ No saved content found!")
            
            # Check generated_content (all generated)
            print(f"\n3. GENERATED CONTENT FOR USER: {user.email}")
            print("-"*60)
            generated_content = GeneratedContent.query.filter_by(user_id=user.id).all()
            print(f"Generated content (generated_content table): {len(generated_content)}")
            if generated_content:
                saved_count = sum(1 for item in generated_content if item.was_saved)
                print(f"  - Total generated: {len(generated_content)}")
                print(f"  - Saved: {saved_count}")
                print(f"  - Not saved: {len(generated_content) - saved_count}")
                
                print("\n  Recent generated content:")
                for item in generated_content[:5]:  # Show first 5
                    print(f"    - ID: {item.id}")
                    print(f"      Type: {item.content_type}")
                    print(f"      Tone: {item.tone}")
                    print(f"      Word count: {item.word_count}")
                    print(f"      Was saved: {item.was_saved}")
                    print(f"      Saved content ID: {item.saved_content_id}")
                    print(f"      Generated: {item.generated_at}")
            else:
                print("  ❌ No generated content found!")
        
        # Check for orphaned content
        print(f"\n4. DATA INTEGRITY CHECK")
        print("-"*60)
        
        # Check if there are content_items without corresponding generated_content
        all_saved = ContentItem.query.all()
        all_generated = GeneratedContent.query.all()
        
        print(f"Total content_items: {len(all_saved)}")
        print(f"Total generated_content: {len(all_generated)}")
        
        # Check for generated content marked as saved but no content_item
        orphaned = [g for g in all_generated if g.was_saved and not g.saved_content_id]
        if orphaned:
            print(f"\n⚠️  Found {len(orphaned)} generated content marked as saved but no saved_content_id:")
            for item in orphaned[:5]:
                print(f"  - ID: {item.id}, Type: {item.content_type}")
        
        # Check for content_items not linked to generated_content
        saved_ids = {item.id for item in all_saved}
        linked_ids = {g.saved_content_id for g in all_generated if g.saved_content_id}
        unlinked = saved_ids - linked_ids
        if unlinked:
            print(f"\n⚠️  Found {len(unlinked)} content_items not linked to generated_content:")
            for content_id in list(unlinked)[:5]:
                item = ContentItem.query.get(content_id)
                if item:
                    print(f"  - ID: {item.id}, Title: {item.title}")
        
        print("\n" + "="*60)
        print("Diagnostic Complete")
        print("="*60)

if __name__ == "__main__":
    diagnose()
