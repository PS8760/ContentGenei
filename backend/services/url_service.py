"""URL Content Extraction Service"""

import requests
from bs4 import BeautifulSoup
import logging
from typing import Dict, Any
from urllib.parse import urlparse, parse_qs
import re

# Set up logging
logger = logging.getLogger(__name__)

class URLService:
    """Service for extracting content from URLs"""
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.timeout = 10  # seconds
    
    def _is_youtube_url(self, url: str) -> bool:
        """Check if URL is a YouTube video"""
        youtube_patterns = [
            r'youtube\.com/watch',
            r'youtu\.be/',
            r'youtube\.com/embed/',
            r'youtube\.com/v/'
        ]
        return any(re.search(pattern, url) for pattern in youtube_patterns)
    
    def _extract_youtube_video_id(self, url: str) -> str:
        """Extract video ID from YouTube URL"""
        # Pattern 1: youtube.com/watch?v=VIDEO_ID
        if 'youtube.com/watch' in url:
            parsed = urlparse(url)
            params = parse_qs(parsed.query)
            if 'v' in params:
                return params['v'][0]
        
        # Pattern 2: youtu.be/VIDEO_ID
        if 'youtu.be/' in url:
            return url.split('youtu.be/')[-1].split('?')[0]
        
        # Pattern 3: youtube.com/embed/VIDEO_ID
        if 'youtube.com/embed/' in url:
            return url.split('embed/')[-1].split('?')[0]
        
        return None
    
    def _extract_youtube_content(self, url: str) -> Dict[str, Any]:
        """Extract content from YouTube video page"""
        try:
            video_id = self._extract_youtube_video_id(url)
            if not video_id:
                return {
                    'success': False,
                    'error': 'Could not extract YouTube video ID from URL',
                    'content': '',
                    'word_count': 0
                }
            
            logger.info(f"Extracting YouTube video: {video_id}")
            
            # Fetch the page
            response = requests.get(url, headers=self.headers, timeout=self.timeout)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract title
            title = soup.find('meta', property='og:title')
            title_text = title['content'] if title else 'YouTube Video'
            
            # Extract description
            description = soup.find('meta', property='og:description')
            description_text = description['content'] if description else ''
            
            # Try to find video transcript/description in the page
            # YouTube embeds data in script tags
            scripts = soup.find_all('script')
            video_description = description_text
            
            for script in scripts:
                if script.string and 'videoDetails' in script.string:
                    # Try to extract description from videoDetails
                    try:
                        import json
                        # This is a simplified extraction - YouTube's structure is complex
                        script_text = script.string
                        if '"shortDescription":"' in script_text:
                            start = script_text.find('"shortDescription":"') + len('"shortDescription":"')
                            end = script_text.find('"', start)
                            if end > start:
                                desc = script_text[start:end]
                                # Unescape JSON string
                                desc = desc.replace('\\n', '\n').replace('\\"', '"').replace('\\\\', '\\')
                                if len(desc) > len(video_description):
                                    video_description = desc
                    except:
                        pass
            
            # Construct content
            content = f"Title: {title_text}\n\n"
            if video_description:
                content += f"Description:\n{video_description}\n\n"
            
            content += f"YouTube Video URL: {url}\n"
            content += f"Video ID: {video_id}\n\n"
            content += "Note: This is a YouTube video. To get the full transcript, you may need to:\n"
            content += "1. Enable captions/subtitles on YouTube\n"
            content += "2. Use YouTube's transcript feature\n"
            content += "3. Or describe what you want to know about the video"
            
            if len(content) < 100:
                return {
                    'success': False,
                    'error': 'Could not extract meaningful content from YouTube video. YouTube videos require special handling. Please try:\n• Copying the video description manually\n• Using YouTube\'s transcript feature\n• Or describing what you want to summarize',
                    'content': '',
                    'word_count': 0
                }
            
            word_count = len(content.split())
            
            return {
                'success': True,
                'content': content,
                'word_count': word_count,
                'title': title_text,
                'url': url,
                'method': 'youtube-extraction',
                'note': 'YouTube video - limited content available without transcript API'
            }
            
        except Exception as e:
            logger.error(f"YouTube extraction error: {str(e)}")
            return {
                'success': False,
                'error': 'YouTube videos require special handling. Please try:\n• Copying the video description manually\n• Using YouTube\'s transcript feature\n• Or paste the video transcript directly',
                'content': '',
                'word_count': 0
            }
    
    def extract_content_from_url(self, url: str) -> Dict[str, Any]:
        """
        Extract text content from a URL
        
        Args:
            url: The URL to extract content from
            
        Returns:
            Dict with success status, extracted content, and metadata
        """
        try:
            # Validate URL
            if not url or not url.strip():
                return {
                    'success': False,
                    'error': 'URL is required',
                    'content': '',
                    'word_count': 0
                }
            
            url = url.strip()
            
            # Check if it's a YouTube URL
            if self._is_youtube_url(url):
                logger.info("Detected YouTube URL, using special handler")
                return self._extract_youtube_content(url)
            
            # Basic URL validation
            try:
                parsed = urlparse(url)
                if not parsed.scheme or not parsed.netloc:
                    return {
                        'success': False,
                        'error': 'Invalid URL format. Please provide a complete URL (e.g., https://example.com)',
                        'content': '',
                        'word_count': 0
                    }
            except Exception as e:
                return {
                    'success': False,
                    'error': f'Invalid URL: {str(e)}',
                    'content': '',
                    'word_count': 0
                }
            
            logger.info(f"Fetching content from URL: {url}")
            
            # Fetch the URL
            try:
                response = requests.get(url, headers=self.headers, timeout=self.timeout, allow_redirects=True)
                response.raise_for_status()
            except requests.exceptions.Timeout:
                return {
                    'success': False,
                    'error': 'Request timed out. The website took too long to respond.',
                    'content': '',
                    'word_count': 0
                }
            except requests.exceptions.ConnectionError:
                return {
                    'success': False,
                    'error': 'Connection failed. Please check the URL and try again.',
                    'content': '',
                    'word_count': 0
                }
            except requests.exceptions.HTTPError as e:
                status_code = e.response.status_code
                if status_code == 404:
                    error_msg = 'Page not found (404). Please check the URL.'
                elif status_code == 403:
                    error_msg = 'Access forbidden (403). The website may be blocking automated access.'
                elif status_code == 500:
                    error_msg = 'Server error (500). The website is experiencing issues.'
                else:
                    error_msg = f'HTTP error {status_code}. Failed to fetch content.'
                
                return {
                    'success': False,
                    'error': error_msg,
                    'content': '',
                    'word_count': 0
                }
            except Exception as e:
                return {
                    'success': False,
                    'error': f'Failed to fetch URL: {str(e)}',
                    'content': '',
                    'word_count': 0
                }
            
            # Check content type
            content_type = response.headers.get('Content-Type', '').lower()
            if 'text/html' not in content_type and 'text/plain' not in content_type:
                return {
                    'success': False,
                    'error': f'Unsupported content type: {content_type}. Only HTML and text pages are supported.',
                    'content': '',
                    'word_count': 0
                }
            
            logger.info(f"Successfully fetched URL, content length: {len(response.content)} bytes")
            
            # Parse HTML content
            try:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Remove script and style elements
                for script in soup(['script', 'style', 'nav', 'footer', 'header', 'aside']):
                    script.decompose()
                
                # Get title
                title = soup.find('title')
                title_text = title.get_text().strip() if title else ''
                
                # Try to find main content
                main_content = None
                
                # Look for common content containers
                for selector in ['article', 'main', '[role="main"]', '.content', '#content', '.post', '.article']:
                    main_content = soup.select_one(selector)
                    if main_content:
                        break
                
                # If no main content found, use body
                if not main_content:
                    main_content = soup.find('body')
                
                if not main_content:
                    return {
                        'success': False,
                        'error': 'No content found on the page',
                        'content': '',
                        'word_count': 0
                    }
                
                # Extract text
                text = main_content.get_text(separator='\n', strip=True)
                
                # Clean up text
                lines = [line.strip() for line in text.split('\n') if line.strip()]
                content = '\n'.join(lines)
                
                # Check if content is too short
                if len(content) < 50:
                    return {
                        'success': False,
                        'error': 'Extracted content is too short. The page may not contain readable text.',
                        'content': '',
                        'word_count': 0
                    }
                
                # Limit content length (max 50,000 characters)
                max_length = 50000
                if len(content) > max_length:
                    content = content[:max_length] + '\n\n[Content truncated due to length...]'
                
                word_count = len(content.split())
                
                logger.info(f"Successfully extracted {word_count} words from URL")
                
                return {
                    'success': True,
                    'content': content,
                    'word_count': word_count,
                    'title': title_text,
                    'url': url,
                    'method': 'web-scraping'
                }
                
            except Exception as e:
                logger.error(f"Failed to parse HTML: {str(e)}")
                return {
                    'success': False,
                    'error': f'Failed to parse page content: {str(e)}',
                    'content': '',
                    'word_count': 0
                }
            
        except Exception as e:
            logger.error(f"Unexpected error in extract_content_from_url: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {
                'success': False,
                'error': f'URL processing error: {str(e)}',
                'content': '',
                'word_count': 0
            }

# Global instance
url_service = URLService()
