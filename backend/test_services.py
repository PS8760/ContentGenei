"""Test script to verify all services are working"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_groq_api_key():
    """Test if Groq API key is loaded"""
    print("=" * 60)
    print("Testing Groq API Key")
    print("=" * 60)
    
    api_key = os.environ.get('GROQ_API_KEY')
    if api_key:
        print(f"✅ Groq API key found: {api_key[:10]}...")
        return True
    else:
        print("❌ Groq API key not found in environment")
        return False

def test_ocr_service():
    """Test OCR service"""
    print("\n" + "=" * 60)
    print("Testing OCR Service")
    print("=" * 60)
    
    try:
        from services.ocr_service import ocr_service
        print("✅ OCR service imported")
        
        # Try to initialize client
        client = ocr_service._get_client()
        print("✅ Groq client initialized for OCR")
        return True
    except Exception as e:
        print(f"❌ OCR service error: {e}")
        return False

def test_video_service():
    """Test video service"""
    print("\n" + "=" * 60)
    print("Testing Video Service")
    print("=" * 60)
    
    try:
        from services.video_service import video_service
        print("✅ Video service imported")
        
        # Try to initialize client
        client = video_service._get_client()
        print("✅ Groq client initialized for video")
        return True
    except Exception as e:
        print(f"❌ Video service error: {e}")
        return False

def test_url_service():
    """Test URL service"""
    print("\n" + "=" * 60)
    print("Testing URL Service")
    print("=" * 60)
    
    try:
        from services.url_service import url_service
        print("✅ URL service imported")
        
        # Test with example.com
        result = url_service.extract_content_from_url('https://example.com')
        if result['success']:
            print(f"✅ URL extraction works: {result['word_count']} words")
            return True
        else:
            print(f"⚠️  URL extraction returned: {result.get('error', 'Unknown error')}")
            return False
    except Exception as e:
        print(f"❌ URL service error: {e}")
        return False

def main():
    """Run all tests"""
    print("\n🚀 Service Test Suite")
    print("=" * 60)
    
    results = []
    
    # Test 1: API Key
    results.append(("API Key", test_groq_api_key()))
    
    if results[-1][1]:
        # Test 2: OCR Service
        results.append(("OCR Service", test_ocr_service()))
        
        # Test 3: Video Service
        results.append(("Video Service", test_video_service()))
        
        # Test 4: URL Service
        results.append(("URL Service", test_url_service()))
    
    # Print summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    all_passed = all(result[1] for result in results)
    
    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 All services are working correctly!")
    else:
        print("⚠️  Some services failed. Please check the errors above.")
        print("\n💡 Common solutions:")
        print("   1. Ensure GROQ_API_KEY is set in .env file")
        print("   2. Install dependencies: pip install -r requirements.txt")
        print("   3. Restart the backend server")
    print("=" * 60)
    
    return 0 if all_passed else 1

if __name__ == '__main__':
    sys.exit(main())
