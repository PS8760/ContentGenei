# 🚀 ContentGenie Backend API

A comprehensive Python Flask backend for ContentGenie - an AI-powered content creation and management platform.

## 🎯 Features

### 🔐 Authentication & User Management
- **Firebase Integration**: Seamless authentication with Firebase Auth
- **JWT Tokens**: Secure API access with JWT tokens
- **User Profiles**: Complete user management with profiles and preferences
- **Session Management**: Track and manage user sessions
- **Premium Subscriptions**: Support for premium user features

### 🤖 AI Content Generation
- **Groq Integration**: Ultra-fast content generation using Groq's optimized models
- **Advanced AI Model**: Uses `openai/gpt-oss-120b` for high-quality content
- **Multiple Content Types**: Articles, social posts, emails, blogs, captions, scripts, ad copy
- **Tone Customization**: Professional, casual, friendly, formal, creative, persuasive, etc.
- **Template System**: Fallback templates when AI is unavailable
- **Content Improvement**: AI-powered content enhancement (SEO, readability, engagement)
- **Streaming Support**: Real-time content generation with streaming responses

### 📊 Analytics & Insights
- **Performance Tracking**: Views, engagement, clicks, read time
- **Content Analytics**: Track performance of individual content pieces
- **Platform Metrics**: Performance across different platforms
- **Daily Metrics**: Time-series data for charts and graphs
- **Export Functionality**: Export analytics data in multiple formats

### 🗄️ Database Management
- **SQLAlchemy ORM**: Robust database operations
- **Multiple Database Support**: SQLite (dev), PostgreSQL (production)
- **Database Migrations**: Flask-Migrate for schema management
- **Data Models**: Users, Content, Analytics, Templates, Sessions

## 🏗️ Architecture

```
backend/
├── app.py                 # Main Flask application
├── config.py             # Configuration management
├── models.py             # Database models
├── run.py                # Production runner
├── init_db.py            # Database initialization
├── requirements.txt      # Python dependencies
├── setup_backend.sh      # Setup script
├── .env.example          # Environment variables template
├── routes/               # API route blueprints
│   ├── auth.py          # Authentication endpoints
│   ├── content.py       # Content management endpoints
│   └── analytics.py     # Analytics endpoints
├── services/            # Business logic services
│   ├── ai_service.py    # AI content generation
│   ├── firebase_service.py # Firebase integration
│   └── analytics_service.py # Analytics processing
├── utils/               # Utility functions
│   ├── decorators.py    # Custom decorators
│   └── helpers.py       # Helper functions
└── migrations/          # Database migrations
```

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Clone and navigate to backend directory
cd backend

# Run setup script
./setup_backend.sh

# Or manual setup:
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

Required environment variables:
```env
# Flask Configuration
FLASK_ENV=development
SECRET_KEY=your-secret-key-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key

# Database
DATABASE_URL=sqlite:///contentgenie.db

# Groq (for AI content generation)
GROQ_API_KEY=your-groq-api-key

# Firebase (for authentication)
FIREBASE_CREDENTIALS_PATH=path/to/firebase-credentials.json
```

### 3. Initialize Database

```bash
# Initialize database with tables and sample data
python init_db.py
```

### 4. Start Development Server

```bash
# Start the server
python run.py

# Or use Flask's built-in server
python app.py
```

The API will be available at `http://localhost:5000`

## 📡 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/verify-token` | Verify Firebase token and create/update user |
| POST | `/refresh` | Refresh JWT access token |
| POST | `/logout` | Logout and invalidate session |
| GET | `/profile` | Get current user profile |
| PUT | `/profile` | Update user profile |
| GET | `/sessions` | Get user's active sessions |
| DELETE | `/sessions/<id>` | Revoke specific session |

### Content Management (`/api/content`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/generate` | Generate new content using AI |
| GET | `/` | Get user's content (with pagination/filtering) |
| GET | `/<id>` | Get specific content item |
| PUT | `/<id>` | Update content item |
| DELETE | `/<id>` | Delete content item |
| POST | `/<id>/improve` | Improve existing content |
| GET | `/stats` | Get content statistics |

### Analytics (`/api/analytics`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/overview` | Get analytics overview |
| GET | `/content-performance` | Get top performing content |
| GET | `/content-distribution` | Get content type distribution |
| GET | `/daily-metrics` | Get daily metrics for charts |
| GET | `/platform-performance` | Get performance by platform |
| POST | `/record-metric` | Record new analytics metric |
| POST | `/generate-sample-data` | Generate sample data for demo |
| GET | `/export` | Export analytics data |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | API health check |
| GET | `/` | API information |

