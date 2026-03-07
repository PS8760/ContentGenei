"""
Test ML Prediction Functionality
Tests the ML model training and prediction
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from services.instagram_ml_service import InstagramMLService
from datetime import datetime, timedelta
import random

def create_test_posts(count=15):
    """Create test posts with varied data"""
    posts = []
    base_date = datetime.now() - timedelta(days=30)
    
    media_types = ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM']
    captions = [
        "Check out this amazing view! 🌅 #sunset #nature #photography",
        "New video is live! Link in bio 🎥 What do you think? Comment below!",
        "Swipe to see more ➡️ #carousel #lifestyle #inspo",
        "Quick tip: Always stay positive! 💪 #motivation #mindset",
        "Behind the scenes 🎬 #bts #content #creator",
        "This is a longer caption with more details about the post. It includes multiple sentences and provides context about what's happening in the image. We're testing how caption length affects engagement rates. What are your thoughts on this? Let me know in the comments! #longerpost #engagement #test",
        "Short and sweet ✨",
        "Tutorial time! 📚 Step 1: Do this. Step 2: Do that. Step 3: Success! #tutorial #howto #learn",
        "Throwback to last summer 🏖️ #tbt #memories #summer",
        "Excited to announce something new! Stay tuned 🎉 #announcement #exciting #news"
    ]
    
    for i in range(count):
        post_date = base_date + timedelta(days=i*2, hours=random.randint(8, 22))
        
        posts.append({
            'media_type': random.choice(media_types),
            'caption': random.choice(captions),
            'engagement_rate': round(random.uniform(3.0, 15.0), 2),
            'published_at': post_date,
            'like_count': random.randint(50, 500),
            'comments_count': random.randint(5, 50)
        })
    
    return posts

def test_ml_training():
    """Test ML model training"""
    print("\n" + "="*60)
    print("TEST 1: ML Model Training")
    print("="*60)
    
    # Create test data
    posts = create_test_posts(15)
    print(f"✓ Created {len(posts)} test posts")
    
    # Initialize ML service
    ml_service = InstagramMLService()
    print("✓ ML Service initialized")
    
    # Train model
    print("\nTraining model...")
    result = ml_service.train_engagement_model(posts)
    
    if result['success']:
        print(f"✅ Model trained successfully!")
        print(f"   - R² Score: {result['r2_score']}")
        print(f"   - Training Samples: {result['training_samples']}")
        print(f"   - Feature Importance:")
        for feature, importance in result.get('feature_importance', {}).items():
            print(f"     • {feature}: {importance}")
    else:
        print(f"❌ Training failed: {result.get('error')}")
        return None
    
    return ml_service

def test_ml_prediction(ml_service):
    """Test ML prediction"""
    print("\n" + "="*60)
    print("TEST 2: ML Engagement Prediction")
    print("="*60)
    
    if not ml_service:
        print("❌ No trained model available")
        return
    
    # Test different post scenarios
    test_cases = [
        {
            'name': 'Short Image Post',
            'post': {
                'media_type': 'IMAGE',
                'caption': 'Beautiful sunset 🌅 #nature',
                'published_at': datetime.now().replace(hour=19, minute=0)
            }
        },
        {
            'name': 'Long Video Post with CTA',
            'post': {
                'media_type': 'VIDEO',
                'caption': 'Check out this amazing tutorial! Learn how to create stunning content in just 5 minutes. Comment below if you want more tips like this! Link in bio for full video. #tutorial #howto #learn #content #creator',
                'published_at': datetime.now().replace(hour=12, minute=0)
            }
        },
        {
            'name': 'Carousel with Question',
            'post': {
                'media_type': 'CAROUSEL_ALBUM',
                'caption': 'Swipe to see the transformation! What do you think? 🎨 #beforeafter #art',
                'published_at': datetime.now().replace(hour=20, minute=0)
            }
        }
    ]
    
    for test_case in test_cases:
        print(f"\n📝 Testing: {test_case['name']}")
        print(f"   Caption: {test_case['post']['caption'][:50]}...")
        print(f"   Type: {test_case['post']['media_type']}")
        
        result = ml_service.predict_engagement_ml(test_case['post'])
        
        if result['success']:
            print(f"   ✅ Prediction: {result['predicted_engagement']}%")
            print(f"   📊 Range: {result['confidence_range']['min']}% - {result['confidence_range']['max']}%")
            print(f"   💡 Recommendation: {result['recommendation']}")
        else:
            print(f"   ❌ Prediction failed: {result.get('error')}")

def test_insufficient_data():
    """Test with insufficient data"""
    print("\n" + "="*60)
    print("TEST 3: Insufficient Data Handling")
    print("="*60)
    
    # Create only 5 posts (less than required 10)
    posts = create_test_posts(5)
    print(f"✓ Created {len(posts)} test posts (below minimum)")
    
    ml_service = InstagramMLService()
    result = ml_service.train_engagement_model(posts)
    
    if not result['success']:
        print(f"✅ Correctly rejected: {result['error']}")
    else:
        print(f"❌ Should have rejected insufficient data")

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("INSTAGRAM ML PREDICTION TEST SUITE")
    print("="*60)
    
    try:
        # Test 1: Training
        ml_service = test_ml_training()
        
        # Test 2: Prediction
        test_ml_prediction(ml_service)
        
        # Test 3: Error handling
        test_insufficient_data()
        
        print("\n" + "="*60)
        print("✅ ALL TESTS COMPLETED")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
