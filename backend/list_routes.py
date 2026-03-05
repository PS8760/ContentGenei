"""List all registered routes in the Flask app"""
from app import create_app

app = create_app()

print("\n" + "="*80)
print("REGISTERED ROUTES")
print("="*80 + "\n")

routes = []
for rule in app.url_map.iter_rules():
    routes.append({
        'endpoint': rule.endpoint,
        'methods': ','.join(sorted(rule.methods - {'HEAD', 'OPTIONS'})),
        'path': str(rule)
    })

# Sort by path
routes.sort(key=lambda x: x['path'])

# Filter for team routes
team_routes = [r for r in routes if '/team/' in r['path']]

print("TEAM ROUTES:")
print("-" * 80)
for route in team_routes:
    print(f"{route['methods']:15} {route['path']}")

print("\n" + "="*80)
print(f"Total team routes: {len(team_routes)}")
print("="*80 + "\n")

# Check specifically for the members route
members_routes = [r for r in team_routes if 'members' in r['path']]
if members_routes:
    print("\nMEMBERS ROUTES FOUND:")
    for route in members_routes:
        print(f"  ✅ {route['methods']:15} {route['path']}")
else:
    print("\n❌ NO MEMBERS ROUTES FOUND!")
    print("   Expected: /api/team/projects/<project_id>/members")
