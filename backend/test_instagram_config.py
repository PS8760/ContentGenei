"""Test Instagram configuration"""
import os
from dotenv import load_dotenv

load_dotenv()

print("=" * 60)
print("INSTAGRAM CONFIGURATION TEST")
print("=" * 60)

app_id = os.environ.get('INSTAGRAM_APP_ID')
app_secret = os.environ.get('INSTAGRAM_APP_SECRET')
redirect_uri = os.environ.get('INSTAGRAM_REDIRECT_URI')
scopes = os.environ.get('INSTAGRAM_SCOPES')

print(f"\nApp ID: {app_id}")
print(f"App Secret: {app_secret[:10]}... (hidden)")
print(f"Redirect URI: {redirect_uri}")
print(f"Scopes: {scopes}")

# Test URL generation
from platforms.instagram.instagram_service import InstagramService

service = InstagramService()
test_state = "test-state-123"
oauth_url = service.get_oauth_url(test_state)

print(f"\nGenerated OAuth URL:")
print(oauth_url)

print("\n" + "=" * 60)
print("Copy the OAuth URL above and paste it in your browser")
print("This will test if the configuration is correct")
print("=" * 60)
