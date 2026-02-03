#!/usr/bin/env python3
import requests
import json

def test_api():
    # Test health endpoint
    try:
        response = requests.get('http://localhost:5000/api/health')
        print("Health check:", response.json())
    except Exception as e:
        print("Health check failed:", e)
    
    # Test content generation
    try:
        data = {
            'type': 'article',
            'prompt': 'sustainable travel destinations',
            'tone': 'informative'
        }
        response = requests.post('http://localhost:5000/api/generate-content', 
                               json=data)
        print("Content generation:", response.json())
    except Exception as e:
        print("Content generation failed:", e)

if __name__ == '__main__':
    test_api()