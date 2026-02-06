# 🔥 Firebase Setup Guide for ContentGenie

## Prerequisites

1. **Google Account**: You need a Google account to access Firebase
2. **Firebase Project**: Create a new Firebase project

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `contentgenie` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, go to **Authentication**
2. Click "Get started"
3. Go to **Sign-in method** tab
4. Enable the following providers:
   - **Email/Password**: Click and toggle "Enable"
   - **Google**: Click, toggle "Enable", and configure:
     - Project support email: Your email
     - Click "Save"

## Step 3: Create Web App

1. In Project Overview, click the **Web** icon (`</>`)
2. Register app:
   - App nickname: `ContentGenie Web`
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"

## Step 4: Get Configuration

Copy the Firebase configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789"
}
```

## Step 5: Update Configuration File

Replace the placeholder config in `src/config/firebase.js`:

```javascript
// Replace this placeholder config
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
}

// With your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "contentgenie-12345.firebaseapp.com",
  projectId: "contentgenie-12345",
  storageBucket: "contentgenie-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789"
}
```

## Step 6: Set Up Firestore (Optional)

If you want to store user data:

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location close to your users
5. Click "Done"

## Step 7: Configure Security Rules

For Authentication, the default rules are fine for development.

For Firestore (if using), update rules in the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read and write their own content
    match /content/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 8: Test Authentication

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/signin` and try creating an account
3. Check Firebase Console > Authentication > Users to see registered users

## Environment Variables (Production)

For production deployment, consider using environment variables:

1. Create `.env` file:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=your-app-id
   ```

2. Update `firebase.js`:
   ```javascript
   const firebaseConfig = {
     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
     appId: import.meta.env.VITE_FIREBASE_APP_ID
   }
   ```

## Troubleshooting

### Common Issues:

1. **"Firebase: Error (auth/configuration-not-found)"**
   - Check that your Firebase config is correct
   - Ensure Authentication is enabled in Firebase Console

2. **"Firebase: Error (auth/unauthorized-domain)"**
   - Add your domain to Authorized domains in Firebase Console
   - Go to Authentication > Settings > Authorized domains

3. **Google Sign-in not working**
   - Ensure Google provider is enabled
   - Check that support email is configured

### Testing Checklist:

- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password + Google)
- [ ] Web app registered
- [ ] Configuration updated in code
- [ ] Sign up works
- [ ] Sign in works
- [ ] Google sign-in works
- [ ] Protected routes redirect to sign-in
- [ ] User data displays correctly

## Security Best Practices

1. **Never commit Firebase config to public repositories** (use environment variables)
2. **Set up proper Firestore security rules**
3. **Enable App Check** for production
4. **Monitor authentication usage** in Firebase Console
5. **Set up billing alerts** to avoid unexpected charges

---

🎉 **Your Firebase authentication is now ready!**

Users can now sign up, sign in, and access protected pages (Dashboard, Creator, Analytics) with the same beautiful theme as your landing page.