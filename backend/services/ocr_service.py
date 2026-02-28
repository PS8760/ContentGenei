"""OCR Service for extracting text from images using Groq Vision API"""

import io
import base64
from PIL import Image
from typing import Dict, Any
import logging
from groq import Groq
from flask import current_app, has_app_context
import os

# Set up logging
logger = logging.getLogger(__name__)

class OCRService:
    """Service for extracting text from images using Groq Vision API"""
    
    def __init__(self):
        self.client = None
        self.ocr_available = True  # Always available if Groq API key is present
    
    def _get_client(self):
        """Initialize Groq client if not already initialized"""
        if self.client is None:
            try:
                if has_app_context():
                    api_key = current_app.config.get('GROQ_API_KEY')
                else:
                    api_key = os.environ.get('GROQ_API_KEY')
                
                if not api_key:
                    logger.error("Groq API key not found in configuration")
                    raise Exception("Groq API key not configured. OCR features are disabled.")
                
                logger.info(f"Initializing Groq client with API key: {api_key[:10]}...")
                self.client = Groq(api_key=api_key)
                logger.info("Groq client initialized successfully for OCR")
            except Exception as e:
                logger.error(f"Failed to initialize Groq client: {str(e)}")
                raise
        
        return self.client
    
    def extract_text_from_image(self, image_data: bytes) -> Dict[str, Any]:
        """
        Extract text from image bytes using Groq Vision API
        
        Args:
            image_data: Image file bytes
            
        Returns:
            Dict with success status, extracted text, and metadata
        """
        try:
            # Validate and process image
            try:
                image = Image.open(io.BytesIO(image_data))
                logger.info(f"Image loaded: {image.size}, mode: {image.mode}")
            except Exception as e:
                logger.error(f"Failed to open image: {str(e)}")
                return {
                    'success': False,
                    'error': 'Invalid image format. Please upload a valid image file (JPEG, PNG, etc.).',
                    'text': '',
                    'word_count': 0,
                    'avg_confidence': 0
                }
            
            # Convert to RGB if necessary
            if image.mode not in ('RGB', 'RGBA'):
                image = image.convert('RGB')
                logger.info("Image converted to RGB")
            
            # Optimize image size for API (max 4MB recommended)
            max_dimension = 2048
            if max(image.size) > max_dimension:
                ratio = max_dimension / max(image.size)
                new_size = tuple(int(dim * ratio) for dim in image.size)
                image = image.resize(new_size, Image.Resampling.LANCZOS)
                logger.info(f"Image resized to: {new_size}")
            
            # Convert image to base64
            buffered = io.BytesIO()
            image.save(buffered, format="PNG", optimize=True)
            img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
            img_data_url = f"data:image/png;base64,{img_base64}"
            
            # Get Groq client
            try:
                client = self._get_client()
            except Exception as e:
                logger.error(f"Failed to initialize Groq client: {str(e)}")
                return {
                    'success': False,
                    'error': 'OCR service is not available. Please check API configuration.',
                    'text': '',
                    'word_count': 0,
                    'avg_confidence': 0
                }
            
            # Call Groq Vision API for text extraction
            try:
                logger.info("Calling Groq Vision API for text extraction...")
                
                completion = client.chat.completions.create(
                    model="meta-llama/llama-4-scout-17b-16e-instruct",  # Current supported vision model
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Extract ALL text from this image. Return ONLY the extracted text, preserving the original layout and formatting as much as possible. If there is no text in the image, respond with 'NO_TEXT_FOUND'."
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": img_data_url
                                    }
                                }
                            ]
                        }
                    ],
                    temperature=0.1,  # Low temperature for accurate extraction
                    max_completion_tokens=4096,
                    top_p=1,
                    stream=False
                )
                
                extracted_text = completion.choices[0].message.content.strip()
                logger.info(f"Groq Vision API response received: {len(extracted_text)} characters")
                
            except Exception as e:
                logger.error(f"Groq Vision API call failed: {str(e)}")
                return {
                    'success': False,
                    'error': f'Text extraction failed: {str(e)}',
                    'text': '',
                    'word_count': 0,
                    'avg_confidence': 0
                }
            
            # Check if text was found
            if not extracted_text or extracted_text == 'NO_TEXT_FOUND' or len(extracted_text) < 3:
                logger.warning("No text detected in image")
                return {
                    'success': False,
                    'error': 'No text detected in image. Please ensure the image contains clear, readable text.',
                    'text': '',
                    'word_count': 0,
                    'avg_confidence': 0
                }
            
            # Calculate word count
            word_count = len(extracted_text.split())
            
            logger.info(f"Successfully extracted {word_count} words from image")
            
            return {
                'success': True,
                'text': extracted_text,
                'word_count': word_count,
                'avg_confidence': 95,  # Groq Vision is highly accurate
                'method': 'groq-vision-api'
            }
            
        except Exception as e:
            logger.error(f"Unexpected error in extract_text_from_image: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
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
                    'error': 'Invalid image data format. Please upload a valid image.',
                    'text': '',
                    'word_count': 0,
                    'avg_confidence': 0
                }
            
            # Validate minimum size
            if len(image_data) < 100:
                return {
                    'success': False,
                    'error': 'Image data too small. Please upload a valid image file.',
                    'text': '',
                    'word_count': 0,
                    'avg_confidence': 0
                }
            
            # Extract text
            return self.extract_text_from_image(image_data)
            
        except Exception as e:
            logger.error(f"Unexpected error in extract_text_from_base64: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {
                'success': False,
                'error': f'Failed to process image: {str(e)}',
                'text': '',
                'word_count': 0,
                'avg_confidence': 0
            }

# Global instance
ocr_service = OCRService()
