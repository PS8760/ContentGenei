"""
Test script for ML features
Run this to verify all ML features are working correctly
"""

from services.instagram_ml_service import InstagramMLService
from datetime import datetime, timedelta
import json

def create_sample_posts(count=20):
    """Create sample posts for testing"""
    posts = []
    for i in range(count):
        posts.append({
            'media_type': ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'][i % 3],
            'caption': f'Sample caption {i} with #hashtag and emoji 🔥' * (1 + i % 3),
            'engagement_rate': 3 + (i % 10),
            'published_at': datetime.now() - timedelta(days=i),
            'like_count': 100 + i * 10,
            'comments_count': 10 + i * 2
        })
    return posts

def create_sample_comments(count=50):
    """Create sample comments for testing"""
    comments = [
        {'text': 'Love this! So helpful 😍'},
        {'text': 'This is amazing! How did you do this?'},
        {'text': 'Great content, keep it up!'},
        {'text': 'I learned so much from this'},
        {'text': 'Can you share more tips?'},
        {'text': 'This changed my perspective'},
        {'text': 'Wow, mind-blowing! 🤯'},
        {'text': 'I need to try this ASAP'},
        {'text': 'Everyone should see this'},
        {'text': 'This is exactly what I needed'},
    ] * 5
    return comments[:count]

def test_pattern_recognition():
    """Test pattern recognition feature"""
    print("\n" + "="*60)
    print("TEST 1: PATTERN RECOGNITION")
    print("="*60)
    
    ml_service = InstagramMLService()
    posts = create_sample_posts(25)
    
    result = ml_service.analyze_patterns(posts)
    
    if result['success']:
        print("✅ Pattern Recognition: SUCCESS")
        print(f"\nOptimal Caption Length: {result['patterns']['caption_length']['optimal_length']} chars")
        print(f"Correlation: {result['patterns']['caption_length']['correlation']}")
        print(f"Confidence: {result['patterns']['caption_length']['confidence']}")
        
        print(f"\nBest Posting Hours: {result['patterns']['posting_time']['best_hours']}")
        print(f"Best Days: {result['patterns']['posting_time']['best_days']}")
        
        print(f"\nBest Format: {result['patterns']['format']['best_format']}")
        print(f"Avg Engagement: {result['patterns']['format']['avg_engagement']}%")
        
        print(f"\nRecommendations: {len(result['recommendations'])}")
        for rec in result['recommendations']:
            print(f"  - {rec['recommendation']} (Expected: {rec['expected_impact']})")
    else:
        print(f"❌ Pattern Recognition: FAILED - {result.get('error')}")
    
    return result['success']

def test_sentiment_analysis():
    """Test sentiment analysis feature"""
    print("\n" + "="*60)
    print("TEST 2: SENTIMENT ANALYSIS")
    print("="*60)
    
    ml_service = InstagramMLService()
    comments = create_sample_comments(50)
    
    result = ml_service.analyze_sentiment(comments)
    
    if result['success']:
        print("✅ Sentiment Analysis: SUCCESS")
        print(f"\nOverall Sentiment:")
        print(f"  Positive: {result['overall_sentiment']['positive']}%")
        print(f"  Neutral: {result['overall_sentiment']['neutral']}%")
        print(f"  Negative: {result['overall_sentiment']['negative']}%")
        
        print(f"\nDominant Sentiment: {result['dominant_sentiment']}")
        
        print(f"\nTop Emotions:")
        for emotion, count in list(result['emotions'].items())[:3]:
            print(f"  - {emotion}: {count}")
        
        print(f"\nTop Triggers:")
        for trigger in result['top_triggers'][:3]:
            print(f"  - {trigger['trigger']}: {trigger['count']} mentions")
        
        print(f"\nInsights:")
        for insight in result['insights']:
            print(f"  - {insight}")
    else:
        print(f"❌ Sentiment Analysis: FAILED - {result.get('error')}")
    
    return result['success']

