from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, ContentItem, User
from services.ai_service import AIContentGenerator
from services.ocr_service import ocr_service
from services.video_service import video_service
from services.url_service import url_service
from datetime import datetime, timezone
import json
import base64

content_bp = Blueprint('content', __name__)

# Initialize AI generator at module level to avoid repeated initialization
ai_generator = AIContentGenerator()

def get_ai_generator():
    """Get AI generator instance with proper initialization"""
    if not ai_generator.client:
        ai_generator._initialize_client()
    return ai_generator

@content_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_content():
    """Generate new content using AI"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        prompt = data.get('prompt', '').strip()
        content_type = data.get('type', 'article')
        tone = data.get('tone', 'professional')
        skip_save = data.get('skip_save', False)  # Flag to skip saving (for Summarize, Improve tabs)
        
        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400
        
        # Check usage limits ONLY for Generate tab content (not chat, summarize, or improve)
        # skip_save=True means it's from Summarize or Improve tab
        if content_type != 'chat' and not skip_save and not user.is_premium and user.content_generated_count >= user.monthly_content_limit:
            return jsonify({
                'error': 'Monthly content limit reached',
                'limit': user.monthly_content_limit,
                'current_count': user.content_generated_count
            }), 429
        
        # Generate content
        ai_generator = get_ai_generator()
        result = ai_generator.generate_content(
            prompt=prompt,
            content_type=content_type,
            tone=tone,
            target_audience=data.get('target_audience'),
            platform=data.get('platform'),
            word_count=data.get('word_count'),
            max_tokens=data.get('max_tokens', 16000),  # Increased default from 8000 to 16000
            temperature=data.get('temperature', 0.7)
        )
        
        if not result['success']:
            return jsonify({'error': result.get('error', 'Content generation failed')}), 500
        
        # For chat, return immediately without saving to database
        if content_type == 'chat':
            return jsonify({
                'success': True,
                'content': {
                    'content': result['content'],
                    'word_count': result['word_count'],
                    'character_count': result['character_count'],
                    'ai_model_used': result['model_used'],
                    'generation_time': result['generation_time']
                }
            })
        
        # For Summarize/Improve tabs (skip_save=True), return without saving
        if skip_save:
            return jsonify({
                'success': True,
                'content': {
                    'content': result['content'],
                    'word_count': result['word_count'],
                    'character_count': result['character_count'],
                    'ai_model_used': result['model_used'],
                    'generation_time': result['generation_time']
                }
            })
        
        # Create title from prompt (for non-chat content)
        title_words = prompt.split()[:8]  # First 8 words for title
        title = ' '.join(title_words).title() if title_words else 'Generated Content'
        
        # Save content to database (only for Generate tab content)
        content_item = ContentItem(
            user_id=current_user_id,
            title=title,
            content=result['content'],
            content_type=content_type,
            tone=tone,
            prompt=prompt,
            word_count=result['word_count'],
            character_count=result['character_count'],
            ai_model_used=result['model_used'],
            generation_time=result['generation_time']
        )
        
        db.session.add(content_item)
        
        # Update user's content count
        user.content_generated_count += 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'content': content_item.to_dict(),
            'usage': {
                'current_count': user.content_generated_count,
                'monthly_limit': user.monthly_content_limit,
                'remaining': user.monthly_content_limit - user.content_generated_count
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Content generation error: {str(e)}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Content generation failed: {str(e)}'}), 500

@content_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_content():
    """Get user's content with pagination and filtering"""
    try:
        current_user_id = get_jwt_identity()
        
        # Query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        content_type = request.args.get('type')
        status = request.args.get('status')
        search = request.args.get('search')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Build query
        query = ContentItem.query.filter_by(user_id=current_user_id)
        
        if content_type:
            query = query.filter_by(content_type=content_type)
        
        if status:
            query = query.filter_by(status=status)
        
        if search:
            query = query.filter(
                db.or_(
                    ContentItem.title.contains(search),
                    ContentItem.content.contains(search),
                    ContentItem.prompt.contains(search)
                )
            )
        
        # Apply sorting
        if sort_by == 'created_at':
            if sort_order == 'desc':
                query = query.order_by(ContentItem.created_at.desc())
            else:
                query = query.order_by(ContentItem.created_at.asc())
        elif sort_by == 'title':
            if sort_order == 'desc':
                query = query.order_by(ContentItem.title.desc())
            else:
                query = query.order_by(ContentItem.title.asc())
        elif sort_by == 'word_count':
            if sort_order == 'desc':
                query = query.order_by(ContentItem.word_count.desc())
            else:
                query = query.order_by(ContentItem.word_count.asc())
        
        # Paginate
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        return jsonify({
            'success': True,
            'content': [item.to_dict() for item in pagination.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Get content error: {str(e)}")
        return jsonify({'error': 'Failed to get content'}), 500

@content_bp.route('/<content_id>', methods=['GET'])
@jwt_required()
def get_content_item(content_id):
    """Get specific content item"""
    try:
        current_user_id = get_jwt_identity()
        
        content_item = ContentItem.query.filter_by(
            id=content_id,
            user_id=current_user_id
        ).first()
        
        if not content_item:
            return jsonify({'error': 'Content not found'}), 404
        
        return jsonify({
            'success': True,
            'content': content_item.to_dict()
        })
        
    except Exception as e:
        current_app.logger.error(f"Get content item error: {str(e)}")
        return jsonify({'error': 'Failed to get content'}), 500

@content_bp.route('/<content_id>', methods=['PUT'])
@jwt_required()
def update_content_item(content_id):
    """Update content item"""
    try:
        current_user_id = get_jwt_identity()
        
        content_item = ContentItem.query.filter_by(
            id=content_id,
            user_id=current_user_id
        ).first()
        
        if not content_item:
            return jsonify({'error': 'Content not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'title' in data:
            content_item.title = data['title']
        
        if 'content' in data:
            content_item.content = data['content']
            content_item.word_count = len(data['content'].split())
            content_item.character_count = len(data['content'])
        
        if 'status' in data:
            content_item.status = data['status']
            if data['status'] == 'published' and not content_item.published_at:
                content_item.published_at = datetime.now(timezone.utc)
        
        if 'is_favorite' in data:
            content_item.is_favorite = data['is_favorite']
        
        if 'tags' in data:
            content_item.tags = json.dumps(data['tags'])
        
        content_item.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'content': content_item.to_dict(),
            'message': 'Content updated successfully'
        })
        
    except Exception as e:
        current_app.logger.error(f"Update content error: {str(e)}")
        return jsonify({'error': 'Failed to update content'}), 500

@content_bp.route('/<content_id>', methods=['DELETE'])
@jwt_required()
def delete_content_item(content_id):
    """Delete content item"""
    try:
        current_user_id = get_jwt_identity()
        
        content_item = ContentItem.query.filter_by(
            id=content_id,
            user_id=current_user_id
        ).first()
        
        if not content_item:
            return jsonify({'error': 'Content not found'}), 404
        
        db.session.delete(content_item)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Content deleted successfully'
        })
        
    except Exception as e:
        current_app.logger.error(f"Delete content error: {str(e)}")
        return jsonify({'error': 'Failed to delete content'}), 500

@content_bp.route('/<content_id>/improve', methods=['POST'])
@jwt_required()
def improve_content(content_id):
    """Improve existing content"""
    try:
        current_user_id = get_jwt_identity()
        
        content_item = ContentItem.query.filter_by(
            id=content_id,
            user_id=current_user_id
        ).first()
        
        if not content_item:
            return jsonify({'error': 'Content not found'}), 404
        
        data = request.get_json()
        improvement_type = data.get('type', 'readability')  # seo, readability, engagement
        
        # Improve content using AI service
        ai_generator = get_ai_generator()
        result = ai_generator.improve_content(content_item.content, improvement_type)
        
        if not result['success']:
            return jsonify({'error': result.get('error', 'Content improvement failed')}), 500
        
        return jsonify({
            'success': True,
            'original_content': result['original_content'],
            'improved_content': result['improved_content'],
            'improvement_type': improvement_type
        })
        
    except Exception as e:
        current_app.logger.error(f"Improve content error: {str(e)}")
        return jsonify({'error': 'Content improvement failed'}), 500

@content_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_content_stats():
    """Get user's content statistics"""
    try:
        current_user_id = get_jwt_identity()
        
        # Total content count
        total_content = ContentItem.query.filter_by(user_id=current_user_id).count()
        
        # Content by type
        content_by_type = db.session.query(
            ContentItem.content_type,
            db.func.count(ContentItem.id).label('count')
        ).filter_by(user_id=current_user_id).group_by(ContentItem.content_type).all()
        
        # Content by status
        content_by_status = db.session.query(
            ContentItem.status,
            db.func.count(ContentItem.id).label('count')
        ).filter_by(user_id=current_user_id).group_by(ContentItem.status).all()
        
        # Recent content (last 30 days)
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        recent_content = ContentItem.query.filter(
            ContentItem.user_id == current_user_id,
            ContentItem.created_at >= thirty_days_ago
        ).count()
        
        # Average word count
        avg_word_count = db.session.query(
            db.func.avg(ContentItem.word_count)
        ).filter_by(user_id=current_user_id).scalar() or 0
        
        return jsonify({
            'success': True,
            'stats': {
                'total_content': total_content,
                'recent_content': recent_content,
                'avg_word_count': round(avg_word_count, 0),
                'content_by_type': [
                    {'type': item.content_type, 'count': item.count}
                    for item in content_by_type
                ],
                'content_by_status': [
                    {'status': item.status, 'count': item.count}
                    for item in content_by_status
                ]
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Get content stats error: {str(e)}")
        return jsonify({'error': 'Failed to get content stats'}), 500


@content_bp.route('/extract-text', methods=['POST'])
@jwt_required()
def extract_text_from_image():
    """Extract text from image using OCR"""
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'Image data is required',
                'text': '',
                'word_count': 0,
                'confidence': 0
            }), 400
        
        image_data = data['image']
        
        # Validate image data
        if not image_data or len(image_data) < 100:
            return jsonify({
                'success': False,
                'error': 'Invalid or empty image data',
                'text': '',
                'word_count': 0,
                'confidence': 0
            }), 400
        
        # Extract text using OCR service
        current_app.logger.info("Starting OCR text extraction...")
        result = ocr_service.extract_text_from_base64(image_data)
        
        if result['success']:
            current_app.logger.info(f"OCR successful: {result.get('word_count', 0)} words, {result.get('avg_confidence', 0)}% confidence")
            return jsonify({
                'success': True,
                'text': result['text'],
                'word_count': result.get('word_count', 0),
                'confidence': result.get('avg_confidence', 0),
                'message': 'Text extracted successfully'
            })
        else:
            error_msg = result.get('error', 'OCR failed')
            current_app.logger.warning(f"OCR failed: {error_msg}")
            
            # Provide helpful error messages based on the error type
            if 'No text detected' in error_msg or 'No readable text' in error_msg:
                user_message = 'No text detected in the image. Please ensure the image contains clear, readable text.'
            elif 'initialization failed' in error_msg.lower():
                user_message = 'OCR service is not available. Please try again later or paste text manually.'
            elif 'Invalid image' in error_msg:
                user_message = 'Invalid image format. Please upload a valid image file (JPEG, PNG, etc.).'
            else:
                user_message = error_msg
            
            return jsonify({
                'success': False,
                'error': user_message,
                'text': '',
                'word_count': 0,
                'confidence': 0
            }), 200  # Return 200 to avoid triggering error handlers, but with success: false
            
    except Exception as e:
        current_app.logger.error(f"OCR endpoint error: {str(e)}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': 'An unexpected error occurred during text extraction. Please try again or paste text manually.',
            'text': '',
            'word_count': 0,
            'confidence': 0
        }), 200  # Return 200 to avoid triggering error handlers


@content_bp.route('/ocr-status', methods=['GET'])
@jwt_required()
def check_ocr_status():
    """Check if OCR service is available and working"""
    try:
        # Check if Groq API key is configured
        api_key = current_app.config.get('GROQ_API_KEY')
        
        if not api_key:
            return jsonify({
                'success': False,
                'available': False,
                'error': 'Groq API key not configured',
                'message': 'OCR service requires Groq API configuration.'
            })
        
        # Try to initialize the client
        try:
            client = ocr_service._get_client()
            return jsonify({
                'success': True,
                'available': True,
                'message': 'OCR service is available and ready',
                'method': 'groq-vision-api'
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'available': False,
                'error': str(e),
                'message': 'OCR service initialization failed.'
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'available': False,
            'error': str(e),
            'message': 'Failed to check OCR status'
        })



@content_bp.route('/transcribe-video', methods=['POST'])
@jwt_required()
def transcribe_video():
    """Transcribe video to text using Groq Whisper API"""
    try:
        data = request.get_json()
        
        if not data or 'video' not in data:
            return jsonify({
                'success': False,
                'error': 'Video data is required',
                'transcription': '',
                'word_count': 0
            }), 400
        
        video_data = data['video']
        filename = data.get('filename', 'video.mp4')
        
        # Validate video data
        if not video_data or len(video_data) < 1000:
            return jsonify({
                'success': False,
                'error': 'Invalid or empty video data',
                'transcription': '',
                'word_count': 0
            }), 400
        
        # Transcribe video
        current_app.logger.info(f"Starting video transcription for: {filename}")
        result = video_service.transcribe_from_base64(video_data, filename)
        
        if result['success']:
            current_app.logger.info(f"Transcription successful: {result.get('word_count', 0)} words")
            return jsonify({
                'success': True,
                'transcription': result['transcription'],
                'word_count': result.get('word_count', 0),
                'duration': result.get('duration'),
                'language': result.get('language', 'en'),
                'message': 'Video transcribed successfully'
            })
        else:
            error_msg = result.get('error', 'Transcription failed')
            current_app.logger.warning(f"Transcription failed: {error_msg}")
            
            # Provide helpful error messages
            if 'too large' in error_msg.lower():
                user_message = error_msg
            elif 'No speech detected' in error_msg:
                user_message = 'No speech detected in video. Please ensure the video contains clear audio.'
            elif 'not available' in error_msg.lower():
                user_message = 'Video transcription service is not available. Please try again later.'
            else:
                user_message = error_msg
            
            return jsonify({
                'success': False,
                'error': user_message,
                'transcription': '',
                'word_count': 0
            }), 200
            
    except Exception as e:
        current_app.logger.error(f"Video transcription endpoint error: {str(e)}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': 'An unexpected error occurred during video transcription. Please try again.',
            'transcription': '',
            'word_count': 0
        }), 200


