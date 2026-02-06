import firebase_admin
from firebase_admin import credentials, auth
from flask import current_app, has_app_context
import os
from typing import Dict, Any, Optional

class FirebaseService:
    def __init__(self):
        self.app = None
        # Don't initialize Firebase during import, wait for app context
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            # Check if Firebase is already initialized
            if not firebase_admin._apps:
                if has_app_context():
                    cred_path = current_app.config.get('FIREBASE_CREDENTIALS_PATH')
                else:
                    cred_path = os.environ.get('FIREBASE_CREDENTIALS_PATH')
                
                if cred_path and os.path.exists(cred_path):
                    # Use service account key file
                    cred = credentials.Certificate(cred_path)
                    self.app = firebase_admin.initialize_app(cred)
                else:
                    # Use default credentials (for production deployment)
                    try:
                        cred = credentials.ApplicationDefault()
                        self.app = firebase_admin.initialize_app(cred)
                    except Exception:
                        if has_app_context():
                            current_app.logger.warning("Firebase credentials not found. Firebase features will be limited.")
                        else:
                            print("Warning: Firebase credentials not found. Firebase features will be limited.")
                        self.app = None
            else:
                self.app = firebase_admin.get_app()
                
        except Exception as e:
            if has_app_context():
                current_app.logger.error(f"Firebase initialization error: {str(e)}")
            else:
                print(f"Firebase initialization error: {str(e)}")
            self.app = None
    
    def verify_token(self, id_token: str) -> Optional[Dict[str, Any]]:
        """Verify Firebase ID token and return user info"""
        if not self.app:
            self._initialize_firebase()
            
        if not self.app:
            return None
            
        try:
            decoded_token = auth.verify_id_token(id_token)
            return {
                'uid': decoded_token['uid'],
                'email': decoded_token.get('email'),
                'email_verified': decoded_token.get('email_verified', False),
                'name': decoded_token.get('name'),
                'picture': decoded_token.get('picture'),
                'provider': decoded_token.get('firebase', {}).get('sign_in_provider', 'unknown')
            }
        except Exception as e:
            if has_app_context():
                current_app.logger.error(f"Token verification error: {str(e)}")
            else:
                print(f"Token verification error: {str(e)}")
            return None
    
    def get_user(self, uid: str) -> Optional[Dict[str, Any]]:
        """Get user information from Firebase"""
        if not self.app:
            return None
            
        try:
            user_record = auth.get_user(uid)
            return {
                'uid': user_record.uid,
                'email': user_record.email,
                'email_verified': user_record.email_verified,
                'display_name': user_record.display_name,
                'photo_url': user_record.photo_url,
                'disabled': user_record.disabled,
                'provider_data': [
                    {
                        'provider_id': provider.provider_id,
                        'uid': provider.uid,
                        'email': provider.email,
                        'display_name': provider.display_name,
                        'photo_url': provider.photo_url
                    }
                    for provider in user_record.provider_data
                ]
            }
        except Exception as e:
            current_app.logger.error(f"Get user error: {str(e)}")
            return None
    
    def create_custom_token(self, uid: str, additional_claims: Optional[Dict] = None) -> Optional[str]:
        """Create a custom token for a user"""
        if not self.app:
            return None
            
        try:
            custom_token = auth.create_custom_token(uid, additional_claims)
            return custom_token.decode('utf-8')
        except Exception as e:
            current_app.logger.error(f"Custom token creation error: {str(e)}")
            return None
    
    def update_user(self, uid: str, **kwargs) -> bool:
        """Update user information in Firebase"""
        if not self.app:
            return False
            
        try:
            auth.update_user(uid, **kwargs)
            return True
        except Exception as e:
            current_app.logger.error(f"Update user error: {str(e)}")
            return False
    
    def delete_user(self, uid: str) -> bool:
        """Delete user from Firebase"""
        if not self.app:
            return False
            
        try:
            auth.delete_user(uid)
            return True
        except Exception as e:
            current_app.logger.error(f"Delete user error: {str(e)}")
            return False
    
    def list_users(self, page_token: Optional[str] = None, max_results: int = 1000) -> Optional[Dict]:
        """List users from Firebase"""
        if not self.app:
            return None
            
        try:
            page = auth.list_users(page_token=page_token, max_results=max_results)
            return {
                'users': [
                    {
                        'uid': user.uid,
                        'email': user.email,
                        'display_name': user.display_name,
                        'photo_url': user.photo_url,
                        'email_verified': user.email_verified,
                        'disabled': user.disabled,
                        'creation_timestamp': user.user_metadata.creation_timestamp,
                        'last_sign_in_timestamp': user.user_metadata.last_sign_in_timestamp
                    }
                    for user in page.users
                ],
                'next_page_token': page.next_page_token,
                'has_next_page': page.has_next_page
            }
        except Exception as e:
            current_app.logger.error(f"List users error: {str(e)}")
            return None
    
    def set_custom_user_claims(self, uid: str, custom_claims: Dict) -> bool:
        """Set custom claims for a user"""
        if not self.app:
            return False
            
        try:
            auth.set_custom_user_claims(uid, custom_claims)
            return True
        except Exception as e:
            current_app.logger.error(f"Set custom claims error: {str(e)}")
            return False
    
    def revoke_refresh_tokens(self, uid: str) -> bool:
        """Revoke all refresh tokens for a user"""
        if not self.app:
            return False
            
        try:
            auth.revoke_refresh_tokens(uid)
            return True
        except Exception as e:
            current_app.logger.error(f"Revoke tokens error: {str(e)}")
            return False