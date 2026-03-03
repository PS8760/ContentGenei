"""
Instagram Advanced Analytics Service
Provides statistical analysis, pattern recognition, sentiment analysis, and ML predictions
"""

import numpy as np
import pandas as pd
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Tuple
from collections import defaultdict, Counter
from flask import current_app
import json

# ML and NLP imports
try:
    from sklearn.linear_model import LinearRegression
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    current_app.logger.warning("scikit-learn not installed - ML predictions disabled")

try:
    from textblob import TextBlob
    TEXTBLOB_AVAILABLE = True
except ImportError:
    TEXTBLOB_AVAILABLE = False
    current_app.logger.warning("textblob not installed - sentiment analysis limited")


class InstagramAnalyticsService:
    """Advanced analytics for Instagram data"""
    
    def __init__(self):
        self.cache = {}
        self.cache_duration = 3600  # 1 hour in seconds
    
    def _get_cache_key(self, prefix: str, connection_id: str) -> str:
        """Generate cache key"""
        return f"{prefix}:{connection_id}"
    
    def _is_cache_valid(self, key: str) -> bool:
        """Check if cached data is still valid"""
        if key not in self.cache:
            return False
        
        cached_time = self.cache[key].get('timestamp')
        if not cached_time:
            return False
        
        age = (datetime.now(timezone.utc) - cached_time).total_seconds()
        return age < self.cache_duration
    
    def _set_cache(self, key: str, data: Any):
        """Store data in cache with timestamp"""
        self.cache[key] = {
            'data': data,
            'timestamp': datetime.now(timezone.utc)
        }
    
    def _get_cache(self, key: str) -> Optional[Any]:
        """Get data from cache if valid"""
        if self._is_cache_valid(key):
            return self.cache[key]['data']
        return None
    
    # ==================== Enhanced Dashboard Metrics ====================
    
    def calculate_enhanced_metrics(self, posts: List[Dict[str, Any]], 
                                   followers_count: int) -> Dict[str, Any]:
        """
        Calculate enhanced dashboard metrics from posts
        """
        if not posts:
            return self._empty_metrics()
        
        df = pd.DataFrame(posts)
        
        # Engagement Rate per post: (likes + comments + saves) / reach * 100
        engagement_rates = []
        for post in posts:
            likes = post.get('like_count', 0)
            comments = post.get('comments_count', 0)
            saves = post.get('saves_count', 0)
            reach = post.get('reach', 0)
            
            if reach > 0:
                eng_rate = ((likes + comments + saves) / reach) * 100
                engagement_rates.append(eng_rate)
        
        avg_engagement_rate = np.mean(engagement_rates) if engagement_rates else 0
        
        # Average Reach
        reaches = [p.get('reach', 0) for p in posts if p.get('reach', 0) > 0]
        avg_reach = np.mean(reaches) if reaches else 0
        
        # Best Performing Content Type
        content_type_performance = self._analyze_content_types(posts)
        
        # Posting Time Performance
        time_performance = self._analyze_posting_times(posts)
        
        # Growth Trend (estimate from engagement)
        growth_trend = self._estimate_growth_trend(posts, followers_count)
        
        return {
            'avg_engagement_rate': round(float(avg_engagement_rate), 2),
            'avg_reach': round(float(avg_reach), 1),
            'best_content_type': content_type_performance,
            'posting_time_performance': time_performance,
            'growth_trend': growth_trend
        }
    
    def _empty_metrics(self) -> Dict[str, Any]:
        """Return empty metrics structure"""
        return {
            'avg_engagement_rate': 0,
            'avg_reach': 0,
            'best_content_type': {},
            'posting_time_performance': {},
            'growth_trend': {}
        }
    
    def _analyze_content_types(self, posts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze performance by content type"""
        type_stats = defaultdict(lambda: {'count': 0, 'total_engagement': 0, 'total_reach': 0})
        
        for post in posts:
            media_type = post.get('media_type', 'IMAGE')
            likes = post.get('like_count', 0)
            comments = post.get('comments_count', 0)
            saves = post.get('saves_count', 0)
            reach = post.get('reach', 0)
            
            engagement = likes + comments + saves
            
            type_stats[media_type]['count'] += 1
            type_stats[media_type]['total_engagement'] += engagement
            type_stats[media_type]['total_reach'] += reach
        
        # Calculate averages
        results = {}
        best_type = None
        best_avg = 0
        
        for media_type, stats in type_stats.items():
            count = stats['count']
            avg_engagement = stats['total_engagement'] / count if count > 0 else 0
            avg_reach = stats['total_reach'] / count if count > 0 else 0
            
            results[media_type] = {
                'count': count,
                'avg_engagement': round(avg_engagement, 1),
                'avg_reach': round(avg_reach, 1)
            }
            
            if avg_engagement > best_avg:
                best_avg = avg_engagement
                best_type = media_type
        
        return {
            'by_type': results,
            'best_type': best_type,
            'best_avg_engagement': round(best_avg, 1)
        }
    
    def _analyze_posting_times(self, posts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze performance by posting time"""
        time_stats = defaultdict(lambda: {'count': 0, 'total_engagement': 0})
        day_stats = defaultdict(lambda: {'count': 0, 'total_engagement': 0})
        
        for post in posts:
            published_at = post.get('published_at')
            if not published_at:
                continue
            
            # Parse datetime
            if isinstance(published_at, str):
                try:
                    dt = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                except:
                    continue
            else:
                dt = published_at
            
            hour = dt.hour
            day = dt.strftime('%A')  # Monday, Tuesday, etc.
            
            likes = post.get('like_count', 0)
            comments = post.get('comments_count', 0)
            saves = post.get('saves_count', 0)
            engagement = likes + comments + saves
            
            time_stats[hour]['count'] += 1
            time_stats[hour]['total_engagement'] += engagement
            
            day_stats[day]['count'] += 1
            day_stats[day]['total_engagement'] += engagement
        
        # Calculate averages and find best times
        hourly_performance = {}
        best_hour = None
        best_hour_avg = 0
        
        for hour, stats in time_stats.items():
            count = stats['count']
            avg_engagement = stats['total_engagement'] / count if count > 0 else 0
            hourly_performance[hour] = {
                'count': count,
                'avg_engagement': round(avg_engagement, 1)
            }
            
            if avg_engagement > best_hour_avg:
                best_hour_avg = avg_engagement
                best_hour = hour
        
        daily_performance = {}
        best_day = None
        best_day_avg = 0
        
        for day, stats in day_stats.items():
            count = stats['count']
            avg_engagement = stats['total_engagement'] / count if count > 0 else 0
            daily_performance[day] = {
                'count': count,
                'avg_engagement': round(avg_engagement, 1)
            }
            
            if avg_engagement > best_day_avg:
                best_day_avg = avg_engagement
                best_day = day
        
        return {
            'by_hour': hourly_performance,
            'by_day': daily_performance,
            'best_hour': best_hour,
            'best_day': best_day,
            'recommendation': f"Post on {best_day}s at {best_hour}:00 for best results" if best_day and best_hour is not None else "Need more data"
        }
    
    def _estimate_growth_trend(self, posts: List[Dict[str, Any]], 
                               current_followers: int) -> Dict[str, Any]:
        """Estimate growth trend from engagement patterns"""
        if not posts or len(posts) < 5:
            return {'trend': 'insufficient_data', 'estimated_growth': 0}
        
        # Sort posts by date
        sorted_posts = sorted(posts, key=lambda x: x.get('published_at', ''), reverse=False)
        
        # Calculate engagement trend over time
        engagement_values = []
        for post in sorted_posts:
            likes = post.get('like_count', 0)
            comments = post.get('comments_count', 0)
            saves = post.get('saves_count', 0)
            engagement_values.append(likes + comments + saves)
        
        # Simple linear regression on engagement
        if len(engagement_values) >= 5:
            x = np.arange(len(engagement_values)).reshape(-1, 1)
            y = np.array(engagement_values)
            
            # Calculate slope
            slope = np.polyfit(range(len(y)), y, 1)[0]
            
            trend = 'growing' if slope > 0 else 'declining' if slope < 0 else 'stable'
            
            # Estimate growth percentage
            avg_engagement = np.mean(engagement_values)
            growth_rate = (slope / avg_engagement * 100) if avg_engagement > 0 else 0
            
            return {
                'trend': trend,
                'estimated_growth_rate': round(float(growth_rate), 2),
                'confidence': 'medium' if len(posts) >= 20 else 'low'
            }
        
        return {'trend': 'insufficient_data', 'estimated_growth_rate': 0}

    
    # ==================== Pattern Recognition ====================
    
    def analyze_caption_length_performance(self, posts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze performance by caption length"""
        buckets = {
            'short': {'range': (0, 50), 'posts': [], 'engagement': []},
            'medium': {'range': (51, 150), 'posts': [], 'engagement': []},
            'long': {'range': (151, 10000), 'posts': [], 'engagement': []}
        }
        
        for post in posts:
            caption = post.get('caption', '')
            caption_length = len(caption) if caption else 0
            
            likes = post.get('like_count', 0)
            comments = post.get('comments_count', 0)
            saves = post.get('saves_count', 0)
            reach = post.get('reach', 1)  # Avoid division by zero
            
            engagement_rate = ((likes + comments + saves) / reach) * 100 if reach > 0 else 0
            
            # Categorize by length
            if caption_length <= 50:
                bucket = 'short'
            elif caption_length <= 150:
                bucket = 'medium'
            else:
                bucket = 'long'
            
            buckets[bucket]['posts'].append(post)
            buckets[bucket]['engagement'].append(engagement_rate)
        
        # Calculate averages
        results = {}
        best_bucket = None
        best_avg = 0
        
        for bucket_name, data in buckets.items():
            count = len(data['posts'])
            avg_engagement = np.mean(data['engagement']) if data['engagement'] else 0
            
            results[bucket_name] = {
                'range': f"{data['range'][0]}-{data['range'][1]} chars",
                'count': count,
                'avg_engagement_rate': round(float(avg_engagement), 2)
            }
            
            if avg_engagement > best_avg and count >= 3:  # Need at least 3 posts
                best_avg = avg_engagement
                best_bucket = bucket_name
        
        return {
            'by_length': results,
            'best_length': best_bucket,
            'best_avg_engagement': round(float(best_avg), 2),
            'recommendation': f"Use {best_bucket} captions ({results[best_bucket]['range']}) for best engagement" if best_bucket else "Need more data"
        }
    
    def analyze_best_posting_time(self, posts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Detailed analysis of best posting times with heatmap data"""
        # Create hour x day matrix
        heatmap_data = defaultdict(lambda: defaultdict(lambda: {'count': 0, 'total_engagement': 0}))
        
        for post in posts:
            published_at = post.get('published_at')
            if not published_at:
                continue
            
            # Parse datetime
            if isinstance(published_at, str):
                try:
                    dt = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                except:
                    continue
            else:
                dt = published_at
            
            hour = dt.hour
            day = dt.strftime('%A')
            
            likes = post.get('like_count', 0)
            comments = post.get('comments_count', 0)
            saves = post.get('saves_count', 0)
            engagement = likes + comments + saves
            
            heatmap_data[day][hour]['count'] += 1
            heatmap_data[day][hour]['total_engagement'] += engagement
        
        # Calculate averages and find top 3 time slots
        time_slots = []
        
        for day, hours in heatmap_data.items():
            for hour, stats in hours.items():
                count = stats['count']
                avg_engagement = stats['total_engagement'] / count if count > 0 else 0
                
                time_slots.append({
                    'day': day,
                    'hour': hour,
                    'count': count,
                    'avg_engagement': round(avg_engagement, 1)
                })
        
        # Sort by engagement and get top 3
        top_slots = sorted(time_slots, key=lambda x: x['avg_engagement'], reverse=True)[:3]
        
        # Format heatmap data for frontend
        heatmap_formatted = {}
        for day, hours in heatmap_data.items():
            heatmap_formatted[day] = {}
            for hour, stats in hours.items():
                count = stats['count']
                avg_engagement = stats['total_engagement'] / count if count > 0 else 0
                heatmap_formatted[day][hour] = round(avg_engagement, 1)
        
        return {
            'heatmap': heatmap_formatted,
            'top_3_slots': top_slots,
            'recommendation': f"Best times: {top_slots[0]['day']} at {top_slots[0]['hour']}:00" if top_slots else "Need more data"
        }
    
    def analyze_best_format(self, posts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze performance by content format"""
        format_stats = defaultdict(lambda: {
            'count': 0,
            'total_likes': 0,
            'total_comments': 0,
            'total_reach': 0,
            'total_saves': 0
        })
        
        for post in posts:
            media_type = post.get('media_type', 'IMAGE')
            
            # Normalize media types
            if media_type in ['VIDEO', 'REELS']:
                format_type = media_type
            elif media_type == 'CAROUSEL_ALBUM':
                format_type = 'CAROUSEL'
            else:
                format_type = 'IMAGE'
            
            format_stats[format_type]['count'] += 1
            format_stats[format_type]['total_likes'] += post.get('like_count', 0)
            format_stats[format_type]['total_comments'] += post.get('comments_count', 0)
            format_stats[format_type]['total_reach'] += post.get('reach', 0)
            format_stats[format_type]['total_saves'] += post.get('saves_count', 0)
        
        # Calculate averages
        results = {}
        best_format = None
        best_engagement = 0
        
        for format_type, stats in format_stats.items():
            count = stats['count']
            if count == 0:
                continue
            
            avg_likes = stats['total_likes'] / count
            avg_comments = stats['total_comments'] / count
            avg_reach = stats['total_reach'] / count
            avg_saves = stats['total_saves'] / count
            avg_engagement = avg_likes + avg_comments + avg_saves
            
            results[format_type] = {
                'count': count,
                'avg_likes': round(avg_likes, 1),
                'avg_comments': round(avg_comments, 1),
                'avg_reach': round(avg_reach, 1),
                'avg_saves': round(avg_saves, 1),
                'avg_total_engagement': round(avg_engagement, 1)
            }
            
            if avg_engagement > best_engagement and count >= 3:
                best_engagement = avg_engagement
                best_format = format_type
        
        return {
            'by_format': results,
            'best_format': best_format,
            'best_avg_engagement': round(best_engagement, 1),
            'recommendation': f"Use {best_format} format for best engagement" if best_format else "Need more data"
        }
    
    # ==================== Sentiment Analysis ====================
    
    def analyze_comment_sentiment(self, comments: List[str], 
                                  use_groq: bool = False,
                                  groq_api_key: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze sentiment of comments
        Uses TextBlob by default, or Groq API if specified
        """
        if not comments:
            return {'positive': 0, 'neutral': 0, 'negative': 0, 'total': 0}
        
        sentiments = {'positive': 0, 'neutral': 0, 'negative': 0}
        
        if use_groq and groq_api_key and TEXTBLOB_AVAILABLE:
            # Use Groq API for sentiment (batch processing)
            sentiments = self._analyze_sentiment_groq(comments, groq_api_key)
        elif TEXTBLOB_AVAILABLE:
            # Use TextBlob
            for comment in comments:
                sentiment = self._classify_sentiment_textblob(comment)
                sentiments[sentiment] += 1
        else:
            # Fallback: simple keyword-based sentiment
            for comment in comments:
                sentiment = self._classify_sentiment_simple(comment)
                sentiments[sentiment] += 1
        
        total = len(comments)
        return {
            'positive': sentiments['positive'],
            'neutral': sentiments['neutral'],
            'negative': sentiments['negative'],
            'total': total,
            'positive_pct': round((sentiments['positive'] / total) * 100, 1) if total > 0 else 0,
            'neutral_pct': round((sentiments['neutral'] / total) * 100, 1) if total > 0 else 0,
            'negative_pct': round((sentiments['negative'] / total) * 100, 1) if total > 0 else 0
        }
    
    def _classify_sentiment_textblob(self, text: str) -> str:
        """Classify sentiment using TextBlob"""
        try:
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity
            
            if polarity > 0.1:
                return 'positive'
            elif polarity < -0.1:
                return 'negative'
            else:
                return 'neutral'
        except:
            return 'neutral'
    
    def _classify_sentiment_simple(self, text: str) -> str:
        """Simple keyword-based sentiment classification"""
        text_lower = text.lower()
        
        positive_words = ['love', 'great', 'awesome', 'amazing', 'beautiful', 'perfect', 
                         'excellent', 'wonderful', 'fantastic', 'best', 'good', '❤️', '😍', '🔥']
        negative_words = ['hate', 'bad', 'terrible', 'awful', 'worst', 'horrible', 
                         'disappointing', 'poor', 'sad', '😢', '😞', '👎']
        
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            return 'positive'
        elif negative_count > positive_count:
            return 'negative'
        else:
            return 'neutral'
    
    def _analyze_sentiment_groq(self, comments: List[str], api_key: str) -> Dict[str, int]:
        """Analyze sentiment using Groq API (batch)"""
        # This would call Groq API for sentiment analysis
        # For now, fallback to TextBlob
        sentiments = {'positive': 0, 'neutral': 0, 'negative': 0}
        
        for comment in comments:
            sentiment = self._classify_sentiment_textblob(comment)
            sentiments[sentiment] += 1
        
        return sentiments
    
    def identify_emotional_triggers(self, posts: List[Dict[str, Any]], 
                                   comments_by_post: Dict[str, List[str]]) -> List[Dict[str, Any]]:
        """
        Identify which post topics/captions generate the most positive comments
        """
        post_sentiments = []
        
        for post in posts:
            post_id = post.get('instagram_post_id')
            caption = post.get('caption', '')
            comments = comments_by_post.get(post_id, [])
            
            if not comments:
                continue
            
            sentiment_analysis = self.analyze_comment_sentiment(comments)
            positive_pct = sentiment_analysis['positive_pct']
            
            # Extract keywords from caption
            keywords = self._extract_keywords(caption)
            
            post_sentiments.append({
                'post_id': post_id,
                'caption_preview': caption[:100] if caption else '',
                'keywords': keywords,
                'positive_pct': positive_pct,
                'total_comments': len(comments),
                'sentiment_breakdown': sentiment_analysis
            })
        
        # Sort by positive percentage and return top 3
        top_triggers = sorted(post_sentiments, key=lambda x: x['positive_pct'], reverse=True)[:3]
        
        return top_triggers
    
    def _extract_keywords(self, text: str, max_keywords: int = 5) -> List[str]:
        """Extract keywords from text"""
        if not text:
            return []
        
        # Simple keyword extraction: most common words (excluding common words)
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
                     'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 
                     'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 
                     'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 
                     'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'}
        
        words = text.lower().split()
        keywords = [w.strip('.,!?;:') for w in words if w.strip('.,!?;:') not in stop_words and len(w) > 3]
        
        # Count frequency
        word_counts = Counter(keywords)
        return [word for word, count in word_counts.most_common(max_keywords)]

    
    # ==================== ML Predictions ====================
    
    def predict_engagement_range(self, posts: List[Dict[str, Any]], 
                                new_post_features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict engagement range for a new post using linear regression
        Features: caption_length, format (encoded), posting_hour, hashtag_count
        """
        if not SKLEARN_AVAILABLE:
            return {
                'error': 'scikit-learn not installed',
                'predicted_likes_min': 0,
                'predicted_likes_max': 0,
                'predicted_comments_min': 0,
                'predicted_comments_max': 0,
                'confidence': 'unavailable'
            }
        
        if len(posts) < 3:
            return {
                'error': 'Need at least 3 posts for prediction',
                'predicted_likes_min': 0,
                'predicted_likes_max': 0,
                'predicted_comments_min': 0,
                'predicted_comments_max': 0,
                'confidence': 'insufficient_data'
            }
        
        # Prepare training data
        X_train = []
        y_likes = []
        y_comments = []
        
        for post in posts:
            features = self._extract_post_features(post)
            if features:
                X_train.append(features)
                y_likes.append(post.get('like_count', 0))
                y_comments.append(post.get('comments_count', 0))
        
        if len(X_train) < 3:
            return {
                'error': 'Insufficient valid training data (need at least 3 posts)',
                'predicted_likes_min': 0,
                'predicted_likes_max': 0,
                'predicted_comments_min': 0,
                'predicted_comments_max': 0,
                'confidence': 'insufficient_data'
            }
        
        X_train = np.array(X_train)
        y_likes = np.array(y_likes)
        y_comments = np.array(y_comments)
        
        # Train models
        try:
            # Likes prediction
            model_likes = LinearRegression()
            model_likes.fit(X_train, y_likes)
            
            # Comments prediction
            model_comments = LinearRegression()
            model_comments.fit(X_train, y_comments)
            
            # Prepare new post features
            new_features = self._extract_post_features(new_post_features)
            if not new_features:
                return {'error': 'Could not extract features from new post'}
            
            X_new = np.array([new_features])
            
            # Predict
            pred_likes = model_likes.predict(X_new)[0]
            pred_comments = model_comments.predict(X_new)[0]
            
            # Calculate confidence based on R² score
            r2_likes = model_likes.score(X_train, y_likes)
            r2_comments = model_comments.score(X_train, y_comments)
            avg_r2 = (r2_likes + r2_comments) / 2
            
            # Add margin of error (±20%)
            likes_min = max(0, int(pred_likes * 0.8))
            likes_max = int(pred_likes * 1.2)
            comments_min = max(0, int(pred_comments * 0.8))
            comments_max = int(pred_comments * 1.2)
            
            confidence = 'high' if avg_r2 > 0.7 else 'medium' if avg_r2 > 0.4 else 'low'
            
            return {
                'predicted_likes_min': likes_min,
                'predicted_likes_max': likes_max,
                'predicted_comments_min': comments_min,
                'predicted_comments_max': comments_max,
                'confidence': confidence,
                'confidence_score': round(float(avg_r2), 2),
                'training_samples': len(X_train)
            }
            
        except Exception as e:
            current_app.logger.error(f"ML prediction error: {str(e)}")
            return {
                'error': f'Prediction failed: {str(e)}',
                'predicted_likes_min': 0,
                'predicted_likes_max': 0,
                'predicted_comments_min': 0,
                'predicted_comments_max': 0,
                'confidence': 'error'
            }
    
    def _extract_post_features(self, post: Dict[str, Any]) -> Optional[List[float]]:
        """Extract numerical features from post for ML"""
        try:
            # Caption length
            caption = post.get('caption', '')
            caption_length = len(caption) if caption else 0
            
            # Format (one-hot encoded)
            media_type = post.get('media_type', 'IMAGE')
            is_image = 1 if media_type == 'IMAGE' else 0
            is_video = 1 if media_type in ['VIDEO', 'REELS'] else 0
            is_carousel = 1 if media_type == 'CAROUSEL_ALBUM' else 0
            
            # Posting hour
            published_at = post.get('published_at')
            if published_at:
                if isinstance(published_at, str):
                    try:
                        dt = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                    except:
                        dt = datetime.now(timezone.utc)
                else:
                    dt = published_at
                posting_hour = dt.hour
            else:
                posting_hour = 12  # Default
            
            # Hashtag count
            hashtag_count = caption.count('#') if caption else 0
            
            return [
                float(caption_length),
                float(is_image),
                float(is_video),
                float(is_carousel),
                float(posting_hour),
                float(hashtag_count)
            ]
        except Exception as e:
            current_app.logger.error(f"Feature extraction error: {str(e)}")
            return None
    
    def suggest_optimal_posting_times(self, posts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Suggest optimal posting times based on historical engagement
        Returns top 3 time slots per week with confidence levels
        """
        if len(posts) < 3:
            return {
                'top_3_times': [],
                'confidence': 'low',
                'message': 'Need at least 10 posts for reliable recommendations'
            }
        
        # Analyze posting times
        time_analysis = self.analyze_best_posting_time(posts)
        top_slots = time_analysis.get('top_3_slots', [])
        
        # Calculate confidence based on data amount
        total_posts = len(posts)
        confidence = 'high' if total_posts >= 30 else 'medium' if total_posts >= 20 else 'low'
        
        # Format recommendations
        recommendations = []
        for slot in top_slots:
            recommendations.append({
                'day': slot['day'],
                'hour': slot['hour'],
                'time_formatted': f"{slot['day']} at {slot['hour']:02d}:00",
                'avg_engagement': slot['avg_engagement'],
                'sample_size': slot['count']
            })
        
        return {
            'top_3_times': recommendations,
            'confidence': confidence,
            'confidence_level': f"{confidence.upper()} - Based on {total_posts} posts",
            'message': f"Post on {recommendations[0]['time_formatted']} for best results" if recommendations else "Need more data"
        }
    
    # ==================== Enhanced Competitor Comparison ====================
    
    def compare_with_competitor(self, user_posts: List[Dict[str, Any]], 
                               user_followers: int,
                               competitor_posts: List[Dict[str, Any]], 
                               competitor_followers: int) -> Dict[str, Any]:
        """
        Enhanced competitor comparison with detailed metrics
        """
        # User metrics
        user_metrics = self._calculate_account_metrics(user_posts, user_followers)
        
        # Competitor metrics
        competitor_metrics = self._calculate_account_metrics(competitor_posts, competitor_followers)
        
        # Content type breakdown
        user_content_breakdown = self._get_content_type_breakdown(user_posts)
        competitor_content_breakdown = self._get_content_type_breakdown(competitor_posts)
        
        # Best posting times
        user_best_times = self.analyze_best_posting_time(user_posts)
        competitor_best_times = self.analyze_best_posting_time(competitor_posts)
        
        return {
            'user': {
                'followers': user_followers,
                'avg_engagement_rate': user_metrics['avg_engagement_rate'],
                'posting_frequency': user_metrics['posting_frequency'],
                'content_breakdown': user_content_breakdown,
                'best_posting_time': user_best_times.get('recommendation', 'N/A')
            },
            'competitor': {
                'followers': competitor_followers,
                'avg_engagement_rate': competitor_metrics['avg_engagement_rate'],
                'posting_frequency': competitor_metrics['posting_frequency'],
                'content_breakdown': competitor_content_breakdown,
                'best_posting_time': competitor_best_times.get('recommendation', 'N/A')
            },
            'comparison': {
                'follower_difference': user_followers - competitor_followers,
                'engagement_difference': user_metrics['avg_engagement_rate'] - competitor_metrics['avg_engagement_rate'],
                'posting_frequency_difference': user_metrics['posting_frequency'] - competitor_metrics['posting_frequency']
            }
        }
    
    def _calculate_account_metrics(self, posts: List[Dict[str, Any]], 
                                   followers: int) -> Dict[str, Any]:
        """Calculate account-level metrics"""
        if not posts:
            return {
                'avg_engagement_rate': 0,
                'posting_frequency': 0,
                'avg_likes': 0,
                'avg_comments': 0
            }
        
        total_likes = sum(p.get('like_count', 0) for p in posts)
        total_comments = sum(p.get('comments_count', 0) for p in posts)
        total_engagement = total_likes + total_comments
        
        avg_engagement_rate = (total_engagement / (len(posts) * followers)) * 100 if followers > 0 else 0
        
        # Calculate posting frequency (posts per week)
        if len(posts) >= 2:
            sorted_posts = sorted(posts, key=lambda x: x.get('published_at', ''))
            first_date = sorted_posts[0].get('published_at')
            last_date = sorted_posts[-1].get('published_at')
            
            if first_date and last_date:
                try:
                    if isinstance(first_date, str):
                        first_dt = datetime.fromisoformat(first_date.replace('Z', '+00:00'))
                        last_dt = datetime.fromisoformat(last_date.replace('Z', '+00:00'))
                    else:
                        first_dt = first_date
                        last_dt = last_date
                    
                    days_diff = (last_dt - first_dt).days or 1
                    posting_frequency = (len(posts) / days_diff) * 7
                except:
                    posting_frequency = 0
            else:
                posting_frequency = 0
        else:
            posting_frequency = 0
        
        return {
            'avg_engagement_rate': round(float(avg_engagement_rate), 2),
            'posting_frequency': round(float(posting_frequency), 1),
            'avg_likes': round(total_likes / len(posts), 1),
            'avg_comments': round(total_comments / len(posts), 1)
        }
    
    def _get_content_type_breakdown(self, posts: List[Dict[str, Any]]) -> Dict[str, int]:
        """Get content type distribution"""
        breakdown = defaultdict(int)
        
        for post in posts:
            media_type = post.get('media_type', 'IMAGE')
            if media_type in ['VIDEO', 'REELS']:
                breakdown[media_type] += 1
            elif media_type == 'CAROUSEL_ALBUM':
                breakdown['CAROUSEL'] += 1
            else:
                breakdown['IMAGE'] += 1
        
        return dict(breakdown)
