#!/usr/bin/env python3
"""
Test script for Groq AI integration
"""

import os
from services.ai_service import AIContentGenerator

def test_groq_integration():
    """Test the Groq AI service integration"""
    print("🧪 Testing Groq AI Integration...")
    
    # Initialize the AI service
    ai_service = AIContentGenerator()
    ai_service._initialize_client()
    
    if not ai_service.client:
        print("⚠️  No Groq API key found. Testing with templates only.")
        print("💡 To test with Groq AI, set GROQ_API_KEY environment variable.")
    else:
        print("✅ Groq client initialized successfully!")
    
    # Test content generation
    test_cases = [
        {
            'prompt': 'Benefits of artificial intelligence in content creation',
            'content_type': 'article',
            'tone': 'professional'
        },
        {
            'prompt': 'Exciting news about our new AI-powered content tool',
            'content_type': 'social-post',
            'tone': 'friendly'
        },
        {
            'prompt': 'How to get started with AI content generation',
            'content_type': 'blog',
            'tone': 'informative'
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n📝 Test Case {i}: {test_case['content_type']} - {test_case['tone']} tone")
        print(f"Prompt: {test_case['prompt']}")
        print("-" * 60)
        
        result = ai_service.generate_content(
            prompt=test_case['prompt'],
            content_type=test_case['content_type'],
            tone=test_case['tone']
        )
        
        if result['success']:
            print(f"✅ Generation successful!")
            print(f"Model used: {result['model_used']}")
            print(f"Generation time: {result['generation_time']:.2f}s")
            print(f"Word count: {result['word_count']}")
            print(f"Character count: {result['character_count']}")
            print(f"\nGenerated content:")
            print(result['content'][:200] + "..." if len(result['content']) > 200 else result['content'])
        else:
            print(f"❌ Generation failed: {result['error']}")
        
        print("=" * 60)
    
    print("\n🎉 Groq AI integration test completed!")

if __name__ == '__main__':
    test_groq_integration()