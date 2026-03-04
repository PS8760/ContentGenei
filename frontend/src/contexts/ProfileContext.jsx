import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import apiService from '../services/api'

const ProfileContext = createContext()

export function useProfile() {
  return useContext(ProfileContext)
}

export function ProfileProvider({ children }) {
  const { currentUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) {
        setProfile(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await apiService.getProfile()
        
        if (response.success) {
          setProfile(response.profile)
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [currentUser])

  const updateProfile = async (profileData) => {
    try {
      const response = await apiService.updateProfile(profileData)
      
      if (response.success) {
        setProfile(response.profile)
        return { success: true, profile: response.profile }
      }
      return { success: false }
    } catch (error) {
      console.error('Failed to update profile:', error)
      return { success: false, error }
    }
  }

  const refreshProfile = async () => {
    if (!currentUser) return

    try {
      const response = await apiService.getProfile()
      
      if (response.success) {
        setProfile(response.profile)
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error)
    }
  }

  const value = {
    profile,
    loading,
    updateProfile,
    refreshProfile
  }

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  )
}
