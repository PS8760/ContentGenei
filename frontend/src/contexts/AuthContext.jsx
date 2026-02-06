import { createContext, useContext, useEffect, useState } from 'react'
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth'
import { auth } from '../config/firebase'
import apiService from '../services/api'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [backendUser, setBackendUser] = useState(null)

  // Sign up function
  async function signup(email, password, displayName) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(result.user, {
        displayName: displayName
      })
      
      // Authenticate with backend
      await authenticateWithBackend(result.user)
      
      return result
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    }
  }

  // Login function
  async function login(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      
      // Authenticate with backend
      await authenticateWithBackend(result.user)
      
      return result
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  // Google sign in
  async function signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      
      // Authenticate with backend
      await authenticateWithBackend(result.user)
      
      return result
    } catch (error) {
      console.error('Google sign in error:', error)
      throw error
    }
  }

  // Authenticate with backend
  async function authenticateWithBackend(user) {
    try {
      const idToken = await user.getIdToken()
      const response = await apiService.verifyFirebaseToken(idToken)
      
      if (response.success) {
        setBackendUser(response.user)
        // Store tokens in localStorage for API requests
        localStorage.setItem('access_token', response.access_token)
        localStorage.setItem('refresh_token', response.refresh_token)
        localStorage.setItem('session_token', response.session_token)
      }
    } catch (error) {
      console.error('Backend authentication error:', error)
      // Don't throw error - allow user to continue with Firebase auth only
    }
  }

  // Logout function
  async function logout() {
    try {
      const sessionToken = localStorage.getItem('session_token')
      
      // Logout from backend first
      if (sessionToken) {
        try {
          await apiService.logout(sessionToken)
        } catch (error) {
          console.error('Backend logout error:', error)
        }
      }
      
      // Clear local storage
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('session_token')
      
      // Clear backend user state
      setBackendUser(null)
      
      // Logout from Firebase
      return signOut(auth)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      
      if (user) {
        // Authenticate with backend when user signs in
        await authenticateWithBackend(user)
      } else {
        // Clear backend user when user signs out
        setBackendUser(null)
      }
      
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    backendUser,
    signup,
    login,
    logout,
    signInWithGoogle,
    authenticateWithBackend
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}