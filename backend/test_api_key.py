#!/usr/bin/env python3
"""Quick test to verify Groq API key is working"""

from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.environ.get('GROQ_API_KEY')

if not api_key:
    print("❌ No API key found!")
    exit(1)

print(f"✅ API key found: {api_key[:20]}...")

try:
    client = Groq(api_key=api_key)
    print("✅ Groq client initialized successfully")
    
    # Test a simple chat completion
    print("\n🧪 Testing chat completion...")
    completion = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Say 'Hello, I'm working!' in a friendly way."}
        ],
        temperature=0.7,
        max_completion_tokens=50
    )
    
    response = completion.choices[0].message.content
    print(f"✅ API Response: {response}")
    print("\n🎉 Groq API is working perfectly!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
