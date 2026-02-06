import re
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
import json

def generate_uuid():
    """Generate a new UUID string"""
    return str(uuid.uuid4())

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def sanitize_string(text: str, max_length: int = None) -> str:
    """Sanitize string input"""
    if not text:
        return ""
    
    # Remove potentially harmful characters
    text = re.sub(r'[<>"\']', '', text)
    text = text.strip()
    
    if max_length:
        text = text[:max_length]
    
    return text

def calculate_reading_time(text: str, words_per_minute: int = 200) -> int:
    """Calculate estimated reading time in minutes"""
    word_count = len(text.split())
    reading_time = max(1, round(word_count / words_per_minute))
    return reading_time

def extract_keywords(text: str, max_keywords: int = 10) -> List[str]:
    """Extract keywords from text (simple implementation)"""
    # Remove common stop words
    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these',
        'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him',
        'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
    }
    
    # Extract words and filter
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    keywords = [word for word in words if word not in stop_words]
    
    # Count frequency and return top keywords
    word_freq = {}
    for word in keywords:
        word_freq[word] = word_freq.get(word, 0) + 1
    
    sorted_keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
    return [word for word, freq in sorted_keywords[:max_keywords]]

def format_number(number: float, precision: int = 1) -> str:
    """Format large numbers with K, M, B suffixes"""
    if number >= 1_000_000_000:
        return f"{number / 1_000_000_000:.{precision}f}B"
    elif number >= 1_000_000:
        return f"{number / 1_000_000:.{precision}f}M"
    elif number >= 1_000:
        return f"{number / 1_000:.{precision}f}K"
    else:
        return str(int(number))

def calculate_engagement_rate(likes: int, comments: int, shares: int, views: int) -> float:
    """Calculate engagement rate percentage"""
    if views == 0:
        return 0.0
    
    total_engagement = likes + comments + shares
    engagement_rate = (total_engagement / views) * 100
    return round(engagement_rate, 2)

def parse_date_range(date_range: str) -> tuple:
    """Parse date range string into start and end dates"""
    today = datetime.now(timezone.utc).date()
    
    if date_range == '7d':
        start_date = today - timedelta(days=7)
    elif date_range == '30d':
        start_date = today - timedelta(days=30)
    elif date_range == '90d':
        start_date = today - timedelta(days=90)
    elif date_range == '1y':
        start_date = today - timedelta(days=365)
    else:
        start_date = today - timedelta(days=30)  # Default to 30 days
    
    return start_date, today

def validate_content_type(content_type: str) -> bool:
    """Validate content type"""
    valid_types = [
        'article', 'social-post', 'email', 'blog', 'caption', 
        'script', 'ad-copy', 'newsletter', 'press-release'
    ]
    return content_type in valid_types

def validate_tone(tone: str) -> bool:
    """Validate tone"""
    valid_tones = [
        'professional', 'casual', 'friendly', 'formal', 'creative',
        'persuasive', 'informative', 'conversational', 'humorous', 'urgent'
    ]
    return tone in valid_tones

def clean_html(text: str) -> str:
    """Remove HTML tags from text"""
    clean = re.compile('<.*?>')
    return re.sub(clean, '', text)

def truncate_text(text: str, max_length: int, suffix: str = "...") -> str:
    """Truncate text to specified length"""
    if len(text) <= max_length:
        return text
    
    return text[:max_length - len(suffix)] + suffix

def generate_slug(text: str, max_length: int = 50) -> str:
    """Generate URL-friendly slug from text"""
    # Convert to lowercase and replace spaces with hyphens
    slug = re.sub(r'[^\w\s-]', '', text.lower())
    slug = re.sub(r'[-\s]+', '-', slug)
    slug = slug.strip('-')
    
    return slug[:max_length]

def validate_json_structure(data: dict, required_structure: dict) -> tuple:
    """Validate JSON data against required structure"""
    errors = []
    
    def check_structure(data_part, structure_part, path=""):
        for key, expected_type in structure_part.items():
            current_path = f"{path}.{key}" if path else key
            
            if key not in data_part:
                errors.append(f"Missing required field: {current_path}")
                continue
            
            value = data_part[key]
            
            if isinstance(expected_type, dict):
                if not isinstance(value, dict):
                    errors.append(f"Field {current_path} must be an object")
                else:
                    check_structure(value, expected_type, current_path)
            elif isinstance(expected_type, list):
                if not isinstance(value, list):
                    errors.append(f"Field {current_path} must be an array")
            elif expected_type == 'string':
                if not isinstance(value, str):
                    errors.append(f"Field {current_path} must be a string")
            elif expected_type == 'number':
                if not isinstance(value, (int, float)):
                    errors.append(f"Field {current_path} must be a number")
            elif expected_type == 'boolean':
                if not isinstance(value, bool):
                    errors.append(f"Field {current_path} must be a boolean")
    
    check_structure(data, required_structure)
    
    return len(errors) == 0, errors

def paginate_query(query, page: int, per_page: int, max_per_page: int = 100):
    """Helper function to paginate SQLAlchemy queries"""
    per_page = min(per_page, max_per_page)
    page = max(page, 1)
    
    pagination = query.paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )
    
    return {
        'items': pagination.items,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev,
            'next_num': pagination.next_num,
            'prev_num': pagination.prev_num
        }
    }

def safe_json_loads(json_string: str, default=None):
    """Safely load JSON string with fallback"""
    try:
        return json.loads(json_string) if json_string else default
    except (json.JSONDecodeError, TypeError):
        return default

def safe_json_dumps(data, default=None):
    """Safely dump data to JSON string"""
    try:
        return json.dumps(data) if data is not None else default
    except (TypeError, ValueError):
        return default