@content_bp.route('/video-status', methods=['GET'])
@jwt_required()
def check_video_status():
    """Check if video transcription service is available"""
    try:
        api_key = current_app.config.get('GROQ_API_KEY')
        
        if not api_key:
            return jsonify({
                'success': False,
                'available': False,
                'error': 'Groq API key not configured',
                'message': 'Video transcription requires Groq API configuration.'
            })
        
        try:
            client = video_service._get_client()
            return jsonify({
                'success': True,
                'available': True,
                'message': 'Video transcription service is available and ready',
                'method': 'groq-whisper-api',
                'max_size_mb': 25
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'available': False,
                'error': str(e),
                'message': 'Video transcription service initialization failed.'
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'available': False,
            'error': str(e),
            'message': 'Failed to check video transcription status'
        })


@content_bp.route('/extract-url', methods=['POST'])
@jwt_required()
def extract_url_content():
    """Extract content from URL for summarization"""
    try:
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({
                'success': False,
                'error': 'URL is required',
                'content': '',
                'word_count': 0
            }), 400
        
        url = data['url']
        
        # Validate URL
        if not url or not url.strip():
            return jsonify({
                'success': False,
                'error': 'URL cannot be empty',
                'content': '',
                'word_count': 0
            }), 400
        
        # Extract content from URL
        current_app.logger.info(f"Extracting content from URL: {url}")
        result = url_service.extract_content_from_url(url)
        
        if result['success']:
            current_app.logger.info(f"URL extraction successful: {result.get('word_count', 0)} words")
            return jsonify({
                'success': True,
                'content': result['content'],
                'word_count': result.get('word_count', 0),
                'title': result.get('title', ''),
                'url': result.get('url', url),
                'message': 'Content extracted successfully'
            })
        else:
            error_msg = result.get('error', 'Failed to extract content')
            current_app.logger.warning(f"URL extraction failed: {error_msg}")
            
            return jsonify({
                'success': False,
                'error': error_msg,
                'content': '',
                'word_count': 0
            }), 200
            
    except Exception as e:
        current_app.logger.error(f"URL extraction endpoint error: {str(e)}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': 'An unexpected error occurred while extracting URL content. Please try again.',
            'content': '',
            'word_count': 0
        }), 200


@content_bp.route('/test-url', methods=['GET'])
def test_url_service():
    """Test URL service availability"""
    try:
        # Test with a simple URL
        test_url = "https://example.com"
        result = url_service.extract_content_from_url(test_url)
        
        return jsonify({
            'success': True,
            'test_result': result,
            'message': 'URL service test completed'
        })
    except Exception as e:
        import traceback
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc(),
            'message': 'URL service test failed'
        })
