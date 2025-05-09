'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import LoginPopup from '../components/LoginPopup'
import { supabase } from '../../lib/supabaseClient'
import { Session, User } from '@supabase/supabase-js'

interface UserProfile {
  id: string;
  full_name?: string;
  display_name?: string;
  profile_picture_url?: string;
  email?: string;
}

interface AuthContextType {
  isLoginPopupOpen: boolean
  openLoginPopup: () => void
  closeLoginPopup: () => void
  session: Session | null
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  refreshProfile: () => Promise<void>
  isSupabaseAvailable: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSupabaseAvailable, setIsSupabaseAvailable] = useState(true)

  // Function to fetch the user's profile data
  const fetchUserProfile = async (userId: string) => {
    if (!isSupabaseAvailable) return null;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }
      
      return data as UserProfile
    } catch (error) {
      console.error('Unexpected error fetching profile:', error)
      return null
    }
  }

  // Function to refresh the profile (can be called after profile updates)
  const refreshProfile = async () => {
    if (!isSupabaseAvailable) return;
    
    if (user?.id) {
      const userProfile = await fetchUserProfile(user.id)
      if (userProfile) {
        // Use email from profile if available, fall back to auth.user email
        setProfile({
          ...userProfile,
          email: userProfile.email || user.email
        })
      }
    }
  }

  useEffect(() => {
    // Check for existing session on component mount
    const checkSession = async () => {
      try {
        setIsLoading(true)
        
        // Verify if Supabase is available by checking if auth methods exist
        if (!supabase.auth || typeof supabase.auth.getSession !== 'function') {
          console.warn('Supabase client is not properly initialized')
          setIsSupabaseAvailable(false)
          setIsLoading(false)
          return;
        }
        
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error fetching session:', error)
          setIsSupabaseAvailable(false)
          setIsLoading(false)
          return;
        }
        
        setSession(data.session)
        const currentUser = data.session?.user || null
        setUser(currentUser)

        // Fetch user profile if user is logged in
        if (currentUser?.id) {
          const userProfile = await fetchUserProfile(currentUser.id)
          if (userProfile) {
            setProfile({
              ...userProfile,
              // Use email from profile if available, fall back to auth.user email
              email: userProfile.email || currentUser.email
            })
          }
        }

        // Listen for auth state changes if Supabase is available
        if (typeof supabase.auth.onAuthStateChange === 'function') {
          const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
              setSession(newSession)
              const newUser = newSession?.user || null
              setUser(newUser)
              
              // Update profile when auth state changes
              if (newUser?.id) {
                const userProfile = await fetchUserProfile(newUser.id)
                if (userProfile) {
                  setProfile({
                    ...userProfile,
                    email: userProfile.email || newUser.email
                  })
                } else {
                  setProfile(null)
                }
              } else {
                setProfile(null)
              }
            }
          )
          
          // Clean up the subscription
          return () => {
            if (authListener && authListener.subscription && typeof authListener.subscription.unsubscribe === 'function') {
              authListener.subscription.unsubscribe()
            }
          }
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching auth session:', error)
        setIsSupabaseAvailable(false)
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const openLoginPopup = () => setIsLoginPopupOpen(true)
  const closeLoginPopup = () => setIsLoginPopupOpen(false)

  return (
    <AuthContext.Provider value={{ 
      isLoginPopupOpen, 
      openLoginPopup, 
      closeLoginPopup,
      session,
      user,
      profile,
      isLoading,
      refreshProfile,
      isSupabaseAvailable
    }}>
      {children}
      {isSupabaseAvailable && <LoginPopup isOpen={isLoginPopupOpen} onClose={closeLoginPopup} />}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 