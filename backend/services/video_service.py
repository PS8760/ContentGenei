"""Audio/Video Transcription Service using Groq Whisper API

Supports: MP3, MP4, MPEG, MPGA, M4A, WAV, WEBM
Note: For video files, audio track will be extracted and transcribed
"""

import io
import os
import tempfile
import logging
from typing import Dict, Any
from groq import Groq
from flask import current_app, has_app_context

# Set up logging
logger = logging.getLogger(__name__)

class VideoService:
    """Service for transcribing and summarizing video content"""
    
    def __init__(self):
        self.client = None
        self.service_available = True
    
    def _get_client(self):
        """Initialize Groq client if not already initialized"""
        if self.client is None:
            if has_app_context():
                api_key = current_app.config.get('GROQ_API_KEY')
            else:
                api_key = os.environ.get('GROQ_API_KEY')
            
            if not api_key:
                raise Exception("Groq API key not configured. Video transcription is disabled.")
            
            self.client = Groq(api_key=api_key)
            logger.info("Groq client initialized for video transcription")
        
        return self.client
    
    def extract_audio_and_transcribe(self, video_data: bytes, filename: str = "video") -> Dict[str, Any]:
        """
        Extract audio from video and transcribe using Groq Whisper API
        
        Args:
            video_data: Video file bytes
            filename: Original filename (for format detection)
            
        Returns:
            Dict with success status, transcription, and metadata
        """
        try:
            # Validate video data
            if not video_data or len(video_data) < 1000:
                return {
                    'success': False,
                    'error': 'Invalid or empty video file',
                    'transcription': '',
                    'word_count': 0
                }
            
            # Check file size (Groq Whisper limit is 25MB)
            max_size = 25 * 1024 * 1024  # 25MB
            if len(video_data) > max_size:
                return {
                    'success': False,
                    'error': f'Video file too large. Maximum size is 25MB. Your file is {len(video_data) / (1024*1024):.1f}MB',
                    'transcription': '',
                    'word_count': 0
                }
            
            logger.info(f"Processing video file: {filename}, size: {len(video_data)} bytes")
            
            # Get Groq client
            try:
                client = self._get_client()
            except Exception as e:
                logger.error(f"Failed to initialize Groq client: {str(e)}")
                return {
                    'success': False,
                    'error': 'Video transcription service is not available. Please check API configuration.',
                    'transcription': '',
                    'word_count': 0
                }
            
            # Save video to temporary file (Groq API requires file path)
            try:
                # Determine file extension
                ext = os.path.splitext(filename)[1] or '.mp4'
                
                # Create temporary file
                with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
                    temp_file.write(video_data)
                    temp_path = temp_file.name
                
                logger.info(f"Video saved to temporary file: {temp_path}")
                
                # Transcribe using Groq Whisper API
                logger.info("Calling Groq Whisper API for transcription...")
                
                try:
                    with open(temp_path, 'rb') as audio_file:
                        # Groq Whisper supports both audio and video files
                        transcription = client.audio.transcriptions.create(
                            file=(filename, audio_file.read()),
                            model="whisper-large-v3-turbo",
                            response_format="verbose_json",
                            temperature=0.0  # Deterministic output
                        )
                except Exception as api_error:
                    logger.error(f"Groq API error: {str(api_error)}")
                    # Clean up temp file
                    try:
                        os.unlink(temp_path)
                    except:
                        pass
                    
                    # Provide helpful error message
                    error_str = str(api_error).lower()
                    if 'audio' in error_str or 'format' in error_str:
                        return {
                            'success': False,
                            'error': 'Video format not supported. Please try MP4, MOV, or WebM format, or extract audio first.',
                            'transcription': '',
                            'word_count': 0
                        }
                    elif 'size' in error_str or 'large' in error_str:
                        return {
                            'success': False,
                            'error': 'Video file too large. Please use a smaller file (max 25MB).',
                            'transcription': '',
                            'word_count': 0
                        }
                    else:
                        return {
                            'success': False,
                            'error': f'Transcription API error: {str(api_error)}',
                            'transcription': '',
                            'word_count': 0
                        }
                
                # Clean up temporary file
                try:
                    os.unlink(temp_path)
                except:
                    pass
                
                # Extract transcription text
                transcription_text = transcription.text.strip()
                
                logger.info(f"Transcription completed: {len(transcription_text)} characters")
                
                if not transcription_text or len(transcription_text) < 10:
                    return {
                        'success': False,
                        'error': 'No speech detected in video. Please ensure the video contains clear audio.',
                        'transcription': '',
                        'word_count': 0
                    }
                
                # Calculate word count
                word_count = len(transcription_text.split())
                
                # Get duration if available
                duration = getattr(transcription, 'duration', None)
                
                return {
                    'success': True,
                    'transcription': transcription_text,
                    'word_count': word_count,
                    'duration': duration,
                    'language': getattr(transcription, 'language', 'en'),
                    'method': 'groq-whisper-api'
                }
                
            except Exception as e:
                logger.error(f"Groq Whisper API call failed: {str(e)}")
                # Clean up temp file on error
                try:
                    if 'temp_path' in locals():
                        os.unlink(temp_path)
                except:
                    pass
                
                return {
                    'success': False,
                    'error': f'Transcription failed: {str(e)}',
                    'transcription': '',
                    'word_count': 0
                }
            
        except Exception as e:
            logger.error(f"Unexpected error in extract_audio_and_transcribe: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {
                'success': False,
                'error': f'Video processing error: {str(e)}',
                'transcription': '',
                'word_count': 0
            }
    
    def transcribe_from_base64(self, base64_string: str, filename: str = "video.mp4") -> Dict[str, Any]:
        """
        Transcribe video from base64 encoded data
        
        Args:
            base64_string: Base64 encoded video data
            filename: Original filename
            
        Returns:
            Dict with success status and transcription
        """
        try:
            import base64
            
            # Remove data URL prefix if present
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            # Decode base64 to bytes
            try:
                video_data = base64.b64decode(base64_string)
                logger.info(f"Base64 decoded successfully, size: {len(video_data)} bytes")
            except Exception as e:
                logger.error(f"Base64 decode failed: {str(e)}")
                return {
                    'success': False,
                    'error': 'Invalid video data format. Please upload a valid video file.',
                    'transcription': '',
                    'word_count': 0
                }
            
            # Transcribe video
            return self.extract_audio_and_transcribe(video_data, filename)
            
        except Exception as e:
            logger.error(f"Unexpected error in transcribe_from_base64: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {
                'success': False,
                'error': f'Failed to process video: {str(e)}',
                'transcription': '',
                'word_count': 0
            }

# Global instance
video_service = VideoService()
