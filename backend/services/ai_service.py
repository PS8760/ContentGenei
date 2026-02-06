from groq import Groq
import time
import random
from typing import Dict, Any, Optional
from flask import current_app, has_app_context
import json
import os

class AIContentGenerator:
    def __init__(self):
        self.client = None
        # Don't initialize during import, wait for app context
    
    def _initialize_client(self):
        """Initialize Groq client if API key is available"""
        if has_app_context():
            api_key = current_app.config.get('GROQ_API_KEY')
        else:
            api_key = os.environ.get('GROQ_API_KEY')
            
        if api_key:
            self.client = Groq(api_key=api_key)
    
    def generate_content(self, prompt: str, content_type: str, tone: str, **kwargs) -> Dict[str, Any]:
        """
        Generate content using AI or fallback templates
        """
        start_time = time.time()
        
        try:
            if not self.client:
                self._initialize_client()
                
            if self.client and (current_app.config.get('GROQ_API_KEY') if has_app_context() else os.environ.get('GROQ_API_KEY')):
                content = self._generate_with_groq(prompt, content_type, tone, **kwargs)
                model_used = "openai/gpt-oss-120b"
            else:
                content = self._generate_with_templates(prompt, content_type, tone, **kwargs)
                model_used = "template-based"
            
            generation_time = time.time() - start_time
            
            return {
                'success': True,
                'content': content,
                'model_used': model_used,
                'generation_time': generation_time,
                'word_count': len(content.split()),
                'character_count': len(content)
            }
        
        except Exception as e:
            if has_app_context():
                current_app.logger.error(f"Content generation error: {str(e)}")
            else:
                print(f"Content generation error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'generation_time': time.time() - start_time
            }
    
    def _generate_with_groq(self, prompt: str, content_type: str, tone: str, **kwargs) -> str:
        """Generate content using Groq API"""
        
        # Create system message based on content type and tone
        system_message = self._create_system_message(content_type, tone)
        
        # Create user message with better context
        if content_type == 'chat':
            # For chat, the prompt already contains the full context
            user_message = prompt
        else:
            # For content generation, create structured prompt
            user_message = f"Create {content_type} content with a {tone} tone.\n\nTopic/Prompt: {prompt}"
            
            # Add additional context if provided
            if kwargs.get('target_audience'):
                user_message += f"\nTarget audience: {kwargs['target_audience']}"
            if kwargs.get('platform'):
                user_message += f"\nPlatform: {kwargs['platform']}"
            if kwargs.get('word_count'):
                user_message += f"\nApproximate word count: {kwargs['word_count']}"
            
            # Add specific instructions based on content type
            if content_type == 'article':
                user_message += "\n\nProvide a well-structured article with clear sections, engaging introduction, and actionable insights."
            elif content_type == 'social-post':
                user_message += "\n\nCreate an engaging social media post that captures attention and encourages interaction. Include relevant hashtags."
            elif content_type == 'blog':
                user_message += "\n\nWrite a comprehensive blog post with clear headings, valuable information, and SEO-friendly content."
            elif content_type == 'email':
                user_message += "\n\nWrite a compelling email with a strong subject line, clear message, and effective call-to-action."
            elif content_type == 'caption':
                user_message += "\n\nCreate a catchy, engaging caption that complements the content and encourages engagement."
            elif content_type == 'script':
                user_message += "\n\nWrite a video script with clear sections (intro, main content, call-to-action, outro) that keeps viewers engaged."
            elif content_type == 'ad-copy':
                user_message += "\n\nCreate persuasive ad copy that highlights benefits, creates urgency, and drives conversions."
        
        # Adjust temperature based on content type for more natural responses
        # Chat needs higher temperature for more natural, varied responses
        default_temp = 0.9 if content_type == 'chat' else 0.7
        
        # Significantly increased max tokens for better, more complete responses
        # Chat: 4000 tokens (doubled), Content: 16000 tokens (doubled), Summarize: 12000 tokens
        default_max_tokens = 4000 if content_type == 'chat' else 16000
        
        # Generate content using streaming
        completion = self.client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ],
            temperature=kwargs.get('temperature', default_temp),
            max_completion_tokens=kwargs.get('max_tokens', default_max_tokens),
            top_p=1,
            reasoning_effort="medium",
            stream=True,
            stop=None
        )
        
        # Collect the streamed response
        content = ""
        for chunk in completion:
            if chunk.choices[0].delta.content:
                content += chunk.choices[0].delta.content
        
        return content.strip()
    
    def _create_system_message(self, content_type: str, tone: str) -> str:
        """Create system message for OpenAI based on content type and tone"""
        
        base_instructions = {
            'article': "You are an expert content writer specializing in creating engaging, informative articles.",
            'social-post': "You are a social media expert who creates viral, engaging posts that drive engagement.",
            'email': "You are an email marketing specialist who writes compelling emails that convert.",
            'blog': "You are a professional blogger who creates valuable, SEO-friendly blog posts.",
            'caption': "You are a creative caption writer who crafts engaging social media captions.",
            'script': "You are a video script writer who creates compelling, engaging video content.",
            'ad-copy': "You are a copywriter who creates persuasive advertising copy that converts.",
            'chat': "You're a super friendly AI buddy who LOVES helping with content and writing! Chat like you're texting a close friend - be warm, genuine, and supportive. Use contractions naturally (you're, let's, I'd, that's, it's), throw in emojis when it feels right 😊, and keep things conversational and real. You're smart and helpful but never boring or robotic. If someone's excited, match their energy! If they're stuck, be encouraging and supportive. Keep responses short and sweet (2-4 sentences usually) unless they specifically ask for more detail. Think: helpful friend who happens to know a lot about content creation."
        }
        
        tone_instructions = {
            'professional': "Write in a professional, authoritative tone suitable for business contexts.",
            'casual': "Write in a casual, conversational tone that feels natural and approachable.",
            'friendly': "Write in a warm, friendly tone that builds connection with the reader.",
            'formal': "Write in a formal, structured tone appropriate for official communications.",
            'creative': "Write in a creative, imaginative tone that captures attention and inspires.",
            'persuasive': "Write in a persuasive tone that motivates action and drives results.",
            'informative': "Write in an informative, educational tone that clearly explains concepts.",
            'conversational': "Chat like you're texting a good friend! Be super natural - use 'you' and 'your', throw in some enthusiasm, and keep it light and fun. No formal stuff, just real talk between friends who care about making great content together."
        }
        
        base = base_instructions.get(content_type, base_instructions['article'])
        tone_instruction = tone_instructions.get(tone, tone_instructions['professional'])
        
        # For chat, emphasize friendly, casual conversation with specific examples
        if content_type == 'chat':
            return f"{base} {tone_instruction}\n\nIMPORTANT STYLE RULES:\n- Always use contractions (you're not 'you are', let's not 'let us')\n- Keep it SHORT - 2-4 sentences is perfect unless they ask for more\n- Use emojis naturally but don't overdo it (1-2 per response max)\n- Be encouraging and positive - you're their cheerleader!\n- If they share an idea, get excited with them!\n- If they're stuck, be supportive and offer specific help\n- Sound human, not like a robot or formal assistant\n- Use casual phrases like 'totally', 'for sure', 'awesome', 'cool'\n- Ask follow-up questions to keep the conversation going"
        
        return f"{base} {tone_instruction} Always provide high-quality, original content that adds value to the reader."
    
    def _generate_with_templates(self, prompt: str, content_type: str, tone: str, **kwargs) -> str:
        """Generate content using predefined templates (fallback when OpenAI is not available)"""
        
        templates = {
            'article': [
                "# {title}\n\nIn today's rapidly evolving landscape, {topic} has become increasingly important. This comprehensive guide explores the key aspects that make {subject} essential for success.\n\n## Key Insights\n\n{topic} offers numerous benefits including improved efficiency, better outcomes, and enhanced user experience. By understanding these principles, you can leverage {subject} to achieve your goals.\n\n## Best Practices\n\n1. Start with a clear strategy\n2. Focus on user needs\n3. Measure and optimize results\n4. Stay updated with latest trends\n\n## Conclusion\n\nImplementing {topic} effectively requires dedication and the right approach. With these insights, you're well-equipped to succeed in your {subject} journey.",
                
                "# Understanding {title}\n\n{topic} represents a significant opportunity for growth and innovation. This article delves into the practical applications and benefits of {subject}.\n\n## The Current Landscape\n\nThe field of {topic} is experiencing unprecedented growth. Organizations worldwide are recognizing the value of {subject} in driving results.\n\n## Implementation Strategies\n\n- Define clear objectives\n- Develop a structured approach\n- Monitor progress regularly\n- Adapt based on feedback\n\n## Future Outlook\n\nAs we look ahead, {topic} will continue to evolve. Staying informed about {subject} trends will be crucial for long-term success."
            ],
            
            'social-post': [
                "🚀 Excited to share insights about {topic}! \n\n{subject} is transforming the way we approach challenges. Here are 3 key takeaways:\n\n✅ Innovation drives results\n✅ User experience matters most\n✅ Continuous learning is essential\n\nWhat's your experience with {topic}? Share your thoughts below! 👇\n\n#Innovation #Growth #Success",
                
                "💡 Quick tip about {topic}:\n\n{subject} can significantly impact your results when implemented correctly. The secret? Focus on value creation and user needs.\n\n🎯 Pro tip: Start small, measure everything, and scale what works.\n\nTry this approach and let me know how it goes! 🚀\n\n#Tips #Strategy #Results",
                
                "🌟 Just discovered something amazing about {topic}!\n\n{subject} is changing the game in ways we never imagined. The possibilities are endless when you combine creativity with strategy.\n\nWho else is excited about the future of {topic}? Let's discuss! 💬\n\n#Future #Innovation #Community"
            ],
            
            'email': [
                "Subject: Transform Your Approach to {title}\n\nHi there!\n\nI hope this email finds you well. I wanted to share some exciting insights about {subject} that could revolutionize your approach to {topic}.\n\nRecent developments show that organizations implementing {subject} see significant improvements in:\n\n• Efficiency and productivity\n• User satisfaction\n• Overall results\n\nThe key is understanding how to leverage {topic} effectively. Would you like to learn more about implementing these strategies?\n\nBest regards,\nThe ContentGenie Team",
                
                "Subject: Exclusive Insights on {title}\n\nDear Valued Reader,\n\nWe're thrilled to share the latest developments in {subject} that are making waves in the {topic} industry.\n\nOur research indicates that successful implementation of {subject} requires:\n\n1. Clear strategic vision\n2. User-centered approach\n3. Continuous optimization\n\nThese insights have helped countless professionals achieve remarkable results with {topic}.\n\nReady to take your {subject} strategy to the next level?\n\nWarm regards,\nYour Content Team"
            ],
            
            'blog': [
                "# The Complete Guide to {title}\n\nWelcome to our comprehensive exploration of {subject}. In this detailed post, we'll uncover the strategies that successful professionals use to master {topic}.\n\n## Table of Contents\n1. Introduction to {subject}\n2. Key Benefits and Applications\n3. Implementation Best Practices\n4. Common Challenges and Solutions\n5. Future Trends and Opportunities\n\n## Introduction\n\n{topic} has emerged as a critical factor in achieving success. Understanding {subject} is no longer optional—it's essential for staying competitive.\n\n## Key Benefits\n\nImplementing {subject} effectively can lead to:\n- Improved efficiency\n- Better user experience\n- Increased ROI\n- Competitive advantage\n\n## Best Practices\n\nSuccessful {topic} implementation requires a structured approach. Here are the proven strategies that deliver results...\n\n*[Continue reading for detailed implementation guide]*",
                
                "# Why {title} Matters More Than Ever\n\nIn an increasingly competitive landscape, understanding {subject} has become crucial for professionals looking to stay ahead.\n\n## The Current State of {topic}\n\nThe field of {topic} is evolving rapidly. Organizations that embrace {subject} are seeing remarkable improvements in their outcomes.\n\n## What Makes {subject} Effective?\n\nOur analysis reveals three critical factors:\n\n### 1. Strategic Alignment\nSuccessful {topic} initiatives align with broader business objectives.\n\n### 2. User-Centric Design\nThe best {subject} solutions prioritize user needs and experience.\n\n### 3. Continuous Improvement\nTop performers constantly refine their {topic} approach based on data and feedback.\n\n## Getting Started\n\nReady to implement {subject} in your organization? Here's your roadmap..."
            ],
            
            'caption': [
                "Capturing the essence of {topic} ✨\n\nWhen {subject} meets creativity, magic happens! This moment perfectly represents the power of innovation and dedication.\n\n#ContentCreation #{topic} #Innovation #Success #Inspiration",
                
                "Behind the scenes of {topic} 📸\n\nThe journey of {subject} continues to inspire and amaze. Every detail matters when you're passionate about excellence.\n\nWhat's your favorite part about {topic}? Drop a comment below! 👇\n\n#{topic} #BehindTheScenes #Passion #Excellence",
                
                "Sunday vibes with {topic} 🌟\n\n{subject} reminds us that great things happen when we combine vision with action. Grateful for this incredible journey!\n\n#SundayMotivation #{topic} #Grateful #Journey #Success"
            ],
            
            'script': [
                "[INTRO]\nHey everyone! Welcome back to our channel. Today we're diving deep into {topic}, and I'm excited to share some incredible insights about {subject} with you.\n\n[HOOK]\nBut first, let me ask you this: Have you ever wondered how {topic} could transform your approach to {subject}? Well, you're about to find out!\n\n[MAIN CONTENT]\nLet's start with the basics. {subject} is revolutionizing the way we think about {topic}. Here are the three key points you need to know:\n\nFirst, {topic} offers unprecedented opportunities for growth...\nSecond, the implementation of {subject} requires strategic thinking...\nThird, the results speak for themselves...\n\n[CALL TO ACTION]\nIf you found this valuable, make sure to like this video and subscribe for more content about {topic}. And don't forget to share your thoughts about {subject} in the comments below!\n\n[OUTRO]\nThanks for watching, and I'll see you in the next video!",
                
                "[OPENING SCENE]\nImagine a world where {topic} is no longer a challenge but an opportunity. That world is closer than you think, thanks to {subject}.\n\n[PROBLEM SETUP]\nFor too long, people have struggled with {topic}. The traditional approaches to {subject} simply weren't delivering the results we needed.\n\n[SOLUTION REVEAL]\nBut what if I told you there's a better way? A method that transforms how we approach {topic} and makes {subject} not just possible, but profitable?\n\n[DEMONSTRATION]\nLet me show you exactly how this works...\n\n[RESULTS]\nThe results are remarkable. Users report significant improvements in their {topic} outcomes after implementing these {subject} strategies.\n\n[CLOSING]\nReady to transform your approach to {topic}? The journey starts now."
            ],
            
            'ad-copy': [
                "🚀 Transform Your {title} Today!\n\nDiscover how {subject} can revolutionize your approach to {topic}. Join thousands who've already experienced remarkable results.\n\n✅ Proven strategies\n✅ Expert guidance\n✅ Measurable results\n✅ 30-day guarantee\n\nDon't let another day pass without optimizing your {topic} strategy. Your success with {subject} starts here.\n\n👉 Click now to get started!\n\n*Limited time offer - Act fast!*",
                
                "Struggling with {topic}? You're Not Alone.\n\nThousands of professionals face the same {subject} challenges every day. But what if there was a proven solution?\n\nIntroducing our revolutionary approach to {topic}:\n\n• Streamlined {subject} processes\n• Expert-backed strategies\n• Real-world results\n• Step-by-step guidance\n\nStop wasting time on outdated {topic} methods. Upgrade to our {subject} solution and see the difference immediately.\n\n🎯 Get instant access now - Your success is guaranteed!",
                
                "BREAKTHROUGH: New {title} Method Gets Results in 30 Days!\n\nFinally, a {subject} solution that actually works. Our proven system has helped over 10,000 professionals master {topic}.\n\nWhat makes us different?\n\n→ Science-backed approach\n→ Personalized strategies\n→ 24/7 support\n→ Money-back guarantee\n\nReady to join the {topic} success stories? Your {subject} transformation begins today.\n\n⚡ Limited spots available - Reserve yours now!"
            ]
        }
        
        # Get templates for the content type
        content_templates = templates.get(content_type, templates['article'])
        template = random.choice(content_templates)
        
        # Extract key information from prompt
        words = prompt.lower().split()
        topic = words[0] if words else 'innovation'
        
        # Create title from prompt
        title_words = prompt.split()[:5]  # First 5 words for title
        title = ' '.join(title_words).title() if title_words else 'Innovation Guide'
        
        # Create subject (more detailed topic)
        subject = ' '.join(words[:3]) if len(words) >= 3 else prompt or 'digital innovation'
        
        # Fill template with extracted information
        content = template.format(
            title=title,
            topic=topic,
            subject=subject
        )
        
        # Apply tone modifications
        content = self._apply_tone_modifications(content, tone)
        
        return content
    
    def _apply_tone_modifications(self, content: str, tone: str) -> str:
        """Apply tone-specific modifications to content"""
        
        if tone == 'casual':
            content = content.replace('Furthermore', 'Plus')
            content = content.replace('Therefore', 'So')
            content = content.replace('In conclusion', 'Bottom line')
            content = content.replace('Additionally', 'Also')
            
        elif tone == 'friendly':
            if not content.startswith('Hey') and not content.startswith('Hi'):
                content = f"Hey there! {content}"
            if not content.endswith('😊') and not content.endswith('!'):
                content = f"{content} Hope this helps! 😊"
                
        elif tone == 'creative':
            content = f"✨ {content} ✨"
            content = content.replace('important', 'game-changing')
            content = content.replace('good', 'amazing')
            content = content.replace('effective', 'powerful')
            
        elif tone == 'formal':
            content = content.replace("don't", "do not")
            content = content.replace("can't", "cannot")
            content = content.replace("won't", "will not")
            content = content.replace('!', '.')
            
        elif tone == 'persuasive':
            content = content.replace('you can', 'you will')
            content = content.replace('might', 'will')
            content = content.replace('could', 'should')
            
        return content
    
    def improve_content(self, content: str, improvement_type: str) -> Dict[str, Any]:
        """Improve existing content based on improvement type"""
        
        try:
            if improvement_type == 'seo':
                improved_content = self._improve_seo(content)
            elif improvement_type == 'readability':
                improved_content = self._improve_readability(content)
            elif improvement_type == 'engagement':
                improved_content = self._improve_engagement(content)
            else:
                improved_content = content
            
            return {
                'success': True,
                'original_content': content,
                'improved_content': improved_content,
                'improvement_type': improvement_type
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _improve_seo(self, content: str) -> str:
        """Improve content for SEO"""
        # Add basic SEO improvements
        lines = content.split('\n')
        improved_lines = []
        
        for line in lines:
            if line.strip() and not line.startswith('#'):
                # Add more descriptive language
                line = line.replace('good', 'effective')
                line = line.replace('nice', 'valuable')
                line = line.replace('great', 'outstanding')
            improved_lines.append(line)
        
        return '\n'.join(improved_lines)
    
    def _improve_readability(self, content: str) -> str:
        """Improve content readability"""
        # Break long sentences, add bullet points
        content = content.replace('. Additionally,', '.\n\nAdditionally,')
        content = content.replace('. Furthermore,', '.\n\nFurthermore,')
        content = content.replace('. However,', '.\n\nHowever,')
        
        return content
    
    def _improve_engagement(self, content: str) -> str:
        """Improve content engagement"""
        # Add questions and calls to action
        if '?' not in content:
            content += "\n\nWhat are your thoughts on this? Share your experience in the comments!"
        
        return content