"""
Test script for Groq Vision API OCR functionality
"""

import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_groq_api_key():
    """Test if Groq API key is configured"""
    print("=" * 60)
    print("Testing Groq API Configuration")
    print("=" * 60)
    
    api_key = os.environ.get('GROQ_API_KEY')
    if api_key:
        print(f"✅ Groq API key found: {api_key[:10]}...")
        return True
    else:
        print("❌ Groq API key not found in environment")
        print("\n💡 Set GROQ_API_KEY in your .env file")
        return False

def test_ocr_service_import():
    """Test if OCR service can be imported"""
    print("\n" + "=" * 60)
    print("Testing OCR Service Import")
    print("=" * 60)
    
    try:
        from services.ocr_service import ocr_service
        print("✅ OCR service imported successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to import OCR service: {e}")
        return False

def test_ocr_with_sample():
    """Test OCR with a sample image"""
    print("\n" + "=" * 60)
    print("Testing OCR with Sample Image")
    print("=" * 60)
    
    try:
        from PIL import Image, ImageDraw, ImageFont
        import io
        
        # Create a simple test image with text
        print("\n📝 Creating test image with text...")
        img = Image.new('RGB', (600, 200), color='white')
        draw = ImageDraw.Draw(img)
        
        # Draw text (larger and clearer)
        text = "Hello World!\nOCR Test 2024\nGroq Vision API"
        draw.text((20, 50), text, fill='black')
        
        # Convert to bytes
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes = img_bytes.getvalue()
        
        print(f"✅ Test image created ({len(img_bytes)} bytes)")
        
        # Test OCR
        from services.ocr_service import ocr_service
        print("\n🔍 Running OCR on test image...")
        result = ocr_service.extract_text_from_image(img_bytes)
        
        if result['success']:
            print(f"✅ OCR successful!")
            print(f"   Extracted text: '{result['text']}'")
            print(f"   Word count: {result['word_count']}")
            print(f"   Confidence: {result['avg_confidence']}%")
            print(f"   Method: {result.get('method', 'unknown')}")
            return True
        else:
            print(f"❌ OCR failed: {result.get('error', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        print(f"\nTraceback:\n{traceback.format_exc()}")
        return False

def main():
    """Run all tests"""
    print("\n🚀 Groq Vision OCR Test Suite")
    print("=" * 60)
    
    results = []
    
    # Test 1: API Key
    results.append(("API Key", test_groq_api_key()))
    
    if results[-1][1]:
        # Test 2: Service import
        results.append(("Service Import", test_ocr_service_import()))
        
        if results[-1][1]:
            # Test 3: Sample OCR
            results.append(("Sample OCR", test_ocr_with_sample()))
    
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
        print("🎉 All tests passed! OCR service is working correctly.")
        print("\n✨ Benefits of Groq Vision API:")
        print("   • No heavy dependencies (no EasyOCR installation)")
        print("   • Cloud-based processing (no local models)")
        print("   • High accuracy with vision-language models")
        print("   • Fast and efficient")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
        print("\n💡 Common solutions:")
        print("   1. Ensure GROQ_API_KEY is set in .env file")
        print("   2. Check internet connection")
        print("   3. Verify Groq API key is valid")
    print("=" * 60)
    
    return 0 if all_passed else 1

if __name__ == '__main__':
    sys.exit(main())
