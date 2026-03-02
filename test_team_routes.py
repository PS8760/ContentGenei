import sys
sys.path.insert(0, 'backend')

try:
    print("1. Importing team module...")
    from routes import team
    print("   ✅ SUCCESS")
    
    print("\n2. Checking team_bp...")
    if hasattr(team, 'team_bp'):
        print("   ✅ team_bp exists")
        
        print("\n3. Checking routes...")
        # This won't work without app context, but we can check if functions exist
        if hasattr(team, 'add_project_member'):
            print("   ✅ add_project_member function exists")
        else:
            print("   ❌ add_project_member function NOT found")
            
        if hasattr(team, 'remove_project_member'):
            print("   ✅ remove_project_member function exists")
        else:
            print("   ❌ remove_project_member function NOT found")
    else:
        print("   ❌ team_bp NOT found")
        
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
