from app import create_app
from models import db

def migrate_instagram_tables():
    """Create Instagram OAuth tables"""
    app = create_app()
    
    with app.app_context():
        # Import models to register them
        from platforms.instagram.instagram_model import InstagramConnection, OAuthState
        
        try:
            # Create only new tables (won't affect existing)
            db.create_all()
            print("✓ Instagram tables created successfully")
            
            # Verify tables exist
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            
            # Check instagram_connections table
            if 'instagram_connections' in tables:
                print("✓ instagram_connections table verified")
                columns = inspector.get_columns('instagram_connections')
                print(f"  - {len(columns)} columns created")
            else:
                print("✗ instagram_connections table NOT found")
            
            # Check oauth_states table
            if 'oauth_states' in tables:
                print("✓ oauth_states table verified")
                columns = inspector.get_columns('oauth_states')
                print(f"  - {len(columns)} columns created")
            else:
                print("✗ oauth_states table NOT found")
                
        except Exception as e:
            print(f"✗ Error: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    migrate_instagram_tables()
