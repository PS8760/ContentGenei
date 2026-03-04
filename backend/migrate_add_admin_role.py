"""
Migration script to add is_admin column to users table
"""
from app import app
from models import db

def migrate():
    with app.app_context():
        try:
            # Add is_admin column to users table
            with db.engine.connect() as conn:
                # Check if column exists
                result = conn.execute(db.text("PRAGMA table_info(users)"))
                columns = [row[1] for row in result]
                
                if 'is_admin' not in columns:
                    print("Adding is_admin column to users table...")
                    conn.execute(db.text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0"))
                    conn.commit()
                    print("✅ is_admin column added successfully!")
                else:
                    print("ℹ️ is_admin column already exists")
            
            print("\n✅ Migration completed successfully!")
            
        except Exception as e:
            print(f"❌ Migration failed: {str(e)}")
            raise

if __name__ == '__main__':
    migrate()