## 🔧 Configuration

### Database Configuration

**Development (SQLite):**
```env
DATABASE_URL=sqlite:///contentgenie.db
```

**Production (PostgreSQL):**
```env
DATABASE_URL=postgresql://user:password@localhost/contentgenie
```

### Groq Configuration

```env
GROQ_API_KEY=gsk_your-groq-api-key
```

The Groq API provides ultra-fast inference with the `openai/gpt-oss-120b` model, offering:
- **High Performance**: Optimized inference for faster content generation
- **Cost Effective**: More affordable than traditional OpenAI API
- **Quality Output**: Advanced language model capabilities
- **Streaming Support**: Real-time content generation

### Firebase Configuration

1. Download Firebase service account key
2. Place it in your backend directory
3. Set the path in environment:

```env
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
```

## 🧪 Testing

### Manual API Testing

```bash
# Health check
curl http://localhost:5000/api/health

# Generate content (requires authentication)
curl -X POST http://localhost:5000/api/content/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prompt": "Write about artificial intelligence",
    "type": "article",
    "tone": "professional"
  }'
```

### Authentication Flow Testing

1. **Get Firebase ID Token** from frontend
2. **Verify Token** with backend:
   ```bash
   curl -X POST http://localhost:5000/api/auth/verify-token \
     -H "Content-Type: application/json" \
     -d '{"idToken": "FIREBASE_ID_TOKEN"}'
   ```
3. **Use JWT Token** for subsequent API calls

## 🔒 Security Features

- **JWT Authentication**: Secure API access
- **Firebase Integration**: Trusted authentication provider
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API rate limiting (configurable)
- **CORS Configuration**: Secure cross-origin requests
- **SQL Injection Protection**: SQLAlchemy ORM protection
- **Session Management**: Secure session tracking

## 📊 Database Schema

### Users Table
- User profiles and authentication data
- Usage tracking and limits
- Premium subscription status

### Content Items Table
- Generated content storage
- Metadata and analytics
- Version control and status

### Analytics Table
- Performance metrics
- Time-series data
- Platform-specific tracking

### Content Templates Table
- Reusable content templates
- Template variables and usage

### User Sessions Table
- Active session tracking
- Security and audit logging

## 🚀 Production Deployment

### Environment Setup

```bash
# Set production environment
export FLASK_ENV=production

# Use production database
export DATABASE_URL=postgresql://user:pass@host/db

# Configure Redis for caching
export REDIS_URL=redis://localhost:6379/0
```

### Using Gunicorn

```bash
# Install Gunicorn
pip install gunicorn

# Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Docker Deployment

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

## 🔧 Development

### Adding New Endpoints

1. Create route in appropriate blueprint (`routes/`)
2. Add business logic in services (`services/`)
3. Update models if needed (`models.py`)
4. Add tests and documentation

### Database Migrations

```bash
# Initialize migrations (first time)
flask db init

# Create migration
flask db migrate -m "Description"

# Apply migration
flask db upgrade
```

### Custom Decorators

Use provided decorators for common functionality:

```python
from utils.decorators import premium_required, validate_json, log_api_call

@content_bp.route('/premium-feature', methods=['POST'])
@jwt_required()
@premium_required
@validate_json('prompt', 'type')
@log_api_call
def premium_feature():
    # Your code here
    pass
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check DATABASE_URL in .env
   - Ensure database server is running
   - Run `python init_db.py` to create tables

2. **Firebase Authentication Error**
   - Verify FIREBASE_CREDENTIALS_PATH
   - Check Firebase project configuration
   - Ensure service account has proper permissions

3. **Groq API Error**
   - Verify GROQ_API_KEY is correct
   - Check API usage limits and quotas
   - Fallback templates will be used if API fails
   - Ensure proper model access permissions

4. **CORS Issues**
   - Update CORS origins in `app.py`
   - Add your frontend domain to allowed origins

### Debug Mode

```bash
# Enable debug logging
export FLASK_ENV=development
export FLASK_DEBUG=1

# Run with verbose logging
python app.py
```

## 📈 Performance Optimization

- **Database Indexing**: Optimized queries with proper indexes
- **Caching**: Redis integration for caching (optional)
- **Connection Pooling**: SQLAlchemy connection pooling
- **Async Processing**: Celery integration for background tasks
- **Rate Limiting**: Prevent API abuse

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Update documentation
5. Submit pull request

## 📄 License

This project is licensed under the MIT License.

---

🎉 **Your ContentGenie backend is now ready for production!**

The backend provides a complete API for user authentication, AI content generation, and analytics tracking. It's designed to scale and can handle thousands of users with proper deployment configuration.