def test_ml_model():
    """Test ML model training and prediction"""
    print("\n" + "="*60)
    print("TEST 3: ML MODEL TRAINING & PREDICTION")
    print("="*60)
    
    ml_service = InstagramMLService()
    posts = create_sample_posts(30)
    
    # Train model
    train_result = ml_service.train_engagement_model(posts)
    
    if train_result['success']:
        print("✅ Model Training: SUCCESS")
        print(f"\nR² Score: {train_result['r2_score']}")
        print(f"Training Samples: {train_result['training_samples']}")
        print(f"\nFeature Importance:")
        for feature, importance in list(train_result['feature_importance'].items())[:5]:
            print(f"  - {feature}: {importance}")
        
        # Test prediction
        test_post = {
            'media_type': 'CAROUSEL_ALBUM',
            'caption': 'Check out these 5 tips for better engagement! 🔥 #instagram #tips #socialmedia',
            'published_at': datetime.now()
        }
        
        pred_result = ml_service.predict_engagement_ml(test_post)
        
        if pred_result['success']:
            print("\n✅ ML Prediction: SUCCESS")
            print(f"\nPredicted Engagement: {pred_result['predicted_engagement']}%")
            print(f"Confidence Range: {pred_result['confidence_range']['min']}% - {pred_result['confidence_range']['max']}%")
            print(f"Recommendation: {pred_result['recommendation']}")
        else:
            print(f"❌ ML Prediction: FAILED - {pred_result.get('error')}")
            return False
    else:
        print(f"❌ Model Training: FAILED - {train_result.get('error')}")
        return False
    
    return True

def test_optimal_timing():
    """Test optimal posting time recommendation"""
    print("\n" + "="*60)
    print("TEST 4: OPTIMAL POSTING TIME")
    print("="*60)
    
    ml_service = InstagramMLService()
    posts = create_sample_posts(25)
    
    target_date = datetime.now() + timedelta(days=3)
    result = ml_service.recommend_optimal_posting_time(posts, target_date)
    
    if result['success']:
        print("✅ Optimal Timing: SUCCESS")
        print(f"\nTarget Date: {result['target_date']}")
        print(f"Day of Week: {result['day_of_week']}")
        print(f"Best Time: {result['best_time']}")
        print(f"Confidence: {result['confidence']}")
        
        print(f"\nTop 3 Recommendations:")
        for i, rec in enumerate(result['recommendations'][:3], 1):
            print(f"  {i}. {rec['time']} - Expected: {rec['expected_engagement']}% ({rec['confidence']} confidence)")
            print(f"     Reason: {rec['reason']}")
    else:
        print(f"❌ Optimal Timing: FAILED - {result.get('error')}")
    
    return result['success']

def test_cross_platform():
    """Test cross-platform analysis"""
    print("\n" + "="*60)
    print("TEST 5: CROSS-PLATFORM ANALYSIS")
    print("="*60)
    
    ml_service = InstagramMLService()
    instagram_posts = create_sample_posts(28)
    
    result = ml_service.analyze_cross_platform_performance(instagram_posts)
    
    if result['success']:
        print("✅ Cross-Platform Analysis: SUCCESS")
        print(f"\nTotal Posts: {result['total_posts']}")
        print(f"Cross-Platform Ready: {result['cross_platform_ready']}")
        
        print(f"\nInstagram Stats:")
        ig_stats = result['platforms']['instagram']
        print(f"  Posts: {ig_stats['posts']}")
        print(f"  Avg Engagement: {ig_stats['avg_engagement']:.2f}%")
        print(f"  Best Format: {ig_stats['best_format']}")
        
        print(f"\nSupported Platforms: {', '.join(result['supported_platforms'])}")
        print(f"Next Platform Recommendation: {result['next_platform_recommendation']}")
    else:
        print(f"❌ Cross-Platform Analysis: FAILED - {result.get('error')}")
    
    return result['success']

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("INSTAGRAM ML FEATURES - TEST SUITE")
    print("="*60)
    print("\nTesting all ML features with sample data...")
    
    results = {
        'Pattern Recognition': test_pattern_recognition(),
        'Sentiment Analysis': test_sentiment_analysis(),
        'ML Model': test_ml_model(),
        'Optimal Timing': test_optimal_timing(),
        'Cross-Platform': test_cross_platform()
    }
    
    print("\n" + "="*60)
    print("TEST RESULTS SUMMARY")
    print("="*60)
    
    passed = sum(results.values())
    total = len(results)
    
    for feature, success in results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {feature}")
    
    print(f"\n{passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! ML features are working correctly.")
        print("\nYou can now:")
        print("1. Start the backend server")
        print("2. Test the API endpoints")
        print("3. Build the frontend UI")
        print("4. Demo the features!")
    else:
        print("\n⚠️ Some tests failed. Check the error messages above.")
    
    print("\n" + "="*60)

if __name__ == '__main__':
    main()
