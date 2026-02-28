# Security Best Practices

## 🔐 Protecting API Keys and Secrets

### Never Commit Secrets to Git

API keys, passwords, and other secrets should NEVER be committed to your repository, even in example files.

### Files That Should NEVER Contain Real Secrets

❌ **DO NOT** put real secrets in:
- `backend/.env.production`
- `backend/.env.example`
- `backend/render.yaml`
- Any documentation files (*.md)
- Any configuration files tracked by git

✅ **DO** put real secrets in:
- `backend/.env` (local development only, in .gitignore)
- Environment variables in your deployment platform (Render, Vercel, etc.)
- Secure password managers

### Current .gitignore Protection

The following files are protected by `.gitignore`:
```
.env
.env.local
.env.*.local
.env.production
backend/.env
backend/.env.production
```

### How to Use Environment Variables

#### Local Development
1. Copy `.env.example` to `.env`
2. Add your real API keys to `.env`
3. Never commit `.env` to git

#### Production Deployment
1. Set environment variables in your hosting platform dashboard
2. For Render: Go to Environment → Add Environment Variable
3. For Vercel: Go to Settings → Environment Variables

### Example Files Format

Always use placeholder values in example files:

```bash
# ✅ GOOD - backend/.env.example
GROQ_API_KEY=your-groq-api-key-here

# ❌ BAD - backend/.env.example
GROQ_API_KEY=gsk_abc123realkey456
```

### If You Accidentally Commit a Secret

1. **Immediately revoke/regenerate the exposed key**
2. Remove the secret from the file
3. Commit the change
4. If GitHub blocks the push, rewrite git history:
   ```bash
   git reset --soft HEAD~1  # Go back before the commit
   # Fix the files to remove secrets
   git commit -m "fix: Remove secrets"
   git push origin main --force
   ```
5. Update the new key in your `.env` file and deployment platform

### GitHub Secret Scanning

GitHub automatically scans for exposed secrets and will block pushes containing:
- API keys (Groq, OpenAI, AWS, etc.)
- Private keys
- OAuth tokens
- Database credentials

If your push is blocked:
1. Don't try to bypass it
2. Remove the secret from the file
3. Regenerate the exposed credential
4. Follow the git history rewrite steps above

### Deployment Platform Security

#### Render
- Set secrets in: Dashboard → Environment → Environment Variables
- Use `sync: false` in `render.yaml` for secrets
- Never use `value:` for secrets in `render.yaml`

#### Vercel
- Set secrets in: Project Settings → Environment Variables
- Use environment-specific variables (Development, Preview, Production)

### Regular Security Checks

Run these commands periodically:

```bash
# Check for accidentally tracked .env files
git ls-files | grep -E "\.env"

# Should only show .env.example files, not .env

# Check for potential secrets in tracked files
git grep -i "api.key\|password\|secret" -- '*.yaml' '*.md' '*.json'
```

### API Key Rotation

Rotate your API keys regularly:
1. Generate a new key in the service dashboard
2. Update `.env` locally
3. Update environment variables in deployment platforms
4. Test that everything works
5. Revoke the old key

## 🛡️ Additional Security Measures

### Backend Security
- Use HTTPS in production
- Enable CORS only for trusted domains
- Validate all user inputs
- Use rate limiting for API endpoints
- Keep dependencies updated

### Frontend Security
- Never expose API keys in frontend code
- Use environment variables for configuration
- Validate user inputs before sending to backend
- Use secure authentication (Firebase Auth)

### Database Security
- Use strong passwords
- Enable SSL/TLS connections
- Regular backups
- Limit database access to backend only

## 📚 Resources

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
