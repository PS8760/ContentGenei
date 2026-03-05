"""
Instagram ML Service - Advanced Machine Learning Features
Provides pattern recognition, sentiment analysis, and ML-based recommendations
"""

import numpy as np
from datetime import datetime, timedelta
from collections import Counter, defaultdict
import re
from textblob import TextBlob
from scipy import stats
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import json


class InstagramMLService:
    """Advanced ML service for Instagram analytics"""
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.engagement_model = None
        
    # ==================== PATTERN RECOGNITION ====================
    
    def analyze_patterns(self, posts):
        """
        Comprehensive pattern recognition analysis
        Returns best caption length, posting time, and format
        """
        if not posts or len(posts) < 5:
            return {
                'success': False,
                'error': 'Need at least 5 posts for pattern analysis'
            }
        
        # Analyze caption length patterns
        caption_analysis = self._analyze_caption_length_pattern(posts)
        
        # Analyze posting time patterns
        time_analysis = self._analyze_posting_time_pattern(posts)
        
        # Analyze format patterns
        format_analysis = self._analyze_format_pattern(posts)
        
        # Analyze hashtag patterns
        hashtag_analysis = self._analyze_hashtag_pattern(posts)
        
        # Analyze emoji patterns
        emoji_analysis = self._analyze_emoji_pattern(posts)
        
        return {
            'success': True,
            'patterns': {
                'caption_length': caption_analysis,
                'posting_time': time_analysis,
                'format': format_analysis,
                'hashtags': hashtag_analysis,
                'emojis': emoji_analysis
            },
            'recommendations': self._generate_pattern_recommendations(
                caption_analysis, time_analysis, format_analysis
            )
        }
    
    def _analyze_caption_length_pattern(self, posts):
        """Analyze correlation between caption length and engagement"""
        data = []
        for post in posts:
            caption = post.get('caption', '')
            engagement = post.get('engagement_rate', 0)
            if caption and engagement > 0:
                data.append({
                    'length': len(caption),
                    'engagement': engagement
                })
        
        if len(data) < 3:
            return {'optimal_length': 150, 'confidence': 'low', 'correlation': 0}
        
        lengths = [d['length'] for d in data]
        engagements = [d['engagement'] for d in data]
        
        # Calculate correlation
        correlation, p_value = stats.pearsonr(lengths, engagements)
        
        # Find optimal length range (group by ranges)
        length_ranges = {
            'short (0-100)': [],
            'medium (100-300)': [],
            'long (300-500)': [],
            'very_long (500+)': []
        }
        
        for d in data:
            length = d['length']
            engagement = d['engagement']
            if length < 100:
                length_ranges['short (0-100)'].append(engagement)
            elif length < 300:
                length_ranges['medium (100-300)'].append(engagement)
            elif length < 500:
                length_ranges['long (300-500)'].append(engagement)
            else:
                length_ranges['very_long (500+)'].append(engagement)
        
        # Calculate average engagement per range
        range_averages = {}
        for range_name, engagements in length_ranges.items():
            if engagements:
                range_averages[range_name] = np.mean(engagements)
        
        # Find best performing range
        best_range = max(range_averages.items(), key=lambda x: x[1]) if range_averages else ('medium (100-300)', 0)
        
        # Determine optimal length
        optimal_map = {
            'short (0-100)': 75,
            'medium (100-300)': 200,
            'long (300-500)': 400,
            'very_long (500+)': 600
        }
        optimal_length = optimal_map.get(best_range[0], 200)
        
        # Confidence based on sample size and correlation
        confidence = 'high' if len(data) >= 20 and abs(correlation) > 0.3 else \
                    'medium' if len(data) >= 10 else 'low'
        
        return {
            'optimal_length': optimal_length,
            'optimal_range': best_range[0],
            'avg_engagement_at_optimal': round(best_range[1], 2),
            'correlation': round(correlation, 3),
            'p_value': round(p_value, 3),
            'confidence': confidence,
            'sample_size': len(data),
            'range_performance': {k: round(v, 2) for k, v in range_averages.items()}
        }
    
    def _analyze_posting_time_pattern(self, posts):
        """Analyze best posting times using statistical analysis"""
        time_data = defaultdict(list)
        day_data = defaultdict(list)
        
        for post in posts:
            published_at = post.get('published_at')
            engagement = post.get('engagement_rate', 0)
            
            if not published_at or engagement == 0:
                continue
            
            # Parse datetime
            if isinstance(published_at, str):
                try:
                    dt = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                except:
                    continue
            else:
                dt = published_at
            
            # Group by hour
            hour = dt.hour
            time_data[hour].append(engagement)
            
            # Group by day of week
            day = dt.strftime('%A')
            day_data[day].append(engagement)
        
        if not time_data:
            return {
                'best_hours': [9, 12, 18],
                'best_days': ['Monday', 'Wednesday', 'Friday'],
                'confidence': 'low'
            }
        
        # Calculate average engagement per hour
        hour_averages = {hour: np.mean(engagements) for hour, engagements in time_data.items()}
        
        # Calculate average engagement per day
        day_averages = {day: np.mean(engagements) for day, engagements in day_data.items()}
        
        # Find top 3 hours
        top_hours = sorted(hour_averages.items(), key=lambda x: x[1], reverse=True)[:3]
        best_hours = [hour for hour, _ in top_hours]
        
        # Find top 3 days
        top_days = sorted(day_averages.items(), key=lambda x: x[1], reverse=True)[:3]
        best_days = [day for day, _ in top_days]
        
        # Calculate confidence
        total_posts = len([p for p in posts if p.get('published_at')])
        confidence = 'high' if total_posts >= 30 else 'medium' if total_posts >= 15 else 'low'
        
        return {
            'best_hours': best_hours,
            'best_days': best_days,
            'hour_performance': {str(h): round(e, 2) for h, e in hour_averages.items()},
            'day_performance': {d: round(e, 2) for d, e in day_averages.items()},
            'confidence': confidence,
            'sample_size': total_posts,
            'peak_time': f"{best_hours[0]}:00" if best_hours else "12:00",
            'peak_day': best_days[0] if best_days else "Wednesday"
        }
    
    def _analyze_format_pattern(self, posts):
        """Analyze which content formats perform best"""
        format_data = defaultdict(list)
        
        for post in posts:
            media_type = post.get('media_type', 'IMAGE')
            engagement = post.get('engagement_rate', 0)
            
            if engagement > 0:
                format_data[media_type].append(engagement)
        
        if not format_data:
            return {'best_format': 'CAROUSEL_ALBUM', 'confidence': 'low'}
        
        # Calculate average engagement per format
        format_averages = {
            format_type: {
                'avg_engagement': np.mean(engagements),
                'median_engagement': np.median(engagements),
                'count': len(engagements),
                'std_dev': np.std(engagements)
            }
            for format_type, engagements in format_data.items()
        }
        
        # Find best format
        best_format = max(format_averages.items(), key=lambda x: x[1]['avg_engagement'])
        
        # Calculate confidence based on sample size
        total_posts = sum(data['count'] for data in format_averages.values())
        confidence = 'high' if total_posts >= 20 else 'medium' if total_posts >= 10 else 'low'
        
        return {
            'best_format': best_format[0],
            'avg_engagement': round(best_format[1]['avg_engagement'], 2),
            'format_performance': {
                fmt: {
                    'avg_engagement': round(data['avg_engagement'], 2),
                    'count': data['count'],
                    'consistency': 'high' if data['std_dev'] < 2 else 'medium' if data['std_dev'] < 4 else 'low'
                }
                for fmt, data in format_averages.items()
            },
            'confidence': confidence,
            'recommendation': self._get_format_recommendation(best_format[0])
        }
    
    def _analyze_hashtag_pattern(self, posts):
        """Analyze optimal hashtag count and strategy"""
        hashtag_data = []
        
        for post in posts:
            caption = post.get('caption', '')
            engagement = post.get('engagement_rate', 0)
            
            if caption and engagement > 0:
                hashtag_count = len(re.findall(r'#\w+', caption))
                hashtag_data.append({
                    'count': hashtag_count,
                    'engagement': engagement
                })
        
        if len(hashtag_data) < 3:
            return {'optimal_count': 7, 'confidence': 'low'}
        
        # Group by hashtag count ranges
        ranges = {
            '0-3': [],
            '4-7': [],
            '8-15': [],
            '16-30': []
        }
        
        for data in hashtag_data:
            count = data['count']
            engagement = data['engagement']
            
            if count <= 3:
                ranges['0-3'].append(engagement)
            elif count <= 7:
                ranges['4-7'].append(engagement)
            elif count <= 15:
                ranges['8-15'].append(engagement)
            else:
                ranges['16-30'].append(engagement)
        
        # Calculate averages
        range_averages = {
            range_name: np.mean(engagements) if engagements else 0
            for range_name, engagements in ranges.items()
        }
        
        # Find best range
        best_range = max(range_averages.items(), key=lambda x: x[1])
        
        # Map to optimal count
        optimal_map = {
            '0-3': 3,
            '4-7': 7,
            '8-15': 10,
            '16-30': 20
        }
        
        return {
            'optimal_count': optimal_map[best_range[0]],
            'optimal_range': best_range[0],
            'avg_engagement': round(best_range[1], 2),
            'range_performance': {k: round(v, 2) for k, v in range_averages.items()},
            'confidence': 'high' if len(hashtag_data) >= 15 else 'medium'
        }
    
    def _analyze_emoji_pattern(self, posts):
        """Analyze emoji usage patterns"""
        emoji_data = []
        
        for post in posts:
            caption = post.get('caption', '')
            engagement = post.get('engagement_rate', 0)
            
            if caption and engagement > 0:
                emoji_count = len(re.findall(r'[\U0001F300-\U0001F9FF]', caption))
                emoji_data.append({
                    'count': emoji_count,
                    'engagement': engagement
                })
        
        if len(emoji_data) < 3:
            return {'optimal_count': 3, 'confidence': 'low'}
        
        # Group by emoji count
        ranges = {
            'none (0)': [],
            'few (1-3)': [],
            'moderate (4-7)': [],
            'many (8+)': []
        }
        
        for data in emoji_data:
            count = data['count']
            engagement = data['engagement']
            
            if count == 0:
                ranges['none (0)'].append(engagement)
            elif count <= 3:
                ranges['few (1-3)'].append(engagement)
            elif count <= 7:
                ranges['moderate (4-7)'].append(engagement)
            else:
                ranges['many (8+)'].append(engagement)
        
        range_averages = {
            range_name: np.mean(engagements) if engagements else 0
            for range_name, engagements in ranges.items()
        }
        
        best_range = max(range_averages.items(), key=lambda x: x[1])
        
        optimal_map = {
            'none (0)': 0,
            'few (1-3)': 3,
            'moderate (4-7)': 5,
            'many (8+)': 10
        }
        
        return {
            'optimal_count': optimal_map[best_range[0]],
            'optimal_range': best_range[0],
            'avg_engagement': round(best_range[1], 2),
            'range_performance': {k: round(v, 2) for k, v in range_averages.items()}
        }
    
    def _get_format_recommendation(self, best_format):
        """Get recommendation based on best format"""
        recommendations = {
            'CAROUSEL_ALBUM': 'Create more carousel posts with 5-10 slides for maximum engagement',
            'VIDEO': 'Focus on video content with 15-60 second duration',
            'IMAGE': 'High-quality single images work best for your audience'
        }
        return recommendations.get(best_format, 'Experiment with different formats')
    
    def _generate_pattern_recommendations(self, caption_analysis, time_analysis, format_analysis):
        """Generate actionable recommendations from pattern analysis"""
        recommendations = []
        
        # Caption length recommendation
        if caption_analysis.get('confidence') in ['high', 'medium']:
            recommendations.append({
                'type': 'caption_length',
                'priority': 'high',
                'recommendation': f"Write captions around {caption_analysis['optimal_length']} characters ({caption_analysis['optimal_range']})",
                'expected_impact': f"+{round((caption_analysis['avg_engagement_at_optimal'] - 3) * 10, 1)}% engagement",
                'confidence': caption_analysis['confidence']
            })
        
        # Posting time recommendation
        if time_analysis.get('confidence') in ['high', 'medium'] and len(time_analysis.get('best_hours', [])) >= 2:
            best_hours = time_analysis['best_hours']
            best_days = time_analysis['best_days']
            recommendations.append({
                'type': 'posting_time',
                'priority': 'high',
                'recommendation': f"Post on {', '.join(best_days[:2])} at {best_hours[0]}:00 or {best_hours[1]}:00",
                'expected_impact': "+15-25% engagement",
                'confidence': time_analysis['confidence']
            })
        
        # Format recommendation
        if format_analysis.get('confidence') in ['high', 'medium']:
            recommendations.append({
                'type': 'content_format',
                'priority': 'medium',
                'recommendation': format_analysis['recommendation'],
                'expected_impact': f"+{round((format_analysis['avg_engagement'] - 3) * 10, 1)}% engagement",
                'confidence': format_analysis['confidence']
            })
        
        return recommendations
    
    # ==================== SENTIMENT ANALYSIS ====================
    
    def analyze_sentiment(self, comments):
        """
        Analyze sentiment of comments to identify emotional triggers
        Returns sentiment breakdown and emotional patterns
        """
        if not comments:
            return {
                'success': False,
                'error': 'No comments to analyze'
            }
        
        sentiments = []
        emotions = []
        triggers = []
        
        for comment in comments:
            text = comment.get('text', '')
            if not text:
                continue
            
            # Perform sentiment analysis
            blob = TextBlob(text)
            sentiment_score = blob.sentiment.polarity
            
            # Categorize sentiment
            if sentiment_score > 0.3:
                sentiment = 'positive'
            elif sentiment_score < -0.3:
                sentiment = 'negative'
            else:
                sentiment = 'neutral'
            
            sentiments.append(sentiment)
            
            # Detect emotions
            emotion = self._detect_emotion(text, sentiment_score)
            emotions.append(emotion)
            
            # Detect triggers
            trigger = self._detect_trigger(text)
            if trigger:
                triggers.append(trigger)
        
        # Calculate statistics
        sentiment_counts = Counter(sentiments)
        emotion_counts = Counter(emotions)
        trigger_counts = Counter(triggers)
        
        total = len(sentiments)
        
        return {
            'success': True,
            'overall_sentiment': {
                'positive': round((sentiment_counts['positive'] / total) * 100, 1),
                'neutral': round((sentiment_counts['neutral'] / total) * 100, 1),
                'negative': round((sentiment_counts['negative'] / total) * 100, 1)
            },
            'dominant_sentiment': sentiment_counts.most_common(1)[0][0],
            'emotions': {
                emotion: count for emotion, count in emotion_counts.most_common(5)
            },
            'top_triggers': [
                {'trigger': trigger, 'count': count}
                for trigger, count in trigger_counts.most_common(5)
            ],
            'total_comments_analyzed': total,
            'insights': self._generate_sentiment_insights(sentiment_counts, emotion_counts, trigger_counts, total)
        }
    
    def _detect_emotion(self, text, sentiment_score):
        """Detect specific emotion from text"""
        text_lower = text.lower()
        
        # Positive emotions
        if any(word in text_lower for word in ['love', '❤️', '😍', 'amazing', 'awesome', 'perfect']):
            return 'love'
        elif any(word in text_lower for word in ['haha', '😂', '🤣', 'funny', 'lol']):
            return 'joy'
        elif any(word in text_lower for word in ['wow', '😮', '🤯', 'incredible', 'mind-blowing']):
            return 'surprise'
        elif any(word in text_lower for word in ['inspiring', '💪', '🔥', 'motivated']):
            return 'inspiration'
        
        # Negative emotions
        elif any(word in text_lower for word in ['sad', '😢', '😭', 'disappointed']):
            return 'sadness'
        elif any(word in text_lower for word in ['angry', '😠', '😡', 'frustrated']):
            return 'anger'
        
        # Default based on sentiment score
        elif sentiment_score > 0.5:
            return 'positive'
        elif sentiment_score < -0.5:
            return 'negative'
        else:
            return 'neutral'
    
    def _detect_trigger(self, text):
        """Detect emotional triggers in comments"""
        text_lower = text.lower()
        
        triggers = {
            'value': ['helpful', 'useful', 'learned', 'tip', 'advice'],
            'relatability': ['same', 'me too', 'relate', 'exactly', 'feel'],
            'curiosity': ['how', 'what', 'where', 'when', 'why', '?'],
            'urgency': ['need', 'want', 'must', 'asap', 'now'],
            'social_proof': ['everyone', 'all', 'trending', 'popular'],
            'exclusivity': ['secret', 'exclusive', 'only', 'limited'],
            'controversy': ['disagree', 'wrong', 'but', 'however', 'actually']
        }
        
        for trigger_type, keywords in triggers.items():
            if any(keyword in text_lower for keyword in keywords):
                return trigger_type
        
        return None
    
    def _generate_sentiment_insights(self, sentiment_counts, emotion_counts, trigger_counts, total):
        """Generate actionable insights from sentiment analysis"""
        insights = []
        
        # Sentiment insight
        positive_pct = (sentiment_counts['positive'] / total) * 100
        if positive_pct > 70:
            insights.append("Your content resonates strongly with your audience (70%+ positive sentiment)")
        elif positive_pct < 40:
            insights.append("Consider adjusting content strategy to improve audience sentiment")
        
        # Emotion insight
        if emotion_counts:
            top_emotion = emotion_counts.most_common(1)[0][0]
            insights.append(f"'{top_emotion}' is the dominant emotional response - leverage this in future content")
        
        # Trigger insight
        if trigger_counts:
            top_trigger = trigger_counts.most_common(1)[0][0]
            insights.append(f"'{top_trigger}' is your strongest engagement trigger - use it more often")
        
        return insights
    
    # ==================== ML RECOMMENDATIONS ====================
    
    def train_engagement_model(self, posts):
        """
        Train a simple ML model to predict engagement
        Uses linear regression with multiple features
        """
        if len(posts) < 10:
            return {
                'success': False,
                'error': 'Need at least 10 posts to train model'
            }
        
        # Prepare training data
        X = []
        y = []
        
        for post in posts:
            features = self._extract_ml_features(post)
            engagement = post.get('engagement_rate', 0)
            
            if engagement > 0:
                X.append(features)
                y.append(engagement)
        
        if len(X) < 10:
            return {
                'success': False,
                'error': 'Not enough valid data for training'
            }
        
        # Train model
        X_array = np.array(X)
        y_array = np.array(y)
        
        # Normalize features
        X_scaled = self.scaler.fit_transform(X_array)
        
        # Train linear regression
        self.engagement_model = LinearRegression()
        self.engagement_model.fit(X_scaled, y_array)
        
        # Calculate R² score
        r2_score = self.engagement_model.score(X_scaled, y_array)
        
        return {
            'success': True,
            'model_trained': True,
            'r2_score': round(r2_score, 3),
            'training_samples': len(X),
            'feature_importance': self._get_feature_importance()
        }
    
    def predict_engagement_ml(self, post_data):
        """
        Predict engagement using trained ML model
        More accurate than rule-based prediction
        """
        if not self.engagement_model:
            return {
                'success': False,
                'error': 'Model not trained. Call train_engagement_model first.'
            }
        
        # Extract features
        features = self._extract_ml_features(post_data)
        
        # Normalize
        features_scaled = self.scaler.transform([features])
        
        # Predict
        predicted_engagement = self.engagement_model.predict(features_scaled)[0]
        
        # Calculate confidence interval (simple approach)
        confidence_range = predicted_engagement * 0.2  # ±20%
        
        return {
            'success': True,
            'predicted_engagement': round(max(0, predicted_engagement), 2),
            'confidence_range': {
                'min': round(max(0, predicted_engagement - confidence_range), 2),
                'max': round(predicted_engagement + confidence_range, 2)
            },
            'model_type': 'linear_regression',
            'recommendation': self._get_ml_recommendation(predicted_engagement)
        }
    
    def _extract_ml_features(self, post):
        """Extract numerical features for ML model"""
        caption = post.get('caption', '')
        
        # Media type encoding
        media_type_map = {'IMAGE': 1, 'VIDEO': 2, 'CAROUSEL_ALBUM': 3}
        media_type = media_type_map.get(post.get('media_type', 'IMAGE'), 1)
        
        # Time features
        published_at = post.get('published_at')
        hour_of_day = 12  # default
        day_of_week = 3   # default (Wednesday)
        
        if published_at:
            if isinstance(published_at, str):
                try:
                    dt = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                    hour_of_day = dt.hour
                    day_of_week = dt.weekday()
                except:
                    pass
            else:
                hour_of_day = published_at.hour
                day_of_week = published_at.weekday()
        
        # Caption features
        caption_length = len(caption)
        hashtag_count = len(re.findall(r'#\w+', caption))
        emoji_count = len(re.findall(r'[\U0001F300-\U0001F9FF]', caption))
        has_cta = 1 if any(word in caption.lower() for word in ['comment', 'share', 'tag', 'follow', 'click']) else 0
        has_question = 1 if '?' in caption else 0
        
        return [
            media_type,
            caption_length,
            hashtag_count,
            emoji_count,
            has_cta,
            has_question,
            hour_of_day,
            day_of_week
        ]
    
    def _get_feature_importance(self):
        """Get feature importance from trained model"""
        if not self.engagement_model:
            return {}
        
        feature_names = [
            'media_type',
            'caption_length',
            'hashtag_count',
            'emoji_count',
            'has_cta',
            'has_question',
            'hour_of_day',
            'day_of_week'
        ]
        
        coefficients = self.engagement_model.coef_
        
        importance = {
            name: round(float(coef), 4)
            for name, coef in zip(feature_names, coefficients)
        }
        
        return importance
    
    def _get_ml_recommendation(self, predicted_engagement):
        """Get recommendation based on predicted engagement"""
        if predicted_engagement >= 8:
            return "Excellent! This post is predicted to perform very well."
        elif predicted_engagement >= 5:
            return "Good engagement expected. Consider minor optimizations."
        elif predicted_engagement >= 3:
            return "Moderate engagement. Try improving caption or posting time."
        else:
            return "Low engagement predicted. Consider significant changes to content."
    
    def recommend_optimal_posting_time(self, posts, target_date=None):
        """
        Recommend optimal posting time for a specific date
        Uses historical data and ML predictions
        """
        if not target_date:
            target_date = datetime.now()
        
        # Analyze historical performance by time
        time_analysis = self._analyze_posting_time_pattern(posts)
        
        if not time_analysis.get('best_hours'):
            return {
                'success': False,
                'error': 'Not enough data for time recommendation'
            }
        
        # Get day of week
        day_name = target_date.strftime('%A')
        
        # Check if this day is in best days
        best_days = time_analysis.get('best_days', [])
        day_performance = time_analysis.get('day_performance', {})
        
        day_score = day_performance.get(day_name, 5.0)
        
        # Get best hours
        best_hours = time_analysis['best_hours']
        hour_performance = time_analysis.get('hour_performance', {})
        
        # Create recommendations for each best hour
        recommendations = []
        for hour in best_hours[:3]:
            hour_score = hour_performance.get(str(hour), 5.0)
            combined_score = (hour_score + day_score) / 2
            
            recommendations.append({
                'time': f"{hour:02d}:00",
                'datetime': target_date.replace(hour=hour, minute=0, second=0),
                'expected_engagement': round(combined_score, 2),
                'confidence': time_analysis['confidence'],
                'reason': f"Historical data shows {hour:02d}:00 on {day_name} performs well"
            })
        
        # Sort by expected engagement
        recommendations.sort(key=lambda x: x['expected_engagement'], reverse=True)
        
        return {
            'success': True,
            'target_date': target_date.strftime('%Y-%m-%d'),
            'day_of_week': day_name,
            'recommendations': recommendations,
            'best_time': recommendations[0]['time'] if recommendations else '12:00',
            'confidence': time_analysis['confidence']
        }
    
    # ==================== MULTI-PLATFORM FOUNDATION ====================
    
    def analyze_cross_platform_performance(self, instagram_posts, other_platform_posts=None):
        """
        Foundation for multi-platform analysis
        Currently supports Instagram, ready for expansion
        """
        platforms = {
            'instagram': {
                'posts': len(instagram_posts),
                'avg_engagement': np.mean([p.get('engagement_rate', 0) for p in instagram_posts]) if instagram_posts else 0,
                'best_format': self._analyze_format_pattern(instagram_posts).get('best_format') if instagram_posts else 'IMAGE'
            }
        }
        
        # Placeholder for other platforms
        if other_platform_posts:
            platforms['other'] = {
                'posts': len(other_platform_posts),
                'avg_engagement': np.mean([p.get('engagement_rate', 0) for p in other_platform_posts]),
                'status': 'ready_for_integration'
            }
        
        return {
            'success': True,
            'platforms': platforms,
            'total_posts': sum(p['posts'] for p in platforms.values()),
            'cross_platform_ready': True,
            'supported_platforms': ['instagram', 'tiktok', 'youtube', 'twitter'],
            'next_platform_recommendation': 'TikTok' if platforms['instagram']['posts'] > 20 else 'Focus on Instagram first'
        }
