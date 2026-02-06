"""
Test script to verify OCR functionality
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_ocr_import():
    """Test if OCR dependencies can be imported"""
    print("=" * 60)
    print("Testing OCR Dependencies")
    print("=" * 60)
    
    try:
        import easyocr
        print("✅ easyocr imported successfully")
        print(f"   Version: {easyocr.__version__ if hasattr(easyocr, '__version__') else 'unknown'}")
    except ImportError as e:
        print(f"❌ Failed to import easyocr: {e}")
        print("\n💡 To install: pip install easyocr")
        return False
    
    try:
        from PIL import Image
        print("✅ PIL (Pillow) imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import PIL: {e}")
        print("\n💡 To install: pip install Pillow")
        return False
    
    return True

def test_ocr_service():
    """Test OCR service initialization"""
    print("\n" + "=" * 60)
    print("Testing OCR Service")
    print("=" * 60)
    
    try:
        from services.ocr_service import ocr_service
        print("✅ OCR service imported successfully")
    except Exception as e:
        print(f"❌ Failed to import OCR service: {e}")
        return False
    
    try:
        print("\n📥 Initializing OCR reader (this may take a moment)...")
        reader = ocr_service._get_reader()
        print("✅ OCR reader initialized successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize OCR reader: {e}")
        print("\n💡 Common issues:")
        print("   - Missing model files (will download on first run)")
        print("   - Insufficient disk space")
        print("   - Network issues (for model download)")
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
        img = Image.new('RGB', (400, 100), color='white')
        draw = ImageDraw.Draw(img)
        
        # Draw text
        text = "Hello World! OCR Test 123"
        draw.text((10, 30), text, fill='black')
        
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
    print("\n🚀 OCR Service Test Suite")
    print("=" * 60)
    
    results = []
    
    # Test 1: Dependencies
    results.append(("Dependencies", test_ocr_import()))
    
    if results[-1][1]:
        # Test 2: Service initialization
        results.append(("Service Init", test_ocr_service()))
        
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
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
        print("\n💡 Common solutions:")
        print("   1. Install missing dependencies: pip install easyocr Pillow")
        print("   2. Ensure sufficient disk space for model files (~100MB)")
        print("   3. Check internet connection (for first-time model download)")
        print("   4. Try running with: python test_ocr.py")
    print("=" * 60)
    
    return 0 if all_passed else 1

if __name__ == '__main__':
    sys.exit(main())
