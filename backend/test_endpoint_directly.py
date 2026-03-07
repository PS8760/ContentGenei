"""
Test the analyze patterns endpoint directly
"""
import requests
import json

# You need to get your JWT token from localStorage
# Open browser console and run: localStorage.getItem('token')
TOKEN = input("Enter your JWT token from browser localStorage: ").strip()

BASE_URL = "http://localhost:5001"
CONNECTION_ID = input("Enter your Instagram connection ID: ").strip()

headers = {
    'Authorization': f'Bearer {TOKEN}',
    'Content-Type': 'application/json'
}

print(f"\nCalling: {BASE_URL}/api/platforms/instagram/ml/analyze-patterns/{CONNECTION_ID}")
print("="*60)

try:
    response = requests.get(
        f"{BASE_URL}/api/platforms/instagram/ml/analyze-patterns/{CONNECTION_ID}",
        headers=headers
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"\nResponse Body:")
    print(json.dumps(response.json(), indent=2))
    
except Exception as e:
    print(f"Error: {str(e)}")
    print(f"Response text: {response.text if 'response' in locals() else 'No response'}")
