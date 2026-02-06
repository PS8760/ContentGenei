import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAG62iL-CuBO1vvcv_NeKXRMUX-8S_IquQ",
  authDomain: "content-genei.firebaseapp.com",
  projectId: "content-genei",
  storageBucket: "content-genei.firebasestorage.app",
  messagingSenderId: "319478026514",
  appId: "1:319478026514:web:3d4a9e2d019295ee9923cb",
  measurementId: "G-KPRLGC9HT0"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app)

// Analytics is optional - only initialize if needed
export let analytics = null

// Initialize analytics conditionally
if (typeof window !== 'undefined') {
  try {
    import('firebase/analytics').then(({ getAnalytics, isSupported }) => {
      isSupported().then((supported) => {
        if (supported) {
          analytics = getAnalytics(app)
        }
      }).catch(() => {
        console.log('Analytics not supported in this environment')
      })
    }).catch(() => {
      console.log('Analytics module not available')
    })
  } catch (error) {
    console.log('Analytics initialization skipped')
  }
}

export default app
