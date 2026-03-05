"""
Instagram AI Strategy Service
Provides AI-powered content intelligence and recommendations
"""

from services.ai_service import AIContentGenerator
from datetime import datetime, timedelta
import json
from collections import Counter
import re


class InstagramAIService:
    def __init__(self):
        self.ai_service = AIContentGenerator()
    
    def analyze_content_gaps(self, user_posts, competitor_posts):
        """
        Analyze content gaps between user and competitors
        Returns actionable insights and recommendations
        """
        # Analyze content types
        user_types = Counter([p.get('media_type') for p in user_posts])
        competitor_types = Counter([p.get('media_type') for p in competitor_posts])
        
        # Analyze posting frequency
        user_frequency = self._calculate_posting_frequency(user_posts)
        competitor_frequency = self._calculate_posting_frequency(competitor_posts)
        
        # Analyze engagement patterns
        user_avg_engagement = sum(p.get('engagement_rate', 0) for p in user_posts) / len(user_posts) if user_posts else 0
        competitor_avg_engagement = sum(p.get('engagement_rate', 0) for p in competitor_posts) / len(competitor_posts) if competitor_posts else 0
        
        # Identify gaps
        gaps = []
        
        # Content type gaps
        for content_type, count in competitor_types.items():
            user_count = user_types.get(content_type, 0)
            if count > user_count * 2:  # Competitor posts 2x more
                gaps.append({
                    'type': 'content_type',
                    'severity': 'high',
                    'title': f'Missing {content_type} Content',
                    'description': f'Competitors post {count} {content_type}s vs your {user_count}',
                    'recommendation': f'Increase {content_type} content by {count - user_count} posts',
                    'priority': 1
                })
        
        # Frequency gap
        if competitor_frequency > user_frequency * 1.5:
            gaps.append({
                'type': 'frequency',
                'severity': 'medium',
                'title': 'Low Posting Frequency',
                'description': f'You post {user_frequency:.1f}x/week vs competitors {competitor_frequency:.1f}x/week',
                'recommendation': f'Increase posting to {competitor_frequency:.1f} posts per week',
                'priority': 2
            })
        
        # Engagement gap
        if competitor_avg_engagement > user_avg_engagement * 1.3:
            gaps.append({
                'type': 'engagement',
                'severity': 'high',
                'title': 'Lower Engagement Rate',
                'description': f'Your engagement: {user_avg_engagement:.2f}% vs competitors: {competitor_avg_engagement:.2f}%',
                'recommendation': 'Optimize content strategy to improve engagement',
                'priority': 1
            })
        
        # Analyze caption patterns
        user_captions = [p.get('caption', '') for p in user_posts if p.get('caption')]
        competitor_captions = [p.get('caption', '') for p in competitor_posts if p.get('caption')]
        
        user_avg_length = sum(len(c) for c in user_captions) / len(user_captions) if user_captions else 0
        competitor_avg_length = sum(len(c) for c in competitor_captions) / len(competitor_captions) if competitor_captions else 0
        
        if abs(user_avg_length - competitor_avg_length) > 100:
            gaps.append({
                'type': 'caption_length',
                'severity': 'low',
                'title': 'Caption Length Mismatch',
                'description': f'Your captions: {user_avg_length:.0f} chars vs competitors: {competitor_avg_length:.0f} chars',
                'recommendation': f'Adjust caption length to ~{competitor_avg_length:.0f} characters',
                'priority': 3
            })
        
        # Sort by priority
        gaps.sort(key=lambda x: x['priority'])
        
        return {
            'gaps': gaps,
            'summary': {
                'total_gaps': len(gaps),
                'high_priority': len([g for g in gaps if g['severity'] == 'high']),
                'user_posts': len(user_posts),
                'competitor_posts': len(competitor_posts),
                'user_avg_engagement': round(user_avg_engagement, 2),
                'competitor_avg_engagement': round(competitor_avg_engagement, 2)
            }
        }
    
    def _calculate_posting_frequency(self, posts):
        """Calculate posts per week"""
        if not posts or len(posts) < 2:
            return 0
        
        dates = [p.get('published_at') for p in posts if p.get('published_at')]
        if not dates:
            return 0
        
        # Convert string dates to datetime if needed
        parsed_dates = []
        for date in dates:
            if isinstance(date, str):
                try:
                    parsed_dates.append(datetime.fromisoformat(date.replace('Z', '+00:00')))
                except:
                    continue
            else:
                parsed_dates.append(date)
        
        if len(parsed_dates) < 2:
            return 0
        
        oldest = min(parsed_dates)
        newest = max(parsed_dates)
        days_diff = (newest - oldest).days or 1
        
        return (len(posts) / days_diff) * 7
    
    async def optimize_caption(self, original_caption, user_top_posts, target_engagement=None):
        """
        Optimize caption based on user's top-performing posts
        Returns optimized caption with predicted improvement
        """
        # Analyze top posts to extract patterns
        patterns = self._extract_caption_patterns(user_top_posts)
        
        # Create optimization prompt
        prompt = f"""You are an Instagram caption optimization expert. Analyze and improve this caption.

ORIGINAL CAPTION:
{original_caption}

USER'S TOP PERFORMING PATTERNS:
- Average length: {patterns['avg_length']} characters
- Common hooks: {', '.join(patterns['hooks'][:3])}
- Engagement triggers: {', '.join(patterns['triggers'][:3])}
- Hashtag count: {patterns['avg_hashtags']}
- Emoji usage: {patterns['emoji_usage']}
- CTA style: {patterns['cta_style']}

OPTIMIZATION REQUIREMENTS:
1. Maintain the core message
2. Apply proven patterns from top posts
3. Add engaging hook in first line
4. Include clear call-to-action
5. Optimize hashtag strategy
6. Use emojis strategically
7. Keep authentic brand voice

OPTIMIZED CAPTION:
[Write the optimized caption here]

IMPROVEMENTS MADE:
[List 3-4 specific improvements]

PREDICTED IMPACT:
[Estimate engagement improvement percentage]"""

        result = self.ai_service.generate_content(
            prompt=prompt,
            content_type='chat',
            tone='professional',
            max_tokens=800
        )
        
        if result.get('success'):
            content = result.get('content', '')
            
            # Parse the response
            optimized_caption = self._extract_section(content, 'OPTIMIZED CAPTION:', 'IMPROVEMENTS MADE:')
            improvements = self._extract_section(content, 'IMPROVEMENTS MADE:', 'PREDICTED IMPACT:')
            predicted_impact = self._extract_section(content, 'PREDICTED IMPACT:', None)
            
            return {
                'success': True,
                'original_caption': original_caption,
                'optimized_caption': optimized_caption.strip(),
                'improvements': improvements.strip().split('\n'),
                'predicted_improvement': predicted_impact.strip(),
                'patterns_used': patterns
            }
        
        return {
            'success': False,
            'error': 'Failed to optimize caption'
        }
    
    def _extract_caption_patterns(self, top_posts):
        """Extract patterns from top-performing posts"""
        captions = [p.get('caption', '') for p in top_posts if p.get('caption')]
        
        if not captions:
            return {
                'avg_length': 150,
                'hooks': ['Question', 'Bold statement', 'Emoji'],
                'triggers': ['Call-to-action', 'Urgency', 'Value'],
                'avg_hashtags': 5,
                'emoji_usage': 'moderate',
                'cta_style': 'direct'
            }
        
        # Calculate average length
        avg_length = sum(len(c) for c in captions) / len(captions)
        
        # Extract hooks (first line patterns)
        hooks = []
        for caption in captions:
            first_line = caption.split('\n')[0] if '\n' in caption else caption[:50]
            if '?' in first_line:
                hooks.append('Question')
            elif any(word in first_line.lower() for word in ['stop', 'wait', 'attention', 'breaking']):
                hooks.append('Bold statement')
            elif any(char in first_line for char in ['🔥', '⚡', '💡', '🚀']):
                hooks.append('Emoji hook')
        
        # Extract engagement triggers
        triggers = []
        combined = ' '.join(captions).lower()
        if any(word in combined for word in ['comment', 'share', 'tag', 'follow']):
            triggers.append('Call-to-action')
        if any(word in combined for word in ['now', 'today', 'limited', 'hurry']):
            triggers.append('Urgency')
        if any(word in combined for word in ['tip', 'how to', 'guide', 'learn']):
            triggers.append('Value')
        
        # Count hashtags
        hashtag_counts = [len(re.findall(r'#\w+', c)) for c in captions]
        avg_hashtags = sum(hashtag_counts) / len(hashtag_counts) if hashtag_counts else 5
        
        # Emoji usage
        emoji_counts = [len(re.findall(r'[\U0001F300-\U0001F9FF]', c)) for c in captions]
        avg_emojis = sum(emoji_counts) / len(emoji_counts) if emoji_counts else 0
        emoji_usage = 'high' if avg_emojis > 5 else 'moderate' if avg_emojis > 2 else 'low'
        
        return {
            'avg_length': int(avg_length),
            'hooks': list(set(hooks)) or ['Question', 'Bold statement'],
            'triggers': list(set(triggers)) or ['Call-to-action', 'Value'],
            'avg_hashtags': int(avg_hashtags),
            'emoji_usage': emoji_usage,
            'cta_style': 'direct' if 'comment' in combined else 'soft'
        }
    
    def _extract_section(self, text, start_marker, end_marker):
        """Extract section between markers"""
        try:
            start_idx = text.find(start_marker)
            if start_idx == -1:
                return ''
            
            start_idx += len(start_marker)
            
            if end_marker:
                end_idx = text.find(end_marker, start_idx)
                if end_idx == -1:
                    return text[start_idx:].strip()
                return text[start_idx:end_idx].strip()
            else:
                return text[start_idx:].strip()
        except:
            return ''
    
    async def predict_performance(self, post_data, historical_posts):
        """
        Predict post performance based on historical data
        Returns predicted engagement rate and confidence score
        """
        # Extract features from post
        features = self._extract_post_features(post_data)
        
        # Analyze historical performance
        similar_posts = self._find_similar_posts(features, historical_posts)
        
        if not similar_posts:
            return {
                'predicted_engagement': 0,
                'confidence': 'low',
                'reasoning': 'Not enough historical data for accurate prediction'
            }
        
        # Calculate prediction
        avg_engagement = sum(p.get('engagement_rate', 0) for p in similar_posts) / len(similar_posts)
        
        # Adjust based on features
        multiplier = 1.0
        reasoning = []
        
        # Content type adjustment
        if features['media_type'] == 'CAROUSEL_ALBUM':
            multiplier *= 1.15
            reasoning.append('Carousel posts typically get 15% more engagement')
        elif features['media_type'] == 'VIDEO':
            multiplier *= 1.10
            reasoning.append('Video content gets 10% more engagement')
        
        # Caption length adjustment
        if 100 <= features['caption_length'] <= 300:
            multiplier *= 1.05
            reasoning.append('Optimal caption length (+5%)')
        
        # Hashtag adjustment
        if 5 <= features['hashtag_count'] <= 10:
            multiplier *= 1.08
            reasoning.append('Optimal hashtag count (+8%)')
        
        # Time-based adjustment (would need actual posting time)
        # multiplier *= time_multiplier
        
        predicted_engagement = avg_engagement * multiplier
        confidence = 'high' if len(similar_posts) >= 10 else 'medium' if len(similar_posts) >= 5 else 'low'
        
        return {
            'predicted_engagement': round(predicted_engagement, 2),
            'confidence': confidence,
            'similar_posts_analyzed': len(similar_posts),
            'reasoning': reasoning,
            'baseline_engagement': round(avg_engagement, 2),
            'multiplier': round(multiplier, 2)
        }
    
    def _extract_post_features(self, post_data):
        """Extract features from post for prediction"""
        caption = post_data.get('caption', '')
        
        return {
            'media_type': post_data.get('media_type', 'IMAGE'),
            'caption_length': len(caption),
            'hashtag_count': len(re.findall(r'#\w+', caption)),
            'emoji_count': len(re.findall(r'[\U0001F300-\U0001F9FF]', caption)),
            'has_cta': any(word in caption.lower() for word in ['comment', 'share', 'tag', 'follow', 'click', 'link']),
            'has_question': '?' in caption
        }
    
    def _find_similar_posts(self, features, historical_posts):
        """Find similar posts from history"""
        similar = []
        
        for post in historical_posts:
            post_features = self._extract_post_features(post)
            
            # Calculate similarity score
            similarity = 0
            
            if post_features['media_type'] == features['media_type']:
                similarity += 3
            
            if abs(post_features['caption_length'] - features['caption_length']) < 100:
                similarity += 2
            
            if abs(post_features['hashtag_count'] - features['hashtag_count']) < 3:
                similarity += 1
            
            if post_features['has_cta'] == features['has_cta']:
                similarity += 1
            
            # Consider similar if score >= 4
            if similarity >= 4:
                similar.append(post)
        
        return similar[:20]  # Return top 20 similar posts
    
    async def generate_content_ideas(self, user_posts, competitor_posts, niche):
        """
        Generate content ideas based on gaps and trends
        Returns list of content ideas with priority
        """
        # Analyze what's working
        top_user_posts = sorted(user_posts, key=lambda x: x.get('engagement_rate', 0), reverse=True)[:5]
        top_competitor_posts = sorted(competitor_posts, key=lambda x: x.get('engagement_rate', 0), reverse=True)[:5]
        
        # Create prompt for AI
        prompt = f"""You are an Instagram content strategist. Generate 10 high-performing content ideas.

NICHE: {niche}

USER'S TOP PERFORMING CONTENT:
{self._format_posts_for_prompt(top_user_posts)}

COMPETITOR'S TOP PERFORMING CONTENT:
{self._format_posts_for_prompt(top_competitor_posts)}

Generate 10 content ideas that:
1. Build on what's working for the user
2. Fill gaps in their content strategy
3. Leverage competitor insights
4. Are specific and actionable
5. Have high viral potential

Format each idea as:
[Content Type] - [Specific Topic] - [Hook/Angle] - [Why it will work]

CONTENT IDEAS:"""

        result = self.ai_service.generate_content(
            prompt=prompt,
            content_type='chat',
            tone='professional',
            max_tokens=1000
        )
        
        if result.get('success'):
            content = result.get('content', '')
            ideas = [line.strip() for line in content.split('\n') if line.strip() and not line.strip().startswith('CONTENT IDEAS:')]
            
            return {
                'success': True,
                'ideas': ideas[:10],
                'based_on': {
                    'user_top_posts': len(top_user_posts),
                    'competitor_top_posts': len(top_competitor_posts)
                }
            }
        
        return {
            'success': False,
            'error': 'Failed to generate content ideas'
        }
    
    def _format_posts_for_prompt(self, posts):
        """Format posts for AI prompt"""
        formatted = []
        for i, post in enumerate(posts[:5], 1):
            caption = post.get('caption', '')[:100] + '...' if post.get('caption') else 'No caption'
            formatted.append(
                f"{i}. {post.get('media_type')} - {post.get('engagement_rate', 0):.1f}% engagement - \"{caption}\""
            )
        return '\n'.join(formatted) if formatted else 'No posts available'
