"""OCR Service for extracting text from images"""

import io
import base64
from PIL import Image
from typing import Dict, Any
import logging

# Set up logging
logger = logging.getLogger(__name__)

class OCRService:
    """Service for extracting text from images - Simplified version for deployment"""
    
    def __init__(self):
        # OCR reader will be initialized on first use
        self.reader = None
        self.initialization_error = None
        self.ocr_available = False
        
        # Try to import easyocr if available
        try:
            import easyocr
            self.ocr_available = True
            logger.info("EasyOCR is available")
        except ImportError:
            logger.warning("EasyOCR not available - OCR features will be disabled")
            self.ocr_available = False
    
    def _get_reader(self):
        """Lazy load the OCR reader"""
        if not self.ocr_available:
            raise Exception("OCR library (EasyOCR) is not installed. OCR features are disabled.")
        
        if self.reader is None:
            try:
                import easyocr
                logger.info("Initializing EasyOCR reader...")
                self.reader = easyocr.Reader(['en'], gpu=False, verbose=False)
                logger.info("EasyOCR reader initialized successfully")
            except Exception as e:
                self.initialization_error = str(e)
                logger.error(f"Failed to initialize EasyOCR: {str(e)}")
                raise Exception(f"OCR initialization failed: {str(e)}")
        return self.reader
    
    def extract_text_from_image(self, image_data: bytes) -> Dict[str, Any]:
        """
        Extract text from image bytes
        
        Args:
            image_data: Image file bytes
            
        Returns:
            Dict with success status, extracted text, and confidence scores
        """
        # Check if OCR is available
        if not self.ocr_available:
            return {
                'success': False,
                'error': 'OCR feature is not available. Please contact support to enable this feature.',
                'text': '',
                'word_count': 0,
                'avg_confidence': 0
            }
        
        try:
            # Open image from bytes
            image = Image.open(io.BytesIO(image_data))
            logger.info(f"Image loaded: {image.size}, mode: {image.mode}")
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
                logger.info(f"Image converted to RGB")
            
            # Check image size - resize if too large
            max_dimension = 2000
            if max(image.size) > max_dimension:
                ratio = max_dimension / max(image.size)
                new_size = tuple(int(dim * ratio) for dim in image.size)
                image = image.resize(new_size, Image.Resampling.LANCZOS)
                logger.info(f"Image resized to: {new_size}")
            
            # Get OCR reader
            try:
                reader = self._get_reader()
            except Exception as e:
                return {
                    'success': False,
                    'error': f'OCR service initialization failed: {str(e)}',
                    'text': '',
                    'word_count': 0,
                    'avg_confidence': 0
                }
            
            # Perform OCR with error handling
            try:
                logger.info("Starting OCR text extraction...")
                results = reader.readtext(image, detail=1, paragraph=False)
                logger.info(f"OCR completed. Found {len(results)} text regions")
            except Exception as e:
                logger.error(f"OCR readtext failed: {str(e)}")
                return {
                    'success': False,
                    'error': f'Text extraction failed: {str(e)}',
                    'text': '',
                    'word_count': 0,
                    'avg_confidence': 0
                }
            
            # Check if any text was found
            if not results or len(results) == 0:
                logger.warning("No text found in image")
                return {
                    'success': False,
                    'error': 'No text detected in image',
                    'text': '',
                    'word_count': 0,
                    'avg_confidence': 0
                }
            
            # Extract text and confidence scores
            extracted_text = []
            confidence_scores = []
            
            for (bbox, text, confidence) in results:
                if text and text.strip():  # Only add non-empty text
                    extracted_text.append(text.strip())
                    confidence_scores.append(confidence)
            
            # Check if we have any valid text after filtering
            if not extracted_text:
                logger.warning("No valid text after filtering")
                return {
                    'success': False,
                    'error': 'No readable text found in image',
                    'text': '',
                    'word_count': 0,
                    'avg_confidence': 0
                }
            
            # Combine all text with spaces
            full_text = ' '.join(extracted_text)
            avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
            
            logger.info(f"Successfully extracted {len(extracted_text)} text segments, avg confidence: {avg_confidence:.2f}")
            
            return {
                'success': True,
                'text': full_text,
                'word_count': len(extracted_text),
                'avg_confidence': round(avg_confidence * 100, 2),
                'details': [
                    {'text': text, 'confidence': round(conf * 100, 2)}
                    for (_, text, conf) in results if text and text.strip()
                ]
            }
            
        except Exception as e:
            logger.error(f"Unexpected error in extract_text_from_image: {str(e)}")
            return {
                'success': False,
                'error': f'Image processing error: {str(e)}',
                'text': '',
                'word_count': 0,
                'avg_confidence': 0
            }
    
    def extract_text_from_base64(self, base64_string: str) -> Dict[str, Any]:
        """
        Extract text from base64 encoded image
        
        Args:
            base64_string: Base64 encoded image string
            
        Returns:
            Dict with success status and extracted text
        """
        try:
            # Remove data URL prefix if present
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            # Decode base64 to bytes
            try:
                image_data = base64.b64decode(base64_string)
                logger.info(f"Base64 decoded successfully, size: {len(image_data)} bytes")
            except Exception as e:
                logger.error(f"Base64 decode failed: {str(e)}")
                return {
                    'success': False,
                    'error': f'Invalid image data: {str(e)}',
                    'text': '',
                    'word_count': 0,
                    'avg_confidence': 0
                }
            
            # Extract text
            return self.extract_text_from_image(image_data)
            
        except Exception as e:
            logger.error(f"Unexpected error in extract_text_from_base64: {str(e)}")
            return {
                'success': False,
                'error': f'Base64 processing error: {str(e)}',
                'text': '',
                'word_count': 0,
                'avg_confidence': 0
            }

# Global instance
ocr_service = OCRService()
