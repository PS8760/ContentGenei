from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import random
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Sample content templates for different types
CONTENT_TEMPLATES = {
    'article': [
        "Exploring the world of {topic} reveals fascinating insights that can transform how we approach {subject}. Recent developments show that {trend} is becoming increasingly important for {audience}.",
        "In today's digital landscape, {topic} has emerged as a game-changer. This comprehensive guide explores the key aspects that make {subject} essential for {audience}.",
        "The future of {topic} is here, and it's more exciting than ever. Discover how {subject} is revolutionizing the way we think about {trend}."
    ],
    'social-post': [
        "🚀 Just discovered something amazing about {topic}! {subject} is changing the game for {audience}. What are your thoughts? #Innovation #Digital",
        "💡 Quick tip: {subject} can significantly improve your {topic} strategy. Try this approach and see the difference! #Tips #Growth",
        "🌟 Excited to share insights about {topic}! The impact of {subject} on {audience} is incredible. Let's discuss! #Community"
    ],
    'email': [
        "Subject: Transform Your {topic} Strategy Today\n\nHi there!\n\nI hope this email finds you well. I wanted to share some exciting insights about {subject} that could revolutionize your approach to {topic}.",
        "Subject: Exclusive Insights on {topic}\n\nDear Valued Reader,\n\nWe're thrilled to share the latest developments in {subject} that are making waves in the {topic} industry.",
    ],
    'blog': [
        "# The Ultimate Guide to {topic}\n\nWelcome to our comprehensive exploration of {subject}. In this post, we'll dive deep into the strategies that successful {audience} use to master {topic}.",
        "# Why {topic} Matters More Than Ever\n\nIn an increasingly competitive landscape, understanding {subject} has become crucial for {audience} looking to stay ahead.",
    ],
    'caption': [
        "Capturing the essence of {topic} ✨ When {subject} meets creativity, magic happens! Perfect for {audience} who appreciate quality. #ContentCreation",
        "Behind the scenes of {topic} 📸 The story of {subject} continues to inspire {audience} everywhere. What's your favorite part?",
    ]
}

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'ContentGenie API is running'})

@app.route('/api/generate-content', methods=['POST'])
def generate_content():
    try:
        data = request.get_json()
        content_type = data.get('type', 'article')
        prompt = data.get('prompt', '')
        tone = data.get('tone', 'professional')
        
        # Extract key topics from prompt for template filling
        words = prompt.lower().split()
        topic = words[0] if words else 'innovation'
        subject = ' '.join(words[:3]) if len(words) >= 3 else prompt or 'digital content'
        audience = 'professionals'
        trend = 'AI-powered solutions'
        
        # Select template based on content type
        templates = CONTENT_TEMPLATES.get(content_type, CONTENT_TEMPLATES['article'])
        template = random.choice(templates)
        
        # Generate content by filling template
        generated_content = template.format(
            topic=topic,
            subject=subject,
            audience=audience,
            trend=trend
        )
        
        # Adjust tone
        if tone == 'casual':
            generated_content = generated_content.replace('Furthermore', 'Plus').replace('Therefore', 'So')
        elif tone == 'friendly':
            generated_content = f"Hey there! {generated_content} Hope this helps! 😊"
        elif tone == 'creative':
            generated_content = f"✨ {generated_content} ✨"
        
        return jsonify({
            'success': True,
            'content': generated_content,
            'type': content_type,
            'tone': tone,
            'prompt': prompt
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/personalize-content', methods=['POST'])
def personalize_content():
    try:
        data = request.get_json()
        content = data.get('content', '')
        audience = data.get('audience', 'general')
        platform = data.get('platform', 'general')
        
        # Placeholder for content personalization
        personalized_content = f"Personalized for {audience} on {platform}: {content}"
        
        return jsonify({
            'success': True,
            'content': personalized_content,
            'audience': audience,
            'platform': platform
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)