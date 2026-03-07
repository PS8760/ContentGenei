"""
Smart Content Analyzer
Provides real-time content analysis and suggestions
"""

import re
from datetime import datetime
from collections import Counter


class ContentAnalyzer:
    """Analyzes content and provides actionable suggestions"""
    
    def __init__(self, user_patterns=None):
        """
        Initialize with user's historical patterns
        user_patterns: dict with optimal values from user's best posts
        """
        self.user_patterns = user_patterns or self._get_default_patterns()
    
    def _get_default_patterns(self):
        """Default patterns if user has no history"""
        return {
            'optimal_caption_length': 150,
            'optimal_hashtag_count': 7,
            'optimal_emoji_count': 3,
            'cta_improves_engagement': True,
            'questions_improve_engagement': True,
            'emojis_improve_engagement': True,
            'best_posting_hours': [12, 19, 21],
            'best_days': ['Monday', 'Wednesday', 'Friday']
        }
    
    def analyze(self, caption, media_type='IMAGE', scheduled_time=None):
        """
        Analyze content and return comprehensive feedback
        
        Returns:
            {
                'score': 85,  # 0-100
                'level': 'high',  # low, medium, high, excellent
                'suggestions': [...],
                'breakdown': {...},
                'expected_engagement': '8-12%'
            }
        """
        # Extract features
        features = self._extract_features(caption)
        
        # Generate suggestions
        suggestions = self._generate_suggestions(caption, media_type, features, scheduled_time)
        
        # Calculate score
        score = self._calculate_score(features, media_type)
        
        # Get breakdown
        breakdown = self._get_score_breakdown(features, media_type)
        
        # Estimate engagement
        expected_engagement = self._estimate_engagement(score)
        
        return {
            'score': score,
            'level': self._get_level(score),
            'suggestions': suggestions,
            'breakdown': breakdown,
            'expected_engagement': expected_engagement,
            'features': features
        }
    
    def _extract_features(self, caption):
        """Extract all features from caption"""
        return {
            'length': len(caption),
            'word_count': len(caption.split()),
            'hashtag_count': len(re.findall(r'#\w+', caption)),
            'hashtags': re.findall(r'#\w+', caption),
            'emoji_count': len(re.findall(r'[\U0001F300-\U0001F9FF]', caption)),
            'has_cta': any(word in caption.lower() for word in ['comment', 'share', 'tag', 'follow', 'click', 'link in bio']),
            'has_question': '?' in caption,
            'has_mention': '@' in caption,
            'has_url': bool(re.search(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', caption)),
            'sentence_count': len([s for s in caption.split('.') if s.strip()]),
            'exclamation_count': caption.count('!'),
            'line_breaks': caption.count('\n')
        }
    
    def _generate_suggestions(self, caption, media_type, features, scheduled_time):
        """Generate actionable suggestions"""
        suggestions = []
        
        # Caption length
        optimal_length = self.user_patterns['optimal_caption_length']
        if features['length'] < 50:
            suggestions.append({
                'type': 'warning',
                'priority': 'high',
                'icon': '⚠️',
                'title': 'Caption is too short',
                'message': f'Add {optimal_length - features["length"]} more characters. Longer captions tell better stories.',
                'action': 'expand_caption',
                'impact': '+20% engagement'
            })
        elif features['length'] < optimal_length - 50:
            suggestions.append({
                'type': 'info',
                'priority': 'medium',
                'icon': 'ℹ️',
                'title': 'Caption could be longer',
                'message': f'Consider adding {optimal_length - features["length"]} more characters for better engagement.',
                'action': 'expand_caption',
                'impact': '+10% engagement'
            })
        elif features['length'] > 2000:
            suggestions.append({
                'type': 'info',
                'priority': 'low',
                'icon': 'ℹ️',
                'title': 'Very long caption',
                'message': 'Long captions work, but consider breaking into paragraphs for readability.',
                'action': 'format_caption',
                'impact': 'Better readability'
            })
        else:
            suggestions.append({
                'type': 'success',
                'priority': 'info',
                'icon': '✅',
                'title': 'Perfect caption length',
                'message': 'Your caption length is optimal for engagement.',
                'action': None,
                'impact': None
            })
        
        # Hashtags
        optimal_hashtags = self.user_patterns['optimal_hashtag_count']
        if features['hashtag_count'] == 0:
            suggestions.append({
                'type': 'warning',
                'priority': 'high',
                'icon': '#️⃣',
                'title': 'No hashtags',
                'message': f'Add {optimal_hashtags} hashtags to increase reach by up to 30%.',
                'action': 'suggest_hashtags',
                'impact': '+30% reach'
            })
        elif features['hashtag_count'] < optimal_hashtags - 3:
            suggestions.append({
                'type': 'info',
                'priority': 'medium',
                'icon': '#️⃣',
                'title': 'Add more hashtags',
                'message': f'Add {optimal_hashtags - features["hashtag_count"]} more hashtags to increase discoverability.',
                'action': 'suggest_hashtags',
                'impact': '+15% reach'
            })
        elif features['hashtag_count'] > 15:
            suggestions.append({
                'type': 'info',
                'priority': 'low',
                'icon': '#️⃣',
                'title': 'Too many hashtags',
                'message': 'Using too many hashtags can look spammy. Try 7-12 for best results.',
                'action': 'reduce_hashtags',
                'impact': 'Better quality'
            })
        else:
            suggestions.append({
                'type': 'success',
                'priority': 'info',
                'icon': '✅',
                'title': 'Good hashtag count',
                'message': f'You\'re using {features["hashtag_count"]} hashtags - perfect for reach.',
                'action': None,
                'impact': None
            })
        
        # Call to action
        if not features['has_cta'] and self.user_patterns['cta_improves_engagement']:
            suggestions.append({
                'type': 'info',
                'priority': 'medium',
                'icon': '💬',
                'title': 'Add a call-to-action',
                'message': 'Encourage engagement with phrases like "Comment below!" or "Tag a friend!"',
                'action': 'add_cta',
                'impact': '+25% comments',
                'examples': [
                    'What do you think? Comment below!',
                    'Tag someone who needs to see this!',
                    'Double tap if you agree!',
                    'Share your thoughts in the comments!'
                ]
            })
        
        # Question
        if not features['has_question'] and self.user_patterns['questions_improve_engagement']:
            suggestions.append({
                'type': 'info',
                'priority': 'medium',
                'icon': '❓',
                'title': 'Ask a question',
                'message': 'Posts with questions get 30% more comments.',
                'action': 'add_question',
                'impact': '+30% comments',
                'examples': [
                    'What\'s your favorite?',
                    'Have you tried this?',
                    'Which one do you prefer?',
                    'What would you do?'
                ]
            })
        
        # Emojis
        optimal_emojis = self.user_patterns['optimal_emoji_count']
        if features['emoji_count'] == 0 and self.user_patterns['emojis_improve_engagement']:
            suggestions.append({
                'type': 'info',
                'priority': 'low',
                'icon': '😊',
                'title': 'Add emojis',
                'message': f'Add {optimal_emojis} emojis to make your post more engaging and visual.',
                'action': 'suggest_emojis',
                'impact': '+10% engagement'
            })
        elif features['emoji_count'] > 10:
            suggestions.append({
                'type': 'info',
                'priority': 'low',
                'icon': '😊',
                'title': 'Too many emojis',
                'message': 'Using too many emojis can be distracting. Try 3-5 for best results.',
                'action': 'reduce_emojis',
                'impact': 'Better readability'
            })
        
        # Posting time
        if scheduled_time:
            best_hours = self.user_patterns['best_posting_hours']
            scheduled_hour = scheduled_time.hour if isinstance(scheduled_time, datetime) else int(scheduled_time.split(':')[0])
            
            if scheduled_hour not in best_hours:
                suggestions.append({
                    'type': 'info',
                    'priority': 'high',
                    'icon': '⏰',
                    'title': 'Not optimal posting time',
                    'message': f'Your audience is most active at {best_hours[0]}:00. Consider rescheduling.',
                    'action': 'suggest_time',
                    'impact': '+20% reach',
                    'best_times': [f'{h}:00' for h in best_hours]
                })
        else:
            best_hours = self.user_patterns['best_posting_hours']
            suggestions.append({
                'type': 'info',
                'priority': 'medium',
                'icon': '⏰',
                'title': 'Schedule for best time',
                'message': f'Post at {best_hours[0]}:00 when your audience is most active.',
                'action': 'suggest_time',
                'impact': '+20% reach',
                'best_times': [f'{h}:00' for h in best_hours]
            })
        
        # Sort by priority
        priority_order = {'high': 0, 'medium': 1, 'low': 2, 'info': 3}
        suggestions.sort(key=lambda x: priority_order.get(x['priority'], 999))
        
        return suggestions
    
    def _calculate_score(self, features, media_type):
        """Calculate overall content score (0-100)"""
        score = 0
        
        # Caption length (0-25 points)
        optimal_length = self.user_patterns['optimal_caption_length']
        if features['length'] >= optimal_length - 50 and features['length'] <= optimal_length + 100:
            score += 25
        elif features['length'] >= 50:
            score += 15
        else:
            score += 5
        
        # Hashtags (0-20 points)
        optimal_hashtags = self.user_patterns['optimal_hashtag_count']
        if features['hashtag_count'] >= optimal_hashtags - 2 and features['hashtag_count'] <= optimal_hashtags + 5:
            score += 20
        elif features['hashtag_count'] >= 3:
            score += 12
        elif features['hashtag_count'] > 0:
            score += 5
        
        # Engagement triggers (0-30 points)
        if features['has_cta']:
            score += 10
        if features['has_question']:
            score += 10
        if features['emoji_count'] >= 2 and features['emoji_count'] <= 7:
            score += 10
        elif features['emoji_count'] > 0:
            score += 5
        
        # Content quality (0-15 points)
        if features['word_count'] >= 20:
            score += 10
        if features['line_breaks'] > 0:  # Formatted for readability
            score += 5
        
        # Media type bonus (0-10 points)
        if media_type == 'CAROUSEL_ALBUM':
            score += 10
        elif media_type == 'VIDEO':
            score += 8
        else:
            score += 5
        
        return min(score, 100)
    
    def _get_score_breakdown(self, features, media_type):
        """Get detailed score breakdown"""
        return {
            'caption_quality': self._score_caption(features),
            'hashtag_strategy': self._score_hashtags(features),
            'engagement_triggers': self._score_engagement(features),
            'content_format': self._score_format(features, media_type)
        }
    
    def _score_caption(self, features):
        """Score caption quality (0-100)"""
        score = 0
        optimal_length = self.user_patterns['optimal_caption_length']
        
        if features['length'] >= optimal_length - 50 and features['length'] <= optimal_length + 100:
            score += 50
        elif features['length'] >= 50:
            score += 30
        
        if features['word_count'] >= 20:
            score += 30
        
        if features['line_breaks'] > 0:
            score += 20
        
        return min(score, 100)
    
    def _score_hashtags(self, features):
        """Score hashtag strategy (0-100)"""
        optimal = self.user_patterns['optimal_hashtag_count']
        count = features['hashtag_count']
        
        if count == 0:
            return 0
        elif count >= optimal - 2 and count <= optimal + 5:
            return 100
        elif count >= 3 and count <= 15:
            return 70
        else:
            return 40
    
    def _score_engagement(self, features):
        """Score engagement triggers (0-100)"""
        score = 0
        
        if features['has_cta']:
            score += 35
        if features['has_question']:
            score += 35
        if features['emoji_count'] >= 2 and features['emoji_count'] <= 7:
            score += 30
        
        return min(score, 100)
    
    def _score_format(self, features, media_type):
        """Score content format (0-100)"""
        score = 50  # Base score
        
        if media_type == 'CAROUSEL_ALBUM':
            score += 30
        elif media_type == 'VIDEO':
            score += 20
        
        if features['line_breaks'] > 0:
            score += 20
        
        return min(score, 100)
    
    def _estimate_engagement(self, score):
        """Estimate engagement range based on score"""
        if score >= 85:
            return {'min': 10, 'max': 15, 'level': 'excellent', 'emoji': '🔥'}
        elif score >= 70:
            return {'min': 7, 'max': 12, 'level': 'high', 'emoji': '🚀'}
        elif score >= 50:
            return {'min': 4, 'max': 8, 'level': 'medium', 'emoji': '📈'}
        else:
            return {'min': 1, 'max': 5, 'level': 'low', 'emoji': '📊'}
    
    def _get_level(self, score):
        """Get level from score"""
        if score >= 85:
            return 'excellent'
        elif score >= 70:
            return 'high'
        elif score >= 50:
            return 'medium'
        else:
            return 'low'
