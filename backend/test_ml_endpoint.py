"""
Quick test to see what error is happening
"""
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("Testing imports...")
    from services.instagram_ml_service import InstagramMLService
    print("✅ InstagramMLService imported successfully")
    
    from platforms.instagram.instagram_model import InstagramPost
    print("✅ InstagramPost imported successfully")
    
    # Test creating ML service
    ml_service = InstagramMLService()
    print("✅ ML service created successfully")
    
    # Test with sample data
    sample_posts = [
        {
            'media_type': 'IMAGE',
            'caption': 'Test caption',
            'engagement_rate': 5.0,
            'published_at': None,  # This might be the issue
            'like_count': 100,
            'comments_count': 10
        }
    ] * 5
    
    print("\nTesting pattern analysis with sample data...")
    result = ml_service.analyze_patterns(sample_posts)
    
    if result['success']:
        print("✅ Pattern analysis works!")
    else:
        print(f"❌ Pattern analysis failed: {result.get('error')}")
        
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("\nMissing dependencies. Run:")
    print("  pip install numpy scipy textblob scikit-learn")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
