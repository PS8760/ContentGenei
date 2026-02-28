#!/usr/bin/env python3
"""
Generate an encryption key for GeneiLink OAuth tokens
Run this script to generate a secure encryption key
"""

from cryptography.fernet import Fernet

def generate_key():
    """Generate a new Fernet encryption key"""
    key = Fernet.generate_key()
    return key.decode()

if __name__ == '__main__':
    print("=" * 60)
    print("GeneiLink Encryption Key Generator")
    print("=" * 60)
    print()
    print("Your new encryption key:")
    print()
    key = generate_key()
    print(f"  {key}")
    print()
    print("=" * 60)
    print()
    print("Add this to your backend/.env file:")
    print()
    print(f"ENCRYPTION_KEY={key}")
    print()
    print("⚠️  IMPORTANT: Keep this key secret and never commit it to git!")
    print("=" * 60)
