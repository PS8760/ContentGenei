"""
Script to promote a user to admin
Usage: python make_admin.py <email>
"""
from app import app
from models import db, User
import sys

def make_admin(email):
    with app.app_context():
        user = User.query.filter_by(email=email).first()
        if user:
            user.is_admin = True
            db.session.commit()
            print(f"✅ {email} is now an admin!")
            print(f"User ID: {user.id}")
            print(f"Display Name: {user.display_name or 'Not set'}")
        else:
            print(f"❌ User {email} not found")
            print("\nAvailable users:")
            users = User.query.all()
            for u in users:
                print(f"  - {u.email}")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python make_admin.py <email>")
        print("\nExample: python make_admin.py admin@example.com")
    else:
        make_admin(sys.argv[1])
